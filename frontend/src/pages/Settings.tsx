import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Shield, Database, Users, Check, Lock } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  const rolesMatrix = [
    {
      role: 'admin',
      label: 'System / OT-IT Administrator',
      desc: 'Unrestricted full access across all modules, data generation, and user role provisioning.',
      permissions: ['Manage Users', 'Execute Data Generator', 'All CRUD Operations', 'Remediate Exceptions'],
    },
    {
      role: 'quality_engineer',
      label: 'Quality Engineer Lead',
      desc: 'Quality gates, defect logging, containment actions, 5-Why CAPA, and effectiveness verification.',
      permissions: ['Inspection Plans & Audits', 'Defect Management', 'CAPA Closure Gate', 'Traceability Explorer'],
    },
    {
      role: 'production_planner',
      label: 'Production Planning Specialist',
      desc: 'Production scheduling, BOM configuration, supplier onboarding, and material lot receiving.',
      permissions: ['Products & BOM Revisions', 'Production Orders Dispatch', 'Supplier & Lot Management'],
    },
    {
      role: 'plant_operator',
      label: 'Manufacturing Plant Operator',
      desc: 'Shopfloor process execution, machine run telemetry parameter logging, and material consumption.',
      permissions: ['Process Step Executions', 'Material Issuance Logs', 'Machine Telemetry View'],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-brand-600" />
          System Settings & Role-Based Access Control
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Active session identity, role permission matrix, and platform environment configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{user?.full_name || 'System User'}</h3>
              <p className="text-xs text-slate-500">{user?.email || 'admin@manufacturing.com'}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-800">{user?.department || 'Operations'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Roles:</span>
              <div className="flex gap-1">
                {user?.roles?.map((r) => (
                  <Badge key={r.id} variant="purple">
                    {r.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Authentication:</span>
              <span className="font-mono text-emerald-600 font-semibold">JWT Bearer (HS256)</span>
            </div>
          </div>
        </div>

        {/* Database & Environment Info */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-600" />
            Environment & Database Topology
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold">Backend Engine:</span>
              <div className="font-mono font-bold text-slate-800">FastAPI 0.115 / Python 3.14</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold">Database Engine:</span>
              <div className="font-mono font-bold text-slate-800">Relational SQLite / PostgreSQL</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold">API Documentation:</span>
              <a
                href="http://localhost:8000/api/docs"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-brand-600 hover:underline block"
              >
                /api/docs (OpenAPI Swagger)
              </a>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold">Deterministic Seed:</span>
              <div className="font-mono font-bold text-brand-600">20261022</div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Shield className="h-4 w-4 text-brand-600" />
          Manufacturing Role-Based Access Control (RBAC) Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rolesMatrix.map((rm) => (
            <div key={rm.role} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{rm.label}</span>
                <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded uppercase font-semibold">
                  {rm.role}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">{rm.desc}</p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                {rm.permissions.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-700 font-medium"
                  >
                    <Check className="h-3 w-3 text-emerald-600" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
