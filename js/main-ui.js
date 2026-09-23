// Modal elements
var modal = document.getElementById("login-modal");
var register_modal = document.getElementById("register-modal");

var login_buttons = document.querySelectorAll(".login-modal-btn");
var register_buttons = document.querySelectorAll(".register-modal-btn");

var codeverify_modal = document.getElementById("codeverify-modal");

var login_close_btn = document.getElementsByClassName("login-modal-close-btn")[0];
var register_close_btn = document.getElementsByClassName("register-modal-close-btn")[0];
var codeverify_close_btn = document.getElementsByClassName("codeverify-modal-close-btn")[0];

// Open login modal (and close register modal if it's open)
login_buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    register_modal.style.display = "none";
    modal.style.display = "block";
  });
});

// Open register modal (and close login modal if it's open)
register_buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    modal.style.display = "none";
    register_modal.style.display = "block";
  });
});

loadNotificationCount();

// Navigation buttons are loaded asynchronously from the nav component.
document.addEventListener("click", (event) => {
  const loginButton = event.target.closest(".login-modal-btn");
  const registerButton = event.target.closest(".register-modal-btn");

  if (loginButton && modal && register_modal) {
    register_modal.style.display = "none";
    modal.style.display = "block";
  }

  if (registerButton && modal && register_modal) {
    modal.style.display = "none";
    register_modal.style.display = "block";
  }
});

// Close buttons
login_close_btn.onclick = function () {
  modal.style.display = "none";
};

register_close_btn.onclick = function () {
  register_modal.style.display = "none";
};

codeverify_close_btn.onclick = function () {
  codeverify_modal.style.display = "none";
};

// Click outside modal content to close — single handler covers all three modals
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
  if (event.target == register_modal) {
    register_modal.style.display = "none";
  }
  if (event.target == codeverify_modal) {
    codeverify_modal.style.display = "none";
  }
};

// sidebar
const sidebar         = document.querySelector(".sidebar");
const sidebarbtn      = document.querySelectorAll("#sidebarButton");
const sidebarclosebtn = document.querySelector(".sidebar-close-btn");
const sidebarOverlay  = document.querySelector(".sidebar-overlay");
const navs            = document.querySelectorAll("nav");
const buttonToScroll  = document.querySelector(".buttonToScroll");
const sidebarNavLinks = document.querySelectorAll(".sidebar-nav a");
const nav_logo        = document.querySelectorAll(".nav-logo");
const nav_mainbutton  = document.querySelectorAll(".nav-mainbutton");
const navright_btn = document.querySelectorAll(".nav-right-button");

let sidebarOpen = false;
let touchStartX = 0;
let touchStartY = 0;

function setSidebarState(openState) {
  sidebarOpen = openState;
  document.querySelector(".sidebar")?.classList.toggle("enabled", sidebarOpen);
  document.querySelector(".sidebar-overlay")?.classList.toggle("enabled", sidebarOpen);
}

function updateNavState() {
  const scrolledPastThreshold = window.scrollY > 500;
  const shouldLookScrolled = scrolledPastThreshold || sidebarOpen;
  const currentNavs = document.querySelectorAll("nav");
  const currentNavLogos = document.querySelectorAll(".nav-logo");
  const currentNavButtons = document.querySelectorAll(".nav-mainbutton");
  const currentNavRightButtons = document.querySelectorAll(".nav-right-button");

  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    currentNavs.forEach(nav => nav.classList.toggle("scrolled", shouldLookScrolled));
    buttonToScroll?.classList.toggle("rotate", scrolledPastThreshold);
    if (buttonToScroll) {
      buttonToScroll.href = scrolledPastThreshold ? "#top" : "#recommendations";
    }
  
    currentNavLogos.forEach(logo => logo.style.color = scrolledPastThreshold ? "#52341D" : "white");
    currentNavRightButtons.forEach(link => link.style.color = scrolledPastThreshold ? "#52341D" : "white");
    
    currentNavButtons.forEach(btn => {
      if (scrolledPastThreshold) {
        btn.classList.add("scrolled");
      } else {
        btn.classList.remove("scrolled");
      }
    });
  }
}

function toggleSidebar() {
  setSidebarState(!sidebarOpen);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("#sidebarButton, .sidebar-close-btn, .sidebar-overlay, .sidebar-nav a");
  if (!target) return;

  if (target.matches(".sidebar-nav a") && !sidebarOpen) return;
  toggleSidebar();
});

document.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) < 60 || Math.abs(deltaY) > 50) {
    return;
  }

  if (!sidebarOpen && touchStartX < 45 && deltaX > 60) {
    setSidebarState(true);
    return;
  }

  if (sidebarOpen && deltaX < -60) {
    setSidebarState(false);
  }
}, { passive: true });

// Scroll behaviour
window.addEventListener("scroll", updateNavState);
updateNavState();


// Search.html

