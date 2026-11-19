import mongoose from 'mongoose';
import { GROUP_CATEGORIES, LIMITS } from '../lib/constants.js';

// memberCount, checkInsThisWeek and activeMembersThisWeek are not stored here:
// they are counted from memberships and check-ins so they can't drift out of sync.
const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: LIMITS.nameMax },
    initials: { type: String, required: true, maxlength: 3 },
    category: { type: String, required: true, enum: GROUP_CATEGORIES },
    level: { type: String, default: 'All levels' },
    description: { type: String, default: '' },
    tagline: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    typicalGoal: { type: Number, min: LIMITS.goalMin, max: LIMITS.goalMax, default: 3 },
  },
  { timestamps: true },
);

groupSchema.index({ category: 1, name: 1 });

export const Group = mongoose.model('Group', groupSchema);
