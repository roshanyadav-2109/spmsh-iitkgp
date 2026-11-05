import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { PersonCard, type Person } from "@/components/info/PersonCard";
import { SettingPhone } from "@/components/SettingValue";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Administration",
  description:
    "Administration and staff directory for Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur.",
  alternates: { canonical: "/administration" },
};

export default async function AdministrationPage() {
  const supabase = createPublicClient();
  const [{ data }, settings] = await Promise.all([
    supabase
      .from("administration")
      .select("id, full_name, designation, qualifications, email, phone")
      .order("display_order")
      .order("full_name"),
    getSettings(),
  ]);
  const people = (data ?? []) as Person[];

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }]}
        title="Administration"
        intro={
          <>
            Appointments and general queries:{" "}
            <span className="tnum text-ink">
              <SettingPhone
                value={settings.reception_phone}
                fallbackNote="OPD counter number"
              />
            </span>
          </>
        }
      />

      {people.length === 0 ? (
        <p className="mt-12 text-16 text-muted">No administration staff listed yet.</p>
      ) : (
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <li key={person.id}>
              <PersonCard person={person} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
