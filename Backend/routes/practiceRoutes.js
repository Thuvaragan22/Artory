const express = require("express");
const router  = express.Router();
const {
  createPractice,
  getMyPractice,
  deletePractice,
  updatePractice,
} = require("../controllers/practiceController.js");
const { verifyToken }    = require("../middleware/authMiddleware.js");
const { authorizeRoles } = require("../middleware/roleMiddleware.js");

// All practice routes require a logged-in Learner
router.post("/",     verifyToken, authorizeRoles("learner"), createPractice);   // POST   /api/practice
router.get("/",      verifyToken, authorizeRoles("learner"), getMyPractice);    // GET    /api/practice
router.delete("/:id",verifyToken, authorizeRoles("learner"), deletePractice);   // DELETE /api/practice/:id
router.put("/:id",   verifyToken, authorizeRoles("learner"), updatePractice);   // PUT    /api/practice/:id

module.exports = router;
