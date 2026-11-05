import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection, PendingNote } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Notice of Privacy Practices",
  description:
    "How medical information about you may be used and disclosed at Dr. Syama Prasad Mookerjee Superspeciality Hospital.",
  alternates: { canonical: "/privacy-practices" },
};

export default function Page() {
  return (
    <PolicyPage
      title="Notice of Privacy Practices"
      intro="How medical information about you may be used, and how you can get access to it."
    >
      <PolicySection heading="What this notice covers">
        <p>
          A Notice of Privacy Practices covers your clinical record &mdash; what the
          hospital records about your health, your treatment and your payment, and the
          circumstances in which it may be used or disclosed. It covers the hospital as
          a whole, not only this website.
        </p>
      </PolicySection>

      <PolicySection heading="What this website holds">
        <p>
          This website holds appointment bookings and nothing clinical. It has no access
          to case notes, test results, prescriptions or images. What it stores, and who
          can see it, is set out in the <Link href="/privacy">privacy policy</Link>.
        </p>
      </PolicySection>

      <PendingNote>
        The hospital&rsquo;s formal Notice of Privacy Practices is a document the
        hospital issues, not something this website can state on its behalf. It is being
        prepared. Until it is published here, ask at the hospital office &mdash; the
        number is on the <Link href="/contact">information page</Link>.
      </PendingNote>
    </PolicyPage>
  );
}
