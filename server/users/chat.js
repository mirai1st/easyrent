const express = require("express");
const db = require("../system/db");
const { authenticateToken } = require("../system/common");

const router = express.Router();

// ========================================================
// GET USER CONVERSATIONS (now with unread_count per conversation)
// ========================================================

router.get("/conversations", authenticateToken, async (req, res) => {
    try {
        const username = req.user.username;

        const [rows] = await db.execute(
            `
            SELECT 
                c.conversation_id,

                CASE 
                    WHEN c.user1 = ? THEN c.user2 
                    ELSE c.user1 
                END AS other_user,

                u.profileImg_url AS other_user_avatar,

                m.message AS last_message,
                m.sent_at AS last_message_time,

                (
                    SELECT COUNT(*)
                    FROM message m3
                    WHERE m3.conversation_id = c.conversation_id
                      AND m3.sender != ?
                      AND m3.is_read = 0
                ) AS unread_count

            FROM conversation c

            LEFT JOIN Users u 
                ON u.username = (
                    CASE 
                        WHEN c.user1 = ? THEN c.user2 
                        ELSE c.user1 
                    END
                )

            LEFT JOIN message m 
                ON m.message_id = (
                    SELECT m2.message_id
                    FROM message m2
                    WHERE m2.conversation_id = c.conversation_id
                    ORDER BY m2.sent_at DESC
                    LIMIT 1
                )

            WHERE c.user1 = ? 
               OR c.user2 = ?

            ORDER BY last_message_time DESC
            `,
            [
                username, // CASE for other_user
                username, // unread_count subquery
                username, // CASE for join
                username, // WHERE user1
                username  // WHERE user2
            ]
        );

        res.json(rows);

    } catch (err) {
        console.error("Get conversation error:", err);

        res.status(500).json({
            error: "Failed to get conversations"
        });
    }
});


// ========================================================
// CREATE / GET CONVERSATION
// ========================================================

router.post("/conversations", authenticateToken, async (req, res) => {
    try {
        const currentUser = req.user.username;
        const otherUser = req.body.username;

        if (!otherUser) {
            return res.status(400).json({
                error: "Username is required"
            });
        }

        if (currentUser === otherUser) {
            return res.status(400).json({
                error: "You cannot chat with yourself"
            });
        }

        const users = [
            currentUser,
            otherUser
        ].sort();

        const [result] = await db.execute(
            `
            INSERT INTO conversation (user1, user2)
            VALUES (?, ?)

            ON DUPLICATE KEY UPDATE
                conversation_id = LAST_INSERT_ID(conversation_id)
            `,
            users
        );

        res.json({
            success: true,
            conversation_id: result.insertId
        });

    } catch (err) {
        console.error("Create conversation error:", err);

        res.status(500).json({
            error: "Failed to create conversation"
        });
    }
});


// ========================================================
// GET MESSAGES
// ========================================================

router.get(
    "/conversations/:id/messages",
    authenticateToken,
    async (req, res) => {

        try {
            const username = req.user.username;
            const conversationId = req.params.id;

            // Check user belongs to conversation
            const [conversation] = await db.execute(
                `
                SELECT conversation_id
                FROM conversation

                WHERE conversation_id = ?

                AND (
                    user1 = ?
                    OR user2 = ?
                )
                `,
                [
                    conversationId,
                    username,
                    username
                ]
            );

            if (conversation.length === 0) {
                return res.status(403).json({
                    error: "You are not part of this conversation"
                });
            }

            // Get messages bersama profile picture sender
            const [messages] = await db.execute(
                `
                SELECT 
                    m.message_id,
                    m.sender,
                    u.profileImg_url AS sender_avatar,
                    m.message,
                    m.is_read,
                    m.sent_at

                FROM message m

                LEFT JOIN Users u 
                    ON u.username = m.sender

                WHERE m.conversation_id = ?

                ORDER BY m.sent_at ASC
                `,
                [
                    conversationId
                ]
            );

            res.json(messages);

        } catch (err) {

            console.error("Get messages error:", err);

            res.status(500).json({
                error: "Failed to get messages"
            });
        }
    }
);


