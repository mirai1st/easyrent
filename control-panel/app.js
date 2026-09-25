const $ = id => document.getElementById(id);
const content = $("content");

const icons = {
    pause: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`,
    sort: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 3"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};

async function api(url, options = {}) {
    try {
        const isJsonBody = options.body && typeof options.body === "string";
        const res = await fetch(url, {
            headers: isJsonBody ? { "Content-Type": "application/json" } : {},
            ...options
        });

        if (res.status === 401) {
            showLogin();
            throw new Error("Unauthorized");
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Ralat");
        return data;
    } catch (err) {
        if (url.startsWith("/api/")) {
            return null;
        }
        throw err;
    }
}

function formatCurrency(value) {
    const num = Number(value || 0);
    return new Intl.NumberFormat("ms-MY", {
        style: "currency",
        currency: "MYR",
        maximumFractionDigits: 0
    }).format(num);
}

function renderStatusPill(value, labelOverride = null) {
    const normalized = String(value || "").toLowerCase();
    const label = labelOverride || (
        normalized.includes("approved") ? "Approved" :
            normalized.includes("active") || normalized.includes("verified") ? "Verified" :
                normalized.includes("pending") || normalized.includes("new") ? "Pending" :
                    "Suspended"
    );

    if (["active", "approved", "verified", "resolved"].some(item => normalized.includes(item))) {
        return `<span class="pill green">${label}</span>`;
    }

    if (["pending", "new"].some(item => normalized.includes(item))) {
        return `<span class="pill yellow">${label}</span>`;
    }

    return `<span class="pill red">${label}</span>`;
}

function bindActionButtons() {
    document.querySelectorAll("[data-action='delete-user']").forEach(button => {
        button.addEventListener("click", async () => {
            const { id } = button.dataset;
            if (!confirm("Padam pengguna ini?")) return;

            await api(`/api/users/${encodeURIComponent(id)}`, { method: "DELETE" });
            await loadPage("users");
        });
    });


    // To suspend user accounts
    document.querySelectorAll("[data-action='toggle-user-status'], [data-action='suspend-user']").forEach(button => {
        button.addEventListener("click", async () => {
            const { id, status } = button.dataset;
            const normalized = String(status || "").toLowerCase();
            const nextStatus = normalized === "active" || normalized === "1" ? "suspended" : "active";

            await api(`/api/users/${encodeURIComponent(id)}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: nextStatus })
            });

            await loadPage("users");
        });
    });

    document.querySelectorAll("[data-action='toggle-property-status']").forEach(button => {
        button.addEventListener("click", async () => {
            const { id, status } = button.dataset;
            const nextStatus = status === "approved" ? "pending" : "approved";

            await api(`/api/properties/${encodeURIComponent(id)}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: nextStatus })
            });

            await loadPage("properties");
        });
    });

    document.querySelectorAll("[data-action='delete-property']").forEach(button => {
        button.addEventListener("click", async () => {
            const { id } = button.dataset;
            if (!confirm("Padam rumah ini?")) return;

            await api(`/api/properties/${encodeURIComponent(id)}`, { method: "DELETE" });
            await loadPage("properties");
        });
    });

    document.querySelectorAll("[data-action='approve-property']").forEach(button => {
        button.addEventListener("click", async () => {
            const { id } = button.dataset;
            await api(`/api/properties/${encodeURIComponent(id)}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: "approved" })
            });

            await loadPage("approvals");
        });
    });
}

function showLogin() {
    $("loginPage").classList.remove("hidden");
    $("app").classList.add("hidden");
}

function showApp(admin) {
    $("loginPage").classList.add("hidden");
    $("app").classList.remove("hidden");
    $("adminName").textContent = admin?.name || "admin@easyrent.com";
}

function setActiveNav(page) {
    document.querySelectorAll(".nav").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === page);
    });
}

$("loginForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    try {
        const data = await api("/api/admin/login", {
            method: "POST",
            body: JSON.stringify({
                email: $("email").value,
                password: $("password").value
            })
        });

        if (data?.admin) {
            showApp(data.admin);
            loadPage("dashboard");
        } else {
            $("loginError").textContent = "Login gagal.";
        }
    } catch (err) {
        $("loginError").textContent = err.message;
    }
});

$("logoutBtn")?.addEventListener("click", async () => {
    try {
        await api("/api/admin/logout", { method: "POST" });
    } catch (err) {
        // ignore logout failures for UI preview
    }

    showLogin();
});

document.querySelectorAll(".nav").forEach(btn => {
    btn.addEventListener("click", () => {
        setActiveNav(btn.dataset.page);
        loadPage(btn.dataset.page);
    });
});

async function loadPage(page) {
    const pageMap = {
        dashboard,
        users,
        properties,
        approvals,
        notifications,
        admins,
        about
    };

    const handler = pageMap[page] || dashboard;
    try {
        await handler();
    } catch (e) {
        content.innerHTML = `<div class="panel"><p>${e.message || "Something went wrong."}</p></div>`;
    }
}

async function dashboard() {
    const data = await api("/api/dashboard") || {};
    const dashboardStats = [
        { label: "Users", value: data.users ?? 0 },
        { label: "Landlord", value: data.landlords ?? 0 },
        { label: "Total Properties", value: data.properties ?? 0 },
        { label: "Pending Approval", value: data.pending ?? 0 },
        { label: "Approved", value: data.approved ?? 0 }
    ];

    content.innerHTML = `
    <h2 class="page-title">Dashboard</h2>
    <div class="dashboard-grid">
      ${dashboardStats.map(item => `
        <div class="stat-card">
          <span class="label">${item.label}</span>
          <span class="value">${item.value}</span><span class="trend">↑</span>
        </div>
      `).join("")}
    </div>
    <h3 class="section-title">System Overview</h3>
    <div class="empty-panel">${data.reports ?? 0} report(s) captured in database.</div>
  `;
}

