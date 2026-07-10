import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Sale, Vehicle, Customer } from '@/types';
import { Plus, Check, Clock, X, Info, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();
  const { confirm } = useConfirmation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria');
  const [commission, setCommission] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, vehiclesData, customersData] = await Promise.all([
        api.sales.list(),
        api.vehicles.list(),
        api.customers.list(),
      ]);
      setSales(salesData);
      setVehicles(vehiclesData);
      setCustomers(customersData);
    } catch (e) {
      console.error('Error loading sales data:', e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    // Reset state
    setSelectedVehicleId('');
    setSelectedCustomerId('');
    setSalePrice(0);
    setDownPayment(0);
    setPaymentMethod('Transferencia Bancaria');
    setCommission(0);
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  // Dynamically watch selected vehicle to prefill salePrice or show info
  const selectedVehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

  // Auto-fill price when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      setSalePrice(selectedVehicle.publicationPrice || 0);
    }
  }, [selectedVehicleId]);

  // Projected Profit Calculation
  const purchasePrice = selectedVehicle ? selectedVehicle.purchasePrice : 0;
  const projectedProfit = selectedVehicle ? (salePrice - purchasePrice - commission) : 0;
  const pendingBalance = salePrice - downPayment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert('Debe seleccionar un vehículo.');
      return;
    }
    if (!selectedCustomerId) {
      alert('Debe seleccionar un cliente.');
      return;
    }
    if (salePrice <= 0) {
      alert('El precio de venta debe ser mayor a cero.');
      return;
    }

    const payload = {
      date,
      vehicleId: selectedVehicleId,
      customerId: selectedCustomerId,
      salePrice: Number(salePrice),
      downPayment: Number(downPayment),
      pendingBalance: Number(pendingBalance),
      paymentMethod,
      commission: Number(commission),
      netProfit: Number(projectedProfit)
    };

    try {
      setLoading(true);
      await api.sales.create(payload);
      
      // Also update the vehicle's status to 'Vendido' and set its salePrice
      await api.vehicles.update(selectedVehicleId, {
        status: 'Vendido',
        salePrice: Number(salePrice)
      });

      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Error recording sale:', e);
      alert('Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (saleId: string, vehicleId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Venta',
      message: '¿Está seguro de que desea eliminar esta venta? Esta acción restaurará el estado del vehículo a "Publicado".',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.sales.delete(saleId);
      
      // Restore the vehicle's status to 'Publicado'
      await api.vehicles.update(vehicleId, {
        status: 'Publicado'
      });

      await loadData();
    } catch (e) {
      console.error('Error deleting sale:', e);
      alert('Error al eliminar la venta');
    } finally {
      setLoading(false);
    }
  };

  // Helper to find original vehicle brand/model for displaying
  const getVehicleLabel = (vehicleId: string) => {
    const v = vehicles.find(item => item.id.toString() === vehicleId.toString());
    return v ? `${v.brand} ${v.model} (${v.year})` : `Vehículo #${vehicleId}`;
  };

  const getCustomerLabel = (customerId: string) => {
    const c = customers.find(item => item.id.toString() === customerId.toString());
    return c ? c.name : `Cliente #${customerId}`;
  };

  // Only show vehicles that are not already sold (unless it's the current one)
  const availableVehicles = vehicles.filter(v => v.status !== 'Vendido');

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Ventas</h1>
          <p className="mt-2 text-sm text-slate-400">
            Registro de ventas vinculadas a clientes y vehículos del showroom.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer shadow-lg"
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
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sm:pl-6">Fecha</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehículo / Cliente</th>
              <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio Venta</th>
              <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Pendiente</th>
              <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilidad Neta</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-transparent">
            {loading && sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">Cargando...</td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">No hay ventas registradas.</td>
              </tr>
            ) : (
              sales.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-200 sm:pl-6 font-mono">{formatDate(s.date)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                    <div className="font-medium text-slate-300">{getVehicleLabel(s.vehicleId)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Cliente: {getCustomerLabel(s.customerId)}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-200 font-semibold text-right font-mono">{formatCurrency(s.salePrice)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-mono">
                    {s.pendingBalance > 0 ? (
                      <span className="inline-flex items-center text-red-400 bg-red-950/30 border border-red-900/40 px-2 py-0.5 rounded text-xs">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {formatCurrency(s.pendingBalance)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded text-xs">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Cancelado
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-emerald-400 font-bold text-right font-mono">{formatCurrency(s.netProfit)}</td>
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => handleDelete(s.id, s.vehicleId)}
                      className="text-red-500 hover:text-red-400 cursor-pointer bg-transparent border-0"
                      title="Eliminar Venta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Dialog/Modal for Registrar Venta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Registrar Venta</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Seleccionar Vehículo *</label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Seleccionar de Stock --</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.year}) - Costo: {formatCurrency(v.purchasePrice)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Seleccionar Cliente *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'Sin teléfono'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fecha de Venta</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                    <option value="Transferencia Bancaria">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Financiación Propia">Financiación Propia</option>
                    <option value="Financiación Bancaria">Financiación Bancaria</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Precio de Venta Actual (USD)</label>
                  <input
                    type="number"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Entrega Inicial (USD)</label>
                  <input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Comisión de Venta / Broker (USD)</label>
                <input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="0"
                />
              </div>

              {selectedVehicle && (
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Precio de Adquisición (Costo):</span>
                    <span className="font-mono">{formatCurrency(purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Saldo Pendiente del Cliente:</span>
                    <span className="font-mono text-amber-400">{formatCurrency(pendingBalance)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/60 pt-1.5 font-semibold">
                    <span className="text-slate-300 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-indigo-400" />
                      Margen Neto de Utilidad:
                    </span>
                    <span className={`font-mono ${projectedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(projectedProfit)}
                    </span>
                  </div>
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
                  Registrar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
