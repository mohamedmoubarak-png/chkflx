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
            if (m) m.setAttribute('content', '#050E1F');
        }
    } catch (e) {}
})();

// 3) Splash auto-hide + Service Worker registration (after full load)
window.addEventListener('load', function () {
    var splash = document.getElementById('splashScreen');
    if (splash) {
        setTimeout(function () {
            splash.classList.add('hidden');
            // Sync browser UI color with the active theme once splash is gone
            var isDark = document.body.getAttribute('data-theme') === 'dark';
            var meta = document.getElementById('themeColorMeta');
            if (meta) meta.setAttribute('content', isDark ? '#050E1F' : '#F4F7FC');
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
