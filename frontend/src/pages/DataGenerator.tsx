import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Database, Play, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const DataGenerator: React.FC = () => {
  const [config, setConfig] = useState({
    seed: 20261022,
    n_products: 50,
    n_suppliers: 20,
    n_lots: 200,
    n_orders: 500,
    n_inspections: 1000,
    include_anomalies: true,
  });

  const [status, setStatus] = useState<any>({
    running: false,
    progress: 0,
    message: 'Generator ready',
    completed: false,
  });
  const [triggerMessage, setTriggerMessage] = useState('');

  const checkStatus = async () => {
    try {
      const res = await api.getGenerationStatus();
      setStatus(res);
    } catch (e) {
      // quiet
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriggerMessage('');
    try {
      const res = await api.triggerGeneration(config);
      setTriggerMessage(res.message || 'Generation initiated in background');
      checkStatus();
    } catch (err: any) {
      setTriggerMessage(err.message || 'Failed to start generation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-brand-600" />
            Deterministic Synthetic Data Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reproducible enterprise manufacturing data generation with realistic defect distributions and anomaly injections.
          </p>
        </div>

        <Badge variant={status.running ? 'warning' : 'success'}>
          {status.running ? 'GENERATOR RUNNING' : 'SYSTEM IDLE'}
        </Badge>
      </div>

      {/* Progress Card if running */}
      {status.running && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
              {status.message}
            </span>
            <span>{status.progress}%</span>
          </div>
          <div className="w-full bg-amber-200/60 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(10, status.progress)}%` }}
            />
          </div>
        </div>
      )}

      {triggerMessage && !status.running && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{triggerMessage}</span>
        </div>
      )}

      {/* Config Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Generator Parameters Configuration
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Reproducibility Seed (Fixed)
                </label>
                <input
                  type="number"
                  required
                  value={config.seed}
                  onChange={(e) => setConfig({ ...config, seed: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Default: 20261022 (Guarantees identical data structure)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Number of Finished Products
                </label>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  required
                  value={config.n_products}
                  onChange={(e) => setConfig({ ...config, n_products: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Number of Material Suppliers
                </label>
                <input
                  type="number"
                  min="2"
                  max="500"
                  required
                  value={config.n_suppliers}
                  onChange={(e) => setConfig({ ...config, n_suppliers: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Raw Material Lots
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  required
                  value={config.n_lots}
                  onChange={(e) => setConfig({ ...config, n_lots: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Production Orders
                </label>
                <input
                  type="number"
                  min="10"
                  max="20000"
                  required
                  value={config.n_orders}
                  onChange={(e) => setConfig({ ...config, n_orders: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Inspection Audits
                </label>
                <input
                  type="number"
                  min="20"
                  max="50000"
                  required
                  value={config.n_inspections}
                  onChange={(e) => setConfig({ ...config, n_inspections: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <input
                type="checkbox"
                id="include_anomalies"
                checked={config.include_anomalies}
                onChange={(e) => setConfig({ ...config, include_anomalies: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="include_anomalies" className="text-xs font-semibold text-slate-700">
                Inject Edge-Case Anomalies (Tests Data Integrity & Exception Catchers)
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={status.running}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4 fill-white" />
                {status.running ? 'Generation In Progress...' : 'Execute Synthetic Generation'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="h-10 w-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-white text-sm font-bold">Deterministic Reproducibility</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              When given the fixed seed <code className="text-brand-300">20261022</code>, the generator creates mathematically identical suppliers, material lots, inspection failures, and traceability chains every single time.
            </p>

            <div className="mt-5 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Enforces strict BOM component consumption</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Simulates realistic supplier failure rates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Generates 5-Why root-cause investigation records</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl text-[11px] text-slate-400 font-mono">
            CLI: python -m data_generator.generator
          </div>
        </div>
      </div>
    </div>
  );
};
