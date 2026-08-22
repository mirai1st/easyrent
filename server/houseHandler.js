const db = require('./db'); // sama folder dgn server/db.js

// This function handler house post
async function postHandler(req, res) {
    const {
        title,
        totalOf_bedroom,
        totalOf_shower,
        post,
        location,
        latitud,
        longitud
    } = req.body;

    const files = req.files;

    const username = req.user.username;

    if (!title || !totalOf_bedroom || !totalOf_shower || !post || !location) {
        return res.status(400).json({ success: false, message: 'Semua medan wajib diisi.' });
    }

    if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'Sila muat naik sekurang-kurangnya satu gambar.' });
    }

    const imagePaths = files.map(file => `/uploads/houses/${file.filename}`);

    try {
        const [result] = await db.execute(
            `INSERT INTO Rent
                (username, title, totalOf_bedroom, totalOf_shower, description, location, latitud, longitud, img_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                username,
                title,
                totalOf_bedroom,
                totalOf_shower,
                post,
                location,
                latitud || null,
                longitud || null,
                JSON.stringify(imagePaths)
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Rumah berjaya disiarkan. Menunggu kelulusan admin.',
            rentID: result.insertId
        });

    } catch (err) {
        console.error('postHandler error:', err);
        return res.status(500).json({ success: false, message: 'Ralat server. Sila cuba lagi.' });
    }
}

module.exports = postHandler;