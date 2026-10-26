import type { Product } from "./types";

export interface ProductEnquiryOptions {
  size?: string;
  colour?: string;
  quantity: number;
}

export function normalizeWhatsAppNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || !/^[+\d\s().-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return digits;
}

function waUrl(number: string | null | undefined, message: string): string | null {
  const digits = normalizeWhatsAppNumber(number);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}

export function buildProductEnquiryMessage(product: Product, options: ProductEnquiryOptions): string {
  const lines = [
    `Hello, I am interested in ordering ${product.name}.`,
    "",
    `Product: ${product.name}`,
  ];
  if (options.colour && product.colours.includes(options.colour)) lines.push(`Colour: ${options.colour}`);
  if (options.size && product.sizes.includes(options.size)) lines.push(`Size: ${options.size}`);
  lines.push(`Quantity: ${Math.max(1, Math.floor(options.quantity))}`);
  if (product.price_minor === null) lines.push("Price: Please confirm the current price.");
  else lines.push(`Price: ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(product.price_minor / 100)}`);
  lines.push("", "Please confirm availability, final price, and delivery options.", "", "Thank you.");
  return lines.join("\n");
}

export function buildProductEnquiryUrl(
  number: string | null | undefined,
  product: Product,
  options: ProductEnquiryOptions,
): string | null {
  if (!product.is_available || options.quantity < 1) return null;
  if (options.size && !product.sizes.includes(options.size)) return null;
  if (options.colour && !product.colours.includes(options.colour)) return null;
  return waUrl(number, buildProductEnquiryMessage(product, options));
}

export function buildUnavailableEnquiryUrl(number: string | null | undefined, product: Product): string | null {
  return waUrl(number, [
    `Hello, I have a question about ${product.name}.`,
    "",
    `Product: ${product.name}`,
    "I understand this item is currently marked unavailable. Could you let me know whether a similar piece may be possible?",
    "",
    "Thank you.",
  ].join("\n"));
}

export function buildCustomOrderUrl(
  number: string | null | undefined,
  details: { style?: string; colour?: string; additional?: string },
): string | null {
  const lines = ["Hello, I would like to enquire about a custom-made modest outfit.", ""];
  if (details.style?.trim()) lines.push(`Preferred style: ${details.style.trim()}`);
  if (details.colour?.trim()) lines.push(`Preferred colour: ${details.colour.trim()}`);
  if (details.additional?.trim()) lines.push(`Additional details: ${details.additional.trim()}`);
  lines.push("", "Please let me know how we can discuss the design, measurements, pricing, and delivery.", "", "Thank you.");
  return waUrl(number, lines.join("\n"));
}
