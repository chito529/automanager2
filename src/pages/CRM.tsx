import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Customer, CustomerStatus } from '@/types';
import { Plus, Phone, Mail, Calendar, X, Edit, ArrowRightLeft, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useConfirmation } from '@/contexts/ConfirmationContext';

const CUSTOMER_STATUSES: CustomerStatus[] = [
  'Nuevo',
  'En seguimiento',
  'Negociando',
  'Ganado',
  'Perdido'
];

export default function CRM() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirmation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('');
  const [firstContactDate, setFirstContactDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<CustomerStatus>('Nuevo');

  // Customer Edit/Move State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<CustomerStatus>('Nuevo');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await api.customers.list();
      setCustomers(data);
    } catch (e) {
      console.error('Error loading customers:', e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setName('');
    setPhone('');
    setEmail('');
    setSource('');
    setFirstContactDate(new Date().toISOString().split('T')[0]);
    setStatus('Nuevo');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre es requerido.');
      return;
    }

    const payload = {
      name,
      phone,
      email,
      source,
      firstContactDate,
      status,
      interactions: []
    };

    try {
      setLoading(true);
      await api.customers.create(payload);
      setIsModalOpen(false);
      await loadCustomers();
    } catch (e) {
      console.error('Error saving customer:', e);
      alert('Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNewStatus(customer.status);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedCustomer) return;
    try {
      setLoading(true);
      await api.customers.update(selectedCustomer.id, { status: newStatus });
      setIsDetailOpen(false);
      await loadCustomers();
    } catch (e) {
      console.error('Error updating status:', e);
      alert('Error al actualizar etapa del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    const confirmed = await confirm({
      title: 'Eliminar Cliente',
      message: '¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer y borrará permanentemente sus datos de seguimiento.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.customers.delete(selectedCustomer.id);
      setIsDetailOpen(false);
      await loadCustomers();
    } catch (e) {
      console.error('Error deleting customer:', e);
      alert('Error al eliminar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const columns = ['Nuevo', 'En seguimiento', 'Negociando', 'Ganado', 'Perdido'];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Clientes (CRM)</h1>
          <p className="mt-2 text-sm text-slate-400">
            Pipeline de ventas y seguimiento de clientes. Haga clic en un cliente para actualizar su estado.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer shadow-lg"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-[500px]">
        <div className="flex-1 flex flex-col bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>Pipeline CRM Activo
            </h2>
            <span className="text-xs text-slate-500">{columns.length} Etapas</span>
          </div>
          <div className="flex-1 flex overflow-x-auto p-4 gap-4 custom-scrollbar bg-slate-950/20">
            {columns.map(status => (
              <div key={status} className="w-72 flex-shrink-0 flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{status}</h3>
                  <span className="bg-slate-950/50 border border-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">
                    {customers.filter(c => c.status === status).length}
                  </span>
                </div>
                <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                  {customers.filter(c => c.status === status).map(customer => (
                    <div
                      key={customer.id}
                      onClick={() => openDetail(customer)}
                      className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer shadow-md hover:shadow-indigo-500/5 group text-left"
                    >
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">{customer.name}</h4>
                      <div className="mt-2.5 space-y-1.5 border-t border-slate-800/60 pt-2">
                        {customer.phone && (
                          <div className="flex items-center text-[10px] text-slate-400 font-mono">
                            <Phone className="h-3 w-3 mr-1.5 text-slate-500" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center text-[10px] text-slate-400 truncate">
                            <Mail className="h-3 w-3 mr-1.5 text-slate-500" />
                            {customer.email}
                          </div>
                        )}
                        <div className="flex items-center text-[10px] text-slate-500 font-mono">
                          <Calendar className="h-3 w-3 mr-1.5 text-slate-600" />
                          Contacto: {formatDate(customer.firstContactDate)}
                        </div>
                      </div>
                      {customer.source && (
                        <div className="mt-2 text-[9px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 inline-block">
                          Origen: {customer.source}
                        </div>
                      )}
                    </div>
                  ))}
                  {customers.filter(c => c.status === status).length === 0 && (
                    <div className="p-4 rounded-xl border border-slate-800/60 border-dashed text-center">
                      <p className="text-xs text-slate-500">Sin clientes en esta etapa</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Dialog/Modal for Add Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Nuevo Cliente</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Juan Perez"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="+595 9..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Origen / Canal</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Facebook / Amigo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Primer Contacto</label>
                  <input
                    type="date"
                    required
                    value={firstContactDate}
                    onChange={(e) => setFirstContactDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Etapa Inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {CUSTOMER_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
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
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Update Status Dialog */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Actualizar Etapa del Cliente</h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-indigo-400">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Contacto inicial el {formatDate(selectedCustomer.firstContactDate)} ({selectedCustomer.source || 'Sin origen'})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mover a Etapa</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CustomerStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {CUSTOMER_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 bg-red-950/40 border border-red-900/50 hover:bg-red-900 hover:border-red-800 text-red-400 hover:text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Eliminar Cliente"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDetailOpen(false)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Mover
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
