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
