const db = require("../db");

async function fetchFavourite(req, res) {
    const username = req.user.username;
    const { type } = req.body;

    try {
        const [result] = await db.execute(
            `SELECT * FROM Favourite
             WHERE username = ? AND type = ?`,
            [username, type]
        );

        return res.status(200).json(result);

    } catch (err) {
        console.error("Error getting user favourite:", err);

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred."
        });
    }
}


async function saveFavourite(req, res) {
    const username = req.user.username;
    const { type, postId } = req.body;

    try {
        await db.execute(
            `INSERT INTO Favourite (username, type, postId)
             VALUES (?, ?, ?)`,
            [username, type, postId]
        );

        return res.status(201).json({
            success: true,
            message: "Successfully added content to user favourite."
        });

    } catch (err) {
        console.error("Error adding content to user favourite:", err);

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred."
        });
    }
}


async function delFavourite(req, res) {
    const username = req.user.username;
    const { favourID } = req.body;

    try {
        const [result] = await db.execute(
            `DELETE FROM Favourite
             WHERE favourID = ? AND username = ?`,
            [favourID, username]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Favourite not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Successfully deleted content from user favourite."
        });

    } catch (err) {
        console.error("Error deleting user content favourite:", err);

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred."
        });
    }
}


module.exports = {
    fetchFavourite,
    saveFavourite,
    delFavourite
};