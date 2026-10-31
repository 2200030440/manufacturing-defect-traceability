import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MaterialLot, Material, Supplier } from '../types';
import { Plus, PackageSearch, Search, ShieldAlert, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useNavigate } from 'react-router-dom';

export const MaterialLots: React.FC = () => {
  const navigate = useNavigate();
  const [lots, setLots] = useState<MaterialLot[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [quarantineFilter, setQuarantineFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    material_id: '',
    supplier_id: '',
    lot_number: '',
    quantity_received: 1000,
    unit_of_measurement: 'PIECE',
    quarantine_status: 'QUARANTINED',
    supplier_lot_reference: '',
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (quarantineFilter) params.append('quarantine_status', quarantineFilter);
      params.append('limit', '50');

      const [lotData, matData, supData] = await Promise.all([
        api.getMaterialLots(params.toString()),
        api.getMaterials('limit=100'),
        api.getSuppliers('limit=100'),
      ]);
      setLots(lotData.items || []);
      setMaterials(matData.items || []);
      setSuppliers(supData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quarantineFilter]);

  const handleQuarantineChange = async (lotId: number, newStatus: string) => {
    try {
      await api.updateLotQuarantine(lotId, newStatus);
      loadData();
    } catch (e) {
      console.error('Failed to update quarantine', e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createMaterialLot({
        ...formData,
        material_id: Number(formData.material_id),
        supplier_id: Number(formData.supplier_id),
        quantity_received: Number(formData.quantity_received),
        quantity_remaining: Number(formData.quantity_received),
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to receive lot');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <PackageSearch className="h-6 w-6 text-brand-600" />
            Material Lot Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Receiving inspection, quarantine locks, supplier pedigree, and inventory balance tracking.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Receive New Lot
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
              placeholder="Search by lot number, vendor, or material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </form>

          <select
            value={quarantineFilter}
            onChange={(e) => setQuarantineFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="">All Quarantine States</option>
            <option value="RELEASED">Released for Production</option>
            <option value="QUARANTINED">Under Quarantine</option>
            <option value="REJECTED">Rejected / Return to Vendor</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {lots.length} lots monitored
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Lot Number</th>
                <th className="py-3 px-4">Material Specification</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Inventory Balance</th>
                <th className="py-3 px-4">Quarantine Status</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4 text-right">Genealogy & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lots.map((lot) => (
                <tr key={lot.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{lot.lot_number}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{lot.material?.name || `Material #${lot.material_id}`}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{lot.material?.material_id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{lot.supplier?.name || `Supplier #${lot.supplier_id}`}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">
                      {lot.quantity_remaining} / {lot.quantity_received} {lot.unit_of_measurement}
                    </span>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-brand-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (lot.quantity_remaining / (lot.quantity_received || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(lot.quarantine_status)}</td>
                  <td className="py-3 px-4 text-slate-500">{lot.received_date}</td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {lot.quarantine_status !== 'RELEASED' ? (
                      <button
                        onClick={() => handleQuarantineChange(lot.id, 'RELEASED')}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold transition"
                        title="Release for production use"
                      >
                        Release
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuarantineChange(lot.id, 'QUARANTINED')}
                        className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-semibold transition"
                        title="Lock lot in quarantine"
                      >
                        Quarantine
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/traceability?q=${lot.lot_number}&type=material_lot`)}
                      className="px-2 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1"
                    >
                      Trace <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Receive Lot */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Receive Inbound Material Lot"
        description="Log an incoming supplier shipment into warehouse with quarantine status."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Lot Number / Barcode</label>
            <input
              type="text"
              required
              value={formData.lot_number}
              onChange={(e) => setFormData({ ...formData, lot_number: e.target.value.toUpperCase() })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase"
              placeholder="e.g., LOT-2026-0091"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Material</label>
            <select
              required
              value={formData.material_id}
              onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.material_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Supplying Vendor</label>
            <select
              required
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.supplier_id}) - Rating {s.quality_rating}/100
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Received Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity_received}
                onChange={(e) => setFormData({ ...formData, quantity_received: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Unit of Measurement</label>
              <select
                value={formData.unit_of_measurement}
                onChange={(e) => setFormData({ ...formData, unit_of_measurement: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="PIECE">PIECE</option>
                <option value="KG">KG</option>
                <option value="LITRE">LITRE</option>
                <option value="METER">METER</option>
                <option value="ROLL">ROLL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Initial Quarantine State</label>
              <select
                value={formData.quarantine_status}
                onChange={(e) => setFormData({ ...formData, quarantine_status: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="QUARANTINED">QUARANTINED (Default Pending QC)</option>
                <option value="RELEASED">RELEASED (Immediate Production)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Supplier Lot Reference</label>
              <input
                type="text"
                value={formData.supplier_lot_reference}
                onChange={(e) => setFormData({ ...formData, supplier_lot_reference: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                placeholder="SUP-BATCH-88"
              />
            </div>
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
              Confirm Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
