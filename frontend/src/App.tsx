import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TraceabilityExplorer } from './pages/TraceabilityExplorer';
import { Products } from './pages/Products';
import { BOM } from './pages/BOM';
import { Suppliers } from './pages/Suppliers';
import { MaterialLots } from './pages/MaterialLots';
import { ProductionOrders } from './pages/ProductionOrders';
import { Consumption } from './pages/Consumption';
import { Machines } from './pages/Machines';
import { ProcessExecution } from './pages/ProcessExecution';
import { Inspections } from './pages/Inspections';
import { Defects } from './pages/Defects';
import { CAPA } from './pages/CAPA';
import { Exceptions } from './pages/Exceptions';
import { Analytics } from './pages/Analytics';
import { DataGenerator } from './pages/DataGenerator';
import { Validation } from './pages/Validation';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
        Verifying Session Credentials...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="bom" element={<BOM />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="material-lots" element={<MaterialLots />} />
            <Route path="production-orders" element={<ProductionOrders />} />
            <Route path="consumption" element={<Consumption />} />
            <Route path="machines" element={<Machines />} />
            <Route path="process-execution" element={<ProcessExecution />} />
            <Route path="inspections" element={<Inspections />} />
            <Route path="defects" element={<Defects />} />
            <Route path="traceability" element={<TraceabilityExplorer />} />
            <Route path="capa" element={<CAPA />} />
            <Route path="exceptions" element={<Exceptions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="data-generator" element={<DataGenerator />} />
            <Route path="validation" element={<Validation />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
