// profile.js
// Perlu load SELEPAS navbar.js / checkLogin.js (guna loadUser dan domReady dari situ).
// Dalam profile.html tinggal: <div id="profile-root" style="display: contents"></div>

// ===== Escape supaya data user tak boleh suntik HTML/script =====

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

function validateProfileInput({ full_name, email, phoneNo }) {
    if (!full_name || full_name.trim().length < 2) {
        return "Nama profil perlu diisi sekurang-kurangnya 2 huruf.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
        return "Format email tidak sah. Contoh: nama@email.com";
    }

    const phoneDigits = (phoneNo || "").replace(/\D/g, "");
    if (!/^(?:0|60)?1\d{8,9}$/.test(phoneDigits)) {
        return "Nombor telefon tidak sah. Gunakan format seperti 012-3456789 atau +6012-3456789.";
    }

    return null;
}

// ===== Bina HTML terus dengan data user =====

function renderProfile(user) {
    const root = document.getElementById("profile-root");
    if (!root) {
        console.error("#profile-root tak jumpa dalam profile.html");
        return;
    }

    const fullname = esc(user.full_name || "-");
    const username = user.username ? "@" + esc(user.username) : "-";
    const email = esc(user.email || "-");
    const phone = esc(user.phoneNo || "-");
    const sessionId = esc(user.sessionId || "-");
    const created = user.dateCreated
        ? new Date(user.dateCreated).toLocaleDateString("ms-MY")
        : "-";
    const role = (user.role || "")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, s => s.toUpperCase()) || "-";
    const img = "/userdata/uploads/profileImg/" +
        (user.profileImg_url ? esc(user.profileImg_url.split(/[\\/]/).pop()) : "no-image.jpg");

    const securitySection = `
        <div class="profile-section">
            <div class="section-title">
                <i class="fa-solid fa-shield-halved"></i>
                <div>
                    <h3>Keselamatan</h3>
                    <p>Urus keselamatan akaun anda.</p>
                </div>
            </div>

            <div class="profile-action" onclick="window.location.href='/users/settings/#section-privasi'">
                <div>
                    <strong>Kata Laluan</strong>
                    <p>Pastikan kata laluan anda sentiasa selamat.</p>
                </div>

                <button>
                    Tukar Kata Laluan
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        </div>`;

    const profileBox = `
    <div class="profile-container">
        <div class="profile-header">
            <div class="profile-avatar">
                <img class="profile-img" src="${img}">
            </div>

            <div class="profile-header-info">
                <h2 class="profile-fullname">${fullname}</h2>
                <p class="profile-username">${username}</p>
                <span class="profile-role">
                    <i class="fa-solid fa-user"></i>
                    <span class="type-of-user">${role}</span>
                </span>
            </div>

            <button class="edit-profile-btn">
                <i class="fa-solid fa-pen"></i>
                Edit Profil
            </button>
        </div>

        <div class="profile-divider"></div>

        <div class="profile-section">
            <div class="section-title">
                <i class="fa-solid fa-circle-info"></i>
                <div>
                    <h3>Maklumat Akaun</h3>
                    <p>Maklumat asas akaun EasyRent anda.</p>
                </div>
            </div>

            <div class="profile-info-grid">
                <div class="profile-info-item">
                    <span>Username</span>
                    <strong class="profile-username">${username}</strong>
                </div>

                <div class="profile-info-item">
                    <span>Nama Profil</span>
                    <strong class="profile-fullname">${fullname}</strong>
                </div>

                <div class="profile-info-item">
                    <span>Email</span>
                    <strong class="profile-email">${email}</strong>
                </div>

                <div class="profile-info-item">
                    <span>Nombor Telefon</span>
                    <strong class="profile-phone">${phone}</strong>
                </div>
            </div>
        </div>

        <div class="profile-divider"></div>

        ${securitySection}

        <div class="profile-divider"></div>

        <div class="profile-section account-details">
            <div class="section-title">
                <i class="fa-solid fa-calendar"></i>
                <div>
                    <h3>Butiran Akaun</h3>
                    <p>Maklumat pendaftaran akaun anda.</p>
                </div>
            </div>

            <div class="account-created">
                <span>Akaun dicipta pada</span>
                <strong class="date-created">${created}</strong>
            </div>

            <div class="account-created" style="margin-top: 10px; gap: 10px; overflow:hidden;">
                <span>Session ID</span>
                <strong class="session-id"
                    style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${sessionId}</strong>
            </div>

            <div class="account-created" style="margin-top: 10px; gap: 10px; overflow:hidden;">
                <span>Session Active</span>
                <strong class="session-time"
                    style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">Retrieving...</strong>
            </div>
        </div>
    </div>`;

    const editBox = `
    <div class="profile-container edit-profile-container" style="display: none">
        <div class="profile-header">
            <div class="profile-avatar">
                <img class="profile-img" src="${img}">
                <div class="overlay-profile-img"></div>
                <a href="" class="edit-profile-img"><i class="fa-solid fa-pencil"></i></a>
            </div>

            <div class="profile-header-info">
                <h2 class="profile-fullname">${fullname}</h2>
                <p class="profile-username">${username}</p>
                <span class="profile-role">
                    <i class="fa-solid fa-user"></i>
                    <span class="type-of-user">${role}</span>
                </span>
            </div>

            <button class="edit-profile-btn save-profile-btn">
                <i class="fa-solid fa-check"></i>
                Simpan Profil
            </button>
        </div>

        <div class="profile-divider"></div>

        <div class="profile-section">
            <div class="section-title">
                <i class="fa-solid fa-circle-info"></i>
                <div>
                    <h3>Kemaskini Maklumat Akaun Anda</h3>
                    <p>Sila klik pada input untuk memasukkan data</p>
                </div>
            </div>

            <div class="profile-info-grid">
                <div class="profile-info-item">
                    <span>Username</span>
                    <strong class="profile-username">${username}</strong>
                </div>

                <div class="profile-info-item">
                    <span>Nama Profil</span>
                    <input type="text" class="profile_fullname" value="${esc(user.full_name || "")}">
                </div>

                <div class="profile-info-item">
                    <span>Email</span>
                    <input type="email" class="profile-email" value="${esc(user.email || "")}">
                </div>

                <div class="profile-info-item">
                    <span>Nombor Telefon</span>
                    <input type="text" class="profile-phone" value="${esc(user.phoneNo || "")}">
                </div>
            </div>
        </div>

        <div class="profile-divider"></div>

        ${securitySection}
    </div>`;

    const sidePanel = `
        <div class="side-panel">
            <div class="side-panel-breadcrumb">
            <span onclick="window.location.href = '/users/profile'">
                    Pengguna
                </span>
                > Profil
            </div>

            <div class="side-panel-nav">
                <a href="/users/profile/" class="side-panel-link active">
                    <i class="fa-solid fa-user"></i>
                    Profil
                </a>

                <a href="/users/house/" class="side-panel-link button-user-house">
                    <i class="fa-solid fa-house"></i>
                    Pengurusan Rumah
                </a>

                <a href="/users/favourite/" class="side-panel-link">
                    <i class="fa-solid fa-heart"></i>
                    Kegemaran
                </a>

                <a href="/users/notifications/" class="side-panel-link">
                    <i class="fa-solid fa-bell"></i>
                    Notifikasi
                </a>

                <a href="/users/message/" class="side-panel-link">
                    <i class="fa-solid fa-message"></i>
                    Mesej
                </a>

                <a href="/users/settings/" class="side-panel-link">
                    <i class="fa-solid fa-gear"></i>
                    Tetapan
                </a>

                <a href="#" id="btn-logout" class="side-panel-link danger btn-logout">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Log Keluar
                </a>
            </div>
        </div>`;

    root.innerHTML = `
        <div class="mobile-view">
            <div class="side-panel-breadcrumb">
                <span onclick="window.location.href='/users/profile'">Pengguna</span>
            </div>
            ${profileBox}
            ${editBox}
            ${sidePanel}
        </div>

        <div class="desktop-view">
            ${sidePanel}
            ${profileBox}
            ${editBox}
        </div>`;
}

