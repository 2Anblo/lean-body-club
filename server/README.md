# server

The backend goes here: a JavaScript REST API (e.g. Node + Express) with a database (e.g. MongoDB).

- **Contract:** implement the routes in [../docs/api.md](../docs/api.md). The frontend already calls them.
- **Port:** listen on `4000` during development. The client's dev server forwards `/api/*` there.
- **Reference:** `client/src/api/mock.ts` is a working, in-browser version of every route, including validation rules and error messages. Match its behavior.
- **Secrets:** keep database URLs and token secrets in `server/.env`. It is git-ignored; commit a `server/.env.example` with the variable names.
