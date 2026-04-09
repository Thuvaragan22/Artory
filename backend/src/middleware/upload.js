const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ── Cloudinary storage factory ────────────────────────────────────────────────
function makeCloudinaryStorage(folder, resourceType = 'image') {
    return new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `artory/${folder}`,
            resource_type: resourceType,
            allowed_formats: resourceType === 'image'
                ? ['jpg', 'jpeg', 'png', 'webp', 'gif']
                : ['pdf', 'doc', 'docx', 'txt'],
            transformation: resourceType === 'image'
                ? [{ quality: 'auto', fetch_format: 'auto' }]
                : undefined,
        },
    });
}

// ── File type filters ─────────────────────────────────────────────────────────
function imageFilter(_req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(file.originalname.toLowerCase());
    const mime = /image/.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
}

function docFilter(_req, file, cb) {
    const allowed = /pdf|doc|docx|txt/;
    const ext = allowed.test(file.originalname.toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error('Only document files are allowed (pdf, doc, docx, txt)'));
}

// ── Wrap multer to return JSON errors instead of crashing ─────────────────────
function wrapMulter(multerMiddleware) {
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (!err) return next();
            console.error('Multer/Cloudinary upload error:', err.message, err.code);
            const msg = err.code === 'LIMIT_FILE_SIZE'
                ? 'File too large. Maximum allowed size is 30MB.'
                : err.message || 'File upload failed.';
            return res.status(400).json({ message: msg });
        });
    };
}

// ── Exported middleware ───────────────────────────────────────────────────────
exports.uploadArtwork = wrapMulter(multer({
    storage: makeCloudinaryStorage('artworks'),
    fileFilter: imageFilter,
    limits: { fileSize: 30 * 1024 * 1024 },
}).single('image'));

exports.uploadPractice = wrapMulter(multer({
    storage: makeCloudinaryStorage('practice'),
    fileFilter: imageFilter,
    limits: { fileSize: 20 * 1024 * 1024 },
}).single('image'));

exports.uploadProfile = wrapMulter(multer({
    storage: makeCloudinaryStorage('profiles'),
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single('profile_image'));

exports.uploadCourseAssets = wrapMulter(multer({
    storage: makeCloudinaryStorage('courses'),
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'thumbnail') return imageFilter(req, file, cb);
        if (file.fieldname === 'methods_doc') return docFilter(req, file, cb);
        cb(null, true);
    },
    limits: { fileSize: 50 * 1024 * 1024 },
}).fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'methods_doc', maxCount: 1 },
]));
