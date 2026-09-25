const router = require("express").Router();
const bcrypt = require("bcrypt");
const db = require("./db");

let activeAdmin = null;

function serializeAdmin(row) {
    return {
        id: row.admin_id || row.id || row.username,
        name: row.full_name || row.username || row.email,
        email: row.email,
        username: row.username,
        role: "Admin",
        status: "active"
    };
}

router.post("/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email dan password diperlukan."
            });
        }

        const [rows] = await db.execute(
            "SELECT * FROM Admin WHERE email = ? OR username = ? LIMIT 1",
            [email, email]
        );

        const admin = rows && rows[0];
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin tidak dijumpai."
            });
        }

        const storedPassword = String(admin.password || "");
        const passwordMatches = storedPassword === password ||
            (storedPassword.startsWith("$") && await bcrypt.compare(password, storedPassword));

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Password tidak sah."
            });
        }

        activeAdmin = serializeAdmin(admin);

        return res.json({
            success: true,
            message: "Log masuk admin berjaya.",
            admin: activeAdmin
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({
            success: false,
            message: "Ralat server."
        });
    }
});

router.get("/admin/me", (req, res) => {
    if (!activeAdmin) {
        return res.status(401).json({
            success: false,
            message: "Sesi admin tidak aktif."
        });
    }

    return res.json({
        success: true,
        admin: activeAdmin
    });
});

router.post("/admin/logout", (req, res) => {
    activeAdmin = null;
    return res.json({
        success: true,
        message: "Log keluar admin berjaya."
    });
});

router.get("/dashboard", async (req, res) => {
    try {
        const [userRows] = await db.execute("SELECT COUNT(*) AS total FROM Users");
        const [landlordRows] = await db.execute("SELECT COUNT(*) AS total FROM Users WHERE role IN ('Tuan Rumah', 'Ejen Hartanah')");
        const [tenantRows] = await db.execute("SELECT COUNT(*) AS total FROM Users WHERE role = 'Pengguna'");
        const [propertyRows] = await db.execute("SELECT COUNT(*) AS total FROM Rent");
        const [pendingRows] = await db.execute("SELECT COUNT(*) AS total FROM Rent WHERE isAdminApprove = 'false'");
        const [approvedRows] = await db.execute("SELECT COUNT(*) AS total FROM Rent WHERE isAdminApprove = 'true'");
        const [reportRows] = await db.execute("SELECT COUNT(*) AS total FROM notifications");

        return res.json({
            users: Number(userRows[0]?.total || 0),
            landlords: Number(landlordRows[0]?.total || 0),
            tenants: Number(tenantRows[0]?.total || 0),
            properties: Number(propertyRows[0]?.total || 0),
            pending: Number(pendingRows[0]?.total || 0),
            approved: Number(approvedRows[0]?.total || 0),
            reports: Number(reportRows[0]?.total || 0)
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        return res.status(500).json({ success: false, message: "Ralat dashboard." });
    }
});

router.get("/users", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT username, full_name, email, phoneNo, role, is_verified, dateCreated
             FROM Users
             ORDER BY dateCreated DESC`
        );

        const users = rows.map(row => ({
            id: row.username,
            name: row.full_name || row.username,
            email: row.email,
            phone: row.phoneNo || '-',
            role: row.role,
            status: row.is_verified ? 'active' : 'suspended'
        }));

        return res.json(users);
    } catch (error) {
        console.error("Users fetch error:", error);
        return res.status(500).json({ success: false, message: "Gagal memuatkan pengguna." });
    }
});

router.put("/users/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const active = status === 'active';

        await db.execute(
            "UPDATE Users SET is_verified = ? WHERE username = ?",
            [active ? 1 : 0, req.params.id]
        );

        return res.json({ success: true });
    } catch (error) {
        console.error("User status update error:", error);
        return res.status(500).json({ success: false, message: "Gagal mengemaskini status pengguna." });
    }
});

router.delete("/users/:id", async (req, res) => {
    try {
        await db.execute("DELETE FROM Users WHERE username = ?", [req.params.id]);
        return res.json({ success: true });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({ success: false, message: "Gagal padam pengguna." });
    }
});

router.get("/properties", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT rentID, username, title, price, location, target_institution, isAdminApprove
             FROM Rent
             ORDER BY dateCreated DESC`
        );

        const properties = rows.map(row => ({
            id: row.rentID,
            title: row.title,
            landlord: row.username,
            price: Number(row.price || 0),
            location: row.location || '-',
            type: row.target_institution || '-',
            status: row.isAdminApprove === 'true' ? 'approved' : 'pending'
        }));

        return res.json(properties);
    } catch (error) {
        console.error("Properties fetch error:", error);
        return res.status(500).json({ success: false, message: "Gagal memuatkan rumah." });
    }
});

