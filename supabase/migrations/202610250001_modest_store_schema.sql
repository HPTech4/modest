-- Modest fashion storefront schema for Supabase PostgreSQL.
-- Apply once to the selected Supabase project. No administrator is created by this migration.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_path text,
  is_visible boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  price_minor bigint check (price_minor is null or price_minor >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  category_id uuid not null references public.categories(id) on delete restrict,
  main_image_path text,
  sizes jsonb not null default '[]'::jsonb check (jsonb_typeof(sizes) = 'array'),
  colours jsonb not null default '[]'::jsonb check (jsonb_typeof(colours) = 'array'),
  fabric text,
  care_instructions text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  brand_name text,
  logo_path text,
  whatsapp_number text,
  instagram_url text,
  contact_email text,
  contact_phone text,
  location_text text,
  announcement_text text,
  announcement_enabled boolean not null default false,
  about_text text,
  delivery_information text,
  sizing_information text,
  exchange_policy text,
  privacy_information text,
  faq_information text,
  approved_testimonials jsonb not null default '[]'::jsonb check (jsonb_typeof(approved_testimonials) = 'array'),
  updated_at timestamptz not null default now()
);

create index if not exists products_status_created_idx on public.products (status, created_at desc);
create index if not exists products_category_status_idx on public.products (category_id, status);
create index if not exists products_featured_status_idx on public.products (is_featured, status);
create index if not exists products_new_arrival_status_idx on public.products (is_new_arrival, status);
create index if not exists categories_visibility_order_idx on public.categories (is_visible, sort_order);
create index if not exists product_images_product_order_idx on public.product_images (product_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger store_settings_set_updated_at before update on public.store_settings
for each row execute function public.set_updated_at();

-- The definer helper avoids relying on client email values and has a fixed search path.
create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.store_settings enable row level security;

create policy admin_users_read_own_id on public.admin_users
for select to authenticated using (user_id = (select auth.uid()));

create policy categories_public_read on public.categories
for select to anon, authenticated using (is_visible or public.is_store_admin());
create policy categories_admin_insert on public.categories
for insert to authenticated with check (public.is_store_admin());
create policy categories_admin_update on public.categories
for update to authenticated using (public.is_store_admin()) with check (public.is_store_admin());
create policy categories_admin_delete on public.categories
for delete to authenticated using (public.is_store_admin());

create policy products_public_read on public.products
for select to anon, authenticated using (
  public.is_store_admin() or (
    status = 'published' and exists (
      select 1 from public.categories c
      where c.id = products.category_id and c.is_visible
    )
  )
);
create policy products_admin_insert on public.products
for insert to authenticated with check (public.is_store_admin());
create policy products_admin_update on public.products
for update to authenticated using (public.is_store_admin()) with check (public.is_store_admin());
create policy products_admin_delete on public.products
for delete to authenticated using (public.is_store_admin());

create policy product_images_public_read_published on public.product_images
for select to anon, authenticated using (
  public.is_store_admin() or exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.status = 'published'
  )
);
create policy product_images_admin_insert on public.product_images
for insert to authenticated with check (public.is_store_admin());
create policy product_images_admin_update on public.product_images
for update to authenticated using (public.is_store_admin()) with check (public.is_store_admin());
create policy product_images_admin_delete on public.product_images
for delete to authenticated using (public.is_store_admin());

create policy store_settings_public_read on public.store_settings
for select to anon, authenticated using (true);
create policy store_settings_admin_insert on public.store_settings
for insert to authenticated with check (public.is_store_admin());
create policy store_settings_admin_update on public.store_settings
for update to authenticated using (public.is_store_admin()) with check (public.is_store_admin());

-- There is one public-facing settings record, but no secrets or private customer records.
insert into public.store_settings (singleton, announcement_enabled, brand_name, whatsapp_number)
values (true, false, 'Mustaqeem Stitches and Collection', '09015790659')
on conflict (singleton) do update set
  brand_name = excluded.brand_name,
  whatsapp_number = excluded.whatsapp_number;

insert into public.categories (name, slug, description, sort_order)
values
  ('Abayas', 'abayas', null, 1),
  ('Hijabs', 'hijabs', null, 2),
  ('Khimars', 'khimars', null, 3),
  ('Jilbabs', 'jilbabs', null, 4),
  ('Custom-Made Outfits', 'custom-made-outfits', null, 5),
  ('Modest Gowns', 'modest-gowns', null, 6)
on conflict (slug) do nothing;

-- Public storefront data is readable; RLS still limits each row. Authenticated DML
-- privileges are filtered by the administrator policies above. admin_users is read-only
-- to the authenticated user for their own ID and has no client-side write grants.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.store_settings to anon, authenticated;
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images to authenticated;
grant insert, update on public.store_settings to authenticated;

-- Product image objects are private. Signed URLs are issued only when the row's RLS
-- policy permits reading a published product image or the authorized store admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

create policy product_image_objects_read on storage.objects
for select to anon, authenticated using (
  bucket_id = 'product-images' and (
    public.is_store_admin() or exists (
      select 1 from public.product_images pi
      join public.products p on p.id = pi.product_id
      where pi.storage_path = storage.objects.name and p.status = 'published'
    )
  )
);
create policy product_image_objects_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'product-images'
  and public.is_store_admin()
  and lower(name) ~ '^products/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
);
create policy product_image_objects_update on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_store_admin())
with check (bucket_id = 'product-images' and public.is_store_admin());
create policy product_image_objects_delete on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_store_admin());
