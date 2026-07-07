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
import GenericPage from './components/GenericPage';

import { SettingsProvider } from './contexts/SettingsContext';

function Login() {
  const [email, setEmail] = useState('juanalmiron529@gmail.com');
  const [displayName, setDisplayName] = useState('Juan Admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    auth.signIn(email, displayName);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-lg max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-200 mb-2 font-sans tracking-tight">AutoManager</h1>
          <p className="text-slate-400 text-sm">Ingreso Local Segurizado</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre de Usuario (Opcional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Juan Admin"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
          <button
            onClick={() => auth.signIn('juanalmiron529@gmail.com', 'Juan Almiron')}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Ingreso Rápido (juanalmiron529@gmail.com)
          </button>
        </div>
      </div>
    </div>
  );
}

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

  if (!user) {
    return <Login />;
  }

  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="vehiculos" element={<Vehicles />} />
            <Route path="gastos" element={<Expenses />} />
            <Route path="crm" element={<CRM />} />
            <Route path="ventas" element={<Sales />} />
            <Route path="movimientos" element={<GenericPage title="Movimientos de Caja" description="Ingresos y egresos generales del negocio." />} />
            <Route path="cxc" element={<GenericPage title="Cuentas por Cobrar" description="Listado de clientes con saldos pendientes." />} />
            <Route path="cxp" element={<GenericPage title="Cuentas por Pagar" description="Listado de proveedores con saldos pendientes." />} />
            <Route path="alertas" element={<GenericPage title="Alertas y Recordatorios" description="Seguimientos, cuentas vencidas y vehículos en stock antiguo." />} />
            <Route path="reportes" element={<GenericPage title="Reportes Financieros" description="Reportes detallados y balances." />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
