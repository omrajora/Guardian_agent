const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('guardian_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  getOverview: () => fetchWithAuth('/api/analytics/overview'),
  getAgents: () => fetchWithAuth('/api/agents'),
  getTools: () => fetchWithAuth('/api/tools'),
  getPolicies: () => fetchWithAuth('/api/policies'),
  getPendingApprovals: () => fetchWithAuth('/api/approvals/pending'),
  approveAction: (id: string, reason?: string) =>
    fetchWithAuth(`/api/approvals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  rejectAction: (id: string, reason?: string) =>
    fetchWithAuth(`/api/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getAuditLogs: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/audit-logs${query ? `?${query}` : ''}`);
  },
  getModels: () => fetchWithAuth('/api/models'),
  runSimulator: (scenarioKey: string) =>
    fetchWithAuth('/api/simulator/run', {
      method: 'POST',
      body: JSON.stringify({ scenarioKey }),
    }),
};
