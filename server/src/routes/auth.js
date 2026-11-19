import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { User } from '../models/index.js';
import { conflict, notFound, unauthorized } from '../lib/httpError.js';
import { parseSignIn, parseSignUp } from '../lib/validate.js';
import { toUser } from '../lib/serialize.js';
import { createSession, revokeSession } from '../lib/sessions.js';
import { bearerToken, requireAuth } from '../middleware/auth.js';

export function authRouter(config) {
  const router = Router();

  // Slow down password guessing: a fixed number of sign-up / sign-in attempts per IP per window.
  const attempts = rateLimit({
    windowMs: 15 * 60_000,
    limit: config.authRateLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many attempts. Wait a few minutes and try again.' },
  });

  // POST /api/auth/signup  { name, email, password, weeklyGoal } -> 201 Session
  router.post('/signup', attempts, async (req, res) => {
    const input = parseSignUp(req.body);
    if (await User.exists({ email: input.email })) {
      throw conflict('An account with that email already exists. Try signing in instead.');
    }
    const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
    let user;
    try {
      user = await User.create({ name: input.name, email: input.email, passwordHash, weeklyGoal: input.weeklyGoal });
    } catch (err) {
      // Another request created the same email between the check and the insert.
      if (err?.code === 11000) throw conflict('An account with that email already exists. Try signing in instead.');
      throw err;
    }
    const token = await createSession(user._id, config.sessionTtlDays);
    res.status(201).json({ token, user: toUser(user) });
  });

  // POST /api/auth/login  { email, password } -> Session
  router.post('/login', attempts, async (req, res) => {
    const { email, password } = parseSignIn(req.body);
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw notFound('No account found for that email. Check the spelling or create an account.');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized('That password doesn’t match. Try again.');
    const token = await createSession(user._id, config.sessionTtlDays);
    res.json({ token, user: toUser(user) });
  });

  // GET /api/auth/me -> User (401 when the token is missing, wrong or expired)
  router.get('/me', requireAuth, (req, res) => {
    res.json(toUser(req.user));
  });

  // POST /api/auth/logout -> 204. Ends this device's session only. Safe to call twice.
  router.post('/logout', async (req, res) => {
    await revokeSession(bearerToken(req));
    res.status(204).end();
  });

  return router;
}
