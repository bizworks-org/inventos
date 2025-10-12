import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { fetchAssets } from '../../../lib/api';
import type { Asset } from '../../../lib/data';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export function AssetOverviewChart() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAssets()
      .then(rows => { if (!cancelled) { setAssets(rows); setError(null); } })
      .catch(e => { if (!cancelled) setError(e?.message || 'Failed to load assets'); });
    return () => { cancelled = true; };
  }, []);

  const data = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach(a => {
      map.set(a.type, (map.get(a.type) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [assets]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl bg-white border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#1a1d2e]">Asset Distribution by Category</h3>
        <p className="text-sm text-[#64748b] mt-1">Overview of IT assets across different types</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1a1d2e',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              color: '#fff'
            }}
            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
          />
          <Bar 
            dataKey="count" 
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></div>
            <span className="text-sm text-[#64748b]">{item.name}: <span className="font-semibold text-[#1a1d2e]">{item.count}</span></span>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-[#ef4444] mt-2">{error}</p>}
    </motion.div>
  );
}
