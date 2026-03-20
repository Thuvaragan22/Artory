const express = require("express");
const router  = express.Router();
const {
  createArtwork,
  getAllArtworks,
  getArtworkById,
  updateArtwork,
  deleteArtwork,
} = require("../controllers/artworkController.js");
const { verifyToken }    = require("../middleware/authMiddleware.js");
const { authorizeRoles } = require("../middleware/roleMiddleware.js");

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/",    getAllArtworks);   // GET  /api/artworks
router.get("/:id", getArtworkById);  // GET  /api/artworks/:id

// ── Guide ─────────────────────────────────────────────────────────────────────
router.post("/",    verifyToken, authorizeRoles("guide"),         createArtwork);  // POST   /api/artworks
router.put("/:id",  verifyToken, authorizeRoles("guide", "admin"), updateArtwork); // PUT    /api/artworks/:id
router.delete("/:id", verifyToken, authorizeRoles("guide", "admin"), deleteArtwork); // DELETE /api/artworks/:id

module.exports = router;
