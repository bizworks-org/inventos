'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Search, Filter, RefreshCw, Activity } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { eventBus, SystemEvent, EventSeverity, EntityType } from '../../../lib/events';
import { EventsTimeline } from './EventsTimeline';

interface EventsPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export type TimeFilter = 'all' | 'today' | 'week' | 'month';

export function EventsPage({ onNavigate, onSearch }: EventsPageProps) {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<EventSeverity | 'all'>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load events and subscribe to new ones
  useEffect(() => {
    loadEvents();

    const unsubscribe = eventBus.subscribe((newEvent) => {
      loadEvents();
    });

    return () => unsubscribe();
  }, []);

  const loadEvents = () => {
    const allEvents = eventBus.getEvents();
    setEvents(allEvents);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadEvents();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    // Entity type filter
    const matchesEntityType = selectedEntityType === 'all' || event.entityType === selectedEntityType;
    
    // Severity filter
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    
    // Time filter
    let matchesTime = true;
    if (selectedTimeFilter !== 'all') {
      const eventDate = new Date(event.timestamp);
      const now = new Date();
      
      if (selectedTimeFilter === 'today') {
        matchesTime = eventDate.toDateString() === now.toDateString();
      } else if (selectedTimeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesTime = eventDate >= weekAgo;
      } else if (selectedTimeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesTime = eventDate >= monthAgo;
      }
    }
    
    // Search filter
    const matchesSearch = searchQuery === '' || 
      event.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesEntityType && matchesSeverity && matchesTime && matchesSearch;
  });

  // Count by severity
  const countBySeverity = (severity: EventSeverity) => {
    return events.filter(e => e.severity === severity).length;
  };

  // Count by entity type
  const countByEntityType = (entityType: EntityType) => {
    return events.filter(e => e.entityType === entityType).length;
  };

  const entityTypes: (EntityType | 'all')[] = ['all', 'asset', 'license', 'vendor', 'user'];
  const severityLevels: (EventSeverity | 'all')[] = ['all', 'info', 'warning', 'error', 'critical'];
  const timeFilters: { value: TimeFilter; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'Events Log' }
      ]}
      currentPage="events"
      onNavigate={onNavigate}
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">System Events</h1>
          <p className="text-[#64748b]">Monitor all system activities and changes in real-time</p>
        </div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex gap-3"
        >
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200">
            <Download className="h-4 w-4" />
            Export Log
          </button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Total Events</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1d2e]">{events.length}</p>
          <p className="text-xs text-[#94a3b8] mt-1">All time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Critical</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#ef4444] to-[#dc2626] flex items-center justify-center">
              <span className="text-white font-bold text-xs">!</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#ef4444]">{countBySeverity('critical')}</p>
          <p className="text-xs text-[#94a3b8] mt-1">Requires attention</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Warnings</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#f97316] flex items-center justify-center">
              <span className="text-white font-bold text-xs">⚠</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#f59e0b]">{countBySeverity('warning')}</p>
          <p className="text-xs text-[#94a3b8] mt-1">Need review</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Info</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#14b8a6] flex items-center justify-center">
              <span className="text-white font-bold text-xs">✓</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#10b981]">{countBySeverity('info')}</p>
          <p className="text-xs text-[#94a3b8] mt-1">Normal operations</p>
        </motion.div>
      </div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 mb-6 shadow-sm"
      >
        {/* Entity Type Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {entityTypes.map((type, index) => {
            const count = type === 'all' ? events.length : countByEntityType(type as EntityType);
            return (
              <motion.button
                key={type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
                onClick={() => setSelectedEntityType(type)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200
                  ${selectedEntityType === type
                    ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md'
                    : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#e0e7ff] hover:text-[#6366f1]'
                  }
                `}
              >
                <span className="font-medium capitalize">{type}</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${selectedEntityType === type
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-[#64748b]'
                  }
                `}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a4b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by details, user, or action..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] placeholder:text-[#a0a4b8]
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200
              "
            />
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as EventSeverity | 'all')}
              className="
                pl-4 pr-8 py-2.5 rounded-lg appearance-none
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] font-medium
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200 cursor-pointer min-w-[150px]
              "
            >
              <option value="all">All Severity</option>
              <option value="info">ℹ Info</option>
              <option value="warning">⚠ Warning</option>
              <option value="error">✕ Error</option>
              <option value="critical">! Critical</option>
            </select>
          </div>

          {/* Time Filter */}
          <div className="relative">
            <select
              value={selectedTimeFilter}
              onChange={(e) => setSelectedTimeFilter(e.target.value as TimeFilter)}
              className="
                pl-4 pr-8 py-2.5 rounded-lg appearance-none
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] font-medium
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200 cursor-pointer min-w-[140px]
              "
            >
              {timeFilters.map(filter => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)]">
          <p className="text-sm text-[#64748b]">
            Showing <span className="font-semibold text-[#1a1d2e]">{filteredEvents.length}</span> of{' '}
            <span className="font-semibold text-[#1a1d2e]">{events.length}</span> events
          </p>
        </div>
      </motion.div>

      {/* Events Timeline */}
      <EventsTimeline events={filteredEvents} />
    </AssetFlowLayout>
  );
}
