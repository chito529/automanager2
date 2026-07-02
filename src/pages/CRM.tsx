import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Customer } from '@/types';
import { Plus, Phone, Mail, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function CRM() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await api.customers.list();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const columns = ['Nuevo', 'En seguimiento', 'Negociando', 'Ganado', 'Perdido'];

  return (
    <div className="h-full flex flex-col">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Clientes (CRM)</h1>
          <p className="mt-2 text-sm text-slate-400">
            Pipeline de ventas y seguimiento de clientes.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>Pipeline CRM
            </h2>
            <span className="text-xs text-slate-500">{columns.length} Etapas Mostradas</span>
          </div>
          <div className="flex-1 flex overflow-x-auto p-4 gap-4 custom-scrollbar bg-slate-950/20">
            {columns.map(status => (
              <div key={status} className="w-72 flex-shrink-0 flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{status}</h3>
                </div>
                <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                  {customers.filter(c => c.status === status).map(customer => (
                    <div key={customer.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 shadow-lg cursor-pointer hover:border-indigo-500/50 transition-colors">
                      <h4 className="text-xs font-medium text-slate-200">{customer.name}</h4>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-[10px] text-slate-400">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.phone || 'Sin teléfono'}
                        </div>
                        <div className="flex items-center text-[10px] text-slate-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(customer.firstContactDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {customers.filter(c => c.status === status).length === 0 && (
                    <div className="p-3 rounded-lg border border-slate-800 border-dashed text-center">
                      <p className="text-xs text-slate-500">Sin clientes</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
