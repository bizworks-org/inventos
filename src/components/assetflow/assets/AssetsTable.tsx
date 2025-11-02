import { motion } from 'motion/react';
import { Edit2, Trash2, ExternalLink, Mail } from 'lucide-react';
import { Asset } from '../../../lib/data';
import { useEffect, useState, useMemo } from 'react';
import { usePrefs } from '../layout/PrefsContext';
import { sendAssetConsent } from '../../../lib/api';
import { toast } from 'sonner@2.0.3';

interface AssetsTableProps {
  assets: Asset[];
  onNavigate?: (page: string, assetId?: string) => void;
  onDelete?: (id: string, name: string) => void;
  canWrite?: boolean;
}

function getStatusColor(status: Asset['status']) {
  const colors: Record<Asset['status'], string> = {
    'In Store (New)': 'bg-[#3b82f6]/10 text-[#2563eb] border-[#3b82f6]/20',
    'In Store (Used)': 'bg-[#60a5fa]/10 text-[#3b82f6] border-[#60a5fa]/20',
    'Allocated': 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
    'In Repair (In Store)': 'bg-[#f59e0b]/10 text-[#d97706] border-[#f59e0b]/20',
    'In Repair (Allocated)': 'bg-[#f59e0b]/10 text-[#b45309] border-[#f59e0b]/20',
    'Faulty – To Be Scrapped': 'bg-[#fb923c]/10 text-[#ea580c] border-[#fb923c]/20',
    'Scrapped / Disposed': 'bg-[#94a3b8]/10 text-[#64748b] border-[#94a3b8]/20',
    'Lost / Missing': 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
  };
  return colors[status] || 'bg-[#e5e7eb] text-[#6b7280] border-[#e5e7eb]';
}

