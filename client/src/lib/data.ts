import { DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_SETTINGS } from "./demo-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import { DEFAULT_SETTINGS, type Category, type Product, type ProductImage, type ProductWriteInput, type StoreSettings } from "./types";

const PRODUCT_SELECT = "*, category:categories(id,name,slug), product_images(id,product_id,storage_path,alt_text,sort_order)";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PRODUCT_IMAGES = 8;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function client() {
  if (!supabase) throw new Error("Supabase is not configured. Follow the setup guide in README.md.");
  return supabase;
}

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return fallback;
}

async function signedImageUrl(path: string): Promise<string | null> {
  if (path.startsWith("https://") || path.startsWith("/manus-storage/")) return path;
  const { data, error } = await client().storage.from("product-images").createSignedUrl(path, 60 * 60 * 12);
  if (error) return null;
  return data.signedUrl;
}

async function mapProduct(row: any): Promise<Product> {
  const rawImages: any[] = Array.isArray(row.product_images) ? row.product_images : [];
  rawImages.sort((a, b) => {
    if (a.storage_path === row.main_image_path) return -1;
    if (b.storage_path === row.main_image_path) return 1;
    return Number(a.sort_order) - Number(b.sort_order);
  });
  const images: ProductImage[] = await Promise.all(rawImages.map(async (image) => ({
    id: image.id,
    product_id: image.product_id,
    storage_path: image.storage_path,
    alt_text: image.alt_text ?? null,
    sort_order: Number(image.sort_order ?? 0),
    url: await signedImageUrl(image.storage_path),
  })));
  const relation = Array.isArray(row.category) ? row.category[0] : row.category;
  return {
    ...row,
    price_minor: row.price_minor === null ? null : Number(row.price_minor),
    category: relation ?? null,
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    colours: Array.isArray(row.colours) ? row.colours : [],
    images,
  } as Product;
}

export async function getPublicCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return DEMO_CATEGORIES;
  const { data, error } = await client().from("categories").select("*").eq("is_visible", true).order("sort_order");
  if (error) throw new Error(errorMessage(error, "Categories could not be loaded."));
  return (data ?? []) as Category[];
}

export async function getPublicSettings(): Promise<StoreSettings> {
  if (!isSupabaseConfigured) return DEMO_SETTINGS;
  const { data, error } = await client().from("store_settings").select("*").limit(1).maybeSingle();
  if (error) throw new Error(errorMessage(error, "Store settings could not be loaded."));
  if (!data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...data, approved_testimonials: Array.isArray(data.approved_testimonials) ? data.approved_testimonials : [] } as StoreSettings;
}

export async function getPublicProducts(options: { categorySlug?: string; search?: string } = {}): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    let results = DEMO_PRODUCTS;
    if (options.categorySlug) results = results.filter((product) => product.category?.slug === options.categorySlug);
    if (options.search?.trim()) {
      const term = options.search.trim().toLocaleLowerCase();
      results = results.filter((product) => `${product.name} ${product.description ?? ""}`.toLocaleLowerCase().includes(term));
    }
    return results;
  }
  const { data, error } = await client().from("products").select(PRODUCT_SELECT).eq("status", "published").order("created_at", { ascending: false });
  if (error) throw new Error(errorMessage(error, "Products could not be loaded."));
  let products = await Promise.all((data ?? []).map(mapProduct));
  if (options.categorySlug) products = products.filter((product) => product.category?.slug === options.categorySlug);
  if (options.search?.trim()) {
    const term = options.search.trim().toLocaleLowerCase();
    products = products.filter((product) => `${product.name} ${product.description ?? ""}`.toLocaleLowerCase().includes(term));
  }
  return products;
}

export async function getPublicProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured) return DEMO_PRODUCTS.find((item) => item.slug === slug) ?? null;
  const { data, error } = await client().from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw new Error(errorMessage(error, "Product could not be loaded."));
  return data ? mapProduct(data) : null;
}

export async function getAdminProducts(): Promise<Product[]> {
  const { data, error } = await client().from("products").select(PRODUCT_SELECT).order("updated_at", { ascending: false });
  if (error) throw new Error(errorMessage(error, "Products could not be loaded."));
  return Promise.all((data ?? []).map(mapProduct));
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const { data, error } = await client().from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(errorMessage(error, "Product could not be loaded."));
  return data ? mapProduct(data) : null;
}

export async function createProduct(input: ProductWriteInput): Promise<{ id: string }> {
  const { data, error } = await client().from("products").insert({ ...input, currency: "NGN", main_image_path: null }).select("id").single();
  if (error) throw new Error(errorMessage(error, "Product could not be saved. Check the slug and required fields."));
  return { id: data.id as string };
}

export async function updateProduct(id: string, changes: Partial<ProductWriteInput> & { main_image_path?: string | null }): Promise<void> {
  const { error } = await client().from("products").update(changes).eq("id", id);
  if (error) throw new Error(errorMessage(error, "Product could not be updated. Check for a duplicate slug and try again."));
}

