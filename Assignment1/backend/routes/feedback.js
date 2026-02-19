import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Feedback from '../models/Feedback.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

const router = express.Router();

// Submit anonymous feedback (Participant only, must have attended)
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if participant attended the event
    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user._id,
      status: 'attended' // Only attended participants can give feedback
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You can only provide feedback for events you have attended'
      });
    }

    // Check if feedback already submitted
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      participant: req.user._id
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this event'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      event: eventId,
      participant: req.user._id,
      rating,
      comment: comment || '',
      isAnonymous: true
    });

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        rating: feedback.rating,
        comment: feedback.comment,
        submittedAt: feedback.submittedAt
      }
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

// Get aggregated feedback for an event (Organizer or Participant)
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user is organizer of the event or a participant
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const isOrganizer = event.organizer.toString() === req.user._id.toString();

    // Get all feedback for the event
    const feedbacks = await Feedback.find({ event: eventId })
      .select('rating comment submittedAt')
      .sort({ submittedAt: -1 });

    // Calculate aggregated stats
    const totalFeedback = feedbacks.length;
    const averageRating = totalFeedback > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(2)
      : 0;

    // Count by rating
    const ratingCounts = {
      5: feedbacks.filter(f => f.rating === 5).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      1: feedbacks.filter(f => f.rating === 1).length
    };

    // Check if current user has submitted feedback
    const userFeedback = await Feedback.findOne({
      event: eventId,
      participant: req.user._id
    });

    res.json({
      success: true,
      data: {
        totalFeedback,
        averageRating: parseFloat(averageRating),
        ratingCounts,
        feedbacks: isOrganizer ? feedbacks : [], // Only organizers see individual feedbacks
        hasSubmitted: !!userFeedback,
        userFeedback: userFeedback ? {
          rating: userFeedback.rating,
          comment: userFeedback.comment
        } : null
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
});

// Filter feedback by rating (Organizer only)
router.get('/event/:eventId/rating/:rating', authenticate, async (req, res) => {
  try {
    const { eventId, rating } = req.params;
    const ratingNum = parseInt(rating);

    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rating'
      });
    }

    // Check if user is organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only organizers can filter feedback'
      });
    }

    // Get filtered feedback
    const feedbacks = await Feedback.find({
      event: eventId,
      rating: ratingNum
    })
      .select('rating comment submittedAt')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        rating: ratingNum,
        count: feedbacks.length,
        feedbacks
      }
    });
  } catch (error) {
    console.error('Filter feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter feedback'
    });
  }
});

export default router;
