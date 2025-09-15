import User from "../models/users.models.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const userController = {
    // User registration (signup) - Optimized for performance
    signup: async (req, res) => {
        const startTime = Date.now(); // Performance tracking

        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        try {
            // ✅ Single query with $or operator (faster than separate queries)
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(409).json({ message: "User already exists with this email" });
                } else {
                    return res.status(409).json({ message: "Username already taken" });
                }
            }

            // ✅ Direct hash with optimal rounds (faster than genSalt + hash)
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create a new user
            const newUser = new User({
                username,
                email,
                password: hashedPassword
            });

            await newUser.save();

            const endTime = Date.now();
            console.log(`Signup completed in: ${endTime - startTime}ms`); // Performance log

            res.status(201).json({
                message: "User registered successfully",
                success: true
            });

        } catch (error) {
            console.error('Signup error:', error);

            // ✅ Handle duplicate key error specifically
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                return res.status(409).json({
                    message: `${field} already exists`
                });
            }

            res.status(500).json({ message: "Internal server error" });
        }
    },

    // User login - Also optimized
    login: async (req, res) => {
        const startTime = Date.now();

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        try {
            // ✅ Find user by email (will be fast with index)
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            // ✅ Compare passwords
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            // ✅ Create JWT token
            const token = jwt.sign(
                { id: user._id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' } // Extended for better UX
            );

            const endTime = Date.now();
            console.log(`Login completed in: ${endTime - startTime}ms`);

            res.status(200).json({
                message: "Logged in successfully",
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    balance: user.balance
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // ✅ Additional utility method for getting user profile
    getProfile: async (req, res) => {
        try {
            // Check if authentication middleware ran and set req.user
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    message: "Authentication required. Please provide a valid token.",
                    success: false
                });
            }

            const userId = req.user.id;
            const user = await User.findById(userId).select('-password');

            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                    success: false
                });
            }

            res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    balance: user.balance,
                    createdAt: user.createdAt
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                message: "Internal server error",
                success: false
            });
        }
    }
};

export default userController;