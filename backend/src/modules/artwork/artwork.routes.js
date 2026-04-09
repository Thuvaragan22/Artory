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
const { canSellArtwork } = require("../../middleware/planAccess.middleware.js");

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/", getAllArtworks);   // GET  /api/artworks
router.get("/:id", getArtworkById);  // GET  /api/artworks/:id

// ── Guide ─────────────────────────────────────────────────────────────────────
// POST — plan check only on new uploads marked for sale
router.post("/", verifyToken, authorizeRoles("guide"), uploadArtwork, (req, res, next) => {
  if (req.body.is_for_sale === 'true' || req.body.is_for_sale === true) {
    return canSellArtwork(req, res, next);
  }
  next();
}, createArtwork);

// PUT — no plan check on edit; owner already passed the plan gate when uploading
router.put("/:id", verifyToken, authorizeRoles("guide", "admin"), uploadArtwork, updateArtwork);

router.delete("/:id", verifyToken, authorizeRoles("guide", "admin"), deleteArtwork);

module.exports = router;
