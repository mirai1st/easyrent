async function loadUser(callback) {
    try {
        const response = await fetch("/api/me", {
            credentials: "include"
        });

        if (!response.ok) {
            console.error("Failed to fetch user! Not logged in or session expired.");

            if (typeof callback === "function") {
                callback(null, {
                    type: "AUTH_ERROR",
                    message: "Not logged in or session expired."
                });
            }

            return;
        }

        const user = await response.json();

        // Success
        if (typeof callback === "function") {
            callback(user, null);
        }

    } catch (err) {
        console.error("Failed to load user:", err);

        if (typeof callback === "function") {
            callback(null, {
                type: "FETCH_ERROR",
                message: "Failed to load user.",
                error: err
            });
        }
    }
}

async function loadNotificationCount() {
    try {
        const response = await fetch('/api/notifications/unread', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            const notificationCounts = document.querySelectorAll('.notification-count');

            notificationCounts.forEach(notificationCount => {
                notificationCount.textContent = data.unreadCount === 0 ? '' : ` ${data.unreadCount}`;
            });
        }

    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}