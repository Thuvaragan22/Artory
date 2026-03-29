const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Ensure upload directories exist ──────────────────────────────────────────
const DIRS = ['uploads/artworks', 'uploads/practice', 'uploads/courses', 'uploads/docs'];
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

// ── File type filters ──────────────────────────────────────────────────────────
function imageFilter(_req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
}

function docFilter(_req, file, cb) {
    const allowed = /pdf|doc|docx|txt/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error('Only document files are allowed (pdf, doc, docx, txt)'));
}

// ── Exported middleware ───────────────────────────────────────────────────────
exports.uploadArtwork = multer({ storage: makeStorage('uploads/artworks'), fileFilter: imageFilter, limits: { fileSize: 30 * 1024 * 1024 } }).single('image');
exports.uploadPractice = multer({ storage: makeStorage('uploads/practice'), fileFilter: imageFilter, limits: { fileSize: 20 * 1024 * 1024 } }).single('image');

// Multi-file upload for courses: thumbnail (image) and methods_doc (document)
exports.uploadCourseAssets = multer({
    storage: makeStorage('uploads/courses'),
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'thumbnail') return imageFilter(req, file, cb);
        if (file.fieldname === 'methods_doc') return docFilter(req, file, cb);
        cb(null, true);
    },
    limits: { fileSize: 50 * 1024 * 1024 }
}).fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'methods_doc', maxCount: 1 }
]);
