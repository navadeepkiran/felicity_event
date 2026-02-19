import express from 'express';
import { authenticate, isOrganizer } from '../middleware/auth.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';

const router = express.Router();

// All routes require authentication and organizer role
router.use(authenticate, isOrganizer);

// Get organizer dashboard
router.get('/dashboard',  async (req, res) => {
  try {
    let events = await Event.find({ organizer: req.user._id })
      .sort({ createdAt: -1 });

    // Auto-update event status based on current time
    const now = new Date();
    events = events.map(event => {
      const eventObj = event.toObject();
      
      if (eventObj.status !== 'draft' && eventObj.status !== 'closed') {
        if (now >= eventObj.eventStartDate && now <= eventObj.eventEndDate) {
          eventObj.status = 'ongoing';
        } else if (now > eventObj.eventEndDate) {
          eventObj.status = 'completed';
        }
      }
      
      return eventObj;
    });

    // Calculate analytics for all events (excluding drafts)
    const activeEvents = events.filter(e => e.status !== 'draft');

    const analytics = {
      totalEvents: events.length,
      totalRegistrations: activeEvents.reduce((sum, e) => sum + e.currentRegistrations, 0),
      totalRevenue: activeEvents.reduce((sum, e) => sum + e.totalRevenue, 0),
      totalAttendance: activeEvents.reduce((sum, e) => sum + e.attendanceCount, 0)
    };

    res.json({
      success: true,
      events,
      analytics
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard data' 
    });
  }
});

// Create new event
router.post('/events', async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id,
      status: 'draft'
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create event',
      error: error.message 
    });
  }
});

// Get organizer's event details
router.get('/events/:eventId', async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    // Get participants list
    const registrations = await Registration.find({ event: event._id })
      .populate('participant', '-password')
      .sort({ registrationDate: -1 });

    // Calculate analytics
    const analytics = {
      totalRegistrations: event.currentRegistrations,
      revenue: event.totalRevenue,
      attendance: event.attendanceCount,
      attendanceRate: event.currentRegistrations > 0 
        ? ((event.attendanceCount / event.currentRegistrations) * 100).toFixed(2) 
        : 0
    };

    res.json({
      success: true,
      event,
      registrations,
      analytics
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch event details' 
    });
  }
});

// Update event
router.put('/events/:eventId', async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    // Define what can be edited based on status
    const allowedUpdates = {};

    if (event.status === 'draft') {
      // Draft: all fields can be edited
      Object.assign(allowedUpdates, req.body);
    } else if (event.status === 'published') {
      // Published: limited edits
      const { eventDescription, registrationDeadline, registrationLimit } = req.body;
      if (eventDescription) allowedUpdates.eventDescription = eventDescription;
      if (registrationDeadline && new Date(registrationDeadline) > new Date()) {
        allowedUpdates.registrationDeadline = registrationDeadline;
      }
      if (registrationLimit && registrationLimit >= event.currentRegistrations) {
        allowedUpdates.registrationLimit = registrationLimit;
      }
    } else if (event.status === 'ongoing' || event.status === 'completed') {
      // Ongoing/Completed: only status can be changed
      if (req.body.status) allowedUpdates.status = req.body.status;
    }

    // Don't allow changing organizer or certain system fields
    delete allowedUpdates.organizer;
    delete allowedUpdates.currentRegistrations;
    delete allowedUpdates.totalRevenue;
    delete allowedUpdates.attendanceCount;

    Object.assign(event, allowedUpdates);
    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update event',
      error: error.message 
    });
  }
});

// Publish event (change from draft to published)
router.post('/events/:eventId/publish', async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    if (event.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only draft events can be published' 
      });
    }

    event.status = 'published';
    await event.save();

    // TODO: Post to Discord webhook if configured
    if (req.user.discordWebhook) {
      // Implement Discord webhook posting
    }

    res.json({
      success: true,
      message: 'Event published successfully',
      event
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to publish event' 
    });
  }
});

