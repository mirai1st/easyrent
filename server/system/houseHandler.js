const db = require('./db'); // sama folder dgn server/db.js

// This function handler house post
async function postHandler(req, res) {
    const {
        title,
        totalOf_bedroom,
        totalOf_shower,
        price,
        post,
        gender,
        location,
        target_institution,
        latitud,
        longitud
    } = req.body;

    const files = req.files;

    const username = req.user.username;
    const numericPrice = Number(price);
    const numericBedrooms = Number(totalOf_bedroom);
    const numericBathrooms = Number(totalOf_shower);
    const hasLatitude = latitud !== undefined && latitud !== null && latitud !== '';
    const hasLongitude = longitud !== undefined && longitud !== null && longitud !== '';
    const numericLatitude = hasLatitude ? Number(latitud) : null;
    const numericLongitude = hasLongitude ? Number(longitud) : null;

    if (!title || totalOf_bedroom === undefined || totalOf_bedroom === '' ||
        totalOf_shower === undefined || totalOf_shower === '' || !price || !post || !location || !target_institution) {
        return res.status(400).json({ success: false, message: 'Semua medan wajib diisi.' });
    }

    if (!Number.isInteger(numericBedrooms) || numericBedrooms < 0 ||
        !Number.isInteger(numericBathrooms) || numericBathrooms < 0) {
        return res.status(400).json({ success: false, message: 'Bilangan bilik tidak sah.' });
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Harga rumah tidak sah.' });
    }

    if (hasLatitude !== hasLongitude) {
        return res.status(400).json({ success: false, message: 'Latitud dan longitud perlu diisi bersama.' });
    }

    if (hasLatitude && (
        !Number.isFinite(numericLatitude) || numericLatitude < -90 || numericLatitude > 90 ||
        !Number.isFinite(numericLongitude) || numericLongitude < -180 || numericLongitude > 180
    )) {
        return res.status(400).json({ success: false, message: 'Koordinat lokasi tidak sah.' });
    }

    if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'Sila muat naik sekurang-kurangnya satu gambar.' });
    }

    const imagePaths = files.map(file => `/userdata/uploads/houses/${file.filename}`);

    try {
        const [result] = await db.execute(
            `INSERT INTO Rent
                     (username, title, totalOf_bedroom, totalOf_shower, description, location, target_institution, price, latitud, longitud, img_url, gender)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                username,
                title,
                numericBedrooms,
                numericBathrooms,
                post,
                location,
                target_institution,
                numericPrice,
                numericLatitude,
                numericLongitude,
                JSON.stringify(imagePaths),
                gender
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
            `SELECT rentID, title, totalOf_bedroom, totalOf_shower, img_url, location, price, gender
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
            gender: row.gender,
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

async function fetchHouses(req, res) {
    const {
        search = '',
        lokasi = '',
        bilikAir,
        bilikTidur,
        hargaMin,
        hargaMax
    } = req.query;

    const conditions = ["r.isAdminApprove = 'true'"];
    const values = [];

    if (search.trim()) {
        const searchPattern = `%${search.trim()}%`;
        conditions.push('(r.title LIKE ? OR r.description LIKE ? OR r.location LIKE ?)');
        values.push(searchPattern, searchPattern, searchPattern);
    }

    if (lokasi.trim()) {
        conditions.push('r.target_institution LIKE ?');
        values.push(`%${lokasi.trim()}%`);
    }

    const minimumBathrooms = Number(bilikAir);
    if (Number.isFinite(minimumBathrooms) && minimumBathrooms > 0) {
        conditions.push('r.totalOf_shower >= ?');
        values.push(minimumBathrooms);
    }

    const minimumBedrooms = Number(bilikTidur);
    if (Number.isFinite(minimumBedrooms) && minimumBedrooms > 0) {
        conditions.push('r.totalOf_bedroom >= ?');
        values.push(minimumBedrooms);
    }

    const minimumPrice = Number(hargaMin);
    if (Number.isFinite(minimumPrice)) {
        conditions.push('r.price >= ?');
        values.push(minimumPrice);
    }

    const maximumPrice = Number(hargaMax);
    if (Number.isFinite(maximumPrice)) {
        conditions.push('r.price <= ?');
        values.push(maximumPrice);
    }
    
    try {
        const [rows] = await db.execute(
            `SELECT r.rentID, r.username, r.title, r.totalOf_bedroom,
                    r.totalOf_shower, r.img_url, r.price, r.location,
                    r.target_institution, r.gender,
                    r.dateCreated
             FROM Rent r
             WHERE ${conditions.join(' AND ')}
             ORDER BY r.dateCreated DESC`,
            values
        );

        return res.json(rows.map((row) => ({
            house_id: row.rentID,
            title: row.title,
            images: normalizeImagePaths(row.img_url),
            price: row.price,
            totalShower: row.totalOf_shower,
            totalRoom: row.totalOf_bedroom,
            gender: row.gender,
            location: row.location,
            targetInstitution: row.target_institution,
            originalposter: row.username,
            dateCreated: row.dateCreated
        })));
    } catch (error) {
        console.error('Error fetching houses:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function fetchHouseById(req, res) {
    const houseId = Number(req.query.id);

    if (!Number.isInteger(houseId) || houseId < 1) {
        return res.status(400).json({ message: 'ID rumah tidak sah.' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT rentID, username, title, description, totalOf_bedroom,
                    totalOf_shower, img_url, dateCreated, latitud,
                    longitud, location, target_institution, gender, price
             FROM Rent
             WHERE rentID = ? AND isAdminApprove = 'true'
             LIMIT 1`,
            [houseId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Rumah tidak dijumpai.' });
        }

        const [house] = rows;
        return res.json({
            house_id: house.rentID,
            title: house.title,
            description: house.description,
            images: normalizeImagePaths(house.img_url),
            price: house.price,
            totalShower: house.totalOf_shower,
            totalRoom: house.totalOf_bedroom,
            location: house.location,
            targetInstitution: house.target_institution,
            gender: house.gender,
            originalposter: house.username,
            dateCreated: house.dateCreated,
            latitud: house.latitud,
            longitud: house.longitud
        });
    } catch (error) {
        console.error('Error fetching house:', error);
        return res.status(500).json({ message: 'Internal server error' });
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
    getRecommendations,
    fetchHouses,
    fetchHouseById
}