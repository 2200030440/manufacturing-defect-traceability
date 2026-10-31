import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  Search,
  GitMerge,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  Building2,
  Factory,
  Layers,
  FileSpreadsheet,
  PackageSearch,
  Cpu,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Badge, getStatusBadge } from '../components/common/Badge';

export const TraceabilityExplorer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'defect';

  const [searchType, setSearchType] = useState<string>(initialType);
  const [query, setQuery] = useState<string>(initialQuery);
  const [loading, setLoading] = useState<boolean>(false);
  const [traceData, setTraceData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'flow' | 'upstream' | 'downstream' | 'evidence'>('flow');

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, initialType);
    } else {
      // Load first defect to give an immediate wow factor
      api.getDefects('page=1&limit=1')
        .then((res) => {
          if (res?.items?.length > 0) {
            const firstId = res.items[0].defect_id;
            setQuery(firstId);
            setSearchType('defect');
            handleSearch(firstId, 'defect');
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSearch = async (searchTerm = query, type = searchType) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    setTraceData(null);
    try {
      let result;
      if (type === 'defect') {
        result = await api.traceDefect(searchTerm.trim());
      } else if (type === 'material_lot') {
        result = await api.traceDownstream(searchTerm.trim());
      } else {
        result = await api.searchTraceability(type, searchTerm.trim());
      }
      setTraceData(result);
      setSearchParams({ q: searchTerm.trim(), type });
    } catch (err: any) {
      setError(err.message || 'Traceability lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!traceData) return;
    const blob = new Blob([JSON.stringify(traceData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceability-report-${query || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <GitMerge className="h-7 w-7 text-brand-600" />
            End-to-End Traceability Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track multi-tier genealogy from Raw Material Lot & Supplier to Finished Good, Inspection, and Root-Cause CAPA.
          </p>
        </div>
        {traceData && (
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export Trace Dossier
          </button>
        )}
      </div>

      {/* Search Bar & Mode Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="w-full md:w-56">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="defect">Search by Defect ID</option>
              <option value="production_order">Search by Production Order ID</option>
              <option value="material_lot">Search by Material Lot ID</option>
              <option value="product">Search by Product SKU / ID</option>
              <option value="supplier">Search by Supplier ID</option>
              <option value="machine">Search by Machine ID</option>
              <option value="capa">Search by CAPA ID</option>
            </select>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter identifier (e.g., DEF-000001, ORD-000001, LOT-000001)..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Trace Entity
          </button>
        </form>

        {/* Quick Examples */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100 overflow-x-auto">
          <span className="font-semibold text-slate-400 uppercase">Quick Samples:</span>
          {['DEF-000001', 'DEF-000002', 'ORD-000001', 'LOT-000001'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                const type = sample.startsWith('DEF') ? 'defect' : sample.startsWith('ORD') ? 'production_order' : 'material_lot';
                setQuery(sample);
                setSearchType(type);
                handleSearch(sample, type);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <RefreshCw className="h-8 w-8 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Traversing Supply & Production Genealogy...</p>
          <p className="text-xs text-slate-400 mt-1">Correlating BOM revisions, consumption logs, and inspection reports</p>
        </div>
      )}

      {traceData && !loading && (
        <div className="space-y-6">
          {/* Integrity & Score Badge */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${
                  (traceData.traceability_score || 0) >= 80
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : (traceData.traceability_score || 0) >= 50
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {traceData.traceability_score || 0}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Traceability Chain Integrity
                  </h3>
                  {(traceData.missing_links?.length || 0) === 0 ? (
                    <Badge variant="success">COMPLETE 100% AUDITABLE</Badge>
                  ) : (
                    <Badge variant="warning">
                      {traceData.missing_links?.length} MISSING LINK(S)
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target Entity: <span className="font-mono font-semibold text-slate-800">{query}</span>
                </p>
              </div>
            </div>

            {/* Navigation tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('flow')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'flow' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                End-to-End Flow
              </button>
              <button
                onClick={() => setActiveTab('upstream')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'upstream' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upstream Supplier Root
              </button>
              <button
                onClick={() => setActiveTab('downstream')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'downstream' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Downstream Impact ({traceData.downstream_orders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'evidence' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Root-Cause Evidence
              </button>
            </div>
          </div>

          {/* Missing links alert if any */}
          {traceData.missing_links && traceData.missing_links.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Data Integrity Notice - Traceability Gaps Detected:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                {traceData.missing_links.map((link: string, idx: number) => (
                  <li key={idx}>{link}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 1: Visual Interactive Flow */}
          {activeTab === 'flow' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-brand-600" />
                End-to-End Genealogy Graph
              </h3>

              <div className="space-y-6 relative before:absolute before:left-7 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-200">
                {/* 1. Supplier Node */}
                <div className="relative flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                        Stage 1: Tier-1 Material Supplier
                      </span>
                      {traceData.supplier && (
                        <Badge variant="purple">Rating: {traceData.supplier.quality_rating}/100</Badge>
                      )}
                    </div>
                    {traceData.supplier ? (
                      <div className="mt-2 text-xs">
                        <div className="font-bold text-slate-900 text-sm">{traceData.supplier.name}</div>
                        <div className="text-slate-500 font-mono mt-0.5">ID: {traceData.supplier.supplier_id}</div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> No linked supplier identified
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Material Lot Node */}
                <div className="relative flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    <PackageSearch className="h-6 w-6" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                        Stage 2: Incoming Raw Material Lot
                      </span>
                      {traceData.material_lot && getStatusBadge(traceData.material_lot.quarantine_status)}
                    </div>
                    {traceData.material_lot ? (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Lot Number:</span>
                          <span className="font-mono font-semibold text-slate-900">{traceData.material_lot.lot_number}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Material:</span>
                          <span className="font-semibold text-slate-800">{traceData.material_lot.material_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Received Date:</span>
                          <span className="text-slate-700">{traceData.material_lot.received_date}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Material lot unlinked in consumption record
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Production Order & BOM */}
                <div className="relative flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    <Factory className="h-6 w-6" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                        Stage 3: Production Assembly & Finished Good
                      </span>
                      {traceData.production_order && getStatusBadge(traceData.production_order.status)}
                    </div>
                    {traceData.production_order ? (
                      <div className="mt-2 space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Order ID:</span>
                            <span className="font-mono font-semibold text-slate-900">{traceData.production_order.order_id}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Product / SKU:</span>
                            <span className="font-semibold text-slate-800">
                              {traceData.product?.name} ({traceData.product?.sku})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Planned / Actual:</span>
                            <span className="text-slate-700">
                              {traceData.production_order.planned_quantity} / {traceData.production_order.actual_quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> No production order found
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Inspection & Quality Defect */}
                <div className="relative flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                        Stage 4: Quality Gate & Defect Detection
                      </span>
                      {traceData.defect && getStatusBadge(traceData.defect.severity)}
                    </div>
                    {traceData.defect ? (
                      <div className="mt-2 space-y-2 text-xs">
                        <div className="font-bold text-slate-900 text-sm">
                          {traceData.defect.defect_id}: {traceData.defect.description}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Category:</span>
                            <span className="font-semibold">{traceData.defect.defect_category}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Defective Quantity:</span>
                            <span className="font-semibold text-rose-600">{traceData.defect.defect_quantity} units</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Detected:</span>
                            <span>{traceData.defect.detection_date}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-500">Inspection passed without defects</div>
                    )}
                  </div>
                </div>

                {/* 5. Corrective Action (CAPA) */}
                <div className="relative flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                        Stage 5: Corrective & Preventive Action (CAPA)
                      </span>
                      {traceData.corrective_actions?.length > 0 &&
                        getStatusBadge(traceData.corrective_actions[0].capa_status)}
                    </div>
                    {traceData.corrective_actions && traceData.corrective_actions.length > 0 ? (
                      <div className="mt-2 space-y-2 text-xs">
                        {traceData.corrective_actions.map((capa: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200">
                            <div className="font-bold text-slate-900">{capa.capa_id}: {capa.title}</div>
                            <div className="mt-1 text-slate-600">Action Plan: {capa.action_plan}</div>
                            <div className="mt-1 flex items-center gap-3 text-[11px]">
                              <span>Assigned: <strong>{capa.assigned_to || 'Quality Team'}</strong></span>
                              <span>Target: <strong>{capa.target_completion_date || 'N/A'}</strong></span>
                              <span>Verification: <strong>{capa.verification_status}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-500">No CAPA assigned to this record yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Upstream Supplier Root */}
          {activeTab === 'upstream' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-indigo-600" />
                Upstream Provenance & Supplier Pedigree
              </h3>
              <p className="text-xs text-slate-500">
                Identifies source supplier, receiving lot quarantine history, and certificates of analysis.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Supplier Information</h4>
                  {traceData.supplier ? (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Supplier Name:</span>
                        <span className="font-semibold text-slate-900">{traceData.supplier.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Supplier ID:</span>
                        <span className="font-mono text-slate-800">{traceData.supplier.supplier_id}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Quality Score:</span>
                        <span className="font-bold text-brand-600">{traceData.supplier.quality_rating} / 100</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Defect-Free Lots:</span>
                        <span className="text-emerald-600 font-semibold">{traceData.supplier.defect_free_percentage}%</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400">No supplier linked</p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Material Lot Specifications</h4>
                  {traceData.material_lot ? (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Lot Number:</span>
                        <span className="font-mono font-semibold text-slate-900">{traceData.material_lot.lot_number}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Material Name:</span>
                        <span className="font-semibold text-slate-800">{traceData.material_lot.material_name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Quarantine Status:</span>
                        <span>{getStatusBadge(traceData.material_lot.quarantine_status)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Remaining Balance:</span>
                        <span className="font-semibold text-slate-800">{traceData.material_lot.quantity_remaining} units</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400">No lot linked</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Downstream Impact */}
          {activeTab === 'downstream' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-brand-600" />
                    Downstream Impact Analysis
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All other production orders, finished goods, and batches that consumed this suspect material lot.
                  </p>
                </div>
                <Badge variant={traceData.downstream_orders?.length > 1 ? 'danger' : 'info'}>
                  {traceData.downstream_orders?.length || 0} Potentially Exposed Orders
                </Badge>
              </div>

              {traceData.downstream_orders && traceData.downstream_orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Production Order</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Quantity Consumed</th>
                        <th className="py-2.5 px-3">Order Status</th>
                        <th className="py-2.5 px-3">Defect Records</th>
                        <th className="py-2.5 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {traceData.downstream_orders.map((ord: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{ord.order_id}</td>
                          <td className="py-2.5 px-3">{ord.product_name || 'Standard Unit'}</td>
                          <td className="py-2.5 px-3">{ord.consumed_quantity}</td>
                          <td className="py-2.5 px-3">{getStatusBadge(ord.status)}</td>
                          <td className="py-2.5 px-3">
                            {ord.has_defect ? (
                              <Badge variant="danger">DEFECT REPORTED</Badge>
                            ) : (
                              <Badge variant="success">NO DEFECT</Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => {
                                setQuery(ord.order_id);
                                setSearchType('production_order');
                                handleSearch(ord.order_id, 'production_order');
                              }}
                              className="text-brand-600 hover:text-brand-800 font-semibold inline-flex items-center gap-1"
                            >
                              Trace <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-500">
                  No downstream production orders consumed this lot. Containment is isolated.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Evidence & Root Cause */}
          {activeTab === 'evidence' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                Root-Cause Evidence Assessment
              </h3>
              <p className="text-xs text-slate-500">
                Explicitly distinguishes confirmed causes from suspected causes with audit trail evidence.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Suspected Root Cause</span>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium">
                    {traceData.defect?.suspected_cause || 'Material variance or machine calibration drift'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Confirmed Root Cause</span>
                  <div className="p-3 bg-white rounded-lg border border-emerald-200 text-emerald-900 font-medium">
                    {traceData.defect?.confirmed_root_cause || 'Investigation underway via 5-Why analysis in CAPA'}
                  </div>
                </div>
              </div>

              {/* Process Executions & Machine correlation */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Correlated Manufacturing Process Step & Machine Logs
                </h4>
                {traceData.process_executions && traceData.process_executions.length > 0 ? (
                  <div className="space-y-2">
                    {traceData.process_executions.map((pe: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{pe.step_name}</span>
                          <span className="text-slate-500 ml-2 font-mono">({pe.machine_name} - {pe.machine_id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(pe.status)}
                          <span className="text-slate-500 text-[11px]">{pe.started_at}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No machine telemetry alerts logged for this order.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
