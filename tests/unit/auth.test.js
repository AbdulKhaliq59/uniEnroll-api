const { register, login } = require('../../controllers/authController');
const User = require('../../models/User');

describe('Auth Controller', () => {
    afterEach(async () => {
        await User.deleteMany();
    });

    describe('register()', () => {
        it('should register a new user', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'password123',
                    firstName: 'Test',
                    lastName: 'User'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: expect.any(String)
            }));
        });

        it('should not register with duplicate email', async () => {
            await User.create({
                email: 'test@example.com',
                password: 'password123'
            });

            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User already exists'
            });
        });
    });

    describe('login()', () => {
        beforeEach(async () => {
            await User.create({
                email: 'test@example.com',
                password: 'password123'
            });
        });

        it('should login with valid credentials', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: expect.any(String)
            }));
        });

        it('should reject invalid credentials', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'wrongpassword'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid credentials'
            });
        });
    });
});