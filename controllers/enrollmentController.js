const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const hasScheduleConflict = require('../utils/scheduleConflict');

// @desc    Enroll in a course
// @route   POST /api/enroll
// @access  Private
exports.enroll = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user._id;
        
        // Check if user is a student
        const user = await User.findById(studentId);
        if (user.role !== 'student') {
            return res.status(400).json({ message: 'Only students can enroll' });
        }
        
        // Check if course exists and has capacity
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.currentEnrollment >= course.maxCapacity) {
            return res.status(400).json({ message: 'Course is full' });
        }

        // Check for duplicate enrollment
        const existingEnrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId
        });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        // Check for schedule conflicts
        if (await hasScheduleConflict(studentId, courseId)) {
            return res.status(400).json({ message: 'Schedule conflict detected' });
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            student: studentId,
            course: courseId
        });

        // Update course enrollment count
        course.currentEnrollment += 1;
        await course.save();

        res.status(201).json(enrollment);
    } catch (error) {
        
        res.status(500).json({ message: error.message });
    }
};

// @desc    Drop a course
// @route   DELETE /api/enroll/:id
// @access  Private
exports.dropCourse = async (req, res) => {
    try {
        const enrollment = await Enrollment.findOneAndDelete({
            _id: req.params.id,
            student: req.user.userId
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // Update course enrollment count
        await Course.findByIdAndUpdate(enrollment.course, {
            $inc: { currentEnrollment: -1 }
        });

        res.json({ message: 'Course dropped successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's enrolled courses
// @route   GET /api/enroll/student
// @access  Private
exports.getStudentCourses = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user.userId })
            .populate('course', 'title code instructor schedule');
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get students enrolled in a course (Admin only)
// @route   GET /api/enroll/course/:courseId
// @access  Private/Admin
exports.getCourseEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ course: req.params.courseId })
            .populate('student', 'firstName lastName email');
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};