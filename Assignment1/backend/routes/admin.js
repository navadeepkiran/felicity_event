import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import crypto from 'crypto';
import PasswordResetRequest from '../models/PasswordResetRequest.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, isAdmin);

// Get all organizers/clubs
router.get('/clubs', async (req, res) => {
  try {
    const clubs = await User.find({ role: 'organizer' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: clubs.length,
      clubs
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch clubs' 
    });
  }
});

// Create new organizer/club
router.post('/clubs', async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail } = req.body;

    if (!organizerName || !category || !description || !contactEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Generate email and password
    const generatedEmail = `${organizerName.toLowerCase().replace(/\s+/g, '.')}@felicity.org`;
    const generatedPassword = crypto.randomBytes(8).toString('hex');

    // Check if email already exists
    const existingUser = await User.findOne({ email: generatedEmail });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'An organization with similar name already exists' 
      });
    }

    // Create organizer
    const organizer = new User({
      email: generatedEmail,
      password: generatedPassword,
      role: 'organizer',
      organizerName,
      category,
      description,
      contactEmail,
      isActive: true
    });

    await organizer.save();

    res.status(201).json({
      success: true,
      message: 'Organizer created successfully',
      credentials: {
        email: generatedEmail,
        password: generatedPassword
      },
      organizer: organizer.toPublicJSON()
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create organizer',
      error: error.message 
    });
  }
});

// Get single organizer details
router.get('/clubs/:clubId', async (req, res) => {
  try {
    const club = await User.findOne({ 
      _id: req.params.clubId, 
      role: 'organizer' 
    }).select('-password');

    if (!club) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found' 
      });
    }

    res.json({
      success: true,
      club
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch club details' 
    });
  }
});

// Update organizer (limited fields)
router.put('/clubs/:clubId', async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail, isActive } = req.body;

    const updateData = {};
    if (organizerName) updateData.organizerName = organizerName;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (contactEmail) updateData.contactEmail = contactEmail;
    if (isActive !== undefined) updateData.isActive = isActive;

    const club = await User.findOneAndUpdate(
      { _id: req.params.clubId, role: 'organizer' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!club) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found' 
      });
    }

    res.json({
      success: true,
      message: 'Club updated successfully',
      club
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update club' 
    });
  }
});

// Deactivate/Remove organizer
router.delete('/clubs/:clubId', async (req, res) => {
  try {
    const { permanent } = req.query;
    
    const club = await User.findOne({ 
      _id: req.params.clubId, 
      role: 'organizer' 
    });

    if (!club) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found' 
      });
    }

    // Permanent deletion - cascade delete all associated data
    if (permanent === 'true') {
      // Delete all events created by this organizer
      await Event.deleteMany({ organizer: req.params.clubId });
      
      // Delete all registrations for those events
      const eventIds = await Event.find({ organizer: req.params.clubId }).distinct('_id');
      await Registration.deleteMany({ event: { $in: eventIds } });
      
      // Delete the organizer account
      await User.deleteOne({ _id: req.params.clubId });
      
      res.json({
        success: true,
        message: 'Club and all associated data permanently deleted'
      });
    } else {
      // Soft delete - just deactivate
      club.isActive = false;
      await club.save();
      
      res.json({
        success: true,
        message: 'Club deactivated successfully',
        club: {
          _id: club._id,
          organizerName: club.organizerName,
          isActive: club.isActive
        }
      });
    }
  } catch (error) {
    console.error('Delete club error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove club' 
    });
  }
});

// Reset organizer password
router.post('/clubs/:clubId/reset-password', async (req, res) => {
  try {
    const club = await User.findOne({ 
      _id: req.params.clubId, 
      role: 'organizer' 
    });

    if (!club) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found' 
      });
    }

    // Generate new password
    const newPassword = crypto.randomBytes(8).toString('hex');
    club.password = newPassword;
    await club.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
      credentials: {
        email: club.email,
        newPassword
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password' 
    });
  }
});

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalClubs = await User.countDocuments({ role: 'organizer' });
    const activeClubs = await User.countDocuments({ role: 'organizer', isActive: true });
    const totalParticipants = await User.countDocuments({ role: 'participant' });

    res.json({
      success: true,
      stats: {
        totalClubs,
        activeClubs,
        inactiveClubs: totalClubs - activeClubs,
        totalParticipants
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stats' 
    });
  }
});

// Password Reset Request Management
router.get('/password-reset/requests', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await PasswordResetRequest.find(filter)
      .populate('organizer', 'email organizerName')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch password reset requests'
    });
  }
});

// Approve password reset request
router.post('/password-reset/requests/:requestId/approve', async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.requestId)
      .populate('organizer');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Generate new password
    const newPassword = crypto.randomBytes(8).toString('hex');
    
    // Update organizer's password
    const organizer = await User.findById(request.organizer._id);
    organizer.password = newPassword;
    await organizer.save();

    // Update request
    request.status = 'approved';
    request.newPassword = newPassword; // Store for admin to see
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminNotes = req.body.notes || '';
    await request.save();

    res.json({
      success: true,
      message: 'Password reset approved successfully',
      credentials: {
        email: organizer.email,
        newPassword
      }
    });
  } catch (error) {
    console.error('Approve password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve password reset'
    });
  }
});

// Reject password reset request
router.post('/password-reset/requests/:requestId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const request = await PasswordResetRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminNotes = reason || 'Request rejected';
    await request.save();

    res.json({
      success: true,
      message: 'Password reset request rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject password reset request'
    });
  }
});

export default router;
