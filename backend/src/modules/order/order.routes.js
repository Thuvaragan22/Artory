const express = require("express");
const router = express.Router();
const orderController = require("./order.controller.js");
const paymentController = require("./payment.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");
const { authorizeRoles } = require("../../middleware/roleMiddleware.js");

// All order routes require authentication
router.use(verifyToken);

// Learner routes
router.post("/", authorizeRoles("learner"), orderController.createOrder);
router.get("/me", authorizeRoles("learner"), orderController.getMyOrders);
router.post("/payments", authorizeRoles("learner"), paymentController.createPayment);

// Admin routes
router.get("/", authorizeRoles("admin"), orderController.getOrders);
router.patch("/:id", authorizeRoles("admin"), orderController.updateOrderStatus);
router.get("/payments", authorizeRoles("admin"), paymentController.getPayments);

module.exports = router;
