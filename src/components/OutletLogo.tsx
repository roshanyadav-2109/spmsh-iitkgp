import Image from "next/image";
import { cn } from "@/lib/cn";
import { OUTLET_LOGOS } from "@/lib/press";

/** A newspaper's own logo, or its name when no logo file is held. */
export function OutletLogo({
  outlet,
  className,
}: {
  outlet: string;
  className?: string;
}) {
  const logo = OUTLET_LOGOS[outlet];
  if (!logo) {
    return <span className={cn("font-semibold text-ink", className)}>{outlet}</span>;
  }
  return (
    <Image
      src={logo.src}
      alt={outlet}
      width={logo.width}
      height={logo.height}
      sizes="200px"
      className={cn(
        "h-7 w-auto max-w-full object-contain",
        className,
        /* A square mark reads small beside a wide wordmark at the same height. */
        logo.width / logo.height < 2 && "origin-left scale-[1.6]",
      )}
    />
  );
}
