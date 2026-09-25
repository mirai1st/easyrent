// function toggleSwitch(el) {
//     const icon = el.querySelector('i');
//     const isOn = icon.classList.contains('fa-toggle-on');
//     if (isOn) {
//         icon.classList.remove('fa-toggle-on');
//         icon.classList.add('fa-toggle-off');
//         // panggil API/simpan state 'off' kat sini
//     } else {
//         icon.classList.remove('fa-toggle-off');
//         icon.classList.add('fa-toggle-on');
//         // panggil API/simpan state 'on' kat sini
//     }
// }

// function toggleDropdown(el) {
//     const dropdown = el.closest('.settings').querySelector('.lang-dropdown');
//     const icon = el.querySelector('i');
//     const isOpen = dropdown.style.display === 'block';
//     dropdown.style.display = isOpen ? 'none' : 'block';
//     icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
// }

// function setLanguage(lang) {
//     document.getElementById('lang-current').textContent = lang;
//     document.querySelector('.lang-dropdown').style.display = 'none';
//     // simpan pilihan bahasa kat sini (localStorage / API)
// }


document.querySelectorAll('.settings').forEach(setting => {
    const content = setting.querySelector('.setting-content');
    if (!content) return;

    setting.querySelector('table').addEventListener('click', () => {
        const isOpen = setting.classList.contains('open');

        if (isOpen) {
            content.style.maxHeight = null;
            setting.classList.remove('open');
        } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            setting.classList.add('open');
        }
    });
});

document.querySelectorAll('.settings-toggle').forEach(setting => {
    const toggleBtn = setting.querySelector('.btn-settings-toggle');
    if (!toggleBtn) return;

    const icon = toggleBtn.querySelector('i');
    if (!icon) return;

    setting.querySelector('table').addEventListener('click', (e) => {
        e.stopPropagation(); // elak trigger dropdown table punya click sekali (kalau ada)

        const isOn = icon.classList.contains('fa-toggle-on');

        if (isOn) {
            icon.classList.remove('fa-toggle-on');
            icon.classList.add('fa-toggle-off');
        } else {
            icon.classList.remove('fa-toggle-off');
            icon.classList.add('fa-toggle-on');
        }

        const settingNames = {
            'notif-email': 'Notifikasi E-mel',
            'notif-push': 'Notifikasi Push',
            'hide-profile': 'Sembunyikan profil'
        };
        const settingKey = setting.dataset.setting || setting.getAttribute('data');
        const settingName = settingNames[settingKey] || 'Tetapan';
        const state = !isOn ? 'dihidupkan' : 'dimatikan';
    });
});

// sidepanel

document.querySelectorAll('.side-panel-link:not(#btn-logout)').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        const targetId = link.getAttribute('href');
        const target = document.querySelector(targetId);
        if (!target) return;

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        document.querySelectorAll('.side-panel-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

document.getElementById('btn-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    // panggil API logout / clear session / redirect ke login page kat sini
    console.log('Logout diklik');
});



// Alert box components
const alertBox = document.querySelector(".alert-box");
const alertboxOverlay = document.querySelector(".alertbox-overlay");
const alertboxMessage = document.querySelector(".alertbox-message");

const yesBtn = document.querySelector(".yes-alert-box");
const noBtn = document.querySelector(".no-alert-box");

function closeAlertBox() {
    if (!alertBox || !alertboxOverlay) return;

    alertBox.classList.remove("enabled");
    alertboxOverlay.classList.remove("enabled");
    alertboxMessage.textContent = "";

    if (yesBtn) yesBtn.onclick = null;
    if (noBtn) noBtn.onclick = null;
    if (alertboxOverlay) alertboxOverlay.onclick = null;
}

function alertbox(message, callback = null) {
    if (!alertBox || !alertboxOverlay || !alertboxMessage || !yesBtn || !noBtn) return;

    alertBox.classList.add("enabled");
    alertboxOverlay.classList.add("enabled");
    alertboxMessage.textContent = message;

    yesBtn.onclick = () => {
        closeAlertBox();
        if (callback) callback();
    };

    noBtn.onclick = closeAlertBox;
    alertboxOverlay.onclick = closeAlertBox;
}

// Logic untuk delete account
const deleteAccBtns = document.querySelectorAll(".delete-account-btn");

const changePasswordModal = document.getElementById("changepassword-modal");
const changePasswordCloseBtn = document.querySelector(".changepassword-modal-close-btn");
const changePasswordOpenBtns = document.querySelectorAll("[data-open-modal='change-password']");

