import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LanguageBar } from "@/components/site/LanguageBar";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();

  return (
    <>
      <LanguageBar
        emergencyPhone={settings.emergency_phone}
        ambulancePhone={settings.ambulance_phone}
      />
      <SiteHeader
        emergencyPhone={settings.emergency_phone}
        ambulancePhone={settings.ambulance_phone}
        opdPhone={settings.reception_phone}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
