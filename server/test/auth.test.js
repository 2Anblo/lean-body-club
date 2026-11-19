import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Session, User } from '../src/models/index.js';
import { hashToken } from '../src/lib/sessions.js';
import { signUp, useTestServer, validSignUp } from './helpers.js';

const api = useTestServer();

describe('POST /api/auth/signup', () => {
  it('creates an account and returns a session', async () => {
    const res = await api().post('/api/auth/signup').send(validSignUp({ email: '  Tester1@ILLINOIS.edu ' })).expect(201);
    assert.equal(typeof res.body.token, 'string');
    assert.ok(res.body.token.length >= 40);
    const u = res.body.user;
    assert.equal(u.email, 'tester1@illinois.edu', 'email is trimmed and lowercased');
    assert.equal(u.name, 'Test Student');
    assert.equal(u.weeklyGoal, 3);
    assert.equal(u.bio, '');
    assert.deepEqual(u.favoriteActivities, []);
    assert.deepEqual(u.reminders.days, [0, 1, 2, 3, 4]);
    assert.ok(!Number.isNaN(Date.parse(u.createdAt)));
    assert.equal(u.password, undefined);
    assert.equal(u.passwordHash, undefined);
  });

  it('stores a bcrypt hash, not the password', async () => {
    await signUp(api);
    const row = await User.findOne({ email: 'tester1@illinois.edu' }).select('+passwordHash').lean();
    assert.match(row.passwordHash, /^\$2[aby]\$/);
    assert.ok(!row.passwordHash.includes('correct horse'));
  });

  it('stores only a hash of the session token', async () => {
    const { token } = await signUp(api);
    assert.equal(await Session.countDocuments({ tokenHash: token }), 0);
    assert.equal(await Session.countDocuments({ tokenHash: hashToken(token) }), 1);
  });

  it('rejects a duplicate email regardless of case with 409', async () => {
    await signUp(api);
    const res = await api().post('/api/auth/signup').send(validSignUp({ email: 'TESTER1@illinois.edu' })).expect(409);
    assert.match(res.body.message, /already exists/);
  });

  const invalid = [
    ['missing name', { name: '   ' }, 'Please enter your name.'],
    ['long name', { name: 'x'.repeat(61) }, 'Name must be 60 characters or fewer.'],
    ['non-Illinois email', { email: 'someone@gmail.com' }, 'Use your @illinois.edu email address.'],
    ['email as an object', { email: { $ne: null } }, 'Use your @illinois.edu email address.'],
    ['short password', { password: 'short' }, 'Password must be at least 8 characters.'],
    ['password as a number', { password: 12345678 }, 'Password must be at least 8 characters.'],
    ['goal too high', { weeklyGoal: 15 }, 'Weekly goal must be between 1 and 14 workouts.'],
    ['goal not an integer', { weeklyGoal: 2.5 }, 'Weekly goal must be between 1 and 14 workouts.'],
    ['goal as a string', { weeklyGoal: '3' }, 'Weekly goal must be between 1 and 14 workouts.'],
  ];
  for (const [label, override, message] of invalid) {
    it(`rejects ${label} with 400`, async () => {
      const res = await api().post('/api/auth/signup').send(validSignUp(override)).expect(400);
      assert.equal(res.body.message, message);
      assert.equal(await User.countDocuments(), 0);
    });
  }
});

describe('POST /api/auth/login', () => {
  it('signs in with the right password, ignoring email case', async () => {
    await signUp(api);
    const res = await api().post('/api/auth/login').send({ email: 'TESTER1@illinois.edu', password: 'correct horse' }).expect(200);
    assert.equal(res.body.user.email, 'tester1@illinois.edu');
    assert.equal(res.body.user.passwordHash, undefined);
    await api().get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`).expect(200);
  });

  it('returns 401 for a wrong password', async () => {
    await signUp(api);
    const res = await api().post('/api/auth/login').send({ email: 'tester1@illinois.edu', password: 'wrong password' }).expect(401);
    assert.equal(res.body.message, 'That password doesn’t match. Try again.');
  });

  it('returns 404 for an unknown email', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'nobody@illinois.edu', password: 'whatever1' }).expect(404);
    assert.match(res.body.message, /No account found/);
  });

  it('does not treat a query object as an email (NoSQL injection)', async () => {
    await signUp(api);
    await api().post('/api/auth/login').send({ email: { $gt: '' }, password: 'correct horse' }).expect(400);
  });

  it('gives each sign-in its own session', async () => {
    const first = await signUp(api);
    const second = await api().post('/api/auth/login').send({ email: 'tester1@illinois.edu', password: 'correct horse' });
    assert.notEqual(first.token, second.body.token);
    assert.equal(await Session.countDocuments(), 2);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in user', async () => {
    const { auth, user } = await signUp(api);
    const res = await api().get('/api/auth/me').set('Authorization', auth).expect(200);
    assert.deepEqual(res.body, user);
  });

  it('returns 401 without a token', async () => {
    const res = await api().get('/api/auth/me').expect(401);
    assert.equal(res.body.message, 'Your session has ended. Please sign in again.');
  });

  it('returns 401 for a made-up token or a malformed header', async () => {
    await signUp(api);
    await api().get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token').expect(401);
    await api().get('/api/auth/me').set('Authorization', 'Basic abc').expect(401);
  });

  it('returns 401 once the session has expired', async () => {
    const { auth, token } = await signUp(api);
    await Session.updateOne({ tokenHash: hashToken(token) }, { expiresAt: new Date(Date.now() - 1000) });
    await api().get('/api/auth/me').set('Authorization', auth).expect(401);
  });

  it('returns 401 when the account behind the session is gone', async () => {
    const { auth } = await signUp(api);
    await User.deleteMany({});
    await api().get('/api/auth/me').set('Authorization', auth).expect(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('ends only this session', async () => {
    const a = await signUp(api);
    const b = await api().post('/api/auth/login').send({ email: 'tester1@illinois.edu', password: 'correct horse' });
    await api().post('/api/auth/logout').set('Authorization', a.auth).expect(204);
    await api().get('/api/auth/me').set('Authorization', a.auth).expect(401);
    await api().get('/api/auth/me').set('Authorization', `Bearer ${b.body.token}`).expect(200);
  });

  it('is safe to call twice or without a token', async () => {
    const { auth } = await signUp(api);
    await api().post('/api/auth/logout').set('Authorization', auth).expect(204);
    await api().post('/api/auth/logout').set('Authorization', auth).expect(204);
    await api().post('/api/auth/logout').expect(204);
  });
});
