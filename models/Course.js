const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    creditHours: { type: Number, required: true },
    instructor: { type: String, required: true },
    schedule: {
        days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }],
        startTime: String, // e.g. "09:00"
        endTime: String
    },
    maxCapacity: { type: Number, required: true },
    currentEnrollment: { type: Number, default: 0 }
});

module.exports = mongoose.model('Course', CourseSchema);