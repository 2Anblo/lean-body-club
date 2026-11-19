import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../src/models/index.js';
import { signUp, useTestServer } from './helpers.js';

const api = useTestServer();

const reminders = {
  daily: false,
  time: '07:30',
  days: [4, 0, 2, 2],
  weeklySummaryEmail: false,
  commentNotifications: true,
  newMemberNotifications: true,
};

describe('PATCH /api/users/me', () => {
  it('requires a session', async () => {
    await api().patch('/api/users/me').send({ name: 'X' }).expect(401);
  });

  it('updates profile, goal, activities and reminders', async () => {
    const { auth } = await signUp(api);
    const res = await api()
      .patch('/api/users/me')
      .set('Authorization', auth)
      .send({ name: '  New Name ', weeklyGoal: 5, bio: ' Hi! ', favoriteActivities: ['Yoga', 'Yoga', 'Running'], reminders })
      .expect(200);
    assert.equal(res.body.name, 'New Name');
    assert.equal(res.body.weeklyGoal, 5);
    assert.equal(res.body.bio, 'Hi!');
    assert.deepEqual(res.body.favoriteActivities, ['Yoga', 'Running']);
    assert.deepEqual(res.body.reminders, { ...reminders, days: [0, 2, 4] });

    const me = await api().get('/api/auth/me').set('Authorization', auth).expect(200);
    assert.deepEqual(me.body, res.body, 'changes are saved to the database');
  });

  it('leaves fields that are not in the body alone', async () => {
    const { auth, user } = await signUp(api);
    const res = await api().patch('/api/users/me').set('Authorization', auth).send({ bio: 'Only the bio' }).expect(200);
    assert.equal(res.body.name, user.name);
    assert.equal(res.body.weeklyGoal, user.weeklyGoal);
    assert.deepEqual(res.body.reminders, user.reminders);
  });

  it('ignores email and password in the body', async () => {
    const { auth } = await signUp(api);
    const res = await api()
      .patch('/api/users/me')
      .set('Authorization', auth)
      .send({ email: 'hacker@illinois.edu', password: 'newpassword', passwordHash: 'x' })
      .expect(200);
    assert.equal(res.body.email, 'tester1@illinois.edu');
    await api().post('/api/auth/login').send({ email: 'tester1@illinois.edu', password: 'correct horse' }).expect(200);
  });

  it('only changes the signed-in user', async () => {
    const a = await signUp(api);
    const b = await signUp(api, { email: 'other2@illinois.edu', name: 'Other Person' });
    await api().patch('/api/users/me').set('Authorization', a.auth).send({ name: 'Changed' }).expect(200);
    const other = await User.findById(b.user.id).lean();
    assert.equal(other.name, 'Other Person');
  });

  const invalid = [
    ['empty name', { name: '  ' }, 'Name can’t be empty.'],
    ['long name', { name: 'n'.repeat(61) }, 'Name must be 60 characters or fewer.'],
    ['goal of 0', { weeklyGoal: 0 }, 'Weekly goal must be between 1 and 14 workouts.'],
    ['long bio', { bio: 'b'.repeat(161) }, 'Bio must be 160 characters or fewer.'],
    ['unknown activity', { favoriteActivities: ['Swimming'] }, 'Unknown activity.'],
    ['bad reminder time', { reminders: { ...reminders, time: '7pm' } }, 'Reminder time must look like 19:00.'],
    ['bad reminder day', { reminders: { ...reminders, days: [7] } }, 'Unknown reminder day.'],
    ['missing reminder flag', { reminders: { time: '19:00', days: [] } }, 'Invalid reminder settings.'],
  ];
  for (const [label, body, message] of invalid) {
    it(`rejects ${label} with 400 and changes nothing`, async () => {
      const { auth, user } = await signUp(api);
      const res = await api().patch('/api/users/me').set('Authorization', auth).send(body).expect(400);
      assert.equal(res.body.message, message);
      const me = await api().get('/api/auth/me').set('Authorization', auth);
      assert.deepEqual(me.body, user);
    });
  }
});
