import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';

const router = express.Router();

// Browse/Search events (public + authenticated)
router.get('/browse', authenticate, async (req, res) => {
  try {
    const { 
      search, 
      eventType, 
      eligibility, 
      startDate, 
      endDate, 
      followedOnly,
      trending 
    } = req.query;

    let query = { status: 'published' };

    // Only show events from active organizers
    const activeOrganizers = await User.find({ 
      role: 'organizer', 
      isActive: true 
    }).distinct('_id');
    
    query.organizer = { $in: activeOrganizers };

    // Search by name, description, or tags
    if (search) {
      query.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { eventDescription: { $regex: search, $options: 'i' } },
        { eventTags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by event type
    if (eventType) {
      query.eventType = eventType;
    }

    // Filter by eligibility
    if (eligibility) {
      query.eligibility = eligibility;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.eventStartDate = {};
      if (startDate) query.eventStartDate.$gte = new Date(startDate);
      if (endDate) query.eventStartDate.$lte = new Date(endDate);
    }

    // Filter by followed clubs (for participants only)
    if (followedOnly === 'true' && req.user.role === 'participant') {
      const user = await User.findById(req.user._id);
      // Override organizer filter to only include active followed clubs
      const activeFollowedClubs = user.followedClubs.filter(clubId => 
        activeOrganizers.some(activeId => activeId.equals(clubId))
      );
      if (activeFollowedClubs.length > 0) {
        query.organizer = { $in: activeFollowedClubs };
      } else {
        // If no followed clubs, return empty result
        query.organizer = { $in: [] };
      }
    }

    let events = await Event.find(query)
      .populate('organizer', 'organizerName category email')
      .sort({ eventStartDate: 1 });

    // Auto-update event status based on current time
    events = events.map(event => {
      const eventObj = event.toObject();
      const now = new Date();
      
      if (eventObj.status !== 'draft' && eventObj.status !== 'closed') {
        if (now >= eventObj.eventStartDate && now <= eventObj.eventEndDate) {
          eventObj.status = 'ongoing';
        } else if (now > eventObj.eventEndDate) {
          eventObj.status = 'completed';
        }
      }
      
      return eventObj;
    });

    // Trending events (most registrations in last 24 hours)
    if (trending === 'true') {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const trendingEvents = await Registration.aggregate([
        {
          $match: {
            registrationDate: { $gte: last24Hours }
          }
        },
        {
          $group: {
            _id: '$event',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 5
        }
      ]);

      const trendingEventIds = trendingEvents.map(e => e._id);
      events = await Event.find({ _id: { $in: trendingEventIds }, status: 'published' })
        .populate('organizer', 'organizerName category email');
    }

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Browse events error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch events',
      error: error.message 
    });
  }
});

// Get event details by ID
router.get('/:eventId', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('organizer', 'organizerName category description contactEmail email');

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }
    
    // Auto-update event status based on current time
    const eventObj = event.toObject();
    const now = new Date();
    
    if (eventObj.status !== 'draft' && eventObj.status !== 'closed') {
      if (now >= eventObj.eventStartDate && now <= eventObj.eventEndDate) {
        eventObj.status = 'ongoing';
      } else if (now > eventObj.eventEndDate) {
        eventObj.status = 'completed';
      }
    }

    // Check if user is registered (for participants)
    let isRegistered = false;
    let registrationDetails = null;
    if (req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: event._id,
        participant: req.user._id
      });
      isRegistered = !!registration;
      if (registration) {
        registrationDetails = {
          ticketId: registration.ticketId,
          qrCode: registration.qrCode,
          status: registration.status,
          registrationDate: registration.registrationDate
        };
      }
    }

    res.json({
      success: true,
      event: eventObj,
      isRegistered,
      registration: registrationDetails
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch event details' 
    });
  }
});

// Get all organizers/clubs
router.get('/clubs/list', authenticate, async (req, res) => {
  try {
    const clubs = await User.find({ 
      role: 'organizer', 
      isActive: true 
    }).select('-password');

    // If participant, check which clubs they follow
    let followedClubs = [];
    if (req.user.role === 'participant') {
      const user = await User.findById(req.user._id);
      followedClubs = user.followedClubs.map(id => id.toString());
    }

    const clubsWithFollowStatus = clubs.map(club => ({
      ...club.toObject(),
      isFollowed: followedClubs.includes(club._id.toString())
    }));

    res.json({
      success: true,
      count: clubsWithFollowStatus.length,
      clubs: clubsWithFollowStatus
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch clubs' 
    });
  }
});

// Get organizer/club details with their events
router.get('/clubs/:clubId', authenticate, async (req, res) => {
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

    const upcomingEvents = await Event.find({
      organizer: club._id,
      status: { $in: ['published', 'ongoing'] },
      eventStartDate: { $gte: new Date() }
    }).sort({ eventStartDate: 1 });

    const pastEvents = await Event.find({
      organizer: club._id,
      status: { $in: ['completed', 'closed'] },
      eventEndDate: { $lt: new Date() }
    }).sort({ eventEndDate: -1 });

    // Check if user follows this club
    let isFollowed = false;
    if (req.user.role === 'participant') {
      const user = await User.findById(req.user._id);
      isFollowed = user.followedClubs.some(id => id.toString() === club._id.toString());
    }

    res.json({
      success: true,
      club,
      isFollowed,
      upcomingEvents,
      pastEvents
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch club details' 
    });
  }
});

export default router;