function openChangePasswordModal() {
    if (!changePasswordModal) return;
    changePasswordModal.style.display = "flex";
    changePasswordModal.classList.add("enabled");
}

function closeChangePasswordModal() {
    if (!changePasswordModal) return;
    changePasswordModal.style.display = "none";
    changePasswordModal.classList.remove("enabled");
}

changePasswordOpenBtns.forEach(btn => {
    btn.addEventListener("click", openChangePasswordModal);
});

if (changePasswordCloseBtn) {
    changePasswordCloseBtn.addEventListener("click", closeChangePasswordModal);
}

if (changePasswordModal) {
    changePasswordModal.addEventListener("click", (event) => {
        if (event.target === changePasswordModal) {
            closeChangePasswordModal();
        }
    });
}

deleteAccBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        // Amaran Pertama
        alertbox(
            "Adakah anda pasti ingin memadam akaun anda? Kesemua data anda tidak boleh dipulihkan selepas tindakan ini.", 
            () => {
                // Amaran Kedua (Hanya dipanggil SELEPAS pengguna tekan 'Yes' pada amaran pertama)
                alertbox(
                    "Adakah anda pasti ingin meneruskannya?", 
                    async () => {    
                        try {
                            const response = await fetch("/api/delete-account", {
                                method: "DELETE",
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            });

                            const data = await response.json();

                            if (data.success) {
                                alert(data.message);
                                window.location.href = "/"; 
                            } else {
                                alert(data.message || "Gagal memadam akaun.");
                            }
                        } catch (error) {
                            console.error("Network error:", error);
                        }
                    }
                );
            }
        );
    });
});

const logOutBtns = document.querySelectorAll(".logout-acc-btn");

logOutBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
        alertbox("Adakah anda pasti untuk melog keluar akaun anda?", () => {
            logoutUser();
        });
    });
});

async function logoutUser() {
    try {
        const response = await fetch("/api/logout", {
            method: "POST",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Logout gagal:", data.message);
            return;
        }

        window.location.href = "/";

    } catch (error) {
        console.error("Gagal log keluar:", error);
    }
}

// Change Password Modal

// Pilih semua ikon mata yang bermula dengan id 'toggle-password-'
const eyeIcons = document.querySelectorAll('[id^="toggle-password-"]');

eyeIcons.forEach(icon => {
    icon.addEventListener('click', function () {
        const passwordInput = this.previousElementSibling;

        if (!passwordInput) return;

        if (passwordInput.getAttribute('type') === 'password') {
            passwordInput.setAttribute('type', 'text');
            this.classList.remove('fa-eye');
            this.classList.add('fa-eye-slash');
        } else {
            passwordInput.setAttribute('type', 'password');
            this.classList.remove('fa-eye-slash');
            this.classList.add('fa-eye');
        }
    });
});

function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

const changePasswordForm = document.getElementById("changepasswordForm");

if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const oldPassword = document.getElementById("password-old")?.value || "";
        const newPassword = document.getElementById("password-new")?.value || "";
        const confirmPassword = document.getElementById("password-new-confirm")?.value || "";

        if (!oldPassword || !newPassword || !confirmPassword) {
            showNotification("Sila lengkapkan semua medan kata laluan.", "error", 3000);
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification("Kata laluan baru dan pengesahan tidak sama.", "error", 3000);
            return;
        }

        if (!isStrongPassword(newPassword)) {
            showNotification("Kata laluan mesti sekurang-kurangnya 8 aksara, mengandungi huruf besar, huruf kecil, nombor dan simbol.", "error", 3000);
            return;
        }

        if (newPassword === oldPassword) {
            showNotification("Kata laluan baru mesti berbeza daripada kata laluan lama.", "error", 3000);
            return;
        }

        const submitBtn = changePasswordForm.querySelector("button[type='submit']");
        const spinner = changePasswordForm.querySelector(".spinner");

        if (submitBtn) submitBtn.classList.add("loading");
        if (spinner) spinner.style.display = "inline-block";

        try {
            const response = await fetch("/api/change-password", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                    confirmPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Gagal mengubah kata laluan.");
            }

            showNotification(data.message || "Kata laluan berjaya dikemaskini.", "success", 3000);

            closeChangePasswordModal();
            changePasswordForm.reset();
        } catch (error) {
            showNotification(error.message || "Gagal mengubah kata laluan.", "error", 3000);
        } finally {
            if (submitBtn) submitBtn.classList.remove("loading");
            if (spinner) spinner.style.display = "none";
        }
    });
}

