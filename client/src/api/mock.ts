// Mock backend: same behaviour and validation as the planned REST API, stored in localStorage.
import type { Api } from './types';
import { ApiError } from './errors';
import { getToken } from './token';
import { defaultReminders, loadDb, saveDb, seed, type CheckInRow, type DB, type GroupRow, type UserRow } from './mockDb';
import {
  ACTIVITIES,
  type CheckIn,
  type Comment,
  type Group,
  type GroupDetail,
  type PersonSummary,
  type User,
  type WeekSummary,
} from '../types';
import { dayIndex, startOfWeek } from '../lib/dates';
import { initialsOf } from '../lib/people';

const LATENCY_MS = 160;
const ILLINOIS_EMAIL = /^[^\s@]+@illinois\.edu$/i;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const byNewest = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);
const byOldest = (a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt);

function sessionUser(db: DB): UserRow {
  const token = getToken();
  const session = token ? db.sessions.find((s) => s.token === token) : undefined;
  const user = session ? db.users.find((u) => u.id === session.userId) : undefined;
  if (!user) throw new ApiError('Your session has ended. Please sign in again.', 401);
  return user;
}

function toUser(u: UserRow): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    weeklyGoal: u.weeklyGoal,
    bio: u.bio,
    favoriteActivities: [...u.favoriteActivities],
    reminders: { ...u.reminders, days: [...u.reminders.days] },
    createdAt: u.createdAt,
  };
}

function toPerson(db: DB, userId: string): PersonSummary {
  const name = db.users.find((u) => u.id === userId)?.name ?? 'Former member';
  return { id: userId, name, initials: initialsOf(name) };
}

function toGroup(db: DB, g: GroupRow, userId: string): Group {
  const members = db.memberships.filter((m) => m.groupId === g.id);
  const weekStart = startOfWeek().getTime();
  const thisWeek = db.checkIns.filter((c) => c.groupId === g.id && new Date(c.createdAt).getTime() >= weekStart);
  const authors = new Set(thisWeek.map((c) => c.userId));
  const memberCount = g.extraMembers + members.length;
  return {
    id: g.id,
    name: g.name,
    initials: g.initials,
    category: g.category,
    level: g.level,
    description: g.description,
    tagline: g.tagline,
    imageUrl: g.imageUrl,
    typicalGoal: g.typicalGoal,
    memberCount,
    checkInsThisWeek: g.extraCheckIns + thisWeek.length,
    activeMembersThisWeek: Math.min(memberCount, Math.round(g.extraMembers * 0.7) + authors.size),
    isMember: members.some((m) => m.userId === userId),
  };
}

function findGroup(db: DB, id: string): GroupRow {
  const g = db.groups.find((x) => x.id === id);
  if (!g) throw new ApiError('That group doesn’t exist.', 404);
  return g;
}

function canSee(c: CheckInRow, userId: string): boolean {
  return c.groupId !== null || c.userId === userId;
}

function findCheckIn(db: DB, id: string, userId: string): CheckInRow {
  const c = db.checkIns.find((x) => x.id === id);
  if (!c || !canSee(c, userId)) throw new ApiError('That check-in doesn’t exist.', 404);
  return c;
}

function toCheckIn(db: DB, c: CheckInRow, userId: string): CheckIn {
  const g = c.groupId ? db.groups.find((x) => x.id === c.groupId) : undefined;
  const likes = db.likes.filter((l) => l.checkInId === c.id);
  return {
    id: c.id,
    group: g ? { id: g.id, name: g.name } : null,
    author: toPerson(db, c.userId),
    activity: c.activity,
    durationMin: c.durationMin,
    reflection: c.reflection,
    createdAt: c.createdAt,
    likeCount: c.baseLikes + likes.length,
    likedByMe: likes.some((l) => l.userId === userId),
    commentCount: db.comments.filter((m) => m.checkInId === c.id).length,
  };
}

