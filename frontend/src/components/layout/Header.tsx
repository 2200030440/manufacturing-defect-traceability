import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Bell,
  LogOut,
  User,
  Shield,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview Dashboard';
    const clean = path.replace('/', '').replace(/-/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route to Traceability Explorer with search query
    navigate(`/traceability?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">System</span>
        <span className="text-slate-300">/</span>
        <h2 className="text-sm font-semibold text-slate-800 capitalize">{getBreadcrumbs()}</h2>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleGlobalSearch} className="relative hidden md:block w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Global trace search (Defect, Order, Lot)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => navigate('/exceptions')}
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          title="Exceptions & Alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
          >
            <div className="h-7 w-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-medium text-slate-800 block leading-tight">
                {user?.full_name || 'Manufacturing Engineer'}
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight">
                {user?.roles?.[0]?.name?.toUpperCase() || 'OPERATIONS'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-1.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{user?.full_name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-brand-600 font-medium">
                  <Shield className="h-3 w-3" />
                  <span>{user?.roles?.map((r) => r.name).join(', ') || 'user'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile & Security
              </button>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
