const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

async function hasScheduleConflict(studentId, newCourseId) {
    // Get new course schedule
    const newCourse = await Course.findById(newCourseId);
    if (!newCourse) return false;

    // Get all enrolled courses for the student
    const enrollments = await Enrollment.find({ student: studentId }).populate('course');

    // Check for conflicts
    for (const enrollment of enrollments) {
        const existingCourse = enrollment.course;

        // Check if any day overlaps
        const dayConflict = existingCourse.schedule.days.some(day =>
            newCourse.schedule.days.includes(day)
        );

        if (dayConflict) {
            // Check time overlap
            const existingStart = existingCourse.schedule.startTime;
            const existingEnd = existingCourse.schedule.endTime;
            const newStart = newCourse.schedule.startTime;
            const newEnd = newCourse.schedule.endTime;

            if ((newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)) {
                return true;
            }
        }
    }

    return false;
}

module.exports = hasScheduleConflict;