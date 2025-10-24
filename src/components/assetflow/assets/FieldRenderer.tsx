"use client";
import React from 'react';
import { AssetFieldDef, AssetFieldType } from '../../../lib/data';

type Props = {
  def: AssetFieldDef;
  value: string;
  onChange: (v: string) => void;
};

export default function FieldRenderer({ def, value, onChange }: Props) {
  const val = value ?? '';

  if (def.type === 'textarea') {
    return <textarea required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ''} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
  }

  if (def.type === 'number' || def.type === 'currency') {
    return <input type="number" step={def.type === 'currency' ? '0.01' : '1'} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
  }

  if (def.type === 'date' || def.type === 'datetime') {
    return <input type={def.type === 'date' ? 'date' : 'datetime-local'} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
  }

  if (def.type === 'phone' || def.type === 'email' || def.type === 'url') {
    const t = def.type === 'phone' ? 'tel' : def.type === 'email' ? 'email' : 'url';
    return <input type={t} required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ''} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
  }

  if (def.type === 'select') {
    return (
      <select required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]">
        <option value="">-- select --</option>
        {(def.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }

  if (def.type === 'multiselect') {
    const selected = (typeof val === 'string' && val.length) ? val.split(',').map(s => s.trim()) : [];
    return (
      <select multiple value={selected} onChange={(e) => {
        const opts = Array.from(e.target.selectedOptions).map(o => o.value);
        onChange(opts.join(', '));
      }} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]">
        {(def.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }

  if (def.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={val === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} />
        <span className="text-sm">{def.placeholder || ''}</span>
      </div>
    );
  }

  if (def.type === 'star') {
    return (
      <select value={val || '0'} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]">
        <option value="0">No rating</option>
        {[1,2,3,4,5].map(n => <option key={n} value={String(n)}>{'★'.repeat(n)}</option>)}
      </select>
    );
  }

  if (def.type === 'cia_rating') {
    // value stored as JSON string {c: number, i: number, a: number}
    let obj = { c: 0, i: 0, a: 0 };
    try { if (val) obj = JSON.parse(val); } catch { }

    const partKeys: { key: 'c' | 'i' | 'a'; label: string }[] = [
      { key: 'c', label: 'Confidentiality' },
      { key: 'i', label: 'Integrity' },
      { key: 'a', label: 'Availability' },
    ];

    const renderRow = (k: 'c' | 'i' | 'a') => {
      const current = k === 'c' ? obj.c : k === 'i' ? obj.i : obj.a;
      return (
        <div className="flex flex-col items-center" role="group" aria-label={k}>
          <div className="flex gap-1">
            {[1,2,3,4,5].map((n) => (
              <button key={n} type="button" onClick={() => {
                const next = { ...obj, [k]: n };
                onChange(JSON.stringify(next));
              }} aria-pressed={current === n} className={`w-6 h-6 rounded-full border ${current >= n ? 'bg-[#111827] text-white' : 'bg-white'}`}>
                <span className="sr-only">{String(n)}</span>
              </button>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-3 gap-3">
        {partKeys.map((p) => (
          <div key={p.key} className="flex flex-col items-start">
            <label className="text-xs font-medium text-[#1a1d2e] mb-1">{p.label}</label>
            {renderRow(p.key)}
          </div>
        ))}
      </div>
    );
  }

  // default: text
  return <input type="text" required={!!def.required} value={val} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ''} className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" />;
}
