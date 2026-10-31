import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  Building2,
  PackageSearch,
  Factory,
  Flame,
  Cpu,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  GitMerge,
  ShieldAlert,
  AlertOctagon,
  BarChart3,
  Database,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navSections = [
    {
      title: 'Operations & Core',
      items: [
        { label: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Products', path: '/products', icon: Layers },
        { label: 'Bill of Materials', path: '/bom', icon: FileSpreadsheet },
        { label: 'Suppliers', path: '/suppliers', icon: Building2 },
        { label: 'Material Lots', path: '/material-lots', icon: PackageSearch },
        { label: 'Production Orders', path: '/production-orders', icon: Factory },
        { label: 'Material Consumption', path: '/consumption', icon: Flame },
        { label: 'Machines', path: '/machines', icon: Cpu },
        { label: 'Process Execution', path: '/process-execution', icon: GitCommit },
      ],
    },
    {
      title: 'Quality & Traceability',
      items: [
        { label: 'Quality Inspections', path: '/inspections', icon: CheckCircle2 },
        { label: 'Defect Management', path: '/defects', icon: AlertTriangle },
        { label: 'Traceability Explorer', path: '/traceability', icon: GitMerge, highlight: true },
        { label: 'Corrective Actions (CAPA)', path: '/capa', icon: ShieldAlert },
        { label: 'Exception Management', path: '/exceptions', icon: AlertOctagon },
      ],
    },
    {
      title: 'Intelligence & System',
      items: [
        { label: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
        { label: 'Data Generator', path: '/data-generator', icon: Database },
        { label: 'Data Validation', path: '/validation', icon: CheckSquare },
        { label: 'System Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col border-r border-slate-800 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/60">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <GitMerge className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-base tracking-wide text-white block">TRACE-Q</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                Manufacturing MES
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg">
            <GitMerge className="h-5 w-5" />
          </div>
        )}

        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            {!collapsed && (
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {sec.title}
              </h4>
            )}
            <div className="space-y-1">
              {sec.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                        : item.highlight
                        ? 'text-sky-300 hover:bg-slate-800/80 hover:text-white border border-sky-500/20 bg-sky-500/5'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0 group-hover:scale-105 transition-transform" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
        {!collapsed ? (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Plant Node #01</span>
            </div>
            <span className="text-slate-500 font-mono">v1.0</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
};
