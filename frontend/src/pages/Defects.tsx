import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Defect, ProductionOrder, MaterialLot, Machine } from '../types';
import { Plus, AlertTriangle, Search, GitMerge, ShieldAlert, ArrowUpRight, Filter } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const Defects: React.FC = () => {
  const navigate = useNavigate();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [lots, setLots] = useState<MaterialLot[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    production_order_id: '',
    material_lot_id: '',
    machine_id: '',
    defect_category: 'DIMENSIONAL',
    severity: 'HIGH',
    defect_status: 'OPEN',
    defect_quantity: 5,
    description: '',
    suspected_cause: 'Tooling wear or lot variance',
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (severityFilter) params.append('severity', severityFilter);
      params.append('limit', '50');

      const [defData, ordData, lotData, machData] = await Promise.all([
        api.getDefects(params.toString()),
        api.getProductionOrders('limit=100'),
        api.getMaterialLots('limit=100'),
        api.getMachines('limit=100'),
      ]);
      setDefects(defData.items || []);
      setOrders(ordData.items || []);
      setLots(lotData.items || []);
      setMachines(machData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, severityFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createDefect({
        ...formData,
        production_order_id: formData.production_order_id ? Number(formData.production_order_id) : undefined,
        material_lot_id: formData.material_lot_id ? Number(formData.material_lot_id) : undefined,
        machine_id: formData.machine_id ? Number(formData.machine_id) : undefined,
        defect_quantity: Number(formData.defect_quantity),
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to log defect');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-brand-600" />
            Manufacturing Defect Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Detect, classify, and track non-conformance defects across supply lots, assembly orders, and equipment.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Log Non-Conformance Defect
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
              placeholder="Search by defect ID, description, or order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </form>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="DIMENSIONAL">Dimensional</option>
            <option value="SURFACE_FINISH">Surface Finish</option>
            <option value="SOLDER_DEFECT">Solder Defect</option>
            <option value="ASSEMBLY_ERROR">Assembly Error</option>
            <option value="ELECTRICAL_FAILURE">Electrical Failure</option>
            <option value="MATERIAL_CONTAMINATION">Material Contamination</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {defects.length} defects recorded
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Defect ID</th>
                <th className="py-3 px-4">Description & Mode</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Linked Job & Lot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Root-Cause Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {defects.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{d.defect_id}</td>
                  <td className="py-3 px-4 max-w-xs">
                    <span className="font-semibold text-slate-900 block truncate">{d.description}</span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      Suspected: {d.suspected_cause || 'Root-cause analysis in progress'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(d.severity)}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-700">{d.defect_category}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-rose-700">{d.defect_quantity} units</td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-slate-800">{d.production_order?.order_id || 'N/A'}</div>
                    <div className="text-slate-400">{d.material_lot?.lot_number || 'No lot linked'}</div>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(d.defect_status)}</td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => navigate(`/traceability?q=${d.defect_id}&type=defect`)}
                      className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1"
                    >
                      <GitMerge className="h-3 w-3" />
                      Trace Genealogy
                    </button>
                    <button
                      onClick={() => navigate(`/capa`)}
                      className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1"
                      title="Open CAPA Action"
                    >
                      <ShieldAlert className="h-3 w-3" />
                      CAPA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Manufacturing Defect"
        description="Record a non-conformance defect and associate it with a production order, material lot, or machine."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Defect Description</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              placeholder="e.g., Cold solder joint on primary diode array"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Category</label>
              <select
                value={formData.defect_category}
                onChange={(e) => setFormData({ ...formData, defect_category: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="DIMENSIONAL">Dimensional Out of Spec</option>
                <option value="SURFACE_FINISH">Surface Finish Scratches</option>
                <option value="SOLDER_DEFECT">Solder Bridging / Void</option>
                <option value="ASSEMBLY_ERROR">Assembly Misalignment</option>
                <option value="ELECTRICAL_FAILURE">Electrical Open/Short</option>
                <option value="MATERIAL_CONTAMINATION">Material Contamination</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Severity Level</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              >
                <option value="CRITICAL">CRITICAL (Immediate Stop)</option>
                <option value="HIGH">HIGH (Quarantine Job)</option>
                <option value="MEDIUM">MEDIUM (Rework Required)</option>
                <option value="LOW">LOW (Minor Cosmetic)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Defective Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={formData.defect_quantity}
                onChange={(e) => setFormData({ ...formData, defect_quantity: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Production Order</label>
              <select
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Suspect Material Lot</label>
              <select
                value={formData.material_lot_id}
                onChange={(e) => setFormData({ ...formData, material_lot_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono text-[11px]"
              >
                <option value="">Select Lot (If Material Related)...</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lot_number} - {l.material?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Associated Machine</label>
              <select
                value={formData.machine_id}
                onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="">Select Machine (If Tooling Related)...</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.machine_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Suspected Root Cause</label>
            <textarea
              rows={2}
              value={formData.suspected_cause}
              onChange={(e) => setFormData({ ...formData, suspected_cause: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              placeholder="e.g., Thermal profile overshoot during wave soldering"
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
              Log Non-Conformance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
