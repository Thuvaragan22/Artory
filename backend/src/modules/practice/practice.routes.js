const express = require("express");
const router = express.Router();
const {
  createPractice,
  getMyPractice,
  getPracticeById,
  deletePractice,

  updatePractice,
} = require("./practice.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");
const { authorizeRoles } = require("../../middleware/roleMiddleware.js");
const { uploadPractice } = require("../../middleware/upload.js");
const { canUploadPractice } = require("../../middleware/planAccess.middleware.js");

// All practice routes require a logged-in Learner
router.post("/", verifyToken, authorizeRoles("learner"), canUploadPractice, uploadPractice, createPractice); // POST   /api/practice
router.get("/", verifyToken, authorizeRoles("learner"), getMyPractice);                  // GET    /api/practice
router.get("/:id", verifyToken, authorizeRoles("learner"), getPracticeById);                 // GET    /api/practice/:id
router.delete("/:id", verifyToken, authorizeRoles("learner"), deletePractice);                 // DELETE /api/practice/:id

router.put("/:id", verifyToken, authorizeRoles("learner"), uploadPractice, updatePractice);                 // PUT    /api/practice/:id


module.exports = router;
