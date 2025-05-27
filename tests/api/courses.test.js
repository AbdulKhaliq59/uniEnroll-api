const request = require('supertest');
const app = require('../../app');
const Course = require('../../models/Course');
const User = require('../../models/User');

describe('Courses API', () => {
    let adminToken;

    beforeAll(async () => {
        // Create admin user and get token
        jest.setTimeout(30000); // Set timeout for slow tests
        const admin = await User.create({
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin'
        });
        await admin.save();

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'password123'
            });

        adminToken = loginRes.body.token;
    });

    afterEach(async () => {
        await Course.deleteMany();
    });

    afterAll(async () => {
        await User.deleteMany();
    });

    describe('POST /api/courses', () => {
        it('should create a new course (admin)', async () => {
            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
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
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.title).toEqual('Advanced Testing');
        });

        it('should not create course without authentication', async () => {
            const res = await request(app)
                .post('/api/courses')
                .send({
                    title: 'Unauthorized Course',
                    code: 'UNAUTH101',
                    department: 'Unauthorized',
                    creditHours: 3,
                    instructor: 'Dr. Unauthorized',
                    schedule: {
                        days: ['Mon'],
                        startTime: '09:00',
                        endTime: '10:00'
                    },
                    maxCapacity: 10
                });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/courses', () => {
        beforeEach(async () => {
            await Course.create([
                {
                    title: 'Course 1',
                    code: 'CRS101',
                    department: 'Testing',
                    creditHours: 3,
                    instructor: 'Dr. One',
                    schedule: {
                        days: ['Mon', 'Wed'],
                        startTime: '09:00',
                        endTime: '10:00'
                    },
                    maxCapacity: 30
                },
                {
                    title: 'Course 2',
                    code: 'CRS102',
                    department: 'Testing',
                    creditHours: 4,
                    instructor: 'Dr. Two',
                    schedule: {
                        days: ['Tue', 'Thu'],
                        startTime: '11:00',
                        endTime: '12:30'
                    },
                    maxCapacity: 25
                }
            ]);
        });

        it('should get all courses', async () => {
            const res = await request(app)
                .get('/api/courses');

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toEqual(2);
            expect(res.body[0]).toHaveProperty('title');
            expect(res.body[1]).toHaveProperty('code');
        });
    });
});