import { isPlaceholder, placeholderNote } from "@/lib/settings";
import { Provide } from "@/components/Provide";

/**
 * Renders a site setting. If the hospital has not supplied it yet, the stored
 * value is still a PROVIDE token, and it is shown as one rather than printed
 * as though it were a real telephone number.
 */
export function SettingValue({
  value,
  tone = "onLight",
  fallbackNote,
}: {
  value: string | undefined;
  tone?: "onLight" | "onDark";
  fallbackNote?: string;
}) {
  if (isPlaceholder(value)) {
    return <Provide note={fallbackNote ?? placeholderNote(value)} tone={tone} />;
  }
  return <>{value}</>;
}

/**
 * A telephone number, linked, unless it is still a placeholder.
 *
 * `className` exists so a caller can give the anchor a real target size. In
 * the footer these numbers were 18px tall — WCAG 2.2 SC 2.5.8 asks 24x24 — and
 * they are the links a patient reaches for one-handed, where a mis-tap dials
 * the wrong desk. Padding has to sit on the anchor itself: putting it on the
 * surrounding <dd> grows the row and leaves the target exactly as small.
 */
export function SettingPhone({
  value,
  tone = "onLight",
  fallbackNote,
  className,
}: {
  value: string | undefined;
  tone?: "onLight" | "onDark";
  fallbackNote?: string;
  className?: string;
}) {
  if (isPlaceholder(value)) {
    return <Provide note={fallbackNote ?? placeholderNote(value)} tone={tone} />;
  }
  return (
    <a href={`tel:${(value ?? "").replace(/[^\d+]/g, "")}`} className={className}>
      {value}
    </a>
  );
}
