// Single source of truth for price display. The whole app renders prices as
// "1299 TND" — no €, $, or any other symbol should appear anywhere.
export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  return `${new Intl.NumberFormat("fr-TN").format(rounded)} TND`;
}
