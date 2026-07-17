import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Sale, Vehicle, Customer, VehicleStatus } from '@/types';
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

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [tradeInFilter, setTradeInFilter] = useState<'Todos' | 'ConParteDePago' | 'SinParteDePago'>('Todos');

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

  // Trade-In Form State
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInBrand, setTradeInBrand] = useState('');
  const [tradeInModel, setTradeInModel] = useState('');
  const [tradeInYear, setTradeInYear] = useState<number>(new Date().getFullYear());
  const [tradeInVin, setTradeInVin] = useState('');
  const [tradeInValuation, setTradeInValuation] = useState<number>(0);
  const [tradeInEstimatedCosts, setTradeInEstimatedCosts] = useState<number>(0);
  const [tradeInDocumentation, setTradeInDocumentation] = useState('Título, Cédula Verde, Contrato de Compraventa');
  const [tradeInStatus, setTradeInStatus] = useState<VehicleStatus>('Comprado');

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
    
    // Trade-In resets
    setHasTradeIn(false);
    setTradeInBrand('');
    setTradeInModel('');
    setTradeInYear(new Date().getFullYear());
    setTradeInVin('');
    setTradeInValuation(0);
    setTradeInEstimatedCosts(0);
    setTradeInDocumentation('Título, Cédula Verde, Contrato de Compraventa');
    setTradeInStatus('Comprado');
    
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

  // Projected Profit and Pending Balance Calculation
  const purchasePrice = selectedVehicle ? selectedVehicle.purchasePrice : 0;
  const projectedProfit = selectedVehicle ? (salePrice - purchasePrice - commission) : 0;
  const pendingBalance = Math.max(0, salePrice - downPayment - (hasTradeIn ? tradeInValuation : 0));

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

    if (hasTradeIn) {
      if (!tradeInBrand || !tradeInModel || !tradeInValuation) {
        alert('Por favor, complete los campos obligatorios del vehículo en parte de pago (Marca, Modelo, Valuación).');
        return;
      }
    }

    try {
      setLoading(true);

      // 1. If has trade-in, create the vehicle first to get the generated ID
      let tradeInVehicleId = '';
      if (hasTradeIn) {
        tradeInVehicleId = await api.vehicles.create({
          brand: tradeInBrand,
          model: tradeInModel,
          year: Number(tradeInYear),
          vin: tradeInVin,
          status: tradeInStatus || 'Comprado',
          purchasePrice: Number(tradeInValuation),
          publicationPrice: Math.round(Number(tradeInValuation) * 1.2), // Suggest +20%
          salePrice: 0,
          purchaseDate: date,
          supplier: `Parte de pago - Cliente: ${selectedCustomer?.name || 'Cliente'}`,
          receivedFromCustomerId: selectedCustomerId,
          documentation: tradeInDocumentation,
          estimatedCosts: Number(tradeInEstimatedCosts) || 0,
        });
      }

      // 2. Create the sale with the tradeInVehicleId if applicable
      const payload = {
        date,
        vehicleId: selectedVehicleId,
        customerId: selectedCustomerId,
        salePrice: Number(salePrice),
        downPayment: Number(downPayment),
        pendingBalance: Number(pendingBalance),
        paymentMethod,
        commission: Number(commission),
        netProfit: Number(projectedProfit),
        hasTradeIn,
        ...(hasTradeIn ? {
          tradeInBrand,
          tradeInModel,
          tradeInYear: Number(tradeInYear),
          tradeInVin,
          tradeInValuation: Number(tradeInValuation),
          tradeInEstimatedCosts: Number(tradeInEstimatedCosts) || 0,
          tradeInDocumentation,
          tradeInStatus,
          tradeInVehicleId,
        } : {})
      };

      const saleId = await api.sales.create(payload);

      // 3. Link the trade-in vehicle back to the created sale ID
      if (hasTradeIn && tradeInVehicleId) {
        await api.vehicles.update(tradeInVehicleId, {
          receivedAsTradeInForSaleId: saleId
        });
      }
      
      // 4. Update the sold vehicle's status to 'Vendido' and set its salePrice
      await api.vehicles.update(selectedVehicleId, {
        status: 'Vendido',
        salePrice: Number(salePrice)
      });

      setIsModalOpen(false);
      await loadData();
    } catch (e: any) {
      console.error('Error recording sale:', e);
      alert('Error al registrar la venta: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (saleId: string, vehicleId: string, tradeInVehicleId?: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Venta',
      message: '¿Está seguro de que desea eliminar esta venta? Esta acción restaurará el estado del vehículo a "Publicado"' + 
               (tradeInVehicleId ? ' y eliminará del inventario el vehículo recibido como parte de pago.' : '.'),
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.sales.delete(saleId);
      
      // Restore the sold vehicle's status to 'Publicado'
      await api.vehicles.update(vehicleId, {
        status: 'Publicado'
      });

      // If there was a trade-in vehicle, delete it
      if (tradeInVehicleId) {
        await api.vehicles.delete(tradeInVehicleId);
      }

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

  // Filtered sales calculation
  const filteredSales = sales.filter(s => {
    const vehicleLabel = getVehicleLabel(s.vehicleId).toLowerCase();
    const customerLabel = getCustomerLabel(s.customerId).toLowerCase();
    const tradeInBrandLabel = s.tradeInBrand ? s.tradeInBrand.toLowerCase() : '';
    const tradeInModelLabel = s.tradeInModel ? s.tradeInModel.toLowerCase() : '';
    
    const matchesSearch = vehicleLabel.includes(searchTerm.toLowerCase()) || 
                          customerLabel.includes(searchTerm.toLowerCase()) ||
                          tradeInBrandLabel.includes(searchTerm.toLowerCase()) ||
                          tradeInModelLabel.includes(searchTerm.toLowerCase());
                          
    const matchesTradeIn = tradeInFilter === 'Todos' ||
                           (tradeInFilter === 'ConParteDePago' && s.hasTradeIn) ||
                           (tradeInFilter === 'SinParteDePago' && !s.hasTradeIn);
                           
    return matchesSearch && matchesTradeIn;
  });

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

      {/* Filtros de Búsqueda y Tipo de Operación */}
      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por vehículo, cliente, o marca recibida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parte de Pago:</span>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
            {(['Todos', 'ConParteDePago', 'SinParteDePago'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTradeInFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  tradeInFilter === filter
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {filter === 'Todos' && 'Todos'}
                {filter === 'ConParteDePago' && 'Con Parte de Pago'}
                {filter === 'SinParteDePago' && 'Sin Parte de Pago'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vista de Escritorio */}
      <div className="overflow-hidden shadow-sm ring-1 ring-slate-800 sm:rounded-xl bg-slate-900/50 hidden sm:block">
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
            {loading && filteredSales.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">Cargando...</td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">No se encontraron ventas registradas.</td>
              </tr>
            ) : (
              filteredSales.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-200 sm:pl-6 font-mono">{formatDate(s.date)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                    <div className="font-medium text-slate-300">{getVehicleLabel(s.vehicleId)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Cliente: {getCustomerLabel(s.customerId)}</div>
                    {s.hasTradeIn && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/30 text-[11px] text-indigo-400 font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                        Recibido: {s.tradeInBrand} {s.tradeInModel} ({s.tradeInYear}) • {formatCurrency(s.tradeInValuation || 0)}
                      </div>
                    )}
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
                      onClick={() => handleDelete(s.id, s.vehicleId, s.tradeInVehicleId)}
                      className="text-slate-500 hover:text-red-500 cursor-pointer bg-transparent border-0 p-1"
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

      {/* Vista de Móvil */}
      <div className="space-y-4 block sm:hidden">
        {loading && filteredSales.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500 bg-slate-900/30 rounded-xl border border-slate-900">Cargando ventas...</div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500 bg-slate-900/30 rounded-xl border border-slate-900">No se encontraron ventas.</div>
        ) : (
          filteredSales.map(s => (
            <div key={s.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800/40 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">{formatDate(s.date)}</h3>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{getVehicleLabel(s.vehicleId)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Cliente: {getCustomerLabel(s.customerId)}</p>
                  {s.hasTradeIn && (
                    <div className="mt-2 p-2 bg-indigo-950/20 border border-indigo-900/30 rounded-lg text-xs text-slate-300">
                      <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Parte de Pago</span>
                      {s.tradeInBrand} {s.tradeInModel} ({s.tradeInYear}) • <span className="font-semibold text-indigo-300">{formatCurrency(s.tradeInValuation || 0)}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(s.id, s.vehicleId, s.tradeInVehicleId)}
                  className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer animate-in duration-100"
                  title="Eliminar Venta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="block text-slate-500 font-medium uppercase tracking-wider text-[9px] mb-0.5">Monto Venta</span>
                  <span className="text-slate-200 font-bold font-mono">{formatCurrency(s.salePrice)}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium uppercase tracking-wider text-[9px] mb-0.5">Utilidad Neta</span>
                  <span className="text-emerald-400 font-bold font-mono">{formatCurrency(s.netProfit)}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium uppercase tracking-wider text-[9px] mb-0.5">Saldo</span>
                  <div className="mt-0.5">
                    {s.pendingBalance > 0 ? (
                      <span className="text-red-400 font-semibold font-mono">{formatCurrency(s.pendingBalance)}</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Saldado</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Dialog/Modal for Registrar Venta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full shadow-2xl max-h-[92vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-200">Registrar Venta</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
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
                    value={salePrice || ''}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Entrega Inicial (USD)</label>
                  <input
                    type="number"
                    value={downPayment || ''}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Comisión de Venta / Broker (USD)</label>
                <input
                  type="number"
                  value={commission || ''}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="0"
                />
              </div>

              {/* Sección: Vehículo como Parte de Pago */}
              <div className="border-t border-slate-800/60 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={hasTradeIn}
                    onChange={(e) => setHasTradeIn(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 transition-all cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                    ¿Recibe vehículo como parte de pago?
                  </span>
                </label>
              </div>

              {hasTradeIn && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="border-b border-slate-850 pb-1.5 flex items-center justify-between">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ficha del Vehículo Entrante</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-900/40">
                      Nuevo en Inventario
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Marca *</label>
                      <input
                        type="text"
                        required={hasTradeIn}
                        placeholder="Ej. Toyota"
                        value={tradeInBrand}
                        onChange={(e) => setTradeInBrand(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Modelo *</label>
                      <input
                        type="text"
                        required={hasTradeIn}
                        placeholder="Ej. Corolla"
                        value={tradeInModel}
                        onChange={(e) => setTradeInModel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Año *</label>
                      <input
                        type="number"
                        required={hasTradeIn}
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={tradeInYear || ''}
                        onChange={(e) => setTradeInYear(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Chasis / VIN</label>
                      <input
                        type="text"
                        placeholder="Nro Chasis (opcional)"
                        value={tradeInVin}
                        onChange={(e) => setTradeInVin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Valuación USD *</label>
                      <input
                        type="number"
                        required={hasTradeIn}
                        min="1"
                        placeholder="0"
                        value={tradeInValuation || ''}
                        onChange={(e) => setTradeInValuation(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Costos Est. Reparación USD</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={tradeInEstimatedCosts || ''}
                        onChange={(e) => setTradeInEstimatedCosts(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Estado Inicial en Stock *</label>
                      <select
                        value={tradeInStatus}
                        onChange={(e) => setTradeInStatus(e.target.value as VehicleStatus)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="Comprado">Comprado</option>
                        <option value="En preparación">En preparación</option>
                        <option value="Publicado">Publicado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Documentación legal</label>
                      <input
                        type="text"
                        value={tradeInDocumentation}
                        onChange={(e) => setTradeInDocumentation(e.target.value)}
                        placeholder="Título, Cédula Verde..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedVehicle && (
                <div className="p-3.5 bg-slate-950 border border-slate-800/85 rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Precio de Adquisición (Costo vendido):</span>
                    <span className="font-mono">{formatCurrency(purchasePrice)}</span>
                  </div>
                  {hasTradeIn && (
                    <div className="flex justify-between text-slate-400">
                      <span>Valuación de Entrega (Parte de Pago):</span>
                      <span className="font-mono text-indigo-400">-{formatCurrency(tradeInValuation || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Monto de Entrega Inicial:</span>
                    <span className="font-mono text-slate-200">-{formatCurrency(downPayment || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-850 pt-1.5">
                    <span className="font-semibold text-amber-500">Saldo Pendiente del Cliente:</span>
                    <span className="font-mono font-bold text-amber-500">{formatCurrency(pendingBalance)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/60 pt-2 font-semibold">
                    <span className="text-slate-300 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-indigo-400" />
                      Margen Neto de Utilidad de Venta:
                    </span>
                    <span className={`font-mono ${projectedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(projectedProfit)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
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
