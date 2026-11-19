import mongoose from 'mongoose';
import { HttpError } from '../lib/httpError.js';

export function notFoundRoute(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}.` });
}

// Every error leaves as { message } with a fitting status, never a stack trace.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });

  // Malformed JSON body.
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'The request body isn’t valid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'The request is too large.' });

  // A schema rule caught something the route didn't check.
  if (err instanceof mongoose.Error.ValidationError) {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ message: first?.message ?? 'Invalid input.' });
  }
  // An :id that isn't a valid ObjectId can't match anything.
  if (err instanceof mongoose.Error.CastError) return res.status(404).json({ message: 'Not found.' });
  // Unique index (e.g. two sign-ups with the same email at the same moment).
  if (err?.code === 11000) return res.status(409).json({ message: 'That already exists.' });

  if (err.status === 429) return res.status(429).json({ message: err.message });

  console.error(err);
  return res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
}
