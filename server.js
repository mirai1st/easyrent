// Common Libraries
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");
const bcrypt = require("bcrypt");

// System Libraries
const db = require("./server/system/db");
const upload = require("./server/system/uploadConfig");
const initSocket = require("./server/system/socket");
const { authenticateToken } = require("./server/system/common");
const houseHandler = require("./server/system/houseHandler");

// Users Libraries
const chatRouter = require("./server/users/chat");
const userHandler = require("./server/users/user");
const notiHandler = require("./server/users/notifications");
const favHandler = require("./server/users/favourite");
const spHandler = require("./server/users/sp")

// Login/Register Handler
const loginHandler = require("./server/login/loginHandler");
const registerHandler = require("./server/login/registerHandler");
const { verifyCode, resendCode } = require("./server/login/verifyHandler");

// -----------------------------------------------------------------------------

const app = express();
let activeAdmin = null;

function serializeAdmin(row) {
    return {
        id: row.username,
        name: row.username || row.email,
        email: row.email,
        username: row.username,
        role: "Admin",
        status: "active"
    };
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            "http://localhost:4000",
            "http://127.0.0.1:4000",
            "null"
        ];

        if (!origin || allowedOrigins.includes(origin) || origin.startsWith("file://")) {
            callback(null, true);
            return;
        }

        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.static(path.join(__dirname)));

// Login/Register Handler ------------------------------------------------------

app.post("/api/login", loginHandler); // For handling login
app.post("/api/register", registerHandler); // For handling register
app.post("/api/verify-code", verifyCode); // For confirming the 6-digit email code
app.post("/api/resend-code", resendCode); // For resending the 6-digit email code

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email dan password diperlukan." });
        }

        const [rows] = await db.execute(
            "SELECT * FROM Admin WHERE email = ? OR username = ? LIMIT 1",
            [email, email]
        );

        if (!rows[0]) {
            return res.status(401).json({ success: false, message: "Admin tidak dijumpai." });
        }

        const admin = rows[0];
        const passwordMatches = admin.password === password || await bcrypt.compare(password, admin.password);

        if (!passwordMatches) {
            return res.status(401).json({ success: false, message: "Password tidak sah." });
        }

        activeAdmin = serializeAdmin(admin);

        return res.json({
            success: true,
            message: "Log masuk admin berjaya.",
            admin: activeAdmin
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({ success: false, message: "Ralat server." });
    }
});

app.get("/api/admin/me", (req, res) => {
    if (!activeAdmin) {
        return res.status(401).json({ success: false, message: "Sesi admin tidak aktif." });
    }

    return res.json({ success: true, admin: activeAdmin });
});

app.post("/api/admin/logout", (req, res) => {
    activeAdmin = null;
    return res.json({ success: true, message: "Log keluar admin berjaya." });
});

// User ------------------------------------------------------------------------

// This get the user info
app.get("/api/me", authenticateToken, userHandler.getProfile);
// This handles when the user wants to log out 
app.post("/api/logout", userHandler.userLogout);
// This handle when user want to update the profile.
app.post("/api/update-profile", authenticateToken, upload.uploadProfile.single("images"), userHandler.updateProfile);
// This handle when user want to delete the account
app.delete("/api/delete-account", authenticateToken, userHandler.userAccountDeletion);
// This handle when user want to update their account profile
app.post("/api/users/update-profile", authenticateToken, upload.uploadProfile.single("profileImage"), userHandler.updateProfile);
// public profile view
app.get("/api/users/user", userHandler.getPublicProfile);

// User Notifications ----------------------------------------------------------

// This get the unread notifications
app.get("/api/notifications/unread", authenticateToken, notiHandler.getUnreadNotifications);
// This for handling user notifications
app.get("/api/notifications", authenticateToken, notiHandler.getNotification);
// Set is_read = 1 when users read the notification
app.patch("/api/notifications/:id/read", authenticateToken, notiHandler.setIsRead);
// Set is_read = 1 when users read the notification
app.patch("/api/notifications/mark-all-read", authenticateToken, notiHandler.markAllRead);


// User Favourite --------------------------------------------------------------