function weekSummary(db: DB, user: UserRow): WeekSummary {
  const start = startOfWeek();
  const startMs = start.getTime();
  const endMs = startMs + 7 * 86_400_000;
  const mine = db.checkIns
    .filter((c) => c.userId === user.id)
    .filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= startMs && t < endMs;
    })
    .sort(byNewest);
  const minutesByDay = new Array<number>(7).fill(0);
  const activeDays = new Array<boolean>(7).fill(false);
  for (const c of mine) {
    const i = dayIndex(new Date(c.createdAt));
    minutesByDay[i] += c.durationMin;
    activeDays[i] = true;
  }
  return {
    weekStart: start.toISOString(),
    goal: user.weeklyGoal,
    count: mine.length,
    totalMinutes: minutesByDay.reduce((a, b) => a + b, 0),
    minutesByDay,
    activeDays,
    entries: mine.map((c) => ({
      id: c.id,
      activity: c.activity,
      durationMin: c.durationMin,
      createdAt: c.createdAt,
      groupName: c.groupId ? (db.groups.find((g) => g.id === c.groupId)?.name ?? null) : null,
    })),
  };
}

function checkGoal(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > 14) throw new ApiError('Weekly goal must be between 1 and 14 workouts.');
}

function startSession(db: DB, userId: string): string {
  const token = newId('tok');
  db.sessions.push({ token, userId });
  return token;
}

