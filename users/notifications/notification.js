document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.notif-tab');
    const emptyState = document.querySelector('.notification-empty');
    const notifList = document.querySelector('.notification-list');
    const markAllBtn = document.querySelector('.notif-mark-all');
    const unreadCountEl = document.querySelector('.notif-tab-count');

    const modalOverlay = document.querySelector('.notif-modal-overlay');
    const modal = document.querySelector('.notif-modal');
    const modalCloseBtn = document.querySelector('.notif-modal-close-btn');
    const modalIcon = document.querySelector('.notif-modal-icon');
    const modalTime = document.querySelector('.notif-modal-time');
    const modalText = document.querySelector('.notif-modal-text');
    const modalActionBtn = document.querySelector('.notif-modal-action-btn');

    let items = [];

    const iconStyleByType = {
        rent: { bg: '#3f8f5b1f', color: '#3f8f5b' },
        message: { bg: '#52341d1f', color: '#52341D' },
        community: { bg: '#d7b96c33', color: '#a4832f' },
        system: { bg: '#4a72ad1f', color: '#3a5f91' }
    };

    function getNotificationIcon(type) {
        const icons = {
            rent: 'fa-house-circle-check',
            message: 'fa-message',
            community: 'fa-comment',
            system: 'fa-circle-info'
        };
        return icons[type] || 'fa-circle-info';
    }

    function getNotificationLink(type, relatedId) {
        if (!relatedId) return '';

        switch (type) {
            case 'rent':
                return `/users/tempahan/${relatedId}`;
            case 'message':
                return `/users/message/${relatedId}`;
            case 'community':
                return `/sudut-pelajar/post/${relatedId}`;
            default:
                return '';
        }
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();

        if (isNaN(date.getTime())) return '';

        const difference = Math.floor((now - date) / 1000);

        if (difference < 60) return 'Baru sahaja';

        const minutes = Math.floor(difference / 60);
        if (minutes < 60) return `${minutes} minit lalu`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} jam lalu`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} hari lalu`;

        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} minggu lalu`;

        return date.toLocaleDateString('ms-MY', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function getDateLabel(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();

        if (isNaN(date.getTime())) return 'Lain-lain';

        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const notificationDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

        const difference = Math.floor(
            (today - notificationDate) / (1000 * 60 * 60 * 24)
        );

        if (difference === 0) return 'Hari Ini';
        if (difference === 1) return 'Semalam';
        if (difference <= 7) return 'Minggu Ini';

        return 'Minggu Lepas';
    }

    function updateUnreadCount() {
        const unreadCount = document.querySelectorAll(
            '.notification-item.unread'
        ).length;

        if (unreadCountEl) {
            unreadCountEl.textContent = unreadCount;
        }
    }

    function renderNotifications(notifications) {
        if (!notifList) return;

        notifList.innerHTML = '';

        if (!notifications || notifications.length === 0) {
            notifList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            updateUnreadCount();
            return;
        }

        notifList.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';

        let currentGroup = '';

        notifications.forEach(notification => {
            const group = getDateLabel(notification.created_at);

            if (group !== currentGroup) {
                currentGroup = group;

                const groupElement = document.createElement('div');
                groupElement.className = 'notification-group-label';
                groupElement.textContent = group;
                notifList.appendChild(groupElement);
            }

            const isUnread = Number(notification.is_read) === 0;
            const item = document.createElement('div');

            item.className = `notification-item${isUnread ? ' unread' : ''}`;
            item.dataset.id = notification.notificationID;
            item.dataset.type = notification.type || 'system';
            item.dataset.icon = getNotificationIcon(notification.type);
            item.dataset.link = getNotificationLink(
                notification.type,
                notification.related_id
            );
            item.dataset.action = notification.related_id
                ? 'Lihat Butiran'
                : '';

            const iconContainer = document.createElement('div');
            iconContainer.className =
                `notif-icon notif-icon-${notification.type}`;

            const icon = document.createElement('i');
            icon.className =
                `fa-solid ${getNotificationIcon(notification.type)}`;

            iconContainer.appendChild(icon);

            const body = document.createElement('div');
            body.className = 'notif-body';

            const text = document.createElement('p');
            text.className = 'notif-text';

            const title = document.createElement('strong');
            title.textContent = notification.title || 'Notifikasi';

            const message = document.createTextNode(
                notification.title
                    ? ` — ${notification.message || ''}`
                    : notification.message || ''
            );

            text.appendChild(title);
            text.appendChild(message);

            const time = document.createElement('span');
            time.className = 'notif-time';
            time.textContent = formatTime(notification.created_at);

            body.appendChild(text);
            body.appendChild(time);

            item.appendChild(iconContainer);
            item.appendChild(body);

            if (isUnread) {
                const dot = document.createElement('span');
                dot.className = 'notif-dot';
                item.appendChild(dot);
            }

            notifList.appendChild(item);
        });

        items = document.querySelectorAll('.notification-item');
        attachNotificationEvents();
        updateUnreadCount();

        const activeTab = document.querySelector('.notif-tab.active');
        if (activeTab) applyFilter(activeTab.dataset.filter);
    }

    async function getNotification() {
        try {
            const response = await fetch('/api/notifications', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.status === 401) {
                renderNotifications([]);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const notifications = await response.json();
            renderNotifications(notifications);
        } catch (error) {
            console.error('Gagal mendapatkan notifications:', error);
        }
    }

    function applyFilter(filter) {
        let visibleCount = 0;

        items.forEach(item => {
            const isUnread = item.classList.contains('unread');
            const shouldShow =
                filter === 'all' ||
                (filter === 'unread' && isUnread);

            item.style.display = shouldShow ? 'flex' : 'none';

            if (shouldShow) visibleCount++;
        });

        const groupLabels = document.querySelectorAll(
            '.notification-group-label'
        );

        groupLabels.forEach(label => {
            let next = label.nextElementSibling;
            let hasVisible = false;

            while (
                next &&
                !next.classList.contains('notification-group-label')
            ) {
                if (
                    next.classList.contains('notification-item') &&
                    next.style.display !== 'none'
                ) {
                    hasVisible = true;
                    break;
                }

                next = next.nextElementSibling;
            }

            label.style.display = hasVisible ? 'block' : 'none';
        });

        if (notifList) {
            notifList.style.display =
                visibleCount === 0 ? 'none' : 'flex';
        }

        if (emptyState) {
            emptyState.style.display =
                visibleCount === 0 ? 'flex' : 'none';
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            applyFilter(tab.dataset.filter);
        });
    });

    async function openNotifModal(item) {
        const type = item.dataset.type;
        const iconClass = item.dataset.icon;
        const link = item.dataset.link;
        const actionLabel = item.dataset.action;

        const textElement = item.querySelector('.notif-text');
        const timeElement = item.querySelector('.notif-time');

        if (!textElement || !timeElement) return;

        modalText.innerHTML = textElement.innerHTML;
        modalTime.textContent = timeElement.textContent;

        modalIcon.innerHTML =
            `<i class="fa-solid ${iconClass}"></i>`;

        const style =
            iconStyleByType[type] || iconStyleByType.system;

        modalIcon.style.backgroundColor = style.bg;
        modalIcon.style.color = style.color;

        if (link && actionLabel) {
            modalActionBtn.style.display = 'inline-block';
            modalActionBtn.textContent = actionLabel;
            modalActionBtn.href = link;
        } else {
            modalActionBtn.style.display = 'none';
            modalActionBtn.removeAttribute('href');
        }

        modalOverlay.classList.add('active');
        modal.classList.add('active');

        if (item.classList.contains('unread')) {
            item.classList.remove('unread');

            const dot = item.querySelector('.notif-dot');
            if (dot) dot.remove();

            updateUnreadCount();

            await markNotificationAsRead(item.dataset.id);
        }
    }

    async function markNotificationAsRead(notificationID) {
        try {
            const response = await fetch(
                `/api/notifications/${notificationID}/read`,
                {
                    method: 'PATCH',
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
        } catch (error) {
            console.error(
                'Gagal mark notification as read:',
                error
            );
        }
    }

    async function markAllAsRead() {
        try {
            const response = await fetch('/api/notifications/mark-all-read',
                {
                    method: 'PATCH',
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            items.forEach(item => {
                item.classList.remove('unread');

                const dot = item.querySelector('.notif-dot');
                if (dot) dot.remove();
            });

            updateUnreadCount();
        } catch (error) {
            console.error(
                'Gagal mark semua notification:',
                error
            );
        }
    }

    function attachNotificationEvents() {
        items = document.querySelectorAll('.notification-item');

        items.forEach(item => {
            item.addEventListener('click', () => {
                openNotifModal(item);
            });
        });
    }

    function closeNotifModal() {
        modalOverlay.classList.remove('active');
        modal.classList.remove('active');
    }

    if (modalOverlay) {
        modalOverlay.addEventListener(
            'click',
            closeNotifModal
        );
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener(
            'click',
            closeNotifModal
        );
    }

    if (markAllBtn) {
        markAllBtn.addEventListener(
            'click',
            markAllAsRead
        );
    }

    loadUser((user, error) => {
        if (error) {
            return;
        }
    })

    getNotification();
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