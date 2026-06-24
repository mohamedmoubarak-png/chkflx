/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  products.js — Supabase Products CRUD & Real-time Listener
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 *  يُحظر نسخ هذا الكود أو إعادة توزيعه دون إذن كتابي مسبق.
 * ============================================================
 *
 *  جدول قاعدة البيانات (Supabase / Postgres):
 *      table: public.products
 *      columns: code (text, primary key), rate (double precision)
 * ============================================================
 */

import { supabase } from "./supabase.js";

// Default fallback products (used if Supabase is unavailable)
const DEFAULT_PRODUCTS = {
  'IS18': { code: 'IS18', rate: 0.05 }
};

// Convert a list of rows → { CODE: { code, rate } } map
function rowsToMap(rows) {
  const products = {};
  (rows || []).forEach((row) => {
    const code = String(row.code).toUpperCase();
    products[code] = { code, rate: Number(row.rate || 0) };
  });
  return products;
}

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('code, rate');

  if (error) throw error;

  const products = rowsToMap(data);

  // If table is empty, fall back to the built-in default so the calculator
  // still works. Seeding now requires an authenticated admin (RLS), so the
  // write is attempted silently and any rejection is ignored for visitors.
  if (Object.keys(products).length === 0) {
    products['IS18'] = { code: 'IS18', rate: 0.05 };
    try {
      await supabase.from('products').upsert({ code: 'IS18', rate: 0.05 });
    } catch (e) { /* anonymous visitors cannot write after RLS lockdown */ }
  }

  return products;
}

export async function saveProduct(code, rate) {
  if (!code || rate === "" || rate === null || isNaN(Number(rate))) {
    throw new Error("Product code and rate are required");
  }

  const normalizedCode = String(code).trim().toUpperCase();

  const { error } = await supabase
    .from('products')
    .upsert({ code: normalizedCode, rate: Number(rate) });

  if (error) throw error;
}

export async function deleteProduct(code) {
  const normalizedCode = String(code).trim().toUpperCase();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('code', normalizedCode);

  if (error) throw error;
}

/**
 * Subscribe to live product changes.
 * Fires `callback(productsMap)` on the initial load and after every change.
 * Returns the realtime channel (call `supabase.removeChannel(ch)` to stop).
 */
export function listenToProducts(callback, onError) {
  // Initial fetch so the UI shows data immediately
  getProducts()
    .then(callback)
    .catch((err) => { if (typeof onError === 'function') onError(err); });

  // Realtime subscription — re-fetch the full list on any insert/update/delete
  const channel = supabase
    .channel('products-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      async () => {
        try {
          callback(await getProducts());
        } catch (err) {
          console.error("[listenToProducts] refresh error:", err);
          if (typeof onError === 'function') onError(err);
        }
      }
    )
    .subscribe();

  return channel;
}

export { DEFAULT_PRODUCTS };
