const db = require("../system/db");

const FAVOURITE_TYPES = ["house", "community"];

function isValidType(type) {
    return FAVOURITE_TYPES.includes(type);
}

// postId must be a positive integer, otherwise null
function toPostId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Parse a JSON array column. If "folder" is given, rebuild the path from the file name only.
function parseImages(value, folder = null) {
    let images = value;

    if (typeof images === "string") {
        try {
            images = JSON.parse(images);
        } catch (err) {
            images = [];
        }
    }

    if (!Array.isArray(images)) return [];
    if (!folder) return images;

    return images.map((imagePath) => {
        const filename = String(imagePath).split("/").pop();
        return `/userdata/uploads/${folder}/${filename}`;
    });
}

// Only count posts that still exist (and are approved, for houses),
// so the badge number always matches the list.
async function fetchCounts(username) {
    const [rows] = await db.execute(
        `SELECT 'house' AS type, COUNT(*) AS total
         FROM Favourite f
         JOIN Rent r ON r.rentID = f.postId
         WHERE f.username = ? AND f.type = 'house' AND r.isAdminApprove = 'true'
         UNION ALL
         SELECT 'community' AS type, COUNT(*) AS total
         FROM Favourite f
         JOIN spPost p ON p.spId = f.postId
         WHERE f.username = ? AND f.type = 'community'`,
        [username, username]
    );

    const counts = { house: 0, community: 0 };
    rows.forEach((row) => {
        counts[row.type] = Number(row.total);
    });

    return counts;
}

async function fetchHouseFavourites(username) {
    const [rows] = await db.execute(
        `SELECT f.favourID, r.rentID, r.username, r.title, r.totalOf_bedroom,
                r.totalOf_shower, r.img_url, r.price, r.location,
                r.target_institution, r.gender, r.dateCreated
         FROM Favourite f
         JOIN Rent r ON r.rentID = f.postId
         WHERE f.username = ? AND f.type = 'house' AND r.isAdminApprove = 'true'
         ORDER BY f.favourID DESC`,
        [username]
    );

    // Same shape as /api/house/fetch so the same card renderer can be reused
    return rows.map((row) => ({
        favourID: row.favourID,
        house_id: row.rentID,
        title: row.title,
        images: parseImages(row.img_url, "houses"),
        price: row.price,
        totalShower: row.totalOf_shower,
        totalRoom: row.totalOf_bedroom,
        gender: row.gender,
        location: row.location,
        targetInstitution: row.target_institution,
        originalposter: row.username,
        dateCreated: row.dateCreated
    }));
}

async function fetchCommunityFavourites(username) {
    const [rows] = await db.execute(
        `SELECT f.favourID, p.spId, p.username, p.content, p.imgFile,
                p.commentCount, p.likeCount, u.full_name, u.profileImg_url
         FROM Favourite f
         JOIN spPost p ON p.spId = f.postId
         LEFT JOIN Users u ON u.username = p.username
         WHERE f.username = ? AND f.type = 'community'
         ORDER BY f.favourID DESC`,
        [username]
    );

    // Same shape as /api/v1/sp/fetch
    return rows.map((row) => ({
        favourID: row.favourID,
        spId: row.spId,
        username: row.username,
        content: row.content,
        imgFile: parseImages(row.imgFile),
        commentCount: row.commentCount,
        likeCount: row.likeCount,
        full_name: row.full_name,
        profileImg_url: row.profileImg_url
    }));
}

async function getFavourites(req, res) {
    const username = req.user.username;
    const { type } = req.query;

    if (!isValidType(type)) {
        return res.status(400).json({
            success: false,
            message: "Invalid favourite type."
        });
    }

    try {
        const [items, counts] = await Promise.all([
            type === "house"
                ? fetchHouseFavourites(username)
                : fetchCommunityFavourites(username),
            fetchCounts(username)
        ]);

        return res.status(200).json({ success: true, type, counts, items });

    } catch (err) {
        console.error("Error getting user favourite:", err);

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred."
        });
    }
}

