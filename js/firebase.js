/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  firebase.js — Firebase Initialization & Firestore Config
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 *  يُحظر نسخ هذا الكود أو إعادة توزيعه دون إذن كتابي مسبق.
 * ============================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB-GrTWNCZLe_p4OcNgVA00KYtLNk9DfXY",
  authDomain: "investo-cheque.firebaseapp.com",
  projectId: "investo-cheque",
  storageBucket: "investo-cheque.firebasestorage.app",
  messagingSenderId: "782069438195",
  appId: "1:782069438195:web:cd5645d4dc1c2cad27c986"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
