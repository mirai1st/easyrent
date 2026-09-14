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
  sidebar.classList.toggle("enabled", sidebarOpen);
  sidebarOverlay.classList.toggle("enabled", sidebarOpen);
}

function updateNavState() {
  const scrolledPastThreshold = window.scrollY > 500;
  const shouldLookScrolled = scrolledPastThreshold || sidebarOpen;

  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    navs.forEach(nav => nav.classList.toggle("scrolled", shouldLookScrolled));
    buttonToScroll.classList.toggle("rotate", scrolledPastThreshold);
    buttonToScroll.href = scrolledPastThreshold ? "#top" : "#recommendations";
  
    nav_logo.forEach(logo => logo.style.color = scrolledPastThreshold ? "#52341D" : "white");
    navright_btn.forEach(link => link.style.color = scrolledPastThreshold ? "#52341D" : "white");
    
    nav_mainbutton.forEach(btn => {
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

sidebarNavLinks.forEach(link => {
  link.addEventListener("click", () => {
    if (sidebarOpen) {
      toggleSidebar();
    }
  });
});

sidebarbtn.forEach(btn => {
  btn.addEventListener("click", ()=> {
    toggleSidebar();
  })
});

sidebarclosebtn.addEventListener("click", toggleSidebar);
sidebarOverlay.addEventListener("click", toggleSidebar);

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
let notificationTimeout = null;

function showNotification(msg, type = 'success') {
  const popup = document.getElementById('notification-popup');
  const titleElement = document.getElementById('notification-popup-title');
  const msgElement = document.getElementById('notification-popup-msg');
  const iconElement = document.getElementById('notification-popup-icon');
  const timerElement = popup?.querySelector('.notification-progress-timer');

  if (!popup || !titleElement || !msgElement || !iconElement) return;
    if (notificationTimeout) clearTimeout(notificationTimeout);

  const isError = type === 'error';
  titleElement.textContent = isError ? 'Ada masalah' : 'Berjaya';
    msgElement.textContent = msg;
  iconElement.innerHTML = `<i class="fa-solid fa-circle-${isError ? 'xmark' : 'check'}"></i>`;
  popup.classList.toggle('is-error', isError);
  popup.classList.remove('show');
  void popup.offsetWidth;

  if (timerElement) {
    timerElement.style.animation = 'none';
    void timerElement.offsetWidth;
    timerElement.style.animation = '';
    }

  popup.classList.add('show');

    notificationTimeout = setTimeout(() => {
    popup.classList.remove('show');
  }, 4000);
}

document.getElementById('notification-popup-close')?.addEventListener('click', () => {
  const popup = document.getElementById('notification-popup');
  if (notificationTimeout) clearTimeout(notificationTimeout);
  popup?.classList.remove('show');
});

// Parse URL search parameters once
const urlParams = new URLSearchParams(window.location.search);
const loginSuccess = urlParams.get("login_success");
const registerSuccess = urlParams.get("register_success");
const error = urlParams.get("error");

// Priority logic prevents overwriting notifications
if (loginSuccess === "true") {
    showNotification("Logged in successfully!", "success");
} else if (loginSuccess === "false") {
    showNotification(`Login Failed: ${error || 'Invalid credentials'}`, "error");
    modal.style.display = "block"; // Open login modal on failed login
} else if (registerSuccess === "true") {
    showNotification("Registered successfully!", "success");
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

loadUser((user, error) => {
    if (error) {
        return;
    }

    console.log("Current user:", user);

    const login_btn_m = document.querySelector("[data-view='mobile-navmainbtn']");
    const login_btn_d = document.querySelector("[data-view='desktop-navmainbtn']");
    const login_btn_side = document.querySelectorAll(".sidebar-login-btn");

    if (login_btn_m || login_btn_d) {
        if (login_btn_m) {
            login_btn_m.textContent = "Siarkan Iklan";
            login_btn_m.href = "/users/siarkan-iklan";
        }

        if (login_btn_d) {
            login_btn_d.style.display = "none";
            login_btn_d.style.marginLeft = "0px";
        }

        login_btn_side.forEach(btn => {
          btn.style.display = "none";
        })
    }
});

// Alert Box

loadNotificationCount();

// Function to open modal login if user is not logged in, otherwise redirect to the specified URL and do callback

function checkLoginModal(url, callback = () => {}) {
    loadUser((user, error) => {
        if (error || !user) {
            modal.style.display = "block";
            showNotification("You need to log in first to access this feature.", "error");
        } else {
            window.location.href = url;
            callback();
        }
    });
}