'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle, BarChart3, Database, Layers } from 'lucide-react';
import { api } from '@/lib/api';

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = async () => {
    try {
      const res = await api.getModels();
      setModels(res.models || []);
    } catch (err) {
      console.error('Error fetching models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Machine Learning Model Governance
        </h2>
        <p className="text-sm text-slate-400">
          Supervised action-risk classification and unsupervised Isolation Forest anomaly models
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-xl border border-surface-border">
          <p className="text-xs uppercase text-slate-400 font-medium">Risk Classifier</p>
          <h3 className="text-xl font-bold text-white mt-1">XGBoost Multiclass</h3>
          <p className="text-xs text-slate-400 mt-2">
            Predicts probabilities across LOW, MEDIUM, HIGH, CRITICAL.
          </p>
          <div className="mt-4 pt-3 border-t border-surface-border text-xs text-indigo-400 font-mono">
            FastAPI :8000 /api/ml/predict
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-surface-border">
          <p className="text-xs uppercase text-slate-400 font-medium">Anomaly Engine</p>
          <h3 className="text-xl font-bold text-white mt-1">Isolation Forest</h3>
          <p className="text-xs text-slate-400 mt-2">
            Detects spikes in requested record volume, call frequency, and destination shifts.
          </p>
          <div className="mt-4 pt-3 border-t border-surface-border text-xs text-indigo-400 font-mono">
            FastAPI :8000 /api/ml/anomaly
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-surface-border">
          <p className="text-xs uppercase text-slate-400 font-medium">Contextual LLM</p>
          <h3 className="text-xl font-bold text-white mt-1">Gemini / OpenAI Reasoner</h3>
          <p className="text-xs text-slate-400 mt-2">
            Non-authoritative contextual intent explanation and injection suspicion score.
          </p>
          <div className="mt-4 pt-3 border-t border-surface-border text-xs text-indigo-400 font-mono">
            Fail-Closed on Outage
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-surface-border p-6 space-y-4">
        <h4 className="text-sm font-semibold text-white">Registered Model Artifacts & Evaluation History</h4>
        {models.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Training pipeline artifacts will appear here after running Track B training.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-surface-border">
                <th className="pb-2 font-medium">Model</th>
                <th className="pb-2 font-medium">Version</th>
                <th className="pb-2 font-medium">Algorithm</th>
                <th className="pb-2 font-medium">Accuracy</th>
                <th className="pb-2 font-medium">F1 Score</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {models.map((m) => (
                <tr key={m._id}>
                  <td className="py-2.5 text-white font-medium">{m.name}</td>
                  <td className="py-2.5 font-mono text-indigo-400">{m.version}</td>
                  <td className="py-2.5 text-slate-300">{m.algorithm}</td>
                  <td className="py-2.5 text-emerald-400 font-mono">
                    {m.metrics?.accuracy ? `${(m.metrics.accuracy * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2.5 text-slate-200 font-mono">
                    {m.metrics?.f1Score ? m.metrics.f1Score.toFixed(3) : '—'}
                  </td>
                  <td className="py-2.5">
                    {m.active ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">ARCHIVED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
