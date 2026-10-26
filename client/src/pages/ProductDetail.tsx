import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { Check, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Seo from "../components/Seo";
import SiteLayout from "../components/SiteLayout";
import ImageWithFallback from "../components/ImageWithFallback";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { getPublicProductBySlug, readableDataError } from "../lib/data";
import { formatNaira } from "../lib/format";
import { buildProductEnquiryUrl, buildUnavailableEnquiryUrl } from "../lib/whatsapp";
import { useStore } from "../contexts/StoreContext";
import type { Product } from "../lib/types";

export default function ProductDetail() {
  const [, params] = useRoute<{ slug: string }>("/product/:slug");
  const slug = params?.slug ?? "";
  const { settings } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [colour, setColour] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const load = () => { setLoading(true); setError(null); void getPublicProductBySlug(slug).then((item) => { setProduct(item); setSize(""); setColour(""); setActiveImage(0); }).catch((cause) => setError(readableDataError(cause, "Product details could not be loaded."))).finally(() => setLoading(false)); };
  useEffect(() => { if (slug) load(); }, [slug]);
  useEffect(() => { if (!loading && !error && !product) window.location.replace("/404"); }, [error, loading, product]);
  const image = product?.images[activeImage]?.url ?? product?.images[activeImage]?.storage_path ?? product?.main_image_path ?? undefined;
  function handleOrder() {
    if (!product) return;
    if (product.sizes.length > 0 && !size) { setAttempted(true); toast.error("Choose a size before continuing."); return; }
    if (product.colours.length > 0 && !colour) { setAttempted(true); toast.error("Choose a colour before continuing."); return; }
    if (quantity < 1 || quantity > 99) { setAttempted(true); toast.error("Choose a quantity between 1 and 99."); return; }
    const url = buildProductEnquiryUrl(settings.whatsapp_number, product, { size, colour, quantity });
    if (!url) { toast.error(settings.whatsapp_number ? "This enquiry could not be prepared. Check your selections." : "WhatsApp is not configured yet. Please contact the store owner for ordering information."); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  }
  function handleUnavailableEnquiry() {
    if (!product) return;
    const url = buildUnavailableEnquiryUrl(settings.whatsapp_number, product);
    if (!url) { toast.error("WhatsApp is not configured yet. Please contact the store owner for information."); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  }
  if (loading) return <SiteLayout><div className="page-container"><LoadingState label="Loading product" /></div></SiteLayout>;
  if (error) return <SiteLayout><div className="page-container"><ErrorState message={error} onRetry={load} /></div></SiteLayout>;
  if (!product) return <SiteLayout><div className="page-container"><EmptyState title="This piece is not available" message="It may have been unpublished or the link may have changed." actionHref="/shop" actionLabel="Return to the shop" /></div></SiteLayout>;
  return <SiteLayout><Seo title={`${product.name} | ${product.category?.name ?? "Modest fashion"}`} description={product.description || `Explore ${product.name} in the modest-fashion collection.`} image={image} />
    <div className="page-container product-detail"><div className="breadcrumb"><Link href="/shop">Shop</Link><span>/</span>{product.category && <><Link href={`/collections/${product.category.slug}`}>{product.category.name}</Link><span>/</span></>}<span>{product.name}</span></div>
      <div className="product-detail__layout"><div className="product-gallery"><div className="product-gallery__main"><ImageWithFallback src={image} alt={product.images[activeImage]?.alt_text || product.name} className="product-gallery__photo" fallbackLabel="Fashion image" />{product.is_demo && <span className="sample-ribbon">Illustrative sample styling</span>}{product.images.length > 1 && <div className="gallery-controls"><button type="button" aria-label="Previous image" onClick={() => setActiveImage((index) => (index - 1 + product.images.length) % product.images.length)}><ChevronLeft /></button><span>{activeImage + 1} / {product.images.length}</span><button type="button" aria-label="Next image" onClick={() => setActiveImage((index) => (index + 1) % product.images.length)}><ChevronRight /></button></div>}</div>
        {product.images.length > 1 && <div className="product-gallery__thumbs">{product.images.map((item, index) => <button key={item.id ?? item.storage_path} type="button" aria-label={`Show image ${index + 1}`} aria-pressed={activeImage === index} onClick={() => setActiveImage(index)}><ImageWithFallback src={item.url ?? item.storage_path} alt="" className="product-gallery__thumb" /></button>)}</div>}</div>
        <div className="product-detail__info"><p className="eyebrow">{product.category?.name ?? "Collection"}{product.is_demo && " · illustrative sample"}</p><h1>{product.name}</h1><p className="product-detail__price">{formatNaira(product.price_minor)}</p>{product.price_minor === null && <p className="product-detail__note">Please enquire to confirm current pricing.</p>}
          <p className="product-detail__description">{product.description || "Product details will be added by the store owner."}</p>
          {product.is_available ? <p className="availability"><Check size={16} /> Availability to be confirmed by the store</p> : <p className="availability availability--muted">Currently unavailable</p>}
          {product.sizes.length > 0 && <label className="form-field">Size <select value={size} onChange={(event) => { setSize(event.target.value); setAttempted(false); }} aria-invalid={attempted && !size}><option value="">Choose a size</option>{product.sizes.map((item) => <option key={item}>{item}</option>)}</select>{attempted && !size && <span className="field-error">Choose an available size.</span>}</label>}
          {product.colours.length > 0 && <label className="form-field">Colour <select value={colour} onChange={(event) => { setColour(event.target.value); setAttempted(false); }} aria-invalid={attempted && !colour}><option value="">Choose a colour</option>{product.colours.map((item) => <option key={item}>{item}</option>)}</select>{attempted && !colour && <span className="field-error">Choose an available colour.</span>}</label>}
          {product.is_available && <label className="form-field product-quantity">Quantity <input type="number" inputMode="numeric" min={1} max={99} value={quantity} onChange={(event) => setQuantity(Math.min(99, Math.max(1, Number(event.target.value) || 1)))} /></label>}
          {product.is_available ? <button type="button" className="button button--primary product-order-button" onClick={handleOrder}><MessageCircle size={17} /> Enquire on WhatsApp</button> : <button type="button" className="button button--secondary product-order-button" onClick={handleUnavailableEnquiry}>Ask about a similar piece</button>}
          <div className="product-meta">{product.fabric && <p><span>Fabric</span>{product.fabric}</p>}{product.care_instructions && <p><span>Care</span>{product.care_instructions}</p>}</div>
          <p className="product-detail__small">Your message opens WhatsApp with an enquiry. Availability, final price and delivery are confirmed directly with the store.</p>
        </div></div>
    </div>
  </SiteLayout>;
}
