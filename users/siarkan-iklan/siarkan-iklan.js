const forms = [
    document.querySelector('.form-1'),
    document.querySelector('.form-2'),
    document.querySelector('.form-3')
];

let currentStep = 0;
let isSubmitting = false;

function goToStep(index) {
    const currentForm = forms[currentStep];
    const nextForm = forms[index];
    const goingBack = index < currentStep;

    const outAnim = goingBack ? 'slideOutReverse' : 'slideOut';
    const inAnim = goingBack ? 'slideInReverse' : 'slideIn';

    currentForm.style.animation = `${outAnim} 0.3s ease forwards`;

    setTimeout(() => {
        currentForm.style.display = 'none';
        currentForm.style.animation = '';

        nextForm.style.display = 'block';
        nextForm.style.animation = 'none';
        void nextForm.offsetWidth;
        nextForm.style.animation = `${inAnim} 0.3s ease forwards`;

        currentStep = index;
    }, 300);
}

function notify(message, type = 'error') {
    if (typeof showNotification === 'function') {
        showNotification(message, type, 3000);
    } else {
        alert(message);
    }
}

// Helper Validation Email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper Validation Nombor Telefon (Format Malaysia: cth 0123456789 / 01112345678 atau +60123456789)
function isValidPhone(phone) {
    // Membenarkan pilihan +60 atau 0, diikuti dengan 9 hingga 10 digit
    const phoneRegex = /^(\+?60|0)1[0-46-9]\d{7,8}$/;
    return phoneRegex.test(phone.replace(/[-\s]/g, '')); // Buang dash/space sebelum test
}

// Hantar pendaftaran tuan rumah (step 2) ke server
async function submitHostRegistration(btn) {
    if (isSubmitting) return false;

    const fullnameInput = document.getElementById('fullname');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const roleInput = document.getElementById('role');

    const fullname = fullnameInput ? fullnameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const role = roleInput ? roleInput.value : '';

    // 1. Semakan Medan Kosong
    if (!fullname || !phone || !email || !role) {
        notify('Sila isi semua maklumat yang diperlukan.');
        return false;
    }

    // 2. Validation Email
    if (!isValidEmail(email)) {
        notify('Format e-mel tidak sah. Sila semak semula.');
        if (emailInput) emailInput.focus();
        return false;
    }

    // 3. Validation Nombor Telefon
    if (!isValidPhone(phone)) {
        notify('Nombor telefon tidak sah. Sila masukkan nombor telefon Malaysia yang betul (cth: 0123456789).');
        if (phoneInput) phoneInput.focus();
        return false;
    }

    isSubmitting = true;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Menghantar...';

    try {
        const res = await fetch('/api/users/become-host', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ fullname, phone, email, role })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            notify(data.message || 'Gagal mendaftar sebagai tuan rumah.');
            return false;
        }

        return true;
    } catch (err) {
        console.error('Ralat pendaftaran tuan rumah:', err);
        notify('Ralat sambungan. Sila cuba lagi.');
        return false;
    } finally {
        isSubmitting = false;
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

document.querySelectorAll('.next-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
        const currentForm = forms[currentStep];
        const formEl = currentForm.querySelector('form');

        if (formEl && !formEl.checkValidity()) {
            formEl.reportValidity();
            return;
        }

        if (currentStep === 1) {
            const ok = await submitHostRegistration(btn);
            if (!ok) return;
        }

        if (currentStep < forms.length - 1) {
            goToStep(currentStep + 1);
        }
    });
});

document.querySelectorAll('.back-button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        } else {
            history.back();
        }
    });
});

document.getElementById('add-listing-btn')?.addEventListener('click', () => {
    window.location.href = '/users/siarkan-iklan/post/';
});

document.getElementById('later-btn')?.addEventListener('click', () => {
    window.location.href = '/';
});

async function initProfile() {
    const [{ user, error }] = await Promise.all([loadUser(), domReady()]);

    if (error || !user) return;

    const skipRoles = ["Tuan Rumah", "Ejen Hartanah", "Admin"];

    if (skipRoles.includes(user.role)) {
        window.location.replace("/users/siarkan-iklan/post/");
        return;
    }

    prefillHostForm(user);
}

function prefillHostForm(user) {
    const fields = {
        fullname: user.full_name,
        phone: user.phoneNo,
        email: user.email
    };

    Object.entries(fields).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input && value && !input.value) {
            input.value = value;
        }
    });
}

initProfile();