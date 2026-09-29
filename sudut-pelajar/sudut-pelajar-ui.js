let currentUsername = null;
let likedPostIds = new Set();
let activeCommunityScope = "all";

// 1. Dapatkan user semasa dulu
async function loadCurrentUser() {
    try {
        const res = await fetch("/api/me");
        if (!res.ok) {
            currentUsername = null;
            return;
        }
        const data = await res.json();
        currentUsername = data.username || (data.user && data.user.username) || null;
    } catch (err) {
        currentUsername = null;
    }
}

// 2. Ambil senarai ID post yang di-like
async function loadLikedPosts() {
    likedPostIds = new Set();
    if (!currentUsername) return;

    try {
        const res = await fetch("/api/v1/sp/likes");
        if (!res.ok) return;

        const data = await res.json();
        if (data.success && Array.isArray(data.spIds)) {
            likedPostIds = new Set(data.spIds.map(id => String(id)));
        }
    } catch (err) {
        console.error("Error fetching liked posts:", err);
    }
}

function scrollToPostFromHash() {
    const targetId = window.location.hash.replace('#', '').trim();
    if (!targetId) return;

    const target = document.querySelector(`article[data-id="${CSS.escape(targetId)}"]`);
    if (!target) return;

    setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.outline = '2px solid rgba(215, 185, 108, 0.9)';
        target.style.outlineOffset = '4px';
        setTimeout(() => {
            target.style.outline = '';
            target.style.outlineOffset = '';
        }, 2000);
    }, 200);
}

function bindCommunityFilters() {
    const btnSemua = document.querySelector('.community-pill:nth-child(1)');
    const btnAnda = document.querySelector('.community-pill:nth-child(2)');

    if (btnSemua) {
        btnSemua.addEventListener('click', () => {
            btnSemua.classList.add('active');
            if (btnAnda) btnAnda.classList.remove('active');
            
            // Direct fetch semua post dari backend
            fetchAndRenderPosts('all');
        });
    }

    if (btnAnda) {
        btnAnda.addEventListener('click', () => {
            if (!currentUsername) {
                showNotification("Sila log masuk untuk melihat hantaran anda.", "error", 3000);
                return;
            }

            btnAnda.classList.add('active');
            if (btnSemua) btnSemua.classList.remove('active');

            // Direct fetch post pengguna dari backend
            fetchAndRenderPosts('mine');
        });
    }
}

// Dom Content Loaded Sequence
document.addEventListener("DOMContentLoaded", async () => {
    bindCommunityFilters();
    await loadCurrentUser();
    await fetchAndRenderPosts(activeCommunityScope);
    scrollToPostFromHash();
});

// Elak XSS
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

// Avatar helper
function avatarHtml(name, imgUrl) {
    const initial = escapeHtml(name.charAt(0).toUpperCase());
    const img = imgUrl
        ? `<img src="/userdata/uploads/profileImg/${escapeHtml(imgUrl)}" alt="" loading="lazy" onerror="this.remove()">`
        : "";
    return `<div class="sp-avatar">${initial}${img}</div>`;
}

// 3. Ambil Posts & Likes secara berurutan
async function fetchAndRenderPosts(scope = activeCommunityScope) {
    try {
        await loadLikedPosts();

        const url = scope === "mine"
            ? "/api/v1/sp/fetch?scope=mine"
            : "/api/v1/sp/fetch?scope=all";

        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 401) {
                renderFeed([]);
                return;
            }
            throw new Error("Gagal mengambil hantaran dari server");
        }

        const data = await res.json();

        if (data.success) {
            renderFeed(data.posts || []);
        } else {
            console.error("Gagal mengambil hantaran:", data.message);
        }
    } catch (err) {
        console.error("Error fetching posts:", err);
    }
}

