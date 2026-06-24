/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  products.js — Firestore Products CRUD & Real-time Listener
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 *  يُحظر نسخ هذا الكود أو إعادة توزيعه دون إذن كتابي مسبق.
 * ============================================================
 */

import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Default fallback products (used if Firebase is unavailable)
const DEFAULT_PRODUCTS = {
  'IS18': { code: 'IS18', rate: 0.05 }
};

export async function getProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));
  const products = {};

  querySnapshot.forEach((docSnap) => {
    products[docSnap.id.toUpperCase()] = {
      code: docSnap.id.toUpperCase(),
      rate: Number(docSnap.data().rate || 0)
    };
  });

  // If Firestore collection is empty, seed IS18 as the default product
  if (Object.keys(products).length === 0) {
    console.log("Products collection is empty. Seeding default IS18...");
    await setDoc(doc(db, "products", "IS18"), {
      code: "IS18",
      rate: 0.05
    });
    products['IS18'] = { code: 'IS18', rate: 0.05 };
  }

  return products;
}

export async function saveProduct(code, rate) {
  if (!code || rate === "" || rate === null || isNaN(Number(rate))) {
    throw new Error("Product code and rate are required");
  }

  const normalizedCode = String(code).trim().toUpperCase();

  await setDoc(doc(db, "products", normalizedCode), {
    code: normalizedCode,
    rate: Number(rate)
  });
}

export function listenToProducts(callback, onError) {
  return onSnapshot(
    collection(db, "products"),
    (snapshot) => {
      const products = {};
      snapshot.forEach((docSnap) => {
        products[docSnap.id.toUpperCase()] = {
          code: docSnap.id.toUpperCase(),
          rate: Number(docSnap.data().rate || 0)
        };
      });
      callback(products);
    },
    (err) => {
      console.error("[listenToProducts] Firestore error:", err.code, err.message);
      if (typeof onError === 'function') onError(err);
    }
  );
}

export { DEFAULT_PRODUCTS };
