import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection, PendingNote } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What this website stores when you book an appointment, who can see it, and how long it is kept.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="What this website stores, who can see it, and what it is never used for."
    >
      <PolicySection heading="What is collected when you book">
        <p>
          Booking an appointment asks for the patient&rsquo;s name, age, sex, a mobile
          number, the patient type, and optionally a reason for the visit and a roll or
          employee number. Nothing else is asked for, and no account is created.
        </p>
        <p>
          The mobile number is what identifies the booking afterwards. It is needed
          together with the booking reference to look a booking up or to cancel it.
        </p>
      </PolicySection>

      <PolicySection heading="Who can see it">
        <p>Reception staff and the doctor being seen. That is the whole list.</p>
        <p>
          Patient details are never shown on any public page of this site, never appear
          in a web address, and are never returned by the availability lookup that draws
          the calendar. A booking you make is not visible to anybody else who visits
          this website.
        </p>
      </PolicySection>

      <PolicySection heading="What it is not used for">
        <p>
          There is no advertising on this site, no analytics or tracking script, and no
          third-party service that receives what you type. Your details are not sold,
          not shared outside the hospital, and not used to send you marketing.
        </p>
      </PolicySection>

      <PolicySection heading="Correcting or removing a booking">
        <p>
          You can cancel a booking yourself from{" "}
          <Link href="/appointment/status">Check a booking</Link>, using the reference
          on your slip and the mobile number it was booked with. To correct a detail, or
          to ask what is held about you, telephone the OPD counter or write to the
          hospital &mdash; the numbers and the address are on the{" "}
          <Link href="/contact">information page</Link>.
        </p>
      </PolicySection>

      <PendingNote>
        This describes what this website does, which is established from its own code.
        How long records are kept, and the hospital&rsquo;s obligations under the
        Digital Personal Data Protection Act 2023, are set by the hospital rather than
        by this site; the formal policy is being prepared and the desk can answer
        questions in the meantime.
      </PendingNote>
    </PolicyPage>
  );
}
