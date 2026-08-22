document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const response = await fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include", // important for cookies
        body: JSON.stringify({
            username: document.getElementById("username-login").value,
            password: document.getElementById("password-login").value
        })
    });

    const data = await response.json();

    if (data.success) {
        window.location = `/?login_success=true`;
        window.location.alert = data.message;
    } else {
        window.location = `/?login_success=false&error=${data.message}`;
    }
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const response = await fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include", // important for cookies
        body: JSON.stringify({
            username: document.getElementById("username-register").value,
            email: document.getElementById("email-register").value,
            password: document.getElementById("password-register").value,
            repeat_password: document.getElementById("repeat_password-register").value
        })
    });

    const data = await response.json();

    if (data.success) {
        window.location = "/?register_success=true";
        window.location.alert = data.message;
    } else {
        alert(data.message);
    }
});