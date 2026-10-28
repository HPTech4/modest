import { describe, expect, it } from "vitest";
import { formatNaira, parseOptionList, parseOptionalNaira, slugify } from "../client/src/lib/format";
import { buildCustomOrderUrl, buildProductEnquiryMessage, buildProductEnquiryUrl, normalizeWhatsAppNumber } from "../client/src/lib/whatsapp";
import type { Product } from "../client/src/lib/types";
import { isBrowserSafeSupabaseKey, isSafeSupabaseProjectUrl } from "../scripts/supabase-key-policy.mjs";
import { normalizePublicSiteOrigin } from "../scripts/site-origin-policy.mjs";

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
  it("normalizes the supplied Nigerian local number and valid international formats", () => {
    expect(normalizeWhatsAppNumber("+234 801-234-5678")).toBe("2348012345678");
    expect(normalizeWhatsAppNumber("09015790659")).toBe("2349015790659");
    expect(normalizeWhatsAppNumber("+234 901 579 0659")).toBe("2349015790659");
    expect(normalizeWhatsAppNumber("not a number")).toBe(null);
  });
  it("includes official business, only offered product options, quantity and the product URL", () => {
    const message = buildProductEnquiryMessage(product, { size: "M", colour: "Mocha", quantity: 2 });
    expect(message).toContain("Hello Mustaqeem Stitches and Collection, I would like to enquire about Sample Abaya.");
    expect(message).toContain("Colour: Mocha");
    expect(message).toContain("Size: M");
    expect(message).toContain("Quantity: 2");
    expect(message).toContain("Please provide availability and ordering details.");
    expect(message).not.toContain("Price:");
    const url = buildProductEnquiryUrl("09015790659", product, { businessName: "Mustaqeem Stitches and Collection", productUrl: "https://store.test/product/sample-abaya", size: "M", colour: "Mocha", quantity: 1 });
    expect(url).toContain("https://wa.me/2349015790659?text=");
    const decoded = new URL(url!).searchParams.get("text")!;
    expect(decoded).toContain("Product URL: https://store.test/product/sample-abaya");
    expect(decoded).toContain("Size: M");
    expect(decoded).toContain("Colour: Mocha");
    expect(buildProductEnquiryMessage(product, { quantity: 1 })).not.toMatch(/^(Size|Colour):/m);
    expect(buildProductEnquiryUrl("+234 801-234-5678", product, { size: "XL", quantity: 1 })).toBe(null);
    expect(buildProductEnquiryUrl("+234 801-234-5678", product, { size: "M", quantity: 1 })).toContain("https://wa.me/2348012345678?text=");
  });
  it("keeps custom-order fields optional and encodes them into the user-initiated URL", () => {
    const url = buildCustomOrderUrl("09015790659", { style: "Soft drape", colour: "Sand" }, "Mustaqeem Stitches and Collection");
    expect(url).toContain("https://wa.me/2349015790659?text=");
    expect(new URL(url!).searchParams.get("text")).toContain("Hello Mustaqeem Stitches and Collection, I would like to enquire about a custom-made modest outfit.");
    expect(url).toContain("Preferred%20style%3A%20Soft%20drape");
    expect(url).toContain("Preferred%20colour%3A%20Sand");
    expect(url).not.toContain("Additional%20details");
  });
});

describe("public Supabase configuration policy", () => {
  const jwt = (role: string) => `header.${Buffer.from(JSON.stringify({ role }), "utf8").toString("base64url")}.signature`;

  it("accepts only publishable keys or legacy JWTs with the anon role", () => {
    expect(isBrowserSafeSupabaseKey("sb_publishable_1234567890abcdefghijklmnopqrstuvwxyz")).toBe(true);
    expect(isBrowserSafeSupabaseKey(jwt("anon"))).toBe(true);
    expect(isBrowserSafeSupabaseKey(jwt("service_role"))).toBe(false);
    expect(isBrowserSafeSupabaseKey("sb_secret_not-a-browser-key")).toBe(false);
    expect(isBrowserSafeSupabaseKey("unrecognized-key-value")).toBe(false);
  });

  it("rejects Supabase URLs that embed credentials or use remote plain HTTP", () => {
    expect(isSafeSupabaseProjectUrl("https://example-project.supabase.co")).toBe(true);
    expect(isSafeSupabaseProjectUrl("http://localhost:54321")).toBe(true);
    expect(isSafeSupabaseProjectUrl("http://example-project.supabase.co")).toBe(false);
    expect(isSafeSupabaseProjectUrl("https://user:password@example-project.supabase.co")).toBe(false);
    expect(isSafeSupabaseProjectUrl("https://example-project.supabase.co/?token=private")).toBe(false);
  });

  it("rejects preview/internal/placeholder origins from canonicals and accepts a confirmed-looking public HTTPS origin", () => {
    for (const host of [
      "localhost",
      "store.test",
      "store.invalid",
      "store.example.com",
      "preview.manus.computer",
      "preview.manuspre.computer",
      "preview.manus-asia.computer",
      "preview.manusvm.computer",
      "preview.manuscomputer.ai",
    ]) {
      expect(normalizePublicSiteOrigin(`https://${host}`)).toBe(null);
    }
    expect(normalizePublicSiteOrigin("http://store.example.co.uk")).toBe(null);
    expect(normalizePublicSiteOrigin("https://user:password@store.example.co.uk")).toBe(null);
    expect(normalizePublicSiteOrigin("https://store.example.co.uk/catalog")).toBe(null);
    expect(normalizePublicSiteOrigin("https://confirmed-fashion-store.co.uk/"))
      .toBe("https://confirmed-fashion-store.co.uk");
  });
});
