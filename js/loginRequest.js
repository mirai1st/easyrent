// ---- Elements ----
const loginBtn = document.querySelector('.loginForm-submit');
const registerBtn = document.querySelector('.registerForm-submit');
const codeverifyBtn = document.querySelector('.codeverifyForm-submit');
const resendCodeBtn = document.getElementById('resend-code-btn');

const registerModal = document.getElementById('register-modal');
const codeverifyModal = document.getElementById('codeverify-modal');
const insertedEmailSpan = document.getElementById('inserted-email');

// Keeps track of which email is currently pending verification
let pendingVerificationEmail = null;

function openCodeverifyModal(email) {
    pendingVerificationEmail = email;
    insertedEmailSpan.textContent = email;

    registerModal.style.display = 'none';
    codeverifyModal.style.display = 'block';
}

// ---- Login ----
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                username: document.getElementById("username-login").value,
                password: document.getElementById("password-login").value
            })
        });

        const data = await response.json();

        if (data.success) {
            window.location = `/?login_success=true`;
            return;
        }

        // Account exists but hasn't verified their email yet
        if (data.needsVerification && data.email) {
            document.getElementById("login-modal").style.display = 'none';
            openCodeverifyModal(data.email);
            return;
        }

        window.location = `/?login_success=false&error=${encodeURIComponent(data.message)}`;
    } catch (err) {
        alert("Ralat sambungan. Sila cuba lagi.");
    } finally {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
});

// ---- Register ----
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    registerBtn.classList.add('loading');
    registerBtn.disabled = true;

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                username: document.getElementById("username-register").value,
                email: document.getElementById("email-register").value,
                password: document.getElementById("password-register").value,
                repeat_password: document.getElementById("repeat_password-register").value
            })
        });

        const data = await response.json();

        if (data.success) {
            openCodeverifyModal(data.email);
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Ralat sambungan. Sila cuba lagi.");
    } finally {
        registerBtn.classList.remove('loading');
        registerBtn.disabled = false;
    }
});

// ---- Verify code ----
document.getElementById("codeverifyForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!pendingVerificationEmail) {
        alert("Sesi pengesahan tamat. Sila daftar semula.");
        return;
    }

    codeverifyBtn.classList.add('loading');
    codeverifyBtn.disabled = true;

    try {
        const response = await fetch("/api/verify-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                email: pendingVerificationEmail,
                code: document.getElementById("codeverify").value
            })
        });

        const data = await response.json();

        if (data.success) {
            window.location = "/?register_success=true";
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Ralat sambungan. Sila cuba lagi.");
    } finally {
        codeverifyBtn.classList.remove('loading');
        codeverifyBtn.disabled = false;
    }
});

// ---- Resend code ----
resendCodeBtn.addEventListener("click", async () => {
    if (!pendingVerificationEmail) {
        alert("Sesi pengesahan tamat. Sila daftar semula.");
        return;
    }

    resendCodeBtn.style.pointerEvents = "none";

    try {
        const response = await fetch("/api/resend-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email: pendingVerificationEmail })
        });

        const data = await response.json();
        alert(data.message);
    } catch (err) {
        alert("Ralat sambungan. Sila cuba lagi.");
    } finally {
        resendCodeBtn.style.pointerEvents = "auto";
    }
});
