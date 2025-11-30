## Plan: Asset Audit Management

Introduce audit sessions to record periodic physical inventory checks: upload CSV of serial numbers, match against existing `Asset` records, flag missing/unexpected assets, allow creation of new assets, and compare with a previous audit to show variances. Reuse existing import parsing (`parseCSV`, `parseAssetsFile`) and modal patterns while adding new DB tables (`audits`, `audit_items`), APIs (`/api/assets/audits/*`), and UI pages (`AuditListPage`, `AuditSessionPage`). Each audit stores metadata (date, name, createdBy), line items (serialNumber, matchedAssetId, status at time, found flag), and derived diff metrics for historical comparison.

### Steps

1. Add DB migrations in `db/migrations/` for `audits` (id, name, created_at, created_by, compared_audit_id) and `audit_items` (id, audit_id FK, serial_number, asset_id FK nullable, asset_status_snapshot, found BOOLEAN, notes TEXT).
2. Implement API routes under `app/api/assets/audits/` (`route.ts` list/create, `[id]/route.ts` get/update/delete, `[id]/items/route.ts` import CSV & upsert items, `[id]/diff/route.ts` compute comparison with prior audit) using existing patterns from `app/api/assets/`.
3. Extend import logic in `src/components/assetflow/assets/AssetImportModal.tsx` via new `AuditImportModal` component to parse serial-number-only CSV (reuse `parseCSV`), map serials to `Asset` by `serialNumber`, mark found/missing, and stage new asset creation list.
4. Create UI pages in `src/components/assetflow/audits/`: `AuditsPage.tsx` (list sessions + create button + diff selector) and `AuditSessionPage.tsx` (summary metrics, items table with filters, actions to add missing assets using existing `createAsset`). No Dialog boxes. Instead create a page to see the found/missing assets and ability to create asset for missing assets.
5. Add diff computation client helper (`computeAuditDiff(previous, current)`) in `src/lib/audit.ts` returning added, removed, statusChanged sets; surface in `AuditSessionPage` and API `/diff` for server-side fallback.
6. Integrate navigation: add audit entry in sidebar/layout (`AssetFlowLayout`), update breadcrumbs, and gate write actions by `me.role` similar to existing `AssetsPage`.
7. Audit can be per location

### Further Considerations

1. Large imports: Stream parsing vs current in-memory; Option A: keep sync parse (<10k rows), Option B: chunked upload.
2. Missing asset creation: Batch create endpoint vs per-row create for speed; Option A: new `/api/assets/audits/[id]/create-missing`, Option B: reuse existing `createAsset` loop.
