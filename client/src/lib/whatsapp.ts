import { OFFICIAL_BRAND_NAME, type Product } from "./types";

export interface ProductEnquiryOptions {
  businessName?: string | null;
  productUrl?: string | null;
  size?: string;
  colour?: string;
  quantity: number;
}

export function normalizeWhatsAppNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || !/^[+\d\s().-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (/^0\d{10}$/.test(digits)) return `234${digits.slice(1)}`;
  if (/^234\d{10}$/.test(digits)) return digits;
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return digits;
}

function validProductUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!(url.protocol === "https:" || url.protocol === "http:") || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function waUrl(number: string | null | undefined, message: string): string | null {
  const digits = normalizeWhatsAppNumber(number);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}

export function buildProductEnquiryMessage(product: Product, options: ProductEnquiryOptions): string {
  const businessName = options.businessName?.trim() || OFFICIAL_BRAND_NAME;
  const lines = [`Hello ${businessName}, I would like to enquire about ${product.name}.`];
  if (options.size && product.sizes.includes(options.size)) lines.push(`Size: ${options.size}`);
  if (options.colour && product.colours.includes(options.colour)) lines.push(`Colour: ${options.colour}`);
  const productUrl = validProductUrl(options.productUrl);
  if (productUrl) lines.push(`Product URL: ${productUrl}`);
  if (options.quantity > 1) lines.push(`Quantity: ${Math.min(99, Math.floor(options.quantity))}`);
  lines.push("Please provide availability and ordering details.", "Thank you.");
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

export function buildUnavailableEnquiryUrl(
  number: string | null | undefined,
  product: Product,
  businessName?: string | null,
  productUrl?: string | null,
): string | null {
  const brand = businessName?.trim() || OFFICIAL_BRAND_NAME;
  const lines = [`Hello ${brand}, I have a question about ${product.name}.`, "", `Product: ${product.name}`];
  const safeUrl = validProductUrl(productUrl);
  if (safeUrl) lines.push(`Product URL: ${safeUrl}`);
  lines.push("I understand this item is currently marked unavailable. Could you let me know whether a similar piece may be possible?", "", "Thank you.");
  return waUrl(number, lines.join("\n"));
}

export function buildCustomOrderUrl(
  number: string | null | undefined,
  details: { style?: string; colour?: string; additional?: string },
  businessName?: string | null,
): string | null {
  const brand = businessName?.trim() || OFFICIAL_BRAND_NAME;
  const lines = [`Hello ${brand}, I would like to enquire about a custom-made modest outfit.`, ""];
  if (details.style?.trim()) lines.push(`Preferred style: ${details.style.trim()}`);
  if (details.colour?.trim()) lines.push(`Preferred colour: ${details.colour.trim()}`);
  if (details.additional?.trim()) lines.push(`Additional details: ${details.additional.trim()}`);
  lines.push("", "Please let me know how we can discuss the design, measurements, pricing, and delivery.", "", "Thank you.");
  return waUrl(number, lines.join("\n"));
}
