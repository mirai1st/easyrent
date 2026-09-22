const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../system/db");
const crypto = require('crypto');
require("dotenv").config();

async function loginHandler(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password are required." });
        }

        const [rows] = await pool.query(
            "SELECT * FROM Users WHERE username = ? OR email = ?",
            [username, username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid username or password." });
        }

        const user = rows[0];

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ success: false, message: "Invalid username or password." });
        }

        if (!user.is_verified) {
            return res.status(403).json({
                success: false,
                message: "Akaun anda belum disahkan. Sila sahkan email anda.",
                needsVerification: true,
                email: user.email
            });
        }

        const sessionId = generateSessionId();

        const token = jwt.sign(
            {
                username: user.username,
                sessionId: sessionId
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        });

        return res.json({ success: true, message: "Logged in successfully.", sessionId: sessionId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = loginHandler;