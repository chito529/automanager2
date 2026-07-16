import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Expense, Vehicle } from '@/types';
import { Plus, FileText, X, Tag, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';

const EXPENSE_TYPES = [
  'Mantenimiento',
  'Reparación / Repuestos',
  'Chapería y Pintura',
  'Estética / Limpieza',
  'Traslado / Flete',
  'Gestoría / Documentos',
  'Comisión',
  'Otros'
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();
  const { confirm } = useConfirmation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [type, setType] = useState('Mantenimiento');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter State
  const [filterVehicleId, setFilterVehicleId] = useState('');

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === 'true') {
      openAddModal();
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, vehiclesData] = await Promise.all([
        api.expenses.list(),
        api.vehicles.list()
      ]);
      setExpenses(expensesData);
      setVehicles(vehiclesData);
    } catch (e) {
      console.error('Error loading expenses:', e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedVehicleId('');
    setType('Mantenimiento');
    setDescription('');
    setAmount(0);
    setSupplier('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert('Debe asociar el gasto a un vehículo.');
      return;
    }
    if (amount <= 0) {
      alert('El monto del gasto debe ser mayor a cero.');
      return;
    }

    const payload = {
      vehicleId: selectedVehicleId,
      type,
      description,
      amount: Number(amount),
      supplier,
      date
    };

    try {
      setLoading(true);
      await api.expenses.create(payload);
      
      // Update the vehicle's purchasePrice on the client/server (accumulating expense cost to the vehicle purchase price)
      const associatedVehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
      if (associatedVehicle) {
        const newPurchasePrice = associatedVehicle.purchasePrice + Number(amount);
        await api.vehicles.update(selectedVehicleId, { purchasePrice: newPurchasePrice });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Error recording expense:', e);
      alert('Error al registrar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId: string, vehicleId: string, amount: number) => {
    const confirmed = await confirm({
      title: 'Eliminar Gasto',
      message: '¿Está seguro de que desea eliminar este gasto? El precio de adquisición del vehículo se actualizará automáticamente.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.expenses.delete(expenseId);

      // Decrement the vehicle's purchasePrice
      const associatedVehicle = vehicles.find(v => v.id.toString() === vehicleId.toString());
      if (associatedVehicle) {
        const newPurchasePrice = Math.max(0, associatedVehicle.purchasePrice - Number(amount));
        await api.vehicles.update(vehicleId, { purchasePrice: newPurchasePrice });
      }

      await loadData();
    } catch (e) {
      console.error('Error deleting expense:', e);
      alert('Error al eliminar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleLabel = (vehicleId: string) => {
    const v = vehicles.find(item => item.id.toString() === vehicleId.toString());
    return v ? `${v.brand} ${v.model} (${v.year})` : `Vehículo #${vehicleId}`;
  };

  const filteredExpenses = filterVehicleId
    ? expenses.filter(e => e.vehicleId.toString() === filterVehicleId)
    : expenses;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Gastos por Vehículo</h1>
          <p className="mt-2 text-sm text-slate-400">
            Registre reparaciones, repuestos, traslados, estética y otros gastos de preparación de los vehículos.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={openAddModal}
            className="flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer shadow-lg"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Filter and stats segment */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
        <div className="w-full sm:w-auto flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">Filtrar por Vehículo:</span>
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Todos los vehículos</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.year})</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total Gastos Filtrados: <span className="text-indigo-400 font-bold font-sans text-sm">{formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}</span>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="bg-slate-900/50 shadow-sm border border-slate-800 sm:rounded-xl p-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-2 text-sm font-semibold text-slate-200">Sin gastos registrados</h3>
          <p className="mt-1 text-sm text-slate-400">Comience agregando un nuevo gasto para preparar o equipar un vehículo.</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow-sm ring-1 ring-slate-800 sm:rounded-xl bg-slate-900/50">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sm:pl-6">Fecha</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehículo</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo / Descripción</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Proveedor</th>
                <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-transparent">
              {filteredExpenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-200 sm:pl-6 font-mono">{formatDate(e.date)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 font-medium">{getVehicleLabel(e.vehicleId)}</td>
                  <td className="px-3 py-4 text-sm text-slate-400 max-w-xs truncate">
                    <span className="inline-block bg-indigo-900/40 text-indigo-300 text-[10px] font-semibold border border-indigo-800/60 rounded px-2 py-0.5 mb-1">
                      {e.type}
                    </span>
                    <div className="text-slate-300 text-xs">{e.description || 'Sin detalles'}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">{e.supplier || 'N/D'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-indigo-400 font-semibold font-mono">{formatCurrency(e.amount)}</td>
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => handleDelete(e.id, e.vehicleId, e.amount)}
                      className="text-red-500 hover:text-red-400 cursor-pointer bg-transparent border-0"
                      title="Eliminar Gasto"
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

      {/* Modern Dialog/Modal for Adding Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Registrar Gasto</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Asociar a Vehículo *</label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipo de Gasto</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {EXPENSE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
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

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Monto del Gasto (USD) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Proveedor / Taller</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Taller El Amigo / CarWash VIP"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descripción / Concepto</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Cambio de pastillas de freno, pulido, lavado premium, etc."
                />
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
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
