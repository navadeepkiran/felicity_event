import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventDescription: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['normal', 'merchandise', 'team'],
    required: true
  },
  eligibility: {
    type: String,
    enum: ['iiit-only', 'non-iiit-only', 'all'],
    default: 'all'
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  registrationLimit: {
    type: Number,
    required: true
  },
  currentRegistrations: {
    type: Number,
    default: 0
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventTags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'closed'],
    default: 'draft'
  },
  
  // For normal events - custom registration form
  customForm: [{
    fieldName: String,
    fieldType: {
      type: String,
      enum: ['text', 'email', 'number', 'textarea', 'dropdown', 'checkbox', 'file']
    },
    label: String,
    required: Boolean,
    options: [String], // For dropdown
    order: Number
  }],
  formLocked: {
    type: Boolean,
    default: false
  },
  
  // For merchandise events
  merchandiseDetails: {
    itemName: String,
    sizes: [String],
    colors: [String],
    variants: [String],
    stockQuantity: Number,
    purchaseLimit: Number
  },
  
  // For team events (hackathons, etc.)
  teamDetails: {
    minTeamSize: {
      type: Number,
      min: 2
    },
    maxTeamSize: {
      type: Number,
      min: 2
    },
    allowSoloRegistration: {
      type: Boolean,
      default: false
    }
  },
  
  // Analytics
  totalRevenue: {
    type: Number,
    default: 0
  },
  attendanceCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for checking if registration is open
eventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return (
    this.status === 'published' &&
    now < this.registrationDeadline &&
    this.currentRegistrations < this.registrationLimit &&
    (this.eventType !== 'merchandise' || this.merchandiseDetails.stockQuantity > 0)
  );
});

// Method to get current status based on dates
eventSchema.methods.getCurrentStatus = function() {
  const now = new Date();
  
  // If draft, keep it draft
  if (this.status === 'draft') return 'draft';
  
  // Auto-determine status based on time
  if (now < this.eventStartDate && this.status === 'published') {
    return 'published'; // Before event starts
  } else if (now >= this.eventStartDate && now <= this.eventEndDate) {
    return 'ongoing'; // During event
  } else if (now > this.eventEndDate) {
    return 'completed'; // After event ends
  }
  
  return this.status; // Fallback to current status
};

// Update status before saving
eventSchema.pre('save', function(next) {
  if (this.status !== 'draft' && this.status !== 'closed') {
    this.status = this.getCurrentStatus();
  }
  next();
});

// Index for search optimization
eventSchema.index({ eventName: 'text', eventDescription: 'text', eventTags: 'text' });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventStartDate: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
