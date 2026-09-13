const mobileMessageContainer = document.querySelector(
  ".mobile-message-view .message-container",
);

const mobileChatBackBtn = document.querySelector(
  ".mobile-message-view .chat-back-btn",
);

const mobileConversationList = document.getElementById(
  "mobileConversationList",
);

const desktopConversationList = document.getElementById(
  "desktopConversationList",
);

/* =========================================================
   MOBILE CHAT
   ========================================================= */

function openMobileChat() {
  mobileMessageContainer?.classList.add("chat-open");
}

function closeMobileChat() {
  mobileMessageContainer?.classList.remove("chat-open");
}

mobileChatBackBtn?.addEventListener("click", closeMobileChat);

/* =========================================================
   OPEN CHAT WHEN CONVERSATION IS CLICKED
   ========================================================= */

document.addEventListener("click", function (event) {
  const conversation = event.target.closest(
    ".mobile-message-view .conversation",
  );

  if (!conversation) {
    return;
  }

  openMobileChat();
});

/* =========================================================
   EXAMPLE CONVERSATION DATA
   ========================================================= */

const conversations = [
  {
    username: "ali",
    name: "Ali",
    preview: "Hi, masih available?",
    time: "12:30",
    online: true,
  },
  {
    username: "abu",
    name: "Abu",
    preview: "Okay, terima kasih!",
    time: "11:45",
    online: false,
  },
  {
    username: "siti",
    name: "Siti",
    preview: "Boleh saya tanya sesuatu?",
    time: "10:20",
    online: true,
  },
];

/* =========================================================
   RENDER CONVERSATION
   ========================================================= */

function renderConversations(container) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  conversations.forEach((user) => {
    const conversation = document.createElement("div");

    conversation.className = "conversation";

    conversation.dataset.username = user.username;

    conversation.innerHTML = `
            <div class="conversation-avatar">
                ${user.name.charAt(0).toUpperCase()}
            </div>

            <div class="conversation-info">

                <div class="conversation-top">

                    <span class="conversation-name">
                        ${user.name}
                    </span>

                    <span class="conversation-time">
                        ${user.time}
                    </span>

                </div>

                <p class="conversation-preview">
                    ${user.preview}
                </p>

            </div>
        `;

    container.appendChild(conversation);
  });
}

/* =========================================================
   RENDER BOTH VIEWS
   ========================================================= */

renderConversations(mobileConversationList);
renderConversations(desktopConversationList);

/* =========================================================
   SELECT CONVERSATION
   ========================================================= */

document.addEventListener("click", function (event) {
  const conversation = event.target.closest(".conversation");

  if (!conversation) {
    return;
  }

  const username = conversation.dataset.username;

  const user = conversations.find((item) => item.username === username);

  if (!user) {
    return;
  }

  openConversation(user);
});

/* =========================================================
   OPEN CONVERSATION
   ========================================================= */

function openConversation(user) {
  /* =========================
       MOBILE
       ========================= */

  const mobileAvatar = document.getElementById("mobileChatAvatar");

  const mobileName = document.getElementById("mobileChatUserName");

  const mobileStatus = document.getElementById("mobileChatStatus");

  if (mobileAvatar) {
    mobileAvatar.textContent = user.name.charAt(0).toUpperCase();
  }

  if (mobileName) {
    mobileName.textContent = user.name;
  }

  if (mobileStatus) {
    mobileStatus.innerHTML = user.online
      ? '<span class="online-dot"></span> Online'
      : "Offline";
  }

  /* =========================
       DESKTOP
       ========================= */

  const desktopAvatar = document.getElementById("desktopChatAvatar");

  const desktopName = document.getElementById("desktopChatUserName");

  const desktopStatus = document.getElementById("desktopChatStatus");

  if (desktopAvatar) {
    desktopAvatar.textContent = user.name.charAt(0).toUpperCase();
  }

  if (desktopName) {
    desktopName.textContent = user.name;
  }

  if (desktopStatus) {
    desktopStatus.innerHTML = user.online
      ? '<span class="online-dot"></span> Online'
      : "Offline";
  }

  /* =========================
       ACTIVE CONVERSATION
       ========================= */

  document
    .querySelectorAll(".conversation")
    .forEach((item) => item.classList.remove("active"));

  document
    .querySelectorAll(`.conversation[data-username="${user.username}"]`)
    .forEach((item) => item.classList.add("active"));

  /* =========================
       MOBILE OPEN
       ========================= */

  if (window.matchMedia("(max-width: 767px)").matches) {
    openMobileChat();
  }

  /* =========================
       LOAD MESSAGES
       ========================= */

  loadMessages(user);
}

