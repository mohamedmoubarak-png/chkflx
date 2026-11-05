/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  calculator.js — Banking Math Engine (Actual/360 Bisection)
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 *  يُحظر نسخ هذا الكود أو إعادة توزيعه دون إذن كتابي مسبق.
 * ============================================================
 */

// Pure math functions for banking calculations

function calculatePMT(annualRate, nper, pv) {
    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) return pv / nper;
    return (pv * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -nper));
}

// Pure math functions for banking calculations

function formatCurrency(value) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function generateSchedule(loanAmount, duration, annualRate, disburseDateStr) {
    const RATE = annualRate;
    const msPerDay = 1000 * 60 * 60 * 24;

    // --- 1. حساب تاريخ نهاية فترة السماح (أقرب يوم 5) ---
    const [y, m, d] = disburseDateStr.split('-');
    const disburseDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));

    let next5th = new Date(disburseDate.getFullYear(), disburseDate.getMonth(), 5);
    if (disburseDate.getDate() >= 5) {
        next5th.setMonth(next5th.getMonth() + 1);
    }

    // أيام وفائدة فترة السماح (مثال: من 26 أبريل لـ 5 مايو = 9 أيام)
    let graceDays = Math.round((next5th - disburseDate) / msPerDay);
    if (graceDays < 0) graceDays = 0;
    const graceInterest = loanAmount * (RATE / 360) * graceDays;

    // --- 2. خوارزمية FLEXCUBE (Actual/360) ---
    const installmentDates = [];
    for (let i = 1; i <= duration; i++) {
        // الأقساط الفعلية تبدأ من الشهر التالي لـ next5th
        installmentDates.push(
            new Date(next5th.getFullYear(), next5th.getMonth() + i, 5)
        );
    }

    function getDaysInPeriod(index) {
        if (index === 0) {
            // أيام أول شهر فعلي (من 5 مايو لـ 5 يونيو)
            return Math.round((installmentDates[0] - next5th) / msPerDay);
        }
        return Math.round((installmentDates[index] - installmentDates[index - 1]) / msPerDay);
    }

    function simulateBalance(testEmi) {
        let balance = loanAmount;
        for (let i = 0; i < duration; i++) {
            const days = getDaysInPeriod(i);
            const interest = balance * (RATE / 360) * days;
            const principal = testEmi - interest;
            balance -= principal;
        }
        return balance;
    }

    let low = 0;
    let high = loanAmount;
    let regularEMI = 0;

    for (let iter = 0; iter < 200; iter++) {
        regularEMI = (low + high) / 2;
        const bal = simulateBalance(regularEMI);
        if (Math.abs(bal) < 0.001) break;
        if (bal > 0) low = regularEMI;
        else high = regularEMI;
    }

    const actualFirstInstallment = regularEMI + graceInterest;

    // --- 3/4. تجميع الأقساط في شيكات ---
    // كل شيك يغطي `period` شهر (6 للعميل، 12 للضامن). لو المدة مش من
    // مضاعفات الـ period، آخر شيك بيغطي الشهور الباقية بس
    // (مثال: 33 شهر → عميل 5 شيكات × 6 + شيك 3 شهور، ضامن 2 × 12 + شيك 9 شهور).
    // الشيك الأول = القسط الفعلي الأول (شامل فائدة السماح) + باقي أقساط فترته.
    function buildCheques(period) {
        const cheques = [];
        let start = 0;
        let number = 0;
        while (start < duration) {
            const months = Math.min(period, duration - start);
            number++;
            const amount = (start === 0)
                ? ((months - 1) * regularEMI) + actualFirstInstallment
                : months * regularEMI;
            // تاريخ الشيك = تاريخ آخر قسط في فترته
            const dateObj = new Date(installmentDates[start + months - 1].getTime());
            cheques.push({
                number,
                amount,
                months,
                date: dateObj.toLocaleDateString('en-US')
            });
            start += months;
        }
        return cheques;
    }

    const clientCheques = buildCheques(6);       // العميل: كل 6 شهور
    const guarantorCheques = buildCheques(12);   // الضامن: سنوي

    return {
        regularEMI,
        graceInterest,
        actualFirstInstallment,
        clientCheques,
        guarantorCheques
    };
}