import mongoose from 'mongoose';
import { ACTIVITIES, CLOCK, LIMITS, defaultReminders } from '../lib/constants.js';

const remindersSchema = new mongoose.Schema(
  {
    daily: { type: Boolean, default: true },
    time: { type: String, match: CLOCK, default: '19:00' },
    days: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: () => defaultReminders().days,
    },
    weeklySummaryEmail: { type: Boolean, default: true },
    commentNotifications: { type: Boolean, default: true },
    newMemberNotifications: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: LIMITS.nameMax },
    // Stored lowercase; the unique index makes duplicate sign-ups impossible even under a race.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Never sent to the client. Queries must ask for it explicitly with .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
    weeklyGoal: { type: Number, required: true, min: LIMITS.goalMin, max: LIMITS.goalMax },
    bio: { type: String, default: '', maxlength: LIMITS.bioMax },
    favoriteActivities: { type: [{ type: String, enum: ACTIVITIES }], default: [] },
    reminders: { type: remindersSchema, default: defaultReminders },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
