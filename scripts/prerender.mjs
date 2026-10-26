import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "dist", "public");
const indexPath = path.join(publicRoot, "index.html");
const template = await readFile(indexPath, "utf8");
const viteEnv = loadEnv("production", projectRoot, "VITE_");

const categories = [
  { name: "Abayas", slug: "abayas" },
  { name: "Hijabs", slug: "hijabs" },
  { name: "Khimars", slug: "khimars" },
  { name: "Jilbabs", slug: "jilbabs" },
  { name: "Modest Gowns", slug: "modest-gowns" },
  { name: "Custom-Made Outfits", slug: "custom-made-outfits" },
];
const heroImage = "/manus-storage/async-images/wibZDKxW79B93X58fL0Cl2/image-1.webp";
const links = (items) => `<ul>${items.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("")}</ul>`;
const categoryLinks = categories.map(({ name, slug }) => [`/collections/${slug}`, name]);
const homeBody = `<main id="main-content" class="seo-fallback-content"><section class="seo-fallback-hero"><p class="eyebrow">Modest fashion · Nigeria</p><h1>Elegance in Every Layer.</h1><p>Discover thoughtfully designed modest wear that brings together comfort, confidence, and timeless style.</p><p class="seo-fallback-note">The owner’s confirmed product details and imagery appear in the live catalogue. This editorial image is illustrative styling, not a product photograph.</p><img src="${heroImage}" alt="Illustrative modest-fashion editorial styling reference, not a product photograph" /><p><a href="/collections">Explore the collection</a> · <a href="/shop">Shop published pieces</a> · <a href="/contact">Contact the designer</a></p></section><section><h2>Explore the collections</h2>${links(categoryLinks)}</section></main>`;

