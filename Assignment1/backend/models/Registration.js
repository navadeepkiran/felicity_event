import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
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
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'registered', 'cancelled', 'rejected', 'attended'],
    default: 'registered'
  },
  
  // For normal events - custom form responses
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // For merchandise events
  merchandiseOrder: {
    size: String,
    color: String,
    variant: String,
    quantity: {
      type: Number,
      default: 1
    }
  },
  
  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  paymentProof: {
    type: String // File path for uploaded payment proof
  },
  amountPaid: {
    type: Number,
    required: true
  },
  
  // QR Code
  qrCode: {
    type: String // Base64 or URL to QR code image
  },
  
  // Attendance
  attended: {
    type: Boolean,
    default: false
  },
  attendanceTime: {
    type: Date
  },
  
  // Team info (for hackathon feature)
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  
  // Email sent status
  emailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
registrationSchema.index({ event: 1, participant: 1 }, { unique: true });

// Generate ticket ID before saving
registrationSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    this.ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
