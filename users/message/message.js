const socket = io();

let currentUser = null;
let currentConversationId = null;
let currentConversationUsername = null;

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

    // Guna gambar profileImg_url jika wujud, jika tiada tunjuk huruf pertama
    const avatarHtml = avatar 
        ? `<img src="/userdata/uploads/profileImg/${escapeHtml(avatar)}" alt="${escapeHtml(username)}" class="avatar-img" />`
        : escapeHtml(username.charAt(0).toUpperCase());

    element.innerHTML = `
        <div class="conversation-avatar">
            ${avatarHtml}
        </div>
        <div class="conversation-info">
            <div class="conversation-top">
                <span class="conversation-name">@${escapeHtml(username)}</span>
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

    let params = new URLSearchParams(document.location.search);

    if (params.get("message")) {
        document.querySelectorAll(".chat-input").forEach(chat => {
            chat.value = params.get("message");
        });
    }

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

    element.innerHTML = `
        <div class="message-bubble">${escapeHtml(message.message)}</div>
        <span class="message-time">${formatTime(message.sent_at)}</span>
    `;

    container.appendChild(element);
}

async function sendMessage(input) {
    if (!input) return;
    const message = input.value.trim();

    if (!message) return;
    if (!currentConversationId) {
        console.warn("No conversation selected");
        return;
    }

    try {
        const res = await fetch("/api/v1/chat/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                conversation_id: currentConversationId,
                message
            })
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to send message");
        }

        input.value = "";
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
            headerAvatar.innerHTML = `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(username)}" class="avatar-img" />`;
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

        if (preview) preview.textContent = message.message;
        if (time) time.textContent = formatTime(message.sent_at);
    });
}

function joinConversation(conversationId) {
    socket.emit("join_conversation", conversationId);
}

socket.on("new_message", (message) => {
    if (String(message.conversation_id) !== String(currentConversationId)) return;

    appendMessageToAll(message);
    scrollToBottom(desktopMessages);
    scrollToBottom(mobileMessages);
    updateConversationPreview(message);
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