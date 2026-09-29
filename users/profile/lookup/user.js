function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

const formatPrice = (price) => {
    const parsed = Number(price);
    if (!Number.isFinite(parsed)) return 'RM 0';
    return `${parsed.toLocaleString('en-MY')}`;
};

function sanitizeFilename(pathStr) {
    if (!pathStr) return "no-image.jpg";
    const cleanPath = pathStr.split(/[?#]/)[0];
    const filename = cleanPath.split(/[\\/]/).pop();
    return /^[\w\-. ]+$/i.test(filename) ? filename : "no-image.jpg";
}

function renderProfile(user = {}) {
    // 1. Tentukan Nama Paparan Utama (Jika tiada full_name, guna username, jika tiada guna "-")
    const rawDisplayName = (user.full_name && user.full_name.trim())
        ? user.full_name
        : (user.username && user.username.trim() ? user.username : "-");

    const displayName = esc(rawDisplayName);
    const rawUsername = user.username ? esc(user.username) : "";
    const username = rawUsername ? "@" + rawUsername : "-";
    const email = esc(user.email || "-");
    const address = esc(user.address || "-");

    const created = user.dateCreated && !isNaN(new Date(user.dateCreated))
        ? new Date(user.dateCreated).toLocaleDateString("ms-MY")
        : "-";

    const role = user.role
        ? esc(user.role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, s => s.toUpperCase()))
        : "Pengguna";

    const filename = sanitizeFilename(user.profileImg_url);
    const imgSrc = user.profileImg_url ? esc(user.profileImg_url) : "/userdata/uploads/profileImg/" + encodeURIComponent(filename);

    // Update Elemen DOM
    const elName = document.querySelectorAll(".profile-name");
    const elUsername = document.querySelector(".profile-username");
    const elEmail = document.querySelector(".detail-email");
    const elAddress = document.querySelector(".profile-address");
    const elCreated = document.querySelector(".profile-joined-value");
    const elRole = document.querySelector(".profile-role");
    const elImg = document.querySelector(".user-profile-img");

    // Kemaskini SEMUA tag .profile-name (termasuk pada tajuk H3)
    if (elName.length) {
        // Semak jika full_name ada, bukan "-", dan bukan ruang kosong sahaja
        const hasValidFullName = user.full_name && user.full_name.trim() !== "" && user.full_name.trim() !== "-";

        // Jika full_name sah guna full_name, jika tidak guna username (atau "-" jika kedua-duanya tiada)
        const displayName = hasValidFullName
            ? user.full_name
            : (user.username || "-");

        elName.forEach(e => {
            e.textContent = displayName;
        });
    }
    
    if (elUsername) elUsername.textContent = username;

    if (elEmail) {
        elEmail.textContent = email;
        elEmail.href = email !== "-" ? `mailto:${email}` : "#";
    }

    if (elAddress) elAddress.textContent = address;
    if (elCreated) elCreated.textContent = created;
    if (elRole) elRole.textContent = role;
    if (elImg) elImg.src = imgSrc;

    // Attach Event Listener Butang Message
    const btnMsg = document.querySelector(".btn-message");
    if (btnMsg) {
        const newBtn = btnMsg.cloneNode(true);
        btnMsg.parentNode.replaceChild(newBtn, btnMsg);

        newBtn.addEventListener("click", () => {
            contact(rawUsername);
        });
    }
}

// Render Kad Rumah Dinamik dari Backend
function renderListings(listings = []) {
    const container = document.getElementById("house-grid-container");
    if (!container) return;

    if (!listings.length) {
        container.innerHTML = "<p style='color: var(--text-muted, #777);'>Tiada rumah diiklankan lagi oleh pengguna ini.</p>";
        return;
    }

    container.innerHTML = listings.map(house => {
        const mainImg = house.images && house.images.length > 0 ? house.images[0] : "/userdata/uploads/houses/no-image.jpg";
        return `
            <div class="house-card">
                <div class="house-image-wrapper">
                    <img src="${esc(mainImg)}" alt="${esc(house.title)}">
                </div>
                <div class="house-card-body">
                    <div class="house-price-row">
                        <div class="house-price">RM ${formatPrice(house.price)} <span>/bln</span></div>
                    </div>
                    <h4 class="house-title">${esc(house.title)}</h4>
                    <div class="house-features">
                        <span><i class="fa-solid fa-bed"></i> ${esc(house.totalOf_bedroom)}</span>
                        <span><i class="fa-solid fa-bath"></i> ${esc(house.totalOf_shower)}</span>
                        <span><i class="fa-solid fa-circle-dot"></i> ${esc(house.gender)}</span>
                    </div>
                    <p class="house-location">
                        <i class="fa-solid fa-location-dot"></i> ${esc(house.location)}
                    </p>
                    <a href="/house/?id=${esc(house.house_id)}" class="btn-detail">
                        Lihat Butiran <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    }).join("");
}

// Render Siaran Sudut Pelajar (sppost) Dinamik
function renderStudentPosts(posts = [], user = {}) {
    const container = document.getElementById("sp-card-container");
    if (!container) return;

    if (!posts.length) {
        container.innerHTML = "<p style='color: var(--text-muted, #777);'>Tiada siaran Sudut Pelajar oleh pengguna ini.</p>";
        return;
    }

    const authorName = user.full_name || user.username || "Pengguna";
    const authorImg = user.profileImg_url || "/userdata/uploads/profileImg/no-image.jpg";

    container.innerHTML = posts.map(post => {
        const hasImage = Boolean(post.img_url);

        return `
            <div class="sp-card ${hasImage ? '' : 'no-image'}">
                <div class="sp-card-content">
                    <div class="sp-card-header">
                        <div class="sp-card-left">
                            <div class="sp-avatar-placeholder">
                                <img src="${esc(authorImg)}" alt="${esc(authorName)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                            </div>
                            <div>
                                <h4 class="sp-author">${esc(authorName)}</h4>
                                <span class="sp-time">@${esc(post.username)}</span>
                            </div>
                        </div>
                    </div>

                    <p class="sp-text">${esc(post.content)}</p>

                    <div class="sp-card-footer">
                        <div class="sp-stats">
                            <span class="sp-stat-item"><i class="fa-regular fa-comment"></i> ${esc(post.commentCount)}</span>
                            <span class="sp-stat-item"><i class="fa-regular fa-heart"></i> ${esc(post.likeCount)}</span>
                        </div>
                    </div>
                </div>

                ${hasImage ? `
                    <div class="sp-post-image">
                        <img src="${esc(post.img_url)}" alt="Gambar Siaran">
                    </div>
                ` : ""}
            </div>
        `;
    }).join("");
}

async function contact(posterUsername) {
    if (!posterUsername) return;

    if (typeof loadUser !== "function") {
        console.error("loadUser() is not defined.");
        return;
    }

    const { user, error } = await loadUser();

    if (error || !user) {
        if (typeof checkLoginModal === "function") checkLoginModal();
        return;
    }

    if (user.username === posterUsername) {
        if (typeof showNotification === "function") {
            showNotification("Anda tidak boleh mesej diri sendiri!", "error", 3000);
        } else {
            alert("Anda tidak boleh mesej diri sendiri!");
        }
        return;
    }

    if (typeof startChat === "function") {
        startChat(posterUsername);
    }
}

async function initProfile() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const targetUsername = urlParams.get("username");

        const response = await fetch(`/api/profile?username=${encodeURIComponent(targetUsername || '')}`);
        const result = await response.json();

        if (!result.success || !result.user) {
            if (typeof showNotification === "function") {
                showNotification(result.message || "User tidak dijumpai", "error", 3000);
            }
            return;
        }

        renderProfile(result.user);
        renderListings(result.listings || []);
        renderStudentPosts(result.posts || [], result.user);

    } catch (err) {
        console.error("Failed to initialize profile:", err);
    }
}

// Jalankan auto-init selepas DOM siap
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProfile);
} else {
    initProfile();
}