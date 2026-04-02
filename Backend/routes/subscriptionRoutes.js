const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController.js");
const { verifyToken } = require("../middleware/authMiddleware.js");

// Public (to see plans)
router.get("/plans", subscriptionController.getPlans);

// Private (auth required)
router.use(verifyToken);
router.get("/my", subscriptionController.getMySubscription);
router.post("/subscribe", subscriptionController.subscribe);

module.exports = router;
