import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { isBrowserSafeSupabaseKey, isSafeSupabaseProjectUrl } from "./supabase-key-policy.mjs";
import { normalizePublicSiteOrigin } from "./site-origin-policy.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "dist", "public");
const indexPath = path.join(publicRoot, "index.html");
const template = await readFile(indexPath, "utf8");
const viteEnv = loadEnv("production", projectRoot, "VITE_");
const env = { ...viteEnv, ...process.env };
const BRAND = "Mustaqeem Stitches and Collection";
const HERO_IMAGE = "/manus-storage/async-images/wibZDKxW79B93X58fL0Cl2/image-1.webp";
const SEED_CATEGORIES = [
  { name: "Abayas", slug: "abayas" },
  { name: "Hijabs", slug: "hijabs" },
  { name: "Khimars", slug: "khimars" },
  { name: "Jilbabs", slug: "jilbabs" },
  { name: "Custom-Made Outfits", slug: "custom-made-outfits" },
  { name: "Modest Gowns", slug: "modest-gowns" },
];

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const validSlug = (value) => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const plainText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const clip = (value, max) => value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
const links = (items) => `<ul>${items.map(([href, label]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join("")}</ul>`;

async function readPublicCatalog() {
  const supabaseUrl = String(env.VITE_SUPABASE_URL ?? "").trim();
  const publishableKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  const legacyAnonKey = String(env.VITE_SUPABASE_ANON_KEY || "").trim();
  if ([publishableKey, legacyAnonKey].some((value) => value && !isBrowserSafeSupabaseKey(value))) {
    throw new Error("Refusing to query the catalog with an unrecognized or privileged Supabase browser key.");
  }
  const supabaseKey = publishableKey || legacyAnonKey;
  if (!supabaseUrl || !supabaseKey) {
    console.info("Supabase build-time product SEO snapshot skipped: public project URL/publishable-or-anon key not configured.");
    return { categories: SEED_CATEGORIES, products: [] };
  }
  if (!isSafeSupabaseProjectUrl(supabaseUrl)) {
    throw new Error("Refusing to query the catalog with an invalid Supabase project URL.");
  }

  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const [categoryResult, productResult] = await Promise.all([
      db.from("categories").select("id,name,slug,description,is_visible").eq("is_visible", true).order("sort_order"),
      db.from("products")
        .select("name,slug,description,price_minor,is_available,sizes,colours,status,category:categories!inner(name,slug)")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]);
    if (categoryResult.error || productResult.error) {
      throw new Error("Public category or product query was rejected; verify migrations and public RLS policies.");
    }
    const categories = (categoryResult.data ?? []).filter((item) => item.is_visible === true && validSlug(item.slug)).map(({ name, slug, description }) => ({
      name: plainText(name), slug, description: plainText(description),
    }));
    const visibleSlugs = new Set(categories.map((item) => item.slug));
    const products = (productResult.data ?? []).filter((item) => item.status === "published" && validSlug(item.slug)).filter((item) => {
      const relation = Array.isArray(item.category) ? item.category[0] : item.category;
      return relation && visibleSlugs.has(relation.slug);
    }).map((item) => ({
      ...item,
      name: plainText(item.name),
      description: plainText(item.description),
      category: Array.isArray(item.category) ? item.category[0] : item.category,
    }));
    console.info(`Prerender catalog snapshot: ${categories.length} visible categories and ${products.length} RLS-readable published products.`);
    return { categories, products };
  } catch {
    console.warn("Supabase build-time catalog snapshot unavailable; live browser queries remain enabled. Verify public RLS and connection before relying on product SEO snapshots.");
    return { categories: [], products: [] };
  }
}

const catalog = await readPublicCatalog();
const categories = catalog.categories;
const categoryLinks = categories.map(({ name, slug }) => [`/collections/${slug}`, name]);
const homeBody = `<main id="main-content" class="seo-fallback-content"><section class="seo-fallback-hero"><p class="eyebrow">Modest Islamic fashion · Nigeria</p><h1>Mustaqeem Stitches and Collection</h1><p>Discover abayas, hijabs, khimars, jilbabs, modest gowns and custom-made outfits from Mustaqeem Stitches and Collection in Nigeria.</p><p class="seo-fallback-note">This editorial image is illustrative styling, not a photograph of a product.</p><img src="${HERO_IMAGE}" alt="Illustrative modest-fashion editorial styling reference, not a product photograph" width="1920" height="1080" fetchpriority="high" /><p><a href="/collections">Explore modest-fashion collections</a> · <a href="/shop">Browse the catalogue</a> · <a href="/contact">Contact Mustaqeem Stitches</a></p><p><a href="https://wa.me/2349015790659?text=${encodeURIComponent(`Hello ${BRAND}, I would like to enquire about your modest-fashion collection.`)}">WhatsApp 09015790659</a></p></section><section><h2>Modest wear in Nigeria</h2><p>Explore abayas, hijabs, khimars, jilbabs, modest gowns and custom-made modest outfits.</p>${links(categoryLinks)}</section></main>`;

