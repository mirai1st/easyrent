// Memilih elemen mengikut CLASS
const profile_username = document.querySelectorAll(".profile-username");
const profile_fullname = document.querySelectorAll(".profile-fullname");
const profile_email = document.querySelectorAll(".profile-email");
const profile_phone = document.querySelectorAll(".profile-phone");
const createdAt = document.querySelectorAll(".date-created");
const user_type = document.querySelectorAll(".type-of-user");
const profile_img = document.querySelectorAll(".profile-img");
const sessionTime = document.querySelectorAll(".session-time");
const sessionId = document.querySelectorAll(".session-id");

let sessionInterval;

function looping(array, callback) {
    array.forEach(element => callback(element));
}

function startSessionTimer(sessionStart, expiresInSeconds = 3600) {
    if (sessionInterval) clearInterval(sessionInterval);

    sessionInterval = setInterval(() => {
        const elapsedMs = Date.now() - sessionStart;
        const remainingMs = (expiresInSeconds * 1000) - elapsedMs;

        if (remainingMs <= 0) {
            clearInterval(sessionInterval);
            looping(sessionTime, el => el.textContent = "Sesi tamat");
            return;
        }

        const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedMs / (1000 * 60)) % 60);
        const seconds = Math.floor((elapsedMs / 1000) % 60);

        const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        looping(sessionTime, el => el.textContent = formatted);
    }, 1000);
}

loadUser((user) => {
    console.log("Current Users: " + user);

    looping(profile_username, el => el.textContent = `@${user.username}`);
    looping(profile_email, el => el.textContent = user.email || "-");
    looping(profile_phone, el => el.textContent = user.phoneNo || "-");
    looping(profile_fullname, el => el.textContent = user.full_name || "-");
    looping(user_type, el => el.textContent = (user.role === "normal_user") ? "Pengguna" : "Admin");
    looping(sessionId, el => el.textContent = "-");
    looping(createdAt, el => {
        el.textContent = user.dateCreated
            ? new Date(user.dateCreated).toLocaleDateString("ms-MY")
            : "-";
    });
    looping(profile_img, el => {
        if (user.profileImg_url) {
            el.style.display = "block";
            el.src = "/users/userdata/img/profileImg/" + user.profileImg_url;
        }
    });

    startSessionTimer(user.sessionStart);
});

// Event Listener untuk Log Keluar
// Event Listener untuk Log Keluar
document.addEventListener("DOMContentLoaded", () => {
    loadUser();
    setupLogoutButtons();
});

function setupLogoutButtons() {
    const logoutBtns = document.querySelectorAll(".btn-logout");

    logoutBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();

            alertbox("Anda pasti untuk melog keluar akaun ini?", logoutUser);
        });
    });
}

async function logoutUser() {
    try {
        const response = await fetch("/api/logout", {
            method: "POST",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Logout gagal:", data.message);
            return;
        }

        window.location.href = "/";

    } catch (error) {
        console.error("Gagal log keluar:", error);
    }
}

// Alert box

const alert_box = document.querySelector(".alert-box");
const alertbox_overlay = document.querySelector(".alertbox-overlay");
const alertbox_message = document.querySelector(".alertbox-message");
const yes = document.querySelector(".yes-alert-box");
const no = document.querySelector(".no-alert-box");

function closeAlertBox() {
    alert_box.classList.remove("enabled");
    alertbox_overlay.classList.remove("enabled");
}

function alertbox(message, callback = null) {
    alert_box.classList.add("enabled");
    alertbox_overlay.classList.add("enabled");
    alertbox_message.textContent = message;

    // clone nodes to strip old listeners, avoid stacking
    const newYes = yes.cloneNode(true);
    yes.replaceWith(newYes);

    const newNo = no.cloneNode(true);
    no.replaceWith(newNo);

    newYes.addEventListener("click", () => {
        closeAlertBox();
        callback();
    });

    alertbox_overlay.addEventListener("click", closeAlertBox);
    newNo.addEventListener("click", closeAlertBox);
}