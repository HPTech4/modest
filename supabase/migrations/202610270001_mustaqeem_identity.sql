-- Mustaqeem Stitches and Collection identity and public-image visibility hardening.
-- Apply after 202610250001_modest_store_schema.sql in the owner's Supabase project.
-- This updates only business identity supplied by the owner; no contact address,
-- email, social account, testimonial, product, price or policy is invented.

update public.store_settings
set brand_name = 'Mustaqeem Stitches and Collection',
    whatsapp_number = '09015790659'
where singleton = true;

update public.categories set sort_order = 5 where slug = 'custom-made-outfits';
update public.categories set sort_order = 6 where slug = 'modest-gowns';

-- Images are readable to anonymous visitors only while the associated product is
-- published and its category is visible. Allowlisted admins retain full access.
drop policy if exists product_images_public_read_published on public.product_images;
create policy product_images_public_read_published on public.product_images
for select to anon, authenticated using (
  public.is_store_admin() or exists (
    select 1
    from public.products p
    join public.categories c on c.id = p.category_id
    where p.id = product_images.product_id
      and p.status = 'published'
      and c.is_visible
  )
);

drop policy if exists product_image_objects_read on storage.objects;
create policy product_image_objects_read on storage.objects
for select to anon, authenticated using (
  bucket_id = 'product-images' and (
    public.is_store_admin() or exists (
      select 1
      from public.product_images pi
      join public.products p on p.id = pi.product_id
      join public.categories c on c.id = p.category_id
      where pi.storage_path = storage.objects.name
        and p.status = 'published'
        and c.is_visible
    )
  )
);
