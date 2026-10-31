import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { Plus, Search, Filter, Layers, RefreshCw, Eye, Edit } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'ELECTRONICS',
    description: '',
    lifecycle_status: 'ACTIVE',
  });
  const [formError, setFormError] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      params.append('limit', '50');

      const data = await api.getProducts(params.toString());
      setProducts(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createProduct(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        sku: '',
        category: 'ELECTRONICS',
        description: '',
        lifecycle_status: 'ACTIVE',
      });
      loadProducts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="h-6 w-6 text-brand-600" />
            Product Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain finished product specifications, SKU master records, and active lifecycle phases.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          New Product
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadProducts();
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by SKU or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </form>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="AUTOMOTIVE">Automotive</option>
            <option value="AEROSPACE">Aerospace</option>
            <option value="ELECTRONICS">Electronics</option>
            <option value="MEDICAL_DEVICE">Medical Device</option>
            <option value="INDUSTRIAL_EQUIPMENT">Industrial Equipment</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{products.length}</span> of {total} products
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product ID</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.product_id}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.sku}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-3 px-4">
                    <Badge variant="info">{p.category}</Badge>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(p.lifecycle_status)}</td>
                  <td className="py-3 px-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products found. Use "New Product" above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Finished Product"
        description="Add a new manufactured product line with its SKU code and classification."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Product Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              placeholder="e.g., Precision Electronic Control Unit (ECU-Pro)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">SKU Identifier</label>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase"
              placeholder="e.g., SKU-ECU-0099"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="AUTOMOTIVE">Automotive</option>
                <option value="AEROSPACE">Aerospace</option>
                <option value="ELECTRONICS">Electronics</option>
                <option value="MEDICAL_DEVICE">Medical Device</option>
                <option value="INDUSTRIAL_EQUIPMENT">Industrial Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Lifecycle Phase</label>
              <select
                value={formData.lifecycle_status}
                onChange={(e) => setFormData({ ...formData, lifecycle_status: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="ACTIVE">Active (In Production)</option>
                <option value="DRAFT">Engineering Draft</option>
                <option value="PHASE_OUT">Phase Out</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Technical Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              placeholder="Specification details, environmental ratings, assembly instructions..."
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
              Save Product Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Details View Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Product Specifications: ${selectedProduct.product_id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Product Name:</span>
                <span className="font-bold text-slate-900">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SKU Code:</span>
                <span className="font-mono font-semibold">{selectedProduct.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <Badge variant="info">{selectedProduct.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                {getStatusBadge(selectedProduct.lifecycle_status)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered:</span>
                <span>{new Date(selectedProduct.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold uppercase text-[11px] text-slate-700 mb-1">Description</h4>
              <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                {selectedProduct.description || 'No detailed engineering notes registered.'}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
