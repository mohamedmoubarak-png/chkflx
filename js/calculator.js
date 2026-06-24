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

    // --- 3. حساب شيكات العميل (كل 6 شهور) ---
    const clientCheques = [];
    const clientChequeCount = duration / 6;

    for (let i = 1; i <= clientChequeCount; i++) {
        let chequeAmount;
        if (i === 1) {
            chequeAmount = (5 * regularEMI) + actualFirstInstallment;
        } else {
            chequeAmount = 6 * regularEMI;
        }

        let dateObj = new Date(installmentDates[0].getTime());
        dateObj.setMonth(dateObj.getMonth() + (i * 6) - 1);

        clientCheques.push({
            number: i,
            amount: chequeAmount,
            date: dateObj.toLocaleDateString('en-US')
        });
    }

    // --- 4. حساب شيكات الضامن (كل 12 شهر) ---
    const guarantorCheques = [];
    const guarantorChequeCount = duration / 12;

    for (let i = 1; i <= guarantorChequeCount; i++) {
        let chequeAmount;
        if (i === 1) {
            chequeAmount = (11 * regularEMI) + actualFirstInstallment;
        } else {
            chequeAmount = 12 * regularEMI;
        }

        let dateObj = new Date(installmentDates[0].getTime());
        dateObj.setMonth(dateObj.getMonth() + (i * 12) - 1);

        guarantorCheques.push({
            number: i,
            amount: chequeAmount,
            date: dateObj.toLocaleDateString('en-US')
        });
    }

    return {
        regularEMI,
        graceInterest,
        actualFirstInstallment,
        clientCheques,
        guarantorCheques
    };
}