const pages = [
  { path: "/", title: "Mustaqeem Stitches and Collection | Modest Wear Nigeria", description: "Modest Islamic women's fashion in Nigeria: abayas, hijabs, khimars, jilbabs, modest gowns and custom-made outfits.", body: homeBody },
  { path: "/shop", title: "Shop Modest Wear in Nigeria | Mustaqeem Stitches", description: "Browse published abayas, hijabs, khimars, jilbabs, modest gowns and custom-made modest outfits from Mustaqeem Stitches and Collection in Nigeria.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">The collection · Nigeria</p><h1>Shop modest wear in Nigeria</h1><p>Browse published abayas, hijabs, khimars, jilbabs, modest gowns and custom-made outfits from Mustaqeem Stitches and Collection.</p><p>Only products published by the store owner are shown in the live catalogue.</p><p><a href="/collections">Explore collections</a> · <a href="/contact">Ask about a custom-made piece</a></p></main>` },
  { path: "/collections", title: `Collections | ${BRAND}`, description: "Explore abayas, hijabs, khimars, jilbabs, custom-made outfits and modest gowns from Mustaqeem Stitches and Collection in Nigeria.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Collections · Nigeria</p><h1>Modest-fashion collections in Nigeria</h1><p>Browse abayas, hijabs, khimars, jilbabs, custom-made outfits and modest gowns from Mustaqeem Stitches and Collection.</p>${links(categoryLinks)}</main>` },
  { path: "/about", title: `About ${BRAND}`, description: "Learn about Mustaqeem Stitches and Collection, a Nigerian modest Islamic women's fashion brand for abayas, hijabs, khimars, jilbabs, gowns and custom outfits.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Our story</p><h1>About Mustaqeem Stitches and Collection</h1><p>The owner's approved brand story and design approach will appear here. No founder biography or business history has been assumed.</p><a href="/contact">Contact the store</a></main>` },
  { path: "/contact", title: `Contact ${BRAND} | Nigeria`, description: "Contact Mustaqeem Stitches and Collection about modest wear in Nigeria. Ask to confirm availability in Ibadan, Ayegun, Olomi or Olunde.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Get in touch</p><h1>Contact Mustaqeem Stitches and Collection</h1><p>WhatsApp the store on 09015790659 to enquire about abayas, hijabs, khimars, jilbabs, modest gowns and custom-made outfits.</p><p>Looking for modest wear in Ibadan, Ayegun, Olomi or Olunde? Contact the store to confirm current availability and ordering details for your area.</p><a href="https://wa.me/2349015790659?text=${encodeURIComponent(`Hello ${BRAND}, I would like to enquire about modest wear.`)}">Send a WhatsApp enquiry</a></main>` },
  { path: "/faq", title: `Modest Wear FAQs | Mustaqeem Stitches`, description: "Answers about modest wear enquiries, pricing and custom-made outfits from Mustaqeem Stitches and Collection in Nigeria.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Helpful details</p><h1>Frequently asked questions</h1><p>Ask the store to confirm product availability, current prices and ordering details before placing an enquiry. WhatsApp messages begin an enquiry only; they do not complete an order or payment.</p><a href="/contact">Contact the store</a></main>` },
  { path: "/sizing", title: `Sizing Information | Mustaqeem Stitches`, description: "Read the sizing information supplied by Mustaqeem Stitches and Collection for modest Islamic women's fashion.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Information</p><h1>Sizing information</h1><p>Product-specific size options appear on each published listing when supplied. Contact the store to confirm sizing details for a piece.</p></main>` },
  { path: "/delivery", title: `Delivery Information | Mustaqeem Stitches`, description: "Review delivery information confirmed by Mustaqeem Stitches and Collection before ordering modest wear in Nigeria.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Information</p><h1>Delivery information</h1><p>Delivery areas, timing, fees and methods have not been supplied. Contact the store to confirm delivery details for your area before ordering.</p></main>` },
  { path: "/exchanges", title: `Exchanges | Mustaqeem Stitches`, description: "Review the exchange and return information supplied by Mustaqeem Stitches and Collection before placing an enquiry.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Information</p><h1>Exchanges and returns</h1><p>No exchange or return terms have been supplied. Contact the store to confirm the policy before ordering.</p></main>` },
  { path: "/privacy", title: `Privacy Information | Mustaqeem Stitches`, description: "Read the privacy information supplied by Mustaqeem Stitches and Collection in Nigeria.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Information</p><h1>Privacy information</h1><p>The owner's confirmed privacy information will appear here. Do not send sensitive measurements or personal information through an enquiry.</p></main>` },
  { path: "/admin/login", title: `Owner Sign In | ${BRAND}`, description: "Private sign-in for the explicitly authorized owner of Mustaqeem Stitches and Collection.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Private area</p><h1>Owner sign in</h1><p>Management access is limited to an account explicitly provisioned by the project owner.</p><a href="/">Return to the storefront</a></main>` },
  { path: "/admin", title: `Store Dashboard | ${BRAND}`, description: "Private store management area.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Private store dashboard</h1><p>Sign in as the authorized store owner to manage the catalogue.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/admin/products", title: `Manage Products | ${BRAND}`, description: "Private product management area.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Manage products</h1><p>This page is private and requires an authorized owner account.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/admin/products/new", title: `Add a Product | ${BRAND}`, description: "Private product creation page.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Add a product</h1><p>This page is private and requires an authorized owner account.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/admin/categories", title: `Manage Categories | ${BRAND}`, description: "Private category management area.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Manage categories</h1><p>This page is private and requires an authorized owner account.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/admin/settings", title: `Store Settings | ${BRAND}`, description: "Private store settings.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Store settings</h1><p>Manage public information for Mustaqeem Stitches and Collection.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/404", title: `Page Not Found | ${BRAND}`, description: "The page you requested could not be found.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">404 · Not found</p><h1>This page has wandered off.</h1><p>The link may have changed, or the page is no longer available.</p><a href="/">Return to the home page</a></main>` },
];

for (const category of categories) {
  const suffix = category.description ? ` ${clip(category.description, 110)}` : ` Browse published ${category.name.toLowerCase()} from Mustaqeem Stitches and Collection in Nigeria.`;
  pages.push({
    path: `/collections/${category.slug}`,
    title: `${category.name} in Nigeria | Mustaqeem Stitches`,
    description: clip(`${category.name} from Mustaqeem Stitches and Collection.${suffix}`, 155),
    body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Modest wear · Nigeria</p><h1>${escapeHtml(category.name)} in Nigeria</h1>${category.description ? `<p>${escapeHtml(category.description)}</p>` : `<p>Browse published ${escapeHtml(category.name.toLowerCase())} from Mustaqeem Stitches and Collection. Product details and current availability are loaded from the live public catalogue.</p>`}<p><a href="/shop">Browse all modest-wear pieces</a> · <a href="/contact">Contact the store</a></p></main>`,
  });
}

function formatPriceMinor(value) {
  if (value === null || value === undefined) return "Enquire for price";
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) return "Enquire for price";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(price / 100);
}

for (const product of catalog.products) {
  const category = product.category;
  const categoryName = plainText(category?.name) || "Modest fashion";
  const summary = product.description || `Explore ${product.name}, a ${categoryName.toLowerCase()} piece from Mustaqeem Stitches and Collection in Nigeria.`;
  const availability = product.is_available ? "Availability: listed as available; confirm details with the store." : "Currently unavailable; contact the store to ask whether a similar piece may be possible.";
  const options = [
    Array.isArray(product.sizes) && product.sizes.length ? `<p><strong>Sizes:</strong> ${escapeHtml(product.sizes.join(", "))}</p>` : "",
    Array.isArray(product.colours) && product.colours.length ? `<p><strong>Colours:</strong> ${escapeHtml(product.colours.join(", "))}</p>` : "",
  ].filter(Boolean).join("");
  const body = `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">${escapeHtml(categoryName)} · Mustaqeem Stitches and Collection</p><h1>${escapeHtml(product.name)}</h1><p>${escapeHtml(summary)}</p><p><strong>Price:</strong> ${escapeHtml(formatPriceMinor(product.price_minor))}</p>${options}<p>${escapeHtml(availability)}</p><p class="seo-fallback-note">Product photography and any additional live catalogue details load from the private-image, published-product storefront.</p><p><a href="/collections/${escapeHtml(category?.slug ?? "")}">More ${escapeHtml(categoryName.toLowerCase())}</a> · <a href="/contact">Enquire about this piece</a></p></main>`;
  pages.push({
    path: `/product/${product.slug}`,
    title: `${product.name} | Mustaqeem Stitches`,
    description: clip(`${product.name}. ${summary} ${categoryName} in Nigeria from Mustaqeem Stitches and Collection.`, 155),
    type: "product",
    body,
  });
}

function setMeta(html, attribute, name, content) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(`<meta\\s+${attribute}="${escapedName}"[^>]*\\/?\\s*>`, "i");
  const tag = `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`;
  return expression.test(html) ? html.replace(expression, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function isNoindexRoute(page) {
  return Boolean(page.noindex || page.path === "/404" || /^\/admin(?:\/|$)/.test(page.path));
}

function htmlFor(page, siteOrigin) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
  html = html.replace(/<div id="seo-fallback">[\s\S]*?<\/div>/i, `<div id="seo-fallback">${page.body}</div>`);
  html = setMeta(html, "name", "description", page.description);
  html = setMeta(html, "name", "keywords", "modest wear Nigeria, abayas Nigeria, hijabs, khimars, jilbabs, modest gowns, custom-made modest outfits");
  const noindex = isNoindexRoute(page);
  html = setMeta(html, "name", "robots", noindex ? "noindex,nofollow" : "index,follow");
  html = setMeta(html, "property", "og:type", page.type ?? "website");
  html = setMeta(html, "property", "og:title", page.title);
  html = setMeta(html, "property", "og:description", page.description);
  html = setMeta(html, "property", "og:site_name", BRAND);
  html = setMeta(html, "property", "og:image:alt", page.type === "product" ? "Illustrative modest-fashion styling reference, not a photograph of this product" : "Illustrative modest-fashion styling reference, not a product photograph");
  html = setMeta(html, "name", "twitter:card", siteOrigin && !noindex ? "summary_large_image" : "summary");
  html = setMeta(html, "name", "twitter:title", page.title);
  html = setMeta(html, "name", "twitter:description", page.description);
  html = html.replace(/\s*<link rel="canonical"[^>]*\/?\s*>/i, "");
  if (siteOrigin && !noindex) {
    const canonical = new URL(page.path, `${siteOrigin}/`).toString();
    const image = new URL(HERO_IMAGE, `${siteOrigin}/`).toString();
    html = setMeta(html, "property", "og:url", canonical);
    html = setMeta(html, "property", "og:image", image);
    html = setMeta(html, "property", "og:image:width", "1920");
    html = setMeta(html, "property", "og:image:height", "1080");
    html = setMeta(html, "name", "twitter:image", image);
    html = html.replace("</head>", `    <link rel="canonical" href="${escapeHtml(canonical)}" />\n  </head>`);
  } else {
    html = html.replace(/\s*<link rel="canonical"[^>]*\/?\s*>/i, "");
    html = html.replace(/\s*<meta\s+property="og:url"[^>]*\/?\s*>/i, "");
    html = html.replace(/\s*<meta\s+property="og:image"[^>]*\/?\s*>/i, "");
    html = html.replace(/\s*<meta\s+property="og:image:(?:width|height)"[^>]*\/?\s*>/ig, "");
    html = html.replace(/\s*<meta\s+property="og:image:alt"[^>]*\/?\s*>/i, "");
    html = html.replace(/\s*<meta\s+name="twitter:image"[^>]*\/?\s*>/i, "");
  }
  return html;
}

const siteOrigin = normalizePublicSiteOrigin(env.VITE_SITE_URL);
for (const page of pages) {
  const relative = page.path === "/" ? "" : page.path.slice(1);
  const destination = path.join(publicRoot, relative, "index.html");
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, htmlFor(page, siteOrigin), "utf8");
}

if (siteOrigin) {
  const sitemapEntries = pages.filter((page) => !isNoindexRoute(page)).map((page) => {
    const location = new URL(page.path, `${siteOrigin}/`).toString().replaceAll("&", "&amp;");
    return `  <url><loc>${location}</loc></url>`;
  }).join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;
  await writeFile(path.join(publicRoot, "sitemap.xml"), sitemap, "utf8");
  const robotsPath = path.join(publicRoot, "robots.txt");
  const currentRobots = await readFile(robotsPath, "utf8");
  const withoutOldSitemap = currentRobots.split(/\r?\n/).filter((line) => !line.startsWith("Sitemap:")).join("\n").trimEnd();
  await writeFile(robotsPath, `${withoutOldSitemap}\nSitemap: ${siteOrigin}/sitemap.xml\n`, "utf8");
}

console.info(`Prerendered ${pages.length} stable and catalog route shells. Catalog product pages are snapshots of RLS-readable published rows; interactive views remain live Supabase queries.`);