// ===== Helper =====

function setText(selector, value) {
    document.querySelectorAll(selector).forEach(el => el.textContent = value);
}

// ===== Session timer =====

let sessionInterval;

function startSessionTimer(sessionStart, expiresInSeconds = 3600) {
    if (sessionInterval) clearInterval(sessionInterval);

    sessionInterval = setInterval(() => {
        const elapsedMs = Date.now() - sessionStart;
        const remainingMs = (expiresInSeconds * 1000) - elapsedMs;

        if (remainingMs <= 0) {
            clearInterval(sessionInterval);
            setText(".session-time", "Sesi tamat");
            return;
        }

        const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedMs / (1000 * 60)) % 60);
        const seconds = Math.floor((elapsedMs / 1000) % 60);

        const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        setText(".session-time", formatted);
    }, 1000);
}

// ===== Log keluar =====

function setupLogoutButtons() {
    document.querySelectorAll(".btn-logout").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            alertbox("Anda pasti untuk melog keluar akaun ini?", logoutUser);
        });
    });
}

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

// ===== Alert box (element dicari setiap kali supaya boleh dibuka berkali-kali) =====

function closeAlertBox() {
    document.querySelector(".alert-box").classList.remove("enabled");
    document.querySelector(".alertbox-overlay").classList.remove("enabled");
}

function alertbox(message, callback = null) {
    const alertBox = document.querySelector(".alert-box");
    const overlay = document.querySelector(".alertbox-overlay");
    const yes = document.querySelector(".yes-alert-box");
    const no = document.querySelector(".no-alert-box");

    alertBox.classList.add("enabled");
    overlay.classList.add("enabled");
    document.querySelector(".alertbox-message").textContent = message;

    // clone nodes to strip old listeners, avoid stacking
    const newYes = yes.cloneNode(true);
    yes.replaceWith(newYes);

    const newNo = no.cloneNode(true);
    no.replaceWith(newNo);

    newYes.addEventListener("click", () => {
        closeAlertBox();
        if (callback) callback();
    });

    newNo.addEventListener("click", closeAlertBox);
    overlay.onclick = closeAlertBox;
}

