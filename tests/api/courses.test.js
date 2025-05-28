const request = require('supertest');
const app = require('../../app');
const Course = require('../../models/Course');
const User = require('../../models/User');

describe('Courses API', () => {
    let adminToken;
    let adminUser;

    beforeAll(async () => {
        jest.setTimeout(30000);
        
        // Create admin user without calling save() again (mongoose create already saves)
        adminUser = await User.create({
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin'
        });

        // Login to get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'password123'
            });

        adminToken = loginRes.body.token;
    });

    // Clean up courses after each test to avoid conflicts
    afterEach(async () => {
        await Course.deleteMany({});
    });

    // Clean up all test data
    afterAll(async () => {
        await Course.deleteMany({});
        await User.deleteMany({});
    });

    describe('POST /api/courses', () => {
        it('should create a course with valid admin authentication', async () => {
            const courseData = {
                title: 'Advanced Testing',
                code: 'TEST401',
                department: 'Computer Science',
                creditHours: 3,
                instructor: 'Dr. Test',
                schedule: {
                    days: ['Tue', 'Thu'],
                    startTime: '13:00',
                    endTime: '14:15'
                },
                maxCapacity: 25
            };

            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(courseData);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.title).toBe('Advanced Testing');
            expect(res.body.code).toBe('TEST401');
        });

        it('should reject course creation without authentication', async () => {
            const courseData = {
                title: 'Unauthorized Course',
                code: 'UNAUTH101',
                department: 'Test',
                creditHours: 3,
                instructor: 'Dr. Test'
            };

            const res = await request(app)
                .post('/api/courses')
                .send(courseData);

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject course creation with invalid data', async () => {
            const invalidCourseData = {
                // Missing required fields like title, code
                department: 'Test'
            };

            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidCourseData);

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/courses', () => {
        beforeEach(async () => {
            // Create test courses
            await Course.create([
                {
                    title: 'Course 1',
                    code: 'CRS101',
                    department: 'Testing',
                    creditHours: 3,
                    instructor: 'Dr. One'
                },
                {
                    title: 'Course 2',
                    code: 'CRS102',
                    department: 'Testing',
                    creditHours: 4,
                    instructor: 'Dr. Two'
                }
            ]);
        });

        it('should get all courses without authentication', async () => {
            const res = await request(app)
                .get('/api/courses');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toHaveProperty('title');
            expect(res.body[0]).toHaveProperty('code');
        });
    });

    describe('GET /api/courses/:id', () => {
        let courseId;

        beforeEach(async () => {
            const course = await Course.create({
                title: 'Single Course',
                code: 'SINGLE101',
                department: 'Testing',
                creditHours: 3,
                instructor: 'Dr. Single'
            });
            courseId = course._id;
        });

        it('should get a single course by ID', async () => {
            const res = await request(app)
                .get(`/api/courses/${courseId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.title).toBe('Single Course');
        });

        it('should return 404 for non-existent course', async () => {
            const fakeId = new require('mongoose').Types.ObjectId();
            const res = await request(app)
                .get(`/api/courses/${fakeId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('message', 'Course not found');
        });
    });

    describe('PUT /api/courses/:id', () => {
        let courseId;

        beforeEach(async () => {
            const course = await Course.create({
                title: 'Update Course',
                code: 'UPDATE101',
                department: 'Testing',
                creditHours: 3,
                instructor: 'Dr. Update'
            });
            courseId = course._id;
        });

        it('should update course with admin authentication', async () => {
            const updateData = {
                title: 'Updated Course Title',
                creditHours: 4
            };

            const res = await request(app)
                .put(`/api/courses/${courseId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('Updated Course Title');
            expect(res.body.creditHours).toBe(4);
        });

        it('should reject update without authentication', async () => {
            const res = await request(app)
                .put(`/api/courses/${courseId}`)
                .send({ title: 'Unauthorized Update' });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('DELETE /api/courses/:id', () => {
        let courseId;

        beforeEach(async () => {
            const course = await Course.create({
                title: 'Delete Course',
                code: 'DELETE101',
                department: 'Testing',
                creditHours: 3,
                instructor: 'Dr. Delete'
            });
            courseId = course._id;
        });

        it('should delete course with admin authentication', async () => {
            const res = await request(app)
                .delete(`/api/courses/${courseId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message', 'Course removed');

            // Verify course is actually deleted
            const deletedCourse = await Course.findById(courseId);
            expect(deletedCourse).toBeNull();
        });

        it('should reject delete without authentication', async () => {
            const res = await request(app)
                .delete(`/api/courses/${courseId}`);

            expect(res.statusCode).toBe(401);
        });

        it('should return 404 when deleting non-existent course', async () => {
            const fakeId = new require('mongoose').Types.ObjectId();
            const res = await request(app)
                .delete(`/api/courses/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('message', 'Course not found');
        });
    });
});