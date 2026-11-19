import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkIn: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckIn', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// One like per user per check-in, so "like twice" is a no-op.
likeSchema.index({ user: 1, checkIn: 1 }, { unique: true });

export const Like = mongoose.model('Like', likeSchema);
