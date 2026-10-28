export type ProductStatus = "draft" | "published";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id?: string;
  product_id?: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  url?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_minor: number | null;
  currency: "NGN";
  category_id: string;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  main_image_path: string | null;
  sizes: string[];
  colours: string[];
  fabric: string | null;
  care_instructions: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  status: ProductStatus;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
  is_demo?: boolean;
}

export type ProductWriteInput = Pick<
  Product,
  | "name"
  | "slug"
  | "description"
  | "price_minor"
  | "category_id"
  | "sizes"
  | "colours"
  | "fabric"
  | "care_instructions"
  | "is_available"
  | "is_featured"
  | "is_new_arrival"
  | "status"
>;

export interface StoreSettings {
  id?: string;
  brand_name: string | null;
  logo_path: string | null;
  whatsapp_number: string | null;
  instagram_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  location_text: string | null;
  announcement_text: string | null;
  announcement_enabled: boolean;
  about_text: string | null;
  delivery_information: string | null;
  sizing_information: string | null;
  exchange_policy: string | null;
  privacy_information: string | null;
  faq_information: string | null;
  approved_testimonials: string[];
  updated_at?: string;
}

export const OFFICIAL_BRAND_NAME = "Mustaqeem Stitches and Collection";
export const OFFICIAL_WHATSAPP_NUMBER = "09015790659";

export const DEFAULT_SETTINGS: StoreSettings = {
  brand_name: OFFICIAL_BRAND_NAME,
  logo_path: null,
  whatsapp_number: OFFICIAL_WHATSAPP_NUMBER,
  instagram_url: null,
  contact_email: null,
  contact_phone: null,
  location_text: null,
  announcement_text: null,
  announcement_enabled: false,
  about_text: null,
  delivery_information: null,
  sizing_information: null,
  exchange_policy: null,
  privacy_information: null,
  faq_information: null,
  approved_testimonials: [],
};
