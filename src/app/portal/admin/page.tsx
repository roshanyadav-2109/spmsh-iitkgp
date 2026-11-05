import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireTech } from "@/lib/auth";
import { formatDateTime, todayIST } from "@/lib/dates";
import { isPlaceholder } from "@/lib/settings";
import { actionLabel } from "@/lib/auditLabels";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireTech();
  const supabase = await createServerSupabase();
  const today = todayIST();

  const [staffRows, todayCount, settings, recentAudit, pendingLeave] =
    await Promise.all([
      supabase.from("staff_profiles").select("id, role, is_active"),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("on_date", today)
        .neq("status", "cancelled"),
      supabase.from("site_settings").select("key, value, label, is_booking_policy"),
      supabase
        .from("audit_log")
        .select("id, action, entity, created_at, staff_profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("schedule_exceptions")
        .select("id", { count: "exact", head: true })
        .is("approved_at", null)
        .gte("on_date", today),
    ]);

  const active = (staffRows.data ?? []).filter((row) => row.is_active);
  const techCount = active.filter((row) => row.role === "tech").length;
  const unfilled = (settings.data ?? []).filter((row) => isPlaceholder(row.value));

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Overview</h1>

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Appointments today", value: todayCount.count ?? 0 },
          { label: "Active staff accounts", value: active.length },
          { label: "Leave requests waiting", value: pendingLeave.count ?? 0 },
          { label: "Settings not yet filled in", value: unfilled.length },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-line bg-white px-5 py-4"
          >
            <dt className="text-13 text-muted">{card.label}</dt>
            <dd className="tnum mt-1 text-32 font-medium leading-none tracking-tight text-ink">
              {card.value}
            </dd>
          </div>
        ))}
      </dl>

      {unfilled.length > 0 ? (
        <section aria-labelledby="unfilled" className="mt-12">
          <h2 id="unfilled" className="text-21 tracking-tight">
            Content the hospital has not supplied
          </h2>
          <p className="mt-2 max-w-prose text-15 text-muted">
            These show as a blank box on the public site until they are filled in.{" "}
            <Link href="/portal/admin/settings">Site settings</Link>.
          </p>
          <ul className="mt-4 grid gap-3">
            {unfilled.map((row) => (
              <li key={row.key} className="text-14">
                {row.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {techCount > 1 ? (
        <p className="mt-12 border-l-2 border-navy pl-4 text-14">
          {techCount} technical support accounts are active. Each can create and remove
          staff and read the audit log.
        </p>
      ) : null}

      <section aria-labelledby="recent" className="mt-12">
        <h2 id="recent" className="text-21 tracking-tight">
          Recent activity
        </h2>
        <ul className="mt-4 grid gap-3">
          {(recentAudit.data ?? []).map((row) => (
            <li key={row.id} className="flex flex-wrap gap-3 text-14">
              <span className="tnum text-muted">{formatDateTime(row.created_at)}</span>
              {/* The stored action is a dotted code. The audit page has always
                  put it through actionLabel; this list was printing it raw, so
                  the first screen a technical support user sees on signing in
                  read "appointment.book.reception". */}
              <span>{actionLabel(row.action)}</span>
              <span className="text-muted">
                {row.staff_profiles?.full_name ?? "Public"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-14">
          <Link href="/portal/admin/audit">Full audit log</Link>
        </p>
      </section>
    </div>
  );
}
