const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, editUser, deleteUser } = require("./admin.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");
const { authorizeRoles } = require("../../middleware/roleMiddleware.js");

// All routes here require a valid token + admin role
router.use(verifyToken, authorizeRoles("admin"));

router.get("/users",        getAllUsers);
router.get("/users/:id",    getUserById);
router.put("/users/:id",    editUser);
router.delete("/users/:id", deleteUser);

module.exports = router;