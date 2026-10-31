import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

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
      const token = localStorage.getItem('rentora_token');
      let url = 'http://localhost:5000/api/audit-logs?limit=100';
      if (actionFilter !== 'ALL') {
        url += `&action=${actionFilter}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotalCount(data.pagination?.total || data.data.length);
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
        return { color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', label: 'Resource Lifecycle' };
      case 'BOOKING_REQUEST':
        return { color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', label: 'Reservation Request' };
      case 'BOOKING_APPROVAL':
        return { color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Approved & Signed' };
      case 'BOOKING_REJECTION':
      case 'BOOKING_CANCELLATION':
        return { color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', label: 'Rejected / Cancelled' };
      case 'CHECK_IN':
        return { color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', label: 'Check-In & Condition' };
      case 'CHECK_OUT':
        return { color: 'bg-teal-500/15 text-teal-300 border-teal-500/30', label: 'Check-Out & Handover' };
      case 'CONDITION_REPORT':
        return { color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'Condition Report' };
      case 'INCIDENT_REPORT':
      case 'INCIDENT_RESOLUTION':
        return { color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', label: 'Incident Tribunal' };
      case 'MANAGER_OVERRIDE':
      case 'MANAGER_DECISION':
        return { color: 'bg-amber-500/25 text-amber-200 border-amber-500/40', label: 'Manager Directive' };
      case 'WAITLIST_ENQUEUE':
      case 'WAITLIST_PROMOTION':
        return { color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', label: 'Fairness Queue' };
      default:
        return { color: 'bg-slate-800 text-slate-300 border-slate-700', label: action };
    }
  };

  return (
    <div className="space-y-5">
      {/* Immutability Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              Immutable WORM Ledger • Non-Repudiable
            </div>
            <h2 className="text-xl font-extrabold text-white">Centralized Institutional Audit Trail</h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Every resource creation, reservation, condition inspection, incident, and manager override is permanently
              committed to this ledger. In compliance with institutional policies, records cannot be altered or deleted.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
              {totalCount} Total Ledger Entries
            </span>
            <button
              onClick={fetchAuditLogs}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor, asset name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
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
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
          <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">No audit records found matching criteria.</p>
          <p className="text-[11px] text-slate-500">All institutional actions are indexed in real time.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/70 shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Entity / Asset</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Mandatory Justification / Notes</th>
                <th className="py-3.5 px-4 text-right">Immutability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500">{badge.label}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white max-w-xs truncate">
                        {log.entityTitle || log.entityType}
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        {log.entityType} • #{log.entityId ? log.entityId.slice(-6) : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{log.actorName}</div>
                      <span className="text-[10px] text-brand-400 uppercase font-bold tracking-wider">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                        {log.reason || 'Standard system verified workflow transition.'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <Lock className="w-3 h-3" /> WORM
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
