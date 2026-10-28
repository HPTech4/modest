# Supabase project files

## Current connected project status

Both versioned migrations were applied to the connected Supabase project on 2026-10-27 using Supabase CLI `db push` with a Development-only Session pooler URI. A read-only preflight found none of the migration tables, named policies, helper functions, triggers, or bucket already present, and CLI dry-run listed exactly these two files. Both versions are now recorded in Supabase migration history. Do not reapply them to the connected project.

Post-migration verification confirmed the five application tables exist with RLS enabled, all 20 expected policies are present, `product-images` is private, the six categories are seeded in order, and `store_settings` contains the supplied Mustaqeem Stitches and Collection name and WhatsApp number. Public REST reads return the six categories, the settings row, and zero products. There are zero `admin_users` rows. The temporary Development database URI was removed after verification; the frontend URL and publishable key remain in protected project settings.

## Migration files for this project or a separate fresh instance

Apply in filename order to a separate fresh project, after review:

1. `migrations/202610250001_modest_store_schema.sql`
2. `migrations/202610270001_mustaqeem_identity.sql`

The first creates catalog/settings/allowlist tables, RLS, update triggers, a private image bucket and its policies, plus the initial categories/settings. The second sets the supplied business identity and WhatsApp number, orders Custom-Made Outfits before Modest Gowns, and limits public product-image reads to published products in visible categories. Neither migration creates fabricated products, prices, address, email, social link, testimonial or policy.

## Remaining owner Auth setup

The connected Supabase Auth API currently reports public sign-ups enabled, and the store-owner allowlist is empty. Disable public sign-ups in Supabase Authentication settings. Then create or invite the owner there and provision that exact Auth UUID into `public.admin_users` from the trusted Supabase SQL Editor. Do not place a service-role/secret key in the browser or Git. Detailed Auth URL configuration, RLS policy checks and deployment caveats are in the repository [README](../README.md).
