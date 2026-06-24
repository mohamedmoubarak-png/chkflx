/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  supabase.js — Supabase Client Initialization
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 * ============================================================
 *
 *  يستخدم نسخة Supabase المحلية (UMD) المحمّلة عبر:
 *      <script src="js/vendor/supabase.min.js"></script>
 *  قبل هذا الموديول. مفتاح anon علني وآمن للنشر — الحماية عبر
 *  Row Level Security ومصادقة Supabase Auth.
 * ============================================================
 */

const SUPABASE_URL = "https://ohyxylqwpiraiwtezmuy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeXh5bHF3cGlyYWl3dGV6bXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTEyODgsImV4cCI6MjA5Nzg2NzI4OH0.cMKDrw6CBwrcPv01Gc8aLR1JFHh4byOQ0xahkOPq8FA";

if (!window.supabase || !window.supabase.createClient) {
    throw new Error("Supabase library not loaded — include js/vendor/supabase.min.js before the app modules.");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
