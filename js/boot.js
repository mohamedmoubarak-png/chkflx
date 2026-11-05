/* ChequeFlex boot — anti-clickjacking, theme init, splash & service worker.
   Externalized from index.html so the page can enforce a strict CSP (no inline JS). */

(function () {
    // 1) Anti-clickjacking — break out of any framing attempt
    try {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    } catch (e) {
        // Cross-origin frame blocks access — at minimum hide the content
        document.documentElement.style.display = 'none';
    }

    // 2) Apply saved theme early (default = light on first visit)
    try {
        if (localStorage.getItem('chequeflex-theme') === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            var m = document.getElementById('themeColorMeta');
            if (m) m.setAttribute('content', '#170609');
        }
    } catch (e) {}
})();

// 2.5) Capture the PWA install prompt as early as possible so a custom
//      "install" button can trigger it on demand (Chrome no longer auto-prompts).
window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.__deferredInstallPrompt = e;
    document.dispatchEvent(new Event('pwa-installable'));
});
window.addEventListener('appinstalled', function () {
    window.__deferredInstallPrompt = null;
    document.dispatchEvent(new Event('pwa-installed'));
});

// 2.6) "App updated" notice — shown once when a returning user gets a new
//      release. Bump APP_VERSION with every release (alongside SW_VERSION).
var APP_VERSION = '2026.11.2';
var CF_VERSION_KEY = 'chequeflex-version';
// A page already controlled by a service worker means a returning visitor
var cfReturningUser = !!(navigator.serviceWorker && navigator.serviceWorker.controller);

function cfShowUpdatedToast() {
    var isEn = (document.documentElement.getAttribute('lang') || 'ar').indexOf('en') === 0;
    var t = document.createElement('div');
    t.setAttribute('role', 'status');
    t.textContent = isEn ? '✓ App updated to the latest version' : '✓ تم تحديث البرنامج إلى أحدث إصدار';
    t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translate(-50%,-12px);' +
        'background:var(--royal-gold);color:#fff;border:1px solid var(--gold);' +
        'padding:12px 22px;border-radius:12px;font-weight:700;font-size:0.95rem;' +
        'z-index:3000;box-shadow:0 10px 28px rgba(0,0,0,0.28);width:max-content;max-width:calc(100vw - 32px);' +
        'text-align:center;opacity:0;transition:opacity .3s, transform .3s;';
    document.body.appendChild(t);
    requestAnimationFrame(function () {
        t.style.opacity = '1';
        t.style.transform = 'translate(-50%,0)';
    });
    setTimeout(function () {
        t.style.opacity = '0';
        setTimeout(function () { t.remove(); }, 400);
    }, 4000);
}

function cfCheckForUpdateNotice() {
    var stored = null;
    try { stored = localStorage.getItem(CF_VERSION_KEY); } catch (e) {}
    var updated = stored ? stored !== APP_VERSION : cfReturningUser;
    function remember() { try { localStorage.setItem(CF_VERSION_KEY, APP_VERSION); } catch (e) {} }
    if (!updated) { remember(); return; }
    // Show after the splash screen has gone. The version is saved only once the
    // notice is shown, so a service-worker reload in between doesn't swallow it.
    setTimeout(function () { remember(); cfShowUpdatedToast(); }, 3200);
}

// 3) Splash auto-hide + Service Worker registration (after full load)
window.addEventListener('load', function () {
    cfCheckForUpdateNotice();
    var splash = document.getElementById('splashScreen');
    if (splash) {
        setTimeout(function () {
            splash.classList.add('hidden');
            // Sync browser UI color with the active theme once splash is gone
            var isDark = document.body.getAttribute('data-theme') === 'dark';
            var meta = document.getElementById('themeColorMeta');
            if (meta) meta.setAttribute('content', isDark ? '#170609' : '#FAF6F1');
            setTimeout(function () { splash.remove(); }, 550);
        }, 2500);
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js', { scope: './' })
            .then(function (registration) {
                registration.update();
                function onNewSW(sw) { sw.postMessage({ type: 'SKIP_WAITING' }); }
                if (registration.waiting) onNewSW(registration.waiting);
                registration.addEventListener('updatefound', function () {
                    var newSW = registration.installing;
                    if (!newSW) return;
                    newSW.addEventListener('statechange', function () {
                        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                            onNewSW(newSW);
                        }
                    });
                });
                var refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function () {
                    if (refreshing) return;
                    refreshing = true;
                    window.location.reload();
                });
            })
            .catch(function (error) {
                console.error('[PWA] Service Worker registration failed:', error);
            });
    }
});
