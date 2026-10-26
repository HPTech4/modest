import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useStore } from "../contexts/StoreContext";
import { DEMO_ASSETS } from "../lib/demo-data";
import ImageWithFallback from "./ImageWithFallback";
import WhatsAppAction from "./WhatsAppAction";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function Brand() {
  const { settings } = useStore();
  const mark = settings.logo_path?.startsWith("https://") ? settings.logo_path : DEMO_ASSETS.mark;
  return <Link href="/" className="brand-lockup" aria-label={`${settings.brand_name || "Your Brand"} home`}>
    <ImageWithFallback src={mark} alt="" className="brand-mark" fallbackLabel="" />
    <span className="brand-name">{settings.brand_name?.trim() || "Your Brand"}</span>
  </Link>;
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  return <header className="site-header">
    <div className="site-header__inner">
      <Brand />
      <nav id="site-navigation" className={`site-nav ${menuOpen ? "site-nav--open" : ""}`} aria-label="Main navigation">
        {navItems.map((item) => <Link key={item.href} href={item.href} onClick={close}>{item.label}</Link>)}
        <div className="site-nav__mobile-action"><WhatsAppAction label="WhatsApp" variant="primary" /></div>
      </nav>
      <div className="site-header__actions"><WhatsAppAction label="WhatsApp" variant="secondary" className="desktop-only" />
        <button type="button" className="menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </div>
  </header>;
}

function Footer() {
  const { settings, categories } = useStore();
  return <footer className="site-footer">
    <div className="site-footer__top">
      <div className="site-footer__brand"><Brand /><p>Thoughtfully considered modest wear, with each detail chosen to feel at ease.</p></div>
      <div><p className="eyebrow">Explore</p><ul>{categories.slice(0, 4).map((category) => <li key={category.id}><Link href={`/collections/${category.slug}`}>{category.name}</Link></li>)}<li><Link href="/shop">Shop all</Link></li></ul></div>
      <div><p className="eyebrow">Information</p><ul><li><Link href="/sizing">Sizing</Link></li><li><Link href="/delivery">Delivery</Link></li><li><Link href="/exchanges">Exchange information</Link></li><li><Link href="/privacy">Privacy</Link></li><li><Link href="/faq">FAQ</Link></li></ul></div>
      <div><p className="eyebrow">Get in touch</p><ul>{settings.contact_email && <li><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></li>}{settings.contact_phone && <li><a href={`tel:${settings.contact_phone}`}>{settings.contact_phone}</a></li>}{settings.location_text && <li>{settings.location_text}</li>}{settings.instagram_url && <li><a href={settings.instagram_url} target="_blank" rel="noreferrer">Instagram ↗</a></li>}<li><WhatsAppAction label="Message the store" variant="text" /></li></ul></div>
    </div>
    <div className="site-footer__bottom"><span>© {new Date().getFullYear()} {settings.brand_name?.trim() || "Your Brand"}. All rights reserved.</span><span>Modest fashion · Nigeria</span></div>
  </footer>;
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  const { settings, isDemo, error } = useStore();
  return <div className="site-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    {settings.announcement_enabled && settings.announcement_text?.trim() && <div className="announcement-bar">{settings.announcement_text}</div>}
    {isDemo && <div className="preview-strip" role="status">Preview mode · illustrative sample products and styling images, not client product photographs.</div>}
    <Header />
    {error && <div className="store-error" role="status">Store information could not be refreshed. {error}</div>}
    <main id="main-content">{children}</main>
    <Footer />
  </div>;
}
