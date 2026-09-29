const db = require('./db'); // sama folder dgn server/db.js

// Helper untuk pastikan format img_url sentiasa Array URL yang sah
function normalizeImagePaths(imgUrl) {
    if (!imgUrl) return [];
    
    let images = [];
    try {
        images = typeof imgUrl === 'string' ? JSON.parse(imgUrl) : imgUrl;
    } catch (e) {
        images = [imgUrl];
    }

    if (!Array.isArray(images)) images = [images];

    return images.map(img => {
        if (!img) return '';
        img = String(img).trim();
        if (!img.startsWith('/') && !img.startsWith('http')) {
            return '/' + img;
        }
        return img;
    }).filter(Boolean);
}

// Handler cipta iklan baru
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
                     (username, title, totalOf_bedroom, totalOf_shower, description, location, target_institution, price, latitud, longitud, img_url, gender, isActive)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'true')`,
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

// Ambil senarai rumah kepunyaan user (termasuk status isActive & isAdminApprove)
async function fetchUserHouses(req, res) {
    if (!req.user || !req.user.username) {
        return res.status(401).json({ success: false, message: 'Sila log masuk untuk melihat senarai rumah anda.' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT rentID, title, totalOf_bedroom, totalOf_shower, description, img_url,
                    price, location, target_institution, gender, dateCreated, isBooked, isActive, isAdminApprove
             FROM Rent
             WHERE username = ? 
             ORDER BY dateCreated DESC`,
            [req.user.username]
        );

        return res.json({
            success: true,
            count: rows.length,
            houses: rows.map((row) => ({
                house_id: row.rentID,
                title: row.title,
                description: row.description,
                totalRoom: row.totalOf_bedroom,
                totalShower: row.totalOf_shower,
                price: row.price,
                location: row.location,
                targetInstitution: row.target_institution,
                gender: row.gender,
                dateCreated: row.dateCreated,
                isBooked: row.isBooked,
                isActive: row.isActive,             // Tambah isActive
                isAdminApprove: row.isAdminApprove, // Tambah isAdminApprove
                images: normalizeImagePaths(row.img_url)
            }))
        });
    } catch (error) {
        console.error('Error fetching user houses:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Cadangan rumah (Public: hanya aktif, diluluskan & belum dibooking)
async function getRecommendations(req, res) {
    try {
        const [rows] = await db.query(
            `SELECT rentID, title, totalOf_bedroom, totalOf_shower, img_url, location, price, gender
             FROM Rent
             WHERE isAdminApprove = 'true' AND isBooked = 'false' AND isActive = 'true'
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
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Carian rumah awam
async function fetchHouses(req, res) {
    let {
        search = '',
        lokasi = '',
        bilikAir,
        bilikTidur,
        hargaMin,
        hargaMax,
        jantina = ''
    } = req.query;

    // ELAK CRASH: Jika parameter berulang dalam URL, ambil nilai pertama sahaja
    search = Array.isArray(search) ? search[0] : search;
    lokasi = Array.isArray(lokasi) ? lokasi[0] : lokasi;
    jantina = Array.isArray(jantina) ? jantina[0] : jantina;

    const conditions = ["r.isAdminApprove = 'true' AND r.isBooked = 'false' AND r.isActive = 'true'"];
    const values = [];

    // 1. Carian Kata Kunci (Search Keyword)
    if (search && search.trim()) {
        const searchPattern = `%${search.trim()}%`;
        conditions.push('(r.title LIKE ? OR r.description LIKE ? OR r.location LIKE ?)');
        values.push(searchPattern, searchPattern, searchPattern);
    }

    // 2. Tapisan Institusi / Lokasi
    if (lokasi && lokasi.trim()) {
        conditions.push('r.target_institution LIKE ?');
        values.push(`%${lokasi.trim()}%`);
    }

    // 3. Tapisan Jantina (Baru Ditambah)
    if (jantina && jantina.trim() && jantina.toLowerCase() !== 'semua') {
        conditions.push('LOWER(r.gender) = ?');
        values.push(jantina.trim().toLowerCase());
    }

    // 4. Bilik Air Minimum
    const minimumBathrooms = Number(Array.isArray(bilikAir) ? bilikAir[0] : bilikAir);
    if (Number.isFinite(minimumBathrooms) && minimumBathrooms > 0) {
        conditions.push('r.totalOf_shower >= ?');
        values.push(minimumBathrooms);
    }

    // 5. Bilik Tidur Minimum
    const minimumBedrooms = Number(Array.isArray(bilikTidur) ? bilikTidur[0] : bilikTidur);
    if (Number.isFinite(minimumBedrooms) && minimumBedrooms > 0) {
        conditions.push('r.totalOf_bedroom >= ?');
        values.push(minimumBedrooms);
    }

    // 6. Harga Minimum
    const minimumPrice = Number(Array.isArray(hargaMin) ? hargaMin[0] : hargaMin);
    if (Number.isFinite(minimumPrice)) {
        conditions.push('r.price >= ?');
        values.push(minimumPrice);
    }

    // 7. Harga Maksimum
    const maximumPrice = Number(Array.isArray(hargaMax) ? hargaMax[0] : hargaMax);
    if (Number.isFinite(maximumPrice)) {
        conditions.push('r.price <= ?');
        values.push(maximumPrice);
    }

    try {
        const [rows] = await db.execute(
            `SELECT r.rentID, r.username, r.title, r.totalOf_bedroom,
                    r.totalOf_shower, r.img_url, r.price, r.location,
                    r.target_institution, r.gender, r.dateCreated
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

// Lihat detail rumah tunggal (Public)
async function fetchHouseById(req, res) {
    const houseId = Number(req.query.id);

    if (!Number.isInteger(houseId) || houseId < 1) {
        return res.status(400).json({ message: 'ID rumah tidak sah.' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT rentID, username, title, description, totalOf_bedroom,
                    totalOf_shower, img_url, dateCreated, latitud,
                    longitud, location, target_institution, gender, price, isBooked
            FROM Rent
            WHERE rentID = ? AND isAdminApprove = 'true' AND isActive = 'true'
            LIMIT 1`,
            [houseId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Rumah tidak dijumpai atau tidak aktif.' });
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
            longitud: house.longitud,
            isBooked: house.isBooked
        });
    } catch (error) {
        console.error('Error fetching house:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Ambil maklumat rumah khas untuk pemilik (Owner view)
async function fetchHouseByIdForOwner(req, res) {
    const houseId = Number(req.params.id);

    if (!Number.isInteger(houseId) || houseId < 1) {
        return res.status(400).json({ success: false, message: 'ID rumah tidak sah.' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT rentID, username, title, description, totalOf_bedroom,
                    totalOf_shower, img_url, latitud, longitud, location, 
                    target_institution, gender, price, isBooked, isActive, isAdminApprove
             FROM Rent
             WHERE rentID = ? AND username = ?
             LIMIT 1`,
            [houseId, req.user.username]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Rumah tidak dijumpai atau anda tiada kebenaran.' });
        }

        const [house] = rows;
        return res.json({
            success: true,
            house: {
                house_id: house.rentID,
                title: house.title,
                description: house.description,
                totalRoom: house.totalOf_bedroom,
                totalShower: house.totalOf_shower,
                price: house.price,
                location: house.location,
                targetInstitution: house.target_institution,
                gender: house.gender,
                latitud: house.latitud,
                longitud: house.longitud,
                isBooked: house.isBooked,
                isActive: house.isActive,
                isAdminApprove: house.isAdminApprove,
                images: normalizeImagePaths(house.img_url)
            }
        });
    } catch (error) {
        console.error('Error fetching house for owner:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Update maklumat rumah oleh owner
async function updateHouse(req, res) {
    const houseId = Number(req.params.id);
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

    const username = req.user.username;

    try {
        const [existing] = await db.execute(
            'SELECT rentID, img_url FROM Rent WHERE rentID = ? AND username = ?',
            [houseId, username]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Iklan rumah tidak dijumpai.' });
        }

        let imagePaths = normalizeImagePaths(existing[0].img_url);

        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => `/userdata/uploads/houses/${file.filename}`);
        }

        await db.execute(
            `UPDATE Rent 
             SET title = ?, totalOf_bedroom = ?, totalOf_shower = ?, description = ?, 
                 location = ?, target_institution = ?, price = ?, latitud = ?, 
                 longitud = ?, img_url = ?, gender = ?, isAdminApprove = 'false'
             WHERE rentID = ? AND username = ?`,
            [
                title,
                Number(totalOf_bedroom),
                Number(totalOf_shower),
                post,
                location,
                target_institution,
                Number(price),
                latitud ? Number(latitud) : null,
                longitud ? Number(longitud) : null,
                JSON.stringify(imagePaths),
                gender,
                houseId,
                username
            ]
        );

        return res.json({ success: true, message: 'Maklumat rumah berjaya dikemaskini!' });

    } catch (error) {
        console.error('Update house error:', error);
        return res.status(500).json({ success: false, message: 'Ralat server semasa mengemaskini.' });
    }
}

// Padam iklan rumah milik pengusaha
async function deleteHouse(req, res) {
    const houseId = Number(req.params.id);
    const username = req.user.username;

    if (!Number.isInteger(houseId) || houseId < 1) {
        return res.status(400).json({ success: false, message: 'ID rumah tidak sah.' });
    }

    try {
        const [result] = await db.execute(
            'DELETE FROM Rent WHERE rentID = ? AND username = ?',
            [houseId, username]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Iklan tidak dijumpai atau anda tidak mempunyai kebenaran.' });
        }

        return res.json({ success: true, message: 'Iklan rumah berjaya dipadam.' });
    } catch (error) {
        console.error('Delete house error:', error);
        return res.status(500).json({ success: false, message: 'Ralat server semasa memadam iklan.' });
    }
}

// Kemaskini status rumah (isBooked)
async function updateHouseStatus(req, res) {
    const houseId = Number(req.params.id);
    const { isBooked } = req.body;
    const username = req.user.username;

    if (!Number.isInteger(houseId) || houseId < 1) {
        return res.status(400).json({ success: false, message: 'ID rumah tidak sah.' });
    }

    const bookedValue = (isBooked === true || isBooked === 'true') ? 'true' : 'false';

    try {
        const [result] = await db.execute(
            'UPDATE Rent SET isBooked = ? WHERE rentID = ? AND username = ?',
            [bookedValue, houseId, username]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Iklan tidak dijumpai atau anda tidak mempunyai kebenaran.' });
        }

        return res.json({ success: true, message: 'Status rumah berjaya dikemaskini.' });
    } catch (error) {
        console.error('Update status error:', error);
        return res.status(500).json({ success: false, message: 'Ralat server semasa mengemaskini status.' });
    }
}

module.exports = {
    postHandler,
    fetchUserHouses,
    getRecommendations,
    fetchHouses,
    fetchHouseById,
    fetchHouseByIdForOwner,
    updateHouse,
    deleteHouse,
    updateHouseStatus
};