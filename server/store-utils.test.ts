import { describe, expect, it } from "vitest";
import { formatNaira, parseOptionList, parseOptionalNaira, slugify } from "../client/src/lib/format";
import { buildCustomOrderUrl, buildProductEnquiryMessage, buildProductEnquiryUrl, normalizeWhatsAppNumber } from "../client/src/lib/whatsapp";
import type { Product } from "../client/src/lib/types";

const product: Product = {
  id: "p1", name: "Sample Abaya", slug: "sample-abaya", description: null, price_minor: null, currency: "NGN",
  category_id: "c1", category: { id: "c1", name: "Abayas", slug: "abayas" }, main_image_path: null,
  sizes: ["S", "M"], colours: ["Mocha", "Ivory"], fabric: null, care_instructions: null,
  is_available: true, is_featured: false, is_new_arrival: false, status: "published", images: [],
  created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z",
};

describe("store formatting helpers", () => {
  it("distinguishes an absent price from a valid zero price", () => {
    expect(parseOptionalNaira("")).toEqual({ minor: null, error: null });
    expect(parseOptionalNaira("0")).toEqual({ minor: 0, error: null });
    expect(parseOptionalNaira("1250.50")).toEqual({ minor: 125050, error: null });
    expect(parseOptionalNaira("-1").error).toBeTruthy();
    expect(parseOptionalNaira("12.999").error).toBeTruthy();
  });
  it("formats NGN and creates stable lowercase slugs", () => {
    expect(formatNaira(null)).toBe("Enquire for price");
    expect(formatNaira(0)).toContain("0");
    expect(slugify("  Khimar & Gown  ")).toBe("khimar-gown");
  });
  it("deduplicates optional product options", () => {
    expect(parseOptionList("S, M, s, One size,,")).toEqual(["S", "M", "One size"]);
  });
});

describe("WhatsApp enquiry helpers", () => {
  it("normalizes an international phone number and rejects local/invalid values", () => {
    expect(normalizeWhatsAppNumber("+234 801-234-5678")).toBe("2348012345678");
    expect(normalizeWhatsAppNumber("08012345678")).toBe(null);
    expect(normalizeWhatsAppNumber("not a number")).toBe(null);
  });
  it("includes only offered product options and accurately states quantity/pricing", () => {
    const message = buildProductEnquiryMessage(product, { size: "M", colour: "Mocha", quantity: 2 });
    expect(message).toContain("Hello, I am interested in ordering Sample Abaya.");
    expect(message).toContain("Colour: Mocha");
    expect(message).toContain("Size: M");
    expect(message).toContain("Quantity: 2");
    expect(message).toContain("Price: Please confirm the current price.");
    const pricedMessage = buildProductEnquiryMessage({ ...product, price_minor: 125050 }, { size: "M", colour: "Mocha", quantity: 1 });
    expect(pricedMessage).toContain(`Price: ${formatNaira(125050)}`);
    expect(buildProductEnquiryUrl("+234 801-234-5678", product, { size: "XL", quantity: 1 })).toBe(null);
    expect(buildProductEnquiryUrl("+234 801-234-5678", product, { size: "M", quantity: 1 })).toContain("https://wa.me/2348012345678?text=");
  });
  it("keeps custom-order fields optional and encodes them into the user-initiated URL", () => {
    const url = buildCustomOrderUrl("2348012345678", { style: "Soft drape", colour: "Sand" });
    expect(url).toContain("Preferred%20style%3A%20Soft%20drape");
    expect(url).toContain("Preferred%20colour%3A%20Sand");
    expect(url).not.toContain("Additional%20details");
  });
});
