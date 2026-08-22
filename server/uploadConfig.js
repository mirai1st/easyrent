const multer = require('multer');
const path = require('path');
const fs = require('fs');

function createUpload(directory) {
    const uploadDir = path.join(__dirname, '..', directory);

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },

        filename: function (req, file, cb) {
            const uniqueName =
                `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;

            cb(null, uniqueName);
        }
    });

    const fileFilter = function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Hanya fail JPG, JPEG atau PNG dibenarkan.'));
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024,
            files: 5
        }
    });
}

const uploadHouse = createUpload('uploads/houses');
const uploadProfile = createUpload('userdata');

module.exports = {
    uploadHouse,
    uploadProfile
};