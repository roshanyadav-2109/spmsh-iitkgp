import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Manage Cookies",
  description: "What this website stores in your browser, and how to remove it.",
  alternates: { canonical: "/cookies" },
};

export default function Page() {
  return (
    <PolicyPage
      title="Manage Cookies"
      intro="What this website stores in your browser, and how to remove it."
    >
      <PolicySection heading="There is nothing to manage">
        <p>
          This site sets no advertising cookies, no analytics cookies and no tracking
          cookies. There is no consent banner because there is nothing to consent to.
        </p>
      </PolicySection>

      <PolicySection heading="What is set">
        <p>
          Signing in to the staff portal sets a session cookie, which is what keeps a
          member of staff signed in while they work. It is set only after somebody signs
          in, and it is removed when they sign out. If you are a patient using this
          site, nothing at all is set.
        </p>
      </PolicySection>

      <PolicySection heading="Removing it">
        <p>
          Signing out removes the session. You can also clear cookies for this site from
          your browser&rsquo;s settings at any time; nothing on the public side of the
          site depends on them, so clearing them will not lose you anything. A booking
          is not held in your browser &mdash; it is found again with the reference on
          your slip and the mobile number it was booked with, from{" "}
          <Link href="/appointment/status">Check a booking</Link>.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