async function getFavouriteIds(req, res) {
    const username = req.user.username;

    try {
        const [rows] = await db.execute(
            `SELECT type, postId FROM Favourite WHERE username = ?`,
            [username]
        );

        const ids = { house: [], community: [] };
        rows.forEach((row) => {
            if (ids[row.type]) ids[row.type].push(Number(row.postId));
        });

        return res.status(200).json({ success: true, ...ids });

    } catch (err) {
        console.error("Error getting user favourite ids:", err);

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred."
        });
    }
}

// Like/unlike a Sudut Pelajar post = add/remove it from the favourites + change likeCount.
// Everything happens in ONE transaction, so the counter can never drift from the Favourite rows.
// Returns { favourited, likeCount }, or null when the post does not exist.
async function toggleCommunityFavourite(username, spId) {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Lock the post row so two clicks at the same time are applied one after another
        const [posts] = await conn.execute(
            `SELECT spId FROM spPost WHERE spId = ? FOR UPDATE`,
            [spId]
        );

        const [removed] = await conn.execute(
            `DELETE FROM Favourite
             WHERE username = ? AND type = 'community' AND postId = ?`,
            [username, spId]
        );

        // Post was deleted: only clean up a leftover favourite, never re-add it
        if (posts.length === 0) {
            await conn.commit();
            return removed.affectedRows > 0 ? { favourited: false, likeCount: 0 } : null;
        }

        let favourited;

        if (removed.affectedRows > 0) {
            await conn.execute(
                `UPDATE spPost SET likeCount = GREATEST(0, likeCount - 1) WHERE spId = ?`,
                [spId]
            );
            favourited = false;
        } else {
            await conn.execute(
                `INSERT INTO Favourite (username, type, postId) VALUES (?, 'community', ?)`,
                [username, spId]
            );
            await conn.execute(
                `UPDATE spPost SET likeCount = likeCount + 1 WHERE spId = ?`,
                [spId]
            );
            favourited = true;
        }

        const [counts] = await conn.execute(
            `SELECT likeCount FROM spPost WHERE spId = ?`,
            [spId]
        );

        await conn.commit();

        return { favourited, likeCount: counts[0].likeCount };

    } catch (err) {
        try { await conn.rollback(); } catch (rollbackErr) { /* connection already gone */ }
        throw err;
    } finally {
        conn.release();
    }
}

async function toggleFavourite(req, res) {
    const username = req.user.username;
    const { type } = req.body;
    const postId = toPostId(req.body.postId);

    if (!isValidType(type) || postId === null) {
        return res.status(400).json({
            success: false,
            message: "Invalid favourite type or post id."
        });
    }

    try {
        // Sudut Pelajar post: favourite and like are the same thing (also changes likeCount)
        if (type === "community") {
            const result = await toggleCommunityFavourite(username, postId);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found."
                });
            }

            return res.status(result.favourited ? 201 : 200).json({
                success: true,
                favourited: result.favourited,
                likeCount: result.likeCount,
                message: result.favourited ? "Added to favourite." : "Removed from favourite."
            });
        }

        // House: already a favourite? Remove it. (Done first so an old favourite can
        // always be removed, even if the house was un-approved afterwards.)
        const [removed] = await db.execute(
            `DELETE FROM Favourite
             WHERE username = ? AND type = ? AND postId = ?`,
            [username, type, postId]
        );

        if (removed.affectedRows > 0) {
            return res.status(200).json({
                success: true,
                favourited: false,
                message: "Removed from favourite."
            });
        }

        // Not a favourite yet: make sure the post really exists before saving it
        const existsQuery = type === "house"
            ? `SELECT 1 FROM Rent WHERE rentID = ? AND isAdminApprove = 'true'`
            : `SELECT 1 FROM spPost WHERE spId = ?`;

        const [found] = await db.execute(existsQuery, [postId]);

        if (found.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        // INSERT IGNORE + UNIQUE KEY (username, type, postId) stops duplicates on double click
        await db.execute(
            `INSERT IGNORE INTO Favourite (username, type, postId)
             VALUES (?, ?, ?)`,
            [username, type, postId]
        );

        return res.status(201).json({
            success: true,
            favourited: true,
            message: "Added to favourite."
        });

    } catch (err) {
        console.error("Error toggling user favourite:", err);

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred."
        });
    }
}

module.exports = {
    getFavourites,
    getFavouriteIds,
    toggleFavourite,
    toggleCommunityFavourite
};