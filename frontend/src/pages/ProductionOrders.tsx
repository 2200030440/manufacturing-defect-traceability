import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProductionOrder, Product } from '../types';
import { Plus, Factory, Search, ArrowUpRight, Play, CheckCircle2, XOctagon } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useNavigate } from 'react-router-dom';

export const ProductionOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    product_id: '',
    bom_revision: 'REV-A',
    planned_quantity: 100,
    production_status: 'PLANNED',
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');

      const [orderData, prodData] = await Promise.all([
        api.getProductionOrders(params.toString()),
        api.getProducts('limit=100'),
      ]);
      setOrders(orderData.items || []);
      setProducts(prodData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createProductionOrder({
        product_id: Number(formData.product_id),
        bom_revision: formData.bom_revision,
        planned_quantity: Number(formData.planned_quantity),
        production_status: formData.production_status,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to dispatch order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Factory className="h-6 w-6 text-brand-600" />
            Production Order Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch manufacturing orders, track planned vs actual batch yields, scrap rates, and order status.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Dispatch Order
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
              placeholder="Search by order ID or product..."
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
            <option value="">All Production States</option>
            <option value="PLANNED">Planned</option>
            <option value="RELEASED">Released</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {orders.length} manufacturing orders
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">BOM Rev</th>
                <th className="py-3 px-4">Planned Qty</th>
                <th className="py-3 px-4">Actual Yield</th>
                <th className="py-3 px-4">Scrap / Rework</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-right">Workflow & Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.order_id}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{o.product?.name || `Product #${o.product_id}`}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{o.product?.sku}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{o.bom_revision}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{o.planned_quantity}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {o.actual_quantity}
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({Math.round(((o.actual_quantity || 0) / (o.planned_quantity || 1)) * 100)}%)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-rose-600 font-medium">{o.scrap_quantity} scrap</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-amber-600 font-medium">{o.rework_quantity} rework</span>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(o.production_status)}</td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {o.production_status === 'PLANNED' && (
                      <button
                        onClick={() => handleStatusUpdate(o.id, 'IN_PROGRESS')}
                        className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-[11px] font-semibold transition"
                      >
                        Start Run
                      </button>
                    )}
                    {o.production_status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusUpdate(o.id, 'COMPLETED')}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold transition"
                      >
                        Finish Run
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/traceability?q=${o.order_id}&type=production_order`)}
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispatch Production Order"
        description="Schedule a manufacturing production order for an active product BOM."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Product to Manufacture</label>
            <select
              required
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Target Product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Planned Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={formData.planned_quantity}
                onChange={(e) => setFormData({ ...formData, planned_quantity: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">BOM Revision</label>
              <input
                type="text"
                required
                value={formData.bom_revision}
                onChange={(e) => setFormData({ ...formData, bom_revision: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Initial Order Status</label>
            <select
              value={formData.production_status}
              onChange={(e) => setFormData({ ...formData, production_status: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="PLANNED">PLANNED (Scheduled)</option>
              <option value="RELEASED">RELEASED (Staged on shopfloor)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Active Machine Run)</option>
            </select>
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
              Confirm Dispatch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
