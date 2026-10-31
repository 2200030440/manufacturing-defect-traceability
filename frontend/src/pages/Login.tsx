import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GitMerge, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@manufacturing.com');
  const [password, setPassword] = useState('Admin@123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-brand-500/25">
            <GitMerge className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white">
          TRACE-Q Platform
        </h2>
        <p className="mt-1 text-center text-xs uppercase tracking-widest font-semibold text-slate-400">
          Manufacturing Defect Traceability & CAPA Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Work Email
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="admin@manufacturing.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              <span>1-Click Demo Profiles</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@manufacturing.com', 'Admin@123456')}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition group"
              >
                <div className="font-semibold text-slate-800 flex items-center gap-1 group-hover:text-brand-600">
                  <CheckCircle2 className="h-3 w-3 text-brand-500" />
                  Admin
                </div>
                <div className="text-[10px] text-slate-500">Full System Control</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('quality@manufacturing.com', 'Quality@123456')}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition group"
              >
                <div className="font-semibold text-slate-800 flex items-center gap-1 group-hover:text-brand-600">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Quality Lead
                </div>
                <div className="text-[10px] text-slate-500">Defects & CAPA</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('planner@manufacturing.com', 'Planner@123456')}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition group"
              >
                <div className="font-semibold text-slate-800 flex items-center gap-1 group-hover:text-brand-600">
                  <CheckCircle2 className="h-3 w-3 text-amber-500" />
                  Planner
                </div>
                <div className="text-[10px] text-slate-500">Orders & Materials</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operator@manufacturing.com', 'Operator@123456')}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition group"
              >
                <div className="font-semibold text-slate-800 flex items-center gap-1 group-hover:text-brand-600">
                  <CheckCircle2 className="h-3 w-3 text-sky-500" />
                  Operator
                </div>
                <div className="text-[10px] text-slate-500">Execution & Logs</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
