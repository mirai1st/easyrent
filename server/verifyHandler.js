const pool = require("./db");
const crypto = require("crypto");
const { sendVerificationEmail } = require("./EmailRequest");

function generateVerificationCode() {
    return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

// Verifies the 6-digit code sent to the user's email during registration
async function verifyCode(req, res) {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ success: false, message: "Email dan kod diperlukan." });
        }

        const [rows] = await pool.query(
            "SELECT username, is_verified, verification_code, verification_expires FROM Users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Akaun tidak dijumpai." });
        }

        const user = rows[0];

        if (user.is_verified) {
            return res.status(200).json({ success: true, message: "Akaun anda sudah disahkan." });
        }

        if (!user.verification_code || !user.verification_expires) {
            return res.status(400).json({ success: false, message: "Tiada kod pengesahan aktif. Sila minta kod baharu." });
        }

        if (new Date(user.verification_expires) < new Date()) {
            return res.status(410).json({ success: false, message: "Kod pengesahan telah tamat tempoh. Sila minta kod baharu." });
        }

        if (user.verification_code !== code) {
            return res.status(401).json({ success: false, message: "Kod pengesahan tidak sah." });
        }

        await pool.query(
            "UPDATE Users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE email = ?",
            [email]
        );

        return res.status(200).json({ success: true, message: "Akaun berjaya disahkan! Sila log masuk untuk meneruskan." });

    } catch (err) {
        console.error("Verify code error:", err);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
}

// Resends a fresh 6-digit code to the user's email
async function resendCode(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email diperlukan." });
        }

        const [rows] = await pool.query(
            "SELECT is_verified FROM Users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Akaun tidak dijumpai." });
        }

        if (rows[0].is_verified) {
            return res.status(200).json({ success: true, message: "Akaun anda sudah disahkan." });
        }

        const newCode = generateVerificationCode();

        await pool.query(
            "UPDATE Users SET verification_code = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?",
            [newCode, email]
        );

        await sendVerificationEmail(email, newCode);

        return res.status(200).json({ success: true, message: "Kod pengesahan baharu telah dihantar." });

    } catch (err) {
        console.error("Resend code error:", err);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
}

module.exports = { verifyCode, resendCode };
