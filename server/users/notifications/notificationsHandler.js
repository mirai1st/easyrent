const db = require("../../db");

// Get Unread Notification Counts
async function getUnreadNotifications(req, res) {
    try {
        const [rows] = await db.execute(
            `SELECT *
             FROM notifications
             WHERE username = ?
             AND is_read = 0
             ORDER BY created_at DESC`,
            [req.user.username]
        );

        res.json({
            success: true,
            unreadCount: rows.length,
            notifications: rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Error fetching notifications.",
            errorGet: err.message
        });
    }
}

// Get Notifications
async function getNotification(req, res) {
    try {
        const [rows] = await db.execute(
            `
            SELECT
                notificationID,
                username,
                type,
                title,
                message,
                is_read,
                related_id,
                created_at
            FROM notifications
            WHERE username = ?
            ORDER BY created_at DESC
        `,
            [req.user.username],
        );

        res.json(rows);
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
}

// Set is_Read => 1 
async function setIsRead(req, res) {
    try {
        const [result] = await db.execute(
            `
            UPDATE notifications
            SET is_read = 1
            WHERE notificationID = ?
            AND username = ?
        `,
            [req.params.id, req.user.username],
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found.",
            });
        }

        res.json({
            success: true,
        });
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
}

// set/mark all notification of certain users to read
async function markAllRead(req, res) {
    try {
        await db.execute(
            `
            UPDATE notifications
            SET is_read = 1
            WHERE username = ?
            AND is_read = 0
        `,
            [req.user.username],
        );

        res.json({
            success: true,
        });
    } catch (err) {
        console.error("Error marking all notifications as read:", err);
        res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
}

module.exports = { 
    getUnreadNotifications, 
    getNotification, 
    setIsRead, 
    markAllRead 
};