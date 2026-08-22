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
const alert_box = document.querySelector(".alert-box");
const alertbox_overlay = document.querySelector(".alertbox-overlay");
const alertbox_message = document.querySelector(".alertbox-message");

// Gunakan 'let' supaya rujukan butang boleh dikemas kini
let yes = document.querySelector(".yes-alert-box");
let no = document.querySelector(".no-alert-box");

function closeAlertBox() {
    alert_box.classList.remove("enabled");
    alertbox_overlay.classList.remove("enabled");
}

function alertbox(message, callback = null) {
    alert_box.classList.add("enabled");
    alertbox_overlay.classList.add("enabled");
    alertbox_message.textContent = message;

    // 1. Clone nodes untuk buang event listener lama
    const newYes = yes.cloneNode(true);
    const newNo = no.cloneNode(true);

    // 2. Gantikan elemen lama dengan elemen baru
    yes.replaceWith(newYes);
    no.replaceWith(newNo);

    // 3. KEMAS KINI RUJUKAN GLOBAL (Sangat Penting!)
    yes = newYes;
    no = newNo;

    // 4. Tambah event listener pada elemen baru
    yes.addEventListener("click", () => {
        closeAlertBox();
        if (typeof callback === "function") {
            callback();
        }
    });

    alertbox_overlay.onclick = closeAlertBox;
    no.addEventListener("click", closeAlertBox);
}
// Logic untuk delete account
const deleteAccBtns = document.querySelectorAll(".delete-account-btn");

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