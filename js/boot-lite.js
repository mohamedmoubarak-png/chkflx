/* Anti-clickjacking frame-busting for the admin & login pages. */
(function () {
    try {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    } catch (e) {
        document.documentElement.style.display = 'none';
    }
})();
