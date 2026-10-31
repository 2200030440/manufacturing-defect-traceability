import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { CAPA as CAPAModel, Defect } from '../types';
import { Plus, ShieldAlert, CheckCircle2, Search, Clock, FileCheck } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const CAPA: React.FC = () => {
  const [capas, setCapas] = useState<CAPAModel[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState<CAPAModel | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    defect_id: '',
    capa_type: 'CORRECTIVE',
    title: '',
    root_cause_analysis: 'Conducted 5-Why analysis: root cause traced to heater band element failure.',
    action_plan: 'Replace thermocouple, update calibration checklist, retrain night-shift operator.',
    assigned_to: 'Quality Engineer Lead',
    target_completion_date: '2026-11-30',
  });
  const [formError, setFormError] = useState('');

  // Verify State
  const [verifyData, setVerifyData] = useState({
    verification_status: 'VERIFIED',
    notes: 'Reviewed subsequent 3 batch runs (0 defects detected). Process confirmed capable.',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');

      const [cData, dData] = await Promise.all([
        api.getCAPAs(params.toString()),
        api.getDefects('limit=100'),
      ]);
      setCapas(cData.items || []);
      setDefects(dData.items || []);
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
    try {
      await api.createCAPA({
        ...formData,
        defect_id: Number(formData.defect_id),
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to open CAPA');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCapa) return;
    try {
      await api.verifyCAPA(selectedCapa.id, {
        verification_status: verifyData.verification_status,
        effectiveness_review_notes: verifyData.notes,
      });
      setVerifyModalOpen(false);
      setSelectedCapa(null);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-brand-600" />
            Corrective & Preventive Actions (CAPA)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Root-cause investigations (5-Why), corrective action implementation, and effectiveness verification.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Initiate New CAPA
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
              placeholder="Search by CAPA title, defect, or assignee..."
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
            <option value="">All CAPA Lifecycle States</option>
            <option value="OPEN">Open (Investigating)</option>
            <option value="IN_PROGRESS">Action Plan in Progress</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="CLOSED">Closed & Verified</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {capas.length} CAPA records tracked
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">CAPA ID</th>
                <th className="py-3 px-4">Title & Objective</th>
                <th className="py-3 px-4">Originating Defect</th>
                <th className="py-3 px-4">Assigned Engineer</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4">CAPA Status</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Verification Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {capas.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.capa_id}</td>
                  <td className="py-3 px-4 max-w-sm">
                    <span className="font-semibold text-slate-900 block truncate">{c.title}</span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      Action: {c.action_plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-brand-600 font-semibold">
                    {c.defect?.defect_id || `Defect #${c.defect_id}`}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{c.assigned_to || 'Quality Team'}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{c.target_completion_date}</td>
                  <td className="py-3 px-4">{getStatusBadge(c.capa_status)}</td>
                  <td className="py-3 px-4">{getStatusBadge(c.verification_status)}</td>
                  <td className="py-3 px-4 text-right">
                    {c.capa_status !== 'CLOSED' ? (
                      <button
                        onClick={() => {
                          setSelectedCapa(c);
                          setVerifyModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1"
                      >
                        <FileCheck className="h-3 w-3" />
                        Verify & Close
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-semibold text-[11px] inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Closed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Initiate CAPA */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Corrective Action (CAPA)"
        description="Launch a formalized root-cause investigation and containment plan for an identified defect."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Originating Defect</label>
            <select
              required
              value={formData.defect_id}
              onChange={(e) => setFormData({ ...formData, defect_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
            >
              <option value="">Select Non-Conformance Defect...</option>
              {defects.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.defect_id} - {d.description} ({d.severity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">CAPA Title / Objective</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              placeholder="e.g., Eliminate solder bridging on high-density circuit board line"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">5-Why Root Cause Analysis</label>
            <textarea
              rows={3}
              required
              value={formData.root_cause_analysis}
              onChange={(e) => setFormData({ ...formData, root_cause_analysis: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Action Plan</label>
            <textarea
              rows={3}
              required
              value={formData.action_plan}
              onChange={(e) => setFormData({ ...formData, action_plan: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Assigned Engineer</label>
              <input
                type="text"
                required
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Target Completion Date</label>
              <input
                type="date"
                required
                value={formData.target_completion_date}
                onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
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
              Register CAPA
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Verify & Close */}
      {selectedCapa && (
        <Modal
          isOpen={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
          title={`Effectiveness Verification: ${selectedCapa.capa_id}`}
          description="Document post-action audit evidence before formally closing out this CAPA."
        >
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500 font-semibold">Title:</span> {selectedCapa.title}
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Action Plan:</span> {selectedCapa.action_plan}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Verification Finding</label>
              <select
                value={verifyData.verification_status}
                onChange={(e) => setVerifyData({ ...verifyData, verification_status: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              >
                <option value="VERIFIED">VERIFIED (Corrective action proven effective)</option>
                <option value="REJECTED">REJECTED (Defect recurred, reopen investigation)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Review Evidence Notes</label>
              <textarea
                rows={3}
                required
                value={verifyData.notes}
                onChange={(e) => setVerifyData({ ...verifyData, notes: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
              >
                Confirm Verification & Close
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
