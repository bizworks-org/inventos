import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  gradient: string;
  delay?: number;
}

export function StatCard({ title, value, icon: Icon, trend, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-2xl bg-white border border-[rgba(0,0,0,0.08)] p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Background gradient overlay */}
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 ${gradient} rounded-full blur-3xl`}></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#64748b] mb-2">{title}</p>
          <p className="text-3xl font-bold text-[#1a1d2e]">{value}</p>
          
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span className={`text-xs font-semibold ${trend.isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-[#94a3b8]">vs last month</span>
            </div>
          )}
        </div>

        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
