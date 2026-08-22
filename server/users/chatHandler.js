const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateToken } = require("../commonFunctions");

// Senarai semua conversation user (untuk sidebar chat list)
router.get("/conversations", authenticateToken, async (req, res) => {
    const me = req.user.username;
    try {
        const [rows] = await db.execute(
            `SELECT c.conversationID, c.lastMessage, c.updatedAt,
                    IF(c.tenantUsername = ?, c.landlordUsername, c.tenantUsername) AS otherUsername,
                    u.full_name AS otherFullName, u.profileImg_url
             FROM conversations c
             JOIN Users u ON u.username = IF(c.tenantUsername = ?, c.landlordUsername, c.tenantUsername)
             WHERE c.tenantUsername = ? OR c.landlordUsername = ?
             ORDER BY c.updatedAt DESC`,
            [me, me, me, me]
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// History mesej dalam satu conversation
router.get("/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM messages WHERE conversationID = ? ORDER BY createdAt ASC",
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// Start / dapatkan conversation sedia ada (bila tenant klik "Chat Pemilik" kat listing)
router.post("/conversations", authenticateToken, async (req, res) => {
    const { rentID, landlordUsername } = req.body;
    const me = req.user.username;

    if (!rentID || !landlordUsername) {
        return res.status(400).json({ success: false, message: "rentID dan landlordUsername diperlukan." });
    }

    try {
        const [existing] = await db.execute(
            "SELECT * FROM conversations WHERE rentID = ? AND tenantUsername = ? AND landlordUsername = ?",
            [rentID, me, landlordUsername]
        );
        if (existing.length) return res.json(existing[0]);

        const [result] = await db.execute(
            "INSERT INTO conversations (rentID, tenantUsername, landlordUsername) VALUES (?, ?, ?)",
            [rentID, me, landlordUsername]
        );
        res.json({ conversationID: result.insertId });
    } catch (err) {
        console.error("Error creating conversation:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;