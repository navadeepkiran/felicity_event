import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // Anonymous flag - participant info not shared with organizer
  isAnonymous: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
feedbackSchema.index({ event: 1, participant: 1 }, { unique: true }); // One feedback per participant per event
feedbackSchema.index({ event: 1, rating: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
