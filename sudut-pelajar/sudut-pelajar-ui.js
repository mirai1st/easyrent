let currentUsername = null;

async function loadCurrentUser() {
    try {
        const res = await fetch("/api/me");
        if (!res.ok) return; // belum log masuk
        const data = await res.json();
        currentUsername = data.username || (data.user && data.user.username) || null;
    } catch (err) {
        currentUsername = null;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadCurrentUser();
    fetchAndRenderPosts();
});

// Elak XSS: semua teks dari pengguna mesti melalui fungsi ini sebelum masuk innerHTML
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

// Avatar: huruf pertama sebagai fallback, gambar profil di atasnya jika ada
function avatarHtml(name, imgUrl) {
    const initial = escapeHtml(name.charAt(0).toUpperCase());
    const img = imgUrl
        ? `<img src="/userdata/uploads/profileImg/${escapeHtml(imgUrl)}" alt="" loading="lazy" onerror="this.remove()">`
        : "";
    return `<div class="sp-avatar">${initial}${img}</div>`;
}

// 1. Ambil & Papar Senarai Post
async function fetchAndRenderPosts() {
    try {
        const res = await fetch("/api/v1/sp/fetch");
        const data = await res.json();

        if (data.success) {
            renderFeed(data.posts);
        } else {
            console.error("Gagal mengambil hantaran:", data.message);
        }
    } catch (err) {
        console.error("Error fetching posts:", err);
    }
}

// 2. Render Feed ke HTML
function renderFeed(posts) {
    const feedContainer = document.querySelector(".community-feed");
    if (!feedContainer) return;

    let html = `
        <div class="sp-composer-card">
            <textarea id="new-post-input" class="sp-composer-textarea" rows="3" placeholder="Apa yang anda ingin bincangkan hari ini?"></textarea>

            <div id="image-preview-container" class="sp-image-preview" style="display:none;">
                <img id="image-preview" src="" alt="Preview Gambar">
                <button type="button" class="sp-btn-remove-img" onclick="removeSelectedImage()" title="Buang gambar" aria-label="Buang gambar">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="sp-composer-actions">
                <label for="post-img-input" class="sp-upload-btn" title="Tambah Gambar">
                    <i class="fa-regular fa-image"></i> Gambar
                </label>
                <input type="file" id="post-img-input" accept="image/jpeg,image/png" style="display: none;" onchange="previewImage(event)">

                <button id="btn-submit-post" class="sp-btn-submit">Hantar</button>
            </div>
        </div>
    `;

    if (!posts || posts.length === 0) {
        html += `
            <div class="sp-empty">
                <i class="fa-regular fa-comments fa-2x"></i>
                <p>Tiada hantaran lagi. Mulakan perbincangan pertama anda!</p>
            </div>
        `;
    } else {
        posts.forEach((post) => {
            const displayName = post.full_name || post.username;

            let imageHtml = "";
            if (post.imgFile && post.imgFile.length > 0) {
                imageHtml = `
                    <div class="sp-post-image">
                        <button type="button" class="sp-post-image-btn" data-full="${escapeHtml(post.imgFile[0])}" aria-label="Lihat gambar penuh">
                            <img src="${escapeHtml(post.imgFile[0])}" alt="Gambar Hantaran" loading="lazy">
                        </button>
                    </div>
                `;
            }

            const deleteBtn = post.username === currentUsername
                ? `<button type="button" class="sp-btn-delete" onclick="handleDeletePost(${post.spId})" title="Padam Post">
                        <i class="fa-regular fa-trash-can"></i> Padam
                    </button>`
                : "";

            html += `
                <article class="sp-post-card" data-id="${post.spId}" data-aos="fade-up" data-aos-duration="500">
                    <div class="sp-post-header">
                        <div class="sp-user-info">
                            ${avatarHtml(displayName, post.profileImg_url)}
                            <div class="sp-user-details">
                                <h4>${escapeHtml(displayName)}</h4>
                                <span>@${escapeHtml(post.username)}</span>
                            </div>
                        </div>
                        ${deleteBtn}
                    </div>

                    <p class="sp-post-content">${escapeHtml(post.content)}</p>

                    ${imageHtml}

                    <div class="sp-post-actions">
                        <button type="button" class="sp-action-btn" onclick="handleLikePost(${post.spId}, this)">
                            <i class="fa-regular fa-heart"></i>
                            <span id="like-count-${post.spId}">${post.likeCount}</span>
                        </button>
                        <button type="button" class="sp-action-btn" onclick="toggleComments(${post.spId})">
                            <i class="fa-regular fa-comment"></i>
                            <span id="comment-count-${post.spId}">${post.commentCount}</span> Komen
                        </button>
                    </div>

                    <div id="comments-section-${post.spId}" class="sp-comments-section">
                        <div id="comments-list-${post.spId}">
                            <em style="font-size: 12px; color: #7a6359;">Memuatkan komen...</em>
                        </div>
                        <div class="sp-comment-input-box">
                            <input type="text" id="comment-input-${post.spId}" class="sp-comment-input" placeholder="Tulis komen...">
                            <button type="button" class="sp-btn-submit" style="padding: 7px 16px; font-size: 0.82rem;" onclick="handleSendComment(${post.spId})">Komen</button>
                        </div>
                    </div>
                </article>
            `;
        });
    }

    feedContainer.innerHTML = html;

    const btnSubmit = document.getElementById("btn-submit-post");
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleCreatePost);
    }
}

