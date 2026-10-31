import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Machine } from '../types';
import { Plus, Cpu, Search, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const Machines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    machine_type: 'SMT_PICK_AND_PLACE',
    line_location: 'Line 1 - Alpha Bay',
    status: 'ACTIVE',
  });
  const [formError, setFormError] = useState('');

  const loadMachines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');
      const data = await api.getMachines(params.toString());
      setMachines(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMachines();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createMachine(formData);
      setIsModalOpen(false);
      loadMachines();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create machine');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-brand-600" />
            Machine Asset Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Production line equipment status, calibration telemetry, and maintenance schedules.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Add Machine Asset
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadMachines();
          }}
          className="relative max-w-md w-full"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search machines by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </form>

        <span className="text-xs text-slate-500 font-medium">
          {machines.length} equipment assets online
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((m) => (
          <div
            key={m.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-400">{m.machine_id}</span>
              {getStatusBadge(m.status)}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">{m.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{m.line_location}</p>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Asset Type:</span>
                <span className="font-mono text-slate-700">{m.machine_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Maintenance:</span>
                <span className="text-slate-700">{m.last_maintenance_date || 'Current Month'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Next Service Due:</span>
                <span className="text-brand-600 font-semibold">{m.next_maintenance_date || 'In 45 Days'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Manufacturing Machine"
        description="Add a CNC, injection mold, automated optical inspection, or pick-and-place equipment."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Machine Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              placeholder="e.g., SMT High-Speed Mounter Unit-04"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Machine Type</label>
              <select
                value={formData.machine_type}
                onChange={(e) => setFormData({ ...formData, machine_type: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono text-[11px]"
              >
                <option value="SMT_PICK_AND_PLACE">SMT Pick & Place</option>
                <option value="REFLOW_OVEN">Reflow Oven</option>
                <option value="AOI_INSPECTION">Automated Optical Inspection</option>
                <option value="CNC_MILLING">CNC Milling 5-Axis</option>
                <option value="INJECTION_MOLDING">Injection Molding Press</option>
                <option value="LASER_WELDER">Fiber Laser Welder</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="ACTIVE">ACTIVE (Operational)</option>
                <option value="MAINTENANCE">UNDER MAINTENANCE</option>
                <option value="OFFLINE">OFFLINE / IDLE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Line Location</label>
            <input
              type="text"
              required
              value={formData.line_location}
              onChange={(e) => setFormData({ ...formData, line_location: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              placeholder="e.g., Plant 1, Cleanroom Bay B"
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
              Save Machine Asset
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
