import type { Metadata } from "next";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Advertising & Sponsorship Policy",
  description: "This website carries no advertising and no sponsored content.",
  alternates: { canonical: "/advertising-policy" },
};

export default function Page() {
  return (
    <PolicyPage
      title="Advertising & Sponsorship Policy"
      intro="This website carries no advertising and no sponsored content."
    >
      <PolicySection heading="No advertising">
        <p>
          There is no advertising anywhere on this site. No banner, no promotional
          placement, no sponsored listing, and no advertising network of any kind.
        </p>
      </PolicySection>

      <PolicySection heading="No sponsored content">
        <p>
          Nothing published here has been paid for by anyone. Departments, consultants
          and services are listed because the hospital runs them, and their order is set
          by the hospital desk rather than bought.
        </p>
      </PolicySection>

      <PolicySection heading="No third-party tracking">
        <p>
          There is no analytics script, no advertising pixel and no social media tracker
          on this site. Nothing you do here is reported to a third party for advertising
          purposes.
        </p>
      </PolicySection>

      <PolicySection heading="Named third parties">
        <p>
          Two outside services are used and both are named plainly. The information page
          embeds a map, which is served by Google and which loads only on that page.
          Research citations on the department pages link out to publishers through
          doi.org. Neither is an advertiser and neither pays for placement.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
