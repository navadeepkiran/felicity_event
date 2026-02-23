import express from 'express';
import Discussion from '../models/Discussion.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all discussions for an event
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    // Check if user is registered for this event (or is organizer)
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    let isRegistered = false;

    if (req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: req.params.eventId,
        participant: req.user._id,
        status: { $in: ['registered', 'attended'] }
      });
      isRegistered = !!registration;
    }

    if (!isOrganizer && !isRegistered) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be registered for this event to view discussions.'
      });
    }

    const discussions = await Discussion.find({ event: req.params.eventId })
      .populate('author', 'firstName lastName email role organizerName')
      .populate('replies.user', 'firstName lastName email role organizerName')
      .populate('reactions.user', 'firstName lastName')
      .sort({ isPinned: -1, createdAt: -1 }); // Pinned first, then by date

    res.json({
      success: true,
      discussions,
      isRegistered: isRegistered || isOrganizer
    });
  } catch (error) {
    console.error('Fetch discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussions'
    });
  }
});

// Create a new discussion
router.post('/event/:eventId', authenticate, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Verify event exists
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const discussion = new Discussion({
      event: req.params.eventId,
      author: req.user._id,
      title,
      content
    });

    await discussion.save();
    await discussion.populate('author', 'firstName lastName email role organizerName');

    // Send notifications to all registered participants (except author)
    try {
      const registrations = await Registration.find({
        event: req.params.eventId,
        status: { $in: ['registered', 'attended'] },
        participant: { $ne: req.user._id } // Exclude the author
      }).select('participant');

      const notificationPromises = registrations.map(reg => 
        Notification.create({
          recipient: reg.participant,
          type: 'new_discussion',
          title: '💬 New Discussion',
          message: `${req.user.firstName || 'Someone'} posted: "${title}"`,
          link: `/event/${req.params.eventId}/discussions`,
          relatedEvent: req.params.eventId,
          relatedDiscussion: discussion._id
        })
      );

      await Promise.allSettled(notificationPromises);
      console.log(`💬 Sent ${registrations.length} new discussion notifications for: ${title}`);
    } catch (notifError) {
      console.error('Error sending discussion notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      discussion
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discussion'
    });
  }
});

// Add a reply to a discussion
router.post('/:discussionId/reply', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    const discussion = await Discussion.findById(req.params.discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    discussion.replies.push({
      user: req.user._id,
      content
    });

    await discussion.save();
    await discussion.populate('replies.user', 'firstName lastName email role organizerName');

    // Send notifications to discussion author and all registered participants (except reply author)
    try {
      const registrations = await Registration.find({
        event: discussion.event,
        status: { $in: ['registered', 'attended'] },
        participant: { $ne: req.user._id } // Exclude the reply author
      }).select('participant');

      const notificationPromises = registrations.map(reg => 
        Notification.create({
          recipient: reg.participant,
          type: 'reply',
          title: '↩️ New Reply',
          message: `${req.user.firstName || 'Someone'} replied to: "${discussion.title}"`,
          link: `/event/${discussion.event}/discussions`,
          relatedEvent: discussion.event,
          relatedDiscussion: discussion._id
        })
      );

      await Promise.allSettled(notificationPromises);
      console.log(`↩️ Sent ${registrations.length} reply notifications for: ${discussion.title}`);
    } catch (notifError) {
      console.error('Error sending reply notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    res.json({
      success: true,
      message: 'Reply added successfully',
      discussion
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply'
    });
  }
});

// Delete a discussion (only author or organizer)
router.delete('/:discussionId', authenticate, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId).populate('event');
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Check if user is the author or the event organizer
    const isAuthor = discussion.author.toString() === req.user._id.toString();
    const isOrganizer = discussion.event.organizer.toString() === req.user._id.toString();

    if (!isAuthor && !isOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this discussion'
      });
    }

    await Discussion.findByIdAndDelete(req.params.discussionId);

    res.json({
      success: true,
      message: 'Discussion deleted successfully'
    });
  } catch (error) {
    console.error('Delete discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete discussion'
    });
  }
});

