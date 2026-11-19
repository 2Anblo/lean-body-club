import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../lib/httpError.js';

// TODO(Yuecheng): check-in, like and comment routes from docs/api.md.
// Models: CheckIn, Like, Comment, Membership (src/models). Like has a unique (user, checkIn)
// index, so "like twice" can use updateOne(..., { upsert: true }).
export function checkInsRouter() {
  const router = Router();
  router.use(requireAuth);
  router.use(() => {
    throw new HttpError(501, 'Check-ins aren’t available yet.');
  });
  return router;
}
