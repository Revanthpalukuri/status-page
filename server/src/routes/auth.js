import express from 'express';
import { User, Organization, OrganizationMember } from '../models/index.js';
import { generateAuthToken } from '../utils/jwt.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Register new user
router.post('/register', validate(schemas.register), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
  });

  // Generate token
  const token = generateAuthToken(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
    },
  });
}));

// Login user
router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated',
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Update last login time
  user.lastLoginAt = new Date();
  await user.save();

  // Generate token
  const token = generateAuthToken(user);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
    },
  });
}));

// Get current user profile
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  // Get user with their organizations
  const user = await User.findByPk(req.user.id, {
    include: [
      {
        model: Organization,
        as: 'ownedOrganizations',
        attributes: ['id', 'name', 'slug'],
      },
      {
        model: OrganizationMember,
        as: 'memberships',
        where: { status: 'active' },
        required: false,
        include: [{
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        }],
      },
    ],
  });

  res.json({
    success: true,
    data: { user },
  });
}));

// Update user profile
router.put('/me', authenticate, asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;
  const user = req.user;

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
}));

// Change password
router.put('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Validate new password
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long',
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// Refresh token
router.post('/refresh', authenticate, asyncHandler(async (req, res) => {
  const token = generateAuthToken(req.user);

  res.json({
    success: true,
    data: { token },
  });
}));

export default router;
