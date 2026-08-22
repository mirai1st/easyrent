const bcrypt = require("bcrypt");
const pool = require("./db");
require("dotenv").config();

async function registerHandler(req, res) {
    try {
        const { username, email, password, repeat_password } = req.body;

        if (!username || !email || !password || !repeat_password) {
            return res.status(400).json({ success: false, message: "Please fill all fields!" });
        }

        if (password !== repeat_password) {
            return res.status(401).json({ success: false, message: "Passwords do not match!" });
        }

        const [existing] = await pool.query(
            "SELECT * FROM Users WHERE username = ? OR email = ?",
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "User already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO Users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );

        await pool.query(`INSERT INTO notifications (username, type, title, message, is_read) VALUES (?, ?, ?, ?, 0)`, [
            username, "system", "Akaun anda telah diaktifkan!", "Terima kasih kerana menggunakan perkhidmatan EasyRent."
        ]);

        return res.status(201).json({ success: true, message: "Registration successful! Please log in back again to continue." });

    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
}

module.exports = registerHandler;