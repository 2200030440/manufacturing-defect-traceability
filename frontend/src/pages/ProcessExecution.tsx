import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProductionStepExecution, ProductionOrder, ProcessStep, Machine } from '../types';
import { Plus, GitCommit, Search, CheckCircle2, Clock, Play } from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const ProcessExecution: React.FC = () => {
  const [executions, setExecutions] = useState<ProductionStepExecution[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    production_order_id: '',
    process_step_id: '',
    machine_id: '',
    status: 'IN_PROGRESS',
    parameter_temp: 245,
    parameter_pressure: 4.2,
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');

      const [execData, ordData, stepData, machData] = await Promise.all([
        api.getStepExecutions(params.toString()),
        api.getProductionOrders('limit=100'),
        api.getProcessSteps(),
        api.getMachines('limit=100'),
      ]);
      setExecutions(execData.items || []);
      setOrders(ordData.items || []);
      setSteps(Array.isArray(stepData) ? stepData : stepData.items || []);
      setMachines(machData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleComplete = async (id: number) => {
    try {
      await api.completeStepExecution(id, { status: 'COMPLETED' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.startStepExecution({
        production_order_id: Number(formData.production_order_id),
        process_step_id: Number(formData.process_step_id),
        machine_id: Number(formData.machine_id),
        status: formData.status,
        parameters_logged: {
          temperature_c: Number(formData.parameter_temp),
          pressure_bar: Number(formData.parameter_pressure),
        },
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to start execution');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GitCommit className="h-6 w-6 text-brand-600" />
            Manufacturing Process Execution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time step telemetry, equipment bindings, cycle run times, and operating parameters.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Dispatch Process Step
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Execution ID</th>
                <th className="py-3 px-4">Job Order</th>
                <th className="py-3 px-4">Process Step</th>
                <th className="py-3 px-4">Machine Assigned</th>
                <th className="py-3 px-4">Logged Parameters</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {executions.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{ex.execution_id}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    {ex.production_order?.order_id || `ORD #${ex.production_order_id}`}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {ex.process_step?.name || `Step #${ex.process_step_id}`}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono">
                    {ex.machine?.name || `Machine #${ex.machine_id}`}
                  </td>
                  <td className="py-3 px-4">
                    {ex.parameters_logged ? (
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {JSON.stringify(ex.parameters_logged)}
                      </span>
                    ) : (
                      <span className="text-slate-400">Nominal</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(ex.status)}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{ex.started_at}</td>
                  <td className="py-3 px-4 text-right">
                    {ex.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleComplete(ex.id)}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold transition"
                      >
                        Complete Step
                      </button>
                    )}
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
        title="Start Process Step Execution"
        description="Bind a manufacturing order to a workstation machine and initiate telemetry logging."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Target Job Order</label>
            <select
              required
              value={formData.production_order_id}
              onChange={(e) => setFormData({ ...formData, production_order_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Production Order...</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_id} ({o.product?.name}) - {o.production_status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Process Step</label>
            <select
              required
              value={formData.process_step_id}
              onChange={(e) => setFormData({ ...formData, process_step_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Step...</option>
              {steps.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.step_sequence} {s.name} ({s.step_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Operating Machine</label>
            <select
              required
              value={formData.machine_id}
              onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="">Select Machine...</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.machine_id}) - {m.line_location}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Telemetry Temp (°C)</label>
              <input
                type="number"
                value={formData.parameter_temp}
                onChange={(e) => setFormData({ ...formData, parameter_temp: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">Pressure (Bar)</label>
              <input
                type="number"
                step="0.1"
                value={formData.parameter_pressure}
                onChange={(e) => setFormData({ ...formData, parameter_pressure: Number(e.target.value) })}
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
              Start Execution Run
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
