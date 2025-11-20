import mongoose from 'mongoose';
import Streak from './models/streakModel.js';
import StudySession from './models/studySessionModel.js';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/progress-brain');
    console.log('✓ Connected to MongoDB');

    // Check users
    const users = await User.find().limit(1);
    if (users.length === 0) {
      console.log('❌ No users found');
      process.exit(1);
    }
    const userId = users[0]._id;
    console.log(`✓ Found user: ${users[0].username} (${userId})`);

    // Check streaks
    const streaks = await Streak.find({ user: userId });
    if (streaks.length === 0) {
      console.log('❌ NO STREAKS FOUND for this user');
    } else {
      console.log(`✓ Found ${streaks.length} streak(s):`);
      streaks.forEach((s, i) => {
        console.log(`  [${i + 1}] currentStreak: ${s.currentStreak}, highestStreak: ${s.highestStreak}, lastActiveDate: ${s.lastActiveDate}`);
      });
    }

    // Check sessions
    const sessions = await StudySession.find({ user: userId }).sort({ createdAt: -1 }).limit(3);
    if (sessions.length === 0) {
      console.log('❌ NO SESSIONS FOUND for this user');
    } else {
      console.log(`✓ Found ${sessions.length} recent session(s):`);
      sessions.forEach((s, i) => {
        console.log(`  [${i + 1}] ${s.subject} - ${s.topic} | Status: ${s.status} | Duration: ${s.actualDuration}s | Notes: ${s.notes ? 'YES' : 'NO'}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
