import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../lib/httpError.js';

// TODO(Yuecheng): group routes from docs/api.md (list/search, detail, join, leave, group feed).
// Models: Group, Membership, CheckIn (src/models). Serializers: toPerson (src/lib/serialize.js).
// req.userId is the signed-in user; requireAuth already rejected everyone else.
export function groupsRouter() {
  const router = Router();
  router.use(requireAuth);
  router.use(() => {
    throw new HttpError(501, 'Groups aren’t available yet.');
  });
  return router;
}
