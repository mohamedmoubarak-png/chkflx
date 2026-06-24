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
            themeColorMeta.setAttribute('content', '#F8FAFC');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            themeColorMeta.setAttribute('content', '#0F172A');
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
            html += `<option value="${p.code}">الفائدة: ${(p.rate * 100).toFixed(2)}%</option>`;
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

    // --- 6. Load Firebase products AFTER all listeners are set up ---
    // Wait for the module loader to signal Firebase is ready
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
                    console.error('Firebase products loading failed:', error);
                    // Use built-in fallback products so the app still works
                    firebaseProducts = { 'IS18': { code: 'IS18', rate: 0.05 } };
                    firebaseLoaded = true;
                    populateProductDatalist();
                    const warning = document.createElement('div');
                    warning.style.cssText = 'font-size:0.8rem;color:#f59e0b;padding:6px 0;';
                    warning.textContent = '⚠️ Firebase غير متاح، تم استخدام البيانات الاحتياطية';
                    productCodeInput.parentNode.appendChild(warning);
                });
        }

        if (window.getProducts) {
            onFirebaseReady();
        } else {
            document.addEventListener('firebase-ready', onFirebaseReady, { once: true });
        }
    }

    loadFirebaseProducts();
});