// Pin/Unpin a discussion (organizer only)
router.put('/:discussionId/pin', authenticate, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId).populate('event');
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Check if user is the event organizer
    const isOrganizer = discussion.event.organizer.toString() === req.user._id.toString();

    if (!isOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Only organizers can pin discussions'
      });
    }

    discussion.isPinned = !discussion.isPinned;
    discussion.pinnedBy = discussion.isPinned ? req.user._id : null;
    discussion.pinnedAt = discussion.isPinned ? new Date() : null;

    await discussion.save();

    // Send notifications to all registered participants when pinned
    if (discussion.isPinned) {
      const registrations = await Registration.find({
        event: discussion.event._id,
        status: { $in: ['registered', 'attended'] }
      }).select('participant');

      const notificationPromises = registrations.map(reg => 
        Notification.create({
          recipient: reg.participant,
          type: 'pinned',
          title: '📌 Discussion Pinned',
          message: `"${discussion.title}" has been pinned by the organizer`,
          link: `/event/${discussion.event._id}/discussions`,
          relatedEvent: discussion.event._id,
          relatedDiscussion: discussion._id
        })
      );

      await Promise.allSettled(notificationPromises);
    }

    res.json({
      success: true,
      message: discussion.isPinned ? 'Discussion pinned successfully' : 'Discussion unpinned successfully',
      discussion
    });
  } catch (error) {
    console.error('Pin discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin discussion'
    });
  }
});

// Mark as announcement (organizer only)
router.put('/:discussionId/announcement', authenticate, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId).populate('event');
    // Send notifications to ALL registered participants when marked as announcement
    if (discussion.isAnnouncement) {
      const registrations = await Registration.find({
        event: discussion.event._id,
        status: { $in: ['registered', 'attended'] }
      }).select('participant');

      const notificationPromises = registrations.map(reg => 
        Notification.create({
          recipient: reg.participant,
          type: 'announcement',
          title: '📢 New Announcement',
          message: `${discussion.title}`,
          link: `/event/${discussion.event._id}/discussions`,
          relatedEvent: discussion.event._id,
          relatedDiscussion: discussion._id
        })
      );

      await Promise.allSettled(notificationPromises);
      
      console.log(`📢 Sent ${registrations.length} announcement notifications for: ${discussion.title}`);
    }

    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Check if user is the event organizer
    const isOrganizer = discussion.event.organizer.toString() === req.user._id.toString();

    if (!isOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Only organizers can mark announcements'
      });
    }

    discussion.isAnnouncement = !discussion.isAnnouncement;

    await discussion.save();

    res.json({
      success: true,
      message: discussion.isAnnouncement ? 'Marked as announcement' : 'Removed from announcements',
      discussion
    });
  } catch (error) {
    console.error('Toggle announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle announcement'
    });
  }
});

// Toggle reaction on a discussion
router.post('/:discussionId/reaction', authenticate, async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !['like', 'helpful', 'question'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    const discussion = await Discussion.findById(req.params.discussionId);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Check if user already reacted with this type
    const existingReactionIndex = discussion.reactions.findIndex(
      r => r.user.toString() === req.user._id.toString() && r.type === type
    );

    if (existingReactionIndex !== -1) {
      // Remove reaction
      discussion.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove any other reaction by this user
      discussion.reactions = discussion.reactions.filter(
        r => r.user.toString() !== req.user._id.toString()
      );
      
      // Add new reaction
      discussion.reactions.push({
        user: req.user._id,
        type
      });
    }

    await discussion.save();

    res.json({
      success: true,
      message: 'Reaction updated',
      discussion
    });
  } catch (error) {
    console.error('Toggle reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reaction'
    });
  }
});

export default router;
