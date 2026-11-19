// Demo data for development and the live demo. Mirrors client/src/api/mockDb.ts,
// so the real backend starts with the same groups, people and posts as the mock.
import { startOfWeek, timeInWeek } from '../lib/week.js';
import { defaultReminders } from '../lib/constants.js';

export const DEMO_ACCOUNT = { email: 'zhanboc2@illinois.edu', password: 'password123' };
export const DEMO_PASSWORD = 'password123';

export function buildSeed(now = new Date()) {
  const ago = (minutes) => new Date(now.getTime() - minutes * 60_000);
  const weekStart = startOfWeek(now);

  // A time earlier this week (so the demo user starts at 2 of 3), never in the future.
  const earlierThisWeek = (day, hour, fallbackMinutesAgo) => {
    const t = timeInWeek(weekStart, day, hour);
    if (t < now) return t;
    return new Date(Math.max(weekStart.getTime() + 60_000, now.getTime() - fallbackMinutesAgo * 60_000));
  };

  const person = (key, name, email, extra = {}) => ({
    key,
    name,
    email,
    weeklyGoal: 3,
    bio: '',
    favoriteActivities: [],
    reminders: defaultReminders(),
    createdAt: ago(60 * 24 * 40),
    ...extra,
  });

  const users = [
    person('zhanbo', 'Zhanbo Chen', DEMO_ACCOUNT.email, {
      bio: 'Trying to run 3x a week this semester.',
      favoriteActivities: ['Running', 'Strength'],
      createdAt: ago(60 * 24 * 12),
    }),
    person('alex', 'Alex Kim', 'alexk3@illinois.edu'),
    person('priya', 'Priya Shah', 'priyas7@illinois.edu'),
    person('jordan', 'Jordan Lee', 'jlee212@illinois.edu'),
    person('maya', 'Maya Torres', 'mtorres9@illinois.edu'),
    person('sam', 'Sam Patel', 'spatel44@illinois.edu'),
    person('lena', 'Lena Wu', 'lenawu2@illinois.edu'),
  ];

  const groups = [
    {
      key: 'morning-runners',
      name: 'Morning Runners',
      initials: 'MR',
      category: 'Running',
      level: 'Beginner-friendly',
      description: 'Easy-pace runs around campus. Any distance counts — show up, check in, and cheer each other on.',
      tagline: 'Easy-pace runs around campus',
      imageUrl: '/images/morning-runners.jpg',
      typicalGoal: 3,
    },
    {
      key: 'gym-beginners',
      name: 'Gym Beginners',
      initials: 'GB',
      category: 'Strength',
      level: 'Beginner-friendly',
      description: 'New to lifting? Learn the basics together — form tips, simple routines, no ego.',
      tagline: 'New to lifting? Start here',
      imageUrl: '/images/gym-beginners.jpg',
      typicalGoal: 2,
    },
    {
      key: 'campus-walkers',
      name: 'Campus Walkers',
      initials: 'CW',
      category: 'Walking',
      level: 'All levels',
      description: 'Walks between classes count! Log your strolls and keep each other moving.',
      tagline: 'Walks between classes count',
      imageUrl: '/images/campus-walkers.jpg',
      typicalGoal: 4,
    },
    {
      key: 'yoga-stretch',
      name: 'Yoga & Stretch',
      initials: 'YS',
      category: 'Mobility',
      level: 'Beginner-friendly',
      description: 'Gentle stretching and yoga to recover, de-stress, and stay mobile.',
      tagline: 'Recover, de-stress, stay mobile',
      imageUrl: '/images/yoga-stretch.jpg',
      typicalGoal: 2,
    },
  ];

  const joined = ago(60 * 24 * 20);
  const memberships = [
    ['alex', 'morning-runners'],
    ['priya', 'morning-runners'],
    ['jordan', 'morning-runners'],
    ['maya', 'morning-runners'],
    ['sam', 'morning-runners'],
    ['maya', 'gym-beginners'],
    ['jordan', 'gym-beginners'],
    ['sam', 'campus-walkers'],
    ['priya', 'campus-walkers'],
    ['lena', 'campus-walkers'],
    ['lena', 'yoga-stretch'],
    ['alex', 'yoga-stretch'],
  ].map(([user, group]) => ({ user, group, joinedAt: joined }));

  const checkIns = [
    { key: 'alex-1', group: 'morning-runners', user: 'alex', activity: 'Running', durationMin: 25, reflection: 'First 5K without stopping! Slow and steady.', createdAt: ago(120) },
    { key: 'priya-1', group: 'morning-runners', user: 'priya', activity: 'Running', durationMin: 40, reflection: 'Rainy loop around the Quad. Showing up is the hard part.', createdAt: ago(60 * 26) },
    { key: 'jordan-1', group: 'morning-runners', user: 'jordan', activity: 'Running', durationMin: 35, reflection: 'Early loop before my 9am. Legs felt fresh today.', createdAt: ago(60 * 50) },
    { key: 'maya-1', group: 'gym-beginners', user: 'maya', activity: 'Strength', durationMin: 45, reflection: 'Finally finished a full bodyweight squat set. Small wins!', createdAt: ago(300) },
    { key: 'sam-1', group: 'campus-walkers', user: 'sam', activity: 'Walking', durationMin: 30, reflection: 'Walked to the ARC instead of taking the bus. Nice sunset.', createdAt: ago(60) },
    { key: 'lena-1', group: 'yoga-stretch', user: 'lena', activity: 'Yoga', durationMin: 20, reflection: 'Short evening flow after a long study day. My back feels so much better.', createdAt: ago(180) },
    // The demo user's own private workouts earlier this week (2 of 3).
    { key: 'me-1', group: null, user: 'zhanbo', activity: 'Running', durationMin: 30, reflection: 'Easy jog around the block.', createdAt: earlierThisWeek(0, 7, 180) },
    { key: 'me-2', group: null, user: 'zhanbo', activity: 'Strength', durationMin: 45, reflection: 'First time trying the leg press.', createdAt: earlierThisWeek(2, 18, 90) },
  ];

  // Likes from other seed users, so the feed doesn't start at zero.
  const likes = [
    ['priya', 'alex-1'], ['jordan', 'alex-1'], ['maya', 'alex-1'], ['sam', 'alex-1'],
    ['alex', 'priya-1'], ['jordan', 'priya-1'], ['maya', 'priya-1'], ['sam', 'priya-1'],
    ['alex', 'jordan-1'], ['priya', 'jordan-1'],
    ['jordan', 'maya-1'],
    ['priya', 'sam-1'], ['lena', 'sam-1'],
    ['alex', 'lena-1'],
  ].map(([user, checkIn]) => ({ user, checkIn }));

  const comment = (checkIn, user, text, minutesAgo) => ({ checkIn, user, text, createdAt: ago(minutesAgo) });
  const comments = [
    comment('alex-1', 'priya', 'Huge! Want to join our easy 5K on Saturday?', 60),
    comment('alex-1', 'jordan', 'Slow and steady is the way. Proud of you!', 45),
    comment('priya-1', 'jordan', 'Rain runs count double. Nice work!', 180),
    comment('priya-1', 'alex', 'The Quad loop is my favorite. Join us Saturday?', 120),
    comment('priya-1', 'maya', 'Showing up is everything. Proud of you!', 60),
    comment('maya-1', 'jordan', 'Your form looked great today!', 240),
    comment('sam-1', 'priya', 'That walk is so underrated.', 50),
    comment('sam-1', 'lena', 'Sunsets by the ARC are the best.', 30),
    comment('lena-1', 'alex', 'Needed this after midterms.', 120),
  ];

  return { users, groups, memberships, checkIns, likes, comments };
}
