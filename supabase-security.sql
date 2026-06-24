-- ============================================================
--  ChequeFlex — Supabase Security Lockdown
--  شغّل هذا الملف مرة واحدة في:
--  Supabase Dashboard → SQL Editor → New query → Run
--  (يستبدل سياسات الكتابة العامة بسياسات للمستخدمين المصادَق عليهم فقط)
-- ============================================================

-- 1) التأكد أن RLS مفعّل
alter table public.products enable row level security;

-- 2) إزالة سياسات الكتابة العامة الخطيرة
drop policy if exists "Public insert" on public.products;
drop policy if exists "Public update" on public.products;
drop policy if exists "Public delete" on public.products;

-- 3) القراءة تبقى عامة (الحاسبة تحتاج قراءة المنتجات)
drop policy if exists "Public read" on public.products;
create policy "Public read" on public.products
  for select using (true);

-- 4) الكتابة (إضافة/تعديل/حذف) للمستخدمين المصادَق عليهم فقط (الأدمن)
create policy "Auth insert" on public.products
  for insert to authenticated with check (true);
create policy "Auth update" on public.products
  for update to authenticated using (true) with check (true);
create policy "Auth delete" on public.products
  for delete to authenticated using (true);

-- ============================================================
--  خطوات يدوية في لوحة Supabase (مهمة):
--  1) Authentication → Providers → Email:
--       أوقف "Allow new users to sign up"  (منع التسجيل العام)
--  2) Authentication → Users → Add user:
--       أنشئ حساب الأدمن (بريد إلكتروني + كلمة سر قوية)
--       — ده الحساب اللي هتسجّل بيه الدخول في login.html
-- ============================================================
