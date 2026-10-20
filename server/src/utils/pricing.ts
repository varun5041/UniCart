/**
 * Computes the selling price (integer paise) from an MRP and a whole-number discount percentage.
 */
export function computeSalePrice(mrpPaise: number, discountPercent: number): number {
  return Math.round((mrpPaise * (100 - discountPercent)) / 100);
}

/**
 * Escapes user input so it can be embedded in a RegExp as a literal (prevents regex injection / ReDoS).
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
