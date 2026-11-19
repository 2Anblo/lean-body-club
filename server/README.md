# server

Node + Express 5 REST API with a MongoDB database (Mongoose). Implements the contract in [../docs/api.md](../docs/api.md).

## Status

| Area | Owner | State |
|---|---|---|
| Database schema, indexes, seed data | Zichen Liao | Done — `src/models/`, `src/db/` |
| Auth: signup, login, me, logout, sessions | Zichen Liao | Done — `src/routes/auth.js`, `src/middleware/auth.js` |
| Account: `PATCH /users/me` | Zichen Liao | Done — `src/routes/users.js` |
| Deployment (Render + Atlas), CI, integration tests | Zichen Liao | Done — `render.yaml`, `.github/workflows/ci.yml`, `test/` |
| Groups, check-ins, likes, comments, `GET /users/me/week` | Yuecheng Liao | To do — placeholders answer `501` (`src/routes/groups.js`, `src/routes/checkins.js`, `src/routes/users.js`) |

## Run it

```bash
cd server
npm install
npm run dev:memory   # no MongoDB needed: in-memory database with the demo data
```

Or against a real database:

```bash
cp .env.example .env   # then set MONGODB_URI (local MongoDB or Atlas)
npm run seed           # wipes the database and loads the demo data
npm run dev            # restarts on file changes
```

The API listens on `http://localhost:4000/api`. To use it from the frontend, set `VITE_API_MODE=http` in `client/.env` and restart `npm run dev` there. Every seed account's password is `password123`. The demo account is `zhanboc2@illinois.edu`.

| Command | What it does |
|---|---|
| `npm run dev:memory` | API on a throwaway in-memory MongoDB, seeded |
| `npm run dev` | API on `MONGODB_URI`, restarts on changes |
| `npm start` | Production start (no watch, no `.env` file) |
| `npm run seed` | Wipe and load demo data. Refuses in production unless `--force` |
| `npm run seed -- --if-empty` | Load demo data only if there are no users yet |
| `npm test` | Integration tests (in-memory MongoDB, no setup) |

## Layout

```
src/
  index.js            connect to MongoDB, start listening
  app.js              createApp(config): middleware + routers (no DB, no listen — tests use it)
  config.js           environment variables → config
  dev-memory.js       npm run dev:memory
  db/                 connect.js, seed.js, seedData.js
  models/             User, Session, Group, Membership, CheckIn, Like, Comment
  middleware/         auth.js (requireAuth), errors.js ({ message } for every error)
  lib/                constants, validate, serialize (toUser, toPerson), sessions, week (Chicago weeks), httpError
  routes/             auth, users, groups, checkins
test/                 node:test + supertest
```

## Database

| Collection | Fields | Indexes |
|---|---|---|
| `users` | name, email (lowercase), passwordHash (hidden), weeklyGoal, bio, favoriteActivities, reminders, createdAt | `email` unique |
| `sessions` | tokenHash, user, expiresAt | `tokenHash` unique, `user`, TTL on `expiresAt` |
| `groups` | name, initials, category, level, description, tagline, imageUrl, typicalGoal | `category + name` |
| `memberships` | user, group, joinedAt | `user + group` unique, `group` |
| `checkins` | user, group (null = private), activity, durationMin, reflection, createdAt | `group + createdAt`, `user + createdAt` |
| `likes` | user, checkIn | `user + checkIn` unique, `checkIn` |
| `comments` | checkIn, user, text, createdAt | `checkIn + createdAt` |

Counts (`memberCount`, `likeCount`, `commentCount`, week numbers) are not stored; count them from these collections so they can't drift. The unique indexes make "join twice" and "like twice" safe: use `updateOne(filter, { $setOnInsert: … }, { upsert: true })`.

## Authentication

- Passwords are hashed with bcrypt (`BCRYPT_ROUNDS`, default 11) and never leave the server: `passwordHash` has `select: false`.
- Sign-up and sign-in create a **session**: a random 256-bit token returned to the client once. The database stores only its SHA-256 hash, with an expiry (`SESSION_TTL_DAYS`, default 30). MongoDB deletes expired sessions automatically.
- The client sends `Authorization: Bearer <token>`. `requireAuth` looks up the session and sets `req.user` / `req.userId`, or answers `401`.
- Logout deletes that one session, so the token stops working right away (unlike a JWT).
- Sign-up and sign-in are rate-limited per IP (`AUTH_RATE_LIMIT` per 15 minutes).
- `mongoose.set('sanitizeFilter', true)` stops request values like `{ "$ne": null }` from becoming query operators. If you need an operator in your own filter, wrap it: `mongoose.trusted({ $gt: date })`.

### For the API routes (Yuecheng)

```js
import { requireAuth } from '../middleware/auth.js';
import { forbidden, notFound } from '../lib/httpError.js';
import { toPerson } from '../lib/serialize.js';
import { weekRange, dayIndex } from '../lib/week.js';

router.use(requireAuth);              // req.userId is the signed-in user
throw notFound('That group doesn’t exist.');   // → 404 { message }
```

Express 5 forwards errors thrown in `async` handlers, so no try/catch is needed. A malformed `:id` raises a Mongoose `CastError`, which the error handler turns into `404`.

## Deployment

The API runs on **Render** (free web service) with **MongoDB Atlas** (free M0 cluster).

1. Atlas: create a cluster, a database user, and allow access from anywhere (`0.0.0.0/0`, since Render's IPs change). Copy the `mongodb+srv://…` URI and add a database name, e.g. `…/lean-body-club?retryWrites=true`.
2. Render: **New → Blueprint**, pick this repo. It reads [`../render.yaml`](../render.yaml) and asks for `MONGODB_URI`.
3. The first start seeds the empty database (`--if-empty`); later deploys keep the data.
4. Check `https://<service>.onrender.com/api/health` → `{"status":"ok","db":"up"}`.
5. Point the frontend at it: root README → "Pointing the live site at the real backend".

Free Render services sleep after inactivity; the first request after that takes up to a minute.

## Environment variables

See [`.env.example`](.env.example): `MONGODB_URI`, `PORT`, `CORS_ORIGINS`, `SESSION_TTL_DAYS`, `AUTH_RATE_LIMIT`, `BCRYPT_ROUNDS`. Keep real values in `server/.env` (git-ignored) or in the Render dashboard.

## Tests

`npm test` runs integration tests against a real MongoDB binary in memory (downloaded once). They cover sign-up/sign-in/me/logout, session expiry and revocation, validation messages, NoSQL-injection attempts, `PATCH /users/me`, unique indexes, the seed data, Chicago week boundaries across DST, CORS, rate limiting and error responses. CI runs them on every push and pull request.
