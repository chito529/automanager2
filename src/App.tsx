/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithPopup, GoogleAuthProvider } from './lib/firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import CRM from './pages/CRM';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import GenericPage from './components/GenericPage';

import { SettingsProvider } from './contexts/SettingsContext';

function Login() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-lg max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-slate-200 mb-2 font-sans tracking-tight">AutoManager</h1>
        <p className="text-slate-400 mb-6 text-sm">Business Manager</p>
        <button
          onClick={handleLogin}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.6-4.53-5.34-4.53z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-indigo-500 animate-pulse font-sans">Loading AutoManager...</div>
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
