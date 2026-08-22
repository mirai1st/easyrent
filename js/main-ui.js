// Modal elements
var modal = document.getElementById("login-modal");
var register_modal = document.getElementById("register-modal");

var login_buttons = document.querySelectorAll(".login-modal-btn");
var register_buttons = document.querySelectorAll(".register-modal-btn");

var login_close_btn = document.getElementsByClassName("login-modal-close-btn")[0];
var register_close_btn = document.getElementsByClassName("register-modal-close-btn")[0];

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

// Click outside modal content to close — single handler covers both modals
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
  if (event.target == register_modal) {
    register_modal.style.display = "none";
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
  sidebarOpen = !sidebarOpen;
  sidebar.classList.toggle("enabled", sidebarOpen);
  sidebarOverlay.classList.toggle("enabled", sidebarOpen);
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
    const dialog = document.querySelector('.notification-dialog');
    const msgElement = document.getElementById('notification-dialog-msg');
    const notificationIcon = document.getElementById('notification-icon');

    if (notificationTimeout) clearTimeout(notificationTimeout);

    msgElement.textContent = msg;

    if (type === 'success') {
        dialog.style.backgroundColor = '#4a99125d';
        notificationIcon.innerHTML = "<i class='fa-solid fa-circle-check'></i>";
    } else if (type === 'error') {
        dialog.style.backgroundColor = '#9934125d';
        dialog.style.borderColor = "#a727115d";
        notificationIcon.innerHTML = "<i class='fa-solid fa-circle-xmark'></i>";
    } else {
        dialog.style.backgroundColor = '';
        notificationIcon.innerHTML = '';
    }

    dialog.classList.remove('show', 'disable');
    void dialog.offsetWidth; 
    
    dialog.classList.add('show');

    notificationTimeout = setTimeout(() => {
        dialog.classList.remove('show');
        dialog.classList.add('disable');
    }, 3000);
}

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
} else if (registerSuccess === "true") {
    showNotification("Registered successfully!", "success");
} else if (error === "1") {
    showNotification("Uh oh! That action requires you to log in.", "error");
}

// Clear parameters from the address bar to prevent notices on refresh
if (urlParams.toString()) {
    window.history.replaceState({}, document.title, window.location.pathname);
}


// Main CheckLogin for all pages

loadUser((user, error) => {
    if (error) {
        return;
    }

    console.log("Current user:", user);

    const login_btn_m = document.querySelector("[data-view='mobile-navmainbtn']");
    const login_btn_d = document.querySelector("[data-view='desktop-navmainbtn']");

    if (login_btn_m || login_btn_d) {
        if (login_btn_m) {
            login_btn_m.textContent = "Siarkan Iklan";
            login_btn_m.href = "/users/siarkan-iklan";
        }

        if (login_btn_d) {
            login_btn_d.style.display = "none";
            login_btn_d.style.marginLeft = "0px";
        }
    }
});

// Alert Box

loadNotificationCount();