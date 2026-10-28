# Mustaqeem Stitches and Collection

A responsive React 19, TypeScript and Vite storefront for Mustaqeem Stitches and Collection, a Nigerian modest Islamic women's fashion business. It supports Supabase email/password owner authentication, a PostgreSQL catalog, owner-managed categories/settings, private product-image Storage and prefilled WhatsApp enquiries. It does not implement checkout, payment processing, order confirmation or inventory quantity tracking.

The only owner-supplied public business details are the confirmed name and WhatsApp contact (`09015790659`, linked internationally as `2349015790659`). No genuine Mustaqeem inventory or prices, physical address, email, social profile, approved testimonial, confirmed delivery area, founder story, approved logo or exchange/privacy policy were supplied. Those remain blank or explicitly unconfirmed. Online-sourced reference examples are private, unavailable demo drafts—not Mustaqeem stock—and must be replaced or removed before publication. Fallback catalog imagery remains illustrative; the public wordmark is text until the owner configures an approved logo URL.

## Local development and public configuration

Use the pnpm version pinned in `package.json` (`pnpm@10.34.5`). Copy `.env.example` to an ignored `.env.local`, replace the placeholders, and never add `.env.local` to Git.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev:static
```

- `VITE_SUPABASE_URL`: the owner's Supabase project base URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: preferred browser-safe `sb_publishable_...` key. `VITE_SUPABASE_ANON_KEY` is the legacy browser-safe anon-role JWT fallback.
- `VITE_SITE_URL`: exact HTTPS origin for canonical/social URLs and sitemap output. The currently assigned public origin is `https://modest-8tfhztyx.manus.space`; replace it only if the owner supplies a different production domain. Never use a Preview/internal address or invented domain.

The shared key policy accepts only the publishable-key format or an anon-role JWT, and permits a credential-free HTTPS project URL (or local HTTP Supabase development URL). Vite validates these values **before** bundling, so a service-role/secret/unrecognized key or URL credentials fail closed without printing the value or embedding it in the frontend. The browser client rechecks the same policy. Do not put server credentials in any `VITE_` variable. Local `.env` files are ignored; `.env.example` contains variable names and placeholders only.

The public Supabase URL and browser-safe publishable key are configured in secure project settings; their values are not stored in this repository. Both migrations were applied and recorded; prior verification confirmed five RLS-enabled application tables, 20 named policies, a private product-image bucket, six seeded categories and the supplied brand/WhatsApp settings. An owner-authenticated Preview session successfully created six sourced demo rows through the existing dashboard, one in each category; all six are drafts and unavailable. Five source-listing photos were uploaded to the private product-image bucket. The Jilbab reference intentionally has no photo because the listing did not expose a verifiable product image. A read-only anonymous RLS query returned six visible categories and zero public products after seeding.

Public Auth sign-ups are disabled and verified live. The assigned public origin is `https://modest-8tfhztyx.manus.space`, and the static build command is configured to use it for canonical and sitemap output. The current published page still serves an older generic build; the corrected Mustaqeem build has not yet been published. A read-only Auth settings check found that this assigned origin is not yet the Supabase Auth Site URL or in its redirect allowlist. Before relying on owner sign-in on the public domain, update Supabase Dashboard → Authentication → URL Configuration: set Site URL to `https://modest-8tfhztyx.manus.space` and add `https://modest-8tfhztyx.manus.space/**` to allowed redirect URLs. Do not enable public sign-ups. No Auth management credential is stored in this repository.

## Supabase migrations and owner provisioning

These migrations have already been applied to the connected Supabase project. Do not reapply them there. For a separate fresh project, apply them in filename order after review in the SQL Editor or via the Supabase CLI:

1. `supabase/migrations/202610250001_modest_store_schema.sql` creates the catalog/settings/allowlist tables, indexes and triggers, RLS, a private product-image bucket and its policies. It seeds the six requested category types and supplied business name/local WhatsApp number, but no fabricated products, prices, address, email, social link, testimonial or policy.
2. `supabase/migrations/202610270001_mustaqeem_identity.sql` updates an existing singleton settings row to the official supplied name/contact, orders Custom-Made Outfits before Modest Gowns, and aligns public image reads with published products in visible categories.

In Supabase Authentication, enable email/password sign-in and **disable public sign-ups**. Create or invite the one owner from Authentication → Users. Copy that user's UUID and provision it in `public.admin_users` through the trusted SQL Editor (never from browser code):

```sql
insert into public.admin_users (user_id)
values ('REPLACE-WITH-THE-OWNER-AUTH-USER-UUID')
on conflict (user_id) do nothing;
```

In Supabase Authentication → URL Configuration, set Site URL to `https://modest-8tfhztyx.manus.space` and add that origin (including `/**`) and the actual local development origin (for example `http://localhost:3000/**`) to allowed redirect URLs. A read-only live settings check currently finds the assigned origin missing from both Site URL and the redirect allowlist; owner sign-in and the Auth callback on the public domain remain unverified until this is corrected. Update these again if the owner supplies a custom domain. This application uses email/password sign-in—not public registration or OAuth.

The UI allowlist check is not the security boundary: RLS and Storage policies independently restrict management to the exact authenticated UUID in `admin_users`. Public database reads are limited to published products, visible categories and public store settings; anon users cannot write. Keep `product-images` private. The dashboard accepts up to eight JPEG/PNG/WebP images at 5 MiB each and uses randomized product-specific storage keys. Signed image URLs expire after 15 minutes. A bearer link already issued while a product was public can remain usable for up to that remaining 15-minute window after unpublishing or hiding its category; new URLs are blocked by RLS/Storage policies. Removing database references precedes object cleanup; if storage cleanup fails after the database change, remove the unreferenced object from the Storage dashboard.

