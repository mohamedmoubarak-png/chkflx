

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

function renderResults(results, loanAmount, duration, hasGuarantor) {
    const { actualFirstInstallment, clientCheques, guarantorCheques } = results;

    // Client Stats
    const clientCount = clientCheques.length;
    const clientFirstCheck = clientCheques.length > 0 ? clientCheques[0].amount : 0;
    const clientRemCheck = clientCheques.length > 1 ? clientCheques[1].amount : clientFirstCheck;

    document.getElementById('valCount').textContent = clientCount;
    document.getElementById('valFirstCheck').textContent = formatCurrency(clientFirstCheck);
    
    const valRemChecks = document.getElementById('valRemChecks');
    if (valRemChecks) {
        valRemChecks.textContent = formatCurrency(clientRemCheck);
    }
    
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
        
        document.getElementById('valGuarCount').textContent = guarCount;
        document.getElementById('valGuarFirst').textContent = formatCurrency(guarFirst);
        
        const valGuarRem = document.getElementById('valGuarRem');
        if (valGuarRem) {
            valGuarRem.textContent = formatCurrency(guarRem);
        }
    } else {
        guarPanel.style.display = 'none';
    }

    document.getElementById('resultsSection').style.display = 'block';
    
    // Generate printable cheques list
    buildPrintableCheques(clientCheques, guarantorCheques, hasGuarantor);
    
    // Auto scroll to results on first calculation
    if(!window.hasScrolled) {
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        window.hasScrolled = true;
    }
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
