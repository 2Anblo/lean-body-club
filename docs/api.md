# REST API contract

The frontend already calls these routes in `client/src/api/http.ts`. The mock in `client/src/api/mock.ts` implements the same behavior and validation, so it is a working reference for every rule below.

## Conventions

- Base path: `/api`. JSON in, JSON out.
- Auth: `Authorization: Bearer <token>` on every route except signup and login.
- Errors: a non-2xx status with body `{ "message": "Human-readable text" }`. The UI shows `message` to the user, so write it for students.
  - `400` invalid input · `401` not signed in / bad password · `403` not allowed · `404` not found · `409` email already used
- Times are ISO 8601 strings (`"2026-11-16T14:05:00.000Z"`).
- Weeks run Monday 00:00 to Sunday 23:59, in **America/Chicago** time.
- `id`s are strings. Mongo `_id` is fine — send it as `id`.

## Shapes

These match `client/src/types.ts`.

```ts
User {
  id, name, email, weeklyGoal: number, bio: string,
  favoriteActivities: Activity[],
  reminders: { daily: boolean, time: "HH:MM", days: number[] /* 0=Mon … 6=Sun */,
               weeklySummaryEmail: boolean, commentNotifications: boolean, newMemberNotifications: boolean },
  createdAt
}
Activity = "Running" | "Walking" | "Strength" | "Cycling" | "Yoga" | "Other"

PersonSummary { id, name, initials }

Group {
  id, name, initials, category /* Running | Strength | Walking | Mobility */, level, description, tagline,
  imageUrl, typicalGoal: number,
  memberCount: number, checkInsThisWeek: number, activeMembersThisWeek: number,
  isMember: boolean            // for the signed-in user
}
GroupDetail = Group & { members: PersonSummary[] }

CheckIn {
  id, group: { id, name } | null,   // null = private, only the author can see it
  author: PersonSummary, activity: Activity, durationMin: number, reflection: string, createdAt,
  likeCount: number, likedByMe: boolean, commentCount: number
}

Comment { id, checkInId, author: PersonSummary, text, createdAt }

WeekSummary {
  weekStart,                  // Monday 00:00 of the current week
  goal, count,                // workouts this week vs. weekly goal
  totalMinutes, minutesByDay: number[7], activeDays: boolean[7],   // Monday first
  entries: { id, activity, durationMin, createdAt, groupName: string | null }[]   // newest first
}

Session { token, user: User }
```

## Auth

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/signup` | `{ name, email, password, weeklyGoal }` | `Session` (201) |
| POST | `/auth/login` | `{ email, password }` | `Session` |
| GET | `/auth/me` | — | `User` |
| POST | `/auth/logout` | — | 204 |

Rules:
- `email` must end in `@illinois.edu`; compare case-insensitively; store lowercase. Duplicate → 409.
- `password` at least 8 characters. **Hash it** (bcrypt or argon2). Never return it.
- `name` required, at most 60 characters. `weeklyGoal` is an integer from 1 to 14.
- The token can be a JWT or a random session id stored in the database. `/auth/me` with a bad or expired token → 401, and the client goes back to sign-in.

## Users

| Method | Path | Body | Returns |
|---|---|---|---|
| PATCH | `/users/me` | any of `{ name, weeklyGoal, bio, favoriteActivities, reminders }` | `User` |
| GET | `/users/me/week` | — | `WeekSummary` |

- `bio` at most 160 characters. `reminders.time` matches `HH:MM`. `reminders.days` are integers 0–6.
- `count` counts every check-in this week, private ones included. `activeDays[i]` is true when there was at least one check-in that day.

## Groups

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/groups?q=&category=` | — | `Group[]` |
| GET | `/groups/:id` | — | `GroupDetail` |
| POST | `/groups/:id/members` | — | `Group` (join; joining twice is fine) |
| DELETE | `/groups/:id/members/me` | — | `Group` (leave) |
| GET | `/groups/:id/checkins` | — | `CheckIn[]` newest first (non-members can read it too, as a preview) |

- `q` matches name, category, tagline or description, case-insensitively.
- `checkInsThisWeek` counts this week's check-ins in the group. `activeMembersThisWeek` counts distinct people who checked in this week.
- `imageUrl`: the client serves `/images/morning-runners.jpg`, `/images/gym-beginners.jpg`, `/images/campus-walkers.jpg` and `/images/yoga-stretch.jpg`. Seed the four groups with these paths, or use full URLs.

## Check-ins

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/checkins` | `{ groupId: string \| null, activity, durationMin, reflection }` | `CheckIn` (201) |
| GET | `/checkins/feed` | — | `CheckIn[]`: newest 6 from groups I belong to |
| GET | `/checkins/:id` | — | `CheckIn` |
| POST | `/checkins/:id/like` | — | `CheckIn` (liking twice is fine) |
| DELETE | `/checkins/:id/like` | — | `CheckIn` |

- `durationMin` is an integer from 1 to 600. `reflection` is at most 280 characters (it may be empty).
- Posting to a group you haven't joined → 403. A private check-in (`groupId: null`) → 404 for anyone but its author.

## Comments

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/checkins/:id/comments` | — | `Comment[]` oldest first |
| POST | `/checkins/:id/comments` | `{ text }` | `Comment` (201) |

- `text` is trimmed, 1–500 characters.

## Suggested collections (MongoDB)

`users`, `groups`, `memberships { userId, groupId, joinedAt }`, `checkins { userId, groupId|null, activity, durationMin, reflection, createdAt }`, `likes { userId, checkInId }` (unique index on the pair), `comments { checkInId, userId, text, createdAt }`.

Compute `likeCount`, `commentCount`, `memberCount` and the week numbers with aggregation or counts, so they can't drift out of sync.
