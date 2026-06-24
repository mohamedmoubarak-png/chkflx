

/**
 * ============================================================
 *  ChequeFlex — حاسبة الشيكات الذكية
 *  ui.js — UI Renderer: Results, Modals & Print Builder
 * ============================================================
 *  © 2026 MSM-FINTECH. جميع الحقوق محفوظة.
 *  تطوير وبناء المبرمج: MOHAMED SAYED MUBARAK
 *  يُحظر نسخ هذا الكود أو إعادة توزيعه دون إذن كتابي مسبق.
 * ============================================================
 */

/* Escape a string for safe insertion into HTML (XSS defense). */
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function renderResults(results, loanAmount, duration, hasGuarantor) {
    const { actualFirstInstallment, clientCheques, guarantorCheques } = results;

    // Client Stats
    const clientCount = clientCheques.length;
    const clientFirstCheck = clientCheques.length > 0 ? clientCheques[0].amount : 0;
    const clientRemCheck = clientCheques.length > 1 ? clientCheques[1].amount : clientFirstCheck;

    setValue('valCount', clientCount);
    setValue('valFirstCheck', formatCurrency(clientFirstCheck));
    setValue('valRemChecks', formatCurrency(clientRemCheck));

    // Client accordion head shows the headline number (first client cheque)
    setValue('clientHeadValue', formatCurrency(clientFirstCheck));

    // Reset both accordion cards to collapsed on each new calculation
    collapseAccordion('clientAccordion', 'clientAccordionHead');
    collapseAccordion('guarAccordion', 'guarAccordionHead');

    // Collapse the expandable "remaining cheques" cards and (re)build their lists
    closeExpandable('clientRemainingCard');
    closeExpandable('guarRemainingCard');
    buildRemainingList(clientCheques, 'clientRemainingList', 'client');

    // Store cheques data for modal
    window.currentClientCheques = clientCheques;
    window.currentGuarantorCheques = guarantorCheques;

    // Guarantor
    const guarPanel = document.getElementById('guarantorPanel');
    if (hasGuarantor) {
        guarPanel.style.display = 'block';
        const guarCount = guarantorCheques.length;
        const guarFirst = guarantorCheques.length > 0 ? guarantorCheques[0].amount : 0;
        const guarRem = guarantorCheques.length > 1 ? guarantorCheques[1].amount : guarFirst;
        
        setValue('valGuarCount', guarCount);
        setValue('valGuarFirst', formatCurrency(guarFirst));
        setValue('valGuarRem', formatCurrency(guarRem));

        // Guarantor accordion head shows the first guarantor cheque value
        setValue('guarHeadValue', formatCurrency(guarFirst));
        buildRemainingList(guarantorCheques, 'guarRemainingList', 'guar');
    } else {
        guarPanel.style.display = 'none';
    }

    document.getElementById('resultsSection').style.display = 'block';

    // Generate printable cheques list
    buildPrintableCheques(clientCheques, guarantorCheques, hasGuarantor);

    // Draw payment distribution chart (screen only)
    renderChart(clientCheques, guarantorCheques, hasGuarantor);

    // Auto scroll to results on first calculation
    if(!window.hasScrolled) {
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        window.hasScrolled = true;
    }
}

/* Set a stat-card value and trigger a brief pulse animation */
function setValue(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    pulse(el);
}

function pulse(el) {
    el.classList.remove('value-pulse');
    // force reflow so the animation can replay on every update
    void el.offsetWidth;
    el.classList.add('value-pulse');
}

/* Collapse an accordion result card (used to reset state on each calculation) */
function collapseAccordion(cardId, headId) {
    const card = document.getElementById(cardId);
    const head = document.getElementById(headId);
    if (card) card.classList.remove('open');
    if (head) head.setAttribute('aria-expanded', 'false');
}

/* Collapse an expandable stat card (the "remaining cheques" card) */
function closeExpandable(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.classList.remove('open');
        card.setAttribute('aria-expanded', 'false');
    }
}

/* Build the list of remaining cheques (from the 2nd cheque to the last)
   shown when the "remaining cheques" card is expanded. type: 'client' | 'guar'. */
