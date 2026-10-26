# Modest Fashion Storefront

A static-first React 19 + TypeScript + Vite storefront for a Nigerian modest-fashion designer. It connects directly to the store owner's Supabase project for email/password authentication, PostgreSQL catalog data and private product-image storage. It does not include a payment system, checkout, automatic orders or a public administrator sign-up.

The provided fashion images and sample listings are illustrative styling references only, not genuine product photographs or confirmed stock. No live Supabase project, business contact details, prices, policies or real products were supplied. The disconnected preview labels sample content clearly; add the owner's confirmed details before going live.

Generated editorial images use Manus's reserved `/manus-storage/` route and are served separately from `dist/public/`; the current Preview returned HTTP 200 for all generated image assets. A direct Vite port bypasses this platform route. If exporting the site to a non-Manus static host, copy the illustrations to that host and update `client/src/lib/demo-data.ts`, `client/index.html` and `scripts/prerender.mjs`; the static build does not bundle the platform-managed image bytes.

## Requirements and local preview

Use Node.js compatible with the Vite 7 toolchain and the pnpm version pinned in `package.json` (`pnpm@10.18.0`). From the project root:

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
# Edit .env.local with the public project URL, publishable/anon key and optional site URL.
pnpm dev:static
```

`pnpm dev:static` serves the storefront on `PORT` (3000 by default). The local preview remains in illustrative demo mode until both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. The admin login intentionally provides no registration path.

## Supabase setup

1. Create a Supabase project in the owner's account. Copy the project URL and the project **publishable** key (or legacy anon key) into `.env.local`. Never use `service_role`, `secret`, database password or other private keys in a `VITE_` variable or browser bundle.
2. Apply `supabase/migrations/202610250001_modest_store_schema.sql` to the intended project using the Supabase SQL Editor or Supabase CLI. The migration creates `admin_users`, `categories`, `products`, `product_images` and the single public `store_settings` row; it also installs RLS, update timestamps, indexes, the six initial category rows and a **private** `product-images` bucket with MIME/size restrictions and Storage policies. Review the migration in the target project before applying it. Do not apply test writes or deletions against a production store.
3. Create the owner's sign-in identity using Supabase Dashboard → Authentication → Users (invite or create the intended email/password account). In Supabase Authentication settings, disable public sign-ups. The application contains no signup route. Copy the exact Auth user UUID and, using the SQL Editor with a trusted project-owner role, add it to the allowlist:

   ```sql
   insert into public.admin_users (user_id)
   values ('REPLACE-WITH-THE-OWNER-AUTH-USER-UUID')
   on conflict (user_id) do nothing;
   ```

   Only provision trusted owner IDs. The frontend checks the signed-in ID, and database/Storage RLS independently calls `public.is_store_admin()`; hiding an admin route is not the security boundary. The allowlist has no client-side insert/update/delete grants.
4. Set the environment values and restart the dev server. Sign in at `/admin/login`, then configure the real brand name, public logo/contact details, full international WhatsApp number, Instagram URL and approved copy in **Store settings**. The database migration seeds category names but deliberately creates no fake product records, testimonials, business contact, prices or policies.
5. Add a product and its confirmed details. The image form accepts JPEG, PNG and WebP up to 5 MiB each, up to eight images per product. The browser uploads to private paths of the form `products/{product-uuid}/{random-uuid}.{jpg|png|webp}`. Published image paths are served through time-limited signed URLs; draft images are available only to the allowlisted admin. Unpublishing revokes future signed-URL issuance, though already issued signed URLs remain usable until they expire. Product deletion and individual image removal clear database references before Storage cleanup; if an object cleanup fails, remove the now-unreferenced object from the `product-images` bucket in the Supabase dashboard. Category deletion is blocked while referenced by a product.

### What the database policies allow

- Anonymous and authenticated visitors can read **published** products, **visible** categories, public store settings, and images referenced by published products. They cannot write products, categories, settings, image metadata or Storage objects.
- Only an authenticated user whose exact UUID is in `public.admin_users` can manage product/category/settings rows or product images. `admin_users` itself is read-only to a logged-in user for their own UUID.
- Product price is stored as integer minor units (kobo) in `price_minor`, with SQL `NULL` for “enquire for price”; zero is a valid price and negative values are rejected. Currency is NGN.
- The `product-images` bucket is private. Storage policies restrict file type, maximum size and the safe product-specific UUID path pattern. Upload, replace and delete operations require the admin allowlist helper.
- Public settings are public by design; store only details meant to appear on the storefront. Never place credentials, customer data or passwords in `store_settings`.

## Development, tests and build

```sh
pnpm dev:static          # Vite static preview, PORT defaults to 3000
pnpm check               # TypeScript check
pnpm test                # Vitest suite
pnpm build:static        # Static production output in dist/public/
```

The storefront uses React/Wouter routes; `client/public/manus-routes.json` lists all pages, including dynamic category/product/admin patterns. `pnpm build:static` prerenders route-specific initial HTML, headings and metadata for stable storefront pages and the six starter categories. Canonical and absolute social-image URLs are emitted only when a real HTTPS `VITE_SITE_URL` is configured. Admin routes are `noindex` and `robots.txt` disallows `/admin`.

Product/category records are live Supabase data and must appear without rebuilding or redeploying. Because this project remains a static SPA and no live catalog was supplied, product-specific initial HTML cannot be generated at build time; product descriptions and page metadata are populated after the browser loads the public RLS-protected record. Crawlers need JavaScript for product-specific content. Enabling request-time SSR would require enabling an additional project server capability and is intentionally not part of this static-first setup. Missing or unpublished products and unknown client routes perform a full navigation to `/404`; the published frontend-output path returns that endpoint with HTTP 404.

When a valid HTTPS `VITE_SITE_URL` is present, the build writes a sitemap containing only stable public routes and adds its location to `robots.txt`; private admin pages and changeable categories/products are not listed. Without a configured origin, canonical/social absolute URLs are omitted and the Manus gateway may provide its default sitemap.

Before launch, verify an owner account can sign in and log out; a signed-in but non-allowlisted user cannot access management; anonymous writes are denied; a draft is absent from the shop/search/category/product route and its images cannot be signed; a published item can be browsed and unpublished; a product with no sizes/colours displays no selectors; null price is not shown as zero; file uploads reject unsupported type/oversize/count; category deletion is restricted while referenced; and settings persist. Check a real WhatsApp enquiry on a device with WhatsApp installed: opening WhatsApp is only an enquiry hand-off, not a completed order or payment. Review Auth, RLS and Storage policy behavior in the target Supabase project before production. Do not perform destructive verification against real customer data.

## Deployment

Build a static site with `pnpm build:static`, publishing `dist/public/` (the Webdev static build configuration uses this directory). Ensure the host's extensionless SPA fallback covers dynamic `/collections/*`, `/product/*` and `/admin/*` links; retain the platform `/404` status behavior. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and, when canonical/social URLs are wanted, a real `VITE_SITE_URL` as public build environment values. Keep the `product-images` bucket private and the migration's policies enabled in production. After deploy, test public visibility, owner sign-in, admin writes, signed-image reads and expected anonymous denial on that live project.

Latest local checks: `pnpm check` passed; `pnpm test` passed (3 test files, 12 tests); `pnpm build:static` passed and generated 23 route HTML shells. Vite reports a non-blocking main-chunk advisory (552.57 kB minified, 162.61 kB gzip); route-level code splitting is enabled.

No live Supabase Auth, database, Storage upload, real WhatsApp hand-off or production deployment was executed in this environment because no user-owned Supabase project credentials or business information were provided. Any check is reported only if it was actually run.
