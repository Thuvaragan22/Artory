const express = require("express");
const router = express.Router();
const ctrl = require("./subscription.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");

router.get("/plans", ctrl.getPlans);
router.post("/activate-free", verifyToken, ctrl.activateFreePlan);
router.post("/create-checkout-session", verifyToken, ctrl.createCheckoutSession);
router.get("/me", verifyToken, ctrl.getMySubscription);
router.post("/cancel", verifyToken, ctrl.cancelSubscription);

module.exports = router;
