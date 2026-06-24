-- ============================================================
--  ChequeFlex — Supabase Database Setup
--  شغّل هذا الملف مرة واحدة في:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) جدول المنتجات (كود المنتج + نسبة الفائدة)
create table if not exists public.products (
  code text primary key,
  rate double precision not null default 0
);

-- 2) إضافة المنتج الافتراضي IS18 (5%)
insert into public.products (code, rate)
values ('IS18', 0.05)
on conflict (code) do nothing;

-- 3) تفعيل Row Level Security
alter table public.products enable row level security;

-- 4) سياسات الوصول
--    (قراءة عامة + كتابة عامة — لمطابقة سلوك Firebase السابق.
--     الكتابة محميّة بكلمة مرور لوحة الإدارة على جهة العميل.)
drop policy if exists "Public read"   on public.products;
drop policy if exists "Public insert" on public.products;
drop policy if exists "Public update" on public.products;
drop policy if exists "Public delete" on public.products;

create policy "Public read"   on public.products for select using (true);
create policy "Public insert" on public.products for insert with check (true);
create policy "Public update" on public.products for update using (true) with check (true);
create policy "Public delete" on public.products for delete using (true);

-- 5) تفعيل Realtime على الجدول (للتحديث الفوري في لوحة الإدارة)
alter publication supabase_realtime add table public.products;
