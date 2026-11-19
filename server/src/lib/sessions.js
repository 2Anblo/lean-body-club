import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Session } from '../models/index.js';

const DAY_MS = 86_400_000;

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Creates a session for a user and returns the raw token. Only its hash is stored. */
export async function createSession(userId, ttlDays) {
  const token = crypto.randomBytes(32).toString('base64url');
  await Session.create({
    tokenHash: hashToken(token),
    user: userId,
    expiresAt: new Date(Date.now() + ttlDays * DAY_MS),
  });
  return token;
}

/** The live session for a raw token, or null. Expired rows count as missing even before MongoDB removes them. */
export async function findSession(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 200) return null;
  // trusted(): sanitizeFilter would otherwise neutralize our own $gt operator.
  return Session.findOne({ tokenHash: hashToken(token), expiresAt: mongoose.trusted({ $gt: new Date() }) });
}

export async function revokeSession(token) {
  if (typeof token !== 'string' || !token) return;
  await Session.deleteOne({ tokenHash: hashToken(token) });
}

export async function revokeAllSessions(userId) {
  await Session.deleteMany({ user: userId });
}
