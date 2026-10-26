import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ImageWithFallback from "../components/ImageWithFallback";
import { ErrorState, LoadingState } from "../components/States";
import { deleteCategory, getAdminCategories, readableDataError, saveCategory } from "../lib/data";
import { slugify } from "../lib/format";
import type { Category } from "../lib/types";

interface CategoryForm { id?: string; name: string; slug: string; description: string; image_path: string; is_visible: boolean; sort_order: string }
const blank: CategoryForm = { name: "", slug: "", description: "", image_path: "", is_visible: true, sort_order: "0" };

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(blank);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setLoading(true); setError(null); void getAdminCategories().then(setCategories).catch((cause) => setError(readableDataError(cause, "Categories could not be loaded."))).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  function update<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function edit(category: Category) { setForm({ id: category.id, name: category.name, slug: category.slug, description: category.description ?? "", image_path: category.image_path ?? "", is_visible: category.is_visible, sort_order: String(category.sort_order) }); setSlugTouched(true); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function reset() { setForm(blank); setSlugTouched(false); setError(null); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const slug = slugify(form.slug);
    if (!slug) { setError("Enter a valid category slug using lowercase letters, numbers and hyphens."); return; }
    if (form.image_path.trim()) {
      try { const url = new URL(form.image_path.trim()); if (url.protocol !== "https:") throw new Error(); }
      catch { setError("Category image URL must be a valid HTTPS link."); return; }
    }
    setBusy(true);
    try { await saveCategory({ name: form.name.trim(), slug, description: form.description.trim() || null, image_path: form.image_path.trim() || null, is_visible: form.is_visible, sort_order: Math.max(0, Math.floor(Number(form.sort_order) || 0)) }, form.id); toast.success(form.id ? "Category updated." : "Category created."); reset(); load(); }
    catch (cause) { setError(readableDataError(cause, "Category could not be saved. Check that the slug is unique.")); }
    finally { setBusy(false); }
  }
  async function remove(category: Category) {
    if (!window.confirm(`Delete “${category.name}”? Categories referenced by products cannot be deleted.`)) return;
    try { await deleteCategory(category.id); toast.success("Category deleted."); load(); }
    catch (cause) { toast.error(readableDataError(cause, "This category is still in use. Reassign its products before deleting it.")); }
  }
  return <div className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Catalogue structure</p><h1>Categories</h1><p>Shape the collections customers browse.</p></div><Link className="button button--secondary" href="/">Open storefront</Link></div>
    <div className="admin-dashboard-grid admin-dashboard-grid--categories"><section className="admin-panel"><p className="eyebrow">{form.id ? "Edit collection" : "Create collection"}</p><h2>{form.id ? "Update category" : "New category"}</h2>{error && <p className="field-error" role="alert">{error}</p>}
      <form className="form-stack" onSubmit={submit}><label className="form-field">Category name<input value={form.name} onChange={(event) => { update("name", event.target.value); if (!slugTouched) update("slug", slugify(event.target.value)); }} required maxLength={80} /></label><label className="form-field">Unique slug<input value={form.slug} onChange={(event) => { setSlugTouched(true); update("slug", slugify(event.target.value)); }} required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" /><small>Used in public collection links.</small></label><label className="form-field">Description <span className="field-optional">(optional)</span><textarea rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} maxLength={500} /></label><label className="form-field">Image URL <span className="field-optional">(optional, HTTPS)</span><input type="url" value={form.image_path} onChange={(event) => update("image_path", event.target.value)} placeholder="https://…" /></label><label className="form-field">Display order<input type="number" min="0" step="1" value={form.sort_order} onChange={(event) => update("sort_order", event.target.value)} /></label><label className="checkbox-line"><input type="checkbox" checked={form.is_visible} onChange={(event) => update("is_visible", event.target.checked)} />Visible in storefront</label><div className="form-actions"><button className="button button--primary" type="submit" disabled={busy}>{busy ? "Saving…" : form.id ? "Save category" : "Create category"}</button>{form.id && <button className="button button--text" type="button" onClick={reset}>Cancel</button>}</div></form>
      <p className="form-note"><ImagePlus size={14} /> Add an HTTPS image link; product photos are uploaded from each product form.</p>
    </section><section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Your collections</p><h2>{categories.length} categories</h2></div><button className="icon-button" type="button" aria-label="Reload categories" onClick={load}><Plus size={16} /></button></div>{loading ? <LoadingState label="Loading categories" /> : error && !categories.length ? <ErrorState message={error} onRetry={load} /> : categories.length ? <div className="category-admin-list">{categories.map((category) => <div className="category-admin-row" key={category.id}><ImageWithFallback src={category.image_path ?? undefined} alt="" className="category-admin-thumb" fallbackLabel="" /><div className="category-admin-row__text"><strong>{category.name}</strong><span>/{category.slug} · order {category.sort_order}</span><span className={`status-pill ${category.is_visible ? "status-pill--published" : "status-pill--draft"}`}>{category.is_visible ? "Visible" : "Hidden"}</span></div><button className="icon-button" aria-label={`Edit ${category.name}`} onClick={() => edit(category)}><Pencil size={16} /></button><button className="icon-button icon-button--danger" aria-label={`Delete ${category.name}`} onClick={() => void remove(category)}><Trash2 size={16} /></button></div>)}</div> : <p className="muted-copy">No categories are configured.</p>}</section></div>
  </div>;
}
