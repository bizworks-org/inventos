"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { Package, Plus, Laptop, Monitor, Server as ServerIcon, Printer as PrinterIcon, Smartphone, Box, Globe, Pencil, Check, X } from 'lucide-react';
import Portal from '@/components/ui/Portal';

export type UiCategory = { id: number; name: string; sort: number; types: Array<{ id: number; name: string; sort: number }> };

export default function CatalogAdminPage() {
    const [categories, setCategories] = useState<UiCategory[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newCategory, setNewCategory] = useState('');
    const [newType, setNewType] = useState('');
    // Inline category rename state
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const isSavingCategory = useRef(false);
    // JS hover fallback to ensure icon shows even if CSS group-hover fails in some envs
    const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null);
    const [renamingTypeId, setRenamingTypeId] = useState<number | null>(null);
    const [renamingTypeName, setRenamingTypeName] = useState('');
    const [renamingTypeCategoryId, setRenamingTypeCategoryId] = useState<number | null>(null);
    const [hoveredTypeId, setHoveredTypeId] = useState<number | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmPayload, setConfirmPayload] = useState<{ entity: 'category' | 'type'; id: number; name: string; count?: number; types?: string[] } | null>(null);
    const [confirmBusy, setConfirmBusy] = useState(false);
    const pendingTypes = confirmPayload && confirmPayload.entity === 'category' ? (categories.find((c) => c.id === confirmPayload.id)?.types || []) : [];

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/catalog', { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load catalog');
            const cats: UiCategory[] = data.categories || [];
            setCategories(cats);
            try {
                localStorage.setItem('catalog.categories', JSON.stringify(cats));
            } catch (e) {
                // ignore storage errors
            }
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

    const saveRenameCategory = async (categoryId: number, nameRaw: string) => {
        if (isSavingCategory.current) return;
        const name = nameRaw.trim();
        const cat = categories.find((c) => c.id === categoryId);
        if (!cat) return;
        // If no change or empty, just exit edit mode without calling API
        if (!name || name === cat.name) {
            setEditingCategoryId(null);
            setEditingCategoryName('');
            return;
        }
        isSavingCategory.current = true;
        const doing = toast.loading('Renaming category…');
        try {
            const res = await fetch('/api/admin/catalog', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'category', id: categoryId, name }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to rename category');
            setEditingCategoryId(null);
            setEditingCategoryName('');
            await load();
            toast.success('Category renamed');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to rename category');
        } finally {
            toast.dismiss(doing);
            isSavingCategory.current = false;
        }
    };

    const startRenameType = (id: number, currentName: string, currentCategoryId: number) => {
        setRenamingTypeId(id);
        setRenamingTypeName(currentName);
        setRenamingTypeCategoryId(currentCategoryId);
    };
    const cancelRenameType = () => { setRenamingTypeId(null); setRenamingTypeName(''); setRenamingTypeCategoryId(null); };
    const submitRenameType = async () => {
        if (renamingTypeId == null) return;
        const name = renamingTypeName.trim();
        if (!name) return;
        const doing = toast.loading('Renaming type…');
        try {
            const body: any = { entity: 'type', id: renamingTypeId, name };
            if (renamingTypeCategoryId != null) body.categoryId = renamingTypeCategoryId;
            const res = await fetch('/api/admin/catalog', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to rename type');
            cancelRenameType();
            await load();
            toast.success('Type renamed');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to rename type');
        } finally {
            toast.dismiss(doing);
        }
    };
    const sortType = async (typeId: number, nextSort: number) => {
        const doing = toast.loading('Updating sort…');
        try {
            const res = await fetch('/api/admin/catalog', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'type', id: typeId, sort: nextSort }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to update order');
            await load();
            toast.success('Order updated');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update order');
        } finally {
            toast.dismiss(doing);
        }
    };

    // When confirmation modal opens, perform a dry-run check to see if assets reference the entity
    useEffect(() => {
        let cancelled = false;
        (async () => {
                if (!confirmOpen || !confirmPayload) return;
                // If we've already populated a count for this payload, don't re-run the dry-run check.
                if (typeof confirmPayload.count === 'number') return;
                try {
                    const res = await fetch('/api/admin/catalog', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: confirmPayload.entity, id: confirmPayload.id, dryRun: true }) });
                    const data = await res.json();
                    if (cancelled) return;
                    if (!res.ok) {
                        toast.error(data?.error || 'Failed to check dependencies');
                        return;
                    }
                    // populate count/types once so subsequent effect runs are no-ops
                    setConfirmPayload((p) => p ? { ...p, count: (data?.count ?? 0), types: data?.types } : p);
                } catch (e: any) {
                    toast.error(e?.message || 'Failed to check dependencies');
                }
            })();
        return () => { cancelled = true; };
    }, [confirmOpen, confirmPayload]);

    const performDelete = async () => {
        if (!confirmPayload) return;
        setConfirmBusy(true);
        const target = confirmPayload; // capture before we null it out
        try {
            // If deleting a category and user requested to delete types first, delete them explicitly
            if (target.entity === 'category') {
                const cat = categories.find((c) => c.id === target.id);
                const typeIds = cat?.types.map((t) => t.id) || [];
                if (typeIds.length) {
                    // First do a dry-run for each type to ensure no assets reference them
                    const dryRuns = await Promise.all(typeIds.map((tid) => fetch('/api/admin/catalog', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'type', id: tid, dryRun: true }) })));
                    for (const r of dryRuns) {
                        const dd = await r.json().catch(() => ({}));
                        if (!r.ok) throw new Error(dd?.error || 'Failed to check type dependencies');
                        if (dd?.requiresConfirmation) {
                            throw new Error('Cannot delete types because some types have assets assigned. Reassign assets first.');
                        }
                    }
                    // send delete requests for each type
                    const responses = await Promise.all(typeIds.map((tid) => fetch('/api/admin/catalog', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'type', id: tid }) })));
                    for (const res of responses) {
                        if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            throw new Error(data?.error || 'Failed to delete type');
                        }
                    }
                    // optimistically remove types from local state
                    setCategories((prev) => prev.map((c) => c.id === target.id ? { ...c, types: [] } : c));
                    try { localStorage.setItem('catalog.categories', JSON.stringify(categories.map((c) => c.id === target.id ? { ...c, types: [] } : c))); } catch (e) {}
                }
            }
            const body: any = { entity: target.entity, id: target.id };
            // force delete not permitted when assets are assigned — server will reject if assets exist
            const res = await fetch('/api/admin/catalog', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Delete failed');

            // Optimistically update UI immediately
            setCategories((prev) => {
                if (target.entity === 'category') {
                    const next = prev.filter((c) => c.id !== target.id);
                    if (selectedId === target.id) {
                        // move selection to first remaining category (if any)
                        setSelectedId(next.length ? next[0].id : null);
                    }
                    try { localStorage.setItem('catalog.categories', JSON.stringify(next)); } catch (e) {}
                    return next;
                } else {
                    // entity === 'type': remove the type from whichever category contains it
                    let found = false;
                    const next = prev.map((c) => {
                        const hadType = c.types.some((t) => t.id === target.id);
                        if (!hadType) return c;
                        found = true;
                        return { ...c, types: c.types.filter((t) => t.id !== target.id) };
                    });
                    const out = found ? next : prev;
                    try { localStorage.setItem('catalog.categories', JSON.stringify(out)); } catch (e) {}
                    return out;
                }
            });

            // Close dialog and show success
            setConfirmOpen(false);
            setConfirmPayload(null);
            toast.success(`${target.entity === 'category' ? 'Category' : 'Type'} deleted`);

            // Refresh from server in the background to stay in sync
            void load();
        } catch (e: any) {
            toast.error(e?.message || 'Delete failed');
        } finally {
            setConfirmBusy(false);
        }
    };

    const modalRef = useRef<HTMLDivElement | null>(null);
    const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

    // Focus trap & Escape handling for the inline modal
    useEffect(() => {
        if (!confirmOpen) return;
        const prev = document.activeElement as HTMLElement | null;
        const id = setTimeout(() => confirmBtnRef.current?.focus(), 120);

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setConfirmOpen(false);
                setConfirmPayload(null);
                return;
            }
            if (e.key === 'Tab') {
                const container = modalRef.current;
                if (!container) return;
                const focusable = Array.from(container.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
                )).filter((el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable.at(-1)!;
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', onKey);
        return () => { clearTimeout(id); document.removeEventListener('keydown', onKey); if (prev) prev.focus(); };
    }, [confirmOpen]);

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
                        <h2 className="text-lg font-semibold mb-1">Categories</h2>
                        <p className="text-xs text-[#64748b] mb-3">Tip: hover a category to reveal the edit icon.</p>
                        {loading ? (
                            <p>Loading…</p>
                        ) : error ? (
                            <p className="text-[#ef4444]">{error}</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((c) => {
                                    const CatIcon = iconForCategory(c.name);
                                    const isSelected = selectedId === c.id;
                                    const isEditing = editingCategoryId === c.id;
                                    if (isEditing) {
                                        return (
                                            <div key={c.id} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border bg-[#f8f9ff] border-[#e2e8f0]">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white" style={{ backgroundImage: gradientForCategory(c.name) }}>
                                                        <CatIcon className="h-4 w-4" />
                                                    </span>
                                                    <input
                                                        autoFocus
                                                        value={editingCategoryName}
                                                        onChange={(e) => setEditingCategoryName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                saveRenameCategory(c.id, editingCategoryName);
                                                            } else if (e.key === 'Escape') {
                                                                setEditingCategoryId(null);
                                                                setEditingCategoryName('');
                                                            }
                                                        }}
                                                        onBlur={() => saveRenameCategory(c.id, editingCategoryName)}
                                                        className="flex-1 px-3 py-1.5 rounded-md bg-white border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveRenameCategory(c.id, editingCategoryName); }}
                                                        className="inline-flex items-center justify-center text-xs p-1.5 rounded bg-[#e2e8f0] text-[#475569] hover:bg-[#cbd5e1]"
                                                        aria-label="Save category"
                                                        title="Save"
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#e2e8f0] text-[#64748b]">{c.types.length}</span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div
                                            key={c.id}
                                            className={`group w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-colors ${isSelected ? 'text-white border-transparent' : 'bg-white text-[#1a1d2e] border-[#e2e8f0] hover:border-[#cbd5e1]'}`}
                                            style={isSelected ? { backgroundImage: gradientForCategory(c.name) } : undefined}
                                            onMouseEnter={() => setHoveredCategoryId(c.id)}
                                            onMouseLeave={() => setHoveredCategoryId((prev) => (prev === c.id ? null : prev))}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setSelectedId(c.id)}
                                                className="flex items-center gap-2 min-w-0 flex-1 text-left"
                                            >
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white" style={{ backgroundImage: gradientForCategory(c.name) }}>
                                                    <CatIcon className="h-4 w-4" />
                                                </span>
                                                <span className="font-medium truncate">{c.name}</span>
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCategoryId(c.id); setEditingCategoryName(c.name); }}
                                                    className={`${isSelected ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'} inline-flex items-center text-xs p-1.5 rounded transition-opacity ${hoveredCategoryId === c.id ? 'opacity-100 visible' : 'opacity-0 invisible'} group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible`}
                                                    aria-label="Edit category"
                                                    title="Edit category"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); console.debug('[Catalog] delete category click', { id: c.id, name: c.name }); setConfirmPayload({ entity: 'category', id: c.id, name: c.name }); setConfirmOpen(true); }}
                                                    className={`inline-flex items-center text-xs p-1.5 rounded transition-opacity ${hoveredCategoryId === c.id ? 'opacity-100 visible' : 'opacity-0 invisible'} group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible bg-[#fff1f2] text-[#b91c1c] hover:bg-[#fee2e2]`}
                                                    aria-label="Delete category"
                                                    title="Delete category"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>{c.types.length}</span>
                                            </div>
                                        </div>
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
                            {/* Inline rename replaces the old "Rename Selected Category" UI */}
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
                                        const isEditing = renamingTypeId === t.id;
                                        return (
                                            <div key={t.id} className="w-full">
                                                {!isEditing ? (
                                                    <div
                                                        className="group w-full flex items-center justify-between px-4 py-2 rounded-lg border text-white shadow-sm"
                                                        style={{ backgroundImage: gradientForType(t.name) }}
                                                        onMouseEnter={() => setHoveredTypeId(t.id)}
                                                        onMouseLeave={() => setHoveredTypeId((prev) => (prev === t.id ? null : prev))}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Icon className="h-4 w-4 opacity-90" />
                                                            <span className="font-medium">{t.name}</span>
                                                        </span>
                                                        <span className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => startRenameType(t.id, t.name, selected.id)}
                                                                className={`text-xs bg-white/20 hover:bg-white/30 p-1.5 rounded inline-flex items-center transition-opacity ${hoveredTypeId === t.id ? 'opacity-100 visible' : 'opacity-0 invisible'} group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible`}
                                                                aria-label="Edit type"
                                                                title="Edit type"
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => { console.debug('[Catalog] delete type click', { id: t.id, name: t.name }); setConfirmPayload({ entity: 'type', id: t.id, name: t.name }); setConfirmOpen(true); }}
                                                                className={`text-xs bg-white/20 hover:bg-white/30 p-1.5 rounded inline-flex items-center transition-opacity ${hoveredTypeId === t.id ? 'opacity-100 visible' : 'opacity-0 invisible'} group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible`}
                                                                aria-label="Delete type"
                                                                title="Delete type"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#b91c1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                            <button onClick={() => sortType(t.id, Math.max(0, (t.sort || 0) - 5))} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded">↑</button>
                                                            <button onClick={() => sortType(t.id, (t.sort || 0) + 5)} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded">↓</button>
                                                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">#{t.id}</span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="w-full flex items-center gap-2 p-2 rounded-lg border bg-[#f8f9ff]">
                                                        <input value={renamingTypeName} onChange={(e) => setRenamingTypeName(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#e2e8f0]" />
                                                        <select value={renamingTypeCategoryId ?? selected.id} onChange={(e) => setRenamingTypeCategoryId(Number(e.target.value))} className="px-3 py-2 rounded-lg bg-white border border-[#e2e8f0]">
                                                            {categories.map((c) => (
                                                                <option key={c.id} value={c.id}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                        <button onClick={submitRenameType} className="px-3 py-2 rounded-lg text-white" style={{ backgroundImage: 'linear-gradient(to right, #10b981, #22c55e)' }}>
                                                            <span className="inline-flex items-center gap-1"><Check className="h-4 w-4" /> Save</span>
                                                        </button>
                                                        <button onClick={cancelRenameType} className="px-3 py-2 rounded-lg text-[#ef4444] border border-[#fecaca] bg-[#fff1f2]">
                                                            <span className="inline-flex items-center gap-1"><X className="h-4 w-4" /> Cancel</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
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
            {/* Confirmation dialog (reusable component) */}
            {console.debug('[Catalog] render confirm dialog state', { confirmOpen, confirmPayload })}
            {confirmOpen && (
                <Portal>
                    <div className="fixed inset-0 z-40">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setConfirmOpen(false); setConfirmPayload(null); }} />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="catalog-confirm-title" className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-[rgba(0,0,0,0.08)] p-6">
                                <div className="mb-3">
                                    <h3 id="catalog-confirm-title" className="text-lg font-semibold text-[#111827]">{confirmPayload ? `Delete ${confirmPayload.entity === 'category' ? 'Category' : 'Type'}` : 'Delete'}</h3>
                                    {confirmPayload && <p className="text-sm text-[#64748b] mt-1">You are about to delete the {confirmPayload.entity === 'category' ? 'category' : 'type'} {confirmPayload.name}.</p>}
                                </div>

                                {confirmPayload && confirmPayload.entity === 'category' && pendingTypes.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-sm text-[#64748b]">This category contains <span className="font-semibold">{pendingTypes.length}</span> type(s). These types will be deleted along with the category if no assets reference them.</p>
                                    </div>
                                )}

                                {confirmPayload && typeof confirmPayload.count === 'number' && confirmPayload.count > 0 ? (
                                    <div className="p-4 bg-[#fff7ed] rounded-md border border-[#ffedd5] mb-2">
                                        <p className="text-sm text-[#92400e]">There are <span className="font-semibold">{confirmPayload.count}</span> asset(s) that reference {confirmPayload.entity === 'category' ? 'types in this category' : 'this type'}.</p>
                                        {confirmPayload.types && confirmPayload.types.length > 0 && (
                                            <p className="text-xs text-[#92400e] mt-2">Affected types: {confirmPayload.types.join(', ')}</p>
                                        )}
                                        <p className="text-xs text-[#92400e] mt-2">Deleting will remove the {confirmPayload.entity === 'category' ? 'category and its types' : 'type'} from the catalog. Assets themselves will not be removed.</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[#64748b]">This action cannot be undone. Proceed?</p>
                                )}

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => { setConfirmOpen(false); setConfirmPayload(null); }}
                                        className="px-4 py-2 rounded-lg border bg-white"
                                    >
                                        Cancel
                                    </button>

                                    {confirmPayload && typeof confirmPayload.count === 'number' && confirmPayload.count > 0 ? (
                                        // Cannot delete when assets are assigned; instruct the user
                                        <div className="text-sm text-[#92400e]">This item cannot be deleted because there are assets assigned. Reassign or remove assets first.</div>
                                    ) : (
                                        <button
                                            onClick={() => performDelete()}
                                            ref={confirmBtnRef}
                                            disabled={confirmBusy}
                                            className="px-4 py-2 rounded-lg border bg-[#ef4444] text-white"
                                        >
                                            {confirmBusy ? 'Working…' : 'Delete'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </>
    );
}
