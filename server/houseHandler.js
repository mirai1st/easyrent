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

    const imagePaths = files.map(file => `/userdata/uploads/houses/${file.filename}`);

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

async function getRecommendations(req, res) {
    try {
        const [rows] = await db.query(
            `SELECT rentID, title, totalOf_bedroom, totalOf_shower, img_url, location, price
             FROM Rent
             WHERE isAdminApprove = 'true'
             ORDER BY RAND()
             LIMIT 3`
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No recommendations found' });
        }

        const listings = rows.map((row) => ({
            house_id: row.rentID,
            title: row.title,
            beds: row.totalOf_bedroom,
            baths: row.totalOf_shower,
            location: row.location,
            price: row.price,
            images: normalizeImagePaths(row.img_url)
        }));

        res.json(listings);
    }
    catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

function normalizeImagePaths(imageValue) {
    let images = imageValue;

    if (typeof images === 'string') {
        try {
            images = JSON.parse(images);
        } catch (error) {
            images = [];
        }
    }

    if (!Array.isArray(images)) return [];

    return images.map((imagePath) => {
        const filename = String(imagePath).split('/').pop();
        return `/userdata/uploads/houses/${filename}`;
    });
}

module.exports = {
    postHandler,
    getRecommendations
}