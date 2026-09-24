// This file contains functions for users backend
const db = require("../system/db");

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
            sessionId: req.user.sessionId
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching user data.", errorGet: err });
    }
};

// This functions when user want to update their profile
async function updateProfile(req, res) {
    try {
        const username = req.user.username;
        const { email, phoneNo, full_name } = req.body;

        const file = req.file;
        let profileImg_url;
        if (file) {
            profileImg_url = file.filename;
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
            message: "Profile updated successfully",
            profileImg_url
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

async function getPublicProfile(req, res) {
    try {
        // Ambil daripada query string (?username=xxx)
        const username = req.query.username;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username diperlukan"
            });
        }

        // 1. Ambil Data Pengguna
        const [users] = await db.execute(
            `SELECT username, email, phoneNo, full_name, profileImg_url, role, dateCreated, address, description 
             FROM Users WHERE username = ? LIMIT 1`,
            [username]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "User tidak dijumpai" });
        }

        const user = users[0];

        // 2. Ambil Senarai Rumah
        const [houses] = await db.execute(
            `SELECT rentID, title, totalOf_bedroom, totalOf_shower, price, location, target_institution, gender, img_url, dateCreated
             FROM Rent WHERE username = ? AND isAdminApprove = 'true'
             ORDER BY dateCreated DESC`,
            [username]
        );

        // 3. Formatkan Gambar Rumah
        const listings = houses.map(house => {
            let images = [];
            try {
                if (house.img_url) {
                    const parsed = typeof house.img_url === 'string' ? JSON.parse(house.img_url) : house.img_url;
                    images = Array.isArray(parsed) ? parsed : [];
                }
            } catch (e) {
                images = [];
            }

            const formattedImages = images.map(img => {
                const filename = String(img).split('/').pop();
                return `/userdata/uploads/houses/${filename}`;
            });

            return {
                house_id: house.rentID,
                title: house.title,
                totalOf_bedroom: house.totalOf_bedroom,
                totalOf_shower: house.totalOf_shower,
                price: house.price,
                location: house.location,
                target_institution: house.target_institution,
                gender: house.gender,
                dateCreated: house.dateCreated,
                images: formattedImages
            };
        });

        // 4. Hantar JSON Response
        return res.json({
            success: true,
            user: {
                username: user.username,
                full_name: user.full_name || user.username,
                email: user.email,
                phoneNo: user.phoneNo || 'Tidak dinyatakan',
                address: user.address || 'Belum dikemaskini',
                description: user.description || 'Belum ada biografi.',
                profileImg_url: user.profileImg_url ? `/userdata/uploads/profileImg/${user.profileImg_url}` : null,
                role: user.role,
                dateCreated: user.dateCreated
            },
            listings
        });

    } catch (error) {
        console.error("getPublicProfile error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

module.exports = { 
    getProfile, 
    updateProfile, 
    userLogout, 
    userAccountDeletion,
    getPublicProfile
};