// ===== Edit profile =====

function setupEditProfile() {
    let selectedProfileImage = null;
    let selectedProfileImageUrl = null;

    const setAllImages = (src) => {
        document.querySelectorAll(".profile-img").forEach(img => img.src = src);
    };

    const profileImageInput = document.createElement("input");
    profileImageInput.type = "file";
    profileImageInput.accept = "image/jpeg,image/png";
    profileImageInput.hidden = true;
    document.body.appendChild(profileImageInput);

    document.querySelectorAll(".edit-profile-img").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            profileImageInput.click();
        });
    });

    profileImageInput.addEventListener("change", () => {
        const [file] = profileImageInput.files;
        if (!file) return;

        if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) {
            alert("Sila pilih gambar JPG atau PNG yang tidak melebihi 5MB.");
            profileImageInput.value = "";
            return;
        }

        selectedProfileImage = file;
        if (selectedProfileImageUrl) URL.revokeObjectURL(selectedProfileImageUrl);
        selectedProfileImageUrl = URL.createObjectURL(file);
        setAllImages(selectedProfileImageUrl);
    });

    // Pasangan container mengikut setiap viewport (mobile-view & desktop-view)
    document.querySelectorAll(".mobile-view, .desktop-view").forEach(viewport => {
        const profileContainer = viewport.querySelector(".profile-container:not(.edit-profile-container)");
        const editProfileContainer = viewport.querySelector(".edit-profile-container");

        // Nav pun guna class mobile-view / desktop-view, skip yang tak ada profile-container
        if (!profileContainer || !editProfileContainer) return;

        const btnEditProfile = profileContainer.querySelector(".edit-profile-btn");
        const btnSaveProfile = editProfileContainer.querySelector(".save-profile-btn");

        // Input dah siap diisi masa render, jadi cuma tukar paparan
        btnEditProfile?.addEventListener("click", () => {
            profileContainer.style.display = "none";
            editProfileContainer.style.display = "block";
        });

        btnSaveProfile?.addEventListener("click", async () => {
            const full_name = editProfileContainer.querySelector(".profile_fullname").value.trim();
            const email = editProfileContainer.querySelector(".profile-email").value.trim();
            const phoneNo = editProfileContainer.querySelector(".profile-phone").value.trim();

            const validationError = validateProfileInput({ full_name, email, phoneNo });
            if (validationError) {
                if (typeof showNotification === "function") {
                    showNotification(validationError, "error", 5000);
                } else {
                    alert(validationError);
                }
                return;
            }

            const formData = new FormData();
            formData.append("full_name", full_name);
            formData.append("email", email);
            formData.append("phoneNo", phoneNo);
            if (selectedProfileImage) formData.append("profileImage", selectedProfileImage);

            try {
                const res = await fetch("/api/users/update-profile", {
                    method: "POST",
                    credentials: "include",
                    body: formData
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || "Gagal simpan profil");
                }

                if (selectedProfileImage) {
                    setAllImages(`/userdata/uploads/profileImg/${data.profileImg_url}?t=${Date.now()}`);
                }

                // Update SEMUA profile-container (mobile + desktop) supaya data konsisten
                document.querySelectorAll(".profile-container:not(.edit-profile-container) .profile-fullname").forEach(el => el.textContent = full_name || "-");
                document.querySelectorAll(".profile-container:not(.edit-profile-container) .profile-email").forEach(el => el.textContent = email || "-");
                document.querySelectorAll(".profile-container:not(.edit-profile-container) .profile-phone").forEach(el => el.textContent = phoneNo || "-");

                document.querySelectorAll(".edit-profile-container .profile-fullname").forEach(el => el.textContent = full_name || "-");
                document.querySelectorAll(".edit-profile-container .profile_fullname").forEach(el => el.value = full_name);
                document.querySelectorAll(".edit-profile-container .profile-email").forEach(el => el.value = email);
                document.querySelectorAll(".edit-profile-container .profile-phone").forEach(el => el.value = phoneNo);

                selectedProfileImage = null;
                profileImageInput.value = "";
                if (selectedProfileImageUrl) {
                    URL.revokeObjectURL(selectedProfileImageUrl);
                    selectedProfileImageUrl = null;
                }

                editProfileContainer.style.display = "none";
                profileContainer.style.display = "block";

                if (typeof showNotification === "function") {
                    showNotification("Profil anda telah dikemaskinikan!", "success", 3000);
                }
            } catch (err) {
                console.error(err);
                if (typeof showNotification === "function") {
                    showNotification(err.message || "Gagal simpan profil. Cuba lagi.", "error", 5000);
                } else {
                    alert(err.message || "Gagal simpan profil. Cuba lagi.");
                }
            }
        });
    });
}

// ===== Start: tunggu data dulu, baru bina page =====

async function initProfile() {
    const [{ user, error }] = await Promise.all([loadUser(), domReady()]);

    if (error || !user) {
        window.location.href = "/"; // tukar ikut route awak
        return;
    }

    startSessionTimer(user.sessionStart);
    renderProfile(user);
    setupEditProfile();
    setupLogoutButtons();
}

initProfile();