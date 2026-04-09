const express = require("express");
const router = express.Router();
const orderController = require("./order.controller.js");
const paymentController = require("./payment.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");
const { authorizeRoles } = require("../../middleware/roleMiddleware.js");

// All order routes require authentication
router.use(verifyToken);

// Learner + Guide can create orders (buy artworks/courses)
router.post("/", authorizeRoles("learner", "guide"), orderController.createOrder);
router.get("/me", authorizeRoles("learner", "guide"), orderController.getMyOrders);
router.post("/payments", authorizeRoles("learner", "guide"), paymentController.createPayment);

// Admin routes
router.get("/", authorizeRoles("admin"), orderController.getOrders);
router.patch("/:id", authorizeRoles("admin"), orderController.updateOrderStatus);
router.get("/payments", authorizeRoles("admin"), paymentController.getPayments);

module.exports = router;
