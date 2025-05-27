const { enroll } = require('../../controllers/enrollmentController');
const Enrollment = require('../../models/Enrollment');
const Course = require('../../models/Course');
const User = require('../../models/User');

describe('Enrollment Controller', () => {
    let student, course;

    beforeEach(async () => {
        // Create test student
        student = await User.create({
            email: 'student@example.com',
            password: 'password123',
            role: 'student',
            firstName: 'Test',
            lastName: 'Student'
        });

        // Create test course
        course = await Course.create({
            title: 'Test Course',
            code: 'TEST101',
            department: 'Testing',
            creditHours: 3,
            instructor: 'Dr. Test',
            schedule: {
                days: ['Mon', 'Wed'],
                startTime: '10:00',
                endTime: '11:00'
            },
            maxCapacity: 30
        });
    });

    afterEach(async () => {
        await Enrollment.deleteMany();
        await Course.deleteMany();
        await User.deleteMany();
    });

    describe('enroll()', () => {
        it('should enroll student in course', async () => {
            const req = {
                body: { courseId: course._id },
                user: { userId: student._id }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await enroll(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                _id: expect.any(String),
                student: student._id,
                course: course._id
            }));
        });

        it('should prevent duplicate enrollment', async () => {
            await Enrollment.create({
                student: student._id,
                course: course._id
            });

            const req = {
                body: { courseId: course._id },
                user: { userId: student._id }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await enroll(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Already enrolled in this course'
            });
        });

        it('should prevent enrollment when course is full', async () => {
            // Set course to full capacity
            course.maxCapacity = 1;
            course.currentEnrollment = 1;
            await course.save();

            const req = {
                body: { courseId: course._id },
                user: { userId: student._id }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await enroll(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course is full'
            });
        });

        it('should detect schedule conflicts', async () => {
            // Create conflicting course
            const conflictingCourse = await Course.create({
                title: 'Conflicting Course',
                code: 'CONFLICT101',
                department: 'Testing',
                creditHours: 3,
                instructor: 'Dr. Conflict',
                schedule: {
                    days: ['Mon'],
                    startTime: '10:30',
                    endTime: '11:30'
                },
                maxCapacity: 30
            });

            // Enroll in first course
            await Enrollment.create({
                student: student._id,
                course: course._id
            });

            // Try to enroll in conflicting course
            const req = {
                body: { courseId: conflictingCourse._id },
                user: { userId: student._id }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await enroll(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Schedule conflict detected'
            });
        });
    });
});