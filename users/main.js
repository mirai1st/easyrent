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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSidePanelRoleAccess();
        observeSidePanelRoleAccess();
    }, { once: true });
} else {
    initSidePanelRoleAccess();
    observeSidePanelRoleAccess();
}
