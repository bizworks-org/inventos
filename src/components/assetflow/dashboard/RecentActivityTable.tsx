import { motion } from 'motion/react';
import { Activity } from '../../../lib/data';
import { useEffect, useState } from 'react';
import { fetchActivities } from '../../../lib/api';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getSeverityIcon(severity: Activity['severity']) {
  switch (severity) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-[#10b981]" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-[#ef4444]" />;
    default:
      return <Info className="h-4 w-4 text-[#3b82f6]" />;
  }
}

function getSeverityBadge(severity: Activity['severity']) {
  const styles = {
    success: 'bg-[#10b981]/10 text-[#10b981]',
    warning: 'bg-[#f59e0b]/10 text-[#f59e0b]',
    error: 'bg-[#ef4444]/10 text-[#ef4444]',
    info: 'bg-[#3b82f6]/10 text-[#3b82f6]'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[severity]}`}>
      {getSeverityIcon(severity)}
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

export function RecentActivityTable() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchActivities(5)
      .then(rows => { if (!cancelled) { setActivities(rows); setError(null); } })
      .catch(e => { if (!cancelled) setError(e?.message || 'Failed to load activity'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-2xl bg-white border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#1a1d2e]">Recent Activity</h3>
        <p className="text-sm text-[#64748b] mt-1">Latest system events and changes</p>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-[#f8f9ff] to-transparent hover:from-[#f0f4ff] transition-all duration-200 border border-transparent hover:border-[#e0e7ff]"
          >
            <div className="mt-1">
              {getSeverityIcon(activity.severity)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-[#1a1d2e]">{activity.action}</p>
                <span className="text-xs text-[#94a3b8]">•</span>
                <span className="text-xs text-[#94a3b8]">{activity.entity}</span>
              </div>
              <p className="text-sm text-[#64748b]">{activity.details}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-[#94a3b8]">{activity.user}</span>
                <span className="text-xs text-[#94a3b8]">•</span>
                <span className="text-xs text-[#94a3b8]">{formatTimestamp(activity.timestamp)}</span>
              </div>
            </div>

            {getSeverityBadge(activity.severity)}
          </motion.div>
        ))}
        {activities.length === 0 && !error && (
          <p className="text-sm text-[#64748b]">No recent activity.</p>
        )}
        {error && (
          <p className="text-sm text-[#ef4444]">{error}</p>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
        <a 
          href="/assetflow/events" 
          className="text-sm font-semibold text-[#6366f1] hover:text-[#8b5cf6] transition-colors"
        >
          View all events →
        </a>
      </div>
    </motion.div>
  );
}
