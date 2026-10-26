import { useEffect, useState, type ReactNode } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { Boxes, ExternalLink, LayoutDashboard, LogOut, PackagePlus, Settings, Shirt, Tags, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import Seo from "../components/Seo";
import { ErrorState, LoadingState } from "../components/States";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";
import { isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from "../lib/supabase";
import { getAdminCategories, getAdminProducts, readableDataError } from "../lib/data";
import { formatNaira, formatUpdatedDate } from "../lib/format";
import type { Category, Product } from "../lib/types";

export function AdminLogin() {
  const { user, isAdmin, loading, signIn } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!loading && user && isAdmin) return <Redirect to="/admin" />;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    try { await signIn(email, password); toast.success("Signed in securely."); navigate("/admin"); }
    catch (cause) { setError(readableDataError(cause, "Sign-in could not be completed.")); }
    finally { setBusy(false); }
  }
  return <div className="login-page"><Seo title="Owner sign in | Store dashboard" description="Private store-owner sign-in." noindex /><div className="login-card"><Link href="/" className="login-brand"><span className="brand-mark-mini">F</span><span>Your Brand <small>Store owner</small></span></Link><p className="eyebrow">Private access</p><h1>Sign in to your store</h1><p className="login-intro">Use the administrator account provisioned in Supabase. There is no public sign-up.</p>
    {!isSupabaseConfigured ? <div className="setup-callout"><LockKeyhole size={20} /><p>{SUPABASE_SETUP_MESSAGE}</p></div> : <form onSubmit={submit} className="form-stack"><label className="form-field">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label><label className="form-field">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p className="field-error" role="alert">{error}</p>}<button className="button button--primary button--full" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form>}
    <Link className="login-back" href="/">← Return to storefront</Link></div></div>;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, verificationError } = useAuth();
  if (loading) return <div className="admin-loading"><LoadingState label="Verifying secure access" /></div>;
  if (!user) return <Redirect to="/admin/login" />;
  if (!isAdmin) return <div className="login-page"><Seo title="Access restricted | Store dashboard" description="Administrator access is required." noindex /><div className="login-card"><LockKeyhole size={26} /><h1>Administrator access required</h1><p>{verificationError || "This signed-in account is not present in the store's administrator allowlist."}</p><p className="form-note">Ask the store owner to provision the correct Supabase Auth user ID in `admin_users`.</p><Link className="button button--secondary" href="/admin/login">Return to sign in</Link></div></div>;
  return <AdminFrame>{children}</AdminFrame>;
}

function AdminFrame({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Shirt },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/settings", label: "Store settings", icon: Settings },
  ];
  async function logout() { try { await signOut(); toast.success("You have signed out."); navigate("/"); } catch (error) { toast.error(readableDataError(error, "Sign-out failed.")); } }
  return <div className="admin-shell"><Seo title="Store dashboard | Owner" description="Private store management dashboard." noindex />
    <aside className={`admin-sidebar ${menuOpen ? "admin-sidebar--open" : ""}`}><Link href="/" className="admin-brand"><span className="brand-mark-mini">F</span><span>Store desk<small>Modest fashion</small></span></Link><nav aria-label="Admin navigation">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="admin-nav-link"><Icon size={18} />{label}</Link>)}<Link href="/admin/products/new" className="admin-nav-link"><PackagePlus size={18} />Add product</Link></nav><div className="admin-sidebar__bottom"><p className="admin-user-email">{user?.email}</p><button className="admin-nav-link admin-signout" onClick={logout}><LogOut size={18} />Sign out</button></div></aside>
    <div className="admin-main"><header className="admin-topbar"><button type="button" className="menu-toggle admin-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle dashboard navigation"><Boxes size={20} /></button><p>Store management</p><Link href="/" target="_blank" className="admin-open-store">Open storefront <ExternalLink size={15} /></Link></header><main className="admin-content">{children}</main></div>
  </div>;
}

export function AdminOverview() {
  const { settings } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setLoading(true); setError(null); void Promise.all([getAdminProducts(), getAdminCategories()]).then(([p, c]) => { setProducts(p); setCategories(c); }).catch((cause) => setError(readableDataError(cause, "Dashboard information could not be loaded."))).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const published = products.filter((item) => item.status === "published").length;
  const drafts = products.filter((item) => item.status === "draft").length;
  const unavailable = products.filter((item) => !item.is_available).length;
  return <div className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Your workspace</p><h1>Good to see you</h1><p>Manage the pieces, collections and information customers see.</p></div><Link className="button button--primary" href="/admin/products/new"><PackagePlus size={17} />Add product</Link></div>
    {(!settings.whatsapp_number || !isSupabaseConfigured) && <div className="admin-notice"><LockKeyhole size={19} /><div><strong>Finish store setup</strong><p>{!isSupabaseConfigured ? SUPABASE_SETUP_MESSAGE : "Add the store's international WhatsApp number in settings so customers can send order enquiries."}</p></div><Link href={!isSupabaseConfigured ? "/admin/settings" : "/admin/settings"}>Open settings</Link></div>}
    {loading ? <LoadingState label="Loading store data" /> : error ? <ErrorState message={error} onRetry={load} /> : <>
      <div className="stat-grid"><Stat label="All products" value={products.length} /><Stat label="Published" value={published} /><Stat label="Drafts" value={drafts} /><Stat label="Unavailable" value={unavailable} /><Stat label="Categories" value={categories.length} /></div>
      <div className="admin-dashboard-grid"><section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Recently updated</p><h2>Product activity</h2></div><Link className="text-link" href="/admin/products">View all →</Link></div>{products.length ? <div className="activity-list">{products.slice(0, 6).map((product) => <div className="activity-row" key={product.id}><div><strong>{product.name}</strong><span>{product.category?.name ?? "Uncategorized"} · {formatUpdatedDate(product.updated_at)}</span></div><span className={`status-pill status-pill--${product.status}`}>{product.status}</span></div>)}</div> : <p className="muted-copy">Your products will appear here once added.</p>}</section>
        <section className="admin-panel quick-actions"><p className="eyebrow">Quick actions</p><h2>Keep things moving</h2><Link href="/admin/products/new"><PackagePlus size={18} />Add a product <span>→</span></Link><Link href="/admin/products"><Shirt size={18} />Manage products <span>→</span></Link><Link href="/admin/categories"><Tags size={18} />Manage categories <span>→</span></Link><Link href="/admin/settings"><Settings size={18} />Update store settings <span>→</span></Link></section></div>
      <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Your storefront</p><h2>Configured collections</h2></div><Link href="/" target="_blank" className="text-link">Open store ↗</Link></div><div className="category-chips">{categories.map((category) => <span key={category.id}>{category.name}</span>)}</div></section>
    </>}
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}
