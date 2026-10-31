import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Supplier } from '../types';
import { Plus, Building2, Search, Star, Phone, Mail, Globe, Eye } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    country: 'United States',
    quality_rating: 95,
    status: 'ACTIVE',
  });
  const [formError, setFormError] = useState('');

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');
      const data = await api.getSuppliers(params.toString());
      setSuppliers(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createSupplier(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        country: 'United States',
        quality_rating: 95,
        status: 'ACTIVE',
      });
      loadSuppliers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create supplier');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brand-600" />
            Supplier Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier vendor evaluations, lot delivery performance, quality ratings, and vendor pedigree.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedSupplier(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Onboard Supplier
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadSuppliers();
          }}
          className="relative max-w-md w-full"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </form>

        <span className="text-xs text-slate-500 font-medium">
          {suppliers.length} active vendors
        </span>
      </div>

      {/* Grid of Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">{s.supplier_id}</span>
                {getStatusBadge(s.status)}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-2">{s.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Globe className="h-3 w-3 text-slate-400" />
                {s.country || 'Global Supplier'}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Quality Score</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900 mt-0.5">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>{s.quality_rating} / 100</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Defect-Free Lots</span>
                  <span className="font-bold text-emerald-600 mt-0.5 block">
                    {s.defect_free_percentage}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Total Lots: <strong className="text-slate-800">{s.total_lots_supplied}</strong>
              </span>
              <button
                onClick={() => setSelectedSupplier(s)}
                className="text-brand-600 hover:text-brand-800 font-semibold inline-flex items-center gap-1"
              >
                Profile & Contacts
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Onboard Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New Material Supplier"
        description="Register a qualified raw material vendor to allow incoming lot receipts."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Vendor Legal Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              placeholder="e.g., Precision Alloys & Synthetics Corp."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Contact Representative</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                placeholder="Key Account Mgr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                placeholder="supply@vendor.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                placeholder="+1 555-019-2831"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Initial Audit Rating (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.quality_rating}
                onChange={(e) => setFormData({ ...formData, quality_rating: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="ACTIVE">ACTIVE (Approved Supplier)</option>
                <option value="PENDING">PENDING QUALIFICATION</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
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
              Save Supplier Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Profile Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          title={`Supplier Profile: ${selectedSupplier.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedSupplier.supplier_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Person:</span>
                <span className="font-semibold">{selectedSupplier.contact_person || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-brand-600">{selectedSupplier.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span>{selectedSupplier.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quality Rating:</span>
                <span className="font-bold text-brand-600">{selectedSupplier.quality_rating} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                {getStatusBadge(selectedSupplier.status)}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
