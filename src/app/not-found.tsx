import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import { getSettings } from "@/lib/settings";
import { StateImage } from "@/components/ui/StateImage";

export default async function NotFound() {
  const settings = await getSettings();

  return (
    <>
      <SiteHeader
        emergencyPhone={settings.emergency_phone}
        ambulancePhone={settings.ambulance_phone}
        opdPhone={settings.reception_phone}
      />
      <main id="main" className="flex-1">
        <div className="page-width py-20 lg:py-28">
          <StateImage name="not-found" className="w-56 sm:w-72" />
          <h1 className="mt-6">We couldn&rsquo;t find this page</h1>
          <p className="mt-4 max-w-xl text-16 text-muted">
            The link may be old or typed wrong. You can still find a doctor or book a
            visit from here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/" variant="primary">
              Go to home
            </ButtonLink>
            <ButtonLink href="/doctors">Find a doctor</ButtonLink>
            <ButtonLink href="/book">Book a visit</ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
