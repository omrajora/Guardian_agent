'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Lock,
  Radio,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<any>({
    totalActions: 0,
    allowedCount: 0,
    blockedCount: 0,
    approvalRequiredCount: 0,
    pendingApprovals: 0,
    piiIncidents: 0,
    secretsBlocked: 0,
  });

  const [riskDistribution, setRiskDistribution] = useState<any>({
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  });

  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [selectedAction, setSelectedAction] = useState<any | null>(null);

  const loadData = async () => {
    try {
      // Set dummy token for dashboard demo access if needed
      if (!localStorage.getItem('guardian_token')) {
        const authRes = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@guardian.io', password: 'GuardianAdmin123!' }),
        }).then((r) => r.json()).catch(() => null);

        if (authRes?.token) {
          localStorage.setItem('guardian_token', authRes.token);
        }
      }

      const overview = await api.getOverview();
      if (overview) {
        setMetrics(overview.metrics || {});
        setRiskDistribution(overview.riskDistribution || {});
        setRecentActions(overview.recentActions || []);
      }
    } catch (err) {
      console.warn('Backend not yet reachable on port 5000, using demo initial values:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);

    // Socket.IO realtime listener
    const socket = getSocket();
    socket.on('audit:event', (eventData: any) => {
      setLiveFeed((prev) => [eventData, ...prev.slice(0, 19)]);
      loadData();
    });

    return () => {
      clearInterval(interval);
      socket.off('audit:event');
    };
  }, []);

  const totalCalculated =
    (riskDistribution.LOW || 0) +
    (riskDistribution.MEDIUM || 0) +
    (riskDistribution.HIGH || 0) +
    (riskDistribution.CRITICAL || 0) || 1;

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'ALLOW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ALLOW</span>;
      case 'BLOCK':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">BLOCK</span>;
      case 'APPROVAL_REQUIRED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">APPROVAL REQ</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">{decision}</span>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Security Gateway Operations
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </h2>
          <p className="text-sm text-slate-400">
            Realtime agent activity interception, policy evaluation & risk scoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-3.5 py-2 text-xs font-medium bg-surface-elevated hover:bg-surface-border text-slate-200 rounded-lg border border-surface-border transition flex items-center gap-2"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Sync Telemetry
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-xl border border-surface-border relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-medium tracking-wider text-slate-400">Total Evaluations</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">{metrics.totalActions || 0}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-400 mt-3 font-medium flex items-center gap-1">
            <span>{metrics.allowedCount || 0} permitted safely</span>
          </p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-surface-border relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-medium tracking-wider text-slate-400">Threats Hard-Blocked</p>
              <h3 className="text-3xl font-extrabold text-rose-400 mt-2">{metrics.blockedCount || 0}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-rose-400/80 mt-3 font-medium">
            Zero bypasses allowed
          </p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-surface-border relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-medium tracking-wider text-slate-400">Pending Approvals</p>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-2">{metrics.pendingApprovals || 0}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Awaiting human sign-off
          </p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-surface-border relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-medium tracking-wider text-slate-400">Data & Secret Violations</p>
              <h3 className="text-3xl font-extrabold text-purple-400 mt-2">
                {(metrics.piiIncidents || 0) + (metrics.secretsBlocked || 0)}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            PII masked & secrets denied
          </p>
        </div>
      </div>

      {/* Risk Distribution Banner */}
      <div className="glass-panel p-6 rounded-xl border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-200">Action Risk Classification Distribution</h4>
          <span className="text-xs text-slate-400 font-mono">Multiclass Model + Policy Signal</span>
        </div>

        <div className="h-4 w-full bg-slate-900 rounded-full flex overflow-hidden border border-slate-800">
          <div
            style={{ width: `${((riskDistribution.LOW || 0) / totalCalculated) * 100}%` }}
            className="bg-emerald-500 h-full transition-all"
            title={`LOW: ${riskDistribution.LOW || 0}`}
          />
          <div
            style={{ width: `${((riskDistribution.MEDIUM || 0) / totalCalculated) * 100}%` }}
            className="bg-amber-500 h-full transition-all"
            title={`MEDIUM: ${riskDistribution.MEDIUM || 0}`}
          />
          <div
            style={{ width: `${((riskDistribution.HIGH || 0) / totalCalculated) * 100}%` }}
            className="bg-orange-500 h-full transition-all"
            title={`HIGH: ${riskDistribution.HIGH || 0}`}
          />
          <div
            style={{ width: `${((riskDistribution.CRITICAL || 0) / totalCalculated) * 100}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`CRITICAL: ${riskDistribution.CRITICAL || 0}`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>LOW ({riskDistribution.LOW || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>MEDIUM ({riskDistribution.MEDIUM || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>HIGH ({riskDistribution.HIGH || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>CRITICAL ({riskDistribution.CRITICAL || 0})</span>
          </div>
        </div>
      </div>

      {/* Grid: Realtime Telemetry Feed & Recent Action Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Realtime Socket.IO Stream */}
        <div className="glass-panel p-5 rounded-xl border border-surface-border flex flex-col h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <h4 className="text-sm font-semibold text-slate-200">Live Incident Stream</h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">Socket.IO</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1">
            {liveFeed.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse text-indigo-400" />
                Listening for live agent events...
              </div>
            ) : (
              liveFeed.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-surface-elevated/80 border border-surface-border text-xs space-y-1 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-indigo-400 font-semibold">{item.actionId?.substring(0, 14)}...</span>
                    {getDecisionBadge(item.decision)}
                  </div>
                  <p className="text-slate-300 font-medium truncate">{item.reason}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Actor: {item.actor?.id || 'agent'}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Actions Table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-surface-border flex flex-col h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h4 className="text-sm font-semibold text-slate-200">Recent Intercepted Action Requests</h4>
            <span className="text-xs text-slate-400">Gateway Audit Pipeline</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3">
            {recentActions.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                No recent actions recorded yet. Run the attack simulator or trigger a test agent call.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-surface-border">
                    <th className="pb-2 font-medium">Action ID</th>
                    <th className="pb-2 font-medium">Agent</th>
                    <th className="pb-2 font-medium">Tool</th>
                    <th className="pb-2 font-medium">Decision</th>
                    <th className="pb-2 font-medium">Risk</th>
                    <th className="pb-2 font-medium text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {recentActions.map((action, i) => (
                    <tr key={i} className="hover:bg-surface-elevated/40 transition">
                      <td className="py-2.5 font-mono text-slate-300">{action.actionId.substring(0, 12)}...</td>
                      <td className="py-2.5 text-slate-300 font-medium">{action.agentId}</td>
                      <td className="py-2.5 text-slate-400 font-mono">{action.toolId}</td>
                      <td className="py-2.5">{getDecisionBadge(action.decision)}</td>
                      <td className="py-2.5">
                        <span
                          className={`font-semibold ${
                            action.finalRiskLevel === 'CRITICAL'
                              ? 'text-rose-400'
                              : action.finalRiskLevel === 'HIGH'
                              ? 'text-orange-400'
                              : action.finalRiskLevel === 'MEDIUM'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {action.finalRiskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => setSelectedAction(action)}
                          className="text-indigo-400 hover:text-indigo-300 p-1"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Action Detail Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-surface-border p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <div>
                <h3 className="font-bold text-lg text-white">Action Inspection Trace</h3>
                <p className="text-xs font-mono text-slate-400">{selectedAction.actionId}</p>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-elevated rounded-lg">
                  <p className="text-slate-400">Agent ID</p>
                  <p className="font-semibold text-slate-200 mt-1">{selectedAction.agentId}</p>
                </div>
                <div className="p-3 bg-surface-elevated rounded-lg">
                  <p className="text-slate-400">Tool / Action</p>
                  <p className="font-semibold text-slate-200 mt-1">
                    {selectedAction.toolId} ({selectedAction.action})
                  </p>
                </div>
              </div>

              <div className="p-3 bg-surface-elevated rounded-lg">
                <p className="text-slate-400">Decision & Rationale</p>
                <div className="flex items-center gap-2 mt-1">
                  {getDecisionBadge(selectedAction.decision)}
                  <span className="text-slate-200">{selectedAction.decisionReason || 'Evaluated by security policy'}</span>
                </div>
              </div>

              <div className="p-3 bg-surface-elevated rounded-lg">
                <p className="text-slate-400">Findings & Detections</p>
                <div className="mt-1 space-y-1">
                  <p className="text-slate-300">
                    PII Detected: {selectedAction.findings?.piiDetected ? '⚠️ YES' : 'None'}
                  </p>
                  <p className="text-slate-300">
                    Secrets Detected: {selectedAction.findings?.secretsDetected ? '🚨 YES (BLOCKED)' : 'None'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
