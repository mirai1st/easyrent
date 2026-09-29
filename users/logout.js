document.querySelectorAll(".btn-logout").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        alertbox("Anda pasti untuk melog keluar akaun ini?", logoutUser);
    });
});

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