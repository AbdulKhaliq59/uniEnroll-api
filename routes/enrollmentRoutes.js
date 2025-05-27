const express = require('express');
const {
    enroll,
    dropCourse,
    getStudentCourses,
    getCourseEnrollments
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const router = express.Router();

router.post('/', protect, enroll);
router.delete('/:id', protect, dropCourse);
router.get('/student', protect, getStudentCourses);
router.get('/course/:courseId', protect, authorize('admin'), getCourseEnrollments);

module.exports = router;