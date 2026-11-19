import { User } from '../models/index.js';
import { findSession } from '../lib/sessions.js';
import { unauthorized } from '../lib/httpError.js';

/** Reads "Authorization: Bearer <token>". */
export function bearerToken(req) {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : null;
}

/**
 * Rejects the request with 401 unless it carries a live session token.
 * On success: req.user (the User document), req.userId (string) and req.token.
 */
export async function requireAuth(req, _res, next) {
  const token = bearerToken(req);
  const session = token ? await findSession(token) : null;
  const user = session ? await User.findById(session.user) : null;
  if (!user) throw unauthorized();
  req.user = user;
  req.userId = String(user._id);
  req.token = token;
  next();
}
