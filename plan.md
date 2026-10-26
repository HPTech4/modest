# Implementation plan — modest-fashion storefront and admin

## Scope and implementation approach

The task workspace was inspected before implementation. No pre-existing user website or application code was present. The initialized project supplies React 19, TypeScript, Vite 7, Tailwind CSS 4, Wouter routing, Lucide icons, and the existing pnpm 10.18 toolchain. I will retain that stack and its installed dependencies rather than replace the starter or introduce Next.js.

The product will be a static React/Vite frontend connected in the browser to the store owner's Supabase project. Supabase Auth handles owner email/password sign-in, Postgres holds catalog/categories/public store content, and Supabase Storage holds product images. Supabase Row Level Security (RLS) and Storage policies are the enforcement boundary; browser route guards are for usability only. The public Supabase URL and publishable/anon key are the only frontend configuration values. No service-role key, custom API server, payments service, or Manus-managed database is required. The user has not supplied a Supabase project, so the app will include a conspicuous, non-broken unconfigured state, `.env.example`, SQL migrations and instructions instead of claiming a live database is connected. Centralized, visibly illustrative sample content is used for the disconnected preview only; real public catalog queries return published rows only.

The client will use Wouter for customer and admin routes and a shared Supabase data-access layer for public catalog queries, admin CRUD, and Storage operations. The admin must authenticate with Supabase Auth and then verify membership in the explicitly provisioned `admin_users` allowlist before exposing management screens. RLS policies independently repeat that authorization check. Product prices are represented as integer kobo (`price_minor`) or SQL NULL; the UI converts from/to NGN without conflating missing price and zero. Product image storage will be private, with image reads allowed only for published products or the authorized admin and uploads/updates/deletes restricted to that admin. The dashboard will explain that image-object cleanup and bucket creation are setup responsibilities.

## Main project structure

- `client/src/App.tsx` and `client/src/pages/`: storefront, shop, category, product detail, about/contact/FAQ/policies and protected admin route views.
- `client/src/components/`: shared storefront chrome, product/category cards, forms, status/empty/error states and admin navigation.
- `client/src/lib/supabase.ts`: optional Supabase client and safe configuration detection.
- `client/src/lib/data.ts`: typed public/admin catalog, categories, settings and image operations.
- `client/src/lib/whatsapp.ts`: phone validation and URL-encoded product/custom-order messages.
- `client/src/lib/demo-data.ts`: clearly identified illustrative fallback content and category list; replaceable without editing unrelated views.
- `client/src/brand.css`: brand tokens, editorial layout, typography, accessible responsive behavior and reduced-motion rules.
- `client/public/manus-routes.json`: static route manifest synchronized with the implemented routes.
- `client/src/lib/demo-data.ts` references custom-generated illustrative assets managed by Manus and served through its reserved `/manus-storage/` route; these are separate from genuine product photographs and are labelled as styling examples. A non-Manus static export must mirror those bytes and update the references.
- `scripts/prerender.mjs`: build-time stable-route HTML and route metadata; dynamic products remain current Supabase data rather than embedded snapshots.
- `client/public/robots.txt`: prevents crawler discovery of private admin routes while keeping public paths available.
- `supabase/migrations/`: version-controlled PostgreSQL schema, indexes, timestamp triggers, RLS policies, Storage policies and initial categories.
- `README.md`, `.env.example`, `plan.md`, and `TODO.md`: setup, provisioning, deployment, decisions and tracked requirements.

## Pages and data flow

The home page will use the exact supplied headline and supporting copy, an editable announcement, prominent collection/WhatsApp calls to action, the six configured categories, featured/new-arrival subsets, custom-order enquiry, editable story, optional approved testimonials and a configurable footer. The shop and category views use responsive cards, search, category filter and price ordering. Product details display only configured fields/options and validate size/colour/quantity before constructing an enquiry. About, Contact, FAQ and policy routes use honest placeholders rather than invented business facts.

