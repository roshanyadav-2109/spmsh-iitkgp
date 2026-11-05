import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";
import { formatDate, formatTime, todayIST, weekdayName } from "@/lib/dates";
import { SITE } from "@/lib/site";
import "@/styles/print-list.css";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ date?: string; doctor?: string }> };

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  arrived: "Arrived",
  attended: "Attended",
  no_show: "Did not come",
  cancelled: "Cancelled",
};

/**
 * The daily list, one table per doctor, laid out for A4. Cancelled rows are
 * kept and struck through rather than dropped, so the printed sheet matches
 * the board on screen and a queried token can be accounted for.
 */
export default async function PrintDayPage({ searchParams }: Props) {
  await requireDesk();
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? (params.date as string)
    : todayIST();

  const supabase = await createServerSupabase();

  let query = supabase
    .from("appointments")
    .select(
      "id, token_label, is_overflow, token_no, slot_time, patient_name, patient_age, patient_sex, patient_phone, patient_type, patient_id_no, status, doctor_id, doctors(full_name, room_no)",
    )
    .eq("on_date", date)
    .order("is_overflow")
    .order("token_no");

  if (params.doctor) query = query.eq("doctor_id", params.doctor);

  const { data } = await query;

  const byDoctor = new Map<
    string,
    { name: string; room: string | null; rows: NonNullable<typeof data> }
  >();
  for (const row of data ?? []) {
    const key = row.doctor_id;
    const entry = byDoctor.get(key) ?? {
      name: row.doctors?.full_name ?? "",
      room: row.doctors?.room_no ?? null,
      rows: [],
    };
    entry.rows.push(row);
    byDoctor.set(key, entry);
  }

  const groups = [...byDoctor.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page-width py-8">
      <div data-print="hide" className="mb-8 flex flex-wrap items-center gap-4">
        <Link href={`/portal/reception?date=${date}`} className="text-14">
          Back to the board
        </Link>
        <span className="text-14 text-muted">
          Use the browser print command. A4, black and white.
        </span>
      </div>

      <div className="print-list">
        <header className="border-b border-navy pb-4">
          <p className="text-16 font-medium">{SITE.name}</p>
          <p className="eyebrow mt-1 text-ink">{SITE.institute}</p>
          <p className="tnum mt-2 text-15">
            Appointment list — {formatDate(date)}, {weekdayName(date)}
          </p>
        </header>

        {groups.length === 0 ? (
          <p className="mt-8 text-15">No appointments on this date.</p>
        ) : (
          groups.map((group) => (
            <section key={group.name} className="mt-8">
              <h2 className="text-18">
                {group.name}
                {group.room ? ` — Room ${group.room}` : ""}
                <span className="tnum text-muted">
                  {" "}
                  ({group.rows.filter((r) => r.status !== "cancelled").length} booked)
                </span>
              </h2>
              <table className="mt-3 w-full text-14">
                <caption className="sr-only">
                  Appointments for {group.name} on {formatDate(date)}
                </caption>
                <thead>
                  <tr>
                    {[
                      "Token",
                      "Time",
                      "Patient",
                      "Age/Sex",
                      "Type",
                      "ID",
                      "Status",
                      "Seen",
                    ].map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className="border-b border-navy px-2 py-1 text-left text-13 font-medium"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        row.status === "cancelled" ? "line-through" : undefined
                      }
                    >
                      <td className="tnum border-b border-line px-2 py-1">
                        {row.token_label}
                      </td>
                      <td className="tnum border-b border-line px-2 py-1">
                        {formatTime(row.slot_time)}
                      </td>
                      <td className="border-b border-line px-2 py-1">
                        {row.patient_name}
                      </td>
                      <td className="tnum border-b border-line px-2 py-1">
                        {row.patient_age}/{row.patient_sex.charAt(0)}
                      </td>
                      <td className="border-b border-line px-2 py-1">
                        {row.patient_type}
                      </td>
                      <td className="tnum border-b border-line px-2 py-1">
                        {row.patient_id_no ?? ""}
                      </td>
                      <td className="border-b border-line px-2 py-1">
                        {STATUS_LABEL[row.status] ?? row.status}
                      </td>
                      {/* A blank column, because the sheet gets ticked by hand. */}
                      <td className="border-b border-line px-2 py-1">
                        &nbsp;&nbsp;&nbsp;
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}

        <p className="mt-8 text-13 text-muted">
          Patient telephone numbers are deliberately not printed on this sheet. Use the
          board on screen, or the reports export, when a patient has to be telephoned.
        </p>
      </div>
    </div>
  );
}