router.put("/properties/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const value = status === 'approved' ? 'true' : 'false';

        await db.execute(
            "UPDATE Rent SET isAdminApprove = ? WHERE rentID = ?",
            [value, req.params.id]
        );

        return res.json({ success: true });
    } catch (error) {
        console.error("Property status update error:", error);
        return res.status(500).json({ success: false, message: "Gagal mengemaskini status rumah." });
    }
});

router.delete("/properties/:id", async (req, res) => {
    try {
        await db.execute("DELETE FROM Rent WHERE rentID = ?", [req.params.id]);
        return res.json({ success: true });
    } catch (error) {
        console.error("Delete property error:", error);
        return res.status(500).json({ success: false, message: "Gagal padam rumah." });
    }
});

router.get("/reports", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT notificationID AS id, title AS subject, username AS reporter, related_id AS property_id,
                    message AS description, is_read AS readFlag
             FROM notifications
             ORDER BY created_at DESC`
        );

        return res.json(rows.map(row => ({
            id: row.id,
            subject: row.subject || 'Laporan',
            reporter: row.reporter || '-',
            property_title: row.property_id ? `Property #${row.property_id}` : '-',
            description: row.description || '-',
            status: row.readFlag === 0 ? 'new' : 'resolved'
        })));
    } catch (error) {
        console.error("Reports fetch error:", error);
        return res.status(500).json({ success: false, message: "Gagal memuatkan laporan." });
    }
});

router.put("/reports/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        await db.execute(
            "UPDATE notifications SET is_read = ? WHERE notificationID = ?",
            [status === 'resolved' ? 1 : 0, req.params.id]
        );

        return res.json({ success: true });
    } catch (error) {
        console.error("Report status update error:", error);
        return res.status(500).json({ success: false, message: "Gagal mengemaskini laporan." });
    }
});

router.get("/categories", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT DISTINCT target_institution AS name FROM Rent WHERE target_institution IS NOT NULL AND target_institution <> '' ORDER BY target_institution"
        );

        return res.json(rows.map((row, idx) => ({ id: idx + 1, name: row.name })));
    } catch (error) {
        console.error("Categories fetch error:", error);
        return res.status(500).json({ success: false, message: "Gagal memuatkan kategori." });
    }
});

router.post("/categories", async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Nama kategori diperlukan." });
    }

    return res.json({ success: true, category: { id: Date.now(), name: name.trim() } });
});

router.delete("/categories/:id", async (req, res) => {
    return res.json({ success: true });
});

router.get("/locations", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT DISTINCT location AS name FROM Rent WHERE location IS NOT NULL AND location <> '' ORDER BY location"
        );

        return res.json(rows.map((row, idx) => ({ id: idx + 1, name: row.name })));
    } catch (error) {
        console.error("Locations fetch error:", error);
        return res.status(500).json({ success: false, message: "Gagal memuatkan lokasi." });
    }
});

router.post("/locations", async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Nama lokasi diperlukan." });
    }

    return res.json({ success: true, location: { id: Date.now(), name: name.trim() } });
});

router.delete("/locations/:id", async (req, res) => {
    return res.json({ success: true });
});

router.get("/messages", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT m.message_id AS id, m.sender, m.message, m.sent_at, c.user1, c.user2
             FROM message m
             LEFT JOIN conversation c ON c.conversation_id = m.conversation_id
             ORDER BY m.sent_at DESC`
        );

        const messages = rows.map(row => ({
            id: row.id,
            sender: row.sender,
            receiver: row.sender === row.user1 ? row.user2 : row.user1,
            message: row.message,
            created_at: row.sent_at
        }));

        return res.json(messages);
    } catch (error) {
        console.error("Messages fetch error:", error);
        return res.status(500).json({ success: false, message: "Gagal memuatkan mesej." });
    }
});

router.get("/admins", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT username, email FROM Admin ORDER BY username ASC"
        );

        return res.json(rows.map((row, idx) => ({
            id: idx + 1,
            name: row.username,
            email: row.email,
            role: "Admin",
            status: "active"
        })));
    } catch (error) {
        console.error("Admins fetch error:", error);
        return res.status(500).json({ success: false, message: "Gagal memuatkan admin." });
    }
});

router.get("/settings", async (req, res) => {
    return res.json([]);
});

router.put("/settings/:key", async (req, res) => {
    return res.json({ success: true });
});

module.exports = router;