import { Router } from 'express';
import { User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { parseUserPatch } from '../lib/validate.js';
import { toUser } from '../lib/serialize.js';
import { HttpError, unauthorized } from '../lib/httpError.js';

export function usersRouter() {
  const router = Router();
  router.use(requireAuth);

  // PATCH /api/users/me  any of { name, weeklyGoal, bio, favoriteActivities, reminders } -> User
  // Only the signed-in user's own account can change; email and password are not editable here.
  router.patch('/me', async (req, res) => {
    const patch = parseUserPatch(req.body ?? {});
    const user = await User.findByIdAndUpdate(req.userId, { $set: patch }, { returnDocument: 'after', runValidators: true });
    if (!user) throw unauthorized();
    res.json(toUser(user));
  });

  // GET /api/users/me/week -> WeekSummary
  // TODO(Yuecheng): weekly progress for the dashboard. lib/week.js has the Chicago week math
  // (weekRange, dayIndex); count CheckIn rows where user = req.userId and createdAt is in range.
  router.get('/me/week', () => {
    throw new HttpError(501, 'Weekly progress isn’t available yet.');
  });

  return router;
}
