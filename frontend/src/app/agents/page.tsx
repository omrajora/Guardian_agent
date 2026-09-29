'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Bot, Wrench, Key, RefreshCw, Check } from 'lucide-react';
import { api } from '@/lib/api';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [agentRes, toolRes] = await Promise.all([api.getAgents(), api.getTools()]);
      setAgents(agentRes.agents || []);
      setTools(toolRes.tools || []);
    } catch (err) {
      console.error('Failed fetching agents or tools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Autonomous Agents & Registered Tools
        </h2>
        <p className="text-sm text-slate-400">
          Cryptographically authenticated agent callers and protected tool interfaces
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Agents Card */}
        <div className="glass-panel p-6 rounded-xl border border-surface-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              Registered AI Agents ({agents.length})
            </h3>
          </div>

          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent._id}
                className="p-4 bg-surface-elevated/70 rounded-lg border border-surface-border space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-100">{agent.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px]">
                    {agent.status}
                  </span>
                </div>
                <p className="font-mono text-indigo-400">{agent.agentId}</p>
                <p className="text-slate-400">{agent.description}</p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-slate-400">Allowed Tools:</span>
                  {agent.allowedTools?.map((t: string) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-surface-border text-slate-300 font-mono text-[10px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Key prefix: {agent.apiKeyPrefix}... (SHA-256 hashed)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tools Card */}
        <div className="glass-panel p-6 rounded-xl border border-surface-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              Protected Tool Registry ({tools.length})
            </h3>
          </div>

          <div className="space-y-4">
            {tools.map((tool) => (
              <div
                key={tool._id}
                className="p-4 bg-surface-elevated/70 rounded-lg border border-surface-border space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-100">{tool.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      tool.sensitivity === 'CONFIDENTIAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : tool.sensitivity === 'INTERNAL'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {tool.sensitivity}
                  </span>
                </div>
                <p className="font-mono text-emerald-400">{tool.toolId} ({tool.category})</p>
                <div className="pt-1 flex flex-wrap gap-1 text-[11px] text-slate-400">
                  <span>Destinations:</span>
                  {tool.destinations?.map((d: string) => (
                    <span key={d} className="px-1.5 py-0.5 rounded bg-surface-border text-slate-300 font-mono text-[10px]">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
