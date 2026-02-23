import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Common fields
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    required: true
  },
  
  // Participant specific fields
  firstName: {
    type: String,
    required: function() { return this.role === 'participant'; }
  },
  lastName: {
    type: String,
    required: function() { return this.role === 'participant'; }
  },
  participantType: {
    type: String,
    enum: ['iiit', 'non-iiit'],
    required: function() { return this.role === 'participant'; }
  },
  collegeName: {
    type: String,
    required: function() { 
      return this.role === 'participant' && this.participantType === 'non-iiit'; 
    },
    default: function() {
      return this.participantType === 'iiit' ? 'IIIT Hyderabad' : undefined;
    }
  },
  contactNumber: {
    type: String,
    required: function() { return this.role === 'participant'; },
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Contact number must be exactly 10 digits'
    }
  },
  interests: [{
    type: String
  }],
  followedClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Organizer specific fields
  organizerName: {
    type: String,
    required: function() { return this.role === 'organizer'; }
  },
  category: {
    type: String,
    required: function() { return this.role === 'organizer'; },
    enum: ['Cultural', 'Technical', 'Sports', 'Literary', 'Social', 'Academic']
  },
  description: {
    type: String,
    required: function() { return this.role === 'organizer'; }
  },
  contactEmail: {
    type: String,
    required: function() { return this.role === 'organizer'; }
  },
  discordWebhook: {
    type: String
  },
  
  // Common metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
