import React from 'react';
import { FileText, Plus } from 'lucide-react';

export default function Expenses() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Gastos por Vehículo</h1>
          <p className="mt-2 text-sm text-slate-400">
            Registre reparaciones, traslados y comisiones asociados a un vehículo.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500">
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Gasto
          </button>
        </div>
      </div>
      <div className="mt-8 bg-slate-900/50 shadow-sm border border-slate-800 sm:rounded-xl p-16 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-2 text-sm font-semibold text-slate-200">Sin gastos</h3>
        <p className="mt-1 text-sm text-slate-400">Comience agregando un nuevo gasto para un vehículo del inventario.</p>
      </div>
    </div>
  );
}
