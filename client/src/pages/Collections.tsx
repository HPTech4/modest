import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import Seo from "../components/Seo";
import SiteLayout from "../components/SiteLayout";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "../components/States";
import { getPublicProducts, readableDataError } from "../lib/data";
import type { Product } from "../lib/types";
import { useStore } from "../contexts/StoreContext";

export function CollectionsIndex() {
  const { categories, isDemo } = useStore();
  return <SiteLayout><Seo title="Collections | Modest fashion" description="Explore abayas, hijabs, khimars, jilbabs, modest gowns and custom-made outfits." /><div className="page-container"><PageHeading eyebrow="Explore by collection" title="A layer for every moment" description="Browse the categories and find the kind of piece you have in mind." /><div className="category-grid category-grid--page">{categories.map((category) => <CategoryCard key={category.id} category={category} demo={isDemo} />)}</div></div></SiteLayout>;
}

export function CategoryPage() {
  const [, params] = useRoute<{ slug: string }>("/collections/:slug");
  const { categories, isDemo, loading: storeLoading, error: storeError, reload } = useStore();
  const slug = params?.slug ?? "";
  const category = categories.find((item) => item.slug === slug);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setLoading(true); setError(null); void getPublicProducts({ categorySlug: slug }).then(setProducts).catch((cause) => setError(readableDataError(cause, "This collection could not be loaded."))).finally(() => setLoading(false)); };
  useEffect(() => { if (slug && !storeLoading && category) load(); }, [slug, storeLoading, category]);
  useEffect(() => {
    if (!slug || storeLoading || storeError || category) return;
    window.location.replace("/404");
  }, [category, slug, storeError, storeLoading]);
  return <SiteLayout><Seo title={`${category?.name ?? "Collection"} | Modest fashion`} description={category?.description || `Browse ${category?.name ?? "modest fashion"} from the collection.`} />
    <div className="page-container"><div className="breadcrumb"><Link href="/collections">Collections</Link><span>/</span><span>{category?.name ?? "Collection"}</span></div>
      <PageHeading eyebrow="Collection" title={category?.name ?? "Collection"} description={category?.description ?? "Explore the published pieces in this collection."} />
      {storeError ? <ErrorState message={storeError} onRetry={() => { void reload(); }} /> : loading ? <LoadingState label="Loading this collection" /> : error ? <ErrorState message={error} onRetry={load} /> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} demo={isDemo} />)}</div> : <EmptyState title="This collection is still taking shape" message="There are no published products in this category yet. Check back later or ask about a custom piece." actionHref="/contact#custom-order" actionLabel="Ask about a custom order" />}
    </div>
  </SiteLayout>;
}
