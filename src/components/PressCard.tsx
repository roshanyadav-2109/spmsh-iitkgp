import Image from "next/image";
import { OutletLogo } from "@/components/OutletLogo";
import { ExternalLinkIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { getLinkPreview } from "@/lib/linkPreview";
import type { PressItem } from "@/lib/press";

/**
 * A newspaper article as the newspaper presents it: the picture, title and
 * summary come from the article page's own link-preview tags, fetched from
 * the publisher; the headline is the paper's own, word for word. When the
 * publisher's page has no picture, the paper's name stands in its place.
 * The link opens the paper's own page in a new tab.
 */
export async function PressCard({
  item,
  large = false,
  className,
}: {
  item: PressItem;
  large?: boolean;
  className?: string;
}) {
  const preview = await getLinkPreview(item.href);
  const host = new URL(item.href).hostname.replace(/^www\./, "");

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group ui-transition flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white no-underline hover:border-ink",
        large && "md:grid md:grid-cols-2",
        className,
      )}
    >
      {preview?.image ? (
        <span
          className={cn(
            "relative block aspect-[1.91/1] w-full border-b border-line bg-white",
            large && "md:aspect-auto md:h-full md:min-h-72",
          )}
        >
          <Image
            src={preview.image}
            alt=""
            fill
            sizes={
              large
                ? "(max-width: 768px) 100vw, 50vw"
                : "(max-width: 768px) 100vw, 33vw"
            }
            className="object-cover"
          />
        </span>
      ) : (
        <span className="flex aspect-[1.91/1] w-full items-center justify-center border-b border-line bg-white px-8">
          <OutletLogo outlet={item.outlet} className="h-10" />
        </span>
      )}
      <span className={cn("flex flex-1 flex-col", large ? "p-6 sm:p-8" : "p-5")}>
        <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="flex items-center gap-2 text-13 text-body">
            <OutletLogo outlet={item.outlet} className="h-5" />
            {item.via ? <span>via {item.via}</span> : null}
          </span>
          <span className="tnum text-13 text-faint">{formatDate(item.date)}</span>
        </span>
        <span
          className={cn(
            "mt-3 font-medium text-ink",
            large
              ? "text-21 leading-[1.3] sm:text-26 lg:leading-[1.25]"
              : "line-clamp-3 text-16 leading-dense",
          )}
        >
          {item.headline}
        </span>
        {preview?.description ? (
          <span
            className={cn(
              "mt-2 text-14 text-body",
              large ? "line-clamp-4" : "line-clamp-2",
            )}
          >
            {preview.description}
          </span>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-14 text-faint">
          {host}
          <ExternalLinkIcon size={16} />
          <span className="sr-only">(opens in a new tab)</span>
        </span>
      </span>
    </a>
  );
}