function moveCarousel(btn, direction) {
    const carousel = btn.closest('.image-carousel');
    const track = carousel.querySelector('.carousel-track');
    const images = track.querySelectorAll('.carousel-img');
    const dots = carousel.querySelectorAll('.dot');

    let index = parseInt(track.dataset.index || 0);
    index = (index + direction + images.length) % images.length;

    track.style.transform = `translateX(-${index * 100}%)`;
    track.dataset.index = index;

    dots.forEach(d => d.classList.remove('active'));
    dots[index].classList.add('active');
}

// Notification Dialog

/**
 * Displays a notification dialog message with color-coded styling based on message type
 * @param {string} msg - The notification message to display
 * @param {string} type - The type of notification ('success' or 'error') that determines the color
 * 
 * Functionality:
 * 1. Selects the notification dialog element and sets its message content
 * 2. Applies background color based on type (green for success, red for error)
 * 3. Removes 'show' class to reset animation state
 * 4. Forces a DOM reflow to restart CSS animation
 * 5. Adds 'show' class to trigger notification appearance animation
 * 6. After 3 seconds, adds 'disable' class to fade out the notification
 */
function showNotification(msg, type = 'success', timer = 10000) {
  let container = document.getElementById('notification-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-toast-container';
    container.className = 'notification-toast-container';
    document.body.appendChild(container);
  }

  // --- HADKAN MAKSIMUM 3 NOTIFIKASI ---
  const MAX_NOTIFICATIONS = 3;
  const existingPopups = container.querySelectorAll('.notification-popup');
  
  if (existingPopups.length >= MAX_NOTIFICATIONS) {
    // Buang notifikasi paling lama (elemen pertama)
    existingPopups[0].remove();
  }
  // ------------------------------------

  const isError = type === 'error';
  const popup = document.createElement('div');
  popup.className = `notification-popup ${isError ? 'is-error' : ''}`;
  popup.setAttribute('role', 'status');
  popup.innerHTML = `
    <div class="flex">
      <span class="notification-popup-icon">
        <i class="fa-solid fa-circle-${isError ? 'xmark' : 'check'}"></i>
      </span>
      <span class="notification-popup-content">
        <strong>${isError ? 'Ralat Telah Berlaku' : 'Berjaya'}</strong>
        <p></p>
      </span>
      <button type="button" aria-label="Tutup notifikasi">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="notification-progress-bg"></div>
    <div class="notification-progress-timer"></div>
  `;
  popup.querySelector('p').textContent = msg;
  popup.style.setProperty('--notification-duration', `${timer}ms`);
  container.appendChild(popup);
  void popup.offsetWidth;
  popup.classList.add('show');

  const removePopup = () => {
    if (!popup.isConnected) return;
    popup.classList.add('is-closing');
    popup.addEventListener('transitionend', () => popup.remove(), { once: true });
    setTimeout(() => popup.remove(), 300);
  };

  popup.querySelector('button').addEventListener('click', removePopup);
  setTimeout(removePopup, timer);
}

// Parse URL search parameters once
const urlParams = new URLSearchParams(window.location.search);
const loginSuccess = urlParams.get("login_success");
const registerSuccess = urlParams.get("register_success");
const error = urlParams.get("error");

// Priority logic prevents overwriting notifications
if (loginSuccess === "true") {
    loadUser((user) => {
      showNotification(`Selamat kembali @${user.username}!`, "success");
    });
    
} else if (loginSuccess === "false") {
    showNotification(`Ralat ketika mengelog masuk: ${error || 'Invalid credentials'}`, "error");
    modal.style.display = "block"; // Open login modal on failed login
} else if (registerSuccess === "true") {
    showNotification("Akaun anda telah didaftarkan! Anda boleh me-log masuk semula akaun anda.", "success");
} else if (error === "1") {
    showNotification("Uh oh! That action requires you to log in.", "error");
    modal.style.display = "block"; // Open login modal on failed login
}

// Clear only notification parameters so search and filter parameters remain visible.
const cleanUrl = new URL(window.location.href);
cleanUrl.searchParams.delete("login_success");
cleanUrl.searchParams.delete("register_success");
cleanUrl.searchParams.delete("error");

if (cleanUrl.href !== window.location.href) {
  window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
}


// Main CheckLogin for all pages



// Alert Box



// Function to open modal login if user is not logged in, otherwise redirect to the specified URL and do callback

function checkLoginModal(url, callback = () => {}) {
    loadUser((user, error) => {
        if (error || !user) {
            modal.style.display = "block";
            showNotification("Anda perlu mengelog masuk untuk mengakses ciri ini.", "error");
        } else {
            window.location.href = url;
            callback(user);
        }
    });
}

// main-ui.js

async function startChat(username, id) {
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

        const content = `Hi! saya berminat untuk menyewa rumah ini, /house/?house=${id}`;

        window.location.href =
            `/users/message/?conversation=${data.conversation_id}&message=${content}`;

    } catch (err) {
        console.error("Start chat error:", err);
    }
}