export const mockApi: Api = {
  async signIn(email, password) {
    await delay();
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new ApiError('No account found for that email. Check the spelling or create an account.', 404);
    if (user.password !== password) throw new ApiError('That password doesn’t match. Try again.', 401);
    const token = startSession(db, user.id);
    saveDb(db);
    return { token, user: toUser(user) };
  },

  async signUp(input) {
    await delay();
    const db = loadDb();
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name) throw new ApiError('Please enter your name.');
    if (!ILLINOIS_EMAIL.test(email)) throw new ApiError('Use your @illinois.edu email address.');
    if (input.password.length < 8) throw new ApiError('Password must be at least 8 characters.');
    checkGoal(input.weeklyGoal);
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw new ApiError('An account with that email already exists. Try signing in instead.', 409);
    }
    const user: UserRow = {
      id: newId('u'),
      name,
      email,
      password: input.password,
      weeklyGoal: input.weeklyGoal,
      bio: '',
      favoriteActivities: [],
      reminders: defaultReminders(),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    const token = startSession(db, user.id);
    saveDb(db);
    return { token, user: toUser(user) };
  },

  async me() {
    await delay();
    return toUser(sessionUser(loadDb()));
  },

  async signOut() {
    await delay();
    const db = loadDb();
    const token = getToken();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDb(db);
  },

  async updateMe(patch) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new ApiError('Name can’t be empty.');
      if (name.length > 60) throw new ApiError('Name must be 60 characters or fewer.');
      user.name = name;
    }
    if (patch.weeklyGoal !== undefined) {
      checkGoal(patch.weeklyGoal);
      user.weeklyGoal = patch.weeklyGoal;
    }
    if (patch.bio !== undefined) {
      if (patch.bio.length > 160) throw new ApiError('Bio must be 160 characters or fewer.');
      user.bio = patch.bio.trim();
    }
    if (patch.favoriteActivities !== undefined) {
      const valid = patch.favoriteActivities.every((a) => (ACTIVITIES as readonly string[]).includes(a));
      if (!valid) throw new ApiError('Unknown activity.');
      user.favoriteActivities = [...new Set(patch.favoriteActivities)];
    }
    if (patch.reminders !== undefined) {
      const r = patch.reminders;
      if (!CLOCK.test(r.time)) throw new ApiError('Reminder time must look like 19:00.');
      if (!r.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) throw new ApiError('Unknown reminder day.');
      user.reminders = { ...r, days: [...new Set(r.days)].sort() };
    }
    saveDb(db);
    return toUser(user);
  },

  async myWeek() {
    await delay();
    const db = loadDb();
    return weekSummary(db, sessionUser(db));
  },

  async listGroups(params = {}) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    const q = params.q?.trim().toLowerCase() ?? '';
    return db.groups
      .filter((g) => !params.category || g.category === params.category)
      .filter((g) => !q || [g.name, g.category, g.tagline, g.description].some((s) => s.toLowerCase().includes(q)))
      .map((g) => toGroup(db, g, user.id));
  },

  async getGroup(id) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    const g = findGroup(db, id);
    const detail: GroupDetail = {
      ...toGroup(db, g, user.id),
      members: db.memberships.filter((m) => m.groupId === g.id).map((m) => toPerson(db, m.userId)),
    };
    return detail;
  },

  async joinGroup(id) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    const g = findGroup(db, id);
    if (!db.memberships.some((m) => m.groupId === id && m.userId === user.id)) {
      db.memberships.push({ userId: user.id, groupId: id, joinedAt: new Date().toISOString() });
      saveDb(db);
    }
    return toGroup(db, g, user.id);
  },

  async leaveGroup(id) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    const g = findGroup(db, id);
    db.memberships = db.memberships.filter((m) => !(m.groupId === id && m.userId === user.id));
    saveDb(db);
    return toGroup(db, g, user.id);
  },

  async groupFeed(id) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    findGroup(db, id);
    return db.checkIns
      .filter((c) => c.groupId === id)
      .sort(byNewest)
      .map((c) => toCheckIn(db, c, user.id));
  },

  async homeFeed() {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    const mine = new Set(db.memberships.filter((m) => m.userId === user.id).map((m) => m.groupId));
    return db.checkIns
      .filter((c) => c.groupId !== null && mine.has(c.groupId))
      .sort(byNewest)
      .slice(0, 6)
      .map((c) => toCheckIn(db, c, user.id));
  },

  async createCheckIn(input) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    if (!(ACTIVITIES as readonly string[]).includes(input.activity)) throw new ApiError('Pick an activity.');
    if (!Number.isInteger(input.durationMin) || input.durationMin < 1 || input.durationMin > 600) {
      throw new ApiError('Duration must be between 1 and 600 minutes.');
    }
    if (input.reflection.length > 280) throw new ApiError('Reflection must be 280 characters or fewer.');
    if (input.groupId) {
      findGroup(db, input.groupId);
      const isMember = db.memberships.some((m) => m.groupId === input.groupId && m.userId === user.id);
      if (!isMember) throw new ApiError('Join the group before posting to it.', 403);
    }
    const row: CheckInRow = {
      id: newId('c'),
      groupId: input.groupId,
      userId: user.id,
      activity: input.activity,
      durationMin: input.durationMin,
      reflection: input.reflection.trim(),
      createdAt: new Date().toISOString(),
      baseLikes: 0,
    };
    db.checkIns.push(row);
    saveDb(db);
    return toCheckIn(db, row, user.id);
  },

  async getCheckIn(id) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    return toCheckIn(db, findCheckIn(db, id, user.id), user.id);
  },

  async likeCheckIn(id) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    const c = findCheckIn(db, id, user.id);
    if (!db.likes.some((l) => l.checkInId === id && l.userId === user.id)) {
      db.likes.push({ checkInId: id, userId: user.id });
      saveDb(db);
    }
    return toCheckIn(db, c, user.id);
  },

  async unlikeCheckIn(id) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    const c = findCheckIn(db, id, user.id);
    db.likes = db.likes.filter((l) => !(l.checkInId === id && l.userId === user.id));
    saveDb(db);
    return toCheckIn(db, c, user.id);
  },

  async listComments(checkInId) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    findCheckIn(db, checkInId, user.id);
    return db.comments
      .filter((m) => m.checkInId === checkInId)
      .sort(byOldest)
      .map<Comment>((m) => ({ id: m.id, checkInId: m.checkInId, author: toPerson(db, m.userId), text: m.text, createdAt: m.createdAt }));
  },

  async addComment(checkInId, text) {
    await delay();
    const db = loadDb();
    const user = sessionUser(db);
    findCheckIn(db, checkInId, user.id);
    const body = text.trim();
    if (!body) throw new ApiError('Write something before sending.');
    if (body.length > 500) throw new ApiError('Comments must be 500 characters or fewer.');
    const row = { id: newId('m'), checkInId, userId: user.id, text: body, createdAt: new Date().toISOString() };
    db.comments.push(row);
    saveDb(db);
    return { id: row.id, checkInId, author: toPerson(db, user.id), text: row.text, createdAt: row.createdAt };
  },

  async resetDemo() {
    await delay();
    const old = loadDb();
    const fresh = seed();
    // Stay signed in if your account still exists after the reset.
    fresh.sessions = old.sessions.filter((s) => fresh.users.some((u) => u.id === s.userId));
    saveDb(fresh);
  },
};
