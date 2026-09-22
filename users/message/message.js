const socket = io();

let currentUser = null;
let currentConversationId = null;

// =====================================================
// DOM ELEMENTS
// =====================================================
const desktopConversationList = document.querySelector("#desktopConversationList");
const mobileConversationList = document.querySelector("#mobileConversationList");
const desktopMessages = document.querySelector("#desktopChatMessages");
const mobileMessages = document.querySelector("#mobileChatMessages");

// =====================================================
// AUTH & INITIAL DATA
// =====================================================
async function loadCurrentUser() {
  try {
    const res = await fetch("/api/me");
    if (!res.ok) throw new Error("Not logged in");

    const data = await res.json();
    currentUser = data.username || data.user?.username;
  } catch (err) {
    console.error("Failed to get current user:", err);
  }
}

async function loadConversations() {
  try {
    const res = await fetch("/api/v1/chat/conversations");
    if (!res.ok) throw new Error("Failed to load conversations");

    const conversations = await res.json();
    renderConversations(conversations);
  } catch (err) {
    console.error("Failed to load conversations:", err);
  }
}

// =====================================================
// RENDER CONVERSATIONS
// =====================================================
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
  const preview = conversation.last_message || "Belum ada mesej";
  const time = conversation.last_message_time ? formatTime(conversation.last_message_time) : "";

  element.innerHTML = `
    <div class="conversation-avatar">
      ${escapeHtml(username.charAt(0).toUpperCase())}
    </div>
    <div class="conversation-info">
      <div class="conversation-top">
        <span class="conversation-name">${escapeHtml(username)}</span>
        <span class="conversation-time">${time}</span>
      </div>
      <p class="conversation-preview">${escapeHtml(preview)}</p>
    </div>
  `;

  element.addEventListener("click", () => {
    openConversation(conversation.conversation_id, username);
  });

  return element;
}

// =====================================================
// CHAT ACTIONS
// =====================================================
async function openConversation(conversationId, username) {
  // Leave existing Socket.io room before switching to a new one
  if (currentConversationId && currentConversationId !== conversationId) {
    socket.emit("leave_conversation", currentConversationId);
  }

  currentConversationId = conversationId;

  updateChatHeader(username);
  await loadMessages(conversationId);
  joinConversation(conversationId);

  // Mobile layout state transition
  document
    .querySelector(".mobile-message-view .message-container")
    ?.classList.add("chat-open");

  // Update visual active state across all lists
  document.querySelectorAll(".conversation").forEach((item) => {
    item.classList.toggle("active", item.dataset.id == conversationId);
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

  messages.forEach((message) => {
    appendMessageToAll(message);
  });

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
      body: JSON.stringify({
        conversation_id: currentConversationId,
        message
      })
    });

    if (!res.ok) throw new Error("Failed to send message");

    input.value = "";
  } catch (err) {
    console.error("Send message error:", err);
  }
}

// Optional helper function implementation if not declared elsewhere
function updateChatHeader(username) {
  document.querySelectorAll(".chat-header-username").forEach((el) => {
    el.textContent = username;
  });
}

// =====================================================
// EVENT LISTENERS
// =====================================================
document.querySelector("#desktopChatForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(document.querySelector("#desktopChatInput"));
});

document.querySelector("#mobileChatForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(document.querySelector("#mobileChatInput"));
});

document.querySelector(".chat-back-btn")?.addEventListener("click", () => {
  document
    .querySelector(".mobile-message-view .message-container")
    ?.classList.remove("chat-open");
});

// =====================================================
// SOCKET.IO LISTENERS
// =====================================================
function joinConversation(conversationId) {
  socket.emit("join_conversation", conversationId);
}

socket.on("new_message", (message) => {
  // Only display messages matching the active conversation
  if (message.conversation_id != currentConversationId) return;

  appendMessageToAll(message);
  scrollToBottom(desktopMessages);
  scrollToBottom(mobileMessages);
});

// =====================================================
// HELPERS
// =====================================================
function scrollToBottom(container) {
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
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

// =====================================================
// INITIALIZE
// =====================================================
async function initChat() {
  await loadCurrentUser();
  if (!currentUser) return;

  await loadConversations();
}

async function startChat(username) {
    try {
        const res = await fetch("/api/v1/chat/conversations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                username: username
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to start conversation");
        }

        // Pergi ke message page
        window.location.href =
            `/users/message/?conversation=${data.conversation_id}`;

    } catch (err) {
        console.error("Start chat error:", err);
    }
}

initChat();