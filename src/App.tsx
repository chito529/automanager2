/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import CRM from './pages/CRM';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import GenericPage from './components/GenericPage';

import { SettingsProvider } from './contexts/SettingsContext';

export default function App() {
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
