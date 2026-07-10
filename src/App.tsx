/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { auth, AuthUser } from './lib/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import CRM from './pages/CRM';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Movimientos from './pages/Movimientos';
import CxC from './pages/CxC';
import CxP from './pages/CxP';
import Alertas from './pages/Alertas';
import Reportes from './pages/Reportes';

import { SettingsProvider } from './contexts/SettingsContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-indigo-500 animate-pulse font-sans text-sm">Cargando AutoManager...</div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <ConfirmationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="vehiculos" element={<Vehicles />} />
              <Route path="gastos" element={<Expenses />} />
              <Route path="crm" element={<CRM />} />
              <Route path="ventas" element={<Sales />} />
              <Route path="movimientos" element={<Movimientos />} />
              <Route path="cxc" element={<CxC />} />
              <Route path="cxp" element={<CxP />} />
              <Route path="alertas" element={<Alertas />} />
              <Route path="reportes" element={<Reportes />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfirmationProvider>
    </SettingsProvider>
  );
}
