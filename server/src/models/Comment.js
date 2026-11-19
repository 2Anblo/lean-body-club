import mongoose from 'mongoose';
import { LIMITS } from '../lib/constants.js';

const commentSchema = new mongoose.Schema(
  {
    checkIn: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckIn', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: LIMITS.commentMax },
  },
  { timestamps: true },
);

// Comments on one check-in, oldest first.
commentSchema.index({ checkIn: 1, createdAt: 1 });

export const Comment = mongoose.model('Comment', commentSchema);
