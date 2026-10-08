# YouTube Playlist Manager

A self-hosted tool for managing YouTube playlists at scale — batch delete videos,
move them between playlists, and filter by channel. Built because YouTube's own
interface only allows you to move videos one at a time.

Playlists and their videos are synced into Postgres, so browsing, searching, and
filtering are instant and cost no API quota. Edits go straight to YouTube.

| | |
|---|---|
| ![Playlist grid](docs/playlists.png) | ![Playlist detail with videos selected](docs/playlist-detail.png) |

## Stack

| Layer    | Choice                                             |
| -------- | -------------------------------------------------- |
| Runtime  | Bun (also package manager and workspace tooling)   |
| Server   | Hono                                               |
| Database | PostgreSQL 18 in Docker, queried with `Bun.sql`    |
| Frontend | React 19 + Vite + TypeScript                       |
| Styling  | Tailwind v4 (CSS-first `@theme`, no config file)   |
| Data     | TanStack Query                                     |
| Routing  | React Router                                       |
| Tooling  | Biome (lint + format)                              |

## Setup

### Requirements

- [Bun](https://bun.com) 1.3 or newer — `curl -fsSL https://bun.sh/install | bash`
- [Docker](https://www.docker.com/products/docker-desktop/) — for Postgres
- A Google account

### 1. Clone and install

```bash
git clone git@github.com:tranttommy/youtube-playlist-manager.git
cd youtube-playlist-manager
bun install
```

Bun workspaces install all three packages from the root. There's no per-package
install step.

### 2. Create a Google Cloud project

Everything in this section happens in the
[Google Cloud Console](https://console.cloud.google.com).

#### Create the project

1. Click the project dropdown in the top bar → **New Project**
2. Name it anything, e.g. `youtube-playlist-manager`
3. Wait for it to be created, then make sure it's selected in the dropdown

#### Enable the API

1. Go to **APIs & Services → Library**
2. Search for **YouTube Data API v3**
3. Click it, then **Enable**

#### Configure the consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** (Internal is only for Google Workspace orgs)
3. Fill in an app name, your email as the support contact, and your email again
  as the developer contact. Nothing else is required.
4. On the **Scopes** step, click **Save and Continue** — scopes are requested by
  the app at runtime, not configured here.
5. On the **Test users** step, click **Add Users** and add the Google account
  you'll sign in with. Add anyone else who needs access.
6. Leave the app in **Testing** status. Publishing would require Google
  verification, which is only needed for public apps.

#### Create the OAuth client

1. Go to **APIs & Services → Credentials**
2. **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Under **Authorized redirect URIs**, add exactly:

    ```bash
    http://localhost:3000/auth/callback
    ```

5. Create, then copy the **Client ID** and **Client Secret**

The redirect URI points at the **server** on port 3000, not the frontend on
5173. Google delivers the authorization code to the server, which exchanges it
for tokens — the browser never sees them. A mismatch here is the most common
setup failure, and Google's error message will tell you the exact URI it
expected.

### 3. Environment variables

Create `packages/server/.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/callback
WEB_URL=http://localhost:5173
POSTGRES_URL=postgres://ypm-user:ypm-password@localhost:5432/ypm-db
```

`POSTGRES_URL` is read automatically by `Bun.sql` — nothing imports it. The
credentials match the ones in `compose.yml`, so leave it as-is unless you change
those.

This file is gitignored. Never commit it.

### 4. Start everything

Make sure Docker is running, then:

```bash
bun run dev
```

This starts the Postgres container and both dev servers together. Server on
`http://localhost:3000`, frontend on `http://localhost:5173`.

Postgres 18 runs on port 5432 with data in a named Docker volume, so it
survives container restarts.

### 5. Run migrations

In a second terminal, once Postgres is up:

```bash
bun run migrate
```

Applies every `.sql` file in `packages/server/src/db/migrations/` in filename
order, tracking what's been applied in a `migrations` table. Safe to re-run —
already-applied files are skipped. You only need this on first setup and after
pulling new migrations.

Then open `http://localhost:5173` and sign in with Google.

### 6. First sync

1. Click **Pull Playlists** — fetches your playlist list (fast, 1 quota unit)
2. Click into a playlist, then **Pull Videos** — fetches that playlist's videos
   with a progress bar

Videos are only pulled per playlist, on demand. A playlist with thousands of
videos takes a minute or two.

## Troubleshooting

**`redirect_uri_mismatch` on sign-in**
The URI in Google Cloud must match `GOOGLE_REDIRECT_URL` character for
character, including the port and the lack of a trailing slash.

**`403` on the first API call, or calls failing after an hour**
Sign out and back in. The app requests `prompt=consent` so Google always returns
a refresh token, but a credential stored before that was added may be stale.

**`ECONNREFUSED` on port 5432**
Postgres isn't up yet. `bun run dev` starts the container, but the server may
beat it to the first connection on a cold start — wait a few seconds and it'll
reconnect. If it persists, check Docker is running and `docker compose ps`
shows the container healthy.

**`quotaExceeded`**
You've used the daily 10,000 units. A banner appears and editing is disabled
until midnight Pacific. See [Quota](#quota).

**Google profile pictures not loading**
Expected if you've changed the `referrerPolicy` on the avatar image — Google's
CDN blocks unknown referrers.

## Scripts

| Command              | What it does                            |
| -------------------- | --------------------------------------- |
| `bun run dev`        | Postgres, server, and frontend together |
| `bun run dev:server` | Server only (hot reload)                |
| `bun run dev:web`    | Frontend only                           |
| `bun run migrate`    | Apply pending migrations                |

## Project structure

```
packages/
├── server/
│   └── src/
│       ├── config.ts              env values and shared constants
│       ├── lib.ts                 Google OAuth client factory
│       ├── errors.ts              AppError + typed error helpers
│       ├── quota.ts               quota-exhaustion flag
│       ├── db/
│       │   ├── migrate.ts         migration runner
│       │   ├── queries.ts         shared, ownership-scoped queries
│       │   └── migrations/        numbered .sql files
│       └── routes/
│           ├── auth/              login, callback, me, logout
│           └── api/
│               ├── middleware.ts  withAuth, withYouTube
│               ├── playlists.ts   reads from Postgres
│               └── youtube.ts     anything that calls YouTube
├── web/
│   └── src/
│       ├── components/            shared, URL-less components
│       ├── lib/                   request + stream wrappers, constants
│       └── routes/                one folder per route
└── shared/
    └── src/types.ts               types used by both sides
```

The split that matters on the server: `playlists.ts` only reads Postgres,
`youtube.ts` holds everything that calls the YouTube API. The YouTube client
middleware is scoped to the latter, so read endpoints don't pay for it.

## API

| Method | Route                       | Purpose                           |
| ------ | --------------------------- | --------------------------------- |
| GET    | `/auth/login`               | Redirect to Google consent        |
| GET    | `/auth/callback`            | Exchange code, create session     |
| GET    | `/auth/me`                  | Current user, or `null`           |
| GET    | `/auth/logout`              | Clear session                     |
| GET    | `/api/quota`                | Whether the daily quota is spent  |
| GET    | `/api/playlists`            | List playlists (from Postgres)    |
| GET    | `/api/playlists/:id/items`  | List a playlist's videos          |
| POST   | `/api/youtube/pull`         | Sync playlists from YouTube       |
| POST   | `/api/youtube/pull/:id`     | Sync one playlist's videos (SSE)  |
| POST   | `/api/youtube/delete/:id`   | Remove selected videos (SSE)      |
| POST   | `/api/youtube/move/:id`     | Move selected videos (SSE)        |

The three long-running operations stream progress as Server-Sent Events —
a large playlist takes minutes and a plain request would time out.

## Quota

The YouTube Data API allows 10,000 units per day per Google Cloud project, reset
at midnight Pacific. There's no paid tier, so exceeding it returns `403
quotaExceeded` until reset — no billing risk.

| Operation                | Cost                  |
| ------------------------ | --------------------- |
| `playlistItems.list`     | 1 unit per page of 50 |
| `playlistItems.delete`   | 50 units per video    |
| `playlistItems.insert`   | 50 units per video    |

Reads are effectively free; writes are not. A move is a delete plus an insert,
so 100 units per video — moving 100 videos spends the entire daily allowance.
When the limit is hit, the app flags it and disables editing until the next
reset. Quota is shared across everyone using the same Cloud project.

## Known limitations

- **Watch Later and History are inaccessible.** Google deprecated API access to
  these playlists in 2016. Nothing to be done from this side.
- **YouTube's read path lags behind writes.** Counts and listings can be stale
  for a short window after a delete or move.
- **Deleted and private videos** appear with no channel and a placeholder title.
  That's intentional — finding them is half the point.
- **Quota tracking is in-memory**, so it resets if the server restarts.

## Status

Working: auth with token refresh, playlist and per-playlist video sync with
progress and reconciliation, channel filtering, multi-select, batch delete and
move, quota detection.

Next: deployment, CI, cross-platform channel search, duplicate detection.

## License

MIT
