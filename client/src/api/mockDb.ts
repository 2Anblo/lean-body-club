// In-browser "database" used until the real backend is ready.
// MOCK ONLY: passwords are stored in plain text here. The real server must hash them.
import type { Activity, ReminderSettings, User } from '../types';
import { startOfWeek } from '../lib/dates';

export interface UserRow extends User {
  password: string;
}

export interface GroupRow {
  id: string;
  name: string;
  initials: string;
  category: string;
  level: string;
  description: string;
  tagline: string;
  imageUrl: string;
  typicalGoal: number;
  /** Members and check-ins that exist "off screen", so the demo feels lived-in. */
  extraMembers: number;
  extraCheckIns: number;
}

export interface MembershipRow {
  userId: string;
  groupId: string;
  joinedAt: string;
}

export interface CheckInRow {
  id: string;
  groupId: string | null;
  userId: string;
  activity: Activity;
  durationMin: number;
  reflection: string;
  createdAt: string;
  /** Likes from people outside the seed data. */
  baseLikes: number;
}

export interface LikeRow {
  userId: string;
  checkInId: string;
}

export interface CommentRow {
  id: string;
  checkInId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface SessionRow {
  token: string;
  userId: string;
}

export interface DB {
  version: 1;
  users: UserRow[];
  groups: GroupRow[];
  memberships: MembershipRow[];
  checkIns: CheckInRow[];
  likes: LikeRow[];
  comments: CommentRow[];
  sessions: SessionRow[];
}

const KEY = 'lbc-mock-db-v1';

export const DEMO_ACCOUNT = { email: 'zhanboc2@illinois.edu', password: 'password123' };

export function defaultReminders(): ReminderSettings {
  return {
    daily: true,
    time: '19:00',
    days: [0, 1, 2, 3, 4],
    weeklySummaryEmail: true,
    commentNotifications: true,
    newMemberNotifications: false,
  };
}

export function loadDb(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db.version === 1) return db;
    }
  } catch {
    /* corrupted or blocked storage: start fresh */
  }
  const db = seed();
  saveDb(db);
  return db;
}

export function saveDb(db: DB): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked */
  }
}

