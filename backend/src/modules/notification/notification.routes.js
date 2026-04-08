const express = require("express");
const router = express.Router();
const notificationController = require("./notification.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");

router.use(verifyToken);

router.get("/", notificationController.getNotifications);
router.put("/:id/read", notificationController.markAsRead);
router.put("/read-all", notificationController.markAllAsRead);

module.exports = router;