The admin routes cover login, overview, product listing/create/edit, categories and settings. The overview calculates catalog counts from actual Supabase data and never invents orders or revenue. Management mutations use Supabase and surface loading, success, validation and network/session failures. Category deletion is blocked while referenced. A published change is visible on the next uncached/refetched public query without redeployment. No public sign-up route will exist.

Stable public/policy routes and the six starter category shells are prerendered with route-specific headings, descriptions, Open Graph/Twitter tags, a `noindex` treatment for admin pages, and a real canonical/social-image origin only when the owner configures a valid HTTPS `VITE_SITE_URL`. A stable-route sitemap is generated only with that valid public origin; it omits private and changeable catalog paths. Dynamic product details are loaded from the live Supabase catalog so they never require redeployment; therefore their product-specific initial HTML and crawler metadata are populated client-side. Missing/unpublished records and unknown routes navigate to the platform's status-bearing `/404` response. Request-time SSR would require enabling a new one-way server capability and is intentionally not selected for the static-first project.

## Visual design

- **Design movement:** contemporary Nigerian modest-fashion editorial, using a quiet luxury magazine sensibility rather than decorative thematic motifs.
- **Core principles:** product-first photography; calm, generous editorial hierarchy; modest and culturally respectful styling; honest content that never implies sample assets or policies are real.
- **Color philosophy:** warm ivory and white create a light, welcoming canvas; sand provides soft sectional contrast; mocha carries readable text and confident actions; muted gold is a scarce finishing accent. Use the supplied values: ivory `#F6F0E7`, sand `#D8C4AD`, mocha `#594337`, muted gold `#B6975A`, dark text `#292522`, and white `#FFFFFF`.
- **Layout paradigm:** an offset, image-led split hero with text-safe space; generous full-width editorial bands; asymmetric category introduction and carefully aligned catalogue grids; compact, practical admin layouts sharing the same palette.
- **Signature elements:** fine muted-gold editorial rules; small uppercase category/section labels with tracked lettering; large image crops framed by warm ivory margins.
- **Interaction philosophy:** direct and reassuring; accessible navigation, visible focus, touch-friendly actions and explicit success/error messages; no hover-only controls or unnecessary motion.
- **Animation:** restrained transitions of roughly 160–220 ms for menus and interactive affordances only; no parallax or attention-seeking entrance effects; honor `prefers-reduced-motion` by removing nonessential transitions.
- **Typography system:** Cormorant Garamond for editorial display headings and DM Sans for navigation, product data, forms and body copy; clear scale, strong readable contrast and comfortable line length.
- **Brand essence:** an editable, premium modest-fashion storefront for Nigerian women, distinct through considered presentation and direct WhatsApp ordering; refined, welcoming, trustworthy.
- **Brand voice:** composed, warm and specific, never hype-driven. Example lines: “Elegance in Every Layer.” and “Discover thoughtfully designed modest wear that brings together comfort, confidence, and timeless style.”
- **Wordmark and logo:** a neutral replaceable “Your Brand” wordmark paired with a simple custom two-stroke folded-fabric mark; no invented founder name or business history.
- **Signature brand color:** mocha brown `#594337`, used for confident buttons and the folded-fabric wordmark rather than as a heavy background.

## Runtime, dependencies and constraints

The project remains static-first and uses the existing `pnpm dev:static` and `pnpm build:static` scripts; the build prerenders stable pages without requiring a separate server. Add only `@supabase/supabase-js` if it is not already present; preserve pnpm's version pin and reviewed lifecycle policy. Keep browser environment variable names aligned with Vite (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_SITE_URL`). No network/database credentials are available in this task, so real Auth, CRUD, image upload and live-product verification remain dependent on the owner applying the included Supabase setup. No fake login, admin account, phone number, prices, customer review, delivery claim, return rule or address will be embedded; generated fashion imagery and demo product records are explicitly labeled as illustrative only.
