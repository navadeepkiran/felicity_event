import express from 'express';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';
import { generateQRCode, sendTicketEmail } from '../utils/helpers.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new team
router.post('/create', async (req, res) => {
  try {
    const { eventId, teamName, teamSize } = req.body;

    // Validate event exists and is team type
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    if (event.eventType !== 'team') {
      return res.status(400).json({ 
        success: false, 
        message: 'This event does not support team registration' 
      });
    }

    // Validate team size
    if (event.teamDetails) {
      if (teamSize < event.teamDetails.minTeamSize || teamSize > event.teamDetails.maxTeamSize) {
        return res.status(400).json({
          success: false,
          message: `Team size must be between ${event.teamDetails.minTeamSize} and ${event.teamDetails.maxTeamSize}`
        });
      }
    }

    // Check if user already has a team for this event
    const existingTeam = await Team.findOne({
      event: eventId,
      $or: [
        { teamLeader: req.user._id },
        { 'members.user': req.user._id }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of a team for this event'
      });
    }

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();

    // Create team
    const team = new Team({
      event: eventId,
      teamName,
      teamLeader: req.user._id,
      teamSize,
      inviteCode,
      members: [{
        user: req.user._id,
        name: req.user.firstName && req.user.lastName 
          ? `${req.user.firstName} ${req.user.lastName}`
          : req.user.email.split('@')[0],
        email: req.user.email,
        joinedAt: new Date()
      }],
      status: teamSize === 1 ? 'complete' : 'incomplete'
    });

    await team.save();

    res.json({
      success: true,
      message: 'Team created successfully',
      team: {
        _id: team._id,
        teamName: team.teamName,
        inviteCode: team.inviteCode,
        teamSize: team.teamSize,
        currentMembers: team.members.length,
        status: team.status
      }
    });
  } catch (error) {
    console.error('Team creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create team' 
    });
  }
});

// Join a team using invite code
router.post('/join/:inviteCode', async (req, res) => {
  try {
    const { inviteCode } = req.params;

    // Find team by invite code
    const team = await Team.findOne({ inviteCode }).populate('event');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    // Check if team is already full
    if (team.members.length >= team.teamSize) {
      return res.status(400).json({
        success: false,
        message: 'Team is already full'
      });
    }

    // Check if user is already in the team
    const alreadyMember = team.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team'
      });
    }

    // Check if user is in another team for same event
    const otherTeam = await Team.findOne({
      event: team.event._id,
      _id: { $ne: team._id },
      $or: [
        { teamLeader: req.user._id },
        { 'members.user': req.user._id }
      ]
    });

    if (otherTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of another team for this event'
      });
    }

    // Add user to team
    team.members.push({
      user: req.user._id,
      name: req.user.firstName && req.user.lastName 
        ? `${req.user.firstName} ${req.user.lastName}`
        : req.user.email.split('@')[0],
      email: req.user.email,
      joinedAt: new Date()
    });

    // Check if team is now complete
    if (team.members.length === team.teamSize) {
      team.status = 'complete';
      
      // Auto-register the complete team
      await registerCompleteTeam(team);
    }

    await team.save();

    res.json({
      success: true,
      message: team.status === 'complete' 
        ? 'Team joined and registration completed!' 
        : 'Successfully joined team',
      team: {
        teamName: team.teamName,
        currentMembers: team.members.length,
        teamSize: team.teamSize,
        status: team.status
      }
    });
  } catch (error) {
    console.error('Join team error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to join team',
      error: error.message
    });
  }
});

// Get team details
router.get('/:teamId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('event', 'eventName eventType eventStartDate')
      .populate('teamLeader', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team details'
    });
  }
});

// Get my teams
router.get('/my/teams', async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { teamLeader: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('event', 'eventName eventType eventStartDate status')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams'
    });
  }
});

// Get team by event (check if user has team for specific event)
router.get('/event/:eventId/my-team', async (req, res) => {
  try {
    const team = await Team.findOne({
      event: req.params.eventId,
      $or: [
        { teamLeader: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).populate('event', 'eventName');

    if (!team) {
      return res.json({
        success: true,
        team: null
      });
    }

    res.json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check team status'
    });
  }
});

// Helper function to register complete team
async function registerCompleteTeam(team) {
  try {
    const event = await Event.findById(team.event);
    
    // Create registration for each team member
    for (const member of team.members) {
      // Check if registration already exists
      const existingRegistration = await Registration.findOne({
        event: event._id,
        participant: member.user
      });

      if (existingRegistration) {
        continue; // Skip this member - already registered
      }

      const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      
      const registration = new Registration({
        event: event._id,
        participant: member.user,
        ticketId,
        amountPaid: event.registrationFee,
        status: 'registered',
        team: team._id,
        formResponses: {}
      });

      // Generate QR code
      const qrCodeData = JSON.stringify({
        ticketId,
        eventId: event._id,
        participantId: member.user,
        teamId: team._id,
        eventName: event.eventName
      });
      
      registration.qrCode = await generateQRCode(qrCodeData);
      await registration.save();

      // Send ticket email
      await sendTicketEmail(member.email, registration, event);
    }

    // Update event registration count
    event.currentRegistrations += team.members.length;
    event.totalRevenue += event.registrationFee * team.members.length;
    await event.save();

    // Update team status
    team.status = 'registered';
    await team.save();

  } catch (error) {
    console.error('Team registration error:', error);
    throw error;
  }
}

export default router;
