const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController.js');
const { verifyToken } = require('../middleware/authMiddleware.js');
const { authorizeRoles } = require('../middleware/roleMiddleware.js');
const { uploadCourseAssets } = require('../middleware/upload.js');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/', courseController.getAllCourses);

// ── Authenticated Routes ───────────────────────────────────────────────────────
router.use(verifyToken);

// Role-based routes
router.get('/enrollments', authorizeRoles('guide', 'learner'), courseController.getEnrollments);
router.put('/enrollments/:id', authorizeRoles('guide'), courseController.updateEnrollmentStatus);

router.post('/', authorizeRoles('guide'), uploadCourseAssets, courseController.createCourse);
router.put('/:id', authorizeRoles('guide'), uploadCourseAssets, courseController.updateCourse);
router.post('/:id/enroll', authorizeRoles('learner'), courseController.enrollCourse);

router.get('/:id', courseController.getCourseById);

module.exports = router;
