let userPromise = null;

// Function for loadUser
function loadUser(callback) {
    if (!userPromise) userPromise = fetchUser();

    if (typeof callback === "function") {
        userPromise.then(({ user, error }) => callback(user, error));
    }

    return userPromise;
}

// Function for fetching user data
async function fetchUser() {
    try {
        const response = await fetch("/api/me", { credentials: "include" });

        if (!response.ok) {
            console.error("Failed to fetch user! Not logged in or session expired.");
            return {
                user: null,
                error: { type: "AUTH_ERROR", message: "Not logged in or session expired." }
            };
        }

        return { user: await response.json(), error: null };

    } catch (err) {
        console.error("Failed to load user:", err);
        return {
            user: null,
            error: { type: "FETCH_ERROR", message: "Failed to load user.", error: err }
        };
    }
}

// Function for fetching user data
function domReady() {
    if (document.readyState !== "loading") return Promise.resolve();
    return new Promise(resolve => {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
    });
}

// Load notification count
async function loadNotificationCount() {
    try {
        const response = await fetch("/api/notifications/unread", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (data.success) {
            await domReady();

            const notificationCounts = document.querySelectorAll(".notification-count");
            const notificationButtons = document.querySelectorAll(".notification-button");
            const lihatProfileButton = document.querySelector(".lihat-profile");

            notificationCounts.forEach((notificationCount, index) => {
                const unreadCount = data.unreadCount;
                notificationCount.textContent = unreadCount === 0 ? "" : ` ${unreadCount}`;

                if (notificationButtons[index]) {
                    notificationButtons[index].title = unreadCount === 0
                        ? "No new notifications"
                        : `You have ${unreadCount} new notification${unreadCount > 1 ? "s" : ""}`;
                }
            });

            if (lihatProfileButton) {
                lihatProfileButton.style.display = "block";
            }
        }

    } catch (error) {
        console.error("Error loading notification count:", error);
    }
}

async function loadMessageCount() {
    
}

// ===== Favourite =====

// type: "house" atau "community"
// Pulangkan { success, type, counts: { house, community }, items: [...] }
async function loadFavouriteList(type = "house") {
    try {
        const response = await fetch(`/api/favourite/get?type=${encodeURIComponent(type)}`, {
            credentials: "include"
        });

        return await response.json();
    } catch (err) {
        console.error("Error getting user favourite list.", err);
    }
}

// Pulangkan { success, house: [7, 9], community: [6] } untuk tandakan ikon hati
async function loadFavouriteIds() {
    try {
        const response = await fetch("/api/favourite/ids", {
            credentials: "include"
        });

        return await response.json();
    } catch (err) {
        console.error("Error getting user favourite ids.", err);
    }
}

// Tambah kalau belum ada, buang kalau dah ada
// Pulangkan { success, favourited: true/false }
async function toggleFavourite(type, postId) {
    try {
        const response = await fetch("/api/favourite/toggle", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, postId })
        });

        return await response.json();
    } catch (err) {
        console.error("Error toggling user favourite.", err);
    }
}

// ===== Init navbar (tunggu data siap dulu, baru page dibuka) =====

function showPage() {
    document.documentElement.classList.remove("loading");
}

async function initNavbar() {
    // failsafe: kalau fetch tergantung, page tetap dibuka lepas 8 saat
    const failsafe = setTimeout(showPage, 8000);

    try {
        const [{ user, error }] = await Promise.all([
            loadUser(),
            loadNotificationCount(),
            domReady()
        ]);

        if (error || !user) return;

        const loginBtnM = document.querySelector("[data-view='mobile-navmainbtn']");
        const loginBtnD = document.querySelector("[data-view='desktop-navmainbtn']");
        const loginBtnSide = document.querySelectorAll(".sidebar-login-btn");
        const notificationObject = document.querySelectorAll(".notification_object");

        if (loginBtnD) loginBtnD.hidden = true;
        if (loginBtnM) loginBtnM.hidden = true;

        loginBtnSide.forEach(btn => btn.style.display = "none");
        notificationObject.forEach(btn => btn.style.display = "block");

    } catch (err) {
        console.error("initNavbar error:", err);
    } finally {
        clearTimeout(failsafe);
        showPage();
    }
}

initNavbar();