"use client";
import React, { useEffect, useState } from 'react';
import { AssetFieldDef, AssetFieldType } from '../../../lib/data';

type Props = {
  def: AssetFieldDef;
  value: string;
  id?: string;
  onChange: (v: string) => void;
};
export default function FieldRenderer({ def, value, onChange, id }: Props) {
export default function FieldRenderer({ def, value, onChange }: Props) {
  const val = value ?? '';
  // console.log('def.type', def.type, def, value);
    return <textarea id={id} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ''} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
    return <textarea required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ''} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
  }

    return <input id={id} type="number" step={def.type === 'currency' ? '0.01' : '1'} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
    return <input type="number" step={def.type === 'currency' ? '0.01' : '1'} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
  }

    return <input id={id} type={def.type === 'date' ? 'date' : 'datetime-local'} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
    return <input type={def.type === 'date' ? 'date' : 'datetime-local'} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
  }

  if (def.type === 'phone' || def.type === 'email' || def.type === 'url') {
    return <input id={id} type={t} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ''} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
    return <input type={t} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ''} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
  }

  if (def.type === 'select') {
      <select id={id} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]">
      <select required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]">
        <option value="">-- select --</option>
        {(def.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }

  if (def.type === 'multiselect') {
    const selected = (typeof val === 'string' && val.length) ? val.split(',').map(s => s.trim()) : [];
      <select id={id} multiple value={selected} onChange={(e) => {
        const opts = Array.from(e.target.selectedOptions).map(o => o.value);
        onChange(opts.join(', '));
      }} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]">
      }} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]">
        {(def.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }

  if (def.type === 'boolean') {
    return (
        <input id={id} type="checkbox" checked={val === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} />
        <input type="checkbox" checked={val === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} />
        <span className="text-sm">{def.placeholder || ''}</span>
      </div>
    );
  }


  // Support both legacy 'cia_rating' type (old data) and the current 'star' type here.
  const t = def.type as string;
  if (def.type === 'star') {
    // Render star rating as a dropdown driven by def.max (0 = No rating)
    const [internal, setInternal] = useState<number>(Number(val || '0'));

    useEffect(() => {
      setInternal(Number(val || '0'));
    }, [val]);

    const max = Math.max(1, Math.min(10, (def.max ?? 5)));
    const current = Number(val || '0');
    const displayMax = Math.max(max, current || 0);
    
    return (
      <div role="group" aria-label={def.label || 'Star rating'} className="flex flex-col">
        <select
          value={String(internal)}
          onChange={(e) => {
            const n = Number(e.target.value || '0');
            setInternal(n);
            onChange(String(n));
          }}
          className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
        >
          <option value="0">No rating</option>
          {Array.from({ length: displayMax }, (_, i) => i + 1).map((n) => (
            <option key={n} value={String(n)}>{'★'.repeat(n)}</option>
          ))}
        </select>
        <div className="text-xs text-[rgba(0,0,0,0.5)] mt-1">0 = No rating</div>
      </div>
    );
  }

  return <input id={id} type="text" required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ''} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
  return <input type="text" required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ''} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
}
