import express from 'express';
import Message from '../models/Message.js';
import Team from '../models/Team.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get messages for a team
router.get('/:teamId/messages', async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        message: 'Team not found'
      });
    }

    // Verify user is a member of the team
    const isMember = team.teamLeader.toString() === req.user._id.toString() ||
                     team.members.some(m => m.user.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({
        message: 'You are not a member of this team'
      });
    }

    // Get messages with sender details
    const messages = await Message.find({ team: teamId })
      .populate('sender', 'firstName lastName email')
      .sort({ createdAt: 1 })
      .limit(200); // Limit to last 200 messages

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      message: 'Error fetching messages',
      error: error.message
    });
  }
});

// Send a message to a team
router.post('/:teamId/messages', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { content } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        message: 'Message content is required'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        message: 'Message is too long (max 2000 characters)'
      });
    }

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        message: 'Team not found'
      });
    }

    // Verify user is a member of the team
    const isMember = team.teamLeader.toString() === req.user._id.toString() ||
                     team.members.some(m => m.user.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({
        message: 'You are not a member of this team'
      });
    }

    // Create message
    const message = await Message.create({
      team: teamId,
      sender: req.user._id,
      content: content.trim(),
      messageType: 'text'
    });

    // Populate sender details before sending response
    await message.populate('sender', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: 'Error sending message',
      error: error.message
    });
  }
});

// Delete a message (only sender or team leader can delete)
router.delete('/:teamId/messages/:messageId', async (req, res) => {
  try {
    const { teamId, messageId } = req.params;

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        message: 'Team not found'
      });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }

    // Verify user is sender or team leader
    const isSender = message.sender.toString() === req.user._id.toString();
    const isLeader = team.teamLeader.toString() === req.user._id.toString();

    if (!isSender && !isLeader) {
      return res.status(403).json({
        message: 'You can only delete your own messages or messages in your team (if you are the leader)'
      });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      message: 'Error deleting message',
      error: error.message
    });
  }
});

export default router;
