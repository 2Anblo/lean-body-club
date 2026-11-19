import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { signUp, useTestServer, validSignUp } from './helpers.js';

const api = useTestServer({ authRateLimit: 3 });

describe('app', () => {
  it('reports health with the database status', async () => {
    const res = await api().get('/api/health').expect(200);
    assert.deepEqual(res.body, { status: 'ok', db: 'up' });
  });

  it('allows the live frontend origin and blocks others (CORS)', async () => {
    const ok = await api()
      .options('/api/auth/login')
      .set('Origin', 'https://2anblo.github.io')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');
    assert.equal(ok.headers['access-control-allow-origin'], 'https://2anblo.github.io');
    assert.match(ok.headers['access-control-allow-headers'], /Authorization/);

    const blocked = await api().get('/api/health').set('Origin', 'https://evil.example.com');
    assert.equal(blocked.headers['access-control-allow-origin'], undefined);
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await api().get('/api/nope').expect(404);
    assert.match(res.body.message, /No route/);
  });

  it('answers malformed JSON with 400', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":').expect(400);
    assert.equal(res.body.message, 'The request body isn’t valid JSON.');
  });

  it('protects the routes owned by the API team behind sign-in', async () => {
    await api().get('/api/groups').expect(401);
    await api().get('/api/checkins/feed').expect(401);
    await api().get('/api/users/me/week').expect(401);
    const { auth } = await signUp(api);
    // Placeholders until those routes are implemented.
    await api().get('/api/groups').set('Authorization', auth).expect(501);
  });

  it('rate-limits repeated sign-in attempts', async () => {
    // The limit is 3 per IP for this file, and signUp above already used one. Failed attempts count too.
    const guess = { email: 'nobody@illinois.edu', password: 'wrong guess' };
    await api().post('/api/auth/login').send(guess).expect(404);
    await api().post('/api/auth/login').send(guess).expect(404);
    const res = await api().post('/api/auth/signup').send(validSignUp({ email: 'late@illinois.edu' })).expect(429);
    assert.match(res.body.message, /Too many attempts/);
  });

  it('sets security headers', async () => {
    const res = await api().get('/api/health');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-powered-by'], undefined);
  });
});
