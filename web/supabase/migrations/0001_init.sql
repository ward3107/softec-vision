-- Softec Vision — initial schema (catalog, CMS content, inquiries).
-- i18n uses translation tables keyed by locale so adding a language is data,
-- not schema. Public reads are constrained by RLS to published rows only.

-- ── Enums ─────────────────────────────────────────────────────────────────────
create type publish_status as enum ('draft', 'published', 'archived');
create type media_kind      as enum ('image', 'gallery');
create type document_kind   as enum ('pdf', 'spec', 'drawing');
create type inquiry_status  as enum ('new', 'read', 'handled', 'archived');
create type inquiry_source  as enum ('form', 'whatsapp');
create type app_role        as enum ('admin', 'editor');

-- ── Locales ───────────────────────────────────────────────────────────────────
create table locales (
  code       text primary key,                 -- 'he', 'en', 'ar', ...
  name       text not null,
  dir        text not null check (dir in ('rtl', 'ltr')),
  enabled    boolean not null default true,
  is_default boolean not null default false,
  sort       int not null default 0
);

-- ── Categories & subcategories (self-referencing) ─────────────────────────────
create table categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  parent_id  uuid references categories(id) on delete cascade,
  sort       int not null default 0,
  status     publish_status not null default 'published',
  visible_in text[] not null default '{}',      -- e.g. '{en}' for charging-carts
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table category_translations (
  category_id uuid not null references categories(id) on delete cascade,
  locale      text not null references locales(code) on delete cascade,
  name        text not null,
  description text not null default '',
  primary key (category_id, locale)
);

