const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController.js');
const { verifyToken } = require('../middleware/authMiddleware.js');
const { authorizeRoles } = require('../middleware/roleMiddleware.js');

router.use(verifyToken);

router.post('/', authorizeRoles('learner'), paymentController.createPayment);
router.get('/:id', authorizeRoles('admin'), paymentController.getPaymentById);

module.exports = router;
