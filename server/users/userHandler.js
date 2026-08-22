const db = require("../db");

// This functions get the user profile
async function getProfile(req, res) {
    try {
        const [rows] = await db.execute(
            `SELECT 
                username, 
                email, 
                phoneNo, 
                full_name, 
                profileImg_url, 
                role, 
                dateCreated 
            FROM Users WHERE username = ?`,
            [req.user.username],
        );

        if (!rows[0]) {
            return res
                .status(404)
                .json({ success: false, message: "User not found." });
        }

        res.json({
            ...rows[0],
            sessionStart: req.user.iat * 1000,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching user data.", errorGet: err });
    }
};

// This functions when user want to update their profile
async function updateProfile(req, res) {
    try {
        const username = req.user.username;
        const { email, phoneNo, full_name} = req.body;

        const file = req.file;
        let profileImg_url;
        if (file) {
            profileImg_url = `/userdata/${file.filename}`;
        }

        let query;
        let values;

        if (profileImg_url) {
            query = `
                UPDATE Users SET
                    email = ?,
                    phoneNo = ?,
                    full_name = ?,
                    profileImg_url = ?
                WHERE username = ?
            `;

            values = [
                email,
                phoneNo,
                full_name,
                profileImg_url,
                username
            ];
        } else {
            query = `
                UPDATE Users SET
                    email = ?,
                    phoneNo = ?,
                    full_name = ?
                WHERE username = ?
            `;

            values = [
                email,
                phoneNo,
                full_name,
                username
            ];
        }

        await db.execute(query, values);

        res.json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Error updating profile.",
            errorGet: error.message
        });
    }
}

// ----------------------------------------------------------------------------
// Others Functions

async function userLogout(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
    });

    return res.json({
        success: true,
        message: "Logged out successfully."
    });
}

async function userAccountDeletion(req, res) {
    try {
        const [result] = await db.execute("DELETE FROM Users WHERE username = ?", [
            req.user.username,
        ]);

        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ success: false, message: "User not found." });
        }

        // Clear session cookie after account is deleted
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
        });

        return res.json({
            success: true,
            message: "Account deleted successfully.",
        });
    } catch (err) {
        console.error("Error deleting account:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};

module.exports = { 
    getProfile, 
    updateProfile, 
    userLogout, 
    userAccountDeletion 
};