// This get the user favourite list (?type=house or ?type=community) with the tab counts
app.get("/api/favourite/get", authenticateToken, favHandler.getFavourites);
// This get only the favourite ids, to fill the heart icons on house/post cards
app.get("/api/favourite/ids", authenticateToken, favHandler.getFavouriteIds);
// This add the post to favourite, or remove it if it is already there
app.post("/api/favourite/toggle", authenticateToken, favHandler.toggleFavourite);


// House Fetch -----------------------------------------------------------------

// Fetch approved house listings using search and filter query parameters.
app.get("/api/house/fetch", houseHandler.fetchHouses);
app.get("/api/house/detail", houseHandler.fetchHouseById);

// Chat Handler ----------------------------------------------------------------

app.use("/api/v1/chat", chatRouter);

// Recommendation Handler ------------------------------------------------------

app.get("/api/recommendations", houseHandler.getRecommendations); // For getting the recommendations from the database

// Sudut pelajar ---------------------------------------------------------------

// This fetch list of post
app.get("/api/v1/sp/fetch", spHandler.fetchPost);
// This send user post
app.post("/api/v1/sp/insert", authenticateToken, upload.uploadSP.array("imgFile", 5), spHandler.insertPost);
// This handle delete post
app.delete("/api/v1/sp/delete/:spID", authenticateToken, spHandler.deletePost);
// This handle liking post
app.post("/api/v1/sp/like/:spID", authenticateToken, spHandler.likePost);
// Add this line in server.js
app.get("/api/v1/sp/likes", authenticateToken, spHandler.getLikedPosts);
// This handle post user comments
app.post("/api/v1/sp/posts/:spID/comments", authenticateToken, spHandler.replyPost);
// This handle fetch comments
app.get("/api/v1/sp/posts/:spID/comments", spHandler.fetchPostReply);
// This handle delete comments
app.delete("/api/v1/sp/posts/delete/:commentId", authenticateToken, spHandler.deletePostReply);


// Search handler --------------------------------------------------------------


// Backend Inserter ------------------------------------------------------------

// Ini untuk post data and image into rent table
app.post( "/api/rent", authenticateToken, upload.uploadHouse.array("images", 5), houseHandler.postHandler);


// Admin dashboard compatibility -------------------------------------------------

app.get("/api/dashboard", async (req, res) => {
    try {
        const [userRows] = await db.execute("SELECT COUNT(*) AS total FROM Users");
        const [landlordRows] = await db.execute("SELECT COUNT(*) AS total FROM Users WHERE role IN ('Tuan Rumah', 'Ejen Hartanah')");
        const [tenantRows] = await db.execute("SELECT COUNT(*) AS total FROM Users WHERE role = 'Pengguna'");
        const [propertyRows] = await db.execute("SELECT COUNT(*) AS total FROM Rent");
        const [pendingRows] = await db.execute("SELECT COUNT(*) AS total FROM Rent WHERE isAdminApprove = 'false'");
        const [approvedRows] = await db.execute("SELECT COUNT(*) AS total FROM Rent WHERE isAdminApprove = 'true'");
        const [reportRows] = await db.execute("SELECT COUNT(*) AS total FROM notifications");

        res.json({
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
        res.status(500).json({ success: false, message: "Ralat dashboard." });
    }
});

app.get("/api/users", async (req, res) => {
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

        res.json(users);
    } catch (error) {
        console.error("Users fetch error:", error);
        res.status(500).json({ success: false, message: "Gagal memuatkan pengguna." });
    }
});

app.put("/api/users/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const active = status === 'active';

        await db.execute(
            "UPDATE Users SET is_verified = ? WHERE username = ?",
            [active ? 1 : 0, req.params.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("User status update error:", error);
        res.status(500).json({ success: false, message: "Gagal mengemaskini status pengguna." });
    }
});

app.delete("/api/users/:id", async (req, res) => {
    try {
        await db.execute("DELETE FROM Users WHERE username = ?", [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ success: false, message: "Gagal padam pengguna." });
    }
});

app.get("/api/properties", async (req, res) => {
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

        res.json(properties);
    } catch (error) {
        console.error("Properties fetch error:", error);
        res.status(500).json({ success: false, message: "Gagal memuatkan rumah." });
    }
});

