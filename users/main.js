async function initSidePanelRoleAccess() {
    const allowedRoles = ["Tuan Rumah", "Ejen Hartanah", "Admin"];
    const buttons = document.querySelectorAll('.button-user-house');

    if (!buttons.length) return;

    const { user, error } = await loadUser();
    const isAllowed = !error && user && allowedRoles.includes(user.role);

    buttons.forEach((button) => {
        button.style.display = isAllowed ? "flex" : "none";
    });
}

function observeSidePanelRoleAccess() {
    const targetNode = document.body;

    if (!targetNode) return;

    const observer = new MutationObserver(() => {
        if (document.querySelector('.button-user-house')) {
            initSidePanelRoleAccess();
        }
    });

    observer.observe(targetNode, {
        childList: true,
        subtree: true
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSidePanelRoleAccess();
        observeSidePanelRoleAccess();
    }, { once: true });
} else {
    initSidePanelRoleAccess();
    observeSidePanelRoleAccess();
}


// ===== Alert box (element dicari setiap kali supaya boleh dibuka berkali-kali) =====

function closeAlertBox() {
    document.querySelector(".alert-box").classList.remove("enabled");
    document.querySelector(".alertbox-overlay").classList.remove("enabled");
}

function alertbox(message, callback = null) {
    const alertBox = document.querySelector(".alert-box");
    const overlay = document.querySelector(".alertbox-overlay");
    const yes = document.querySelector(".yes-alert-box");
    const no = document.querySelector(".no-alert-box");

    alertBox.classList.add("enabled");
    overlay.classList.add("enabled");
    document.querySelector(".alertbox-message").textContent = message;

    // clone nodes to strip old listeners, avoid stacking
    const newYes = yes.cloneNode(true);
    yes.replaceWith(newYes);

    const newNo = no.cloneNode(true);
    no.replaceWith(newNo);

    newYes.addEventListener("click", () => {
        closeAlertBox();
        if (callback) callback();
    });

    newNo.addEventListener("click", closeAlertBox);
    overlay.onclick = closeAlertBox;
}

