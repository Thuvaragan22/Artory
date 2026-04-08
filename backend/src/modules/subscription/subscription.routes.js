const express = require("express");
const router = express.Router();
const subscriptionController = require("./subscription.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");

router.get("/plans", subscriptionController.getPlans);
router.post("/subscribe", verifyToken, subscriptionController.subscribe);

module.exports = router;
