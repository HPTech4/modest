import type { Category, Product, StoreSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

// These are generated illustrative styling references, not photographs of the owner's products.
export const DEMO_ASSETS = {
  hero: "/manus-storage/async-images/wibZDKxW79B93X58fL0Cl2/image-1.webp",
  abaya: "/manus-storage/async-images/wibZDKxW79B93X58fL0Cl2/image-2.webp",
  hijab: "/manus-storage/async-images/wibZDKxW79B93X58fL0Cl2/image-3.webp",
  khimar: "/manus-storage/async-images/wibZDKxW79B93X58fL0Cl2/image-4.webp",
  gown: "/manus-storage/async-images/wibZDKxW79B93X58fL0Cl2/image-5.webp",
  mark: "/manus-storage/async-images/maBGzsDcz6HkO2aH3t4dpc/image-1.webp",
} as const;

const categories: Category[] = [
  { id: "demo-abayas", name: "Abayas", slug: "abayas", description: "Graceful layers for every day.", image_path: DEMO_ASSETS.abaya, is_visible: true, sort_order: 1 },
  { id: "demo-hijabs", name: "Hijabs", slug: "hijabs", description: "Soft textures and considered tones.", image_path: DEMO_ASSETS.hijab, is_visible: true, sort_order: 2 },
  { id: "demo-khimars", name: "Khimars", slug: "khimars", description: "Easy, flowing coverage.", image_path: DEMO_ASSETS.khimar, is_visible: true, sort_order: 3 },
  { id: "demo-jilbabs", name: "Jilbabs", slug: "jilbabs", description: "A considered layer with room to move.", image_path: DEMO_ASSETS.abaya, is_visible: true, sort_order: 4 },
  { id: "demo-gowns", name: "Modest Gowns", slug: "modest-gowns", description: "Occasion dressing, kept effortless.", image_path: DEMO_ASSETS.gown, is_visible: true, sort_order: 5 },
  { id: "demo-custom", name: "Custom-Made Outfits", slug: "custom-made-outfits", description: "Begin with a conversation about your idea.", image_path: DEMO_ASSETS.hero, is_visible: true, sort_order: 6 },
];

function demoProduct(input: Partial<Product> & Pick<Product, "id" | "name" | "slug" | "category_id">): Product {
  const category = categories.find((item) => item.id === input.category_id)!;
  const now = "2026-10-25T00:00:00.000Z";
  return {
    id: input.id,
    name: input.name,
    slug: input.slug,
    description: input.description ?? "Illustrative sample listing. Replace this description and styling image with the store's confirmed product details before publishing.",
    price_minor: null,
    currency: "NGN",
    category_id: input.category_id,
    category: { id: category.id, name: category.name, slug: category.slug },
    main_image_path: input.main_image_path ?? null,
    sizes: input.sizes ?? [],
    colours: input.colours ?? [],
    fabric: input.fabric ?? null,
    care_instructions: input.care_instructions ?? null,
    is_available: input.is_available ?? true,
    is_featured: input.is_featured ?? false,
    is_new_arrival: input.is_new_arrival ?? false,
    status: "published",
    images: input.images ?? [],
    created_at: now,
    updated_at: now,
    is_demo: true,
  };
}

export const DEMO_CATEGORIES = categories;
export const DEMO_PRODUCTS: Product[] = [
  demoProduct({ id: "sample-abaya", name: "Illustrative — Everyday Abaya", slug: "sample-everyday-abaya", category_id: "demo-abayas", main_image_path: DEMO_ASSETS.abaya, images: [{ storage_path: DEMO_ASSETS.abaya, alt_text: "Illustrative modest abaya styling example", sort_order: 0, url: DEMO_ASSETS.abaya }], sizes: ["S", "M", "L"], colours: ["Mocha", "Ivory"], is_featured: true }),
  demoProduct({ id: "sample-hijab", name: "Illustrative — Soft-Drape Hijab", slug: "sample-soft-drape-hijab", category_id: "demo-hijabs", main_image_path: DEMO_ASSETS.hijab, images: [{ storage_path: DEMO_ASSETS.hijab, alt_text: "Illustrative folded hijab styling example", sort_order: 0, url: DEMO_ASSETS.hijab }], colours: ["Ivory", "Taupe", "Cocoa"], is_featured: true, is_new_arrival: true }),
  demoProduct({ id: "sample-khimar", name: "Illustrative — Everyday Khimar", slug: "sample-everyday-khimar", category_id: "demo-khimars", main_image_path: DEMO_ASSETS.khimar, images: [{ storage_path: DEMO_ASSETS.khimar, alt_text: "Illustrative long khimar styling example", sort_order: 0, url: DEMO_ASSETS.khimar }], sizes: ["One size"], colours: ["Sand", "Deep brown"] }),
  demoProduct({ id: "sample-gown", name: "Illustrative — Occasion Gown", slug: "sample-occasion-gown", category_id: "demo-gowns", main_image_path: DEMO_ASSETS.gown, images: [{ storage_path: DEMO_ASSETS.gown, alt_text: "Illustrative modest gown styling example", sort_order: 0, url: DEMO_ASSETS.gown }], sizes: ["M", "L"], colours: ["Olive", "Ivory"], is_new_arrival: true }),
];

export const DEMO_SETTINGS: StoreSettings = { ...DEFAULT_SETTINGS };
