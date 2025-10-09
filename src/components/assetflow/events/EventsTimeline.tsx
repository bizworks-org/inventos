import { motion } from 'motion/react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Package, 
  FileText, 
  Building2, 
  User,
  Clock
} from 'lucide-react';
import { SystemEvent } from '../../../lib/events';

interface EventsTimelineProps {
  events: SystemEvent[];
}

function getSeverityColor(severity: SystemEvent['severity']) {
  const colors = {
    'info': 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
    'warning': 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
    'error': 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
    'critical': 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20'
  };
  return colors[severity];
}

function getSeverityIcon(severity: SystemEvent['severity']) {
  const icons = {
    'info': <Info className="h-4 w-4" />,
    'warning': <AlertTriangle className="h-4 w-4" />,
    'error': <XCircle className="h-4 w-4" />,
    'critical': <AlertCircle className="h-4 w-4" />
  };
  return icons[severity];
}

function getEntityIcon(entityType: SystemEvent['entityType']) {
  const icons = {
    'asset': <Package className="h-4 w-4" />,
    'license': <FileText className="h-4 w-4" />,
    'vendor': <Building2 className="h-4 w-4" />,
    'user': <User className="h-4 w-4" />
  };
  return icons[entityType];
}

function getEntityColor(entityType: SystemEvent['entityType']) {
  const colors = {
    'asset': 'bg-[#6366f1]/10 text-[#6366f1]',
    'license': 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
    'vendor': 'bg-[#ec4899]/10 text-[#ec4899]',
    'user': 'bg-[#3b82f6]/10 text-[#3b82f6]'
  };
  return colors[entityType];
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // If less than 1 minute
  if (diffInMinutes < 1) {
    return 'Just now';
  }
  
  // If less than 1 hour
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  // If less than 24 hours
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  // If less than 7 days
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  // Otherwise, show the date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatFullTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function groupEventsByDate(events: SystemEvent[]): Map<string, SystemEvent[]> {
  const grouped = new Map<string, SystemEvent[]>();
  
  events.forEach(event => {
    const date = new Date(event.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  });
  
  return grouped;
}

export function EventsTimeline({ events }: EventsTimelineProps) {
  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-12 text-center shadow-sm"
      >
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-[#f8f9ff] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1a1d2e] mb-2">No events found</h3>
          <p className="text-[#64748b] mb-6">
            Try adjusting your filters or search query. Events will appear here as system activities occur.
          </p>
        </div>
      </motion.div>
    );
  }

  const groupedEvents = groupEventsByDate(events);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="space-y-6"
    >
      {Array.from(groupedEvents.entries()).map(([dateKey, dateEvents], groupIndex) => (
        <div key={dateKey} className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-[rgba(0,0,0,0.08)] flex-1" />
            <div className="flex items-center gap-2 px-3 py-1 bg-[#f8f9ff] rounded-full">
              <Clock className="h-3.5 w-3.5 text-[#64748b]" />
              <span className="text-sm font-semibold text-[#64748b]">{dateKey}</span>
            </div>
            <div className="h-px bg-[rgba(0,0,0,0.08)] flex-1" />
          </div>

          {/* Events for this date */}
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden shadow-sm">
            {dateEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + groupIndex * 0.1 + index * 0.05 }}
                className={`
                  p-6 flex gap-4 transition-all duration-200
                  ${index !== dateEvents.length - 1 ? 'border-b border-[rgba(0,0,0,0.05)]' : ''}
                  hover:bg-gradient-to-r hover:from-[#f8f9ff] hover:to-transparent
                `}
              >
                {/* Timeline dot */}
                <div className="flex-shrink-0 pt-1">
                  <div className={`
                    h-10 w-10 rounded-full flex items-center justify-center
                    ${getEntityColor(event.entityType)}
                  `}>
                    {getEntityIcon(event.entityType)}
                  </div>
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Severity Badge */}
                        <span className={`
                          inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border
                          ${getSeverityColor(event.severity)}
                        `}>
                          {getSeverityIcon(event.severity)}
                          {event.severity}
                        </span>

                        {/* Entity Type Badge */}
                        <span className={`
                          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                          ${getEntityColor(event.entityType)}
                        `}>
                          <span className="capitalize">{event.entityType}</span>
                        </span>
                      </div>

                      {/* Details */}
                      <p className="text-sm font-medium text-[#1a1d2e] mb-1">
                        {event.details}
                      </p>

                      {/* Action and User */}
                      <div className="flex items-center gap-3 text-xs text-[#64748b]">
                        <span className="font-mono bg-[#f8f9ff] px-2 py-0.5 rounded">
                          {event.action}
                        </span>
                        <span>by {event.user}</span>
                        <span>•</span>
                        <span className="font-mono">ID: {event.entityId}</span>
                      </div>

                      {/* Metadata */}
                      {Object.keys(event.metadata).length > 0 && (
                        <div className="mt-2 p-2 bg-[#f8f9ff] rounded-lg">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <span key={key} className="text-xs text-[#64748b]">
                                <span className="font-semibold">{key}:</span>{' '}
                                <span className="font-mono">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-medium text-[#64748b]">
                        {formatTimestamp(event.timestamp)}
                      </div>
                      <div className="text-xs text-[#94a3b8] mt-0.5">
                        {formatFullTimestamp(event.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
