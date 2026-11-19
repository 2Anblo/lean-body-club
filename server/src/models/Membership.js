import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  joinedAt: { type: Date, default: Date.now },
});

// A user is in a group at most once, so "join twice" can't double-count members.
membershipSchema.index({ user: 1, group: 1 }, { unique: true });

export const Membership = mongoose.model('Membership', membershipSchema);
