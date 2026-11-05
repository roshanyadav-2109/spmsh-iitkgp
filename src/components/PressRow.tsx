import Image from "next/image";
import { OutletLogo } from "@/components/OutletLogo";
import { ExternalLinkIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/dates";
import { getLinkPreview } from "@/lib/linkPreview";
import type { PressItem } from "@/lib/press";

/**
 * One article in the newsroom list: the paper's logo and date, its headline
 * word for word, and the summary and picture from the article page's own
 * link-preview tags. Opens the paper's page in a new tab.
 */
export async function PressRow({ item }: { item: PressItem }) {
  const preview = await getLinkPreview(item.href);
  const host = new URL(item.href).hostname.replace(/^www\./, "");

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group ui-transition grid gap-5 py-5 no-underline sm:grid-cols-[minmax(0,1fr)_12rem] sm:py-6"
    >
      <span className="flex min-w-0 flex-col">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <OutletLogo outlet={item.outlet} className="h-6" />
          <span className="tnum text-13 text-faint">
            {formatDate(item.date)}
            {item.via ? ` · via ${item.via}` : ""}
          </span>
        </span>
        <span className="mt-3 text-18 font-medium leading-[1.3] text-ink group-hover:underline">
          {item.headline}
        </span>
        {preview?.description ? (
          <span className="mt-2 line-clamp-2 text-15 text-body">
            {preview.description}
          </span>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1.5 text-14 text-faint">
          {host}
          <ExternalLinkIcon size={16} />
          <span className="sr-only">(opens in a new tab)</span>
        </span>
      </span>
      {preview?.image ? (
        <span className="relative hidden aspect-[1.91/1] overflow-hidden rounded-md border border-line bg-white sm:block">
          <Image
            src={preview.image}
            alt=""
            fill
            sizes="192px"
            className="object-cover"
          />
        </span>
      ) : null}
    </a>
  );
}
