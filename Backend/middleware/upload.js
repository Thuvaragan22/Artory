const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Ensure upload directories exist ──────────────────────────────────────────
const DIRS = ['uploads/artworks', 'uploads/practice'];
DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Disk storage factory ──────────────────────────────────────────────────────
function makeStorage(folder) {
    return multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, folder),
        filename: (_req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
            cb(null, unique + path.extname(file.originalname));
        },
    });
}

// ── File type filter ──────────────────────────────────────────────────────────
function imageFilter(_req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
}

// ── Exported middleware ───────────────────────────────────────────────────────
exports.uploadArtwork = multer({ storage: makeStorage('uploads/artworks'), fileFilter: imageFilter, limits: { fileSize: 30 * 1024 * 1024 } }).single('image');
exports.uploadPractice = multer({ storage: makeStorage('uploads/practice'), fileFilter: imageFilter, limits: { fileSize: 20 * 1024 * 1024 } }).single('image');
