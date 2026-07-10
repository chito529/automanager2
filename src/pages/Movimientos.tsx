import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Transaction, Vehicle } from '@/types';
import { Plus, ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet, Trash2, X, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';

const PAYMENT_METHODS = [
  'Transferencia Bancaria',
  'Efectivo',
  'Cheque',
  'Tarjeta de Crédito',
  'Financiación Propia'
];

const CATEGORIES_INGRESO = [
  'Seña de Vehículo',
  'Cobro de Saldo Pendiente',
  'Venta de Servicios Auxiliares',
  'Comisión Ganada',
  'Aporte de Capital',
  'Otros Ingresos'
];

const CATEGORIES_EGRESO = [
  'Alquiler de Showroom',
  'Pago de Publicidad Digital',
  'Servicios Públicos (Luz/Agua/Internet)',
  'Impuestos y Tasas',
  'Sueldos y Comisiones',
  'Papelería y Oficina',
  'Repuestos / Suministros',
  'Otros Gastos Administrativos'
];

export default function Movimientos() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();
  const { confirm } = useConfirmation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [type, setType] = useState<'Ingreso' | 'Egreso'>('Ingreso');
  const [category, setCategory] = useState(CATEGORIES_INGRESO[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  // Filter State
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  // Update default category when type changes
  useEffect(() => {
    if (type === 'Ingreso') {
      setCategory(CATEGORIES_INGRESO[0]);
    } else {
      setCategory(CATEGORIES_EGRESO[0]);
    }
  }, [type]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txData, vehicleData] = await Promise.all([
        api.transactions.list(),
        api.vehicles.list()
      ]);
      setTransactions(txData);
      setVehicles(vehicleData);
    } catch (e) {
      console.error('Error loading cash movements:', e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setType('Ingreso');
    setCategory(CATEGORIES_INGRESO[0]);
    setCustomCategory('');
    setAmount(0);
    setPaymentMethod(PAYMENT_METHODS[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedVehicleId('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Movimiento de Caja',
      message: '¿Está seguro de que desea eliminar este movimiento de caja? Esta acción no se puede deshacer y ajustará el balance de caja.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      setLoading(true);
      await api.transactions.delete(id);
      await loadData();
    } catch (e) {
      console.error('Error deleting transaction:', e);
      alert('Error al eliminar movimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('El monto del movimiento debe ser mayor a cero.');
      return;
    }

    const categoryText = category === 'Otro (Especificar)' || category === 'Otros Ingresos' || category === 'Otros Gastos Administrativos'
      ? (customCategory.trim() || category)
      : category;

    const payload = {
      date,
      type,
      category: categoryText,
      amount: Number(amount),
      paymentMethod,
      vehicleId: selectedVehicleId || undefined
    };

    try {
      setLoading(true);
      await api.transactions.create(payload);
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Error recording movement:', e);
      alert('Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleLabel = (vehicleId: string) => {
    const v = vehicles.find(item => item.id.toString() === vehicleId.toString());
    return v ? `${v.brand} ${v.model} (${v.year})` : '';
  };

  // Stats Calculations
  const filteredTxs = filterType
    ? transactions.filter(t => t.type === filterType)
    : transactions;

  const totalInflow = transactions
    .filter(t => t.type === 'Ingreso')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter(t => t.type === 'Egreso')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCash = totalInflow - totalOutflow;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Movimientos de Caja</h1>
          <p className="mt-2 text-sm text-slate-400">
            Libro diario de ingresos y egresos generales de la empresa (Gastos operativos, alquileres, señas de clientes, etc.).
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={openAddModal}
            className="flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer shadow-lg"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Cash Ledger Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-emerald-950/50 border border-emerald-900/60 rounded-xl text-emerald-400">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingresos Totales</p>
            <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">{formatCurrency(totalInflow)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-red-950/50 border border-red-900/60 rounded-xl text-red-400">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Egresos Totales</p>
            <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">{formatCurrency(totalOutflow)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className={`p-3.5 rounded-xl border ${netCash >= 0 ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' : 'bg-red-950/30 border-red-900/50 text-red-400'}`}>
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Caja Neto</p>
            <p className={`text-2xl font-bold mt-1 font-mono ${netCash >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netCash)}</p>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
        <div className="w-full sm:w-auto flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">Filtrar por Tipo:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Todos los movimientos</option>
            <option value="Ingreso">Solo Ingresos</option>
            <option value="Egreso">Solo Egresos</option>
          </select>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Registros encontrados: <span className="text-indigo-400 font-bold font-sans text-sm">{filteredTxs.length}</span>
        </div>
      </div>

      {/* Cash Ledger Table */}
      {filteredTxs.length === 0 ? (
        <div className="bg-slate-900/50 shadow-sm border border-slate-800 sm:rounded-xl p-16 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-2 text-sm font-semibold text-slate-200">Sin movimientos registrados</h3>
          <p className="mt-1 text-sm text-slate-400">Comience registrando un ingreso o egreso de caja para administrar su flujo.</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow-sm ring-1 ring-slate-800 sm:rounded-xl bg-slate-900/50">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sm:pl-6">Fecha</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Concepto / Categoría</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Método de Pago</th>
                <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Eliminar</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-transparent">
              {filteredTxs.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-200 sm:pl-6 font-mono">{formatDate(t.date)}</td>
                  <td className="px-3 py-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${t.type === 'Ingreso' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 'bg-red-950/40 text-red-400 border-red-900/50'}`}>
                        {t.type}
                      </span>
                      <span className="font-medium text-slate-200">{t.category}</span>
                    </div>
                    {t.vehicleId && (
                      <div className="text-[10px] text-slate-500 mt-1">
                        Vinculado: {getVehicleLabel(t.vehicleId)}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">{t.paymentMethod}</td>
                  <td className={`whitespace-nowrap px-3 py-4 text-sm text-right font-semibold font-mono ${t.type === 'Ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'Ingreso' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog for Add Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Registrar Movimiento</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('Ingreso')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${type === 'Ingreso' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Egreso')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${type === 'Egreso' ? 'bg-red-950/40 border-red-500 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Egreso
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Categoría / Concepto *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {type === 'Ingreso' ? (
                      <>
                        {CATEGORIES_INGRESO.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="Otro (Especificar)">Otro (Especificar)</option>
                      </>
                    ) : (
                      <>
                        {CATEGORIES_EGRESO.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="Otro (Especificar)">Otro (Especificar)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fecha</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {(category === 'Otro (Especificar)' || category === 'Otros Ingresos' || category === 'Otros Gastos Administrativos') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Especificar Concepto *</label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Escriba el concepto del movimiento"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Monto (USD) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {PAYMENT_METHODS.map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>

              {type === 'Ingreso' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Asociar a Vehículo (Opcional)</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">-- No Asociado --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.year})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
