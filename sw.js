/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  sw.js — Service Worker (Network-First + Offline Cache)
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 * ============================================================
 *
 *  Strategy: NETWORK FIRST + CACHE FALLBACK
 *  — مع الإنترنت يجلب أحدث نسخة دائماً
 *  — بدون إنترنت يعمل من النسخة المخزّنة (لا توجد قاعدة بيانات)
 *  — عند توفر تحديث جديد يتم التطبيق الفوري
 * ============================================================
 */

const SW_VERSION = 'chequeflex-sw-v6';
const CACHE_NAME = SW_VERSION;

// ملفات التطبيق الأساسية — تُخزَّن لتشغيل الحاسبة بدون إنترنت
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './chkflx.png',
    './icons/icon.svg',
    './css/style.css',
    './js/analytics.js',
    './js/boot.js',
    './js/i18n.js',
    './js/calculator.js',
    './js/ui.js',
    './js/products.js',
    './js/data-loader.js',
    './js/app.js',
    './js/vendor/chart.umd.min.js'
];

// ─── INSTALL ────────────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .catch(err => console.warn(`[SW ${SW_VERSION}] Precache failed:`, err))
            .then(() => self.skipWaiting())
    );
});

// ─── ACTIVATE ───────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// ─── FETCH — Network First, Cache Fallback ──────────────────
//  — مع الإنترنت: أحدث نسخة دائماً (وتحديث الكاش)
//  — بدون إنترنت: النسخة المخزّنة، فتعمل الحاسبة كاملة
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || !req.url.startsWith('http')) return;

    const sameOrigin = new URL(req.url).origin === self.location.origin;
    // الطلبات الخارجية (خطوط/تحليلات) تمر كما هي بدون تدخل
    if (!sameOrigin) return;

    event.respondWith(
        fetch(req)
            .then(res => {
                if (res && res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
                }
                return res;
            })
            .catch(() =>
                caches.match(req, { ignoreSearch: true }).then(cached => {
                    if (cached) return cached;
                    if (req.mode === 'navigate') {
                        return caches.match('./index.html').then(page => page || buildOfflinePage());
                    }
                    return Response.error();
                })
            )
    );
});

// ─── MESSAGE — طلب تحديث من الصفحة الرئيسية ────────────────
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ─── Helper: صفحة عدم الاتصال ────────────────────────────────
function buildOfflinePage() {
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لا يوجد اتصال | ChequeFlex</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: 'Cairo', sans-serif;
            background: #081628;
            color: #E8EEF8;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px;
        }
        .logo-wrap { margin-bottom: 32px; }
        .logo-wrap svg { filter: drop-shadow(0 0 24px rgba(74,127,232,0.4)); }
        .title {
            font-size: 1.6rem;
            font-weight: 800;
            margin-bottom: 12px;
            color: #4A7FE8;
        }
        .msg {
            font-size: 1rem;
            font-weight: 600;
            color: #7A9AC0;
            max-width: 360px;
            line-height: 1.8;
            margin-bottom: 32px;
        }
        .retry-btn {
            background: linear-gradient(135deg, #2B62F0, #4A7FE8);
            color: #fff;
            border: none;
            border-radius: 12px;
            padding: 14px 32px;
            font-family: 'Cairo', sans-serif;
            font-size: 1rem;
            font-weight: 800;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .retry-btn:hover { transform: translateY(-2px); }
        .footer {
            position: fixed;
            bottom: 16px;
            font-size: 0.72rem;
            color: #3A5878;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="logo-wrap">
        <svg width="90" height="90" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" rx="96" fill="#0D1F3C"/>
            <path d="M380 136C332 88 268 60 196 60C96 60 16 140 16 240C16 340 96 420 196 420C268 420 332 392 380 344"
                  stroke="url(#cG)" stroke-width="56" stroke-linecap="round" fill="none"/>
            <path d="M120 240L200 320L340 160"
                  stroke="url(#kG)" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <defs>
                <linearGradient id="cG" x1="16" y1="60" x2="380" y2="420" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#4A7FE8"/>
                    <stop offset="100%" stop-color="#1D50D8"/>
                </linearGradient>
                <linearGradient id="kG" x1="120" y1="160" x2="340" y2="320" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#C5D0E4"/>
                    <stop offset="100%" stop-color="#E8EEF8"/>
                </linearGradient>
            </defs>
        </svg>
    </div>
    <div class="title">ChequeFlex</div>
    <p class="msg">
        تطبيق ChequeFlex يتطلب اتصالاً بالإنترنت<br>
        لضمان دقة العمليات والبيانات المصرفية
    </p>
    <button class="retry-btn" onclick="location.reload()">🔄 إعادة المحاولة</button>
    <div class="footer">
        جميع الحقوق محفوظة © 2026 &nbsp;|&nbsp; developed by Mohamed Sayed
    </div>
</body>
</html>`;

    return new Response(html, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