The browser-safe public Supabase build values are already configured, and public sign-ups are disabled. Owner login and RLS-protected product/image writes succeeded in Preview. Six private demo drafts are present; every row is marked unavailable and unpublished, with source provenance in its description. The rows are examples from outside sellers, not Mustaqeem inventory. See [`DEMO_CATALOG_SOURCES.md`](DEMO_CATALOG_SOURCES.md) before reviewing or deleting them in the admin page. Sign in at `/admin/login` and review **Store settings**. The supplied brand/WhatsApp values are seeded. Add a physical location, email, Instagram/social link, approved testimonial, logo, founder story and confirmed policy only when the business owner provides it. Never store credentials, passwords or private customer data in public settings.

## WhatsApp enquiries

The supplied local number `09015790659` normalizes to `https://wa.me/2349015790659`. Product enquiries include the business name, product name, only selected options that the product actually offers, and the current product page URL when available; they ask the store to confirm availability and ordering details. Custom-order enquiries are prefilled too. Links open only after a visitor chooses an action. They do not perform checkout, place an order or prove payment. No sensitive measurements are requested.

## SEO, rendering and hosting constraints

`pnpm build:static` writes meaningful route-specific initial HTML, titles/descriptions, keywords, Open Graph/Twitter tags and internal links for stable public pages and visible categories. With valid public Supabase URL/key values available during the build, it also queries public-visible categories and published rows under RLS to prerender catalog HTML and build the sitemap from the same snapshot. The query and snapshot sanitizer also filter for published products and visible categories, validate slugs and escape dynamic HTML/metadata. Private rows, draft data and signed image URLs are not embedded. Automated isolated mock-service checks confirmed these rules without connecting to a real database.

The browser storefront continues to query live published catalog data so ordinary visitor changes appear without a website rebuild. However, crawler-visible product/category HTML and sitemap are snapshots created at the last build; a newly published item gets a product-specific crawler page and sitemap entry only after another site build/deploy. Private product photos use signed URLs and are not stable public social images. The prerender therefore uses the explicitly labelled illustrative brand styling image for product social cards rather than implying that it depicts the product.

Canonical links, `og:url`, absolute social-image URLs and the absolute sitemap are emitted only for an explicit HTTPS `VITE_SITE_URL`; localhost, reserved/test hosts and all configured Manus Preview/internal host families are rejected by the same shared validator in the browser and prerenderer. Prerendered public routes are indexable; generated private admin route shells carry `noindex,nofollow` and are omitted from the sitemap. `robots.txt` disallows `/admin`, and the admin app applies client-side `noindex,nofollow`; however, an arbitrary dynamic product-edit URL may fall back to the indexable homepage shell on some static hosts before JavaScript runs. A host-level noindex header/route rule or a non-dynamic editor URL is needed if production fallback behavior exposes that case. No fabricated ratings/reviews, prices or product structured data are included. Contact copy invites visitors in Ibadan, Ayegun, Olomi or Olunde to ask about current availability; it does not promise service or delivery there.

The site remains static-first. The assigned host is configured for the build, but its current published deployment is still the older generic version. Static build and Preview checks verify generated route shells and sitemap content; they do not verify production response status, canonical delivery, redirect/trailing-slash behavior or sitemap reachability until the corrected build is published. The dynamic admin-edit fallback caveat above also requires host-level verification. A separate publish decision is still pending.

Preview images use Manus's reserved `/manus-storage/` asset route and were verified in Manus Preview for this project. A non-Manus static export must copy those assets to its public storage and update references in `client/src/lib/demo-data.ts`, `client/index.html` and `scripts/prerender.mjs`.

## Checks and remaining setup

Current verified checks include:

```sh
pnpm check
pnpm test
VITE_SITE_URL=https://modest-8tfhztyx.manus.space pnpm build:static
node --check scripts/supabase-key-policy.mjs
node --check scripts/site-origin-policy.mjs
node --check scripts/prerender.mjs
git diff --check
```

The TypeScript check passed, and the unit suite passed (15 tests). The refreshed full dependency tree has zero critical and zero high advisories; the production tree also has zero critical/high. The remaining findings are two moderate development-only advisories: `esbuild@0.18.20` through `drizzle-kit>@esbuild-kit` and `postcss-selector-parser@6.0.10` through `@tailwindcss/typography`; and one low production-tree advisory, `katex@0.16.47` via `streamdown` (patched release `>=0.18.2`). `pnpm audit` exits nonzero because of those residual moderate/low items; none are critical or high. `pnpm install --frozen-lockfile` succeeded. The assigned-origin static build emitted 23 route shells, six categories, zero published products and a valid 16-URL sitemap; the 19-route manifest was verified as JSON with no 404-only entry. A live anonymous RLS query returned 200 with six categories and zero products. Public sign-ups are disabled; the assigned origin is missing from Supabase Auth Site URL/redirect settings. Owner login and six draft/image writes succeeded in Preview. Vite still warns that the main JavaScript chunk exceeds 500 kB after minification; builds succeed and route chunks are lazy-loaded.

Before launch, update Supabase Auth URL Configuration as described above, then verify owner login/callback on the assigned origin. The corrected Mustaqeem build is not yet published; the live host still serves the older generic version. After an explicit publish, verify production routes, canonicals, sitemap, robots, fallback status and WhatsApp hand-off. The dynamic admin-edit fallback caveat also needs production-host verification. The six demo items are deliberately drafts/unavailable and must be replaced or removed before any demo photo or third-party listing is published as Mustaqeem inventory. Obtain approved logo, policies or contact details only from the business owner. Do not treat Preview or demo data as live inventory.