// ========================================================
// MARK CONVERSATION AS READ
// ========================================================

router.put(
    "/conversations/:id/read",
    authenticateToken,
    async (req, res) => {

        try {
            const username = req.user.username;
            const conversationId = req.params.id;

            // Check user belongs to conversation
            const [conversation] = await db.execute(
                `
                SELECT conversation_id
                FROM conversation
                WHERE conversation_id = ?
                AND (user1 = ? OR user2 = ?)
                `,
                [conversationId, username, username]
            );

            if (conversation.length === 0) {
                return res.status(403).json({
                    error: "You are not part of this conversation"
                });
            }

            const [result] = await db.execute(
                `
                UPDATE message
                SET is_read = 1
                WHERE conversation_id = ?
                  AND sender != ?
                  AND is_read = 0
                `,
                [conversationId, username]
            );

            // Let the other person know their messages were seen (optional, safe to ignore on frontend)
            const io = req.app.get("io");
            if (io && result.affectedRows > 0) {
                io.to(`conversation_${conversationId}`).emit("messages_read", {
                    conversation_id: conversationId,
                    reader: username
                });
            }

            res.json({
                success: true,
                marked_read: result.affectedRows
            });

        } catch (err) {
            console.error("Mark as read error:", err);

            res.status(500).json({
                error: "Failed to mark conversation as read"
            });
        }
    }
);


// ========================================================
// GLOBAL UNREAD COUNT (for navbar/bell icon)
// ========================================================

router.get("/unread-count", authenticateToken, async (req, res) => {
    try {
        const username = req.user.username;

        const [rows] = await db.execute(
            `
            SELECT COUNT(*) AS unread_count
            FROM message m
            JOIN conversation c ON c.conversation_id = m.conversation_id
            WHERE (c.user1 = ? OR c.user2 = ?)
              AND m.sender != ?
              AND m.is_read = 0
            `,
            [username, username, username]
        );

        res.json({ unread_count: rows[0].unread_count });

    } catch (err) {
        console.error("Get unread count error:", err);

        res.status(500).json({
            error: "Failed to get unread count"
        });
    }
});


// ========================================================
// SEND MESSAGE
// ========================================================

router.post("/messages", authenticateToken, async (req, res) => {

    try {

        const sender = req.user.username;

        const {
            conversation_id,
            message
        } = req.body;


        if (!conversation_id || !message?.trim()) {

            return res.status(400).json({
                error: "Conversation ID and message are required"
            });

        }


        // Check user belongs to conversation
        const [conversation] = await db.execute(
            `
            SELECT conversation_id, user1, user2

            FROM conversation

            WHERE conversation_id = ?

            AND (
                user1 = ?
                OR user2 = ?
            )
            `,
            [
                conversation_id,
                sender,
                sender
            ]
        );


        if (conversation.length === 0) {

            return res.status(403).json({
                error: "You are not part of this conversation"
            });

        }

        const recipient =
            conversation[0].user1 === sender
                ? conversation[0].user2
                : conversation[0].user1;


        // Save message (is_read defaults to 0)
        const [result] = await db.execute(
            `
            INSERT INTO message
                (
                    conversation_id,
                    sender,
                    message
                )

            VALUES
                (?, ?, ?)
            `,
            [
                conversation_id,
                sender,
                message.trim()
            ]
        );


        // Push the new message live to everyone in this conversation's room
        const io = req.app.get("io");

        if (io) {
            io.to(`conversation_${conversation_id}`).emit("new_message", {
                message_id: result.insertId,
                conversation_id,
                sender,
                message: message.trim(),
                is_read: 0,
                sent_at: new Date()
            });

            // Push a toast-style notification straight to the recipient,
            // even if they're not on the messages page at all
            io.to(`user_${recipient}`).emit("message_notification", {
                conversation_id,
                sender,
                message: message.trim(),
                sent_at: new Date()
            });
        }


        res.json({
            success: true,
            message_id: result.insertId
        });


    } catch (err) {

        console.error("Send message error:", err);

        res.status(500).json({
            error: "Failed to send message"
        });

    }

});


module.exports = router;