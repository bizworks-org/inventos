import { Vendor } from "../../../lib/data";

// Shared vendor types
export const vendorTypes: Vendor["type"][] = [
  "Hardware",
  "Software",
  "Services",
  "Cloud",
];

// Shared vendor statuses
export const vendorStatuses: Vendor["status"][] = [
  "Approved",
  "Pending",
  "Rejected",
];

// Shared tab configuration
export const vendorTabs = [
  { id: "vendor", label: "Vendor Info" },
  { id: "contact", label: "Contact" },
  { id: "it", label: "IT & Security" },
  { id: "performance", label: "Performance" },
  { id: "procurement", label: "Procurement" },
  { id: "compliance", label: "Compliance" },
  { id: "financial", label: "Financial" },
  { id: "contract", label: "Contract" },
  { id: "custom", label: "Custom Fields" },
];
