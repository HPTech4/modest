import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Seo from "../components/Seo";
import SiteLayout from "../components/SiteLayout";
import ProductCard from "../components/ProductCard";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "../components/States";
import { getPublicProducts, readableDataError } from "../lib/data";
import type { Product } from "../lib/types";
import { useStore } from "../contexts/StoreContext";
import { OFFICIAL_BRAND_NAME } from "../lib/types";

export default function Shop() {
  const { categories, isDemo } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setLoading(true); setError(null); void getPublicProducts().then(setProducts).catch((cause) => setError(readableDataError(cause, "The catalogue could not be loaded."))).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => {
    let result = products;
    if (category) result = result.filter((product) => product.category?.slug === category);
    if (search.trim()) {
      const term = search.trim().toLocaleLowerCase();
      result = result.filter((product) => `${product.name} ${product.description ?? ""}`.toLocaleLowerCase().includes(term));
    }
    return [...result].sort((a, b) => {
      if (sort === "price-asc") return (a.price_minor ?? Number.MAX_SAFE_INTEGER) - (b.price_minor ?? Number.MAX_SAFE_INTEGER);
      if (sort === "price-desc") return (b.price_minor ?? -1) - (a.price_minor ?? -1);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, category, search, sort]);
  const pricedCount = filtered.filter((product) => product.price_minor !== null).length;
  return <SiteLayout><Seo title={`Shop modest wear in Nigeria | ${OFFICIAL_BRAND_NAME}`} description="Browse published abayas, hijabs, khimars, jilbabs, modest gowns and custom-made modest outfits from Mustaqeem Stitches and Collection in Nigeria." /><div className="page-container shop-page"><PageHeading eyebrow="The collection" title="Shop modest wear in Nigeria" description="Explore published abayas, hijabs, khimars, jilbabs, modest gowns and custom-made outfits from Mustaqeem Stitches and Collection." />
    <div className="catalogue-tools"><label className="search-field"><Search size={18} /><span className="sr-only">Search products by name</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pieces" /></label><label className="select-field"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><label className="select-field"><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Recently added</option><option value="price-asc" disabled={pricedCount < 2}>Price: low to high</option><option value="price-desc" disabled={pricedCount < 2}>Price: high to low</option></select></label></div>
    <p className="catalogue-count">{filtered.length} {filtered.length === 1 ? "piece" : "pieces"}{isDemo && <span> · illustrative preview</span>}</p>
    {loading ? <LoadingState label="Loading the collection" /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} demo={isDemo} />)}</div> : search || category ? <div className="empty-state"><span className="empty-state__rule" /><h3>No pieces found</h3><p>Try another search or category.</p><button type="button" className="button button--text" onClick={() => { setSearch(""); setCategory(""); setSort("newest"); }}>Clear search and filters</button></div> : <EmptyState title="The collection is being prepared" message="Published products will appear here when the store owner adds them." actionHref="/contact" actionLabel="Ask about a custom piece" />}
  </div></SiteLayout>;
}