// Fungsi Preview Gambar sebelum hantar
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("image-preview").src = e.target.result;
            document.getElementById("image-preview-container").style.display = "block";
        };
        reader.readAsDataURL(file);
    }
}

// Batal / Buang Gambar Pilihan
function removeSelectedImage() {
    const fileInput = document.getElementById("post-img-input");
    if (fileInput) fileInput.value = "";
    document.getElementById("image-preview-container").style.display = "none";
    document.getElementById("image-preview").src = "";
}

// 3. Tambah Hantaran Baru (Penghantaran FormData)
async function handleCreatePost() {
    const input = document.getElementById("new-post-input");
    const imgInput = document.getElementById("post-img-input");
    const content = input.value.trim();

    if (!content && (!imgInput.files || imgInput.files.length === 0)) {
        showNotification("Sila taip atau memuat naik sekurang-kurangnya satu gambar.", "error", 3000);
        return;
    }

    const formData = new FormData();
    formData.append("content", content);

    if (imgInput.files && imgInput.files[0]) {
        // 'imgFile' sepadan dengan upload.uploadSP.array('imgFile', 5) di server
        formData.append("imgFile", imgInput.files[0]);
    }

    try {
        const res = await fetch("/api/v1/sp/insert", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            input.value = "";
            removeSelectedImage();
            fetchAndRenderPosts();
            showNotification("Post anda telah pun berjaya disiarkan!", "success", 3000);
        } else {
            showNotification("Sila log masuk akaun sebelum membuat siaran", "error", 3000);
        }
    } catch (err) {
        console.error("Error creating post:", err);
    }
}

