import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection, PendingNote } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms on which this website and its appointment booking may be used.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      intro="The terms on which this website and its appointment booking may be used."
    >
      <PolicySection heading="What this website is">
        <p>
          This site publishes information about the hospital and lets you request an
          outpatient appointment. It is run by the hospital, which is established under
          SPMIMSRF, a Section 8 company owned by the Indian Institute of Technology
          Kharagpur.
        </p>
      </PolicySection>

      <PolicySection heading="It is not medical advice">
        <p>
          The department pages describe what a speciality treats in general terms. They
          are written to help you find the right clinic, not to diagnose you, and they
          are no substitute for seeing a doctor.
        </p>
        <p>
          Do not use this site in an emergency. Telephone the emergency number or come
          directly to the emergency department &mdash; see{" "}
          <Link href="/emergency">emergency information</Link>.
        </p>
      </PolicySection>

      <PolicySection heading="Bookings">
        <p>
          A booking gives you a token number for a named consultant on a named day. It
          is a place in that day&rsquo;s queue, not an appointment at an exact minute,
          and it does not guarantee that the clinic will run: clinics are occasionally
          cancelled or changed, and where that happens it is posted under{" "}
          <Link href="/announcements">announcements</Link>.
        </p>
        <p>
          Please cancel a booking you cannot keep. Tokens are limited and an uncancelled
          one is a place nobody else could take.
        </p>
      </PolicySection>

      <PolicySection heading="Accuracy">
        <p>
          Timings, consultants and clinic days are kept current by the hospital desk.
          Where a detail has not been supplied it is shown as missing rather than
          guessed at.
        </p>
      </PolicySection>

      <PendingNote>
        Anything with legal effect &mdash; liability, jurisdiction, the hospital&rsquo;s
        obligations to a patient &mdash; is for the hospital and its advisers to settle,
        not for this website to assert. The formal terms are being prepared.
      </PendingNote>
    </PolicyPage>
  );
}
