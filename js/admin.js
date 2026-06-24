/* ChequeFlex — Admin panel logic with a real Supabase Auth session guard.
   Writes are additionally enforced server-side by Row Level Security. */
import { supabase } from './supabase.js';
import { saveProduct, deleteProduct, listenToProducts, getProducts } from './products.js';

const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showToast(msg, type = 'success') {
    const t = $('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 4500);
}

function showTableError(err) {
    console.error('[Admin] Supabase read error:', err);
    $('productsTableBody').innerHTML =
        `<tr><td colspan="4" class="empty-state" style="color:#ef4444;">
            ⚠️ خطأ في القراءة من Supabase:<br>
            <span style="font-size:0.8rem;opacity:0.8;">${escapeHtml(err.code || '')} — ${escapeHtml(err.message || '')}</span>
         </td></tr>`;
}

function renderTable(productsMap) {
    const tbody = $('productsTableBody');
    const entries = Object.values(productsMap || {});

    if (entries.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="4" class="empty-state">لا توجد منتجات بعد — أضف IS18 بنسبة 5 للبدء.</td></tr>';
        return;
    }

    entries.sort((a, b) => String(a.code).localeCompare(String(b.code)));

    tbody.innerHTML = entries.map((p) => {
        const code = escapeHtml(p.code);
        const pct = (Number(p.rate) * 100).toFixed(3);   // decimal (0.075) -> percent (7.500)
        return `
        <tr>
            <td><span class="code-badge">${code}</span></td>
            <td style="font-weight:800;color:var(--gold);">${pct}%</td>
            <td>
                <input class="rate-input" type="number" value="${pct}"
                       min="0.001" max="100" step="0.001"
                       id="rate-${code}" title="أدخل النسبة كنسبة مئوية">
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-save-row" data-save="${code}">حفظ</button>
                    <button class="btn-delete-row" data-del="${code}">حذف</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-save]').forEach((btn) =>
        btn.addEventListener('click', () => saveRow(btn.dataset.save)));
    tbody.querySelectorAll('[data-del]').forEach((btn) =>
        btn.addEventListener('click', () => deleteRow(btn.dataset.del)));
}

function refreshTable() {
    getProducts().then(renderTable).catch(showTableError);
}

async function addProduct() {
    const codeEl = $('newCode');
    const rateEl = $('newRate');

    ['newCode', 'newRate'].forEach((id) => {
        $(id).classList.remove('invalid');
        $('err-' + id).style.display = 'none';
    });

    const code = codeEl.value.trim().toUpperCase().replace(/\s+/g, '');
    const percent = parseFloat(rateEl.value);

    let ok = true;
    // Strict charset validation prevents stored XSS via product codes
    if (!code || !/^[A-Z0-9_-]+$/.test(code)) {
        codeEl.classList.add('invalid');
        $('err-newCode').textContent = 'كود غير صالح — حروف إنجليزية وأرقام و _ - فقط';
        $('err-newCode').style.display = 'block';
        ok = false;
    }
    if (isNaN(percent) || percent <= 0 || percent > 100) {
        rateEl.classList.add('invalid');
        $('err-newRate').style.display = 'block';
        ok = false;
    }
    if (!ok) return;

    const decimalRate = percent / 100;
    const btn = $('addBtn');
    const origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'جارٍ الحفظ...';

    try {
        await saveProduct(code, decimalRate);
        codeEl.value = '';
        rateEl.value = '';
        showToast(`✓ تم حفظ "${code}" — النسبة المخزَّنة = ${decimalRate}`, 'success');
        refreshTable();
    } catch (err) {
        console.error('[addProduct]', err);
        showToast('خطأ أثناء الحفظ: ' + (err.message || ''), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = origHTML;
    }
}

async function saveRow(code) {
    const input = $('rate-' + code);
    const percent = parseFloat(input && input.value);

    if (!input || isNaN(percent) || percent <= 0 || percent > 100) {
        showToast('نسبة غير صحيحة!', 'error');
        return;
    }

    const decimalRate = percent / 100;
    try {
        await saveProduct(code, decimalRate);
        showToast(`✓ "${code}" → ${percent}%  (المخزَّن: ${decimalRate})`, 'success');
        refreshTable();
    } catch (err) {
        console.error('[saveRow]', err);
        showToast('خطأ أثناء الحفظ: ' + (err.message || ''), 'error');
    }
}

async function deleteRow(code) {
    if (!confirm(`حذف المنتج "${code}" نهائياً؟`)) return;
    try {
        await deleteProduct(code);
        showToast(`تم حذف "${code}"`, 'success');
        refreshTable();
    } catch (err) {
        console.error('[deleteRow]', err);
        showToast('خطأ أثناء الحذف: ' + (err.message || ''), 'error');
    }
}

async function logout() {
    try { await supabase.auth.signOut(); } catch (e) {}
    window.location.replace('login.html');
}

/* ── Session guard — the page is only usable with a valid Supabase session ── */
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
    window.location.replace('login.html');
} else {
    document.body.style.visibility = 'visible';
    $('currentUser').textContent = session.user.email || 'مدير';

    $('addBtn').addEventListener('click', addProduct);
    $('logoutBtn').addEventListener('click', logout);
    ['newCode', 'newRate'].forEach((id) =>
        $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') addProduct(); }));

    // Phase 1: immediate fetch; Phase 2: live updates
    getProducts().then(renderTable).catch(showTableError);
    listenToProducts(renderTable, showTableError);

    // If the session ends in another tab, bounce back to login
    supabase.auth.onAuthStateChange((_event, sess) => {
        if (!sess) window.location.replace('login.html');
    });
}
