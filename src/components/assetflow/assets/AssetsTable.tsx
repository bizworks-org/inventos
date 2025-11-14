import { motion } from 'motion/react';
import { Edit2, Trash2, ExternalLink, Mail, Eye } from 'lucide-react';
import { Asset } from '../../../lib/data';
import { useEffect, useState, useMemo, Fragment } from 'react';
import { usePrefs } from '../layout/PrefsContext';
import { sendAssetConsent } from '../../../lib/api';
import { toast } from 'sonner@2.0.3';
import { Button } from '@/components/ui/button';


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

export function AssetsTable({ assets, onNavigate, onDelete, canWrite = true }: Readonly<AssetsTableProps>) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    globalThis.addEventListener('assetflow:catalog-cleared', onClear as EventListener);
    return () => globalThis.removeEventListener('assetflow:catalog-cleared', onClear as EventListener);
  }, []);

  // Build lookups to resolve type_id -> category and type name -> category as well as id->type name
  const catalogMaps = useMemo(() => {
    const idToCategory = new Map<string, string>();
    const nameToCategory = new Map<string, string>();
    const idToTypeName = new Map<string, string>();
    if (catalog?.length) {
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
      const v = document?.documentElement?.dataset?.consentRequired;
      if (v === 'false' || v === '0') setConsentRequired(false);
    } catch {}
  }, []);

  // DEBUG: log classNames of delete buttons so we can verify variant classes are applied at runtime
  useEffect(() => {
    try {
      // delay slightly to allow React to commit DOM
      setTimeout(() => {
        const els = Array.from(document.querySelectorAll('[data-test^="asset-delete-"]'));
        if (els.length) {
          console.info('DEBUG: Found delete buttons:', els.length);
          for (const el of els) {
            console.info('DEBUG: delete-button classList ->', el.getAttribute('class'));
          }
        } else {
          console.info('DEBUG: No delete buttons found (yet)');
        }
      }, 250);
    } catch (e) {
      console.warn('Failed to query delete buttons:', e);
    }
  }, [assets]);

  let cellPad = 'px-6 py-4';
  if (density === 'ultra-compact') {
    cellPad = 'px-3 py-1.5';
  } else if (density === 'compact') {
    cellPad = 'px-4 py-2';
  }
  let headPad = 'px-6 py-4';
  if (density === 'ultra-compact') {
    headPad = 'px-3 py-2';
  } else if (density === 'compact') {
    headPad = 'px-4 py-2.5';
  }
  let iconBox: string = 'h-10 w-10 text-xs';
  if (density === 'ultra-compact') {
    iconBox = 'h-8 w-8 text-[10px]';
  } else if (density === 'compact') {
    iconBox = 'h-9 w-9 text-[11px]';
  }
  let nameText: string = '';
  if (density === 'ultra-compact' || density === 'compact') {
    nameText = 'text-sm';
  }
  const subText = density === 'ultra-compact' ? 'text-[11px]' : 'text-xs';

  const handleEdit = (assetId: string) => {
    onNavigate?.('assets-edit', assetId);
  };

  const toggleView = (assetId: string) => {
    setExpandedId((prev) => (prev === assetId ? null : assetId));
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
          <Button
            onClick={() => onNavigate?.('assets-add')}
            className="px-6 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Add Your First Asset
          </Button>
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
              renderAssetRow(asset, index, setHoveredRow, hoveredRow, expandedId, cellPad, iconBox, categoryOfAsset, resolveTypeName, nameText, subText, density, consentRequired, formatCurrency, canWrite, toggleView, handleEdit, handleDelete)
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
function renderAssetRow(asset: Asset, index: number, setHoveredRow, hoveredRow: string, expandedId: string, cellPad: string, iconBox: string, categoryOfAsset: (asset: Asset) => string, resolveTypeName: (asset: Asset) => any, nameText: string, subText: string, density: string, consentRequired: boolean, formatCurrency: (amount: number) => string, canWrite: boolean, toggleView: (assetId: string) => void, handleEdit: (assetId: string) => void, handleDelete: (assetId: string, assetName: string) => void) {
  return <Fragment key={asset.id}>
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
      onMouseEnter={() => setHoveredRow(asset.id)}
      onMouseLeave={() => setHoveredRow(null)}
      className={`
                    border-b border-[rgba(0,0,0,0.05)] transition-all duration-200 ease-in-out
                    ${hoveredRow === asset.id ? 'bg-gradient-to-r from-[#f8f9ff] to-transparent' : ''}
                    ${expandedId === asset.id ? 'bg-[#eef2ff] shadow-md border-l-4 border-[#6366f1] animate-pulse' : ''}
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
        <p className={`text-sm text-[#64748b] font-mono ${density === 'ultra-compact' ? 'text-[12px]' : ''}`}>{asset.serialNumber}</p>
      </td>

      {/* Assigned To */}
      <td className={`${cellPad}`}>
        <p className={`text-sm text-[#1a1d2e] font-medium ${density === 'ultra-compact' ? 'text-[12px]' : ''}`}>{asset.assignedTo}</p>
      </td>

      {/* Department */}
      <td className={`${cellPad}`}>
        <p className={`text-sm text-[#64748b] ${density === 'ultra-compact' ? 'text-[12px]' : ''}`}>{asset.department}</p>
      </td>

      {/* Consent */}
      {consentRequired && (
        <td className={`${cellPad}`}>
          <div className="flex items-center gap-2">
            {consentBadge(asset)}
            {asset.assignedEmail && (
              <span className={`text-xs text-[#6b7280] ${density === 'ultra-compact' ? 'hidden' : ''}`}>{asset.assignedEmail}</span>
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
          <p className={`text-sm font-medium ${isDateExpiring((asset as any).eosDate || '') ? 'text-[#f59e0b]' : 'text-[#64748b]'} ${density === 'ultra-compact' ? 'text-[12px]' : ''}`}>
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
          <p className={`text-sm font-medium ${isDateExpiring((asset as any).eolDate || '') ? 'text-[#f59e0b]' : 'text-[#64748b]'} ${density === 'ultra-compact' ? 'text-[12px]' : ''}`}>
            {(asset as any).eolDate ? formatDate((asset as any).eolDate) : '—'}
          </p>
          {isDateExpiring((asset as any).eolDate || '') && (
            <p className={`${subText} text-[#f59e0b]`}>Expiring soon</p>
          )}
        </div>
      </td>

      {/* Cost */}
      <td className={`${cellPad}`}>
        <p className={`text-sm font-semibold text-[#1a1d2e] ${density === 'ultra-compact' ? 'text-[12px]' : ''}`}>{formatCurrency(asset.cost)}</p>
      </td>

      {/* Actions */}
      <td className={`${cellPad}`}>
        <div className={`flex items-center ${density === 'ultra-compact' ? 'gap-1.5' : 'gap-2'}`}>
          {canWrite && (
            <>
              {consentRequired && (
                <Button
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
                  } }
                  className={`rounded-lg text-[#2563eb] transition-all duration-200 group ${density === 'ultra-compact' ? 'p-1.5' : 'p-2'} hover:bg-[#2563eb]/10`}
                  title="Resend consent"
                >
                  <Mail className={`${density === 'ultra-compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} group-hover:scale-110 transition-transform`} />
                </Button>
              )}

              <Button
                onClick={() => toggleView(asset.id)}
                variant="outline"
                size="sm"
                className={`transition-all duration-200 group rounded-lg hover:bg-[#f3f4f6] text-[#475569] ${density === 'ultra-compact' ? 'p-1.5 border-0' : 'p-2'}`}
                title={expandedId === asset.id ? 'Hide details' : 'View details'}
              >
                <Eye className={`${density === 'ultra-compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} group-hover:scale-110 transition-transform`} />
              </Button>
              <Button
                onClick={() => handleEdit(asset.id)}
                variant="outline"
                size="sm"
                className={`transition-all duration-200 group rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] ${density === 'ultra-compact' ? 'p-1.5 border-0' : 'p-2'}`}
                title="Edit asset"
              >
                <Edit2 className={`${density === 'ultra-compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-[#44ef44] group-hover:scale-110 transition-transform`} />
              </Button>
              <Button
                data-test={`asset-delete-${asset.id}`}
                onClick={() => handleDelete(asset.id, asset.name)}
                variant="outline"
                size="sm"
                className={`transition-all duration-200 group ${density === 'ultra-compact' ? 'p-1.5 border-0' : 'p-2'}`}
                title="Delete asset"
              >
                <Trash2 className={`${density === 'ultra-compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-[#ef4444] group-hover:scale-110 transition-transform`} />
              </Button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
    {expandedId === asset.id && (
      <motion.tr key={`${asset.id}-details`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="">
        <td colSpan={consentRequired ? 10 : 9} className="px-6 py-6 border-t border-[rgba(0,0,0,0.04)] text-sm text-[#374151] bg-gradient-to-r from-[#eef2ff] via-[#f8fbff] to-white rounded-b-2xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const v = (val: any) => (val === null || val === undefined || val === '') ? '—' : String(val);
              const tryDate = (d: any) => d ? formatDate(String(d)) : '—';
              const specsRaw = (asset as any).specifications ?? (asset as any).specs ?? (asset as any).specs_json ?? null;
              let specs: Record<string, any> | null = null;
              try {
                if (typeof specsRaw === 'string') specs = JSON.parse(specsRaw);
                else if (typeof specsRaw === 'object') specs = specsRaw;
              } catch (e) { specs = null; }

              // CIA values
              const cia_c = Number((asset as any).ciaConfidentiality ?? (asset as any).cia_confidentiality ?? 0);
              const cia_i = Number((asset as any).ciaIntegrity ?? (asset as any).cia_integrity ?? 0);
              const cia_a = Number((asset as any).ciaAvailability ?? (asset as any).cia_availability ?? 0);
              const ciaTotal = cia_c + cia_i + cia_a;
              const ciaScore = ciaTotal ? (ciaTotal / 3) : 0;

              const nodes: JSX.Element[] = [];

              const push = (label: string, content: React.ReactNode) => nodes.push(
                <div key={label}>
                  <div className="text-xs text-[#64748b]">{label}</div>
                  <div className="font-medium text-[#1a1d2e]">{content}</div>
                </div>
              );

              push('ID', v(asset.id || (asset as any).id));
              push('Name', v(asset.name || (asset as any).name));
              push('Type', v(resolveTypeName(asset) || (asset as any).type || (asset as any).type_id || (asset as any).typeId));
              push('Serial Number', v((asset as any).serialNumber || (asset as any).serial_number));
              push('Assigned To', v((asset as any).assignedTo || (asset as any).assigned_to));
              push('Assigned Email', v((asset as any).assignedEmail || (asset as any).assigned_email));
              push('Consent Status', v((asset as any).consentStatus || (asset as any).consent_status));
              push('Department', v((asset as any).department || (asset as any).dept));
              push('Vendor', v((asset as any).vendor));
              push('Status', v(asset.status || (asset as any).status));
              push('Purchase Date', tryDate((asset as any).purchaseDate || (asset as any).purchase_date));
              push('End Of Support', tryDate((asset as any).eosDate || (asset as any).end_of_support_date || (asset as any).endOfSupportDate));
              push('End Of Life', tryDate((asset as any).eolDate || (asset as any).end_of_life_date || (asset as any).endOfLifeDate));
              push('Warranty Expiry', tryDate((asset as any).warrantyExpiry || (asset as any).warranty_expiry));
              push('Cost', v(formatCurrency(Number((asset as any).cost ?? (asset as any).price ?? 0))));
              push('Location', v((asset as any).location));

              // Specifications - render separate key/value rows when available
              if (specs && Object.keys(specs).length) {
                const specNodes = Object.entries(specs).map(([k, val]) => (
                  <div key={k} className="text-sm text-[#1a1d2e]"> <span className="text-xs text-[#64748b] mr-2">{k}:</span> {String(val)}</div>
                ));
                push('Specifications', <div className="flex flex-col gap-1">{specNodes}</div>);
              } else {
                push('Specifications', v((asset as any).specifications || '—'));
              }

              push('CIA - Confidentiality', v(cia_c));
              push('CIA - Integrity', v(cia_i));
              push('CIA - Availability', v(cia_a));
              push('CIA - Total', String(ciaTotal));
              push('CIA - Score (avg)', ciaScore ? ciaScore.toFixed(2) : '—');

              push('Created At', tryDate((asset as any).created_at || (asset as any).createdAt));
              push('Updated At', tryDate((asset as any).updated_at || (asset as any).updatedAt));

              return nodes;
            })()}
          </div>
        </td>
      </motion.tr>
    )}
  </Fragment>;
}

