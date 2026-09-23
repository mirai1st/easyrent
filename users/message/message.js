// Reuses the single socket.io connection created in main-ui.js (must load first)
const socket = window.appSocket || io();

let currentUser = null;
let currentConversationId = null;
let currentConversationUsername = null;

const MAX_IMAGES = 5;
let pendingImages = []; // File objects staged for the next send

const desktopConversationList = document.querySelector("#desktopConversationList");
const mobileConversationList = document.querySelector("#mobileConversationList");
const desktopMessages = document.querySelector("#desktopChatMessages");
const mobileMessages = document.querySelector("#mobileChatMessages");

async function loadCurrentUser() {
    try {
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error("Not logged in");

        const data = await res.json();
        currentUser = data.username || data.user?.username || null;
    } catch (err) {
        console.error("Failed to get current user:", err);
        currentUser = null;
    }
}

async function loadConversations() {
    try {
        const res = await fetch("/api/v1/chat/conversations");
        if (!res.ok) throw new Error("Failed to load conversations");

        const conversations = await res.json();
        renderConversations(conversations);
        updateGlobalUnreadBadge();

        // Auto open conversation if query param exists
        const params = new URLSearchParams(window.location.search);
        const conversationId = params.get("conversation");

        if (conversationId) {
            const conversation = conversations.find(
                (item) => String(item.conversation_id) === String(conversationId)
            );
            if (conversation) {
                await openConversation(
                    conversation.conversation_id,
                    conversation.other_user,
                    conversation.other_user_avatar
                );
            }
        }
    } catch (err) {
        console.error("Failed to load conversations:", err);
    }
}

function renderConversations(conversations) {
    if (desktopConversationList) desktopConversationList.innerHTML = "";
    if (mobileConversationList) mobileConversationList.innerHTML = "";

    conversations.forEach((conversation) => {
        if (desktopConversationList) {
            desktopConversationList.appendChild(createConversationElement(conversation));
        }
        if (mobileConversationList) {
            mobileConversationList.appendChild(createConversationElement(conversation));
        }
    });
}

function createConversationElement(conversation) {
    const element = document.createElement("div");
    element.className = "conversation";
    element.dataset.id = conversation.conversation_id;
    element.dataset.username = conversation.other_user;

    const username = conversation.other_user || "Unknown";
    const avatar = conversation.other_user_avatar;
    const preview = conversation.last_message || "Belum ada mesej";
    const time = conversation.last_message_time ? formatTime(conversation.last_message_time) : "";
    const unreadCount = Number(conversation.unread_count) || 0;

    if (unreadCount > 0) {
        element.classList.add("has-unread");
    }

    // Guna gambar profileImg_url jika wujud, jika tiada tunjuk huruf pertama
    const avatarHtml = avatar
        ? `<img src="/userdata/uploads/profileImg/${escapeHtml(avatar)}" alt="${escapeHtml(username)}" class="avatar-img" />`
        : escapeHtml(username.charAt(0).toUpperCase());

    const unreadBadgeHtml = unreadCount > 0
        ? `<span class="conversation-unread-badge">${unreadCount > 99 ? "99+" : unreadCount}</span>`
        : "";

    element.innerHTML = `
        <div class="conversation-avatar">
            ${avatarHtml}
        </div>
        <div class="conversation-info">
            <div class="conversation-top">
                <span class="conversation-name">${escapeHtml(username)} ${unreadBadgeHtml}</span>
                <span class="conversation-time">${time}</span>
            </div>
            <p class="conversation-preview">${escapeHtml(preview)}</p>
        </div>
        
    `;

    element.addEventListener("click", () => {
        openConversation(conversation.conversation_id, username, avatar);
    });

    return element;
}

async function openConversation(conversationId, username, avatar = null) {
    // Leave previous Socket.IO room if switching
    if (currentConversationId && String(currentConversationId) !== String(conversationId)) {
        socket.emit("leave_conversation", currentConversationId);
    }

    currentConversationId = conversationId;
    currentConversationUsername = username;

    updateChatHeader(username, avatar);
    await loadMessages(conversationId);

    joinConversation(conversationId);
    checkOnlineStatus(username);
    await markConversationRead(conversationId);

    // Mobile view state
    document.querySelector(".mobile-message-view .message-container")?.classList.add("chat-open");

    // Toggle active state in list
    document.querySelectorAll(".conversation").forEach((item) => {
        item.classList.toggle("active", String(item.dataset.id) === String(conversationId));
    });
}

async function loadMessages(conversationId) {
    try {
        const res = await fetch(`/api/v1/chat/conversations/${conversationId}/messages`);
        if (!res.ok) throw new Error("Failed to load messages");

        const messages = await res.json();
        renderMessages(messages);
    } catch (err) {
        console.error("Failed to load messages:", err);
    }
}

