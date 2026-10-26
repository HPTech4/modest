import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import ImageWithFallback from "./ImageWithFallback";
import { formatNaira } from "../lib/format";
import type { Product } from "../lib/types";
import WhatsAppAction from "./WhatsAppAction";

export function productImage(product: Product): string | undefined {
  if (product.main_image_path?.startsWith("/manus-storage/")) return product.main_image_path;
  const main = product.images.find((image) => image.storage_path === product.main_image_path || image.sort_order === 0);
  return main?.url ?? product.images[0]?.url ?? undefined;
}

export default function ProductCard({ product, demo = false }: { product: Product; demo?: boolean }) {
  const isDemo = demo || product.is_demo;
  const requiresChoices = product.sizes.length > 0 || product.colours.length > 0;
  const mainImage = product.images.find((image) => image.storage_path === product.main_image_path) ?? product.images[0];
  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-card__image-link" aria-label={`View ${product.name}`}>
        <div className="product-card__image-wrap">
          <ImageWithFallback src={productImage(product)} alt={mainImage?.alt_text || product.name} className="product-card__image" fallbackLabel="Fashion image" />
          {isDemo && <span className="sample-ribbon">Illustrative sample</span>}
          {!product.is_available && <span className="product-badge product-badge--muted">Unavailable</span>}
        </div>
      </Link>
      <div className="product-card__details">
        <div>
          <p className="eyebrow">{product.category?.name ?? "Collection"}</p>
          <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
          <p className="product-card__price">{formatNaira(product.price_minor)}</p>
          {(product.colours.length > 0 || product.sizes.length > 0) && <p className="product-card__options">{[product.colours.length ? `${product.colours.length} colours` : "", product.sizes.length ? `${product.sizes.length} sizes` : ""].filter(Boolean).join(" · ")}</p>}
        </div>
        <Link href={`/product/${product.slug}`} className="icon-link" aria-label={`View details for ${product.name}`}><ArrowUpRight size={18} /></Link>
      </div>
      <div className="product-card__actions">
        {product.is_available && !requiresChoices
          ? <WhatsAppAction label="Enquire on WhatsApp" kind="product" product={product} options={{ quantity: 1 }} variant="text" className="product-card__whatsapp" />
          : <Link href={`/product/${product.slug}`} className="text-link">{product.is_available ? "Choose options" : "Check availability"} <ArrowUpRight size={15} /></Link>}
        <Link href={`/product/${product.slug}`} className="product-card__details-link">View details</Link>
      </div>
    </article>
  );
}
