// This file contains functions for Sudut Pelajar backend
const db = require("../db");

async function fetchPost(req, res) {
    const query = `
        SELECT
            p.spId,
            p.username,
            p.content,
            p.imgFile,
            p.commentCount,
            p.likeCount,
            u.full_name,
            u.profileImg_url
        FROM spPost p
        LEFT JOIN Users u ON p.username = u.username
        ORDER BY p.spId DESC;
    `;

    try {
        const [posts] = await db.execute(query);

        // Parsing imgFile jika ia disimpan dalam format string JSON di DB
        const formattedPosts = posts.map(post => {
            let parsedImages = [];
            if (post.imgFile) {
                try {
                    parsedImages = typeof post.imgFile === 'string' ? JSON.parse(post.imgFile) : post.imgFile;
                } catch (e) {
                    parsedImages = [];
                }
            }
            return {
                ...post,
                imgFile: parsedImages
            };
        });

        return res.status(200).json({ success: true, posts: formattedPosts });    
    } catch (err) {
        console.error("Error fetching posts: ", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

async function insertPost(req, res) {
    const { content } = req.body;
    const username = req.user.username;

    // Jika tiada kandungan teks DAN tiada gambar diproses oleh Multer
    if (!content && (!req.files || req.files.length === 0)) {
        return res.status(400).json({
            success: false,
            message: "Hantaran tidak boleh kosong. Sila masukkan teks atau gambar."
        });
    }

    try {
        // Bina senarai URL laluan gambar daripada req.files (Multer)
        let imgPaths = [];
        if (req.files && req.files.length > 0) {
            imgPaths = req.files.map(file => `/userdata/uploads/sp/${file.filename}`);
        }

        const imagesJson = JSON.stringify(imgPaths);
        const query = `
            INSERT INTO spPost (username, content, imgFile, commentCount, likeCount)
            VALUES (?, ?, ?, 0, 0)        
        `;
        
        const [result] = await db.execute(query, [username, content || '', imagesJson]);

        return res.status(201).json({
            success: true,
            message: "Successfully created post",
            spId: result.insertId
        });
    } catch (err) {
        console.error("Error inserting post:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

async function deletePost(req, res) {
    const { spID } = req.params;
    const username = req.user.username;

    try {
        const [result] = await db.execute(`DELETE FROM spPost WHERE spId = ? AND username = ?`, [spID, username]);
        if (result.affectedRows === 0) {
            return res.status(403).json({ success: false, message: "Tindakan dilarang atau post tidak wujud." });
        }
        return res.status(200).json({ success: true, message: "Post berjaya dipadam." });
    } catch (err) {
        console.error("Error deleting post:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

async function replyPost(req, res) {
    const { spID } = req.params;
    const { content, imgFile, replyTo } = req.body;
    const username = req.user.username;

    if (!content) {
        return res.status(400).json({ success: false, message: "Kandungan komen diperlukan." });
    }

    try {
        const query = `
            INSERT INTO spComment (spId, username, content, imgFile, commentCount, likeCount, replyTo)
            VALUES (?, ?, ?, ?, 0, 0, ?)
        `;
        await db.execute(query, [spID, username, content, JSON.stringify(imgFile || []), replyTo || '']);
        
        await db.execute(`UPDATE spPost SET commentCount = commentCount + 1 WHERE spId = ?`, [spID]);
        
        return res.status(201).json({ success: true, message: "Comment successfully posted" });
    } catch (err) {
        console.error("Error replying post:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

async function fetchPostReply(req, res) {
    const { spID } = req.params;

    try {
        const query = `
            SELECT c.*, u.full_name, u.profileImg_url
            FROM spComment c
            LEFT JOIN Users u ON c.username = u.username
            WHERE c.spId = ?
            ORDER BY c.commentId ASC
        `;

        const [comments] = await db.execute(query, [spID]);
        return res.status(200).json({ success: true, comments });
    } catch (err) {
        console.error("Error fetching comments:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

async function deletePostReply(req, res) {
    const { commentId } = req.params;
    const username = req.user.username;

    try {
        const [comment] = await db.execute(
            `SELECT spId FROM spComment WHERE commentId = ? AND username = ?`, 
            [commentId, username]
        );

        if (comment.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: "Tindakan dilarang atau komen tidak wujud." 
            });
        }

        const spId = comment[0].spId;

        await db.execute(
            `DELETE FROM spComment WHERE commentId = ? AND username = ?`, 
            [commentId, username]
        );

        await db.execute(
            `UPDATE spPost SET commentCount = GREATEST(0, commentCount - 1) WHERE spId = ?`, 
            [spId]
        );

        return res.status(200).json({ 
            success: true, 
            message: "Komen berjaya dipadam." 
        });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

async function likePost(req, res) {
    const { spID } = req.params;

    try {
        const query = `UPDATE spPost SET likeCount = likeCount + 1 WHERE spId = ?`;
        const [result] = await db.execute(query, [spID]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Post tidak dijumpai." });
        }

        return res.status(200).json({ success: true, message: "Like berjaya dikemas kini." });
    } catch (err) {
        console.error("Error liking post:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

module.exports = {
    insertPost,
    fetchPost,
    deletePost,
    replyPost,
    fetchPostReply,
    deletePostReply,
    likePost
};