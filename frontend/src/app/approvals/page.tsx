'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionReason, setActionReason] = useState<{ [key: string]: string }>({});
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const data = await api.getPendingApprovals();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const reason = actionReason[id] || 'Approved by security reviewer';
      await api.approveAction(id, reason);
      setActionMsg(`Request ${id} approved successfully!`);
      fetchApprovals();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const reason = actionReason[id] || 'Rejected due to risk policy violation';
      await api.rejectAction(id, reason);
      setActionMsg(`Request ${id} rejected.`);
      fetchApprovals();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Human-in-the-Loop Approval Queue
          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-normal">
            {approvals.length} pending
          </span>
        </h2>
        <p className="text-sm text-slate-400">
          Authorize or deny escalated sensitive AI agent actions before execution
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-lg text-xs text-indigo-300">
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading pending approvals...</div>
      ) : approvals.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center border border-surface-border space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
          <h4 className="text-base font-semibold text-slate-200">Approval Queue is Clear</h4>
          <p className="text-xs text-slate-400">
            No agent actions currently require human intervention.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((req) => (
            <div
              key={req._id}
              className="glass-panel p-6 rounded-xl border border-surface-border space-y-4 hover:border-slate-600 transition"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-indigo-400">{req.actionId}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {req.riskLevel} RISK
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Agent: <strong className="text-slate-200">{req.agentId}</strong> • Tool:{' '}
                    <strong className="text-slate-200">{req.toolId}</strong>
                  </p>
                </div>

                <div className="text-right text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expires: {new Date(req.expiresAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="p-3 bg-surface-elevated/80 rounded-lg border border-surface-border text-xs">
                <p className="text-slate-300 font-medium">{req.reason}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Reviewer decision rationale..."
                  value={actionReason[req._id] || ''}
                  onChange={(e) => setActionReason({ ...actionReason, [req._id]: e.target.value })}
                  className="w-full sm:flex-1 bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleReject(req._id)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject Action
                  </button>
                  <button
                    onClick={() => handleApprove(req._id)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Authorize & Execute
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
