/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  app.js — Application Controller & UI Orchestrator
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 *  يُحظر نسخ هذا الكود أو إعادة توزيعه دون إذن كتابي مسبق.
 * ============================================================
 */

// app.js - Regular script (not a module)
// Firebase functions are exposed globally via the inline module in index.html

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Init PWA & State ---
    window.hasScrolled = false;
    let hasGuarantor = false;
    // Start with fallback products so the app works even before Firebase loads
    let firebaseProducts = { 'IS18': { code: 'IS18', rate: 0.05 } };
    let firebaseLoaded = false;

    // --- 2. DOM Elements ---
    const form = document.getElementById('calculatorForm');
    const inputs = form.querySelectorAll('input, select');

    const clientNameInput = document.getElementById('clientName');
    const loanAmountInput = document.getElementById('loanAmount');
    const productCodeInput = document.getElementById('productCode');
    const durationInput = document.getElementById('duration');
    const disburseDateInput = document.getElementById('disburseDate');

    const guarToggle = document.getElementById('guarantorToggle');
    const guarToggleUI = guarToggle.querySelector('.ios-toggle');
    const calcBtn = document.getElementById('calcBtn');
    const formGlobalError = document.getElementById('formGlobalError');

    // Theme & Lang Toggles
    const themeToggle = document.getElementById('themeToggle');
    const themeColorMeta = document.getElementById('themeColorMeta');
    const langToggle = document.getElementById('langToggle');
    const currentLangLabel = document.getElementById('currentLangLabel');

    // Actions
    const resetBtn = document.getElementById('resetBtn');

    // Print Elements
    const printDate = document.getElementById('printDate');
    const printClientName = document.getElementById('printClientName');

    // --- 3. Initial Setup (runs immediately, no Firebase dependency) ---

    if (!disburseDateInput.value) {
        disburseDateInput.value = new Date().toISOString().split('T')[0];
    }

    setLanguage('ar');
    updatePrintDate();

    // --- 4. Event Listeners (all wired up immediately) ---

    // Theme
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            themeColorMeta.setAttribute('content', '#F4F7FC');
            try { localStorage.setItem('chequeflex-theme', 'light'); } catch (e) {}
        } else {
            document.body.setAttribute('data-theme', 'dark');
            themeColorMeta.setAttribute('content', '#050E1F');
            try { localStorage.setItem('chequeflex-theme', 'dark'); } catch (e) {}
        }
    });

    // Language
    langToggle.addEventListener('click', () => {
        const newLang = getCurrentLang() === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
        currentLangLabel.textContent = newLang === 'ar' ? 'EN' : 'AR';
        updatePrintDate();
    });

    // Guarantor Toggle
    guarToggle.addEventListener('click', () => {
        hasGuarantor = !hasGuarantor;
        guarToggle.setAttribute('aria-checked', hasGuarantor);
        if (hasGuarantor) {
            guarToggleUI.classList.add('active');
        } else {
            guarToggleUI.classList.remove('active');
        }
    });

    // Keyboard support for toggle
    guarToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            guarToggle.click();
        }
    });

    // Client Name sync for print
    clientNameInput.addEventListener('input', function () {
        const nameStr = this.value.trim();
        printClientName.textContent = getTranslation('printClient') + (nameStr ? nameStr : '----------------');
    });

    // Reset Form
    resetBtn.addEventListener('click', () => {
        form.reset();
        disburseDateInput.value = new Date().toISOString().split('T')[0];
        document.getElementById('resultsSection').style.display = 'none';
        inputs.forEach(clearError);
        window.hasScrolled = false;

        hasGuarantor = false;
        guarToggle.setAttribute('aria-checked', 'false');
        guarToggleUI.classList.remove('active');
        formGlobalError.style.display = 'none';
    });

    // Modal Handlers
    const showClientBtn = document.getElementById('showClientChequesBtn');
    const showGuarBtn = document.getElementById('showGuarChequesBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const chequesModal = document.getElementById('chequesModal');

    if (showClientBtn) {
        showClientBtn.addEventListener('click', () => {
            if (window.currentClientCheques) {
                renderChequesList(window.currentClientCheques, 'showAllCheques');
            }
        });
    }

    if (showGuarBtn) {
        showGuarBtn.addEventListener('click', () => {
            if (window.currentGuarantorCheques) {
                renderChequesList(window.currentGuarantorCheques, 'showGuarCheques');
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            chequesModal.classList.remove('active');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === chequesModal) {
            chequesModal.classList.remove('active');
        }
    });

    // Print results button (replaces inline onclick for CSP compliance)
    const printResultsBtn = document.getElementById('printResultsBtn');
    if (printResultsBtn) printResultsBtn.addEventListener('click', () => window.print());

    // Lightweight toast for share/copy feedback
    function showMiniToast(msg) {
        let t = document.getElementById('miniToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'miniToast';
            t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
                'background:var(--royal-gold);color:#fff;padding:10px 20px;border-radius:10px;' +
                'font-weight:700;font-size:0.9rem;z-index:2000;box-shadow:0 8px 24px rgba(0,0,0,0.25);' +
                'opacity:0;transition:opacity .25s;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        requestAnimationFrame(() => { t.style.opacity = '1'; });
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
    }

    // Share app button — Web Share API with clipboard fallback
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const url = location.origin + location.pathname.replace(/index\.html$/, '');
            const shareData = {
                title: 'ChequeFlex',
                text: getCurrentLang() === 'ar' ? 'حاسبة الشيكات الذكية — ChequeFlex' : 'ChequeFlex — Smart Cheque Calculator',
                url: url
            };
            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                    showMiniToast(getCurrentLang() === 'ar' ? 'تم نسخ رابط التطبيق ✓' : 'App link copied ✓');
                } else {
                    window.prompt('انسخ الرابط:', url);
                }
            } catch (e) { /* user cancelled the share sheet */ }
        });
    }

    // Install app button — shown only when the browser offers installation
    const installBtn = document.getElementById('installBtn');
    function updateInstallBtn() {
        if (installBtn) installBtn.style.display = window.__deferredInstallPrompt ? '' : 'none';
    }
    if (installBtn) {
        updateInstallBtn();
        document.addEventListener('pwa-installable', updateInstallBtn);
        document.addEventListener('pwa-installed', () => {
            updateInstallBtn();
            showMiniToast(getCurrentLang() === 'ar' ? 'تم تثبيت التطبيق ✓' : 'App installed ✓');
        });
        installBtn.addEventListener('click', async () => {
            const promptEvent = window.__deferredInstallPrompt;
            if (!promptEvent) return;
            promptEvent.prompt();
            try { await promptEvent.userChoice; } catch (e) {}
            window.__deferredInstallPrompt = null;
            updateInstallBtn();
        });
    }

    // Easter egg — tap the developer name 5 times in a row to open WhatsApp
    const devName = document.getElementById('devName');
    if (devName) {
        let devTapCount = 0;
        let devTapTimer = null;
        devName.addEventListener('click', () => {
            devTapCount++;
            clearTimeout(devTapTimer);
            devTapTimer = setTimeout(() => { devTapCount = 0; }, 1500);
            if (devTapCount >= 5) {
                devTapCount = 0;
                clearTimeout(devTapTimer);
                window.open('https://wa.me/201027262202', '_blank');
            }
        });
    }

    // Accordion result cards — click the head to expand/collapse
    function wireAccordion(headId, cardId) {
        const head = document.getElementById(headId);
        const card = document.getElementById(cardId);
        if (!head || !card) return;
        head.addEventListener('click', () => {
            const isOpen = card.classList.toggle('open');
            head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }
    wireAccordion('clientAccordionHead', 'clientAccordion');
    wireAccordion('guarAccordionHead', 'guarAccordion');

    // Expandable "remaining cheques" cards — click to reveal cheques 2..N
    function wireExpandableCard(cardId) {
        const card = document.getElementById(cardId);
        if (!card) return;
        const toggle = () => {
            const isOpen = card.classList.toggle('open');
            card.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };
        card.addEventListener('click', (e) => {
            if (e.target.closest('.cheque-sublist')) return; // ignore clicks inside the list
            toggle();
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
    }
    wireExpandableCard('clientRemainingCard');
    wireExpandableCard('guarRemainingCard');

    // Calculate Button Click
    calcBtn.addEventListener('click', () => {
        triggerCalculation();
        if (validateForm()) {
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        }
    });

    // --- 5. Helper Functions ---

    function updatePrintDate() {
        const lang = getCurrentLang();
        const dateStr = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
        printDate.textContent = getTranslation('printDateLabel') + dateStr;
    }

    function triggerCalculation() {
        if (validateForm()) {
            formGlobalError.style.display = 'none';
            performCalculation();
        } else {
            formGlobalError.style.display = 'block';
        }
    }

    function validateForm() {
        let isValid = true;

        // Loan Amount
        const amount = parseFloat(loanAmountInput.value);
        if (isNaN(amount) || amount < 1000) {
            showError(loanAmountInput);
            isValid = false;
        } else {
            clearError(loanAmountInput);
        }

        // Product Code
        const code = productCodeInput.value.trim().toUpperCase();
        if (!code || !firebaseProducts[code]) {
            showError(productCodeInput);
            isValid = false;
        } else {
            clearError(productCodeInput);
        }

        // Duration
        const duration = parseInt(durationInput.value);
        if (isNaN(duration) || duration < 6 || duration % 6 !== 0) {
            showError(durationInput);
            isValid = false;
        } else {
            clearError(durationInput);
        }

        // Date
        if (!disburseDateInput.value) {
            showError(disburseDateInput);
            isValid = false;
        } else {
            clearError(disburseDateInput);
        }

        return isValid;
    }

    function showError(inputEl) {
        inputEl.classList.add('invalid');
        const errorEl = document.getElementById(`error-${inputEl.id}`);
        if (errorEl) errorEl.style.display = 'block';
    }

    function clearError(inputEl) {
        inputEl.classList.remove('invalid');
        const errorEl = document.getElementById(`error-${inputEl.id}`);
        if (errorEl) errorEl.style.display = 'none';
    }

    function populateProductDatalist() {
        const datalist = document.getElementById('productCodesList');
        if (!datalist) return;

        let html = '';
        for (const key in firebaseProducts) {
            const p = firebaseProducts[key];
            html += `<option value="${escapeHtml(p.code)}">الفائدة: ${(p.rate * 100).toFixed(2)}%</option>`;
        }
        datalist.innerHTML = html;

        // Default to IS18 if exists and field is empty
        if (!productCodeInput.value && firebaseProducts['IS18']) {
            productCodeInput.value = 'IS18';
        }
    }

    function performCalculation() {
        const loanAmount = parseFloat(loanAmountInput.value);
        const duration = parseInt(durationInput.value);
        const disburseDateStr = disburseDateInput.value;
        const selectedCode = productCodeInput.value.trim().toUpperCase();

        const annualRate = firebaseProducts[selectedCode] ? firebaseProducts[selectedCode].rate : 0.05;

        const results = generateSchedule(loanAmount, duration, annualRate, disburseDateStr);
        renderResults(results, loanAmount, duration, hasGuarantor);
    }

    // --- 6. Load products AFTER all listeners are set up ---
    // Wait for the module loader to signal the data module is ready
    function loadFirebaseProducts() {
        function onFirebaseReady() {
            if (!window.getProducts) return;
            window.getProducts()
                .then((products) => {
                    if (products && Object.keys(products).length > 0) {
                        firebaseProducts = products;
                    }
                    // Merge with DEFAULT_PRODUCTS to ensure fallbacks exist
                    if (window.DEFAULT_PRODUCTS) {
                        for (const key in window.DEFAULT_PRODUCTS) {
                            if (!firebaseProducts[key]) {
                                firebaseProducts[key] = window.DEFAULT_PRODUCTS[key];
                            }
                        }
                    }
                    firebaseLoaded = true;
                    populateProductDatalist();
                })
                .catch((error) => {
                    console.error('Products loading failed:', error);
                    // Use built-in fallback products so the app still works
                    firebaseProducts = { 'IS18': { code: 'IS18', rate: 0.05 } };
                    firebaseLoaded = true;
                    populateProductDatalist();
                    const warning = document.createElement('div');
                    warning.style.cssText = 'font-size:0.8rem;color:#f59e0b;padding:6px 0;';
                    warning.textContent = '⚠️ قاعدة البيانات غير متاحة، تم استخدام البيانات الاحتياطية';
                    productCodeInput.parentNode.appendChild(warning);
                });
        }

        if (window.getProducts) {
            onFirebaseReady();
        } else {
            document.addEventListener('products-ready', onFirebaseReady, { once: true });
        }
    }

    loadFirebaseProducts();
});
