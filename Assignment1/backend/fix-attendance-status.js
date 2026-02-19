// Quick script to fix existing registrations with attended=true but status='registered'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Registration from './models/Registration.js';

dotenv.config();

const fixAttendanceStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all registrations where attended=true but status is not 'attended'
    const result = await Registration.updateMany(
      { attended: true, status: { $ne: 'attended' } },
      { $set: { status: 'attended' } }
    );

    console.log(`Updated ${result.modifiedCount} registrations`);
    console.log('✅ All attendance statuses fixed!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixAttendanceStatus();