app.put("/api/properties/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const value = status === 'approved' ? 'true' : 'false';

        await db.execute(
            "UPDATE Rent SET isAdminApprove = ? WHERE rentID = ?",
            [value, req.params.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Property status update error:", error);
        res.status(500).json({ success: false, message: "Gagal mengemaskini status rumah." });
    }
});

app.delete("/api/properties/:id", async (req, res) => {
    try {
        await db.execute("DELETE FROM Rent WHERE rentID = ?", [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete property error:", error);
        res.status(500).json({ success: false, message: "Gagal padam rumah." });
    }
});

app.get("/api/reports", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT notificationID AS id, title AS subject, username AS reporter, related_id AS property_id,
                    message AS description, is_read AS readFlag
             FROM notifications
             ORDER BY created_at DESC`
        );

        res.json(rows.map(row => ({
            id: row.id,
            subject: row.subject || 'Laporan',
            reporter: row.reporter || '-',
            property_title: row.property_id ? `Property #${row.property_id}` : '-',
            description: row.description || '-',
            status: row.readFlag === 0 ? 'new' : 'resolved'
        })));
    } catch (error) {
        console.error("Reports fetch error:", error);
        res.status(500).json({ success: false, message: "Gagal memuatkan laporan." });
    }
});

app.put("/api/reports/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        await db.execute(
            "UPDATE notifications SET is_read = ? WHERE notificationID = ?",
            [status === 'resolved' ? 1 : 0, req.params.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Report status update error:", error);
        res.status(500).json({ success: false, message: "Gagal mengemaskini laporan." });
    }
});

app.get("/api/categories", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT DISTINCT target_institution AS name FROM Rent WHERE target_institution IS NOT NULL AND target_institution <> '' ORDER BY target_institution"
        );

        res.json(rows.map((row, idx) => ({ id: idx + 1, name: row.name })));
    } catch (error) {
        console.error("Categories fetch error:", error);
        res.status(500).json({ success: false, message: "Gagal memuatkan kategori." });
    }
});

app.post("/api/categories", async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Nama kategori diperlukan." });
    }

    return res.json({ success: true, category: { id: Date.now(), name: name.trim() } });
});

app.delete("/api/categories/:id", async (req, res) => {
    res.json({ success: true });
});

app.get("/api/locations", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT DISTINCT location AS name FROM Rent WHERE location IS NOT NULL AND location <> '' ORDER BY location"
        );

        res.json(rows.map((row, idx) => ({ id: idx + 1, name: row.name })));
    } catch (error) {
        console.error("Locations fetch error:", error);
        res.status(500).json({ success: false, message: "Gagal memuatkan lokasi." });
    }
});

app.post("/api/locations", async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Nama lokasi diperlukan." });
    }

    return res.json({ success: true, location: { id: Date.now(), name: name.trim() } });
});

app.delete("/api/locations/:id", async (req, res) => {
    res.json({ success: true });
});

app.get("/api/messages", async (req, res) => {
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

        res.json(messages);
    } catch (error) {
        console.error("Messages fetch error:", error);
        res.status(500).json({ success: false, message: "Gagal memuatkan mesej." });
    }
});

app.get("/api/admins", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT username, email FROM Admin ORDER BY username ASC"
        );

        res.json(rows.map((row, idx) => ({
            id: idx + 1,
            name: row.username,
            email: row.email,
            role: "Admin",
            status: "active"
        })));
    } catch (error) {
        console.error("Admins fetch error:", error);
        res.status(500).json({ success: false, message: "Gagal memuatkan admin." });
    }
});

app.get("/api/settings", async (req, res) => {
    res.json([]);
});

app.put("/api/settings/:key", async (req, res) => {
    res.json({ success: true });
});

// -----------------------------------------------------------------------------

// Socket.IO attach to HTTP
const server = http.createServer(app);
const io = initSocket(server);
app.set("io", io);

server.listen(4000, "0.0.0.0", () =>
  console.log("Server running on port 4000"),
);

// -----------------------------------------------------------------------------

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});