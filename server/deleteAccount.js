const db = require("./db");

async function deleteAccount(req, res) {
    try {
        // req.user comes directly from authenticateToken middleware
        const userId = req.user.id; // or req.user.username depending on your JWT payload

        const [result] = await db.query(
            "DELETE FROM Users WHERE id = ?",
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Clear the HTTP-only cookie upon deletion
        res.clearCookie("token");

        return res.json({ success: true, message: "Account deleted successfully." });

    } catch (error) {
        console.error("Delete account error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

module.exports = { deleteAccount };