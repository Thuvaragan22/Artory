const express = require("express");
const router = express.Router();
const ctrl = require("./payment.controller");
const { verifyToken } = require("../../middleware/authMiddleware");

router.post("/create-artwork-checkout", verifyToken, ctrl.createArtworkCheckout);
router.post("/create-course-checkout",  verifyToken, ctrl.createCourseCheckout);
router.post("/create-plan-checkout",    verifyToken, ctrl.createPlanCheckout);

module.exports = router;