function consentBadge(asset: Asset) {
  const status = asset.consentStatus || 'none';
  const map: Record<string, string> = {
    pending: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
    accepted: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
    rejected: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
    none: 'bg-[#e5e7eb] text-[#6b7280] border-[#e5e7eb]'
  };
  const label = status === 'none' ? 'No consent' : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status]}`}>
      {label}
    </span>
  );
}

function useCurrencyFormatter() {
  const { formatCurrency } = usePrefs();
  return (amount: number) => formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function isDateExpiring(dateString: string): boolean {
  if (!dateString) return false;
  const expiryDate = new Date(dateString);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
}

export function AssetsTable({ assets, onNavigate, onDelete, canWrite = true }: AssetsTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [consentRequired, setConsentRequired] = useState<boolean>(true);
  const formatCurrency = useCurrencyFormatter();
  const { density } = usePrefs();

  // Catalog cache and mapping from type -> category
  type UiCategory = { id: number; name: string; sort?: number; types: Array<{ id?: number; name: string; sort?: number }> };
  const [catalog, setCatalog] = useState<UiCategory[] | null>(null);
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem('catalog.categories');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return false;
        setCatalog(parsed as UiCategory[]);
        return true;
      } catch {
        return false;
      }
    };

    const fetchAndStore = async () => {
      try {
        const res = await fetch('/api/catalog', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const cats = Array.isArray(data) ? data : data?.categories;
        if (Array.isArray(cats)) {
          try { localStorage.setItem('catalog.categories', JSON.stringify(cats)); } catch {}
          setCatalog(cats as UiCategory[]);
        }
      } catch {}
    };

    // Prefer localStorage first; if missing, fetch from API
    if (!loadFromStorage()) fetchAndStore();

    const onClear = () => fetchAndStore();
    window.addEventListener('assetflow:catalog-cleared', onClear as EventListener);
    return () => window.removeEventListener('assetflow:catalog-cleared', onClear as EventListener);
  }, []);

  // Build lookups to resolve type_id -> category and type name -> category as well as id->type name
  const catalogMaps = useMemo(() => {
    const idToCategory = new Map<string, string>();
    const nameToCategory = new Map<string, string>();
    const idToTypeName = new Map<string, string>();
    if (catalog && catalog.length) {
      for (const c of catalog) {
        for (const t of c.types || []) {
          if (t.id !== undefined && t.id !== null) {
            idToCategory.set(String(t.id), c.name);
            idToTypeName.set(String(t.id), t.name);
          }
          if (t.name) nameToCategory.set(t.name, c.name);
        }
      }
    }
    return { idToCategory, nameToCategory, idToTypeName };
  }, [catalog]);

  const resolveTypeName = (asset: Asset) => {
    // Prefer explicit type_name if server provides it
    const explicit = (asset as any).type_name;
    if (explicit) return explicit;
    // Legacy string type
    if ((asset as any).type) return (asset as any).type as string;
    // If we have a numeric type_id, resolve it from catalog
    const tid = (asset as any).type_id;
    if (tid !== undefined && tid !== null) {
      return catalogMaps.idToTypeName.get(String(tid)) ?? '';
    }
    return '';
  };

  const categoryOfAsset = (asset: Asset) => {
    const tid = (asset as any).type_id;
    if (tid !== undefined && tid !== null) {
      const from = catalogMaps.idToCategory.get(String(tid));
      if (from) return from;
    }
    const t = (asset as any).type as string | undefined;
    if (t) {
      const from = catalogMaps.nameToCategory.get(t);
      if (from) return from;
      return t;
    }
    return '';
  };

  useEffect(() => {
    try {
      const v = document?.documentElement?.getAttribute('data-consent-required');
      if (v === 'false' || v === '0') setConsentRequired(false);
    } catch {}
  }, []);

  const cellPad = density === 'ultra-compact' ? 'px-3 py-1.5' : density === 'compact' ? 'px-4 py-2' : 'px-6 py-4';
  const headPad = density === 'ultra-compact' ? 'px-3 py-2' : density === 'compact' ? 'px-4 py-2.5' : 'px-6 py-4';
  const iconBox = density === 'ultra-compact' ? 'h-8 w-8 text-[10px]' : density === 'compact' ? 'h-9 w-9 text-[11px]' : 'h-10 w-10 text-xs';
  const nameText = density === 'ultra-compact' ? 'text-sm' : density === 'compact' ? 'text-sm' : '';
  const subText = density === 'ultra-compact' ? 'text-[11px]' : 'text-xs';

  const handleEdit = (assetId: string) => {
    onNavigate?.('assets-edit', assetId);
  };

  const handleDelete = (assetId: string, assetName: string) => {
    if (confirm(`Are you sure you want to delete ${assetName}?`)) {
      onDelete?.(assetId, assetName);
    }
  };

  if (assets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-12 text-center shadow-sm"
      >
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-[#f8f9ff] flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="h-8 w-8 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1a1d2e] mb-2">No assets found</h3>
          <p className="text-[#64748b] mb-6">
            Try adjusting your filters or search query to find what you're looking for.
          </p>
          <button
            onClick={() => onNavigate?.('assets-add')}
            className="px-6 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Add Your First Asset
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#f8f9ff] to-[#f0f4ff] border-b border-[rgba(0,0,0,0.05)]">
              <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                Asset
              </th>
              <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                Serial Number
              </th>
              <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                Assigned To
              </th>
              <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                Department
              </th>
              {consentRequired && (
                <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                  Consent
                </th>
              )}
              <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                Status
              </th>
              <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                End of Support
              </th>
              <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                End of Life
              </th>
              <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                Cost
              </th>
              <th className={`${headPad} text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <motion.tr
                key={asset.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                onMouseEnter={() => setHoveredRow(asset.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`
                  border-b border-[rgba(0,0,0,0.05)] transition-all duration-200
                  ${hoveredRow === asset.id ? 'bg-gradient-to-r from-[#f8f9ff] to-transparent' : ''}
                `}
              >
                {/* Asset Name & Type */}
                <td className={`${cellPad}`}>
                  <div className="flex items-center gap-3">
                    <div className={`
                      ${iconBox} rounded-lg flex items-center justify-center font-semibold
                        ${(() => {
                        const cat = (categoryOfAsset(asset) || '').toLowerCase();
                        if (cat.includes('workstat')) return 'bg-[#6366f1]/10 text-[#6366f1]';
                        if (cat.includes('server') || cat.includes('storage')) return 'bg-[#ec4899]/10 text-[#ec4899]';
                        if (cat.includes('network')) return 'bg-[#10b981]/10 text-[#10b981]';
                        if (cat.includes('accessor')) return 'bg-[#f59e0b]/10 text-[#f59e0b]';
                        if (cat.includes('electronic')) return 'bg-[#3b82f6]/10 text-[#3b82f6]';
                        return 'bg-[#e5e7eb] text-[#6b7280]';
                      })()}
                    `}>
                      {(() => { const name = resolveTypeName(asset) || String((asset as any).type_id ?? (asset as any).type ?? ''); return (name || '').substring(0, 2).toUpperCase(); })()}
                    </div>
                    <div>
                      <p className={`font-semibold text-[#1a1d2e] ${nameText}`}>{asset.name}</p>
                      <p className={`${subText} text-[#94a3b8]`}>{resolveTypeName(asset)}</p>
                    </div>
                  </div>
                </td>

                {/* Serial Number */}
                <td className={`${cellPad}`}>
                  <p className={`text-sm text-[#64748b] font-mono ${density==='ultra-compact' ? 'text-[12px]' : ''}`}>{asset.serialNumber}</p>
                </td>

                {/* Assigned To */}
                <td className={`${cellPad}`}>
                  <p className={`text-sm text-[#1a1d2e] font-medium ${density==='ultra-compact' ? 'text-[12px]' : ''}`}>{asset.assignedTo}</p>
                </td>

                {/* Department */}
                <td className={`${cellPad}`}>
                  <p className={`text-sm text-[#64748b] ${density==='ultra-compact' ? 'text-[12px]' : ''}`}>{asset.department}</p>
                </td>

                {/* Consent */}
                {consentRequired && (
                  <td className={`${cellPad}`}>
                    <div className="flex items-center gap-2">
                      {consentBadge(asset)}
                      {asset.assignedEmail && (
                        <span className={`text-xs text-[#6b7280] ${density==='ultra-compact' ? 'hidden' : ''}`}>{asset.assignedEmail}</span>
                      )}
                    </div>
                  </td>
                )}

                {/* Status */}
                <td className={`${cellPad}`}>
                  <span className={`
                    inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
                    ${getStatusColor(asset.status)}
                  `}>
                    {asset.status}
                  </span>
                </td>

                {/* End of Support */}
                <td className={`${cellPad}`}>
                  <div>
                    <p className={`text-sm font-medium ${isDateExpiring((asset as any).eosDate || '') ? 'text-[#f59e0b]' : 'text-[#64748b]'} ${density==='ultra-compact' ? 'text-[12px]' : ''}`}>
                      {(asset as any).eosDate ? formatDate((asset as any).eosDate) : '—'}
                    </p>
                    {isDateExpiring((asset as any).eosDate || '') && (
                      <p className={`${subText} text-[#f59e0b]`}>Expiring soon</p>
                    )}
                  </div>
                </td>

                {/* End of Life */}
                <td className={`${cellPad}`}>
                  <div>
                    <p className={`text-sm font-medium ${isDateExpiring((asset as any).eolDate || '') ? 'text-[#f59e0b]' : 'text-[#64748b]'} ${density==='ultra-compact' ? 'text-[12px]' : ''}`}>
                      {(asset as any).eolDate ? formatDate((asset as any).eolDate) : '—'}
                    </p>
                    {isDateExpiring((asset as any).eolDate || '') && (
                      <p className={`${subText} text-[#f59e0b]`}>Expiring soon</p>
                    )}
                  </div>
                </td>

                {/* Cost */}
                <td className={`${cellPad}`}>
                  <p className={`text-sm font-semibold text-[#1a1d2e] ${density==='ultra-compact' ? 'text-[12px]' : ''}`}>{formatCurrency(asset.cost)}</p>
                </td>

                {/* Actions */}
                <td className={`${cellPad}`}>
                  <div className={`flex items-center ${density==='ultra-compact' ? 'gap-1.5' : 'gap-2'}`}>
                    {canWrite && (
                      <>
                        {consentRequired && (
                          <button
                          onClick={async () => {
                            try {
                              if (!asset.assignedEmail) {
                                toast.error('No assigned email set for this asset');
                                return;
                              }
                              const doing = toast.loading('Sending consent email…');
                              await sendAssetConsent({ assetId: asset.id, email: asset.assignedEmail, assetName: asset.name });
                              toast.dismiss(doing);
                              toast.success('Consent email sent');
                            } catch (e: any) {
                              toast.error(e?.message || 'Failed to send consent');
                            }
                          }}
                          className={`rounded-lg text-[#2563eb] transition-all duration-200 group ${density==='ultra-compact' ? 'p-1.5' : 'p-2'} hover:bg-[#2563eb]/10`}
                          title="Resend consent"
                          >
                          <Mail className={`${density==='ultra-compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} group-hover:scale-110 transition-transform`} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(asset.id)}
                          className={`rounded-lg text-[#6366f1] transition-all duration-200 group ${density==='ultra-compact' ? 'p-1.5' : 'p-2'} hover:bg-[#6366f1]/10`}
                          title="Edit asset"
                        >
                          <Edit2 className={`${density==='ultra-compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} group-hover:scale-110 transition-transform`} />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id, asset.name)}
                          className={`rounded-lg text-[#ef4444] transition-all duration-200 group ${density==='ultra-compact' ? 'p-1.5' : 'p-2'} hover:bg-[#ef4444]/10`}
                          title="Delete asset"
                        >
                          <Trash2 className={`${density==='ultra-compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} group-hover:scale-110 transition-transform`} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
