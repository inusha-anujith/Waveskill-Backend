const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Absolute path so the destination does not depend on the process cwd.
const CV_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'cvs');

// multer's diskStorage does not create missing directories, it just throws
// ENOENT on the first upload. Make sure the folder exists at require time.
fs.mkdirSync(CV_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, CV_UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // Keeps the original filename but adds a timestamp to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Strip path separators so a crafted filename cannot escape the folder
        const safeName = path.basename(file.originalname).replace(/[^\w.\-]/g, '_');
        cb(null, uniqueSuffix + '-' + safeName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
module.exports.CV_UPLOAD_DIR = CV_UPLOAD_DIR;
