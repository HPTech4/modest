import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Seo from "../components/Seo";
import SiteLayout from "../components/SiteLayout";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import ImageWithFallback from "../components/ImageWithFallback";
import CustomOrderEnquiry from "../components/CustomOrderEnquiry";
import { ErrorState, EmptyState, LoadingState } from "../components/States";
import { getPublicProducts, readableDataError } from "../lib/data";
import { DEMO_ASSETS } from "../lib/demo-data";
import type { Product } from "../lib/types";
import { useStore } from "../contexts/StoreContext";

export default function Home() {
  const { categories, settings, isDemo } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void getPublicProducts().then((items) => { if (active) setProducts(items); }).catch((cause) => { if (active) setError(readableDataError(cause, "The collection could not be loaded.")); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const featured = products.filter((product) => product.is_featured);
  const newArrivals = products.filter((product) => product.is_new_arrival);
  return <SiteLayout>
    <Seo title={`${settings.brand_name || "Your Brand"} | Modest fashion` } description="Discover thoughtfully designed modest wear that brings together comfort, confidence, and timeless style." image={DEMO_ASSETS.hero} />
    <section className="hero">
      <div className="hero__copy"><p className="eyebrow">A considered wardrobe</p><h1>Elegance in<br /><em>Every Layer.</em></h1><p className="hero__description">Discover thoughtfully designed modest wear that brings together comfort, confidence, and timeless style.</p><div className="hero__actions"><Link className="button button--primary" href="/shop">Explore the Collection <ArrowRight size={17} /></Link><Link className="button button--text" href="/contact#custom-order">Order on WhatsApp <ArrowUpRight size={17} /></Link></div><p className="hero__note">Illustrative fashion styling · sample imagery</p></div>
      <div className="hero__image"><ImageWithFallback src={DEMO_ASSETS.hero} alt="Illustrative modest-fashion styling in warm ivory and sand tones" className="hero__photo" fallbackLabel="Editorial fashion image" /><div className="hero__image-caption"><span>01 / 04</span><span>Layers of quiet confidence</span></div></div>
      <span className="hero__side-label" aria-hidden="true">MODEST DRESSING, CONSIDERED</span>
    </section>
    <section className="section category-section">
      <div className="section-heading section-heading--split"><div><p className="eyebrow">Find your layer</p><h2>Pieces for the<br /><em>way you move.</em></h2></div><p>Explore thoughtfully arranged collections, from everyday essentials to pieces made around your own idea.</p></div>
      <div className="category-grid">{categories.map((category) => <CategoryCard key={category.id} category={category} demo={isDemo} />)}</div>
    </section>
    <section className="section section--sand">
      <div className="section-heading section-heading--row"><div><p className="eyebrow">Chosen for you</p><h2>Featured pieces</h2></div><Link className="text-link" href="/shop">View the collection <ArrowRight size={16} /></Link></div>
      {loading ? <LoadingState label="Loading selected pieces" /> : error ? <ErrorState message={error} onRetry={() => { setLoading(true); void getPublicProducts().then(setProducts).catch((cause) => setError(readableDataError(cause))).finally(() => setLoading(false)); }} /> : featured.length ? <div className="product-grid">{featured.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} demo={isDemo} />)}</div> : <EmptyState title="A collection in the making" message={isDemo ? "Sample pieces will be replaced with the store's confirmed products." : "Products selected as featured by the store owner will appear here."} actionHref="/shop" actionLabel="Browse the shop" />}
    </section>
    {newArrivals.length > 0 && <section className="section"><div className="section-heading section-heading--row"><div><p className="eyebrow">Just added</p><h2>New arrivals</h2></div><Link className="text-link" href="/shop">Explore all pieces <ArrowRight size={16} /></Link></div><div className="product-grid">{newArrivals.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} demo={isDemo} />)}</div></section>}
    <section className="custom-feature" id="custom-order"><div className="custom-feature__image"><ImageWithFallback src={DEMO_ASSETS.khimar} alt="Illustrative flowing sand-coloured modestwear styling" className="custom-feature__photo" fallbackLabel="Illustrative styling image" /></div><div className="custom-feature__copy"><p className="eyebrow">Made around your idea</p><h2>A piece that<br /><em>begins with you.</em></h2><p>Have a style in mind? Begin with a simple conversation about the details you would like to explore. Measurements are not needed to start.</p><CustomOrderEnquiry compact /></div></section>
    <section className="story-section section"><div className="story-section__label"><p className="eyebrow">The point of view</p><span className="story-section__number">01 — 03</span></div><div className="story-section__body"><h2>Modesty, with room<br />for <em>your expression.</em></h2><p>{settings.about_text?.trim() || "A space for considered modest dressing — thoughtfully layered, easy to wear, and shaped around the details that matter to you."}</p><Link className="text-link" href="/about">Discover the brand <ArrowRight size={16} /></Link></div></section>
    {settings.approved_testimonials.length > 0 && <section className="testimonial-section"><p className="eyebrow">Kind words</p><h2>Shared with permission</h2><div className="testimonial-grid">{settings.approved_testimonials.map((quote, index) => <blockquote key={`${index}-${quote.slice(0, 12)}`}>“{quote}”</blockquote>)}</div></section>}
  </SiteLayout>;
}
