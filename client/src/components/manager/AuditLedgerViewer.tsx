import React, { useState, useEffect } from 'react';
import {
  Lock,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import apiClient from '../../api/client';

interface AuditLogEntry {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityTitle?: string;
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  reason?: string;
  timestamp: string;
  isImmutable: boolean;
}

export const AuditLedgerViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [totalCount, setTotalCount] = useState(0);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/audit-logs', {
        params: {
          limit: 100,
          action: actionFilter !== 'ALL' ? actionFilter : undefined,
        },
      });
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalCount(res.data.pagination?.total || res.data.data.length);
      }
    } catch (err) {
      console.error('Error loading audit ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      (log.entityTitle && log.entityTitle.toLowerCase().includes(q)) ||
      (log.reason && log.reason.toLowerCase().includes(q))
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'RESOURCE_CREATION':
      case 'RESOURCE_UPDATE':
        return { color: 'bg-[#EFF6FF] text-[#1769D2] border-[#1769D2]/20', label: 'Resource Lifecycle' };
      case 'BOOKING_REQUEST':
        return { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Reservation Request' };
      case 'BOOKING_APPROVAL':
        return { color: 'bg-emerald-50 text-[#16834A] border-emerald-200', label: 'Approved & Signed' };
      case 'BOOKING_REJECTION':
      case 'BOOKING_CANCELLATION':
        return { color: 'bg-red-50 text-[#DC2626] border-red-200', label: 'Rejected / Cancelled' };
      case 'CHECK_IN':
        return { color: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Check-In & Condition' };
      case 'CHECK_OUT':
        return { color: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Check-Out & Handover' };
      case 'CONDITION_REPORT':
        return { color: 'bg-amber-50 text-[#D97706] border-amber-200', label: 'Condition Report' };
      case 'INCIDENT_REPORT':
      case 'INCIDENT_RESOLUTION':
        return { color: 'bg-rose-50 text-[#DC2626] border-rose-200', label: 'Incident Ticket' };
      case 'MANAGER_OVERRIDE':
      case 'MANAGER_DECISION':
        return { color: 'bg-amber-50 text-[#D97706] border-amber-200', label: 'Manager Directive' };
      case 'WAITLIST_ENQUEUE':
      case 'WAITLIST_PROMOTION':
        return { color: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Fairness Queue' };
      default:
        return { color: 'bg-slate-100 text-[#172033] border-slate-200', label: action };
    }
  };

  return (
    <div className="space-y-5">
      {/* Immutability Banner */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#16834A] border border-emerald-200 text-[11px] font-semibold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              Immutable WORM Ledger • Non-Repudiable
            </div>
            <h2 className="text-xl font-bold text-[#172033]">Centralized Institutional Audit Trail</h2>
            <p className="text-xs text-[#64748B] max-w-2xl">
              Every resource creation, reservation, condition inspection, incident, and manager override is permanently
              committed to this ledger. Records cannot be altered or deleted.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#172033] font-mono">
              {totalCount} Total Entries
            </span>
            <button
              onClick={fetchAuditLogs}
              className="p-2 rounded-lg bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#172033] border border-[#E2E8F0] transition-all"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor, asset name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
          >
            <option value="ALL">All Audit Actions</option>
            <option value="RESOURCE_CREATION">Resource Creation</option>
            <option value="BOOKING_REQUEST">Booking Requests</option>
            <option value="BOOKING_APPROVAL">Approvals</option>
            <option value="BOOKING_REJECTION">Rejections</option>
            <option value="BOOKING_CANCELLATION">Cancellations</option>
            <option value="CHECK_IN">Check-Ins</option>
            <option value="CHECK_OUT">Check-Outs</option>
            <option value="INCIDENT_REPORT">Incident Reports</option>
            <option value="INCIDENT_RESOLUTION">Incident Resolutions</option>
            <option value="MANAGER_OVERRIDE">Manager Overrides</option>
            <option value="MANAGER_DECISION">Manager Decisions</option>
            <option value="WAITLIST_ENQUEUE">Waitlist Enqueues</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner message="Querying immutable ledger..." size="md" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#64748B] space-y-2">
          <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-[#172033]">No audit records found matching criteria.</p>
          <p className="text-[11px] text-[#64748B]">All institutional actions are indexed in real time.</p>
        </div>
      ) : (
        <>
          {/* Mobile Stacked Card View (Screens < 768px: Prevents horizontal overflow) */}
          <div className="block md:hidden space-y-3">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action);
              return (
                <div
                  key={log._id}
                  className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="block text-[10px] text-[#64748B] font-mono">
                        {log.action}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#16834A] border border-emerald-200 shrink-0">
                      <Lock className="w-3 h-3" /> WORM
                    </span>
                  </div>

                  <div className="pt-1 border-t border-[#F1F5F9]">
                    <div className="font-semibold text-[#172033] text-sm">
                      {log.entityTitle || log.entityType}
                    </div>
                    <span className="text-[10px] text-[#64748B] uppercase font-mono">
                      {log.entityType} • #{log.entityId ? log.entityId.slice(-6) : 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-1.5 px-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px]">
                    <div>
                      <span className="text-[#64748B] text-[10px] block uppercase font-medium">Actor</span>
                      <span className="font-semibold text-[#172033]">{log.actorName}</span>
                      <span className="block text-[10px] text-[#1769D2] font-semibold uppercase">{log.actorRole}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] block uppercase font-medium">Timestamp</span>
                      <span className="font-mono text-[#64748B] text-[10px]">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {log.reason && (
                    <div className="text-[11px] text-[#172033] bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">Justification</span>
                      <p className="mt-0.5 text-[#172033] leading-relaxed">{log.reason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Screens >= 768px: Preserves standard tabular format) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Entity / Asset</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Mandatory Justification / Notes</th>
                  <th className="py-3 px-4 text-right">Immutability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] text-[#64748B]">{badge.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#172033] max-w-xs truncate">
                          {log.entityTitle || log.entityType}
                        </div>
                        <span className="text-[10px] text-[#64748B] uppercase font-mono">
                          {log.entityType} • #{log.entityId ? log.entityId.slice(-6) : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#172033]">{log.actorName}</div>
                        <span className="text-[10px] text-[#1769D2] uppercase font-semibold">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <p className="text-[#172033] text-[11px] leading-relaxed line-clamp-2">
                          {log.reason || 'Standard system verified workflow transition.'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#16834A] border border-emerald-200">
                          <Lock className="w-3 h-3" /> WORM
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
