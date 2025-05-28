const { enroll, dropCourse, getStudentCourses, getCourseEnrollments } = require('../../controllers/enrollmentController');
const Enrollment = require('../../models/Enrollment');
const Course = require('../../models/Course');
const User = require('../../models/User');
const hasScheduleConflict = require('../../utils/scheduleConflict');

// Mock dependencies
jest.mock('../../models/Enrollment');
jest.mock('../../models/Course');
jest.mock('../../models/User');
jest.mock('../../utils/scheduleConflict');

describe('Enrollment Controller', () => {
    let mockStudent, mockCourse, mockEnrollment;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup mock data
        mockStudent = {
            _id: 'student123',
            email: 'student@example.com',
            role: 'student',
            firstName: 'Test',
            lastName: 'Student'
        };

        mockCourse = {
            _id: 'course123',
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
            maxCapacity: 30,
            currentEnrollment: 5,
            save: jest.fn().mockResolvedValue(true)
        };

        mockEnrollment = {
            _id: 'enrollment123',
            student: 'student123',
            course: 'course123',
            enrollmentDate: new Date()
        };
    });

    describe('enroll()', () => {
        it('should enroll student in course', async () => {
            const req = {
                body: { courseId: 'course123' },
                user: { _id: 'student123' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            // Setup mocks
            User.findById.mockResolvedValue(mockStudent);
            Course.findById.mockResolvedValue(mockCourse);
            Enrollment.findOne.mockResolvedValue(null); // No existing enrollment
            hasScheduleConflict.mockResolvedValue(false); // No conflict
            Enrollment.create.mockResolvedValue(mockEnrollment);

            await enroll(req, res);

            expect(User.findById).toHaveBeenCalledWith('student123');
            expect(Course.findById).toHaveBeenCalledWith('course123');
            expect(Enrollment.findOne).toHaveBeenCalledWith({
                student: 'student123',
                course: 'course123'
            });
            expect(hasScheduleConflict).toHaveBeenCalledWith('student123', 'course123');
            expect(Enrollment.create).toHaveBeenCalledWith({
                student: 'student123',
                course: 'course123'
            });
            expect(mockCourse.save).toHaveBeenCalled();
            expect(mockCourse.currentEnrollment).toBe(6);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockEnrollment);
        });

        it('should reject non-student users', async () => {
            const req = {
                body: { courseId: 'course123' },
                user: { _id: 'admin123' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockAdmin = { ...mockStudent, role: 'admin' };
            User.findById.mockResolvedValue(mockAdmin);

            await enroll(req, res);

            expect(User.findById).toHaveBeenCalledWith('admin123');
            expect(Course.findById).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Only students can enroll'
            });
        });

        it('should return 404 when course not found', async () => {
            const req = {
                body: { courseId: 'nonexistent123' },
                user: { _id: 'student123' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            User.findById.mockResolvedValue(mockStudent);
            Course.findById.mockResolvedValue(null);

            await enroll(req, res);

            expect(Course.findById).toHaveBeenCalledWith('nonexistent123');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course not found'
            });
        });

        it('should prevent duplicate enrollment', async () => {
            const req = {
                body: { courseId: 'course123' },
                user: { _id: 'student123' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            User.findById.mockResolvedValue(mockStudent);
            Course.findById.mockResolvedValue(mockCourse);
            Enrollment.findOne.mockResolvedValue(mockEnrollment); // Existing enrollment

            await enroll(req, res);

            expect(Enrollment.findOne).toHaveBeenCalledWith({
                student: 'student123',
                course: 'course123'
            });
            expect(Enrollment.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Already enrolled in this course'
            });
        });

        it('should prevent enrollment when course is full', async () => {
            const req = {
                body: { courseId: 'course123' },
                user: { _id: 'student123' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const fullCourse = { ...mockCourse, currentEnrollment: 30, maxCapacity: 30 };
            User.findById.mockResolvedValue(mockStudent);
            Course.findById.mockResolvedValue(fullCourse);

            await enroll(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course is full'
            });
        });

        it('should detect schedule conflicts', async () => {
            const req = {
                body: { courseId: 'course123' },
                user: { _id: 'student123' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            User.findById.mockResolvedValue(mockStudent);
            Course.findById.mockResolvedValue(mockCourse);
            Enrollment.findOne.mockResolvedValue(null);
            hasScheduleConflict.mockResolvedValue(true); // Conflict detected

            await enroll(req, res);

            expect(hasScheduleConflict).toHaveBeenCalledWith('student123', 'course123');
            expect(Enrollment.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Schedule conflict detected'
            });
        });

        it('should handle errors gracefully', async () => {
            const req = {
                body: { courseId: 'course123' },
                user: { _id: 'student123' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const errorMessage = 'Database error';
            User.findById.mockRejectedValue(new Error(errorMessage));

            await enroll(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: errorMessage
            });
        });
    });

    describe('dropCourse()', () => {
        it('should drop course successfully', async () => {
            const req = {
                params: { id: 'enrollment123' },
                user: { userId: 'student123' }
            };
            const res = {
                json: jest.fn()
            };

            Enrollment.findOneAndDelete.mockResolvedValue(mockEnrollment);
            Course.findByIdAndUpdate.mockResolvedValue(true);

            await dropCourse(req, res);

            expect(Enrollment.findOneAndDelete).toHaveBeenCalledWith({
                _id: 'enrollment123',
                student: 'student123'
            });
            expect(Course.findByIdAndUpdate).toHaveBeenCalledWith('course123', {
                $inc: { currentEnrollment: -1 }
            });
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course dropped successfully'
            });
        });

        it('should return 404 when enrollment not found', async () => {
            const req = {
                params: { id: 'nonexistent123' },
                user: { userId: 'student123' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            Enrollment.findOneAndDelete.mockResolvedValue(null);

            await dropCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Enrollment not found'
            });
        });
    });

    describe('getStudentCourses()', () => {
        it('should return student enrollments', async () => {
            const req = {
                user: { userId: 'student123' }
            };
            const res = {
                json: jest.fn()
            };

            const mockEnrollments = [
                {
                    ...mockEnrollment,
                    course: {
                        title: 'Test Course',
                        code: 'TEST101',
                        instructor: 'Dr. Test',
                        schedule: mockCourse.schedule
                    }
                }
            ];

            const mockFind = {
                populate: jest.fn().mockResolvedValue(mockEnrollments)
            };
            Enrollment.find.mockReturnValue(mockFind);

            await getStudentCourses(req, res);

            expect(Enrollment.find).toHaveBeenCalledWith({ student: 'student123' });
            expect(mockFind.populate).toHaveBeenCalledWith('course', 'title code instructor schedule');
            expect(res.json).toHaveBeenCalledWith(mockEnrollments);
        });
    });

    describe('getCourseEnrollments()', () => {
        it('should return course enrollments', async () => {
            const req = {
                params: { courseId: 'course123' }
            };
            const res = {
                json: jest.fn()
            };

            const mockEnrollments = [
                {
                    ...mockEnrollment,
                    student: {
                        firstName: 'Test',
                        lastName: 'Student',
                        email: 'student@example.com'
                    }
                }
            ];

            const mockFind = {
                populate: jest.fn().mockResolvedValue(mockEnrollments)
            };
            Enrollment.find.mockReturnValue(mockFind);

            await getCourseEnrollments(req, res);

            expect(Enrollment.find).toHaveBeenCalledWith({ course: 'course123' });
            expect(mockFind.populate).toHaveBeenCalledWith('student', 'firstName lastName email');
            expect(res.json).toHaveBeenCalledWith(mockEnrollments);
        });
    });
});