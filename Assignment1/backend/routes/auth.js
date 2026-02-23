import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Participant Registration
router.post('/register/participant',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('participantType').isIn(['iiit', 'non-iiit']).withMessage('Invalid participant type'),
    body('collegeName').optional(),
    body('contactNumber')
      .notEmpty().withMessage('Contact number is required')
      .isLength({ min: 10, max: 10 }).withMessage('Contact number must be exactly 10 digits')
      .isNumeric().withMessage('Contact number must contain only digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, firstName, lastName, participantType, collegeName, contactNumber, interests, followedClubs } = req.body;

      // IIIT email validation
      if (participantType === 'iiit') {
        const iiitDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
        const isValidIIITEmail = iiitDomains.some(domain => email.toLowerCase().endsWith(domain));
        
        if (!isValidIIITEmail) {
          return res.status(400).json({ 
            success: false, 
            message: 'IIIT participants must use IIIT-issued email (@students.iiit.ac.in, @research.iiit.ac.in, or @iiit.ac.in)' 
          });
        }
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this email already exists' 
        });
      }

      // Create new participant
      const user = new User({
        email,
        password,
        role: 'participant',
        firstName,
        lastName,
        participantType,
        collegeName,
        contactNumber,
        interests: interests || [],
        followedClubs: followedClubs || []
      });

      await user.save();

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: user.toPublicJSON()
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Registration failed', 
        error: error.message 
      });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: user.toPublicJSON()
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Login failed', 
        error: error.message 
      });
    }
  }
);

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile' 
    });
  }
});

// Update password
router.put('/password', authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user._id);
      const isPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update password' 
      });
    }
  }
);

export default router;