const pages = [
  { path: "/", title: "Modest Fashion Nigeria | Elegant Modest Wear", description: "Discover thoughtfully designed modest wear that brings together comfort, confidence, and timeless style.", body: homeBody },
  { path: "/shop", title: "Shop Modest Fashion | Nigeria", description: "Browse published modest-fashion pieces, with live catalogue details and current availability from the store.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">The collection</p><h1>Shop the pieces</h1><p>Explore considered layers and find a piece that feels like you.</p><p>The live catalogue displays only products the store owner has published.</p><p><a href="/collections">Explore categories</a> · <a href="/contact">Ask about a custom piece</a></p></main>` },
  { path: "/collections", title: "Modest-Fashion Collections | Nigeria", description: "Explore abayas, hijabs, khimars, jilbabs, modest gowns and custom-made outfits.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Collections</p><h1>Considered layers, for every day.</h1><p>Explore the store’s modest-fashion categories.</p>${links(categoryLinks)}</main>` },
  { path: "/about", title: "About the Designer | Modest Fashion Nigeria", description: "Learn about the modest-fashion brand through information supplied and approved by its owner.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Our story</p><h1>About the brand</h1><p>The store owner’s approved story and design approach will appear here. No founder biography or business history has been assumed.</p><a href="/contact">Contact the designer</a></main>` },
  { path: "/contact", title: "Contact the Designer | Modest Fashion Nigeria", description: "Find the store’s configured contact information or begin a custom modest-outfit enquiry.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Get in touch</p><h1>A conversation is a good place to begin.</h1><p>Current WhatsApp and contact details appear after the store owner configures them.</p><p><a href="/shop">Browse the catalogue</a></p></main>` },
  { path: "/faq", title: "Frequently Asked Questions | Modest Fashion Nigeria", description: "Read answers approved by the store owner about browsing and ordering modest fashion.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Helpful details</p><h1>Frequently asked questions</h1><p>Confirmed answers about sizing, orders and delivery will be provided by the store owner.</p><a href="/contact">Contact the store</a></main>` },
  { path: "/sizing", title: "Sizing Information | Modest Fashion Nigeria", description: "Review sizing information published by the store owner for the relevant modest-fashion pieces.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Information</p><h1>Sizing</h1><p>Product-specific sizing and the store’s confirmed sizing guidance will be added by the owner.</p></main>` },
  { path: "/delivery", title: "Delivery Information | Modest Fashion Nigeria", description: "Review delivery methods and terms only after they have been confirmed by the store owner.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Information</p><h1>Delivery</h1><p>Delivery areas, timing, fees and methods have not been supplied. Confirmed information will be published by the owner.</p></main>` },
  { path: "/exchanges", title: "Exchange Information | Modest Fashion Nigeria", description: "Review the store’s confirmed exchange and return information before placing an enquiry.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Information</p><h1>Exchanges and returns</h1><p>No exchange or return terms have been supplied. The store owner will publish confirmed terms here.</p></main>` },
  { path: "/privacy", title: "Privacy Information | Modest Fashion Nigeria", description: "Review the privacy information approved and published by the store owner.", body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Information</p><h1>Privacy</h1><p>The owner’s confirmed privacy information will appear here. Do not send sensitive measurements or personal information through an enquiry.</p></main>` },
  ...categories.map(({ name, slug }) => ({
    path: `/collections/${slug}`,
    title: `${name} | Modest Fashion Nigeria`,
    description: `Browse published ${name.toLowerCase()} from the modest-fashion store. Product details and availability come from the live catalogue.`,
    body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Collection</p><h1>${name}</h1><p>Browse current published pieces in this collection. Product details and availability load from the live catalogue.</p><a href="/shop">Browse all published pieces</a></main>`,
  })),
  { path: "/admin/login", title: "Store Owner Sign In | Modest Fashion", description: "Private sign-in for the explicitly authorized store owner.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">Private area</p><h1>Store owner sign in</h1><p>Management access is limited to an account explicitly provisioned by the project owner.</p><a href="/">Return to the storefront</a></main>` },
  { path: "/admin", title: "Store Dashboard | Private", description: "Private store management area.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Private store dashboard</h1><p>Sign in as the authorized store owner to manage the catalogue.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/admin/products", title: "Manage Products | Private", description: "Private product management area.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Manage products</h1><p>This page is private and requires an authorized owner account.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/admin/products/new", title: "Add a Product | Private", description: "Private product creation page.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Add a product</h1><p>This page is private and requires an authorized owner account.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/admin/categories", title: "Manage Categories | Private", description: "Private category management area.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Manage categories</h1><p>This page is private and requires an authorized owner account.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/admin/settings", title: "Store Settings | Private", description: "Private store settings.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><h1>Store settings</h1><p>This page is private and requires an authorized owner account.</p><a href="/admin/login">Owner sign in</a></main>` },
  { path: "/404", title: "Page Not Found | Modest Fashion", description: "The page you requested could not be found.", noindex: true, body: `<main id="main-content" class="seo-fallback-content"><p class="eyebrow">404 · Not found</p><h1>This page has wandered off.</h1><p>The link may have changed, or the page is no longer available.</p><a href="/">Return to the home page</a></main>` },
];

function safeSiteOrigin() {
  const candidate = (process.env.VITE_SITE_URL ?? viteEnv.VITE_SITE_URL)?.trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hostname.endsWith(".example")) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function setMeta(html, attribute, name, content) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(`<meta\\s+${attribute}="${escapedName}"[^>]*\\/?\\s*>`, "i");
  const tag = `<meta ${attribute}="${name}" content="${escapeAttribute(content)}" />`;
  return expression.test(html) ? html.replace(expression, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function htmlFor(page, siteOrigin) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttribute(page.title)}</title>`);
  html = html.replace(/<div id="seo-fallback">[\s\S]*?<\/div>/i, `<div id="seo-fallback">${page.body}</div>`);
  html = setMeta(html, "name", "description", page.description);
  html = setMeta(html, "name", "keywords", "modest fashion, abayas, hijabs, khimars, jilbabs, modest gowns");
  html = setMeta(html, "name", "robots", page.noindex ? "noindex,nofollow" : "index,follow");
  html = setMeta(html, "property", "og:type", "website");
  html = setMeta(html, "property", "og:title", page.title);
  html = setMeta(html, "property", "og:description", page.description);
  html = setMeta(html, "property", "og:site_name", "Modest Fashion");
  html = setMeta(html, "name", "twitter:card", siteOrigin ? "summary_large_image" : "summary");
  html = setMeta(html, "name", "twitter:title", page.title);
  html = setMeta(html, "name", "twitter:description", page.description);
  html = html.replace(/\s*<link rel="canonical"[^>]*\/?\s*>/i, "");
  if (siteOrigin) {
    const canonical = new URL(page.path, `${siteOrigin}/`).toString();
    html = setMeta(html, "property", "og:url", canonical);
    const image = new URL(heroImage, `${siteOrigin}/`).toString();
    html = setMeta(html, "property", "og:image", image);
    html = setMeta(html, "name", "twitter:image", image);
    html = html.replace("</head>", `    <link rel="canonical" href="${escapeAttribute(canonical)}" />\n  </head>`);
  }
  return html;
}

const siteOrigin = safeSiteOrigin();
for (const page of pages) {
  const relative = page.path === "/" ? "" : page.path.slice(1);
  const destination = path.join(publicRoot, relative, "index.html");
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, htmlFor(page, siteOrigin), "utf8");
}

if (siteOrigin) {
  const sitemapEntries = pages.filter((page) => !page.noindex && !page.path.startsWith("/collections/")).map((page) => {
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

console.log(`Prerendered ${pages.length} stable public/private route shells; dynamic product records remain live Supabase data.`);
