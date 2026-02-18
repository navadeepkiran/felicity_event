import express from 'express';
import Discussion from '../models/Discussion.js';
import Event from '../models/Event.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all discussions for an event
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const discussions = await Discussion.find({ event: req.params.eventId })
      .populate('author', 'firstName lastName email role organizerName')
      .populate('replies.user', 'firstName lastName email role organizerName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      discussions
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

export default router;
