import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MaterialConsumption, ProductionOrder, MaterialLot, Material } from '../types';
import { Plus, Flame, Search, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useNavigate } from 'react-router-dom';

export const Consumption: React.FC = () => {
  const navigate = useNavigate();
  const [consumptions, setConsumptions] = useState<MaterialConsumption[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [lots, setLots] = useState<MaterialLot[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    production_order_id: '',
    material_lot_id: '',
    material_id: '',
    consumed_quantity: 10,
    unit_of_measurement: 'PIECE',
    consumed_by: 'Plant Operator #1',
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');

      const [cData, oData, lData, mData] = await Promise.all([
        api.getConsumptions(params.toString()),
        api.getProductionOrders('limit=100'),
        api.getMaterialLots('limit=100'),
        api.getMaterials('limit=100'),
      ]);
      setConsumptions(cData.items || []);
      setOrders(oData.items || []);
      setLots(lData.items || []);
      setMaterials(mData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.recordConsumption({
        production_order_id: Number(formData.production_order_id),
        material_lot_id: Number(formData.material_lot_id),
        material_id: Number(formData.material_id),
        consumed_quantity: Number(formData.consumed_quantity),
        unit_of_measurement: formData.unit_of_measurement,
        consumed_by: formData.consumed_by,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to log consumption');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Flame className="h-6 w-6 text-brand-600" />
            Material Consumption Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time material issuance logs, binding specific supplier lot batches to production orders.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Record Material Issuance
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadData();
          }}
          className="relative max-w-md w-full"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order or lot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </form>

        <span className="text-xs text-slate-500 font-medium">
          {consumptions.length} consumption logs
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Production Order</th>
                <th className="py-3 px-4">Material Lot Consumed</th>
                <th className="py-3 px-4">Material Description</th>
                <th className="py-3 px-4">Quantity Consumed</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Issued Timestamp</th>
                <th className="py-3 px-4 text-right">Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consumptions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {c.production_order?.order_id || `ORD #${c.production_order_id}`}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-brand-600">
                    {c.material_lot?.lot_number || `LOT #${c.material_lot_id}`}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {c.material?.name || `Material #${c.material_id}`}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {c.consumed_quantity} {c.unit_of_measurement}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{c.consumed_by || 'Operator'}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{c.consumed_at}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() =>
                        navigate(
                          `/traceability?q=${c.material_lot?.lot_number || c.material_lot_id}&type=material_lot`
                        )
                      }
                      className="px-2 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1"
                    >
                      Genealogy <ArrowUpRight className="h-3 w-3" />
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
        title="Record Shopfloor Material Consumption"
        description="Issue raw material lot units to an active production job order."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Production Job Order</label>
            <select
              required
              value={formData.production_order_id}
              onChange={(e) => setFormData({ ...formData, production_order_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Production Order...</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_id} - {o.product?.name} ({o.production_status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Source Raw Material Lot</label>
            <select
              required
              value={formData.material_lot_id}
              onChange={(e) => {
                const lotId = e.target.value;
                const foundLot = lots.find((l) => l.id === Number(lotId));
                setFormData({
                  ...formData,
                  material_lot_id: lotId,
                  material_id: foundLot ? String(foundLot.material_id) : formData.material_id,
                  unit_of_measurement: foundLot?.unit_of_measurement || formData.unit_of_measurement,
                });
              }}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
            >
              <option value="">Select Material Lot...</option>
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lot_number} - {l.material?.name} (Stock: {l.quantity_remaining}) - {l.quarantine_status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Quantity to Issue</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={formData.consumed_quantity}
                onChange={(e) => setFormData({ ...formData, consumed_quantity: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Unit</label>
              <input
                type="text"
                disabled
                value={formData.unit_of_measurement}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Issuing Operator</label>
            <input
              type="text"
              required
              value={formData.consumed_by}
              onChange={(e) => setFormData({ ...formData, consumed_by: e.target.value })}
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
              Log Issuance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