function buildRemainingList(cheques, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const lang = getCurrentLang();
    const dateOpts = { year: 'numeric', month: 'short', day: 'numeric' };
    let html = '';
    for (let i = 1; i < cheques.length; i++) {   // start from the 2nd cheque
        const c = cheques[i];
        const dateStr = new Date(c.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', dateOpts);
        html += `<div class="sublist-row">
            <div class="sublist-info">
                <span class="sublist-num">${chequeLabel(c.number || (i + 1), type, lang)}</span>
                <span class="sublist-date">${dateStr}</span>
            </div>
            <span class="sublist-amount">${formatCurrency(c.amount)}</span>
        </div>`;
    }
    container.innerHTML = html;
}

/* Build a tooltip label like "الشيك الأول للعميل" / "الشيك الثاني للضامن".
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

/* Render the payment distribution bar chart using Chart.js.
   Reads only the already-computed cheque data — no recalculation. */
function renderChart(clientCheques, guarantorCheques, hasGuarantor) {
    const canvas = document.getElementById('chequesChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const lang = getCurrentLang();
    const dateOpts = { month: 'short', year: '2-digit' };
    const fmtDate = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', dateOpts);

    // Pull theme-aware colors from CSS variables
    const css = getComputedStyle(document.body);
    const blue = (css.getPropertyValue('--electric-blue') || '#2456E5').trim();
    const green = (css.getPropertyValue('--success') || '#10B981').trim();
    const gridColor = (css.getPropertyValue('--border-color') || 'rgba(120,140,170,0.2)').trim();
    const textColor = (css.getPropertyValue('--text-muted') || '#56708F').trim();

    const labels = clientCheques.map(c => fmtDate(c.date));
    const datasets = [{
        label: getTranslation('clientDebtsTitle') || 'شيكات العميل',
        data: clientCheques.map(c => c.amount),
        chequeNumbers: clientCheques.map((c, i) => c.number || (i + 1)),
        chequeType: 'client',
        backgroundColor: blue,
        borderRadius: 6,
        maxBarThickness: 46
    }];

    if (hasGuarantor && guarantorCheques && guarantorCheques.length > 0) {
        datasets.push({
            label: getTranslation('guarChecksTitle') || 'شيكات الضامن',
            data: guarantorCheques.map(c => ({ x: fmtDate(c.date), y: c.amount })),
            chequeNumbers: guarantorCheques.map((c, i) => c.number || (i + 1)),
            chequeType: 'guar',
            backgroundColor: green,
            borderRadius: 6,
            maxBarThickness: 46
        });
    }

    // Destroy previous instance before redrawing to avoid leaks
    if (window._chequesChart) {
        window._chequesChart.destroy();
    }

    window._chequesChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            locale: lang === 'ar' ? 'ar-EG' : 'en-US',
            plugins: {
                legend: {
                    display: datasets.length > 1,
                    labels: { color: textColor, font: { family: 'Cairo' } }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const ds = ctx.dataset;
                            const num = (ds.chequeNumbers && ds.chequeNumbers[ctx.dataIndex]) || (ctx.dataIndex + 1);
                            return `${chequeLabel(num, ds.chequeType, lang)}: ${formatCurrency(ctx.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    reverse: lang === 'ar',
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Cairo', size: 11 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        font: { family: 'Cairo', size: 11 },
                        callback: (v) => v >= 1000 ? (v / 1000) + 'k' : v
                    }
                }
            }
        }
    });
}

function buildPrintableCheques(clientCheques, guarantorCheques, hasGuarantor) {
    const clientContainer = document.getElementById('printClientChequesContainer');
    const guarContainer = document.getElementById('printGuarantorChequesContainer');
    
    if (clientContainer) clientContainer.innerHTML = '';
    if (guarContainer) guarContainer.innerHTML = '';
    
    const lang = getCurrentLang();
    const dateOpts = { year: 'numeric', month: 'short', day: 'numeric' };

    const buildTable = (cheques, titleKey) => {
        let html = `<h4 style="margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">${getTranslation(titleKey)}</h4>`;
        html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9rem;">
            <thead>
                <tr>
                    <th style="padding: 8px; border: 1px solid #000; text-align: right;">${getTranslation('chequeNumber')}</th>
                    <th style="padding: 8px; border: 1px solid #000; text-align: right;">${getTranslation('thDate') || 'تاريخ الاستحقاق'}</th>
                    <th style="padding: 8px; border: 1px solid #000; text-align: right;">المبلغ</th>
                </tr>
            </thead>
            <tbody>`;
            
        cheques.forEach(cheque => {
            const dateObj = new Date(cheque.date);
            const formattedDate = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', dateOpts);
            
            html += `<tr>
                <td style="padding: 8px; border: 1px solid #000; text-align: right;">${cheque.number}</td>
                <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formattedDate}</td>
                <td style="padding: 8px; border: 1px solid #000; text-align: right; font-weight: bold;">${formatCurrency(cheque.amount)}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
        return html;
    };

    if (clientCheques && clientCheques.length > 0 && clientContainer) {
        clientContainer.innerHTML = buildTable(clientCheques, 'clientDebtsTitle');
    }

    if (hasGuarantor && guarantorCheques && guarantorCheques.length > 0 && guarContainer) {
        guarContainer.innerHTML = buildTable(guarantorCheques, 'guarChecksTitle');
    }
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
