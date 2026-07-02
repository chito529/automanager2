import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Vehicle } from '@/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await api.vehicles.list();
      setVehicles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Comprado': 'bg-blue-100 text-blue-800',
      'En preparación': 'bg-yellow-100 text-yellow-800',
      'Publicado': 'bg-green-100 text-green-800',
      'Reservado': 'bg-purple-100 text-purple-800',
      'Vendido': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Vehículos</h1>
          <p className="mt-2 text-sm text-slate-400">
            Gestión de inventario de vehículos, costos y precios.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Vehículo
          </button>
        </div>
      </div>
      
      {/* Filters can be added here */}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm ring-1 ring-slate-800 sm:rounded-xl bg-slate-900/50">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sm:pl-6">Vehículo</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Año</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Costo Total</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio Venta</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-transparent">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-500">Cargando...</td>
                    </tr>
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-500">No hay vehículos registrados.</td>
                    </tr>
                  ) : (
                    vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="font-medium text-slate-200">{v.brand} {v.model}</div>
                          <div className="text-[10px] text-slate-500">VIN: {v.vin}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">{v.year}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset ${getStatusColor(v.status)}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 text-right">{formatCurrency(v.purchasePrice)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-indigo-400 font-medium text-right">{formatCurrency(v.salePrice)}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button className="text-slate-400 hover:text-indigo-400 mr-4 transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="text-slate-400 hover:text-red-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
