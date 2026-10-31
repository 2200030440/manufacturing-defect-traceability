import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckSquare, Play, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const Validation: React.FC = () => {
  const [validationReport, setValidationReport] = useState<any>(null);
  const [anomaliesReport, setAnomaliesReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAllChecks = async () => {
    setLoading(true);
    try {
      const [valRes, anomRes] = await Promise.all([
        api.runValidation().catch(() => null),
        api.getAnomalies().catch(() => null),
      ]);
      setValidationReport(valRes);
      setAnomaliesReport(anomRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAllChecks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-brand-600" />
            Data Validation & Anomaly Detection Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated integrity verification verifying foreign keys, inspection arithmetic, BOM compliance, and CAPA gates.
          </p>
        </div>

        <button
          onClick={runAllChecks}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Run Validation Suite
        </button>
      </div>

      {/* Summary Scorecard */}
      {validationReport && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Passed Checks</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-950">
              {validationReport.summary?.passed ?? validationReport.checks?.filter((c: any) => c.status === 'PASSED').length ?? 0}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">Integrity rules conforming</p>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase">Anomalies Detected</span>
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-950">
              {anomaliesReport?.total_anomalies ?? 0}
            </div>
            <p className="text-[11px] text-rose-700 mt-1">Data discrepancy exceptions</p>
          </div>

          <div className="bg-brand-50 border border-brand-200 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-800 uppercase">Anomaly Categories</span>
              <ShieldCheck className="h-5 w-5 text-brand-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-brand-950">
              {anomaliesReport?.anomaly_types_detected?.length ?? 0} / 5
            </div>
            <p className="text-[11px] text-brand-700 mt-1">Tested against anomaly patterns</p>
          </div>
        </div>
      )}

      {/* 5 Anomaly Types Detected */}
      {anomaliesReport && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            Injected Anomaly Detection Results (5 Core Types)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Anomaly Type</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Record Identifier</th>
                  <th className="py-2.5 px-3">Description & Impact</th>
                  <th className="py-2.5 px-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anomaliesReport.anomalies?.map((a: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-rose-700">{a.anomaly_type}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{a.entity}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{a.record_id}</td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-sm">{a.description}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="danger">{a.severity}</Badge>
                    </td>
                  </tr>
                ))}
                {(!anomaliesReport.anomalies || anomaliesReport.anomalies.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Zero anomalies detected. All database relationships adhere to integrity constraints.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* General Validation Checks */}
      {validationReport && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Automated Database Integrity Checks
          </h3>

          <div className="space-y-3">
            {validationReport.checks?.map((c: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono">{c.check_name}</span>
                    <Badge variant={c.status === 'PASSED' ? 'success' : 'danger'}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-slate-600 mt-1">{c.message}</p>
                </div>
                {c.affected_count > 0 && (
                  <span className="font-mono font-bold text-rose-600 text-xs">
                    {c.affected_count} affected records
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
