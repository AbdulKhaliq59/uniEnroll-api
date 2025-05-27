const Enrollment = require('../models/Enrollment');

async function checkEnrollmentStatus(studentId, courseId) {
    const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId
    });
    return !!enrollment;
}

async function getEnrolledStudents(courseId) {
    const enrollments = await Enrollment.find({ course: courseId })
        .populate('student', 'firstName lastName email');
    return enrollments;
}

module.exports = {
    checkEnrollmentStatus,
    getEnrolledStudents
};