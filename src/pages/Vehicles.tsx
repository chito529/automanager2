import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Vehicle, VehicleStatus } from '@/types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';

const VEHICLE_STATUSES: VehicleStatus[] = [
  'Comprado',
  'En preparación',
  'Publicado',
  'Reservado',
  'Vendido'
];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();
  const { confirm } = useConfirmation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [vin, setVin] = useState('');
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [status, setStatus] = useState<VehicleStatus>('Comprado');
  const [publicationPrice, setPublicationPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);

  // Submitting States
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === 'true') {
      openAddModal();
    }
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await api.vehicles.list();
      setVehicles(data);
    } catch (e) {
      console.error('Error loading vehicles:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Comprado': 'bg-blue-900/40 text-blue-300 border border-blue-800/60',
      'En preparación': 'bg-yellow-900/40 text-yellow-300 border border-yellow-800/60',
      'Publicado': 'bg-green-900/40 text-green-300 border border-green-800/60',
      'Reservado': 'bg-purple-900/40 text-purple-300 border border-purple-800/60',
      'Vendido': 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
    };
    return colors[status] || 'bg-slate-800/60 text-slate-400';
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setBrand('');
    setModel('');
    setYear(new Date().getFullYear());
    setVin('');
    setSupplier('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchasePrice(0);
    setStatus('Comprado');
    setPublicationPrice(0);
    setSalePrice(0);
    setSubmitError(null);
    setSubmitting(false);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setYear(vehicle.year);
    setVin(vehicle.vin);
    setSupplier(vehicle.supplier);
    setPurchaseDate(vehicle.purchaseDate);
    setPurchasePrice(vehicle.purchasePrice);
    setStatus(vehicle.status);
    setPublicationPrice(vehicle.publicationPrice);
    setSalePrice(vehicle.salePrice || 0);
    setSubmitError(null);
    setSubmitting(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Vehículo',
      message: '¿Está seguro de que desea eliminar este vehículo? Esta acción no se puede deshacer y borrará permanentemente sus datos.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      setLoading(true);
      await api.vehicles.delete(id);
      await loadVehicles();
    } catch (e) {
      console.error('Error deleting vehicle:', e);
      alert('Error al eliminar vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) {
      setSubmitError('Marca y Modelo son campos requeridos.');
      return;
    }

    const payload = {
      brand,
      model,
      year: Number(year),
      vin,
      supplier,
      purchaseDate,
      purchasePrice: Number(purchasePrice),
      status,
      publicationPrice: Number(publicationPrice),
      salePrice: Number(salePrice)
    };

    try {
      setSubmitting(true);
      setSubmitError(null);
      
      if (editingVehicle) {
        await api.vehicles.update(editingVehicle.id, payload);
        // Update state locally immediately
        const updatedVehicle: Vehicle = {
          id: editingVehicle.id,
          ...payload
        };
        setVehicles(prev => prev.map(v => v.id.toString() === editingVehicle.id.toString() ? updatedVehicle : v));
      } else {
        const newId = await api.vehicles.create(payload);
        // Update state locally immediately with the returned or generated ID
        const newVehicle: Vehicle = {
          id: newId || (Date.now() + Math.floor(Math.random() * 1000)).toString(),
          ...payload
        };
        setVehicles(prev => [...prev, newVehicle]);
      }
      
      // Close the modal and load the absolute source of truth from the server
      setIsModalOpen(false);
      await loadVehicles();
    } catch (err: any) {
      console.error('Error saving vehicle:', err);
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Vehículos</h1>
          <p className="mt-2 text-sm text-slate-400">
            Gestión de inventario de vehículos, costos y precios.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer shadow-lg"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* Vista de escritorio (Tableta en adelante) */}
      <div className="mt-8 flow-root hidden sm:block">
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
                  {loading && vehicles.length === 0 ? (
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
                          <div className="text-[10px] text-slate-500 font-mono">VIN: {v.vin || 'N/D'}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">{v.year}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold ${getStatusColor(v.status)}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 text-right font-mono">{formatCurrency(v.purchasePrice)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-indigo-400 font-semibold text-right font-mono">{formatCurrency(v.publicationPrice)}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => openEditModal(v)}
                            className="text-slate-400 hover:text-indigo-400 mr-4 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
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
          </div>
        </div>
      </div>

      {/* Vista de Móvil (Tarjetas táctiles compactas) */}
      <div className="mt-6 space-y-4 block sm:hidden">
        {loading && vehicles.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500 bg-slate-900/30 rounded-xl border border-slate-900">Cargando vehículos...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500 bg-slate-900/30 rounded-xl border border-slate-900">No hay vehículos registrados.</div>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{v.brand} {v.model}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">VIN: {v.vin || 'N/D'}</p>
                </div>
                <span className={`inline-flex items-center shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(v.status)}`}>
                  {v.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-800/40 text-[11px]">
                <div>
                  <span className="block text-slate-500 font-medium uppercase tracking-wider text-[9px] mb-0.5">Año</span>
                  <span className="text-slate-300 font-bold">{v.year}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium uppercase tracking-wider text-[9px] mb-0.5">Costo Compra</span>
                  <span className="text-slate-300 font-bold font-mono">{formatCurrency(v.purchasePrice)}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium uppercase tracking-wider text-[9px] mb-0.5">Precio Venta</span>
                  <span className="text-indigo-400 font-bold font-mono">{formatCurrency(v.publicationPrice)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] text-slate-500 font-mono">ID: {v.id.toString().substring(0, 8)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(v)}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-indigo-400 bg-slate-800/60 hover:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-700/35 cursor-pointer select-none active:scale-95 transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-rose-400 bg-rose-950/15 border border-rose-900/35 px-2.5 py-1.5 rounded-lg cursor-pointer select-none active:scale-95 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Dialog/Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">
                {editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitError && (
              <div className="mx-6 mt-4 p-3.5 bg-red-950/50 border border-red-800/60 rounded-lg text-xs text-red-300 leading-relaxed font-sans">
                <span className="font-semibold block mb-0.5">⚠️ Error al Registrar</span>
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Marca *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Hilux"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Año *</label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="2020"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chasis / VIN</label>
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="17GFC..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Proveedor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Particular / Concesionaria"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fecha de Adquisición</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Precio de Costo (USD)</label>
                  <input
                    type="number"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Precio Publicación (USD)</label>
                  <input
                    type="number"
                    required
                    value={publicationPrice}
                    onChange={(e) => setPublicationPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {VEHICLE_STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Precio de Venta (USD)</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    disabled={status !== 'Vendido'}
                    placeholder="Solo si está vendido"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/70 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-md flex items-center gap-2"
                >
                  {submitting && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {submitting ? 'Guardando...' : (editingVehicle ? 'Guardar Cambios' : 'Registrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
