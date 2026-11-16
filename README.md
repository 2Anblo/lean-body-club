# Lean Body Club

A community web app that helps college students build consistent fitness habits through small groups, weekly goals, and workout check-ins. CS 409 final project.

**Team:** Zichen Liao (database & auth) · Yuecheng Liao (backend & REST API) · Zhanbo Chen (frontend & UI/UX)

## Repository layout

```
client/   React + TypeScript + Vite frontend (done; runs on mock data today)
server/   JavaScript backend + database (to do — see server/README.md)
docs/     api.md: the REST contract the frontend expects
```

## Run the frontend

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. Click **Use the demo account** on the sign-in page, or create an account with any `@illinois.edu` email.

Until the backend exists, the client uses a **mock API** that stores everything in the browser's localStorage, with seed groups, people, check-ins and comments. Account → **Reset demo data** puts it back to the start.

## Switch to the real backend

1. Start the server on port 4000 with the routes in [docs/api.md](docs/api.md).
2. Create `client/.env` with `VITE_API_MODE=http` (see `client/.env.example`).
3. Restart `npm run dev`. Vite forwards `/api/*` to `http://localhost:4000`.

Every screen goes through `client/src/api/` — `mock.ts` and `http.ts` implement the same `Api` interface (`api/types.ts`), so no page code changes when you switch.

## Frontend map

| Path | Screen |
|---|---|
| `/signin`, `/signup` | Auth (full-screen photo on phones, split layout on desktop) |
| `/` | Home: weekly goal card, my groups, suggestions, recent check-ins |
| `/groups` | Search and filter groups, join from the list |
| `/groups/:id` | Preview + Join (not a member) or feed + composer (member) |
| `/posts/:id` | One check-in with comments |
| `/progress` | Ring, minutes per day, this week's workouts, edit goal |
| `/account` | Profile, settings, reminders, log out |

Check-in, edit goal, edit profile and reminders open as dialogs (full-screen sheets on phones).

- Design tokens (colors, fonts, radii) live in `client/src/styles/tokens.css` and mirror the Figma variables.
- Layout switches at 1024px: bottom tab bar below it, sidebar above it.

## Scripts (client)

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `client/dist` |
| `npm run typecheck` | Type-check only |
| `npm run preview` | Serve the production build locally |

## Deploying the client

`npm run build` outputs a static site in `client/dist`. Because it is a single-page app, the host must send every unknown path to `index.html` (Netlify: `_redirects` with `/* /index.html 200`; Vercel and Render static sites: add a rewrite).
