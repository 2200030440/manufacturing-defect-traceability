const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('trace_auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('trace_auth_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('trace_auth_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `HTTP error ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// API methods
export const api = {
  // Auth
  login: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },
  getCurrentUser: () => apiRequest('/auth/me'),

  // Dashboard
  getKPIs: () => apiRequest('/dashboard/kpis'),
  getRecentActivity: () => apiRequest('/dashboard/recent-activity'),

  // Products
  getProducts: (params = '') => apiRequest(`/products${params ? `?${params}` : ''}`),
  createProduct: (data: any) => apiRequest('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: any) => apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Materials
  getMaterials: (params = '') => apiRequest(`/materials${params ? `?${params}` : ''}`),
  createMaterial: (data: any) => apiRequest('/materials', { method: 'POST', body: JSON.stringify(data) }),

  // BOM
  getBOM: (productId?: number) => apiRequest(`/bom${productId ? `?product_id=${productId}` : ''}`),
  createBOMComponent: (data: any) => apiRequest('/bom', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: (params = '') => apiRequest(`/suppliers${params ? `?${params}` : ''}`),
  createSupplier: (data: any) => apiRequest('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: number, data: any) => apiRequest(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Material Lots
  getMaterialLots: (params = '') => apiRequest(`/material-lots${params ? `?${params}` : ''}`),
  createMaterialLot: (data: any) => apiRequest('/material-lots', { method: 'POST', body: JSON.stringify(data) }),
  updateLotQuarantine: (id: number, status: string) =>
    apiRequest(`/material-lots/${id}/quarantine`, { method: 'PATCH', body: JSON.stringify({ quarantine_status: status }) }),

  // Production Orders
  getProductionOrders: (params = '') => apiRequest(`/production-orders${params ? `?${params}` : ''}`),
  createProductionOrder: (data: any) => apiRequest('/production-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: number, status: string) =>
    apiRequest(`/production-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ production_status: status }) }),

  // Material Consumption
  getConsumptions: (params = '') => apiRequest(`/consumption${params ? `?${params}` : ''}`),
  recordConsumption: (data: any) => apiRequest('/consumption', { method: 'POST', body: JSON.stringify(data) }),

  // Machines
  getMachines: (params = '') => apiRequest(`/machines${params ? `?${params}` : ''}`),
  createMachine: (data: any) => apiRequest('/machines', { method: 'POST', body: JSON.stringify(data) }),

  // Process Steps & Executions
  getProcessSteps: () => apiRequest('/process-steps'),
  getStepExecutions: (params = '') => apiRequest(`/process-steps/executions${params ? `?${params}` : ''}`),
  startStepExecution: (data: any) => apiRequest('/process-steps/executions', { method: 'POST', body: JSON.stringify(data) }),
  completeStepExecution: (id: number, data: any) => apiRequest(`/process-steps/executions/${id}/complete`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Inspection Plans & Results
  getInspectionPlans: () => apiRequest('/inspection-plans'),
  createInspectionPlan: (data: any) => apiRequest('/inspection-plans', { method: 'POST', body: JSON.stringify(data) }),
  getInspectionResults: (params = '') => apiRequest(`/inspection-results${params ? `?${params}` : ''}`),
  recordInspectionResult: (data: any) => apiRequest('/inspection-results', { method: 'POST', body: JSON.stringify(data) }),

  // Defects
  getDefects: (params = '') => apiRequest(`/defects${params ? `?${params}` : ''}`),
  createDefect: (data: any) => apiRequest('/defects', { method: 'POST', body: JSON.stringify(data) }),
  updateDefect: (id: number, data: any) => apiRequest(`/defects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Containments
  getContainments: (params = '') => apiRequest(`/containments${params ? `?${params}` : ''}`),
  createContainment: (data: any) => apiRequest('/containments', { method: 'POST', body: JSON.stringify(data) }),

  // CAPA
  getCAPAs: (params = '') => apiRequest(`/capa${params ? `?${params}` : ''}`),
  createCAPA: (data: any) => apiRequest('/capa', { method: 'POST', body: JSON.stringify(data) }),
  updateCAPA: (id: number, data: any) => apiRequest(`/capa/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  verifyCAPA: (id: number, data: any) => apiRequest(`/capa/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),

  // Traceability Explorer
  searchTraceability: (searchType: string, query: string) =>
    apiRequest(`/traceability/search?search_type=${encodeURIComponent(searchType)}&query=${encodeURIComponent(query)}`),
  traceDefect: (defectId: string) => apiRequest(`/traceability/defect/${encodeURIComponent(defectId)}`),
  traceUpstream: (lotId: string) => apiRequest(`/traceability/upstream/${encodeURIComponent(lotId)}`),
  traceDownstream: (lotId: string) => apiRequest(`/traceability/downstream/${encodeURIComponent(lotId)}`),

  // Exceptions
  getExceptions: (params = '') => apiRequest(`/exceptions${params ? `?${params}` : ''}`),
  resolveException: (id: number, data: any) => apiRequest(`/exceptions/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getDefectsOverTime: (days = 90) => apiRequest(`/analytics/defects-over-time?days=${days}`),
  getDefectsByCategory: () => apiRequest('/analytics/defects-by-category'),
  getDefectsBySeverity: () => apiRequest('/analytics/defects-by-severity'),
  getSupplierQuality: () => apiRequest('/analytics/supplier-quality'),
  getMachineDefects: () => apiRequest('/analytics/machine-defects'),
  getInspectionTrends: (days = 90) => apiRequest(`/analytics/inspection-trends?days=${days}`),
  getScrapRework: (days = 90) => apiRequest(`/analytics/scrap-rework?days=${days}`),
  getCAPAStatus: () => apiRequest('/analytics/capa-status'),

  // Data Generator
  triggerGeneration: (config: any) => apiRequest('/data-generator/generate', { method: 'POST', body: JSON.stringify(config) }),
  getGenerationStatus: () => apiRequest('/data-generator/status'),

  // Validation
  runValidation: () => apiRequest('/validation/run'),
  getAnomalies: () => apiRequest('/validation/anomaly-detection'),
};
