const request = require('supertest');
const app = require('../../app');
const Course = require('../../models/Course');
const User = require('../../models/User');
const Enrollment = require('../../models/Enrollment');

describe('Enrollment API', () => {
    let studentToken, adminToken, courseId;

    beforeAll(async () => {
        // Create test users
        const [student, admin] = await Promise.all([
            User.create({
                email: 'student@example.com',
                password: 'password123',
                role: 'student',
                firstName: 'Test',
                lastName: 'Student'
            }),
            User.create({
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin'
            })
        ]);

        // Create test course
        const course = await Course.create({
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

        courseId = course._id;

        // Get tokens
        const [studentLogin, adminLogin] = await Promise.all([
            request(app)
                .post('/api/auth/login')
                .send({
                    email: 'student@example.com',
                    password: 'password123'
                }),
            request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'password123'
                })
        ]);

        studentToken = studentLogin.body.token;
        adminToken = adminLogin.body.token;
    });

    afterEach(async () => {
        await Enrollment.deleteMany();
    });

    afterAll(async () => {
        await Promise.all([
            Course.deleteMany(),
            User.deleteMany()
        ]);
    });

    describe('POST /api/enroll', () => {
        it('should enroll student in course', async () => {
            const res = await request(app)
                .post('/api/enroll')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.student).toBeDefined();
            expect(res.body.course).toEqual(courseId.toString());
        });

        it('should prevent duplicate enrollment', async () => {
            // First enrollment
            await request(app)
                .post('/api/enroll')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId });

            // Second enrollment attempt
            const res = await request(app)
                .post('/api/enroll')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toEqual('Already enrolled in this course');
        });
    });

    describe('GET /api/enroll/student', () => {
        it('should get student enrollments', async () => {
            // Enroll student first
            await request(app)
                .post('/api/enroll')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId });

            const res = await request(app)
                .get('/api/enroll/student')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toEqual(1);
            expect(res.body[0].course.title).toEqual('Test Course');
        });
    });

    describe('GET /api/enroll/course/:courseId', () => {
        it('should get course enrollments (admin only)', async () => {
            // Enroll student first
            await request(app)
                .post('/api/enroll')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId });

            const res = await request(app)
                .get(`/api/enroll/course/${courseId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toEqual(1);
            expect(res.body[0].student.firstName).toEqual('Test');
        });

        it('should reject non-admin access', async () => {
            const res = await request(app)
                .get(`/api/enroll/course/${courseId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.statusCode).toEqual(403);
        });
    });
});