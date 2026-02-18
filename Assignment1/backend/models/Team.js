import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamSize: {
    type: Number,
    required: true,
    min: 2
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  inviteCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['incomplete', 'complete', 'registered'],
    default: 'incomplete'
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups (inviteCode already indexed via unique: true)
teamSchema.index({ event: 1, teamLeader: 1 });

const Team = mongoose.model('Team', teamSchema);
export default Team;
