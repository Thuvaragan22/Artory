const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController.js');
const { verifyToken } = require('../middleware/authMiddleware.js');
const { authorizeRoles } = require('../middleware/roleMiddleware.js');

router.use(verifyToken);

router.post('/', authorizeRoles('learner'), orderController.createOrder);
router.get('/', orderController.getOrders);
router.put('/:id/status', authorizeRoles('guide', 'admin'), orderController.updateOrderStatus);

module.exports = router;