// 4. Padam Post
async function handleDeletePost(spID) {
    if (!confirm("Adakah anda pasti ingin memadam post ini?")) return;

    try {
        const res = await fetch(`/api/v1/sp/delete/${spID}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
            fetchAndRenderPosts();
            showNotification("Post anda telah dipadamkan.", "success", 3000);
        } else {
            showNotification("Maaf, anda tidak boleh memadam siaran orang lain.", "error", 3000);
        }
    } catch (err) {
        console.error("Error deleting post:", err);
    }
}

// 5. Tambah Like (kemas kini kiraan terus tanpa render semula feed)
async function handleLikePost(spID, btn) {
    try {
        const res = await fetch(`/api/v1/sp/like/${spID}`, { method: "POST" });
        const data = await res.json();
        if (data.success) {
            const counter = document.getElementById(`like-count-${spID}`);
            if (counter) counter.textContent = Number(counter.textContent) + 1;
            if (btn) {
                btn.classList.add("liked");
                const icon = btn.querySelector("i");
                if (icon) icon.className = "fa-solid fa-heart";
            }
        } else {
            showNotification("Sila log masuk untuk menyukai hantaran ini.", "error", 3000);
        }
    } catch (err) {
        console.error("Error liking post:", err);
    }
}

// Ubah kiraan komen pada kad post tanpa render semula feed
function adjustCommentCount(spID, delta) {
    const counter = document.getElementById(`comment-count-${spID}`);
    if (counter) counter.textContent = Math.max(0, Number(counter.textContent) + delta);
}

// 6. Buka / Tutup Ruang Komen
function toggleComments(spID) {
    const section = document.getElementById(`comments-section-${spID}`);
    if (section.style.display === "none" || section.style.display === "") {
        section.style.display = "block";
        fetchAndRenderComments(spID);
    } else {
        section.style.display = "none";
    }
}

// 7. Ambil & Papar Komen
async function fetchAndRenderComments(spID) {
    const commentsList = document.getElementById(`comments-list-${spID}`);
    try {
        const res = await fetch(`/api/v1/sp/posts/${spID}/comments`);
        const data = await res.json();

        if (data.success) {
            if (data.comments.length === 0) {
                commentsList.innerHTML = `<p style="font-size: 12px; color: #7a6359; margin: 0;">Tiada komen lagi.</p>`;
                return;
            }

            let html = "";
            data.comments.forEach((comment) => {
                const name = (comment.full_name && comment.full_name !== "-")
                    ? comment.full_name
                    : comment.username;

                const deleteBtn = comment.username === currentUsername
                    ? `<button type="button" class="sp-btn-delete" style="font-size: 0.75rem;" onclick="handleDeleteComment(${comment.commentId}, ${spID})">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>`
                    : "";

                html += `
                    <div class="sp-comment-item">
                        <div>
                            <div class="sp-comment-header">
                                <strong>${escapeHtml(name)}</strong>
                                <span>@${escapeHtml(comment.username)}</span>
                            </div>
                            <p class="sp-comment-text">${escapeHtml(comment.content)}</p>
                        </div>
                        ${deleteBtn}
                    </div>
                `;
            });
            commentsList.innerHTML = html;
        }
    } catch (err) {
        showNotification("Ralat ketika memuatkan komen", "error", 3000);
        commentsList.innerHTML = `<p style="color:red; font-size: 12px;">Gagal memuatkan komen.</p>`;
    }
}

// 8. Hantar Komen Baru
async function handleSendComment(spID) {
    const input = document.getElementById(`comment-input-${spID}`);
    const content = input.value.trim();

    if (!content) {
        showNotification("Sila taip komen terlebih dahulu", "error", 3000);
        return;
    }

    try {
        const res = await fetch(`/api/v1/sp/posts/${spID}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content, imgFile: [], replyTo: "" })
        });

        const data = await res.json();
        if (data.success) {
            input.value = "";
            adjustCommentCount(spID, 1);
            fetchAndRenderComments(spID);
            showNotification("Komen anda telah berjaya dihantar!", "success", 3000);
        } else {
            showNotification("Sila log masuk sebelum membuat komen.", "error", 3000);
        }
    } catch (err) {
        console.error("Error sending comment:", err);
    }
}

// 9. Padam Komen
async function handleDeleteComment(commentId, spID) {
    if (!confirm("Adakah anda pasti ingin memadam komen ini?")) return;

    try {
        const res = await fetch(`/api/v1/sp/posts/delete/${commentId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
            adjustCommentCount(spID, -1);
            fetchAndRenderComments(spID);
            showNotification("Komen anda telah berjaya dipadamkan.", "success", 3000);
        } else {
            showNotification("Gagal memadam komen.", "error", 3000);
        }
    } catch (err) {
        console.error("Error deleting comment:", err);
    }
}

// Popup gambar penuh
function openImageViewer(src) {
    const overlay = document.createElement("div");
    overlay.className = "sp-lightbox";
    overlay.innerHTML = `
        <button type="button" class="sp-lightbox-close" aria-label="Tutup">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <img src="${escapeHtml(src)}" alt="Gambar Hantaran">
    `;

    const close = () => {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
    };
    const onKey = (e) => {
        if (e.key === "Escape") close();
    };

    // Klik di mana-mana selain gambar akan menutup popup
    overlay.addEventListener("click", (e) => {
        if (e.target.tagName !== "IMG") close();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
}

// Satu listener untuk semua gambar dalam feed
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".sp-post-image-btn");
    if (btn) openImageViewer(btn.dataset.full);
});