export async function setProductStatus(id: string, status: Product["status"]): Promise<void> {
  await updateProduct(id, { status });
}

function fileExtension(file: File): string {
  const byMime: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  return byMime[file.type] ?? "";
}

export async function uploadProductImages(productId: string, files: File[], existingCount: number, mainFileIndex?: number): Promise<ProductImage[]> {
  if (files.length + existingCount > MAX_PRODUCT_IMAGES) throw new Error(`A product can have up to ${MAX_PRODUCT_IMAGES} photographs.`);
  const storage = client().storage.from("product-images");
  const uploaded: ProductImage[] = [];
  for (const [index, file] of files.entries()) {
    const ext = fileExtension(file);
    if (!ALLOWED_MIME.has(file.type) || !ext) throw new Error(`${file.name}: choose a JPEG, PNG or WebP image.`);
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: each image must be smaller than 5 MB.`);
    const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await storage.upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(errorMessage(uploadError, `Could not upload ${file.name}.`));
    const { data, error: rowError } = await client().from("product_images").insert({
      product_id: productId,
      storage_path: path,
      alt_text: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      sort_order: existingCount + index,
    }).select("id,product_id,storage_path,alt_text,sort_order").single();
    if (rowError) {
      await storage.remove([path]);
      throw new Error(errorMessage(rowError, `Image metadata for ${file.name} could not be saved.`));
    }
    const image = { ...data, url: await signedImageUrl(path) } as ProductImage;
    uploaded.push(image);
    if ((mainFileIndex !== undefined && index === mainFileIndex) || (existingCount === 0 && index === 0)) {
      const { error: mainError } = await client().from("products").update({ main_image_path: path }).eq("id", productId);
      if (mainError) throw new Error(errorMessage(mainError, "Image uploaded, but the main image selection could not be saved."));
    }
  }
  return uploaded;
}

export async function removeProductImage(productId: string, image: ProductImage, allImages: ProductImage[], mainImagePath: string | null): Promise<void> {
  if (!image.id) throw new Error("This illustrative image cannot be removed from Supabase.");
  const storage = client().storage.from("product-images");
  if (mainImagePath === image.storage_path) {
    const nextPath = allImages.find((item) => item.storage_path !== image.storage_path)?.storage_path ?? null;
    await updateProduct(productId, { main_image_path: nextPath });
  }
  const { error: rowError } = await client().from("product_images").delete().eq("id", image.id);
  if (rowError) throw new Error(errorMessage(rowError, "Image metadata could not be removed."));
  const { error: removeError } = await storage.remove([image.storage_path]);
  if (removeError) throw new Error("The image was removed from the product, but its unused Storage file could not be cleaned up. Ask the project owner to remove it from the private bucket.");
}

export async function deleteProduct(id: string): Promise<void> {
  const { data: images, error: imageError } = await client().from("product_images").select("storage_path").eq("product_id", id);
  if (imageError) throw new Error(errorMessage(imageError, "Product photographs could not be listed."));
  const paths = (images ?? []).map((item) => item.storage_path as string);
  const { error } = await client().from("products").delete().eq("id", id);
  if (error) throw new Error(errorMessage(error, "Product could not be deleted."));
  if (paths.length) {
    const { error: removeError } = await client().storage.from("product-images").remove(paths);
    if (removeError) throw new Error("The product was deleted, but some unused Storage files could not be cleaned up. Ask the project owner to remove them from the private bucket.");
  }
}

export async function getAdminCategories(): Promise<Category[]> {
  const { data, error } = await client().from("categories").select("*").order("sort_order");
  if (error) throw new Error(errorMessage(error, "Categories could not be loaded."));
  return (data ?? []) as Category[];
}

export async function saveCategory(input: Pick<Category, "name" | "slug" | "description" | "image_path" | "is_visible" | "sort_order">, id?: string): Promise<void> {
  const query = id
    ? client().from("categories").update(input).eq("id", id)
    : client().from("categories").insert(input);
  const { error } = await query;
  if (error) throw new Error(errorMessage(error, "Category could not be saved. Check its name and slug."));
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await client().from("categories").delete().eq("id", id);
  if (error) throw new Error(errorMessage(error, "This category could not be deleted. Reassign or remove its products first."));
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const { id: _id, updated_at: _updatedAt, ...values } = settings;
  const db = client();
  const { data: current, error: lookupError } = await db.from("store_settings").select("id").limit(1).maybeSingle();
  if (lookupError) throw new Error(errorMessage(lookupError, "Store settings could not be checked."));
  const write = current
    ? db.from("store_settings").update(values).eq("id", current.id)
    : db.from("store_settings").insert({ ...values, singleton: true });
  const { error } = await write;
  if (error) throw new Error(errorMessage(error, "Store settings could not be saved."));
}

export function readableDataError(error: unknown, fallback = "Something went wrong. Please try again.") {
  return errorMessage(error, fallback);
}
