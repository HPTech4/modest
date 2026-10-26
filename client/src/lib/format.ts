export function formatNaira(priceMinor: number | null | undefined): string {
  if (priceMinor === null || priceMinor === undefined) return "Enquire for price";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: priceMinor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(priceMinor / 100);
}

export function parseOptionalNaira(value: string): { minor: number | null; error: string | null } {
  const trimmed = value.trim();
  if (!trimmed) return { minor: null, error: null };
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return { minor: null, error: "Enter a valid NGN amount with up to two decimal places." };
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return { minor: null, error: "Price cannot be negative." };
  return { minor: Math.round(amount * 100), error: null };
}

export function nairaInputValue(priceMinor: number | null | undefined): string {
  return priceMinor === null || priceMinor === undefined ? "" : (priceMinor / 100).toFixed(2).replace(/\.00$/, "");
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseOptionList(value: string): string[] {
  const seen = new Set<string>();
  return value.split(",").map((item) => item.trim()).filter((item) => {
    const key = item.toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatUpdatedDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(date);
}