// 4. Render Feed ke HTML
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
        const emptyText = activeCommunityScope === "mine"
            ? "Anda belum membuat sebarang hantaran. Cipta hantaran pertama anda di atas!"
            : "Tiada hantaran lagi. Mulakan perbincangan pertama anda!";

        html += `
            <div class="sp-empty">
                <i class="fa-regular fa-comments fa-2x"></i>
                <p>${emptyText}</p>
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

            const isLiked = likedPostIds.has(String(post.spId));

            html += `
                <article class="sp-post-card" data-id="${post.spId}" data-aos="fade-up" data-aos-duration="500" id="${post.spId}">
                    <div class="sp-post-header">
                        <div class="sp-user-info">
                            ${avatarHtml(displayName, post.profileImg_url)}
                            <div class="sp-user-details" title="Lihat Profile" onclick="window.location.href = '/users/profile/lookup/?username=${escapeHtml(post.username)}'">
                                <h4>${escapeHtml(displayName)}</h4>
                                <span>@${escapeHtml(post.username)}</span>
                            </div>
                        </div>
                        ${deleteBtn}
                    </div>

                    <p class="sp-post-content">${escapeHtml(post.content)}</p>

                    ${imageHtml}

                    <div class="sp-post-actions">
                        <button type="button" class="sp-action-btn${isLiked ? " liked" : ""}" onclick="handleLikePost(${post.spId}, this)" aria-pressed="${isLiked}">
                            <i class="fa-${isLiked ? "solid" : "regular"} fa-heart"></i>
                            <span id="like-count-${post.spId}">${post.likeCount}</span>
                        </button>
                        <button type="button" class="sp-action-btn" onclick="toggleComments(${post.spId})">
                            <i class="fa-regular fa-comment"></i>
                            <span id="comment-count-${post.spId}">${post.commentCount}</span> Komen
                        </button>
                    </div>

                    <div id="comments-section-${post.spId}" class="sp-comments-section" style="display:none;">
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

    // Pasangkan semula event listener submit post
    const btnSubmit = document.getElementById("btn-submit-post");
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleCreatePost);
    }
}

// Image Preview & Removal
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

function removeSelectedImage() {
    const fileInput = document.getElementById("post-img-input");
    if (fileInput) fileInput.value = "";
    const previewContainer = document.getElementById("image-preview-container");
    if (previewContainer) previewContainer.style.display = "none";
    const previewImg = document.getElementById("image-preview");
    if (previewImg) previewImg.src = "";
}

// 5. Tambah Post Baru
async function handleCreatePost() {
    const input = document.getElementById("new-post-input");
    const imgInput = document.getElementById("post-img-input");
    const content = input.value.trim();

    if (!content && (!imgInput.files || imgInput.files.length === 0)) {
        if (typeof showNotification === "function") {
            showNotification("Sila taip atau memuat naik sekurang-kurangnya satu gambar.", "error", 3000);
        } else {
            alert("Sila taip atau memuat naik sekurang-kurangnya satu gambar.");
        }
        return;
    }

    const formData = new FormData();
    formData.append("content", content);

    if (imgInput.files && imgInput.files[0]) {
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
            if (typeof showNotification === "function") {
                showNotification("Post anda telah pun berjaya disiarkan!", "success", 3000);
            }
        } else {
            if (typeof showNotification === "function") {
                showNotification("Sila log masuk akaun sebelum membuat siaran", "error", 3000);
            }
        }
    } catch (err) {
        console.error("Error creating post:", err);
    }
}

