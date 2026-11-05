import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Digital Accessibility Statement",
  description:
    "What this website has been built to meet, what is known not to meet it, and how to report a barrier.",
  alternates: { canonical: "/accessibility" },
};

export default function Page() {
  return (
    <PolicyPage
      title="Digital Accessibility Statement"
      intro="What this site has been built to meet, and what is known still to fall short."
    >
      <PolicySection heading="The standard">
        <p>
          This site is built to WCAG 2.2 Level AA. Body text is set at a contrast ratio
          of at least 4.5:1 and large text and meaningful graphics at least 3:1; every
          check is mechanical and runs on each build, so a colour that fails cannot
          reach the site.
        </p>
      </PolicySection>

      <PolicySection heading="What that means in practice">
        <p>
          Every page can be used by keyboard alone, and the focus ring is never removed
          from a control. Filtering and search work with JavaScript switched off, so the
          departments and doctors indexes are usable on a slow or restricted connection.
          Tap targets are at least 24 by 24 pixels. Photographs carry descriptions, and
          decorative marks are hidden from screen readers rather than announced as
          noise.
        </p>
      </PolicySection>

      <PolicySection heading="Known gaps">
        <p>
          The notices strip and the consultants band move on their own and have no pause
          control. Both stop when hovered or focused, and both respect a reduced-motion
          setting in your operating system, but WCAG 2.2.2 asks for a control and there
          is not one. This is recorded in the code as a known gap rather than left
          unsaid.
        </p>
        <p>
          Doctor photographs are missing for most consultants, so their portraits are
          shown as initials. That is a content gap rather than an accessibility failure,
          but it is worth knowing what those letters are.
        </p>
      </PolicySection>

      <PolicySection heading="Reporting a barrier">
        <p>
          If something on this site stops you doing what you came to do, telephone the
          hospital office or write to the address on the{" "}
          <Link href="/contact">information page</Link>. Booking can also be done at the
          outpatient counter on the day, without using this site at all.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
