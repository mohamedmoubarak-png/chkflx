/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  i18n.js — Internationalization & Translation Engine (AR/EN)
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 *  يُحظر نسخ هذا الكود أو إعادة توزيعه دون إذن كتابي مسبق.
 * ============================================================
 */

const translations = {
    ar: {
        pageTitle: "Investo Cheque Pro | حاسبة المشروعات",
        printTitle: "عرض مديونية وتسوية شيكات المشروعات الصغيرة",
        printClient: "العميل: ",
        printDateLabel: "التاريخ: ",
        formTitle: "بيانات العملية",
        clientNameLabel: "اسم العميل (اختياري)",
        clientNamePlaceholder: "أدخل اسم العميل",
        loanAmountLabel: "مبلغ القرض (ج.م)",
        errorLoanAmount: "يرجى إدخال مبلغ صحيح أكبر من 1000",
        productCodeLabel: "المنتج المصرفي",
        prodIS18: "مشروعات صغيرة (5% متناقصة)",
        prodCustom: "تخصيص حر",
        interestRateLabel: "نسبة الفائدة السنوية (%)",
        adminFeesLabel: "الرسوم الإدارية (%)",
        errorRate: "يرجى إدخال نسبة صحيحة",
        durationLabel: "مدة القرض (بالشهور)",
        errorDuration: "المدة غير صحيحة، أدنى مدة 6 شهور",
        disburseDateLabel: "تاريخ المنح",
        errorDate: "يرجى إختيار تاريخ صحيح",
        guarantorLabel: "هل يوجد ضامن؟",
        calcBtn: "احسب الآن",
        globalError: "يرجى تصحيح الأخطاء في الحقول أعلاه.",
        resultsTitle: "لوحة المخرجات",
        clientDebtsTitle: "شيكات العميل",
        printBtn: "طباعة",
        emiLabel: "القسط الشهري العادي (EMI)",
        emiDesc: "قسط ثابت لبرمجة النظام",
        clientChecksLabel: "عدد الشيكات للعميل",
        clientChecksDesc: "دورية نصف سنوية (كل 6 شهور)",
        firstCheckLabel: "قيمة الشيك الأول",
        showAllCheques: "عرض مبالغ الشيكات",
        chequeNumber: "شيك رقم",
        guarChecksTitle: "شيكات الضامن",
        guarCountLabel: "عدد الشيكات",
        guarCountDesc: "سنوية الإستحقاق",
        guarFirstLabel: "قيمة الشيك الأول (سنوي)",
        guarFirstDesc: "القسط الفعلي + 11 قسط",
        showGuarCheques: "عرض مبالغ شيكات الضامن",
        heroLabel: "قيمة الشيك الأول للعميل",
        heroSub: "يتضمن فائدة فترة السماح + 5 أقساط",
        chartTitle: "توزيع قيم الشيكات على تواريخ الاستحقاق",
        footerRights: "جميع الحقوق محفوظة",
        footerCredit: "developed by"
    },
    en: {
        pageTitle: "Investo Cheque Pro | Project Calculator",
        printTitle: "Small Projects Debt & Cheque Settlement Statement",
        printClient: "Client: ",
        printDateLabel: "Date: ",
        formTitle: "Operation Details",
        clientNameLabel: "Client Name (Optional)",
        clientNamePlaceholder: "Enter client name",
        loanAmountLabel: "Loan Amount (EGP)",
        errorLoanAmount: "Please enter a valid amount > 1000",
        productCodeLabel: "Banking Product",
        prodIS18: "Small Projects (5% Declining)",
        prodCustom: "Custom Configuration",
        interestRateLabel: "Annual Interest Rate (%)",
        adminFeesLabel: "Admin Fees (%)",
        errorRate: "Please enter a valid percentage",
        durationLabel: "Loan Duration (Months)",
        errorDuration: "Invalid duration, minimum is 6 months",
        disburseDateLabel: "Disbursement Date",
        errorDate: "Please select a valid date",
        guarantorLabel: "Is there a guarantor?",
        calcBtn: "Calculate Now",
        globalError: "Please correct the errors in the fields above.",
        resultsTitle: "Output Dashboard",
        clientDebtsTitle: "Client Cheques",
        printBtn: "Print",
        emiLabel: "Regular Monthly Installment (EMI)",
        emiDesc: "Fixed installment for system programming",
        clientChecksLabel: "Client Cheques Count",
        clientChecksDesc: "Semi-annual frequency (every 6 months)",
        firstCheckLabel: "First Cheque Value",
        showAllCheques: "Show Cheques Amounts",
        chequeNumber: "Cheque #",
        guarChecksTitle: "Guarantor Cheques",
        guarCountLabel: "Cheques Count",
        guarCountDesc: "Annual maturity",
        guarFirstLabel: "First Cheque Value (Annual)",
        guarFirstDesc: "Actual installment + 11 installments",
        showGuarCheques: "Show Guarantor Cheques",
        heroLabel: "Client's First Cheque Value",
        heroSub: "Includes grace-period interest + 5 installments",
        chartTitle: "Cheque amounts distribution by due date",
        footerRights: "All rights reserved",
        footerCredit: "developed by"
    }
};

let currentLang = 'ar'; // Default

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.setAttribute('placeholder', translations[lang][key]);
        }
    });

    // ── Footer direction flip (text stays Arabic, only direction changes) ──
    const footer = document.getElementById('appFooter');
    if (footer) {
        footer.style.direction = lang === 'ar' ? 'rtl' : 'ltr';
        footer.style.textAlign = 'center';
    }
}

function getTranslation(key) {
    return translations[currentLang][key] || key;
}

function getCurrentLang() {
    return currentLang;
}
