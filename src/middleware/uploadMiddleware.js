const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Absolute paths so the destination does not depend on the process cwd.
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const CV_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'cvs');
const AVATAR_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'avatars');

// multer's diskStorage does not create missing directories, it just throws
// ENOENT on the first upload. Make sure both folders exist at require time.
fs.mkdirSync(CV_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });

// ==========================================
// CV uploads (PDF, served through an authenticated route)
// ==========================================
const cvStorage = multer.diskStorage({
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

const cvFileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: cvStorage,
    fileFilter: cvFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ==========================================
// Avatar uploads (image, served publicly by express.static)
// ==========================================
const AVATAR_EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, AVATAR_UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // Avatars are served without an auth header (an <img> tag cannot send
        // one), so the filename itself is the access control: 128 bits of
        // randomness makes the URL unguessable. A fresh name per upload also
        // means a replaced photo can never be served from a stale cache.
        const name = crypto.randomBytes(16).toString('hex');
        cb(null, name + (AVATAR_EXTENSIONS[file.mimetype] || '.jpg'));
    }
});

const avatarFileFilter = (req, file, cb) => {
    if (AVATAR_EXTENSIONS[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG or WEBP images are allowed!'), false);
    }
};

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB — the client downscales to ~30KB
});

module.exports = upload;
module.exports.upload = upload;
module.exports.uploadAvatar = uploadAvatar;
module.exports.CV_UPLOAD_DIR = CV_UPLOAD_DIR;
module.exports.AVATAR_UPLOAD_DIR = AVATAR_UPLOAD_DIR;
