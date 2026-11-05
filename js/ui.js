/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  ui.js — UI Renderer: Results, Copy & Print Builder
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 *  يُحظر نسخ هذا الكود أو إعادة توزيعه دون إذن كتابي مسبق.
 * ============================================================
 *  Display only — every number shown here comes straight from
 *  generateSchedule() in calculator.js; nothing is recalculated.
 * ============================================================
 */

/* Escape a string for safe insertion into HTML (XSS defense). */
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

/* Dates like "5 يونيو 2027" — Latin digits so they match the amounts. */
function formatChequeDate(dateStr, lang) {
    const locale = lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

/* "3 شهور" / "12 شهر" / "6 months" — Arabic counts 3–10 take the plural. */
function monthsText(n) {
    if (getCurrentLang() === 'ar') return n + ' ' + (n >= 3 && n <= 10 ? 'شهور' : 'شهر');
    return n + ' ' + (n === 1 ? 'month' : 'months');
}

function sumAmounts(cheques) {
    return cheques.reduce((s, c) => s + c.amount, 0);
}

const COPY_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

/**
 * Render the results.
 * meta: { code, rate, clientName } — used for the summary band and printout.
 */
function renderResults(results, loanAmount, duration, hasGuarantor, meta) {
    window._lastRender = [results, loanAmount, duration, hasGuarantor, meta];
    meta = meta || {};
    const lang = getCurrentLang();
    const { clientCheques, guarantorCheques, regularEMI } = results;

    // Store cheques data (also used by the cheques modal and copy-all)
    window.currentClientCheques = clientCheques;
    window.currentGuarantorCheques = hasGuarantor ? guarantorCheques : [];

    // --- Summary band ---
    const nameEl = document.getElementById('summaryClient');
    if (nameEl) nameEl.textContent = meta.clientName || getTranslation('clientDebtsTitle');
    const dateEl = document.getElementById('summaryDate');
    if (dateEl) dateEl.textContent = formatChequeDate(new Date().toDateString(), lang);
    const chips = document.getElementById('summaryChips');
    if (chips) {
        const items = [
            formatTranslation('loanChip', { v: formatCurrency(loanAmount) }),
            meta.code ? formatTranslation('productChip', { code: meta.code, rate: (meta.rate * 100).toFixed(2) }) : '',
            formatTranslation('durationChip', { d: duration }),
            formatTranslation('monthlyChip', { v: formatCurrency(regularEMI) })
        ].filter(Boolean);
        chips.innerHTML = items.map(t => `<span class="summary-chip">${escapeHtml(t)}</span>`).join('');
    }

    // --- Cheque panels ---
    renderChequePanel(clientCheques, 6, 'client', lang);
    const guarPanel = document.getElementById('guarantorPanel');
    if (hasGuarantor) {
        guarPanel.style.display = '';
        renderChequePanel(guarantorCheques, 12, 'guar', lang);
    } else {
        guarPanel.style.display = 'none';
    }
    document.querySelector('.cheques-grid').classList.toggle('single', !hasGuarantor);

    document.getElementById('resultsSection').style.display = 'block';

    // --- Printout ---
    buildPrintableCheques(clientCheques, guarantorCheques, hasGuarantor);

    // Auto scroll to results on first calculation
    if (!window.hasScrolled) {
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        window.hasScrolled = true;
    }
}

/* Re-draw the last results (e.g. after switching language). */
function rerenderResults() {
    if (window._lastRender) renderResults.apply(null, window._lastRender);
}

/* One panel: a row per cheque (number, due date, months, amount, copy) + total. */
function renderChequePanel(cheques, period, type, lang) {
    const prefix = type === 'guar' ? 'guar' : 'client';
    const rowsEl = document.getElementById(prefix + 'Rows');
    const badgeEl = document.getElementById(prefix + 'Badge');
    const totalEl = document.getElementById(prefix + 'Total');

    if (badgeEl) {
        badgeEl.textContent = formatTranslation(type === 'guar' ? 'guarBadge' : 'clientBadge', { n: cheques.length });
    }

    if (rowsEl) {
        rowsEl.innerHTML = cheques.map((c, i) => {
            const partial = c.months && c.months < period;
            const amount = formatCurrency(c.amount);
            const label = chequeLabel(c.number || (i + 1), type, lang);
            return `<div class="cheque-row">
                <span class="cheque-num">${c.number || (i + 1)}</span>
                <div class="cheque-when">
                    <div class="cheque-date">${formatChequeDate(c.date, lang)}</div>
                    <div class="cheque-months${partial ? ' partial' : ''}">${c.months ? monthsText(c.months) : ''}${partial ? ' — ' + getTranslation('lastChequeTag') : ''}</div>
                </div>
                <span class="cheque-amt">${amount}</span>
                <button type="button" class="cheque-copy" data-copy="${amount}" title="${escapeHtml(getTranslation('copyAmount'))}" aria-label="${escapeHtml(getTranslation('copyAmount') + ' — ' + label)}">${COPY_ICON}</button>
            </div>`;
        }).join('');
    }

    if (totalEl) totalEl.textContent = formatCurrency(sumAmounts(cheques));
}

/* Plain-text list of all amounts (for WhatsApp / notes). */
function buildCopyAllText() {
    const lang = getCurrentLang();
    const block = (titleKey, cheques) => getTranslation(titleKey) + ':\n' +
        cheques.map((c, i) => `${c.number || (i + 1)}) ${formatChequeDate(c.date, lang)} — ${formatCurrency(c.amount)} (${monthsText(c.months)})`).join('\n') +
        '\n' + getTranslation('totalLabel') + ': ' + formatCurrency(sumAmounts(cheques));
    const meta = (window._lastRender && window._lastRender[4]) || {};
    let text = meta.clientName ? meta.clientName + '\n\n' : '';
    text += block('clientDebtsTitle', window.currentClientCheques || []);
    if (window.currentGuarantorCheques && window.currentGuarantorCheques.length) {
        text += '\n\n' + block('guarChecksTitle', window.currentGuarantorCheques);
    }
    return text;
}

/* Build a label like "الشيك الأول للعميل" / "الشيك الثاني للضامن".
   type: 'client' | 'guar'. */
function chequeLabel(num, type, lang) {
    if (lang === 'ar') {
        const ordinals = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس',
                          'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
        const ord = (num >= 1 && num < ordinals.length) ? ('الشيك ' + ordinals[num]) : ('الشيك رقم ' + num);
        const who = type === 'guar' ? 'للضامن' : 'للعميل';
        return `${ord} ${who}`;
    }
    const who = type === 'guar' ? 'Guarantor' : 'Client';
    return `Cheque #${num} (${who})`;
}

/* Printout: one table per party with months + total, then signature lines. */
function buildPrintableCheques(clientCheques, guarantorCheques, hasGuarantor) {
    const container = document.getElementById('printChequesContainer');
    if (!container) return;
    const lang = getCurrentLang();

    const buildTable = (cheques, titleKey) => {
        const rows = cheques.map((c, i) => `<tr>
                <td>${c.number || (i + 1)}</td>
                <td>${formatChequeDate(c.date, lang)}</td>
                <td>${c.months || ''}</td>
                <td class="p-amt">${formatCurrency(c.amount)}</td>
            </tr>`).join('');
        return `<h4 class="p-sec">${getTranslation(titleKey)}</h4>
            <table class="p-table">
                <thead><tr>
                    <th>${getTranslation('chequeNumber')}</th>
                    <th>${getTranslation('thDate')}</th>
                    <th>${getTranslation('monthsCol')}</th>
                    <th>${getTranslation('amountCol')}</th>
                </tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr><td colspan="3">${getTranslation('totalLabel')}</td><td class="p-amt">${formatCurrency(sumAmounts(cheques))}</td></tr></tfoot>
            </table>`;
    };

    let html = buildTable(clientCheques, 'printClientSec');
    if (hasGuarantor && guarantorCheques && guarantorCheques.length > 0) {
        html += buildTable(guarantorCheques, 'printGuarSec');
    }
    const signs = ['signClient'].concat(hasGuarantor ? ['signGuar'] : [], ['signEmployee']);
    html += `<div class="p-signs">${signs.map(k => `<div>${getTranslation(k)}</div>`).join('')}</div>`;
    container.innerHTML = html;
}

function renderChequesList(cheques, titleKey) {
    const modal = document.getElementById('chequesModal');
    const container = document.getElementById('chequesListContainer');
    const title = document.getElementById('modalTitle');
    
    title.textContent = getTranslation(titleKey);
    container.innerHTML = '';
    
    const lang = getCurrentLang();
    const dateOpts = { year: 'numeric', month: 'short', day: 'numeric' };

    cheques.forEach(cheque => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.padding = '14px 16px';
        item.style.borderBottom = '1px solid var(--border-color)';
        item.style.backgroundColor = 'var(--input-bg)';
        item.style.marginBottom = '8px';
        item.style.borderRadius = '8px';
        
        const dateObj = new Date(cheque.date);
        const formattedDate = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', dateOpts);

        item.innerHTML = `
            <div style="font-weight: 700; color: var(--text-muted);">
                ${getTranslation('chequeNumber')} ${cheque.number}
                <div style="font-size: 0.85rem; font-weight: normal; margin-top: 4px;">${formattedDate}</div>
            </div>
            <div style="font-weight: 800; font-size: 1.1rem; color: var(--royal-gold);">
                ${formatCurrency(cheque.amount)}
            </div>
        `;
        container.appendChild(item);
    });

    modal.classList.add('active');
}
