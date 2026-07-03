export function formatNaira(priceCents: number): string {
  const naira = priceCents / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira);
}

export function formatQuantity(quantity: number): string {
  const whole = Math.floor(quantity);
  const hasHalf = quantity - whole === 0.5;
  if (!hasHalf) return String(quantity);
  return whole === 0 ? "½" : `${whole}½`;
}

export function parseNairaInput(value: string): number | null {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const naira = Number.parseFloat(cleaned);
  if (Number.isNaN(naira) || naira < 0) return null;
  return Math.round(naira * 100);
}
