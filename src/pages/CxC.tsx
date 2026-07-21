import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Account, AccountStatus } from '@/types';
import { Plus, CheckCircle, Clock, Trash2, X, AlertCircle, FileSpreadsheet, Edit3 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';

export default function CxC() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();
  const { confirm } = useConfirmation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Form State
  const [entity, setEntity] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<AccountStatus>('Pendiente');
  const [description, setDescription] = useState('');

  // Payment State
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.accounts.list();
      // Filter only Accounts Receivable ('Cobrar')
      setAccounts(data.filter(acc => acc.type === 'Cobrar'));
    } catch (e) {
      console.error('Error loading Accounts Receivable:', e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEntity('');
    setAmount(0);
    setDescription('');
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 days from now
    setStatus('Pendiente');
    setIsModalOpen(true);
  };

  const openPaymentModal = (acc: Account) => {
    setSelectedAccount(acc);
    setPaymentAmount(acc.amount - (acc.paidAmount || 0));
    setIsPaymentModalOpen(true);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    if (paymentAmount <= 0) {
      alert('El monto a pagar debe ser mayor a cero.');
      return;
    }

    const currentPaid = selectedAccount.paidAmount || 0;
    const newPaidAmount = currentPaid + paymentAmount;
    
    let newStatus: AccountStatus = 'Parcial';
    if (newPaidAmount >= selectedAccount.amount) {
      newStatus = 'Pagado';
    }

    try {
      setLoading(true);
      
      const payload = {
        paidAmount: newPaidAmount,
        status: newStatus
      };
      
      await api.accounts.update(selectedAccount.id, payload);

      setIsPaymentModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Error registering payment:', e);
      alert('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Cuenta por Cobrar',
      message: '¿Está seguro de que desea eliminar esta cuenta por cobrar? Esta acción no se puede deshacer.',
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
      alert('Debe ingresar el nombre del cliente.');
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
      type: 'Cobrar' as const,
      entity: entity.trim(),
      amount: Number(amount),
      paidAmount: 0,
      dueDate,
      description,
      status
    };

    try {
      setLoading(true);
      await api.accounts.create(payload);
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Error creating account receivable:', e);
      alert('Error al registrar cuenta por cobrar');
    } finally {
      setLoading(false);
    }
  };

  const totalPending = accounts
    .filter(acc => acc.status !== 'Pagado')
    .reduce((sum, acc) => sum + (acc.amount - (acc.paidAmount || 0)), 0);

  const totalCollected = accounts
    .reduce((sum, acc) => sum + (acc.paidAmount || (acc.status === 'Pagado' ? acc.amount : 0)), 0);

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
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Cuentas por Cobrar (CxC)</h1>
          <p className="mt-2 text-sm text-slate-400">
            Control de saldos pendientes de clientes, cuotas y pagos parciales.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={openAddModal}
            className="flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer shadow-lg"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-yellow-950/40 border border-yellow-900/60 rounded-xl text-yellow-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pendiente</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1 font-mono">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cobrado</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(totalCollected)}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {accounts.length === 0 ? (
        <div className="bg-slate-900/50 shadow-sm border border-slate-800 sm:rounded-xl p-16 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-2 text-sm font-semibold text-slate-200">Sin cuentas por cobrar registradas</h3>
          <p className="mt-1 text-sm text-slate-400">Todos los cobros están al día o no se han cargado transacciones.</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow-sm ring-1 ring-slate-800 sm:rounded-xl bg-slate-900/50">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sm:pl-6">Cliente (Deudor)</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vencimiento</th>
                <th scope="col" className="px-3 py-3.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo / Importe</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-transparent">
              {accounts.map(acc => {
                const overdue = isOverdue(acc);
                const isPaid = acc.status === 'Pagado';
                const isPartial = acc.status === 'Parcial';
                
                let statusColor = 'bg-yellow-950/40 text-yellow-400 border-yellow-900/50 hover:bg-yellow-900/30';
                if (isPaid) statusColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/30';
                if (isPartial) statusColor = 'bg-blue-950/40 text-blue-400 border-blue-900/50 hover:bg-blue-900/30';
                if (overdue && !isPaid) statusColor = 'bg-red-950/40 text-red-400 border-red-900/50 hover:bg-red-900/30';

                return (
                  <tr key={acc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                      <div className="text-sm font-semibold text-slate-200">{acc.entity}</div>
                      {acc.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{acc.description}</div>
                      )}
                      {overdue && !isPaid && (
                        <div className="flex items-center text-red-400 text-[10px] mt-0.5 font-bold gap-1">
                          <AlertCircle className="h-3 w-3" />
                          VENCIDO
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 font-mono">
                      {formatDate(acc.dueDate)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-center text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusColor}`}
                      >
                        {isPaid && <CheckCircle className="h-3.5 w-3.5" />}
                        {!isPaid && <Clock className="h-3.5 w-3.5" />}
                        {acc.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                      <div className="font-bold font-mono text-slate-200">
                        {isPaid ? (
                          formatCurrency(acc.amount)
                        ) : (
                          formatCurrency(acc.amount - (acc.paidAmount || 0))
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Total: {formatCurrency(acc.amount)}
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end gap-2">
                        {!isPaid && (
                          <button
                            onClick={() => openPaymentModal(acc)}
                            className="text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 p-1.5 rounded-md border border-indigo-900/50 transition-colors cursor-pointer"
                            title="Registrar Pago"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(acc.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Agregar Cuenta Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Registrar Cuenta por Cobrar</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cliente (Deudor) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Cuota 1/3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Monto Total *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={amount || ''}
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Guardar Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registrar Pago Modal */}
      {isPaymentModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Registrar Cobro</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="p-5 space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Cliente:</span>
                  <span className="text-slate-200 font-semibold">{selectedAccount.entity}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Deuda Total:</span>
                  <span className="font-mono">{formatCurrency(selectedAccount.amount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ya Pagado:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(selectedAccount.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-300 font-semibold border-t border-slate-800 pt-2">
                  <span>Saldo Actual:</span>
                  <span className="font-mono text-yellow-400">{formatCurrency(selectedAccount.amount - (selectedAccount.paidAmount || 0))}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Monto a Registrar *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedAccount.amount - (selectedAccount.paidAmount || 0)}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  {loading ? 'Procesando...' : 'Confirmar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
