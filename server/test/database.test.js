import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { CheckIn, Comment, Group, Like, Membership, User } from '../src/models/index.js';
import { seedDatabase } from '../src/db/seed.js';
import { DEMO_ACCOUNT } from '../src/db/seedData.js';
import { startOfWeek } from '../src/lib/week.js';
import { useTestServer } from './helpers.js';

const api = useTestServer();

const user = (n) => ({ name: `User ${n}`, email: `user${n}@illinois.edu`, passwordHash: 'x', weeklyGoal: 3 });
const group = { name: 'Test Group', initials: 'TG', category: 'Running' };

describe('database constraints', () => {
  it('allows one account per email, case-insensitively', async () => {
    await User.create(user(1));
    await assert.rejects(User.create({ ...user(2), email: 'USER1@illinois.edu' }), { code: 11000 });
  });

  it('does not return password hashes unless asked', async () => {
    await User.create(user(1));
    const plain = await User.findOne({ email: 'user1@illinois.edu' }).lean();
    assert.equal(plain.passwordHash, undefined);
    const withHash = await User.findOne({ email: 'user1@illinois.edu' }).select('+passwordHash').lean();
    assert.equal(withHash.passwordHash, 'x');
  });

  it('allows one membership per user per group', async () => {
    const u = await User.create(user(1));
    const g = await Group.create(group);
    await Membership.create({ user: u._id, group: g._id });
    await assert.rejects(Membership.create({ user: u._id, group: g._id }), { code: 11000 });
  });

  it('allows one like per user per check-in', async () => {
    const u = await User.create(user(1));
    const c = await CheckIn.create({ user: u._id, activity: 'Yoga', durationMin: 20 });
    await Like.create({ user: u._id, checkIn: c._id });
    await assert.rejects(Like.create({ user: u._id, checkIn: c._id }), { code: 11000 });
  });

  it('enforces check-in and comment limits in the schema', async () => {
    const u = await User.create(user(1));
    await assert.rejects(CheckIn.create({ user: u._id, activity: 'Swimming', durationMin: 20 }), mongoose.Error.ValidationError);
    await assert.rejects(CheckIn.create({ user: u._id, activity: 'Yoga', durationMin: 601 }), mongoose.Error.ValidationError);
    await assert.rejects(CheckIn.create({ user: u._id, activity: 'Yoga', durationMin: 2.5 }), mongoose.Error.ValidationError);
    const c = await CheckIn.create({ user: u._id, activity: 'Yoga', durationMin: 20 });
    assert.equal(c.group, null, 'check-ins are private unless a group is given');
    await assert.rejects(Comment.create({ user: u._id, checkIn: c._id, text: '   ' }), mongoose.Error.ValidationError);
  });

  it('has the indexes the API relies on', async () => {
    const names = async (Model) => Object.keys(await Model.collection.indexInformation());
    assert.ok((await names(CheckIn)).includes('group_1_createdAt_-1'));
    assert.ok((await names(CheckIn)).includes('user_1_createdAt_-1'));
    assert.ok((await names(Comment)).includes('checkIn_1_createdAt_1'));
    const sessionIndexes = await mongoose.connection.collection('sessions').indexes();
    const ttl = sessionIndexes.find((i) => i.key.expiresAt === 1);
    assert.equal(ttl?.expireAfterSeconds, 0, 'sessions expire automatically');
  });
});

describe('seed data', () => {
  it('loads the demo groups, people and posts', async () => {
    const now = new Date();
    await seedDatabase({ now, bcryptRounds: 4 });
    assert.equal(await User.countDocuments(), 7);
    assert.equal(await Group.countDocuments(), 4);
    assert.equal(await Membership.countDocuments(), 12);
    assert.equal(await CheckIn.countDocuments(), 8);
    assert.equal(await Comment.countDocuments(), 9);
    assert.ok((await Like.countDocuments()) > 0);

    const images = (await Group.find().lean()).map((g) => g.imageUrl).sort();
    assert.deepEqual(images, ['/images/campus-walkers.jpg', '/images/gym-beginners.jpg', '/images/morning-runners.jpg', '/images/yoga-stretch.jpg']);

    const demo = await User.findOne({ email: DEMO_ACCOUNT.email });
    const mine = await CheckIn.find({ user: demo._id }).lean();
    assert.equal(mine.length, 2);
    for (const c of mine) {
      assert.equal(c.group, null);
      assert.ok(c.createdAt >= startOfWeek(now) && c.createdAt <= now, 'demo workouts are earlier this week');
    }
    const alex = await CheckIn.findOne({ reflection: /First 5K/ }).lean();
    assert.ok(Math.abs(now - alex.createdAt - 120 * 60_000) < 1000, 'backdated times are kept');
  });

  it('lets the demo account sign in', async () => {
    await seedDatabase({ bcryptRounds: 4 });
    const res = await api().post('/api/auth/login').send(DEMO_ACCOUNT).expect(200);
    assert.equal(res.body.user.name, 'Zhanbo Chen');
    assert.deepEqual(res.body.user.favoriteActivities, ['Running', 'Strength']);
  });
});
