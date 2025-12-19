# AssetFlow AI Coding Instructions

## Architecture Overview
AssetFlow is a Next.js 14 App Router application for IT asset management with MySQL backend. Core components:
- **Frontend**: React 18 + TypeScript, Tailwind CSS, Radix UI primitives, Lucide icons
- **Backend**: Next.js API routes with RESTful endpoints
- **Database**: MySQL with connection pooling (mysql2), migrations in `db/migrations/`
- **Auth**: JWT-based with scrypt password hashing, role-based permissions (admin/user/superadmin)
- **Key Features**: Asset tracking, vendor management, license management, audits, notifications, user settings

## Critical Workflows
- **Development**: `npm run dev` (runs on port 3000)
- **Build/Deploy**: `npm run build && npm run start`
- **Database Setup**: Run migrations from `db/migrations/` in MySQL, seed via `/api/dev/seed` or SQL
- **Auth Setup**: Set `AUTH_SECRET`, run `002_auth_users.sql`, create admin user with `npm run hash:pw`
- **Password Hashing**: Use `npm run hash:pw "password"` or POST `/api/auth/hash` (dev only)

## Project Conventions
- **Component Structure**: Pages in `app/` are thin wrappers importing from `src/components/assetflow/`
- **Navigation**: Use `useAssetflowNavigate()` hook for page routing (e.g., `onNavigate("assets-edit", assetId)`)
- **UI Components**: Import from `src/components/ui/` (shadcn/ui style), use Radix primitives with Tailwind
- **API Patterns**: Use `query()` from `@/lib/db` with named placeholders, check permissions with `requirePermission()`
- **Settings**: User-specific JSON columns in `user_settings` table, fetched via `/api/settings?email=...`
- **Asset Status**: Standardized taxonomy (e.g., "Allocated", "In Repair (Allocated)"), track history in `asset_status_history`
- **CIA Ratings**: Assets have confidentiality/integrity/availability scores (1-5), clamped in API
- **Notifications**: Use `notify()` from `@/lib/notifications` for email/webhook events
- **Security**: Middleware enforces auth, CSP with nonces, image URL sanitization in components

## Examples
- **Add Asset API**: POST `/api/assets` with `{name, type, status, cia_confidentiality: 3}`, resolves `type` to `type_id`
- **Component Pattern**: `<AssetsPage onNavigate={onNavigate} onSearch={onSearch} />` in `app/assets/page.tsx`
- **DB Query**: `await query("SELECT * FROM assets WHERE id = :id", {id})`
- **Permission Check**: `await requirePermission("assets", "read")` in API routes

## Key Files
- `middleware.ts`: Auth middleware and CSP
- `src/lib/db.ts`: Database connection and query wrapper
- `src/lib/auth/permissions.ts`: Auth helpers and role resolution
- `src/components/assetflow/layout/Sidebar.tsx`: Navigation with icon colors
- `db/migrations/`: Schema evolution scripts</content>
<parameter name="filePath">c:\Users\Harshada Vikhe\Downloads\BizWorks\inventos\.github\copilot-instructions.md