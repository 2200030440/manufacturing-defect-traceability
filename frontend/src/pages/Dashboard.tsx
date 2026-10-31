import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardKPIs, RecentActivity } from '../types';
import { StatsCard } from '../components/common/StatsCard';
import {
  Layers,
  Building2,
  PackageSearch,
  Factory,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Flame,
  ShieldAlert,
  GitMerge,
  AlertOctagon,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
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

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [defectsTime, setDefectsTime] = useState<any[]>([]);
  const [defectsCat, setDefectsCat] = useState<any[]>([]);
  const [defectsSev, setDefectsSev] = useState<any[]>([]);
  const [supplierQual, setSupplierQual] = useState<any[]>([]);
  const [machineDef, setMachineDef] = useState<any[]>([]);
  const [inspectionTrends, setInspectionTrends] = useState<any[]>([]);
  const [capaStatus, setCapaStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(90);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        kpiData,
        actData,
        timeData,
        catData,
        sevData,
        supData,
        machData,
        trendData,
        capaData,
      ] = await Promise.all([
        api.getKPIs().catch(() => null),
        api.getRecentActivity().catch(() => []),
        api.getDefectsOverTime(timeRange).catch(() => []),
        api.getDefectsByCategory().catch(() => []),
        api.getDefectsBySeverity().catch(() => []),
        api.getSupplierQuality().catch(() => []),
        api.getMachineDefects().catch(() => []),
        api.getInspectionTrends(timeRange).catch(() => []),
        api.getCAPAStatus().catch(() => []),
      ]);

      if (kpiData) setKpis(kpiData);
      setRecentActivities(actData || []);
      setDefectsTime(timeData || []);
      setDefectsCat(catData || []);
      setDefectsSev(sevData || []);
      setSupplierQual((supData || []).slice(0, 6));
      setMachineDef((machData || []).slice(0, 6));
      setInspectionTrends(trendData || []);
      setCapaStatus(capaData || []);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#ec4899', '#10b981', '#ef4444', '#8b5cf6'];
  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#3b82f6',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Plant Quality & Operations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time manufacturing defect traceability, production metrics, and CAPA resolution tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-brand-500/20"
          >
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={180}>Last 180 Days</option>
            <option value={365}>Last 1 Year</option>
          </select>

          <button
            onClick={fetchData}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (14 Mandatory KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatsCard
          title="Products"
          value={kpis?.total_products ?? 0}
          icon={Layers}
          color="indigo"
          onClick={() => navigate('/products')}
        />
        <StatsCard
          title="Suppliers"
          value={kpis?.total_suppliers ?? 0}
          icon={Building2}
          color="blue"
          onClick={() => navigate('/suppliers')}
        />
        <StatsCard
          title="Material Lots"
          value={kpis?.total_material_lots ?? 0}
          icon={PackageSearch}
          color="slate"
          onClick={() => navigate('/material-lots')}
        />
        <StatsCard
          title="Prod Orders"
          value={kpis?.total_production_orders ?? 0}
          icon={Factory}
          color="blue"
          onClick={() => navigate('/production-orders')}
        />
        <StatsCard
          title="Units Produced"
          value={kpis?.total_units_produced ? Number(kpis.total_units_produced).toLocaleString() : '0'}
          icon={Flame}
          color="amber"
          onClick={() => navigate('/production-orders')}
        />
        <StatsCard
          title="Inspections"
          value={kpis?.total_inspections ?? 0}
          icon={CheckCircle2}
          color="emerald"
          onClick={() => navigate('/inspections')}
        />
        <StatsCard
          title="Total Defects"
          value={kpis?.total_defects ?? 0}
          icon={AlertTriangle}
          color="rose"
          onClick={() => navigate('/defects')}
        />

        <StatsCard
          title="Defect Rate"
          value={`${kpis?.overall_defect_rate ?? 0}%`}
          icon={Percent}
          color={Number(kpis?.overall_defect_rate || 0) > 5 ? 'rose' : 'emerald'}
          onClick={() => navigate('/defects')}
        />
        <StatsCard
          title="Scrap Quantity"
          value={kpis?.scrap_quantity ? Number(kpis.scrap_quantity).toLocaleString() : '0'}
          icon={AlertTriangle}
          color="rose"
          onClick={() => navigate('/production-orders')}
        />
        <StatsCard
          title="Rework Quantity"
          value={kpis?.rework_quantity ? Number(kpis.rework_quantity).toLocaleString() : '0'}
          icon={Flame}
          color="amber"
          onClick={() => navigate('/production-orders')}
        />
        <StatsCard
          title="Open CAPA"
          value={kpis?.open_capa ?? 0}
          icon={ShieldAlert}
          color="rose"
          onClick={() => navigate('/capa')}
        />
        <StatsCard
          title="Pending Verify"
          value={kpis?.pending_verification ?? 0}
          icon={ShieldAlert}
          color="amber"
          onClick={() => navigate('/capa')}
        />
        <StatsCard
          title="Traceability"
          value={`${kpis?.traceability_coverage ?? 0}%`}
          icon={GitMerge}
          color="emerald"
          onClick={() => navigate('/traceability')}
        />
        <StatsCard
          title="Exceptions"
          value={kpis?.data_quality_exceptions ?? 0}
          icon={AlertOctagon}
          color={Number(kpis?.data_quality_exceptions || 0) > 0 ? 'rose' : 'emerald'}
          onClick={() => navigate('/exceptions')}
        />
      </div>

      {/* Main Charts Row 1: Defect Frequency Over Time & Pass/Fail Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defects Over Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Defects Detected Over Time</h3>
              <p className="text-xs text-slate-400">Daily defect discovery volume</p>
            </div>
            <button
              onClick={() => navigate('/defects')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              View Records <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={defectsTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Defects Count"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass vs Fail Quality Inspection Trends */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Inspection Pass vs. Fail Trends</h3>
              <p className="text-xs text-slate-400">Quality gate yield performance</p>
            </div>
            <button
              onClick={() => navigate('/inspections')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              View Inspections <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspectionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="passed" name="Passed Qty" fill="#10b981" stackId="a" />
                <Bar dataKey="failed" name="Failed Qty" fill="#ef4444" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Defects By Category & Severity Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Defects By Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Defects by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Pareto distribution of failure modes</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defectsCat}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {defectsCat.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defects by Severity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Defects by Severity</h3>
          <p className="text-xs text-slate-400 mb-4">Critical vs High risk classification</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectsSev} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis dataKey="severity" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={60} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="count" name="Count">
                  {defectsSev.map((entry, index) => (
                    <Cell
                      key={`sev-${index}`}
                      fill={SEVERITY_COLORS[entry.severity] || '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CAPA Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">CAPA Resolution Status</h3>
          <p className="text-xs text-slate-400 mb-4">Active containment & closed actions</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={capaStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {capaStatus.map((entry, index) => (
                    <Cell key={`capa-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Supplier Quality, Machine Defect Comparison & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Quality Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Top Supplier Quality Ranking</h3>
            <button
              onClick={() => navigate('/suppliers')}
              className="text-xs text-brand-600 font-semibold"
            >
              All Suppliers
            </button>
          </div>
          <div className="space-y-3">
            {supplierQual.map((sup, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 last:border-0">
                <div className="truncate max-w-[150px]">
                  <div className="font-semibold text-slate-800 truncate">{sup.supplier_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{sup.supplier_id}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-brand-600">{sup.quality_rating}/100</span>
                  <div className="text-[10px] text-rose-500 font-medium">{sup.defect_quantity} defects</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Machine Defect Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Machine Defect Correlation</h3>
            <button
              onClick={() => navigate('/machines')}
              className="text-xs text-brand-600 font-semibold"
            >
              All Machines
            </button>
          </div>
          <div className="space-y-3">
            {machineDef.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 last:border-0">
                <div className="truncate max-w-[150px]">
                  <div className="font-semibold text-slate-800 truncate">{m.machine_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{m.machine_id}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800">{m.defect_count} incidents</span>
                  <div className="text-[10px] text-slate-500">{m.defect_quantity} units</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Stream */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" />
              Live Manufacturing Audit Trail
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-Time</span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pr-1">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs pb-2.5 border-b border-slate-50 last:border-0">
                <div className="h-2 w-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 leading-snug truncate">
                    {act.description}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-mono text-slate-500 font-semibold">{act.entity_id}</span>
                    <span>•</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No recent events logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