// 6. Padam Post
async function handleDeletePost(spID) {
    if (!confirm("Adakah anda pasti ingin memadam post ini?")) return;

    try {
        const res = await fetch(`/api/v1/sp/delete/${spID}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
            fetchAndRenderPosts();
            if (typeof showNotification === "function") {
                showNotification("Post anda telah dipadamkan.", "success", 3000);
            }
        } else {
            if (typeof showNotification === "function") {
                showNotification("Maaf, anda tidak boleh memadam siaran orang lain.", "error", 3000);
            }
        }
    } catch (err) {
        console.error("Error deleting post:", err);
    }
}

// 7. Like / Unlike Post
async function handleLikePost(spID, btn) {
    if (!currentUsername) {
        if (typeof showNotification === "function") {
            showNotification("Sila log masuk untuk menyukai hantaran ini.", "error", 3000);
        }
        return;
    }

    if (btn.disabled) return;
    btn.disabled = true;

    try {
        const res = await fetch(`/api/v1/sp/like/${spID}`, { method: "POST" });
        const data = await res.json();

        if (data.success) {
            const counter = document.getElementById(`like-count-${spID}`);
            if (counter) counter.textContent = data.likeCount;

            btn.classList.toggle("liked", data.liked);
            btn.setAttribute("aria-pressed", String(data.liked));

            const icon = btn.querySelector("i");
            if (icon) icon.className = `fa-${data.liked ? "solid" : "regular"} fa-heart`;

            if (data.liked) {
                likedPostIds.add(String(spID));
            } else {
                likedPostIds.delete(String(spID));
            }

            if (typeof showNotification === "function") {
                showNotification(data.liked ? "Disukai dan disimpan ke Kegemaran." : "Dibuang dari Kegemaran.", "success", 2000);
            }
        } else if (res.status === 401) {
            if (typeof showNotification === "function") {
                showNotification("Sila log masuk untuk menyukai hantaran ini.", "error", 3000);
            }
        } else {
            if (typeof showNotification === "function") {
                showNotification("Gagal menyukai hantaran. Cuba lagi.", "error", 3000);
            }
        }
    } catch (err) {
        console.error("Error liking post:", err);
    } finally {
        btn.disabled = false;
    }
}

function adjustCommentCount(spID, delta) {
    const counter = document.getElementById(`comment-count-${spID}`);
    if (counter) counter.textContent = Math.max(0, Number(counter.textContent) + delta);
}

// 8. Komen Logic
function toggleComments(spID) {
    const section = document.getElementById(`comments-section-${spID}`);
    if (!section) return;

    if (section.style.display === "none" || section.style.display === "") {
        section.style.display = "block";
        fetchAndRenderComments(spID);
    } else {
        section.style.display = "none";
    }
}

async function fetchAndRenderComments(spID) {
    const commentsList = document.getElementById(`comments-list-${spID}`);
    if (!commentsList) return;

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
        if (typeof showNotification === "function") {
            showNotification("Ralat ketika memuatkan komen", "error", 3000);
        }
        commentsList.innerHTML = `<p style="color:red; font-size: 12px;">Gagal memuatkan komen.</p>`;
    }
}

async function handleSendComment(spID) {
    const input = document.getElementById(`comment-input-${spID}`);
    const content = input.value.trim();

    if (!content) {
        if (typeof showNotification === "function") {
            showNotification("Sila taip komen terlebih dahulu", "error", 3000);
        }
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
            if (typeof showNotification === "function") {
                showNotification("Komen anda telah berjaya dihantar!", "success", 3000);
            }
        } else {
            if (typeof showNotification === "function") {
                showNotification("Sila log masuk sebelum membuat komen.", "error", 3000);
            }
        }
    } catch (err) {
        console.error("Error sending comment:", err);
    }
}

async function handleDeleteComment(commentId, spID) {
    if (!confirm("Adakah anda pasti ingin memadam komen ini?")) return;

    try {
        const res = await fetch(`/api/v1/sp/posts/delete/${commentId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
            adjustCommentCount(spID, -1);
            fetchAndRenderComments(spID);
            if (typeof showNotification === "function") {
                showNotification("Komen anda telah berjaya dipadamkan.", "success", 3000);
            }
        } else {
            if (typeof showNotification === "function") {
                showNotification("Gagal memadam komen.", "error", 3000);
            }
        }
    } catch (err) {
        console.error("Error deleting comment:", err);
    }
}

// Lightbox Viewer
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

    overlay.addEventListener("click", (e) => {
        if (e.target.tagName !== "IMG") close();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
}

document.addEventListener("click", (e) => {
    const btn = e.target.closest(".sp-post-image-btn");
    if (btn) openImageViewer(btn.dataset.full);
});