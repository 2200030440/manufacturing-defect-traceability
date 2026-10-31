import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { InspectionResult, InspectionPlan, ProductionOrder } from '../types';
import { Plus, CheckCircle2, Search, AlertTriangle, FileCheck2, UserCheck } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const Inspections: React.FC = () => {
  const [results, setResults] = useState<InspectionResult[]>([]);
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    inspection_plan_id: '',
    production_order_id: '',
    quantity_inspected: 50,
    quantity_passed: 48,
    quantity_failed: 2,
    inspector: 'Quality Inspector #1',
    notes: 'Dimensional tolerance checked with digital caliper.',
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');

      const [resData, planData, ordData] = await Promise.all([
        api.getInspectionResults(params.toString()),
        api.getInspectionPlans(),
        api.getProductionOrders('limit=100'),
      ]);
      setResults(resData.items || []);
      setPlans(Array.isArray(planData) ? planData : planData.items || []);
      setOrders(ordData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const inspected = Number(formData.quantity_inspected);
    const passed = Number(formData.quantity_passed);
    const failed = Number(formData.quantity_failed);

    if (passed + failed !== inspected) {
      setFormError(`Passed (${passed}) + Failed (${failed}) must equal Inspected (${inspected})`);
      return;
    }

    try {
      await api.recordInspectionResult({
        inspection_plan_id: Number(formData.inspection_plan_id),
        production_order_id: Number(formData.production_order_id),
        quantity_inspected: inspected,
        quantity_passed: passed,
        quantity_failed: failed,
        inspection_status: failed > 0 ? 'FAILED' : 'PASSED',
        inspector: formData.inspector,
        notes: formData.notes,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record inspection');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-brand-600" />
            Quality Gate & Inspection Results
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Receiving, in-process, and final inspection verification against quality acceptance limits (AQL).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Record Inspection
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadData();
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by inspection ID or order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="">All Inspection Outcomes</option>
            <option value="PASSED">Passed Quality Gate</option>
            <option value="FAILED">Failed Acceptance Limit</option>
            <option value="PENDING">Pending Review</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {results.length} inspection audits logged
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Inspection ID</th>
                <th className="py-3 px-4">Production Order</th>
                <th className="py-3 px-4">Inspection Plan</th>
                <th className="py-3 px-4">Sample Inspected</th>
                <th className="py-3 px-4">Passed / Failed</th>
                <th className="py-3 px-4">Quality Result</th>
                <th className="py-3 px-4">Inspector</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.inspection_id}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    {r.production_order?.order_id || `ORD #${r.production_order_id}`}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {r.inspection_plan?.inspection_type || 'Final Acceptance Plan'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{r.quantity_inspected} units</td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-700 font-bold">{r.quantity_passed} passed</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-rose-700 font-bold">{r.quantity_failed} failed</span>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(r.inspection_status)}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{r.inspector}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{r.inspection_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Record Result */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Quality Inspection Result"
        description="Verify a sample against acceptance criteria and log pass/fail counts."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Production Order</label>
            <select
              required
              value={formData.production_order_id}
              onChange={(e) => setFormData({ ...formData, production_order_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Production Order...</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_id} ({o.product?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Applicable Inspection Plan</label>
            <select
              required
              value={formData.inspection_plan_id}
              onChange={(e) => setFormData({ ...formData, inspection_plan_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.plan_id} - {p.inspection_type} ({p.sample_size_type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Inspected Qty</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity_inspected}
                onChange={(e) => setFormData({ ...formData, quantity_inspected: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-700 uppercase">Passed Qty</label>
              <input
                type="number"
                min="0"
                required
                value={formData.quantity_passed}
                onChange={(e) => setFormData({ ...formData, quantity_passed: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-emerald-200 bg-emerald-50/50 rounded-xl font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-700 uppercase">Failed Qty</label>
              <input
                type="number"
                min="0"
                required
                value={formData.quantity_failed}
                onChange={(e) => setFormData({ ...formData, quantity_failed: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-rose-200 bg-rose-50/50 rounded-xl font-bold text-rose-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Quality Inspector</label>
            <input
              type="text"
              required
              value={formData.inspector}
              onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Inspection Notes & Findings</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
            >
              Submit Quality Audit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
