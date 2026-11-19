import mongoose from 'mongoose';
import { ACTIVITIES, LIMITS } from '../lib/constants.js';

const checkInSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // null = private: only the author can see it, but it still counts toward the weekly goal.
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    activity: { type: String, required: true, enum: ACTIVITIES },
    durationMin: {
      type: Number,
      required: true,
      min: LIMITS.durationMin,
      max: LIMITS.durationMax,
      validate: { validator: Number.isInteger, message: 'Duration must be a whole number of minutes.' },
    },
    reflection: { type: String, default: '', trim: true, maxlength: LIMITS.reflectionMax },
  },
  { timestamps: true },
);

// Group feed (newest first) and a user's week / history.
checkInSchema.index({ group: 1, createdAt: -1 });
checkInSchema.index({ user: 1, createdAt: -1 });

export const CheckIn = mongoose.model('CheckIn', checkInSchema);
