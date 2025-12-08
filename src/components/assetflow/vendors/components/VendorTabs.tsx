"use client";
import { Button } from "@/components/ui/button";

type VendorTabsProps = {
  tabs: { id: string; label: string }[];
  activeTab: string;
  setActiveTab: (id: string) => void;
};

export default function VendorTabs({
  tabs,
  activeTab,
  setActiveTab,
}: VendorTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Vendor tabs"
      className="flex w-full flex-wrap gap-2 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f8f9ff] p-2"
      onKeyDown={(e) => {
        const idx = tabs.findIndex((t) => t.id === activeTab);
        if (e.key === "ArrowRight") {
          const next = tabs[(idx + 1) % tabs.length];
          setActiveTab(next.id);
        } else if (e.key === "ArrowLeft") {
          const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
          setActiveTab(prev.id);
        }
      }}
    >
      {tabs.map((t) => (
        <Button
          key={t.id}
          id={`tab-${t.id}`}
          role="tab"
          type="button"
          aria-selected={activeTab === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={activeTab === t.id ? 0 : -1}
          onClick={() => setActiveTab(t.id)}
          className={`flex-1 text-center ${
            activeTab !== t.id
              ? "bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold"
              : ""
          } flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm`}
        >
          {t.label}
        </Button>
      ))}
    </nav>
  );
}
