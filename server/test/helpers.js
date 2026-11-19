// Shared setup: an in-memory MongoDB (downloaded once, then cached) and a fresh app per file.
import { after, before, beforeEach } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { connectDb, disconnectDb } from '../src/db/connect.js';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

export function testConfig(overrides = {}) {
  return { ...loadConfig({ NODE_ENV: 'test' }), bcryptRounds: 4, authRateLimit: 1000, ...overrides };
}

/** Call at the top of a test file. Returns a getter for a supertest agent bound to the app. */
export function useTestServer(overrides = {}) {
  let mongo;
  let app;
  before(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
    app = createApp(testConfig(overrides));
  });
  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });
  after(async () => {
    await disconnectDb();
    await mongo?.stop();
  });
  return () => request(app);
}

export const validSignUp = (overrides = {}) => ({
  name: 'Test Student',
  email: 'tester1@illinois.edu',
  password: 'correct horse',
  weeklyGoal: 3,
  ...overrides,
});

/** Signs up and returns { token, user, auth } where auth is the Authorization header value. */
export async function signUp(api, overrides = {}) {
  const res = await api().post('/api/auth/signup').send(validSignUp(overrides)).expect(201);
  return { ...res.body, auth: `Bearer ${res.body.token}` };
}
