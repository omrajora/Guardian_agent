'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Search, Shield, Filter } from 'lucide-react';
import { api } from '@/lib/api';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDecision, setFilterDecision] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.getAuditLogs(filterDecision ? { decision: filterDecision } : {});
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterDecision]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Immutable Audit Trail & Traces
          </h2>
          <p className="text-sm text-slate-400">
            Sanitized, tamper-evident security records of all agent evaluations and tool runs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Decisions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="BLOCK">BLOCK</option>
            <option value="APPROVAL_REQUIRED">APPROVAL_REQUIRED</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-xl border border-surface-border text-xs text-slate-400">
          No audit records found for the selected filter.
        </div>
      ) : (
        <div className="glass-panel rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-surface-border bg-surface-elevated/50">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action ID</th>
                <th className="py-3 px-4 font-semibold">Event Type</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold">Decision</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-surface-elevated/40 transition">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-indigo-400">{log.actionId.substring(0, 16)}...</td>
                  <td className="py-3 px-4 font-medium text-slate-300">{log.eventType}</td>
                  <td className="py-3 px-4 text-slate-400">{log.actor?.id || 'agent'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.decision === 'BLOCK'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : log.decision === 'APPROVAL_REQUIRED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {log.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-md truncate">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
