const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, department } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            email,
            password,
            role: role || 'student',
            firstName,
            lastName,
            department
        });

        const token = generateToken(user._id, user.role);
        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id, user.role);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

function generateToken(userId, role) {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
}