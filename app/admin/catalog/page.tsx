"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CatalogAdminPage() {
    const router = useRouter();
    useEffect(() => {
        // Redirect legacy admin/catalog route to the new location in Settings → Customization
        try { router.replace('/settings/customization'); } catch { router.push('/settings/customization'); }
    }, [router]);
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Redirecting…</h1>
            <p className="text-sm text-[#64748b]">The Catalog UI has moved to Settings → Customization → Catalog. Redirecting you now.</p>
        </div>
    );
}
