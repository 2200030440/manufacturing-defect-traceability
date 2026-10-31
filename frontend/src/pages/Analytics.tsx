import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart3, Download, RefreshCw, Calendar, TrendingDown, Layers, ShieldCheck } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const Analytics: React.FC = () => {
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [defectsTime, setDefectsTime] = useState<any[]>([]);
  const [defectsCat, setDefectsCat] = useState<any[]>([]);
  const [defectsSev, setDefectsSev] = useState<any[]>([]);
  const [supplierQual, setSupplierQual] = useState<any[]>([]);
  const [machineDef, setMachineDef] = useState<any[]>([]);
  const [inspectionTrends, setInspectionTrends] = useState<any[]>([]);
  const [scrapRework, setScrapRework] = useState<any[]>([]);
  const [capaStatus, setCapaStatus] = useState<any[]>([]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [timeData, catData, sevData, supData, machData, inspData, srData, capaData] =
        await Promise.all([
          api.getDefectsOverTime(days).catch(() => []),
          api.getDefectsByCategory().catch(() => []),
          api.getDefectsBySeverity().catch(() => []),
          api.getSupplierQuality().catch(() => []),
          api.getMachineDefects().catch(() => []),
          api.getInspectionTrends(days).catch(() => []),
          api.getScrapRework(days).catch(() => []),
          api.getCAPAStatus().catch(() => []),
        ]);

      setDefectsTime(timeData || []);
      setDefectsCat(catData || []);
      setDefectsSev(sevData || []);
      setSupplierQual((supData || []).slice(0, 10));
      setMachineDef((machData || []).slice(0, 10));
      setInspectionTrends(inspData || []);
      setScrapRework(srData || []);
      setCapaStatus(capaData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#ec4899', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-600" />
            Manufacturing Quality Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Statistical process control, non-conformance trends, vendor quality benchmarking, and scrap cost analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm"
          >
            <option value={30}>Rolling 30 Days</option>
            <option value={90}>Rolling 90 Days</option>
            <option value={180}>Rolling 180 Days</option>
            <option value={365}>Rolling 1 Year</option>
          </select>

          <button
            onClick={loadAnalytics}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition"
            title="Refresh Charts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid 1: Scrap vs Rework Yield Loss & Inspection Pass/Fail Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Scrap vs. Rework Unit Volume</h3>
          <p className="text-xs text-slate-400 mb-4">Cost and yield impact comparison</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scrapRework}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="scrap" name="Scrapped Units" fill="#ef4444" />
                <Bar dataKey="rework" name="Reworked Units" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Defect Rate Evolution (%)</h3>
          <p className="text-xs text-slate-400 mb-4">Percentage of inspected units failing gate</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inspectionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis unit="%" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="defect_rate"
                  name="Defect Rate %"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 2: Machine Failure Ranking & Supplier Quality Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Machine Defect Incident Frequency</h3>
          <p className="text-xs text-slate-400 mb-4">Equipment correlation analysis</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineDef} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis dataKey="machine_name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={110} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="defect_count" name="Incidents" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Supplier Defect Yield Ranking</h3>
          <p className="text-xs text-slate-400 mb-4">Vendor incoming lot quality</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierQual} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis dataKey="supplier_name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={110} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="defect_quantity" name="Defective Units" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
