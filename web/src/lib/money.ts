export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/** 10% service fee, same rule as the API. */
export const SERVICE_FEE_PERCENT = 10;

export function feeFromSubtotal(subtotalCents: number): number {
  return Math.round((subtotalCents * SERVICE_FEE_PERCENT) / 100);
}

/**
 * Discount codes, same as the API. Used only to preview the discount and to
 * reject typos early; the API validates the code again and has the last word.
 */
export const DISCOUNT_CODES: Readonly<Record<string, number>> = {
  SAVE10: 10,
};

/** Trim + uppercase; returns null if the code is empty or unknown. */
export function normalizeDiscountCode(code: string): string | null {
  const normalized = code.trim().toUpperCase();
  return normalized in DISCOUNT_CODES ? normalized : null;
}

export function discountFromSubtotal(
  subtotalCents: number,
  code: string | null,
): number {
  if (!code || !(code in DISCOUNT_CODES)) return 0;
  return Math.round((subtotalCents * DISCOUNT_CODES[code]) / 100);
}
