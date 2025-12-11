import {
  Laptop,
  Monitor,
  Server as ServerIcon,
  Printer as PrinterIcon,
  Smartphone,
  Box,
  Globe,
  Package,
  type LucideIcon,
} from "lucide-react";

export type UiCategory = {
  id: number;
  name: string;
  sort: number;
  types: Array<{ id: number; name: string; sort: number }>;
};

export const GRADIENTS = {
  defaultCategory: "linear-gradient(to bottom right, #64748b, #475569)",
  workstation: "linear-gradient(to bottom right, #6366f1, #8b5cf6)",
  server: "linear-gradient(to bottom right, #06b6d4, #3b82f6)",
  network: "linear-gradient(to bottom right, #10b981, #14b8a6)",
  accessor: "linear-gradient(to bottom right, #f59e0b, #f97316)",
  electronic: "linear-gradient(to bottom right, #ec4899, #f43f5e)",
};

export function gradientForCategory(name?: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("workstation")) return GRADIENTS.workstation;
  if (n.includes("server") || n.includes("storage")) return GRADIENTS.server;
  if (n.includes("network")) return GRADIENTS.network;
  if (n.includes("accessor")) return GRADIENTS.accessor;
  if (n.includes("electronic")) return GRADIENTS.electronic;
  return GRADIENTS.defaultCategory;
}

export function iconForCategory(name?: string): LucideIcon {
  const n = (name || "").toLowerCase();
  if (n.includes("workstation")) return Laptop;
  if (n.includes("server") || n.includes("storage")) return ServerIcon;
  if (n.includes("network")) return Globe;
  if (n.includes("accessor")) return Package;
  if (n.includes("electronic")) return Smartphone;
  return Box;
}

export function iconForType(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("laptop") || n.includes("notebook")) return Laptop;
  if (n.includes("desktop") || n.includes("pc")) return Monitor;
  if (n.includes("server") || n.includes("storage")) return ServerIcon;
  if (n.includes("monitor") || n.includes("display") || n.includes("screen"))
    return Monitor;
  if (n.includes("printer")) return PrinterIcon;
  if (n.includes("phone") || n.includes("mobile") || n.includes("smart"))
    return Smartphone;
  return Box;
}

export function gradientForType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("laptop") || n.includes("desktop") || n.includes("notebook"))
    return "linear-gradient(to right, #6366f1, #8b5cf6)";
  if (n.includes("server") || n.includes("storage"))
    return "linear-gradient(to right, #06b6d4, #3b82f6)";
  if (n.includes("monitor") || n.includes("display") || n.includes("screen"))
    return "linear-gradient(to right, #f59e0b, #f97316)";
  if (n.includes("printer"))
    return "linear-gradient(to right, #14b8a6, #10b981)";
  if (n.includes("phone") || n.includes("mobile") || n.includes("smart"))
    return "linear-gradient(to right, #ec4899, #f43f5e)";
  return "linear-gradient(to right, #64748b, #475569)";
}
