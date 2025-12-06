import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type CountRow = { c: number };

export async function GET() {
  // Helper to coerce number safely
  const num = (v: any) =>
    typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;

  // Period windows
  // current: now
  // last30: last 30 days
  // prior30: 30-60 days ago

  // Total assets (current)
  const [{ c: totalAssets }] = (await query<CountRow[]>(
    "SELECT COUNT(*) AS c FROM assets"
  )) as any;

  // Assets last30/prior30 based on purchase_date
  const [assetWindows] = (await query<any[]>(
    `SELECT 
       SUM(CASE WHEN purchase_date >= (CURDATE() - INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS last30,
       SUM(CASE WHEN purchase_date < (CURDATE() - INTERVAL 30 DAY) AND purchase_date >= (CURDATE() - INTERVAL 60 DAY) THEN 1 ELSE 0 END) AS prior30
     FROM assets`
  )) as any;

  // Assets in repair (current)
  const [{ c: assetsInRepair }] = (await query<CountRow[]>(
    `SELECT COUNT(*) AS c 
     FROM assets 
     WHERE status IN ('In Repair (In Store)','In Repair (Allocated)')`
  )) as any;

  // Assets in repair deltas via status history (entries moving into repair in the windows)
  const [assetRepairWindows] = (await query<any[]>(
    `SELECT 
       SUM(CASE WHEN to_status IN ('In Repair (In Store)','In Repair (Allocated)') AND ts >= (CURDATE() - INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS last30,
       SUM(CASE WHEN to_status IN ('In Repair (In Store)','In Repair (Allocated)') AND ts < (CURDATE() - INTERVAL 30 DAY) AND ts >= (CURDATE() - INTERVAL 60 DAY) THEN 1 ELSE 0 END) AS prior30
     FROM asset_status_history`
  )) as any;

  // Licenses expiring soon (next 90 days)
  const [{ c: licensesExpiringSoon }] = (await query<CountRow[]>(
    `SELECT COUNT(*) AS c 
     FROM licenses 
     WHERE expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)`
  )) as any;

  // Licenses expiring soon delta: shift the window 30 days back for prior snapshot
  const [licenseSoonWindows] = (await query<any[]>(
    `SELECT 
       SUM(CASE WHEN expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) AS currentSoon,
       SUM(CASE WHEN expiration_date BETWEEN DATE_ADD(CURDATE(), INTERVAL -30 DAY) AND DATE_ADD(CURDATE(), INTERVAL 60 DAY) THEN 1 ELSE 0 END) AS priorSoon
     FROM licenses`
  )) as any;

  // Vendors total
  const [{ c: totalVendors }] = (await query<CountRow[]>(
    "SELECT COUNT(*) AS c FROM vendors"
  )) as any;

  // Vendors deltas based on incorporation_date when available
  const [vendorWindows] = (await query<any[]>(
    `SELECT 
       SUM(CASE WHEN incorporation_date IS NOT NULL AND incorporation_date >= (CURDATE() - INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS last30,
       SUM(CASE WHEN incorporation_date IS NOT NULL AND incorporation_date < (CURDATE() - INTERVAL 30 DAY) AND incorporation_date >= (CURDATE() - INTERVAL 60 DAY) THEN 1 ELSE 0 END) AS prior30
     FROM vendors`
  )) as any;

  const totalAssetsDelta =
    num(assetWindows?.last30) - num(assetWindows?.prior30);
  const assetsInRepairDelta =
    num(assetRepairWindows?.last30) - num(assetRepairWindows?.prior30);
  const licensesExpiringSoonDelta =
    num(licenseSoonWindows?.currentSoon) - num(licenseSoonWindows?.priorSoon);
  const totalVendorsDelta =
    num(vendorWindows?.last30) - num(vendorWindows?.prior30);

  // Additional metrics for dashboard tiles

  // Total licenses count
  const [{ c: totalLicenses }] = (await query<CountRow[]>(
    "SELECT COUNT(*) AS c FROM licenses"
  )) as any;

  // Total license value (annual spend)
  const [{ total: totalLicenseValue }] = (await query<any[]>(
    "SELECT COALESCE(SUM(cost), 0) AS total FROM licenses"
  )) as any;

  // Total monthly license spend
  const [{ total: totalMonthlyLicenseSpend }] = (await query<any[]>(
    "SELECT COALESCE(SUM(cost / 12), 0) AS total FROM licenses"
  )) as any;

  // Compliant licenses count
  const [{ c: compliantLicenses }] = (await query<CountRow[]>(
    `SELECT COUNT(*) AS c FROM licenses WHERE compliance = 'Compliant'`
  )) as any;

  // Total vendor contract value
  const [{ total: totalContractValue }] = (await query<any[]>(
    "SELECT COALESCE(SUM(contract_value), 0) AS total FROM vendors"
  )) as any;

  // Average vendor rating
  const [{ avg: averageVendorRating }] = (await query<any[]>(
    "SELECT COALESCE(AVG(rating), 0) AS avg FROM vendors"
  )) as any;

  // Approved vendors count
  const [{ c: approvedVendors }] = (await query<CountRow[]>(
    `SELECT COUNT(*) AS c FROM vendors WHERE status = 'Approved'`
  )) as any;

  // Vendor contracts expiring soon (within 90 days)
  const [{ c: vendorContractsExpiringSoon }] = (await query<CountRow[]>(
    `SELECT COUNT(*) AS c 
     FROM vendors 
     WHERE contract_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)`
  )) as any;

  return NextResponse.json({
    totalAssets: num(totalAssets),
    totalAssetsDelta,
    assetsInRepair: num(assetsInRepair),
    assetsInRepairDelta,
    licensesExpiringSoon: num(licensesExpiringSoon),
    licensesExpiringSoonDelta,
    totalVendors: num(totalVendors),
    totalVendorsDelta,
    // Additional metrics
    totalLicenses: num(totalLicenses),
    totalLicenseValue: num(totalLicenseValue),
    totalMonthlyLicenseSpend: num(totalMonthlyLicenseSpend),
    compliantLicenses: num(compliantLicenses),
    totalContractValue: num(totalContractValue),
    averageVendorRating: num(averageVendorRating),
    approvedVendors: num(approvedVendors),
    vendorContractsExpiringSoon: num(vendorContractsExpiringSoon),
  });
}
