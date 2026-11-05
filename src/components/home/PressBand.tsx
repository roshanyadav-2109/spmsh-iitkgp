import { SectionHead } from "@/components/ui/Go";
import { PressCard } from "@/components/PressCard";
import { getT } from "@/lib/i18n/server";
import { PRESS } from "@/lib/press";

/** The three latest newspaper articles, linking on to the newsroom. */
export async function PressBand() {
  const t = await getT();
  return (
    <section aria-labelledby="in-the-news" className="py-10 lg:py-12">
      <div className="page-width">
        <SectionHead
          id="in-the-news"
          title={t.home.inTheNews}
          link={{ href: "/newsroom", label: t.home.newsroom }}
        />
        <ul className="mt-6 grid gap-4 md:grid-cols-3 lg:gap-5">
          {PRESS.slice(0, 3).map((item) => (
            <li key={item.href}>
              <PressCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
