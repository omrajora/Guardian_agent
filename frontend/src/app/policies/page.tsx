'use client';

import React, { useEffect, useState } from 'react';
import { Sliders, Shield, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { api } from '@/lib/api';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = async () => {
    try {
      const data = await api.getPolicies();
      setPolicies(data.policies || []);
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Deterministic Security Policies
          </h2>
          <p className="text-sm text-slate-400">
            Rules evaluated in strict priority order before ML or tool execution
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading policies...</div>
      ) : (
        <div className="glass-panel rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-surface-border bg-surface-elevated/50">
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Policy Name & ID</th>
                <th className="py-3 px-4 font-semibold">Conditions</th>
                <th className="py-3 px-4 font-semibold">Enforced Decision</th>
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Hard Deny</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {policies.map((pol) => (
                <tr key={pol._id} className="hover:bg-surface-elevated/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-400">#{pol.priority}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-200">{pol.name}</p>
                    <p className="font-mono text-[11px] text-slate-500">{pol.policyId}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                    {pol.conditions.actionTypes?.length ? `Actions: [${pol.conditions.actionTypes.join(', ')}] ` : ''}
                    {pol.conditions.toolIds?.length ? `Tools: [${pol.conditions.toolIds.join(', ')}] ` : ''}
                    {pol.conditions.volumeThreshold ? `Volume >= ${pol.conditions.volumeThreshold} ` : ''}
                    {pol.conditions.containsPii ? `PII detected ` : ''}
                    {pol.conditions.containsSecrets ? `Secrets detected ` : ''}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        pol.decision === 'BLOCK'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : pol.decision === 'APPROVAL_REQUIRED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {pol.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-300">{pol.severity}</td>
                  <td className="py-3 px-4">
                    {pol.isHardDeny ? (
                      <span className="text-rose-400 font-bold text-[11px]">IMMUTABLE BLOCK</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Escalatable</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
