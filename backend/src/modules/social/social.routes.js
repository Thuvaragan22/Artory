const express = require("express");
const router = express.Router();
const socialController = require("./social.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");

// Public
router.get("/comments/:artworkId", socialController.getComments);

// Private
router.use(verifyToken);
router.post("/like/:artworkId", socialController.toggleLike);
router.post("/comment/:artworkId", socialController.addComment);

module.exports = router;
