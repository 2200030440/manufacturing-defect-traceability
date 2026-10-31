import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BOMComponent, Product, Material } from '../types';
import { Plus, FileSpreadsheet, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const BOM: React.FC = () => {
  const [components, setComponents] = useState<BOMComponent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    product_id: '',
    material_id: '',
    revision: 'REV-A',
    component_sequence: 1,
    quantity_required: 1,
    unit_of_measurement: 'PIECE',
    is_critical: false,
    bom_status: 'ACTIVE',
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [bomData, prodData, matData] = await Promise.all([
        api.getBOM(selectedProductId ? Number(selectedProductId) : undefined),
        api.getProducts('limit=100'),
        api.getMaterials('limit=100'),
      ]);
      setComponents(Array.isArray(bomData) ? bomData : bomData.items || []);
      setProducts(prodData.items || []);
      setMaterials(matData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProductId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createBOMComponent({
        ...formData,
        product_id: Number(formData.product_id),
        material_id: Number(formData.material_id),
        quantity_required: Number(formData.quantity_required),
        component_sequence: Number(formData.component_sequence),
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add BOM component');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-brand-600" />
            Bill of Materials (BOM)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Engineering structure, material requirement ratios, critical parts, and revision control.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Add BOM Component
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Filter by Product:</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {components.length} components linked
        </span>
      </div>

      {/* Components Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Seq</th>
                <th className="py-3 px-4">Finished Product</th>
                <th className="py-3 px-4">Material Required</th>
                <th className="py-3 px-4">Quantity / Unit</th>
                <th className="py-3 px-4">Revision</th>
                <th className="py-3 px-4">Criticality</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {components.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-500">#{c.component_sequence}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {c.product?.name || `Product #${c.product_id}`}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-brand-700">{c.material?.name || `Material #${c.material_id}`}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{c.material?.material_id}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {c.quantity_required} {c.unit_of_measurement}
                  </td>
                  <td className="py-3 px-4 font-mono">{c.revision}</td>
                  <td className="py-3 px-4">
                    {c.is_critical ? (
                      <Badge variant="danger">CRITICAL COMPONENT</Badge>
                    ) : (
                      <Badge variant="neutral">Standard</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(c.bom_status)}</td>
                </tr>
              ))}
              {components.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No BOM components found for selected product.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Bill of Materials Component"
        description="Attach a raw material or sub-component to a product BOM."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Target Product</label>
            <select
              required
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Finished Product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Required Raw Material</label>
            <select
              required
              value={formData.material_id}
              onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.material_id}) - {m.unit_of_measurement}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Quantity Required</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.quantity_required}
                onChange={(e) => setFormData({ ...formData, quantity_required: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Unit of Measure</label>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase">BOM Revision</label>
              <input
                type="text"
                required
                value={formData.revision}
                onChange={(e) => setFormData({ ...formData, revision: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Sequence #</label>
              <input
                type="number"
                min="1"
                required
                value={formData.component_sequence}
                onChange={(e) => setFormData({ ...formData, component_sequence: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_critical"
              checked={formData.is_critical}
              onChange={(e) => setFormData({ ...formData, is_critical: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="is_critical" className="text-xs font-medium text-slate-700">
              Mark as Critical Component (Mandatory strict inspection & quarantine tracking)
            </label>
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
              Save BOM Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