async function users() {
    const users = await api("/api/users") || [];

    content.innerHTML = `
    <h2 class="page-title">All Users</h2>
    <div class="table-panel">
      <table>
        <thead>
          <tr>
            <th>Index</th>
            <th>Username</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th><span class="th-sort">Date ${icons.sort}</span></th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((row, index) => {
        const status = row.status === "active" ? "active" : "suspended";
        return `
              <tr>
                <td>${index + 1}</td>
                <td>@${row.id || row.username || "-"}</td>
                <td>${row.name || "-"}</td>
                <td>${row.email || "-"}</td>
                <td>${row.phone || "-"}</td>
                <td>${row.role || "-"}</td>
                <td>${new Date().toISOString().slice(0, 10)}</td>
                <td>${renderStatusPill(status, status === "active" ? "Verified" : "Suspended")}</td>
                <td>
                  <div class="action-buttons">
                    <button class="action-btn pause" title="${status === "active" ? "Suspend" : "Activate"}" data-action="toggle-user-status" data-id="${row.id}" data-status="${status}">${icons.pause}</button>
                    <button class="action-btn delete" title="Delete" data-action="delete-user" data-id="${row.id}">${icons.trash}</button>
                  </div>
                </td>
              </tr>
            `;
    }).join("")}
        </tbody>
      </table>
    </div>
  `;

    bindActionButtons();
}

async function properties() {
    const properties = await api("/api/properties") || [];

    content.innerHTML = `
    <h2 class="page-title">Properties</h2>
    <div class="table-panel">
      <table>
        <thead>
            <tr>
                <th>Index</th>
                <th>ID</th>
                <th>Title</th>
                <th>Landlord</th>
                <th>Price</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
          ${properties.map((property,index) => `
            <tr">
                <td>${index}</td>
                <td>${property.id}</td>
                <td>${property.title || "-"}</td>
                <td>${property.landlord || "-"}</td>
                <td>${formatCurrency(property.price)}</td>
                <td>${property.location || "-"}</td>
                <td>${property.type || "-"}</td>
                <td>${renderStatusPill(property.status, property.status === "approved" ? "Approved" : "Pending")}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="View this property" data-action="view-property" onclick="window.open('/house/?id=${property.id}', '_blank')" data-id="${property.id}">${icons.info}</button>
                        <button class="action-btn pause" title="${property.status === "approved" ? "Set pending" : "Approve"}" data-action="toggle-property-status" data-id="${property.id}" data-status="${property.status}">${property.status === "approved" ? icons.pause : icons.check}</button>
                        <button class="action-btn delete" title="Delete" data-action="delete-property" data-id="${property.id}">${icons.trash}</button>
                    </div>
                </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

    bindActionButtons();
}

async function approvals() {
    const properties = await api("/api/properties") || [];
    const pending = properties.filter(item => String(item.status).toLowerCase() !== "approved");

    content.innerHTML = `
    <h2 class="page-title">Approval</h2>
    <div class="table-panel">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Landlord</th>
            <th>Property</th>
            <th>Price</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${pending.length ? pending.map(item => `
            <tr>
              <td>${item.id}</td>
              <td>${item.landlord || "-"}</td>
              <td>${item.title || "-"}</td>
              <td>${formatCurrency(item.price)}</td>
              <td>${renderStatusPill(item.status, "Pending")}</td>
              <td>
                <button class="action-btn pause" title="Approve" data-action="approve-property" data-id="${item.id}">${icons.check}</button>
              </td>
            </tr>
          `).join("") : `<tr><td colspan="6">Tiada permohonan menunggu kelulusan.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

    bindActionButtons();
}

async function notifications() {
    const reports = await api("/api/reports") || [];

    content.innerHTML = `
    <h2 class="page-title">Notifications</h2>
    <div class="table-panel">
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Reporter</th>
            <th>Property</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${reports.length ? reports.map(item => `
            <tr>
              <td>${item.subject || "-"}</td>
              <td>${item.reporter || "-"}</td>
              <td>${item.property_title || "-"}</td>
              <td>${item.description || "-"}</td>
              <td>${renderStatusPill(item.status, item.status === "resolved" ? "Read" : "Unread")}</td>
            </tr>
          `).join("") : `<tr><td colspan="5">Tiada notifikasi.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

async function admins() {
    const admins = await api("/api/admins") || [];

    content.innerHTML = `
    <h2 class="page-title">Admin Accounts</h2>
    <div class="table-panel">
      <table>
        <thead>
          <tr>
            <th>Index</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${admins.map((admin, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${admin.name || "-"}</td>
              <td>${admin.email || "-"}</td>
              <td>${admin.role || "Admin"}</td>
              <td>${renderStatusPill(admin.status, "Verified")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function about() {
    content.innerHTML = `
    <h2 class="page-title">About</h2>
    <div class="panel">
      <h3>EasyRent Admin Control</h3>
      <p>Panel ini disambungkan ke data sebenar dari database melalui endpoint API server.</p>
    </div>
  `;
}

(async () => {
    showLogin();
    setActiveNav("dashboard");
})();