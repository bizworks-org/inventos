"use client";

import { useEffect, useMemo, useState } from 'react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card } from '../../ui/card';

interface Props {
  onNavigate?: (page: string) => void;
  onSearch?: (q: string) => void;
}

export function CustomizationPage({ onNavigate, onSearch }: Props) {
  const [active, setActive] = useState<'locations' | 'catalog'>('locations');

  // Locations stored locally (and optionally pushed to server if endpoint exists)
  const [locations, setLocations] = useState<Array<{ id?: string; code?: string; name: string; address?: string; zipcode?: string }>>([]);
  const [newLocation, setNewLocation] = useState<{ code: string; name: string; address: string; zipcode: string }>({ code: '', name: '', address: '', zipcode: '' });
  const LS_KEY = 'assetflow:locations';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLocations(parsed.filter(Boolean));
      }
    } catch {}
  }, []);

  const persistLocations = (next: Array<{ id?: string; code?: string; name: string; address?: string; zipcode?: string }>) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      // notify other parts of app with detail payload
      try { window.dispatchEvent(new CustomEvent('assetflow:locations-updated', { detail: next })); } catch { window.dispatchEvent(new Event('assetflow:locations-updated')); }
    } catch {}
  };

  const generateId = () => `loc_${Date.now()}_${Math.floor(Math.random() * 9999)}`;

  const addLocation = () => {
    const vName = (newLocation.name || '').trim();
    const vCode = (newLocation.code || '').trim();
    const vZip = (newLocation.zipcode || '').trim();
    // require code and name
    if (!vCode || !vName) return;
    // validate zipcode if present: must be 6 digits
    if (vZip && !/^[0-9]{6}$/.test(vZip)) {
      try { alert('ZipCode must be a 6-digit number'); } catch {}
      return;
    }
    const loc = { id: generateId(), code: vCode, name: vName, address: (newLocation.address || '').trim(), zipcode: vZip };
    const next = [...locations, loc];
    setLocations(next);
    setNewLocation({ code: '', name: '', address: '', zipcode: '' });
    persistLocations(next);
    // try to save to server (best-effort)
    (async () => {
      try {
        await fetch('/api/admin/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loc) });
      } catch {}
    })();
  };

  const removeLocation = (idx: number) => {
    const next = locations.filter((_, i) => i !== idx);
    setLocations(next);
    persistLocations(next);
  };

  const updateLocation = (idx: number, patch: Partial<{ code: string; name: string; address: string; zipcode: string }>) => {
    // if zipcode present in patch validate
    if (patch.zipcode !== undefined && patch.zipcode !== null && patch.zipcode !== '' && !/^[0-9]{6}$/.test(String(patch.zipcode))) {
      try { alert('ZipCode must be a 6-digit number'); } catch {}
      return;
    }
    const next = locations.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    setLocations(next);
    persistLocations(next);
    // best-effort server update (if id present)
    (async () => {
      try {
        const loc = next[idx];
        if (loc && loc.id) {
          await fetch(`/api/admin/locations/${encodeURIComponent(loc.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loc) });
        }
      } catch {}
    })();
  };

  // Catalog tab: show cached catalog and allow refresh
  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogMsg, setCatalogMsg] = useState<string | null>(null);

  const loadCatalog = async () => {
    try {
      const res = await fetch('/api/admin/catalog', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.categories ?? [];
      setCatalog(items);
      setCatalogMsg('Loaded');
      setTimeout(() => setCatalogMsg(null), 2000);
    } catch (e) {
      setCatalogMsg('Failed to load catalog');
      try { setTimeout(() => setCatalogMsg(null), 3000); } catch {}
    }
  };

  useEffect(() => {
    // show quick cached view from localStorage if present
    try {
      const raw = localStorage.getItem('catalog.categories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCatalog(parsed);
      }
    } catch {}
  }, []);

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: 'Home', href: '#' }, { label: 'Settings', href: '/settings' }, { label: 'Customization' }]}
      currentPage="settings"
      onSearch={onSearch}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-1">Customization</h1>
          <p className="text-[#64748b]">Create and manage locations used by assets, and inspect the catalog.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setActive('locations')} className={`${active === 'locations' ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg' : ''}`}>Locations</Button>
          <Button onClick={() => setActive('catalog')} className={`${active === 'catalog' ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg' : ''}`}>Catalog</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
        <Tabs value={active} onValueChange={(v) => setActive(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
          </TabsList>

          <TabsContent value="locations">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <div className="p-4">
                    <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <Label className="mb-1 block">Code (required)</Label>
                        <Input value={newLocation.code} onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })} placeholder="e.g., BLDG-A-03" />
                      </div>
                      <div>
                        <Label className="mb-1 block">Name (required)</Label>
                        <Input value={newLocation.name} onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} placeholder="e.g., Building A - Floor 3" />
                      </div>
                      <div>
                        <Label className="mb-1 block">Address</Label>
                        <Input value={newLocation.address} onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })} placeholder="Street, City" />
                      </div>
                      <div>
                        <Label className="mb-1 block">ZipCode (6 digits)</Label>
                        <Input value={newLocation.zipcode} onChange={(e) => setNewLocation({ ...newLocation, zipcode: e.target.value })} placeholder="e.g., 560001" />
                      </div>
                      <div className="md:col-span-4">
                        <Button onClick={addLocation}>Add Location</Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      {locations.length === 0 ? (
                        <p className="text-sm text-[#64748b]">No locations defined yet.</p>
                      ) : (
                        <table className="w-full table-auto text-sm">
                          <thead>
                            <tr className="text-left text-[#334155]">
                              <th className="px-3 py-2">Code</th>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Address</th>
                              <th className="px-3 py-2">ZipCode</th>
                              <th className="px-3 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {locations.map((loc, idx) => (
                              <tr key={loc.id ?? idx} className="border-t">
                                <td className="px-3 py-2 align-top">
                                  <Input value={loc.code || ''} onChange={(e) => updateLocation(idx, { code: e.target.value })} placeholder="Code" />
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <Input value={loc.name || ''} onChange={(e) => updateLocation(idx, { name: e.target.value })} placeholder="Name" />
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <Input value={loc.address || ''} onChange={(e) => updateLocation(idx, { address: e.target.value })} placeholder="Address" />
                                </td>
                                <td className="px-3 py-2 align-top w-36">
                                  <Input value={loc.zipcode || ''} onChange={(e) => updateLocation(idx, { zipcode: e.target.value })} placeholder="ZipCode" />
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" onClick={() => updateLocation(idx, {})}>Save</Button>
                                    <Button variant="outline" onClick={() => removeLocation(idx)}>Remove</Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
              <div>
                <Card>
                  <div className="p-4">
                    <h4 className="font-semibold">Usage</h4>
                    <p className="text-sm text-[#64748b] mt-2">Locations you add here will be available to select when creating or editing assets. They are stored locally in your browser; the app will attempt to save them to the server if an endpoint exists.</p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="catalog">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={loadCatalog}>Refresh Catalog</Button>
                <Button variant="outline" onClick={() => { try { localStorage.removeItem('catalog.categories'); setCatalog([]); setCatalogMsg('Cache cleared'); setTimeout(() => setCatalogMsg(null), 2000); } catch {} }}>Clear Cache</Button>
                {catalogMsg && <span className="text-sm text-[#64748b]">{catalogMsg}</span>}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {catalog.length === 0 && <p className="text-sm text-[#64748b]">No catalog entries available. Use Refresh to fetch from server.</p>}
                {catalog.map((c: any, idx: number) => (
                  <div key={idx} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{c.name ?? c.title ?? 'Unnamed'}</div>
                        <div className="text-sm text-[#64748b]">{Array.isArray(c.types) ? `${c.types.length} types` : ''}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AssetFlowLayout>
  );
}

export default CustomizationPage;
