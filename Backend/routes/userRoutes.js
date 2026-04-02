const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.js");
const { verifyToken } = require("../middleware/authMiddleware.js");
const multer = require("multer");
const path = require("path");

// Multer storage for profile pictures
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/profiles/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

router.get("/guides", userController.getGuides);
router.get("/public-profile/:id", userController.getPublicProfile);

// All routes below require authentication
router.use(verifyToken);

router.get("/profile", userController.getProfile);
router.put("/profile", upload.single("profile_image"), userController.updateProfile);

module.exports = router;
