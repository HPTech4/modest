import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "../components/States";
import { useStore } from "../contexts/StoreContext";
import { getPublicSettings, readableDataError, saveStoreSettings } from "../lib/data";
import { normalizeWhatsAppNumber } from "../lib/whatsapp";
import { DEFAULT_SETTINGS, type StoreSettings } from "../lib/types";

export default function AdminSettings() {
  const { reload } = useStore();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setLoading(true); setError(null); void getPublicSettings().then(setSettings).catch((cause) => setError(readableDataError(cause, "Settings could not be loaded."))).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  function update<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (settings.whatsapp_number?.trim() && !normalizeWhatsAppNumber(settings.whatsapp_number)) { setError("Enter a valid international WhatsApp number using digits and optional spaces or +. Example format: +234…"); return; }
    if (settings.instagram_url?.trim()) {
      try { const url = new URL(settings.instagram_url); if (url.protocol !== "https:") throw new Error(); }
      catch { setError("Instagram URL must be a valid HTTPS address."); return; }
    }
    if (settings.logo_path?.trim()) {
      try { const url = new URL(settings.logo_path); if (url.protocol !== "https:") throw new Error(); }
      catch { setError("Logo URL must be a valid HTTPS address."); return; }
    }
    setBusy(true);
    try { await saveStoreSettings(settings); await reload(); toast.success("Store settings saved."); }
    catch (cause) { setError(readableDataError(cause, "Settings could not be saved.")); }
    finally { setBusy(false); }
  }
  if (loading) return <div className="admin-page"><LoadingState label="Loading settings" /></div>;
  if (error && !settings.brand_name && !settings.id) return <div className="admin-page"><ErrorState message={error} onRetry={load} /></div>;
  return <div className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Store identity</p><h1>Store settings</h1><p>Keep the public-facing information accurate and current.</p></div><Link className="button button--secondary" href="/" target="_blank">View storefront <ExternalLink size={15} /></Link></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <form className="settings-layout" onSubmit={submit}><div className="settings-main">
      <section className="admin-panel"><p className="eyebrow">Brand and contact</p><h2>How customers find you</h2><div className="form-grid"><label className="form-field">Brand name<input value={settings.brand_name ?? ""} onChange={(event) => update("brand_name", event.target.value || null)} maxLength={100} placeholder="Your brand name" /></label><label className="form-field">Logo URL <span className="field-optional">(optional HTTPS link)</span><input type="url" value={settings.logo_path ?? ""} onChange={(event) => update("logo_path", event.target.value || null)} placeholder="https://…" /></label><label className="form-field">WhatsApp number<input type="tel" value={settings.whatsapp_number ?? ""} onChange={(event) => update("whatsapp_number", event.target.value || null)} placeholder="+234…" /><small>Use the full international number; links remove spaces and the + sign.</small></label><label className="form-field">Instagram URL<input type="url" value={settings.instagram_url ?? ""} onChange={(event) => update("instagram_url", event.target.value || null)} placeholder="https://instagram.com/…" /></label><label className="form-field">Contact email<input type="email" value={settings.contact_email ?? ""} onChange={(event) => update("contact_email", event.target.value || null)} /></label><label className="form-field">Contact phone<input type="tel" value={settings.contact_phone ?? ""} onChange={(event) => update("contact_phone", event.target.value || null)} /></label><label className="form-field form-field--wide">Location text <span className="field-optional">(optional)</span><input value={settings.location_text ?? ""} onChange={(event) => update("location_text", event.target.value || null)} placeholder="Only add public information the store wants displayed" /></label></div></section>
      <section className="admin-panel"><p className="eyebrow">Homepage</p><h2>What visitors see first</h2><label className="form-field">Announcement text<textarea rows={2} maxLength={300} value={settings.announcement_text ?? ""} onChange={(event) => update("announcement_text", event.target.value || null)} placeholder="Leave blank if there is no announcement." /></label><label className="checkbox-line"><input type="checkbox" checked={settings.announcement_enabled} onChange={(event) => update("announcement_enabled", event.target.checked)} />Show announcement bar when text is present</label><label className="form-field">About introduction<textarea rows={5} maxLength={3000} value={settings.about_text ?? ""} onChange={(event) => update("about_text", event.target.value || null)} placeholder="Add the approved brand introduction; no biography is required." /></label></section>
      <section className="admin-panel"><p className="eyebrow">Customer information</p><h2>Helpful details</h2><label className="form-field">Sizing information<textarea rows={3} value={settings.sizing_information ?? ""} onChange={(event) => update("sizing_information", event.target.value || null)} /></label><label className="form-field">Delivery information<textarea rows={3} value={settings.delivery_information ?? ""} onChange={(event) => update("delivery_information", event.target.value || null)} /></label><label className="form-field">Exchange and return information<textarea rows={3} value={settings.exchange_policy ?? ""} onChange={(event) => update("exchange_policy", event.target.value || null)} /></label><label className="form-field">Privacy information<textarea rows={3} value={settings.privacy_information ?? ""} onChange={(event) => update("privacy_information", event.target.value || null)} /></label><label className="form-field">FAQ information <span className="field-optional">(separate paragraphs with a blank line)</span><textarea rows={4} value={settings.faq_information ?? ""} onChange={(event) => update("faq_information", event.target.value || null)} /></label></section>
      <section className="admin-panel"><p className="eyebrow">Customer words</p><h2>Approved testimonials</h2><p>Only include genuine testimonials whose authors have approved publication. Enter one quote per line; leave blank to hide this section.</p><label className="form-field"><span className="sr-only">Approved testimonials, one per line</span><textarea rows={5} value={(settings.approved_testimonials ?? []).join("\n")} onChange={(event) => update("approved_testimonials", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} placeholder="One approved quote per line" /></label></section>
    </div><aside className="settings-aside"><section className="admin-panel editor-actions"><p className="eyebrow">Save your changes</p><p>Settings appear on the storefront after they are saved.</p><button className="button button--primary button--full" type="submit" disabled={busy}><Save size={16} />{busy ? "Saving…" : "Save settings"}</button></section><section className="admin-panel editor-tip"><p className="eyebrow">Privacy and accuracy</p><p>Only public contact information belongs here. Do not add passwords, API keys, private customer details or policies that have not been approved.</p></section></aside></form>
  </div>;
}
