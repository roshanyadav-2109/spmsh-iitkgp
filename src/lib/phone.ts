/** A PROVIDE token or an empty value is not a number to dial. */
export function realPhone(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed.startsWith("[[PROVIDE:")) return null;
  return trimmed;
}

/** The tel: href for a number written for people, e.g. "03222-215306". */
export const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