// Export participants as CSV
router.get('/events/:eventId/export', async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate('participant');

    // Prepare data for CSV export
    const data = registrations.map(reg => ({
      ticketId: reg.ticketId,
      name: reg.participant ? `${reg.participant.firstName} ${reg.participant.lastName}` : 'N/A',
      email: reg.participant ? reg.participant.email : 'N/A',
      contact: reg.participant ? reg.participant.contactNumber : 'N/A',
      college: reg.participant ? reg.participant.collegeName : 'N/A',
      registrationDate: new Date(reg.registrationDate).toLocaleDateString(),
      paymentStatus: reg.paymentStatus,
      amountPaid: reg.amountPaid,
      attended: reg.attended ? 'Yes' : 'No',
      status: reg.status
    }));

    // Generate CSV with proper formatting
    const headers = ['Ticket ID', 'Name', 'Email', 'Contact', 'College', 'Registration Date', 'Payment Status', 'Amount Paid', 'Attended', 'Status'];
    
    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    // Build CSV content
    let csvContent = headers.join(',') + '\r\n';
    
    // Add data rows
    data.forEach(row => {
      const values = [
        escapeCSV(row.ticketId),
        escapeCSV(row.name),
        escapeCSV(row.email),
        escapeCSV(row.contact),
        escapeCSV(row.college),
        escapeCSV(row.registrationDate),
        escapeCSV(row.paymentStatus),
        escapeCSV(row.amountPaid),
        escapeCSV(row.attended),
        escapeCSV(row.status)
      ];
      csvContent += values.join(',') + '\r\n';
    });
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="participants-${event.eventName.replace(/\s+/g, '-')}-${Date.now()}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export data' 
    });
  }
});

// Get organizer profile
router.get('/profile', async (req, res) => {
  try {
    const organizer = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      organizer
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});

// Update organizer profile
router.put('/profile', async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail, discordWebhook } = req.body;

    const updateData = {};
    if (organizerName) updateData.organizerName = organizerName;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (contactEmail) updateData.contactEmail = contactEmail;
    if (discordWebhook !== undefined) updateData.discordWebhook = discordWebhook;

    const organizer = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      organizer
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
});

// Mark attendance by scanning QR code
router.post('/events/:eventId/attendance/scan', async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required'
      });
    }

    // Verify event belongs to organizer
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Find registration by ticket ID and event
    const registration = await Registration.findOne({
      ticketId: ticketId,
      event: req.params.eventId
    }).populate('participant', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket or ticket not for this event'
      });
    }

    // Check if already marked attended
    if (registration.attended) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this participant',
        participant: {
          name: `${registration.participant.firstName} ${registration.participant.lastName}`,
          email: registration.participant.email,
          ticketId: registration.ticketId,
          markedAt: registration.attendanceTime
        }
      });
    }

    // Mark attendance
    registration.attended = true;
    registration.status = 'attended';
    registration.attendanceTime = new Date();
    await registration.save();

    // Update event attendance count
    event.attendanceCount = (event.attendanceCount || 0) + 1;
    await event.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      participant: {
        name: `${registration.participant.firstName} ${registration.participant.lastName}`,
        email: registration.participant.email,
        ticketId: registration.ticketId,
        markedAt: registration.attendanceTime
      }
    });
  } catch (error) {
    console.error('Scan attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
});

// Get attendance statistics for an event
router.get('/events/:eventId/attendance/stats', async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('participant', 'firstName lastName email contactNumber');

    const stats = {
      totalRegistrations: registrations.length,
      totalAttended: registrations.filter(r => r.attended).length,
      totalNotAttended: registrations.filter(r => !r.attended).length,
      attendancePercentage: registrations.length > 0 
        ? ((registrations.filter(r => r.attended).length / registrations.length) * 100).toFixed(2)
        : 0
    };

    const attendanceList = registrations.map(reg => ({
      ticketId: reg.ticketId,
      name: `${reg.participant.firstName} ${reg.participant.lastName}`,
      email: reg.participant.email,
      contactNumber: reg.participant.contactNumber,
      attended: reg.attended,
      attendedAt: reg.attendanceTime,
      registrationDate: reg.registrationDate
    }));

    res.json({
      success: true,
      stats,
      attendanceList
    });
  } catch (error) {
    console.error('Fetch attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics'
    });
  }
});

// Password reset request routes
router.post('/password-reset/request', async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason (minimum 10 characters)'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizer: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request'
      });
    }

    const resetRequest = new PasswordResetRequest({
      organizer: req.user._id,
      reason: reason.trim()
    });

    await resetRequest.save();

    res.json({
      success: true,
      message: 'Password reset request submitted successfully. Admin will review it shortly.',
      request: resetRequest
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit password reset request'
    });
  }
});

// Get my password reset requests
router.get('/password-reset/requests', async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({
      organizer: req.user._id
    })
    .sort({ createdAt: -1 })
    .populate('reviewedBy', 'name email');

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch password reset requests'
    });
  }
});

export default router;
