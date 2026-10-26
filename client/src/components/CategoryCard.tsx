import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "../lib/types";
import { DEMO_ASSETS } from "../lib/demo-data";
import ImageWithFallback from "./ImageWithFallback";

const fallbackBySlug: Record<string, string> = {
  abayas: DEMO_ASSETS.abaya,
  hijabs: DEMO_ASSETS.hijab,
  khimars: DEMO_ASSETS.khimar,
  jilbabs: DEMO_ASSETS.abaya,
  "modest-gowns": DEMO_ASSETS.gown,
  "custom-made-outfits": DEMO_ASSETS.hero,
};

export default function CategoryCard({ category, demo = false }: { category: Category; demo?: boolean }) {
  const custom = category.slug === "custom-made-outfits";
  const href = custom ? "/contact#custom-order" : `/collections/${category.slug}`;
  const hasConfiguredImage = Boolean(category.image_path?.startsWith("https://") || category.image_path?.startsWith("/manus-storage/"));
  const image = hasConfiguredImage ? category.image_path ?? undefined : fallbackBySlug[category.slug];
  return <article className="category-card">
    <Link href={href} className="category-card__link">
      <div className="category-card__image-wrap"><ImageWithFallback src={image} alt={category.name} className="category-card__image" fallbackLabel="Collection image" />{(demo || !hasConfiguredImage) && <span className="sample-ribbon">Illustrative image</span>}</div>
      <div className="category-card__copy"><div><h3>{category.name}</h3>{category.description && <p>{category.description}</p>}</div><span className="icon-link" aria-hidden="true"><ArrowUpRight size={18} /></span></div>
    </Link>
  </article>;
}
