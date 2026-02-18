import mongoose from 'mongoose';

const passwordResetRequestSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  newPassword: {
    type: String // Generated password after approval
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  adminNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
passwordResetRequestSchema.index({ organizer: 1, status: 1 });
passwordResetRequestSchema.index({ status: 1, createdAt: -1 });

const PasswordResetRequest = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
export default PasswordResetRequest;
