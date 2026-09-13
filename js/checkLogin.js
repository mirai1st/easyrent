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
            const notificationButtons = document.querySelectorAll('.notification-button');
            const lihatProfileButton = document.querySelector('.lihat-profile');

            notificationCounts.forEach((notificationCount, index) => {
                const unreadCount = data.unreadCount;
                notificationCount.textContent = unreadCount === 0 ? '' : ` ${unreadCount}`;

                if (notificationButtons[index]) {
                    notificationButtons[index].title = unreadCount === 0
                        ? 'No new notifications'
                        : `You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`;
                }
            });

            if (lihatProfileButton) {
                lihatProfileButton.style.display = 'block';
            }
        }

    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}