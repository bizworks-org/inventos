"use client";
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { Package, Plus, Laptop, Monitor, Server as ServerIcon, Printer as PrinterIcon, Smartphone, Box, Globe } from 'lucide-react';

export type UiCategory = { id: number; name: string; sort: number; types: Array<{ id: number; name: string; sort: number }> };

export default function CatalogAdminPage() {
    const [categories, setCategories] = useState<UiCategory[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newCategory, setNewCategory] = useState('');
    const [newType, setNewType] = useState('');

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/catalog', { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load catalog');
            const cats: UiCategory[] = data.categories || [];
            setCategories(cats);
            if (cats.length && !selectedId) setSelectedId(cats[0].id);
        } catch (e: any) {
            setError(e?.message || 'Failed to load catalog');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const selected = useMemo(() => categories.find(c => c.id === selectedId) || null, [categories, selectedId]);

    const gradientForCategory = (name?: string) => {
        const n = (name || '').toLowerCase();
        if (n.includes('workstation')) return 'linear-gradient(to bottom right, #6366f1, #8b5cf6)';
        if (n.includes('server') || n.includes('storage')) return 'linear-gradient(to bottom right, #06b6d4, #3b82f6)';
        if (n.includes('network')) return 'linear-gradient(to bottom right, #10b981, #14b8a6)';
        if (n.includes('accessor')) return 'linear-gradient(to bottom right, #f59e0b, #f97316)';
        if (n.includes('electronic')) return 'linear-gradient(to bottom right, #ec4899, #f43f5e)';
        return 'linear-gradient(to bottom right, #64748b, #475569)';
    };

        const iconForCategory = (name?: string) => {
            const n = (name || '').toLowerCase();
            if (n.includes('workstation')) return Laptop;
            if (n.includes('server') || n.includes('storage')) return ServerIcon;
            if (n.includes('network')) return Globe;
            if (n.includes('accessor')) return Package;
            if (n.includes('electronic')) return Smartphone;
            return Box;
        };

    const iconForType = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('laptop') || n.includes('notebook')) return Laptop;
        if (n.includes('desktop') || n.includes('pc')) return Monitor;
        if (n.includes('server') || n.includes('storage')) return ServerIcon;
        if (n.includes('monitor') || n.includes('display') || n.includes('screen')) return Monitor;
        if (n.includes('printer')) return PrinterIcon;
        if (n.includes('phone') || n.includes('mobile') || n.includes('smart')) return Smartphone;
        return Box;
    };

    const gradientForType = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('laptop') || n.includes('desktop') || n.includes('notebook')) return 'linear-gradient(to right, #6366f1, #8b5cf6)'; // indigo → violet
        if (n.includes('server') || n.includes('storage')) return 'linear-gradient(to right, #06b6d4, #3b82f6)'; // cyan → blue
        if (n.includes('monitor') || n.includes('display') || n.includes('screen')) return 'linear-gradient(to right, #f59e0b, #f97316)'; // amber → orange
        if (n.includes('printer')) return 'linear-gradient(to right, #14b8a6, #10b981)'; // teal → emerald
        if (n.includes('phone') || n.includes('mobile') || n.includes('smart')) return 'linear-gradient(to right, #ec4899, #f43f5e)'; // pink → rose
        return 'linear-gradient(to right, #64748b, #475569)'; // slate
    };

    const addCategory = async () => {
        const name = newCategory.trim();
        if (!name) return;
        const doing = toast.loading('Creating category…');
        try {
            const res = await fetch('/api/admin/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to create category');
            setNewCategory('');
            await load();
            toast.success('Category created');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to create category');
        } finally {
            toast.dismiss(doing);
        }
    };

    const addType = async () => {
        if (!selected) return;
        const name = newType.trim();
        if (!name) return;
        const doing = toast.loading('Adding type…');
        try {
            const res = await fetch('/api/admin/catalog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, categoryId: selected.id }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to add type');
            setNewType('');
            await load();
            toast.success('Type added');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to add type');
        } finally {
            toast.dismiss(doing);
        }
    };

    return (
        <>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#1a1d2e]">Asset Catalog</h1>
                <p className="text-[#64748b]">Manage asset categories and their types.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Categories */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-3">Categories</h2>
                        {loading ? (
                            <p>Loading…</p>
                        ) : error ? (
                            <p className="text-[#ef4444]">{error}</p>
                        ) : (
                            <div className="space-y-2">
                                                {categories.map((c) => {
                                                    const CatIcon = iconForCategory(c.name);
                                                    return (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => setSelectedId(c.id)}
                                                            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-colors ${selectedId === c.id ? 'text-white border-transparent' : 'bg-white text-[#1a1d2e] border-[#e2e8f0] hover:border-[#cbd5e1]'}`}
                                                            style={selectedId === c.id ? { backgroundImage: gradientForCategory(c.name) } : undefined}
                                                        >
                                                            <span className="flex items-center gap-2 min-w-0">
                                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white" style={{ backgroundImage: gradientForCategory(c.name) }}>
                                                                    <CatIcon className="h-4 w-4" />
                                                                </span>
                                                                <span className="font-medium truncate">{c.name}</span>
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedId === c.id ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>{c.types.length}</span>
                                                        </button>
                                                    );
                                                })}
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                            <label className="block text-sm text-[#64748b] mb-1">Add Category</label>
                            <div className="flex gap-2">
                                <input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="e.g., Electronic Devices"
                                    className="flex-1 px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
                                />
                                <button onClick={addCategory} className="px-3 py-2 rounded-lg text-white" style={{ backgroundImage: 'linear-gradient(to right, #22c55e, #14b8a6)' }}>
                                    <span className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Types */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold">Types {selected ? <span className="text-[#64748b] font-normal">in {selected.name}</span> : null}</h2>
                        </div>
                        {!selected ? (
                            <div className="p-12 text-center text-[#64748b]">
                                <div className="h-12 w-12 rounded-full bg-[#f8f9ff] flex items-center justify-center mx-auto mb-3">
                                    <Package className="h-6 w-6 text-[#6366f1]" />
                                </div>
                                <p>Select a category to view and add types.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 mb-4">
                                    {selected.types.length === 0 && (
                                        <p className="text-[#64748b]">No types in this category yet.</p>
                                    )}
                                    {selected.types.map((t) => {
                                        const Icon = iconForType(t.name);
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                className="w-full flex items-center justify-between px-4 py-2 rounded-lg border text-white shadow-sm"
                                                style={{ backgroundImage: gradientForType(t.name) }}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4 opacity-90" />
                                                    <span className="font-medium">{t.name}</span>
                                                </span>
                                                {/* optional: show ID or actions */}
                                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                                    #{t.id}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="pt-4 border-t border-[#e2e8f0]">
                                    <label className="block text-sm text-[#64748b] mb-1">Add Type</label>
                                    <div className="flex gap-2 max-w-xl">
                                        <input
                                            value={newType}
                                            onChange={(e) => setNewType(e.target.value)}
                                            placeholder="e.g., Smartphone"
                                            className="flex-1 px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
                                        />
                                        <button onClick={addType} className="px-3 py-2 rounded-lg text-white" style={{ backgroundImage: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}>
                                            <span className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
