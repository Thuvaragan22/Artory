const express = require("express");
const router = express.Router();
const {
  createArtwork,
  getAllArtworks,
  getArtworkById,
  updateArtwork,
  deleteArtwork,
} = require("./artwork.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");
const { authorizeRoles } = require("../../middleware/roleMiddleware.js");
const { uploadArtwork } = require("../../middleware/upload.js");

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/", getAllArtworks);   // GET  /api/artworks
router.get("/:id", getArtworkById);  // GET  /api/artworks/:id

// ── Guide ─────────────────────────────────────────────────────────────────────
router.post("/", verifyToken, authorizeRoles("guide"), uploadArtwork, createArtwork);          // POST   /api/artworks
router.put("/:id", verifyToken, authorizeRoles("guide", "admin"), uploadArtwork, updateArtwork);                // PUT    /api/artworks/:id

router.delete("/:id", verifyToken, authorizeRoles("guide", "admin"), deleteArtwork);              // DELETE /api/artworks/:id

module.exports = router;
