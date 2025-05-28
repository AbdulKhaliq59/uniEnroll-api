const { register, login } = require('../../controllers/authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../../models/User');

describe('Auth Controller', () => {
    let mockUser;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock environment variable
        process.env.JWT_SECRET = 'test-secret';

        // Setup default mock user
        mockUser = {
            _id: 'mockUserId',
            email: 'test@example.com',
            password: 'hashedPassword',
            role: 'student',
            firstName: 'Test',
            lastName: 'User',
            matchPassword: jest.fn()
        };

        // Mock JWT
        jwt.sign.mockReturnValue('mock-token');

        // Mock bcrypt
        bcrypt.hash.mockResolvedValue('hashedPassword');
        bcrypt.compare.mockResolvedValue(true);
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

            // Mock User.findOne to return null (user doesn't exist)
            User.findOne.mockResolvedValue(null);

            // Mock User.create to return new user
            User.create.mockResolvedValue(mockUser);

            await register(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(User.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                role: 'student',
                firstName: 'Test',
                lastName: 'User',
                department: undefined
            });
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 'mockUserId', role: 'student' },
                'test-secret',
                { expiresIn: '30d' }
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-token'
            });
        });

        it('should not register with duplicate email', async () => {
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

            // Mock User.findOne to return existing user
            User.findOne.mockResolvedValue(mockUser);

            await register(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(User.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User already exists'
            });
        });

        it('should handle registration errors', async () => {
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

            const errorMessage = 'Database error';
            User.findOne.mockRejectedValue(new Error(errorMessage));

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: errorMessage
            });
        });
    });

    describe('login()', () => {
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

            // Mock user found and password matches
            mockUser.matchPassword.mockResolvedValue(true);
            User.findOne.mockResolvedValue(mockUser);

            await login(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockUser.matchPassword).toHaveBeenCalledWith('password123');
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 'mockUserId', role: 'student' },
                'test-secret',
                { expiresIn: '30d' }
            );
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-token'
            });
        });

        it('should reject invalid credentials - user not found', async () => {
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

            // Mock user not found
            User.findOne.mockResolvedValue(null);

            await login(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid credentials'
            });
        });

        it('should reject invalid credentials - wrong password', async () => {
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

            // Mock user found but password doesn't match
            mockUser.matchPassword.mockResolvedValue(false);
            User.findOne.mockResolvedValue(mockUser);

            await login(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockUser.matchPassword).toHaveBeenCalledWith('wrongpassword');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid credentials'
            });
        });

        it('should handle login errors', async () => {
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

            const errorMessage = 'Database error';
            User.findOne.mockRejectedValue(new Error(errorMessage));

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: errorMessage
            });
        });
    });
});