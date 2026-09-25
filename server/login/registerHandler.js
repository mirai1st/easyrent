const bcrypt = require("bcrypt");
const pool = require("../system/db");
const crypto = require("crypto");
const { sendVerificationEmail } = require("./EmailRequest");
require("dotenv").config();

function generateVerificationCode() {
    // Generates a random 6-digit code, e.g. "042817"
    return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

// This function handle user registrations
function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

async function registerHandler(req, res) {
    try {
        const { username, email, password, repeat_password } = req.body;
        const normalizedEmail = String(email || "").trim().toLowerCase();

        if (!username || !normalizedEmail || !password || !repeat_password) {
            return res.status(400).json({ success: false, message: "Please fill all fields!" });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Kata laluan mesti sekurang-kurangnya 8 aksara, mengandungi huruf besar, huruf kecil, nombor dan simbol."
            });
        }

        if (password !== repeat_password) {
            return res.status(401).json({ success: false, message: "Passwords do not match!" });
        }

        const [existing] = await pool.query(
            "SELECT * FROM Users WHERE username = ? OR email = ?",
            [username, normalizedEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "User already exists!" });
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6 digit verification_code
        const verificationCode = generateVerificationCode();

        await pool.query(
            `INSERT INTO Users (
                username,
                email,
                password,
                is_verified,
                verification_code,
                verification_expires,
                address,
                description
            ) VALUES (?, ?, ?, 0, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), '', '')`,
            [username, normalizedEmail, hashedPassword, verificationCode]
        );

        await pool.query(`INSERT INTO notifications (username, type, title, message, is_read) VALUES (?, ?, ?, ?, 0)`, [
            username, "system", "Akaun anda telah diaktifkan!", "Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent."
        ]);

        try {
            await sendVerificationEmail(normalizedEmail, verificationCode);
        } catch (emailErr) {
            console.error("Failed to send verification email:", emailErr);
            return res.status(502).json({
                success: false,
                message: "Akaun dicipta tetapi email pengesahan gagal dihantar. Sila cuba semula sebentar lagi."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Pendaftaran berjaya! Sila semak email anda untuk kod pengesahan.",
            email: normalizedEmail
        });

    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
}

module.exports = registerHandler;
