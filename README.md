# AssetFlow (IT Asset Management)

A Next.js (App Router) app for IT Asset Management with a modern UI, CSV export, settings with theme and events configuration, and direct URL routing for each page.

## Stack
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- lucide-react icons
- next-themes for theming
- Recharts and Motion (where applicable)

## Available routes
- /dashboard
- /assets, /assets/add
- /licenses, /licenses/add
- /vendors, /vendors/add
- /events
- /settings

Root (/) redirects to /dashboard.

## Develop
1) Install dependencies
- npm install
2) Start the dev server
- npm run dev
3) Build/start (production)
- npm run build
- npm run start

By default the app runs on port 3000.

## Authentication & Admin (MySQL-backed)

This project includes a simple, secure auth layer with scrypt password hashes and an HMAC-signed cookie. Admin users can manage users at `/admin/users`.

1) Env
- Copy `.env.example` to `.env` and set DB vars.
- Add `AUTH_SECRET` to sign auth tokens (any long random string).

2) Migrations
- Run `db/migrations/001_init.sql` first (core app schema).
- Then run `db/migrations/002_auth_users.sql` (users, roles, permissions, sessions).

3) Create your first admin user
- Generate a password hash (choose one):
	- CLI: `npm run hash:pw -- "YourStrongPassword"` → copy the output
	- API (dev only): `POST /api/auth/hash` with `{ "password": "YourStrongPassword" }`
- Insert user and grant admin role (replace values):
	- INSERT INTO users (id, email, name, password_hash, active) VALUES (UUID(), 'admin@inventos.io', 'Admin User', '<HASH_FROM_ABOVE>', 1);
	- INSERT INTO user_roles (user_id, role_id) SELECT id, 1 FROM users WHERE email='admin@inventos.io' LIMIT 1;

Alternative seeds
- Dev endpoint: `POST /api/dev/seed-admin` (non-prod or with header `x-seed-secret: $SEED_SECRET`) uses env vars `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`.
- SQL helper: see `db/migrations/seed_admin.sql` and replace placeholders; run once.

4) Sign in and manage users
- Visit `/login` and sign in with your admin email/password.
- Go to `/admin/users` to create/disable/delete users and set roles.

Notes
- Auth token is stored in an HttpOnly cookie, signed with `AUTH_SECRET`.
- Passwords are hashed with scrypt; the stored format is `scrypt$N$salt$hash`.
- The dev-only hash API is disabled in production unless `AUTH_HASH_DEV=1` is set.

## Database (MySQL)

This project includes a MySQL schema and basic APIs. To enable server-backed data:

1) Create `.env` from `.env.example` and set your MySQL credentials.
2) Run the migration `db/migrations/001_init.sql` in your MySQL server (creates DB `assetflow` and tables).
3) Seed sample data (dev only):
	- Option A: GET http://localhost:3000/api/dev/seed
	- Option B (recommended with secret): set `SEED_SECRET` in `.env` and call with header `x-seed-secret: <your secret>`

APIs:
- Assets: `GET/POST /api/assets`, `GET/PUT/DELETE /api/assets/[id]`
- Licenses: `GET/POST /api/licenses`, `GET/PUT/DELETE /api/licenses/[id]`
- Vendors: `GET/POST /api/vendors`, `GET/PUT/DELETE /api/vendors/[id]`
- Events: `GET/POST /api/events`, `GET /api/events/[id]`
- Settings: `GET /api/settings?email=...`, `PUT /api/settings`

## Notes
- Predictive Analytics has been removed from navigation and routing.
- Images are served from real assets (no figma:asset imports).
- CSV export is available in IT Assets list.
- Settings includes Profile/Preferences/Notifications/Appearance and an Events tab (Webhook/Kafka config stored in localStorage).

## Sidebar icon colors
Each sidebar icon has its own color when inactive and turns white when active. You can adjust colors in `src/components/assetflow/layout/Sidebar.tsx` by editing the `color` property for each nav item.
