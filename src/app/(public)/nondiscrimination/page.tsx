import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection, PendingNote } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Notice of Nondiscrimination",
  description:
    "The hospital's position on nondiscrimination in access to care and to this website.",
  alternates: { canonical: "/nondiscrimination" },
};

export default function Page() {
  return (
    <PolicyPage
      title="Notice of Nondiscrimination"
      intro="Access to care, and to this website."
    >
      <PolicySection heading="This website">
        <p>
          Nothing on this site asks for or records caste, religion, language or any
          similar characteristic. Booking asks only for the details a clinic needs to
          see a patient: name, age, sex, a mobile number and the patient type. No
          booking is treated differently from any other, and tokens are issued in the
          order they are requested.
        </p>
      </PolicySection>

      <PolicySection heading="Language">
        <p>
          The hospital&rsquo;s name is set in Hindi as well as English, but the rest of
          this site is in English only today. If that is a barrier, telephone the OPD
          counter and staff can take a booking by telephone &mdash; the number is on the{" "}
          <Link href="/contact">information page</Link>, and booking at the counter on
          the day needs no website at all.
        </p>
      </PolicySection>

      <PendingNote>
        A notice of nondiscrimination is a commitment the hospital makes about the care
        it provides, and only the hospital can make it. This page states what the
        website does; the hospital&rsquo;s own notice is being prepared.
      </PendingNote>
    </PolicyPage>
  );
}
