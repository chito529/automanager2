/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from './lib/firebase';
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
        <h1 className="text-2xl font-bold text-slate-200 mb-2">AutoManager</h1>
        <p className="text-slate-400 mb-6 text-sm">Business Manager</p>
        <button
          onClick={handleLogin}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
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
        <div className="text-indigo-500">Loading...</div>
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
