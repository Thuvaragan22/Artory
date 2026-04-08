const express = require("express");
const router = express.Router();
const paymentController = require("./payment.controller.js");
const paymentWebhook = require("./payment.webhook.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");
const { authorizeRoles } = require("../../middleware/roleMiddleware.js");

router.use(verifyToken);

router.post("/", authorizeRoles("learner"), paymentController.createPayment);
router.get("/", authorizeRoles("admin"), paymentController.getPayments);

module.exports = router;
