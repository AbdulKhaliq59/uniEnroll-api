const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Auth API Integration Tests', () => {
    beforeAll(async () => {
        jest.setTimeout(30000); // Set timeout for slow tests

        // Ensure JWT_SECRET is set for tests
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = 'test-jwt-secret-key';
        }
    });

    afterEach(async () => {
        // Clean up test data after each test
        await User.deleteMany();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user with complete data', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
                department: 'Computer Science'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(typeof res.body.token).toBe('string');

            // Verify token is valid
            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
            expect(decoded).toHaveProperty('userId');
            expect(decoded).toHaveProperty('role');
            expect(decoded.role).toBe('student'); // Default role

            // Verify user was created in database
            const user = await User.findOne({ email: userData.email });
            expect(user).toBeTruthy();
            expect(user.firstName).toBe(userData.firstName);
            expect(user.lastName).toBe(userData.lastName);
            expect(user.role).toBe('student');
        });

        it('should handle server errors gracefully', async () => {
            // Mock User.findOne to throw an error
            const originalFindOne = User.findOne;
            User.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

            const userData = {
                email: 'error@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toEqual(500);
            expect(res.body.message).toBe('Database connection failed');

            // Restore original method
            User.findOne = originalFindOne;
        });
    });

    describe('POST /api/auth/login', () => {
        let testUser;

        beforeEach(async () => {
            // Create a test user before each login test
            testUser = await User.create({
                email: 'login@example.com',
                password: 'password123',
                firstName: 'Login',
                lastName: 'User',
                role: 'student'
            });
        });

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(typeof res.body.token).toBe('string');

            // Verify token contains correct user info
            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
            expect(decoded.userId).toBe(testUser._id.toString());
            expect(decoded.role).toBe('student');
        });

        it('should login admin user', async () => {
            const adminUser = await User.create({
                email: 'admin@example.com',
                password: 'adminpass123',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin'
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'adminpass123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');

            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
            expect(decoded.role).toBe('admin');
        });

        it('should not login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Invalid credentials');
        });

        it('should not login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Invalid credentials');
        });

        it('should not login with missing credentials', async () => {
            const testCases = [
                { email: 'login@example.com' }, // Missing password
                { password: 'password123' }, // Missing email
                {} // Missing both
            ];

            for (const credentials of testCases) {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send(credentials);

                expect(res.statusCode).toBeGreaterThanOrEqual(400);
            }
        });

        it('should handle server errors during login', async () => {
            // Mock User.findOne to throw an error
            const originalFindOne = User.findOne;
            User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(500);
            expect(res.body.message).toBe('Database error');

            // Restore original method
            User.findOne = originalFindOne;
        });
    });

    describe('Authentication Flow Integration', () => {
        it('should register and then login with same credentials', async () => {
            const userData = {
                email: 'flow@example.com',
                password: 'password123',
                firstName: 'Flow',
                lastName: 'User'
            };

            // Register
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(registerRes.statusCode).toEqual(201);
            const registerToken = registerRes.body.token;

            // Login with same credentials
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                });

            expect(loginRes.statusCode).toEqual(200);
            const loginToken = loginRes.body.token;

            // Both tokens should be valid and contain same user ID
            const registerDecoded = jwt.verify(registerToken, process.env.JWT_SECRET);
            const loginDecoded = jwt.verify(loginToken, process.env.JWT_SECRET);

            expect(registerDecoded.userId).toBe(loginDecoded.userId);
            expect(registerDecoded.role).toBe(loginDecoded.role);
        });

        it('should maintain password hashing integrity', async () => {
            const userData = {
                email: 'hash@example.com',
                password: 'plainTextPassword',
                firstName: 'Hash',
                lastName: 'User'
            };

            // Register user
            await request(app)
                .post('/api/auth/register')
                .send(userData);

            // Check that password is hashed in database
            const user = await User.findOne({ email: userData.email });
            expect(user.password).not.toBe(userData.password);
            expect(user.password.length).toBeGreaterThan(20); // Hashed passwords are longer

            // Verify login still works with original password
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                });

            expect(loginRes.statusCode).toEqual(200);
        });
    });
});