function renderMessages(messages) {
    if (desktopMessages) desktopMessages.innerHTML = "";
    if (mobileMessages) mobileMessages.innerHTML = "";

    messages.forEach((message) => appendMessageToAll(message));

    scrollToBottom(desktopMessages);
    scrollToBottom(mobileMessages);
}

function appendMessageToAll(message) {
    if (desktopMessages) appendMessage(message, desktopMessages);
    if (mobileMessages) appendMessage(message, mobileMessages);
}

function appendMessage(message, container) {
    if (!container) return;

    const isSent = message.sender === currentUser;
    const element = document.createElement("div");
    element.className = `message ${isSent ? "sent" : "received"}`;

    const images = message.images || [];

    const imagesHtml = images.length
        ? `<div class="message-images">
            ${images.map((img) => `<img src="/userdata/uploads/message/${escapeHtml(img)}" class="message-image" onclick="window.open('/userdata/uploads/message/${escapeHtml(img)}', '_blank')" />`).join("")}
           </div>`
        : "";

    const textHtml = message.message
        ? `<div class="message-bubble">${escapeHtml(message.message)}</div>`
        : "";

    element.innerHTML = `
        ${imagesHtml}
        ${textHtml}
        <span class="message-time">${formatTime(message.sent_at)}</span>
    `;

    container.appendChild(element);
}

// ========================================================
// IMAGE ATTACHMENT STAGING (before send)
// ========================================================

function handleFilesSelected(fileList) {
    const incoming = Array.from(fileList);
    const room = MAX_IMAGES - pendingImages.length;

    if (room <= 0) {
        console.warn(`Maximum ${MAX_IMAGES} images per message`);
        return;
    }

    pendingImages = pendingImages.concat(incoming.slice(0, room));
    renderPendingImagePreview();
}

function removePendingImage(index) {
    pendingImages.splice(index, 1);
    renderPendingImagePreview();
}

function renderPendingImagePreview() {
    document.querySelectorAll(".pending-image-preview").forEach((preview) => preview.remove());

    if (pendingImages.length === 0) return;

    document.querySelectorAll(".chat-input-container").forEach((container) => {
        const preview = document.createElement("div");
        preview.className = "pending-image-preview";

        pendingImages.forEach((file, index) => {
            const url = URL.createObjectURL(file);
            const thumb = document.createElement("div");
            thumb.className = "pending-image-thumb";
            thumb.innerHTML = `
                <img src="${url}" />
                <button type="button" class="pending-image-remove">&times;</button>
            `;
            thumb.querySelector(".pending-image-remove").addEventListener("click", () => removePendingImage(index));
            preview.appendChild(thumb);
        });

        container.prepend(preview);
    });
}

document.querySelectorAll(".chat-attachment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/jpeg,image/png";
        fileInput.multiple = true;
        fileInput.style.display = "none";

        fileInput.addEventListener("change", () => {
            handleFilesSelected(fileInput.files);
            fileInput.remove();
        });

        document.body.appendChild(fileInput);
        fileInput.click();
    });
});

async function sendMessage(input) {
    if (!input) return;
    const message = input.value.trim();

    if (!message && pendingImages.length === 0) return;
    if (!currentConversationId) {
        console.warn("No conversation selected");
        return;
    }

    try {
        const formData = new FormData();
        formData.append("conversation_id", currentConversationId);
        if (message) formData.append("message", message);
        pendingImages.forEach((file) => formData.append("images", file));

        const res = await fetch("/api/v1/chat/messages", {
            method: "POST",
            credentials: "include",
            body: formData
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to send message");
        }

        input.value = "";
        pendingImages = [];
        renderPendingImagePreview();
    } catch (err) {
        console.error("Send message error:", err);
    }
}

async function startChat(username) {
    try {
        const res = await fetch("/api/v1/chat/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start conversation");

        window.location.href = `/users/message/?conversation=${data.conversation_id}`;
    } catch (err) {
        console.error("Start chat error:", err);
    }
}

// ========================================================
// READ / UNREAD HANDLING
// ========================================================

async function markConversationRead(conversationId) {
    try {
        const res = await fetch(`/api/v1/chat/conversations/${conversationId}/read`, {
            method: "PUT",
            credentials: "include"
        });

        if (!res.ok) throw new Error("Failed to mark conversation as read");

        // Clear the badge for this conversation in the list immediately
        document.querySelectorAll(".conversation").forEach((item) => {
            if (String(item.dataset.id) !== String(conversationId)) return;
            item.classList.remove("has-unread");
            item.querySelector(".conversation-unread-badge")?.remove();
        });

        updateGlobalUnreadBadge();
    } catch (err) {
        console.error("Mark as read error:", err);
    }
}

async function updateGlobalUnreadBadge() {
    try {
        const res = await fetch("/api/v1/chat/unread-count");
        if (!res.ok) throw new Error("Failed to load unread count");

        const data = await res.json();
        const count = Number(data.unread_count) || 0;

        // Adjust this selector to match your navbar's notification badge element
        document.querySelectorAll(".chat-unread-badge").forEach((badge) => {
            if (count > 0) {
                badge.textContent = count > 99 ? "99+" : count;
                badge.style.display = "";
            } else {
                badge.style.display = "none";
            }
        });
    } catch (err) {
        console.error("Update global unread badge error:", err);
    }
}

function bumpConversationUnread(conversationId) {
    document.querySelectorAll(".conversation").forEach((item) => {
        if (String(item.dataset.id) !== String(conversationId)) return;

        item.classList.add("has-unread");

        let badge = item.querySelector(".conversation-unread-badge");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "conversation-unread-badge";
            item.appendChild(badge);
        }

        const current = Number(badge.textContent) || 0;
        const next = current + 1;
        badge.textContent = next > 99 ? "99+" : next;
    });
}

