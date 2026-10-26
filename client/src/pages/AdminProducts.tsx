import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ImagePlus, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import ImageWithFallback from "../components/ImageWithFallback";
import { productImage } from "../components/ProductCard";
import { createProduct, deleteProduct, getAdminCategories, getAdminProduct, getAdminProducts, readableDataError, removeProductImage, setProductStatus, updateProduct, uploadProductImages } from "../lib/data";
import { formatNaira, formatUpdatedDate, nairaInputValue, parseOptionalNaira, parseOptionList, slugify } from "../lib/format";
import type { Category, Product, ProductImage, ProductStatus, ProductWriteInput } from "../lib/types";

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [availability, setAvailability] = useState("all");
  const load = () => { setLoading(true); setError(null); void getAdminProducts().then(setProducts).catch((cause) => setError(readableDataError(cause, "Products could not be loaded."))).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => products.filter((item) => {
    const matchesSearch = `${item.name} ${item.slug} ${item.category?.name ?? ""}`.toLocaleLowerCase().includes(search.toLocaleLowerCase());
    const matchesStatus = status === "all" || item.status === status;
    const matchesAvailability = availability === "all" || (availability === "available" ? item.is_available : !item.is_available);
    return matchesSearch && matchesStatus && matchesAvailability;
  }), [products, search, status, availability]);
  async function toggleStatus(product: Product) {
    const next: ProductStatus = product.status === "published" ? "draft" : "published";
    try { await setProductStatus(product.id, next); toast.success(next === "published" ? "Product published." : "Product moved to drafts."); load(); }
    catch (cause) { toast.error(readableDataError(cause, "Publication status could not be changed.")); }
  }
  async function toggleAvailability(product: Product) {
    try { await updateProduct(product.id, { is_available: !product.is_available }); toast.success(product.is_available ? "Product marked unavailable." : "Product marked available."); load(); }
    catch (cause) { toast.error(readableDataError(cause, "Availability could not be changed.")); }
  }
  async function remove(product: Product) {
    if (!window.confirm(`Permanently delete “${product.name}” and its product photographs? This cannot be undone.`)) return;
    try { await deleteProduct(product.id); toast.success("Product deleted."); load(); }
    catch (cause) { toast.error(readableDataError(cause, "Product could not be deleted.")); load(); }
  }
  return <div className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Catalogue</p><h1>Products</h1><p>Keep product information, photos and visibility up to date.</p></div><Link className="button button--primary" href="/admin/products/new"><Plus size={17} />Add product</Link></div>
    <div className="admin-toolbar"><label className="search-field"><span className="sr-only">Search products</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, slug or category" /></label><label className="select-field"><span className="sr-only">Filter by publication status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option></select></label><label className="select-field"><span className="sr-only">Filter by availability</span><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">All availability</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label></div>
    {loading ? <LoadingState label="Loading products" /> : error ? <ErrorState message={error} onRetry={load} /> : visible.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Availability</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((product) => <tr key={product.id}><td><div className="table-product"><ImageWithFallback src={productImage(product)} alt="" className="table-product__image" fallbackLabel="" /><div><strong>{product.name}</strong><span>/{product.slug}</span></div></div></td><td>{product.category?.name ?? "—"}</td><td>{formatNaira(product.price_minor)}</td><td><span className={`status-pill status-pill--${product.status}`}>{product.status}</span></td><td><span className={product.is_available ? "availability-dot" : "availability-dot availability-dot--muted"}>{product.is_available ? "Available" : "Unavailable"}</span></td><td>{formatUpdatedDate(product.updated_at)}</td><td><div className="table-actions"><Link className="icon-button" href={`/admin/products/${product.id}/edit`} aria-label={`Edit ${product.name}`}><Pencil size={16} /></Link><button className="table-action-text" onClick={() => void toggleStatus(product)}>{product.status === "published" ? "Unpublish" : "Publish"}</button><button className="table-action-text" onClick={() => void toggleAvailability(product)}>{product.is_available ? "Mark unavailable" : "Mark available"}</button><button className="icon-button icon-button--danger" aria-label={`Delete ${product.name}`} onClick={() => void remove(product)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title={products.length ? "No matching products" : "No products yet"} message={products.length ? "Change the search or filters to see more." : "Add a product when you are ready to prepare the catalogue."} actionHref="/admin/products/new" actionLabel="Add your first product" />}
  </div>;
}

interface EditorState {
  name: string;
  slug: string;
  category_id: string;
  description: string;
  price: string;
  sizes: string;
  colours: string;
  fabric: string;
  care_instructions: string;
  is_available: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  status: ProductStatus;
}
const emptyEditor: EditorState = { name: "", slug: "", category_id: "", description: "", price: "", sizes: "", colours: "", fabric: "", care_instructions: "", is_available: true, is_featured: false, is_new_arrival: false, status: "draft" };

export function AdminProductEditor() {
  const [, editParams] = useRoute<{ id: string }>("/admin/products/:id/edit");
  const productId = editParams?.id;
  const [, navigate] = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<EditorState>(emptyEditor);
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [mainPath, setMainPath] = useState<string | null>(null);
  const [mainFileIndex, setMainFileIndex] = useState<number | undefined>();
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(Boolean(productId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void getAdminCategories().then((items) => { if (active) setCategories(items); }).catch((cause) => { if (active) setError(readableDataError(cause, "Categories could not be loaded.")); });
    if (productId) void getAdminProduct(productId).then((item) => {
      if (!active) return;
      if (!item) { setError("This product could not be found."); return; }
      setProduct(item); setImages(item.images); setMainPath(item.main_image_path);
      setForm({ name: item.name, slug: item.slug, category_id: item.category_id, description: item.description ?? "", price: nairaInputValue(item.price_minor), sizes: item.sizes.join(", "), colours: item.colours.join(", "), fabric: item.fabric ?? "", care_instructions: item.care_instructions ?? "", is_available: item.is_available, is_featured: item.is_featured, is_new_arrival: item.is_new_arrival, status: item.status });
    }).catch((cause) => { if (active) setError(readableDataError(cause, "Product could not be loaded.")); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId]);
  function setField<K extends keyof EditorState>(key: K, value: EditorState[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function chooseFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (incoming.length + images.length + files.length > 8) { toast.error("A product can have up to eight photographs."); return; }
    const invalid = incoming.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) { toast.error(`${invalid.name}: choose a JPEG, PNG or WebP image smaller than 5 MB.`); return; }
    setFiles((current) => [...current, ...incoming]);
    if (images.length === 0 && files.length === 0 && incoming.length) setMainFileIndex(0);
  }
  async function removeImage(image: ProductImage) {
    if (!product) return;
    if (!window.confirm("Remove this photograph from the product?")) return;
    try { await removeProductImage(product.id, image, images, mainPath); setImages((current) => current.filter((item) => item.storage_path !== image.storage_path)); if (mainPath === image.storage_path) setMainPath(images.find((item) => item.storage_path !== image.storage_path)?.storage_path ?? null); toast.success("Photograph removed."); }
    catch (cause) { toast.error(readableDataError(cause, "The photograph could not be removed.")); }
  }
  async function save(targetStatus: ProductStatus) {
    if (!formRef.current?.reportValidity()) return;
    setError(null);
    const price = parseOptionalNaira(form.price);
    if (price.error) { setError(price.error); return; }
    const slug = slugify(form.slug);
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setError("Enter a valid product slug using lowercase letters, numbers and hyphens."); return; }
    if (!categories.some((category) => category.id === form.category_id)) { setError("Choose a category before saving."); return; }
    if (images.length + files.length > 8) { setError("A product can have up to eight photographs."); return; }
    setBusy(true);
    try {
      const write: ProductWriteInput = {
        name: form.name.trim(), slug, category_id: form.category_id, description: form.description.trim() || null,
        price_minor: price.minor, sizes: parseOptionList(form.sizes), colours: parseOptionList(form.colours),
        fabric: form.fabric.trim() || null, care_instructions: form.care_instructions.trim() || null,
        is_available: form.is_available, is_featured: form.is_featured, is_new_arrival: form.is_new_arrival,
        status: product?.status ?? "draft",
      };
      let id = product?.id;
      let chosenMain = mainPath;
      if (!id) id = (await createProduct({ ...write, status: "draft" })).id;
      else await updateProduct(id, { ...write, status: product?.status ?? "draft" });
      if (files.length) {
        const newlyUploaded = await uploadProductImages(id, files, images.length, mainFileIndex);
        setImages((current) => [...current, ...newlyUploaded]);
        const selectedMain = mainFileIndex !== undefined ? newlyUploaded[mainFileIndex]?.storage_path : undefined;
        if (selectedMain) chosenMain = selectedMain;
        else if (images.length === 0) chosenMain = newlyUploaded[0]?.storage_path ?? null;
        setMainPath(chosenMain);
        setFiles([]);
      }
      await updateProduct(id, { status: targetStatus, main_image_path: chosenMain });
      toast.success(targetStatus === "published" ? "Product published and saved." : "Product saved as a draft.");
      if (!product) navigate(`/admin/products/${id}/edit`);
      else setProduct({ ...product, ...write, status: targetStatus, main_image_path: chosenMain ?? product.main_image_path });
    } catch (cause) {
      setError(readableDataError(cause, "The product could not be saved. Review the fields and try again."));
    } finally { setBusy(false); }
  }
  if (loading) return <div className="admin-page"><LoadingState label="Loading product" /></div>;
  if (error && productId && !product) return <div className="admin-page"><ErrorState message={error} onRetry={() => window.location.reload()} /><Link className="text-link" href="/admin/products">← Back to products</Link></div>;
  return <div className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Catalogue / {product ? "Edit product" : "New product"}</p><h1>{product ? "Edit product" : "Add a product"}</h1><p>Only confirmed product information should be published.</p></div><Link className="button button--secondary" href="/admin/products">Back to products</Link></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <form ref={formRef} id="product-editor-form" className="editor-layout" onSubmit={(event) => { event.preventDefault(); void save(form.status); }}>
      <div className="editor-main"><section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Product details</p><h2>What are you adding?</h2></div></div>
        <div className="form-grid"><label className="form-field form-field--wide">Product name<input value={form.name} onChange={(event) => { setField("name", event.target.value); if (!slugTouched) setField("slug", slugify(event.target.value)); }} required maxLength={120} /></label>
          <label className="form-field">Unique URL slug<input value={form.slug} onChange={(event) => { setSlugTouched(true); setField("slug", slugify(event.target.value)); }} required maxLength={140} pattern="[a-z0-9]+(-[a-z0-9]+)*" /><small>Lowercase letters, numbers and hyphens.</small></label>
          <label className="form-field">Category<select value={form.category_id} onChange={(event) => setField("category_id", event.target.value)} required><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="form-field form-field--wide">Description<textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={4} maxLength={4000} placeholder="Use confirmed product details only." /></label>
          <label className="form-field">Price in NGN <span className="field-optional">(optional)</span><div className="price-input"><span>₦</span><input type="number" inputMode="decimal" min="0" step="0.01" value={form.price} onChange={(event) => setField("price", event.target.value)} placeholder="Leave blank to enquire" /></div><small>Blank means price not yet confirmed; zero is a valid price.</small></label>
          <label className="form-field">Publication status<select value={form.status} onChange={(event) => setField("status", event.target.value as ProductStatus)}><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <label className="form-field">Sizes <span className="field-optional">(optional, comma separated)</span><input value={form.sizes} onChange={(event) => setField("sizes", event.target.value)} placeholder="e.g. S, M, L or One size" /></label>
          <label className="form-field">Colours <span className="field-optional">(optional, comma separated)</span><input value={form.colours} onChange={(event) => setField("colours", event.target.value)} placeholder="e.g. Ivory, Mocha" /></label>
          <label className="form-field">Fabric <span className="field-optional">(optional)</span><input value={form.fabric} onChange={(event) => setField("fabric", event.target.value)} /></label>
          <label className="form-field">Care instructions <span className="field-optional">(optional)</span><input value={form.care_instructions} onChange={(event) => setField("care_instructions", event.target.value)} /></label>
        </div>
      </section>
      <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Product photography</p><h2>Add images</h2><p>JPEG, PNG or WebP · up to 5 MB each · maximum 8 images</p></div><label className="button button--secondary button--small upload-button"><ImagePlus size={16} />Choose photos<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseFiles} /></label></div>
        <div className="image-manager">{images.map((image) => <div className="image-manager__item" key={image.id ?? image.storage_path}><ImageWithFallback src={image.url ?? image.storage_path} alt={image.alt_text ?? "Product image"} className="image-manager__photo" /><div className="image-manager__actions"><button type="button" className={`table-action-text ${mainPath === image.storage_path ? "is-main" : ""}`} onClick={() => { setMainPath(image.storage_path); if (product) void updateProduct(product.id, { main_image_path: image.storage_path }).then(() => toast.success("Main image updated.")).catch((cause) => toast.error(readableDataError(cause))); }}>{mainPath === image.storage_path ? "Main image" : "Make main"}</button>{image.id && <button type="button" className="table-action-text danger-text" onClick={() => void removeImage(image)}>Remove</button>}</div></div>)}
          {files.map((file, index) => <div className="image-manager__item" key={`${file.name}-${file.lastModified}-${index}`}><img src={URL.createObjectURL(file)} alt={`Selected upload ${index + 1}`} className="image-manager__photo" /><div className="image-manager__actions"><button type="button" className={`table-action-text ${mainFileIndex === index ? "is-main" : ""}`} onClick={() => setMainFileIndex(index)}>{mainFileIndex === index ? "Main image" : "Make main"}</button><button type="button" className="table-action-text danger-text" onClick={() => { setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index)); if (mainFileIndex === index) setMainFileIndex(undefined); }}>Remove</button></div></div>)}
          {images.length + files.length === 0 && <div className="upload-empty"><UploadCloud size={26} /><p>No photographs added yet.</p><span>A main image is selected from the product gallery.</span></div>}</div>
      </section>
      <section className="admin-panel"><p className="eyebrow">Visibility and options</p><h2>How should it appear?</h2><div className="toggle-list"><label><input type="checkbox" checked={form.is_available} onChange={(event) => setField("is_available", event.target.checked)} /><span><strong>Available</strong><small>Unavailable products remain visible when published but normal ordering is disabled.</small></span></label><label><input type="checkbox" checked={form.is_featured} onChange={(event) => setField("is_featured", event.target.checked)} /><span><strong>Featured</strong><small>Show this published product in the homepage featured section.</small></span></label><label><input type="checkbox" checked={form.is_new_arrival} onChange={(event) => setField("is_new_arrival", event.target.checked)} /><span><strong>New arrival</strong><small>Show in New Arrivals only while this flag is enabled.</small></span></label></div></section>
      </div>
      <aside className="editor-aside"><section className="admin-panel editor-actions"><p className="eyebrow">Save changes</p><p>Drafts are private. Publishing makes this item visible to customers.</p><button type="button" className="button button--secondary button--full" disabled={busy} onClick={() => void save("draft")}>{busy ? "Saving…" : "Save as draft"}</button><button type="button" className="button button--primary button--full" disabled={busy} onClick={() => void save("published")}>{busy ? "Saving…" : "Publish product"}</button>{product?.status === "published" && <button type="button" className="button button--text button--full" disabled={busy} onClick={() => void save("draft")}>Unpublish product</button>}</section><section className="admin-panel editor-tip"><p className="eyebrow">A gentle reminder</p><p>Only publish photographs, prices, options and care information that have been confirmed for this product.</p></section></aside>
    </form>
  </div>;
}