-- ── Products ──────────────────────────────────────────────────────────────────
create table products (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  category_id    uuid not null references categories(id),
  subcategory_id uuid references categories(id),
  status         publish_status not null default 'draft',
  featured       boolean not null default false,
  sort           int not null default 0,
  model_3d_url   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create table product_translations (
  product_id  uuid not null references products(id) on delete cascade,
  locale      text not null references locales(code) on delete cascade,
  name        text not null,
  description text not null default '',
  alt_text    text not null default '',
  primary key (product_id, locale)
);
create table product_media (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  storage_path text not null,
  kind         media_kind not null default 'gallery',
  sort         int not null default 0,
  alt_translations jsonb not null default '{}'
);
create table product_documents (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  storage_path text not null,
  kind         document_kind not null default 'pdf',
  title_translations jsonb not null default '{}',
  sort         int not null default 0
);

-- ── Specifications (aligned rows for comparison) ──────────────────────────────
create table spec_fields (
  id   uuid primary key default gen_random_uuid(),
  key  text not null unique,
  unit text,
  sort int not null default 0
);
create table spec_field_translations (
  spec_field_id uuid not null references spec_fields(id) on delete cascade,
  locale        text not null references locales(code) on delete cascade,
  label         text not null,
  primary key (spec_field_id, locale)
);
create table product_specs (
  product_id    uuid not null references products(id) on delete cascade,
  spec_field_id uuid not null references spec_fields(id) on delete cascade,
  value_translations jsonb not null default '{}',
  sort          int not null default 0,
  primary key (product_id, spec_field_id)
);
create table related_products (
  product_id uuid not null references products(id) on delete cascade,
  related_id uuid not null references products(id) on delete cascade,
  sort       int not null default 0,
  primary key (product_id, related_id)
);

-- ── FAQ & editorial content (CMS-managed) ─────────────────────────────────────
create table faqs (
  id       uuid primary key default gen_random_uuid(),
  sort     int not null default 0,
  status   publish_status not null default 'published',
  category text
);
create table faq_translations (
  faq_id   uuid not null references faqs(id) on delete cascade,
  locale   text not null references locales(code) on delete cascade,
  question text not null,
  answer   text not null,
  primary key (faq_id, locale)
);
create table content_blocks (
  id     uuid primary key default gen_random_uuid(),
  key    text not null unique,               -- 'home.hero', 'about', 'process', ...
  status publish_status not null default 'published'
);
create table content_block_translations (
  block_id uuid not null references content_blocks(id) on delete cascade,
  locale   text not null references locales(code) on delete cascade,
  data     jsonb not null default '{}',
  primary key (block_id, locale)
);
create table contact_info (
  id       int primary key default 1 check (id = 1),   -- singleton
  phone    text,
  whatsapp text,
  email    text,
  address_translations jsonb not null default '{}',
  map_url  text,
  updated_at timestamptz not null default now()
);

-- ── Inquiries (personal data — see retention policy) ──────────────────────────
create table inquiries (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  name                 text not null,
  company              text,
  phone                text,
  email                text,
  project_type         text,
  product_id           uuid references products(id),
  product_code_snapshot text,
  message              text not null,
  locale               text,
  source               inquiry_source not null default 'form',
  status               inquiry_status not null default 'new',
  ip_hash              text,
  user_agent           text
);
create table inquiry_attachments (
  id           uuid primary key default gen_random_uuid(),
  inquiry_id   uuid not null references inquiries(id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  mime         text not null,
  size_bytes   bigint not null
);

-- ── Admin profiles / roles ────────────────────────────────────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       app_role not null default 'editor',
  full_name  text,
  created_at timestamptz not null default now()
);

create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (select 1 from profiles where id = auth.uid());
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Public content: anon may read published rows; staff may manage everything.
do $$
declare t text;
begin
  foreach t in array array[
    'locales','categories','category_translations','products','product_translations',
    'product_media','product_documents','spec_fields','spec_field_translations',
    'product_specs','related_products','faqs','faq_translations','content_blocks',
    'content_block_translations','contact_info','inquiries','inquiry_attachments','profiles'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- Published-content read policies (a representative subset; translations inherit
-- via their parent being published — enforced in queries/views).
create policy "public reads published categories" on categories
  for select using (status = 'published');
create policy "public reads category translations" on category_translations
  for select using (true);
create policy "public reads published products" on products
  for select using (status = 'published');
create policy "public reads product translations" on product_translations
  for select using (true);
create policy "public reads product media" on product_media for select using (true);
create policy "public reads product documents" on product_documents for select using (true);
create policy "public reads spec fields" on spec_fields for select using (true);
create policy "public reads spec field translations" on spec_field_translations for select using (true);
create policy "public reads product specs" on product_specs for select using (true);
create policy "public reads related" on related_products for select using (true);
create policy "public reads locales" on locales for select using (enabled);
create policy "public reads published faqs" on faqs for select using (status = 'published');
create policy "public reads faq translations" on faq_translations for select using (true);
create policy "public reads published content" on content_blocks for select using (status = 'published');
create policy "public reads content translations" on content_block_translations for select using (true);
create policy "public reads contact info" on contact_info for select using (true);

-- Staff manage all content.
do $$
declare t text;
begin
  foreach t in array array[
    'locales','categories','category_translations','products','product_translations',
    'product_media','product_documents','spec_fields','spec_field_translations',
    'product_specs','related_products','faqs','faq_translations','content_blocks',
    'content_block_translations','contact_info'
  ] loop
    execute format($f$create policy "staff manage %1$s" on %1$I for all using (is_staff()) with check (is_staff());$f$, t);
  end loop;
end $$;

-- Inquiries: no public read; inserts go through a trusted server action using the
-- service role (which bypasses RLS). Staff may read/manage.
create policy "staff read inquiries" on inquiries for select using (is_staff());
create policy "staff manage inquiries" on inquiries for update using (is_staff()) with check (is_staff());
create policy "staff read attachments" on inquiry_attachments for select using (is_staff());

-- Profiles: a user reads their own; admins manage all.
create policy "read own profile" on profiles for select using (id = auth.uid());
create policy "admin manage profiles" on profiles for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
