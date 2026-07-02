import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Sale } from '@/types';
import { Plus, Check, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const data = await api.sales.list();
      setSales(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Ventas</h1>
          <p className="mt-2 text-sm text-slate-400">
            Registro de ventas vinculadas a clientes y vehículos.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Registrar Venta
          </button>
        </div>
      </div>
      <div className="mt-8 overflow-hidden shadow-sm ring-1 ring-slate-800 sm:rounded-xl bg-slate-900/50">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950/50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sm:pl-6">Fecha</th>
              <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehículo / Cliente</th>
              <th className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio Venta</th>
              <th className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Pendiente</th>
              <th className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilidad Neta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-transparent">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500">Cargando...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500">No hay ventas registradas.</td></tr>
            ) : (
              sales.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-200 sm:pl-6">{formatDate(s.date)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                    <div>Vehículo: {s.vehicleId}</div>
                    <div>Cliente: {s.customerId}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-200 font-medium text-right">{formatCurrency(s.salePrice)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                    {s.pendingBalance > 0 ? (
                      <span className="inline-flex items-center text-red-400"><Clock className="h-4 w-4 mr-1"/>{formatCurrency(s.pendingBalance)}</span>
                    ) : (
                      <span className="inline-flex items-center text-emerald-400"><Check className="h-4 w-4 mr-1"/>Cancelado</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-indigo-400 font-bold text-right">{formatCurrency(s.netProfit)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