/* =========================================================
   LOAD MESSAGES
   ========================================================= */

function loadMessages(user) {
  const messages = [
    {
      type: "received",
      text: "Hi, masih available?",
      time: "12:28",
    },
    {
      type: "sent",
      text: "Hi, ya masih available.",
      time: "12:29",
    },
    {
      type: "received",
      text: "Okay, terima kasih!",
      time: "12:30",
    },
  ];

  const containers = [
    document.getElementById("mobileChatMessages"),
    document.getElementById("desktopChatMessages"),
  ];

  containers.forEach((container) => {
    if (!container) {
      return;
    }

    container.innerHTML = "";

    messages.forEach((message) => {
      const messageElement = document.createElement("div");

      messageElement.className = `message ${message.type}`;

      messageElement.innerHTML = `
                <div class="message-bubble">
                    ${message.text}
                </div>

                <span class="message-time">
                    ${message.time}
                </span>
            `;

      container.appendChild(messageElement);
    });

    container.scrollTop = container.scrollHeight;
  });
}

/* =========================================================
   SEND MESSAGE
   ========================================================= */

function setupChatForm(formId, inputId, messagesId) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const messages = document.getElementById(messagesId);

  if (!form || !input || !messages) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = input.value.trim();

    if (!text) {
      return;
    }

    const message = document.createElement("div");

    message.className = "message sent";

    message.innerHTML = `
            <div class="message-bubble">
                ${text}
            </div>

            <span class="message-time">
                Sekarang
            </span>
        `;

    messages.appendChild(message);

    input.value = "";

    messages.scrollTop = messages.scrollHeight;
  });
}

/* =========================================================
   FORM SETUP
   ========================================================= */

setupChatForm("mobileChatForm", "mobileChatInput", "mobileChatMessages");

setupChatForm("desktopChatForm", "desktopChatInput", "desktopChatMessages");

/* =========================================================
   MOBILE BACK BUTTON
   ========================================================= */

window.addEventListener("resize", function () {
  if (!window.matchMedia("(max-width: 767px)").matches) {
    closeMobileChat();
  }
});

/* =========================================================
   FAVOURITE CATEGORIES
   ========================================================= */

const favouriteEmptyStates = {
  houses: {
    icon: "fa-heart",
    title: "Belum ada rumah kegemaran",
    text: "Tekan ikon hati pada rumah yang anda suka. Semua pilihan rumah anda akan muncul di sini.",
    button: "Terokai rumah",
    link: "/#recommendations",
  },
  "student-posts": {
    icon: "fa-graduation-cap",
    title: "Belum ada post Sudut Pelajar",
    text: "Simpan post komuniti yang berguna untuk dirujuk semula bila-bila masa.",
    button: "Lihat Sudut Pelajar",
    link: "/sudut-pelajar/",
  },
};

function renderFavouriteEmptyState(container, category) {
  const state = favouriteEmptyStates[category];

  if (!container || !state) {
    return;
  }

  container.innerHTML = `
    <div class="favourite-empty-icon"><i class="fa-solid ${state.icon}"></i></div>
    <h2>${state.title}</h2>
    <p>${state.text}</p>
    <a class="favourite-explore-btn" href="${state.link}">
      ${state.button} <i class="fa-solid fa-arrow-right"></i>
    </a>
  `;
}

document.querySelectorAll(".favourite-tabs").forEach((tabList) => {
  tabList.addEventListener("click", (event) => {
    const selectedTab = event.target.closest("[data-favourite-tab]");

    if (!selectedTab) {
      return;
    }

    const category = selectedTab.dataset.favouriteTab;

    document.querySelectorAll("[data-favourite-tab]").forEach((tab) => {
      const isActive = tab.dataset.favouriteTab === category;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll("[data-favourite-empty]").forEach((emptyState) => {
      emptyState.dataset.favouriteEmpty = category;
      renderFavouriteEmptyState(emptyState, category);
    });
  });
});
