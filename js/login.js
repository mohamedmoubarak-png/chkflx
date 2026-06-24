/* ChequeFlex — Admin login via Supabase Auth (real authentication).
   No credentials live in the client; the server validates and issues a JWT. */
import { supabase } from './supabase.js';

const $ = (id) => document.getElementById(id);

// If already signed in, go straight to the admin panel
supabase.auth.getSession().then(({ data }) => {
    if (data && data.session) window.location.replace('admin.html');
});

async function handleLogin() {
    const emailInput = $('email');
    const passwordInput = $('password');
    const loginBtn = $('loginBtn');
    const spinner = $('spinner');
    const loginBtnText = $('loginBtnText');
    const globalError = $('globalError');

    // Reset error states
    globalError.style.display = 'none';
    emailInput.classList.remove('invalid');
    passwordInput.classList.remove('invalid');
    $('error-email').style.display = 'none';
    $('error-password').style.display = 'none';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let valid = true;
    if (!email) { emailInput.classList.add('invalid'); $('error-email').style.display = 'block'; valid = false; }
    if (!password) { passwordInput.classList.add('invalid'); $('error-password').style.display = 'block'; valid = false; }
    if (!valid) return;

    // Loading state
    loginBtn.disabled = true;
    spinner.style.display = 'block';
    loginBtnText.textContent = 'جارٍ التحقق...';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data || !data.session) {
        globalError.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        globalError.style.display = 'block';
        emailInput.classList.add('invalid');
        passwordInput.classList.add('invalid');
        passwordInput.value = '';
        loginBtn.disabled = false;
        spinner.style.display = 'none';
        loginBtnText.textContent = 'تسجيل الدخول';
        return;
    }

    // Success — Supabase persists the session; go to admin
    window.location.replace('admin.html');
}

$('loginBtn').addEventListener('click', handleLogin);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
