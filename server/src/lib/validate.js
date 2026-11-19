// Input checks for the auth and account routes. Messages match client/src/api/mock.ts,
// because the UI shows them to students as-is.
import { ACTIVITIES, CLOCK, ILLINOIS_EMAIL, LIMITS } from './constants.js';
import { badRequest } from './httpError.js';

const isString = (v) => typeof v === 'string';

export function checkGoal(n) {
  if (!Number.isInteger(n) || n < LIMITS.goalMin || n > LIMITS.goalMax) {
    throw badRequest(`Weekly goal must be between ${LIMITS.goalMin} and ${LIMITS.goalMax} workouts.`);
  }
  return n;
}

function checkName(value, emptyMessage) {
  if (!isString(value) || !value.trim()) throw badRequest(emptyMessage);
  const name = value.trim();
  if (name.length > LIMITS.nameMax) throw badRequest(`Name must be ${LIMITS.nameMax} characters or fewer.`);
  return name;
}

export function normalizeEmail(value) {
  return isString(value) ? value.trim().toLowerCase() : '';
}

export function parseSignUp(body = {}) {
  const name = checkName(body.name, 'Please enter your name.');
  const email = normalizeEmail(body.email);
  if (!ILLINOIS_EMAIL.test(email)) throw badRequest('Use your @illinois.edu email address.');
  const password = body.password;
  if (!isString(password) || password.length < LIMITS.passwordMin) {
    throw badRequest(`Password must be at least ${LIMITS.passwordMin} characters.`);
  }
  if (password.length > LIMITS.passwordMax) {
    throw badRequest(`Password must be ${LIMITS.passwordMax} characters or fewer.`);
  }
  const weeklyGoal = checkGoal(body.weeklyGoal);
  return { name, email, password, weeklyGoal };
}

export function parseSignIn(body = {}) {
  const email = normalizeEmail(body.email);
  const password = body.password;
  if (!email || !isString(password) || !password) throw badRequest('Enter your email and password.');
  return { email, password };
}

/** Validates a PATCH /users/me body and returns only the fields that may change. */
export function parseUserPatch(body = {}) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) throw badRequest('Invalid request body.');
  const patch = {};

  if (body.name !== undefined) patch.name = checkName(body.name, 'Name can’t be empty.');

  if (body.weeklyGoal !== undefined) patch.weeklyGoal = checkGoal(body.weeklyGoal);

  if (body.bio !== undefined) {
    if (!isString(body.bio)) throw badRequest('Bio must be text.');
    if (body.bio.length > LIMITS.bioMax) throw badRequest(`Bio must be ${LIMITS.bioMax} characters or fewer.`);
    patch.bio = body.bio.trim();
  }

  if (body.favoriteActivities !== undefined) {
    const list = body.favoriteActivities;
    if (!Array.isArray(list) || !list.every((a) => ACTIVITIES.includes(a))) throw badRequest('Unknown activity.');
    patch.favoriteActivities = [...new Set(list)];
  }

  if (body.reminders !== undefined) {
    const r = body.reminders;
    if (r === null || typeof r !== 'object' || Array.isArray(r)) throw badRequest('Invalid reminder settings.');
    if (!isString(r.time) || !CLOCK.test(r.time)) throw badRequest('Reminder time must look like 19:00.');
    if (!Array.isArray(r.days) || !r.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
      throw badRequest('Unknown reminder day.');
    }
    const flags = ['daily', 'weeklySummaryEmail', 'commentNotifications', 'newMemberNotifications'];
    if (!flags.every((k) => typeof r[k] === 'boolean')) throw badRequest('Invalid reminder settings.');
    patch.reminders = {
      ...Object.fromEntries(flags.map((k) => [k, r[k]])),
      time: r.time,
      days: [...new Set(r.days)].sort((a, b) => a - b),
    };
  }

  return patch;
}
