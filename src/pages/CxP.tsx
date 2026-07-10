import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Account } from '@/types';
import { Plus, CheckCircle, Clock, Trash2, X, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';

export default function CxP() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();
  const { confirm } = useConfirmation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [entity, setEntity] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'Pendiente' | 'Pagado'>('Pendiente');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.accounts.list();
      // Filter only Accounts Payable ('Pagar')
      setAccounts(data.filter(acc => acc.type === 'Pagar'));
    } catch (e) {
      console.error('Error loading Accounts Payable:', e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEntity('');
    setAmount(0);
    setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 15 days from now
    setStatus('Pendiente');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: 'Pendiente' | 'Pagado') => {
    const nextStatus = currentStatus === 'Pendiente' ? 'Pagado' : 'Pendiente';
    try {
      setLoading(true);
      await api.accounts.updateStatus(id, nextStatus);
      await loadData();
    } catch (e) {
      console.error('Error updating account status:', e);
      alert('Error al actualizar el estado de pago de la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Cuenta por Pagar',
      message: '¿Está seguro de que desea eliminar esta cuenta por pagar? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      setLoading(true);
      await api.accounts.delete(id);
      await loadData();
    } catch (e) {
      console.error('Error deleting account:', e);
      alert('Error al eliminar cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity.trim()) {
      alert('Debe ingresar el nombre del proveedor.');
      return;
    }
    if (amount <= 0) {
      alert('El monto debe ser mayor a cero.');
      return;
    }
    if (!dueDate) {
      alert('Debe ingresar una fecha de vencimiento.');
      return;
    }

    const payload = {
      type: 'Pagar' as const,
      entity: entity.trim(),
      amount: Number(amount),
      dueDate,
      status
    };

    try {
      setLoading(true);
      await api.accounts.create(payload);
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Error creating account payable:', e);
      alert('Error al registrar cuenta por pagar');
    } finally {
      setLoading(false);
    }
  };

  const totalPending = accounts
    .filter(acc => acc.status === 'Pendiente')
    .reduce((sum, acc) => sum + acc.amount, 0);

  const totalPaid = accounts
    .filter(acc => acc.status === 'Pagado')
    .reduce((sum, acc) => sum + acc.amount, 0);

  // Check if an account is overdue
  const isOverdue = (acc: Account) => {
    if (acc.status === 'Pagado') return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return acc.dueDate < todayStr;
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Cuentas por Pagar (CxP)</h1>
          <p className="mt-2 text-sm text-slate-400">
            Seguimiento de deudas y saldos pendientes con proveedores, talleres mecánicos, gestores fiscales, escribanos y otros agentes.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={openAddModal}
            className="flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer shadow-lg"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nueva Cuenta por Pagar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl text-red-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto Total Pendiente de Pago</p>
            <p className="text-2xl font-bold text-red-400 mt-1 font-mono">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto Total Ya Pagado</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {accounts.length === 0 ? (
        <div className="bg-slate-900/50 shadow-sm border border-slate-800 sm:rounded-xl p-16 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-2 text-sm font-semibold text-slate-200">Sin cuentas por pagar registradas</h3>
          <p className="mt-1 text-sm text-slate-400">Excelente, no hay deudas registradas con proveedores en este momento.</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow-sm ring-1 ring-slate-800 sm:rounded-xl bg-slate-900/50">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sm:pl-6">Proveedor (Acreedor)</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vencimiento</th>
                <th scope="col" className="px-3 py-3.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Importe</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-transparent">
              {accounts.map(acc => {
                const overdue = isOverdue(acc);
                return (
                  <tr key={acc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                      <div className="text-sm font-semibold text-slate-200">{acc.entity}</div>
                      {overdue && (
                        <div className="flex items-center text-red-400 text-[10px] mt-0.5 font-medium gap-1">
                          <AlertCircle className="h-3 w-3" />
                          ¡Vencido / Overdue!
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 font-mono">
                      {formatDate(acc.dueDate)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-center text-sm">
                      <button
                        onClick={() => handleToggleStatus(acc.id, acc.status)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                          acc.status === 'Pagado'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/30'
                            : 'bg-red-950/40 text-red-400 border-red-900/50 hover:bg-red-900/30'
                        }`}
                        title="Haga clic para cambiar el estado de pago"
                      >
                        {acc.status === 'Pagado' ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Pagado
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5" />
                            Pendiente
                          </>
                        )}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-semibold font-mono text-slate-200">
                      {formatCurrency(acc.amount)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Nueva Cuenta por Pagar</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre del Proveedor (Acreedor) *</label>
                <input
                  type="text"
                  required
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ej. Taller El Amigo o Escribanía"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Importe (USD) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vencimiento *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estado Inicial</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('Pendiente')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${status === 'Pendiente' ? 'bg-red-950/40 border-red-500 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <Clock className="h-4 w-4" />
                    Pendiente
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Pagado')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${status === 'Pagado' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Pagado
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