export function seed(now: Date = new Date()): DB {
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
  const weekStart = startOfWeek(now);

  // A time earlier this week (so the demo user starts at 2 of 3), never in the future.
  const earlierThisWeek = (day: number, hour: number, fallbackMinutesAgo: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + day);
    d.setHours(hour, 0, 0, 0);
    if (d.getTime() < now.getTime()) return d.toISOString();
    const fallback = Math.max(weekStart.getTime() + 60_000, now.getTime() - fallbackMinutesAgo * 60_000);
    return new Date(fallback).toISOString();
  };

  const person = (id: string, name: string, email: string): UserRow => ({
    id,
    name,
    email,
    password: 'password123',
    weeklyGoal: 3,
    bio: '',
    favoriteActivities: [],
    reminders: defaultReminders(),
    createdAt: ago(60 * 24 * 40),
  });

  const users: UserRow[] = [
    {
      ...person('u-zhanbo', 'Zhanbo Chen', DEMO_ACCOUNT.email),
      password: DEMO_ACCOUNT.password,
      bio: 'Trying to run 3x a week this semester.',
      favoriteActivities: ['Running', 'Strength'],
      createdAt: ago(60 * 24 * 12),
    },
    person('u-alex', 'Alex Kim', 'alexk3@illinois.edu'),
    person('u-priya', 'Priya Shah', 'priyas7@illinois.edu'),
    person('u-jordan', 'Jordan Lee', 'jlee212@illinois.edu'),
    person('u-maya', 'Maya Torres', 'mtorres9@illinois.edu'),
    person('u-sam', 'Sam Patel', 'spatel44@illinois.edu'),
    person('u-lena', 'Lena Wu', 'lenawu2@illinois.edu'),
  ];

  const groups: GroupRow[] = [
    {
      id: 'g-morning-runners',
      name: 'Morning Runners',
      initials: 'MR',
      category: 'Running',
      level: 'Beginner-friendly',
      description: 'Easy-pace runs around campus. Any distance counts — show up, check in, and cheer each other on.',
      tagline: 'Easy-pace runs around campus',
      imageUrl: '/images/morning-runners.jpg',
      typicalGoal: 3,
      extraMembers: 13,
      extraCheckIns: 39,
    },
    {
      id: 'g-gym-beginners',
      name: 'Gym Beginners',
      initials: 'GB',
      category: 'Strength',
      level: 'Beginner-friendly',
      description: 'New to lifting? Learn the basics together — form tips, simple routines, no ego.',
      tagline: 'New to lifting? Start here',
      imageUrl: '/images/gym-beginners.jpg',
      typicalGoal: 2,
      extraMembers: 22,
      extraCheckIns: 30,
    },
    {
      id: 'g-campus-walkers',
      name: 'Campus Walkers',
      initials: 'CW',
      category: 'Walking',
      level: 'All levels',
      description: 'Walks between classes count! Log your strolls and keep each other moving.',
      tagline: 'Walks between classes count',
      imageUrl: '/images/campus-walkers.jpg',
      typicalGoal: 4,
      extraMembers: 28,
      extraCheckIns: 56,
    },
    {
      id: 'g-yoga-stretch',
      name: 'Yoga & Stretch',
      initials: 'YS',
      category: 'Mobility',
      level: 'Beginner-friendly',
      description: 'Gentle stretching and yoga to recover, de-stress, and stay mobile.',
      tagline: 'Recover, de-stress, stay mobile',
      imageUrl: '/images/yoga-stretch.jpg',
      typicalGoal: 2,
      extraMembers: 10,
      extraCheckIns: 14,
    },
  ];

  const member = (userId: string, groupId: string) => ({ userId, groupId, joinedAt: ago(60 * 24 * 20) });
  const memberships: MembershipRow[] = [
    member('u-alex', 'g-morning-runners'),
    member('u-priya', 'g-morning-runners'),
    member('u-jordan', 'g-morning-runners'),
    member('u-maya', 'g-morning-runners'),
    member('u-sam', 'g-morning-runners'),
    member('u-maya', 'g-gym-beginners'),
    member('u-jordan', 'g-gym-beginners'),
    member('u-sam', 'g-campus-walkers'),
    member('u-priya', 'g-campus-walkers'),
    member('u-lena', 'g-campus-walkers'),
    member('u-lena', 'g-yoga-stretch'),
    member('u-alex', 'g-yoga-stretch'),
  ];

  const checkIns: CheckInRow[] = [
    { id: 'c-alex-1', groupId: 'g-morning-runners', userId: 'u-alex', activity: 'Running', durationMin: 25, reflection: 'First 5K without stopping! Slow and steady.', createdAt: ago(120), baseLikes: 6 },
    { id: 'c-priya-1', groupId: 'g-morning-runners', userId: 'u-priya', activity: 'Running', durationMin: 40, reflection: 'Rainy loop around the Quad. Showing up is the hard part.', createdAt: ago(60 * 26), baseLikes: 9 },
    { id: 'c-jordan-1', groupId: 'g-morning-runners', userId: 'u-jordan', activity: 'Running', durationMin: 35, reflection: 'Early loop before my 9am. Legs felt fresh today.', createdAt: ago(60 * 50), baseLikes: 3 },
    { id: 'c-maya-1', groupId: 'g-gym-beginners', userId: 'u-maya', activity: 'Strength', durationMin: 45, reflection: 'Finally finished a full bodyweight squat set. Small wins!', createdAt: ago(300), baseLikes: 4 },
    { id: 'c-sam-1', groupId: 'g-campus-walkers', userId: 'u-sam', activity: 'Walking', durationMin: 30, reflection: 'Walked to the ARC instead of taking the bus. Nice sunset.', createdAt: ago(60), baseLikes: 8 },
    { id: 'c-lena-1', groupId: 'g-yoga-stretch', userId: 'u-lena', activity: 'Yoga', durationMin: 20, reflection: 'Short evening flow after a long study day. My back feels so much better.', createdAt: ago(180), baseLikes: 5 },
    // The demo user's own private workouts earlier this week (2 of 3).
    { id: 'c-me-1', groupId: null, userId: 'u-zhanbo', activity: 'Running', durationMin: 30, reflection: 'Easy jog around the block.', createdAt: earlierThisWeek(0, 7, 180), baseLikes: 0 },
    { id: 'c-me-2', groupId: null, userId: 'u-zhanbo', activity: 'Strength', durationMin: 45, reflection: 'First time trying the leg press.', createdAt: earlierThisWeek(2, 18, 90), baseLikes: 0 },
  ];

  const comment = (id: string, checkInId: string, userId: string, text: string, minutesAgo: number): CommentRow => ({
    id,
    checkInId,
    userId,
    text,
    createdAt: ago(minutesAgo),
  });

  const comments: CommentRow[] = [
    comment('m-1', 'c-alex-1', 'u-priya', 'Huge! Want to join our easy 5K on Saturday?', 60),
    comment('m-2', 'c-alex-1', 'u-jordan', 'Slow and steady is the way. Proud of you!', 45),
    comment('m-3', 'c-priya-1', 'u-jordan', 'Rain runs count double. Nice work!', 180),
    comment('m-4', 'c-priya-1', 'u-alex', 'The Quad loop is my favorite. Join us Saturday?', 120),
    comment('m-5', 'c-priya-1', 'u-maya', 'Showing up is everything. Proud of you!', 60),
    comment('m-6', 'c-maya-1', 'u-jordan', 'Your form looked great today!', 240),
    comment('m-7', 'c-sam-1', 'u-priya', 'That walk is so underrated.', 50),
    comment('m-8', 'c-sam-1', 'u-lena', 'Sunsets by the ARC are the best.', 30),
    comment('m-9', 'c-lena-1', 'u-alex', 'Needed this after midterms.', 120),
  ];

  return { version: 1, users, groups, memberships, checkIns, likes: [], comments, sessions: [] };
}
