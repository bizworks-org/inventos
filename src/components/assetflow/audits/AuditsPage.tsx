"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { fetchAudits, createAudit, Audit } from "../../../lib/audit";

export function AuditsPage({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setAudits(await fetchAudits());
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load locations for dropdown, include 'Any' option
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/locations", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const toName = (x: any) => {
          if (x == null) return "";
          if (typeof x === "string") return x.trim();
          const raw = x.name ?? x.location ?? x.city ?? x.code ?? x.id ?? "";
          return String(raw).trim();
        };
        let names: string[] = [];
        if (Array.isArray(data)) {
          names = data.map(toName).filter(Boolean);
        } else if (Array.isArray(data?.locations)) {
          names = data.locations.map(toName).filter(Boolean);
        }
        const unique = Array.from(new Set(names)).sort((a, b) =>
          a.localeCompare(b)
        );
        setLocations(["Any", ...unique]);
      } catch {}
    })();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const selected = (location || "").trim();
      const res = await createAudit({
        name: name.trim(),
        location: selected && selected !== "Any" ? selected : undefined,
      });
      setName("");
      setLocation("");
      setAudits(await fetchAudits());
      onNavigate?.(`audits/${res.id}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: "Home", href: "#" }, { label: "Audits" }]}
      currentPage="audits"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Audits</h1>
          <p className="text-[#64748b]">
            Manage asset inventory audit sessions
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Create Audit</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Audit name"
            className="px-3 py-2 border rounded w-56"
          />
          <div className="flex items-center gap-2">
            <label htmlFor="audit-location" className="text-sm text-[#64748b]">
              Location
            </label>
            <select
              id="audit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3 py-2 border rounded w-56 bg-white"
            >
              {locations.length === 0 ? (
                <option value="">Loading…</option>
              ) : (
                locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))
              )}
            </select>
          </div>
          <Button onClick={handleCreate} className="px-4 py-2">
            Create
          </Button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Audits</h2>
        {loading && <p className="text-sm text-[#64748b]">Loading…</p>}
        {!loading && !audits.length && (
          <p className="text-sm text-[#64748b]">No audits yet.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {audits.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#1a1d2e]">{a.name}</h3>
                <span className="text-xs px-2 py-1 rounded bg-[#f8f9ff] text-[#64748b]">
                  {a.id}
                </span>
              </div>
              <p className="text-xs text-[#64748b]">
                {a.location || "Global"} •{" "}
                {new Date(a.timestamp).toLocaleDateString()}
              </p>
              <p className="text-xs text-[#64748b]">
                Items: {a.itemCount ?? 0}
              </p>
              <Button
                onClick={() => onNavigate?.(`audits/${a.id}`)}
                className="mt-1 text-sm px-3 py-2"
              >
                Open
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </AssetFlowLayout>
  );
}
