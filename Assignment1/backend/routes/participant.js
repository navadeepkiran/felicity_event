import express from 'express';
import { authenticate, isParticipant } from '../middleware/auth.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { generateQRCode, sendTicketEmail } from '../utils/helpers.js';

const router = express.Router();

// All routes require authentication and participant role
router.use(authenticate, isParticipant);

// Get participant dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const registrations = await Registration.find({ 
      participant: req.user._id 
    })
    .populate('event')
    .sort({ registrationDate: -1 });

    const upcoming = registrations.filter(reg => 
      reg.event && 
      reg.event.eventStartDate > new Date() && 
      reg.status === 'registered'
    );

    const completed = registrations.filter(reg => 
      reg.event && 
      reg.event.eventEndDate < new Date()
    );

    const cancelled = registrations.filter(reg => 
      reg.status === 'cancelled' || reg.status === 'rejected'
    );

    res.json({
      success: true,
      data: {
        upcoming,
        completed,
        cancelled,
        all: registrations
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard data',
      error: error.message 
    });
  }
});

// Get participant profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followedClubs', 'organizerName category description');
    
    res.json({
      success: true,
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});

// Update participant profile
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, collegeName, interests, followedClubs } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (collegeName) updateData.collegeName = collegeName;
    if (interests) updateData.interests = interests;
    if (followedClubs) updateData.followedClubs = followedClubs;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('followedClubs', 'organizerName category description');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
});

// Register for an event
router.post('/register/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { formResponses, merchandiseOrder } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    // Check eligibility
    if (event.eligibility === 'iiit-only' && req.user.participantType !== 'iiit') {
      return res.status(403).json({ 
        success: false, 
        message: 'This event is only for IIIT students' 
      });
    }
    if (event.eligibility === 'non-iiit-only' && req.user.participantType === 'iiit') {
      return res.status(403).json({ 
        success: false, 
        message: 'This event is only for Non-IIIT participants' 
      });
    }

    // Check if registration is open
    if (event.status !== 'published') {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration is not open for this event' 
      });
    }

    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration deadline has passed' 
      });
    }

    if (event.currentRegistrations >= event.registrationLimit) {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration limit reached' 
      });
    }

    // Check for merchandise stock
    if (event.eventType === 'merchandise' && event.merchandiseDetails.stockQuantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item is out of stock' 
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: eventId,
      participant: req.user._id
    });

    if (existingRegistration) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already registered for this event' 
      });
    }

    // Generate ticket ID
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create registration
    const registration = new Registration({
      event: eventId,
      participant: req.user._id,
      ticketId: ticketId,
      amountPaid: event.registrationFee,
      formResponses: formResponses || {},
      merchandiseOrder: event.eventType === 'merchandise' ? merchandiseOrder : undefined
    });

    // Generate QR code
    const qrCodeData = JSON.stringify({
      ticketId: ticketId,
      eventId: event._id,
      participantId: req.user._id,
      eventName: event.eventName
    });
    registration.qrCode = await generateQRCode(qrCodeData);

    await registration.save();

    // Update event registration count
    event.currentRegistrations += 1;
    event.totalRevenue += event.registrationFee;

    // Update merchandise stock if applicable
    if (event.eventType === 'merchandise' && event.merchandiseDetails && event.merchandiseDetails.stockQuantity !== undefined) {
      event.merchandiseDetails.stockQuantity -= (merchandiseOrder?.quantity || 1);
    }

    // Lock form after first registration
    if (event.eventType === 'normal' && event.currentRegistrations === 1) {
      event.formLocked = true;
    }

    await event.save();

    // Send ticket email (async, don't wait)
    sendTicketEmail(req.user.email, registration, event).catch(err => 
      console.error('Email send error:', err)
    );

    // Populate for response
    await registration.populate('event');

    res.status(201).json({
      success: true,
      message: 'Registration successful! Ticket sent to your email.',
      registration
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed',
      error: error.message 
    });
  }
});

// Get ticket details
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const registration = await Registration.findOne({ 
      ticketId: req.params.ticketId,
      participant: req.user._id
    })
    .populate('event')
    .populate('participant', '-password');

    if (!registration) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    res.json({
      success: true,
      ticket: registration
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ticket' 
    });
  }
});

// Follow/Unfollow club
router.post('/follow/:clubId', async (req, res) => {
  try {
    const { clubId } = req.params;
    
    const club = await User.findOne({ _id: clubId, role: 'organizer', isActive: true });
    if (!club) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found' 
      });
    }

    const user = await User.findById(req.user._id);
    const isFollowing = user.followedClubs.includes(clubId);

    if (isFollowing) {
      user.followedClubs = user.followedClubs.filter(id => id.toString() !== clubId);
    } else {
      user.followedClubs.push(clubId);
    }

    await user.save();

    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update follow status' 
    });
  }
});

export default router;