function updateChatHeader(username, avatar = null) {
    document.querySelectorAll(".chat-header-username").forEach((element) => {
        element.textContent = username;
    });

    const desktopUsername = document.getElementById("desktopChatUserName");
    const mobileUsername = document.getElementById("mobileChatUserName");

    const profileImg = document.querySelectorAll(".chat-avatar");

    const avatarHtml = avatar 
        ? `<img src="/userdata/uploads/profileImg/${escapeHtml(avatar)}" alt="${escapeHtml(username)}" class="avatar-img" />`
        : escapeHtml(username.charAt(0).toUpperCase());

    profileImg.forEach(img => {
        img.innerHTML = avatarHtml;
    })

    if (desktopUsername) desktopUsername.textContent = "@" + username;
    if (mobileUsername) mobileUsername.textContent = "@" +  username;

    // Kemaskini avatar di header jika ada element class .chat-header-avatar
    document.querySelectorAll(".chat-header-avatar").forEach((headerAvatar) => {
        if (avatar) {
            headerAvatar.innerHTML = `<img src="/userdata/uploads/profileImg/${escapeHtml(avatar)}" alt="${escapeHtml(username)}" class="avatar-img" />`;
        } else {
            headerAvatar.innerHTML = escapeHtml(username.charAt(0).toUpperCase());
        }
    });
}

function checkOnlineStatus(username) {
    const statusElements = document.querySelectorAll(".chat-status");
    if (!statusElements.length) return;

    statusElements.forEach((element) => {
        element.style.color = "";
    });

    socket.emit("check_online_status", username, (response) => {
        updateOnlineStatus(response?.online === true);
    });
}

function updateOnlineStatus(isOnline) {
    document.querySelectorAll(".chat-status").forEach((element) => {
        element.textContent = isOnline ? "● Online" : "● Offline";
        element.style.color = isOnline ? "green" : "gray";
    });
}

function updateConversationPreview(message) {
    document.querySelectorAll(".conversation").forEach((conversation) => {
        if (String(conversation.dataset.id) !== String(message.conversation_id)) return;

        const preview = conversation.querySelector(".conversation-preview");
        const time = conversation.querySelector(".conversation-time");

        const previewText = message.message || (message.images?.length ? "📷 Gambar" : "");

        if (preview) preview.textContent = previewText;
        if (time) time.textContent = formatTime(message.sent_at);
    });
}

function joinConversation(conversationId) {
    socket.emit("join_conversation", conversationId);
}

socket.on("new_message", (message) => {
    updateConversationPreview(message);

    const isCurrentConversation = String(message.conversation_id) === String(currentConversationId);
    const isOwnMessage = message.sender === currentUser;

    if (isCurrentConversation) {
        appendMessageToAll(message);
        scrollToBottom(desktopMessages);
        scrollToBottom(mobileMessages);

        // I'm already looking at this conversation, so mark it read right away
        if (!isOwnMessage) {
            markConversationRead(currentConversationId);
        }
        return;
    }

    // Message arrived for a conversation I'm not currently viewing
    if (!isOwnMessage) {
        bumpConversationUnread(message.conversation_id);
        updateGlobalUnreadBadge();
    }
});

socket.on("user_status_changed", (data) => {
    if (!currentConversationUsername || data.username !== currentConversationUsername) return;
    updateOnlineStatus(data.online);
});

document.querySelector(".chat-back-btn")?.addEventListener("click", () => {
    document.querySelector(".mobile-message-view .message-container")?.classList.remove("chat-open");
});

document.querySelector("#desktopChatForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(document.querySelector("#desktopChatInput"));
});

document.querySelector("#mobileChatForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(document.querySelector("#mobileChatInput"));
});

function scrollToBottom(container) {
    if (container) container.scrollTop = container.scrollHeight;
}

function formatTime(date) {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("ms-MY", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

async function initChat() {
    await loadCurrentUser();
    if (!currentUser) return;

    await loadConversations();
}

function pollOnlineStatus() {
  if (currentConversationUsername) {
    checkOnlineStatus(currentConversationUsername);
  }
}

// Update user online status every 5 seconds
const statusInterval = setInterval(pollOnlineStatus, 5000);

initChat();