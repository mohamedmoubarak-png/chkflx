/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  products.js — Built-in Products (static, no database)
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 *  يُحظر نسخ هذا الكود أو إعادة توزيعه دون إذن كتابي مسبق.
 * ============================================================
 *
 *  المنتجات ونسب الفائدة مُعرّفة هنا مباشرة (بدون قاعدة بيانات).
 *  لإضافة منتج أو تعديل نسبة: عدّل القائمة بالأسفل.
 *  النسبة تُكتب كرقم عشري: 0.05 = 5%
 * ============================================================
 */

const DEFAULT_PRODUCTS = {
  'IS18': { code: 'IS18', rate: 0.05 }
};

export function getProducts() {
  const products = {};
  for (const key in DEFAULT_PRODUCTS) {
    products[key] = { ...DEFAULT_PRODUCTS[key] };
  }
  return Promise.resolve(products);
}

export { DEFAULT_PRODUCTS };
