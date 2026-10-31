import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExceptionRecord } from '../types';
import { AlertOctagon, CheckCircle2, Search, ArrowUpRight, Wrench } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useNavigate } from 'react-router-dom';

export const Exceptions: React.FC = () => {
  const navigate = useNavigate();
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEx, setSelectedEx] = useState<ExceptionRecord | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('Audited genealogy record and re-linked missing foreign key constraint.');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');

      const data = await api.getExceptions(params.toString());
      setExceptions(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEx) return;
    try {
      await api.resolveException(selectedEx.id, {
        resolution_notes: resolutionNotes,
      });
      setSelectedEx(null);
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
            <AlertOctagon className="h-6 w-6 text-rose-600" />
            Data Integrity & Traceability Exception Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated detection of data discrepancies, broken lot pedigree chains, and orphan records.
          </p>
        </div>

        <button
          onClick={() => navigate('/validation')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          Run Full Anomaly Suite
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
              placeholder="Search exceptions by entity or description..."
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
            <option value="">All Resolution States</option>
            <option value="OPEN">Open (Requires Remediation)</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {exceptions.length} exceptions flagged
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Exception ID</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Anomaly Description</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Detected At</th>
                <th className="py-3 px-4 text-right">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exceptions.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{ex.exception_id}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{ex.entity_type}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{ex.entity_id}</span>
                  </td>
                  <td className="py-3 px-4 max-w-sm text-slate-700">{ex.description}</td>
                  <td className="py-3 px-4">{getStatusBadge(ex.severity)}</td>
                  <td className="py-3 px-4">{getStatusBadge(ex.resolution_status)}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{ex.identified_at}</td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {ex.resolution_status === 'OPEN' ? (
                      <button
                        onClick={() => setSelectedEx(ex)}
                        className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-[11px] font-semibold transition"
                      >
                        Resolve Exception
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-semibold text-[11px] inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Resolved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {exceptions.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No data exceptions detected. Traceability database is 100% compliant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      {selectedEx && (
        <Modal
          isOpen={!!selectedEx}
          onClose={() => setSelectedEx(null)}
          title={`Remediate Data Exception: ${selectedEx.exception_id}`}
          description="Log corrective resolution notes for this data anomaly."
        >
          <form onSubmit={handleResolve} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500 font-semibold">Entity:</span> {selectedEx.entity_type} ({selectedEx.entity_id})
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Anomaly:</span> {selectedEx.description}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Corrective Resolution Actions</label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedEx(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
              >
                Confirm Resolution
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
