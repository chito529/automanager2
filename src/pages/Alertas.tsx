import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Account, Vehicle, Customer } from '@/types';
import { AlertTriangle, Clock, Calendar, ShieldAlert, BadgeAlert, ArrowRight, UserCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Alertas() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accs, vehs, custs] = await Promise.all([
        api.accounts.list(),
        api.vehicles.list(),
        api.customers.list()
      ]);
      setAccounts(accs);
      setVehicles(vehs);
      setCustomers(custs);
    } catch (e) {
      console.error('Error loading alerts data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const today = getTodayStr();

  // 1. Overdue Accounts Receivable (CxC)
  const overdueCxC = accounts.filter(
    acc => acc.type === 'Cobrar' && acc.status === 'Pendiente' && acc.dueDate < today
  );

  // 2. Overdue Accounts Payable (CxP)
  const overdueCxP = accounts.filter(
    acc => acc.type === 'Pagar' && acc.status === 'Pendiente' && acc.dueDate < today
  );

  // 3. Aged Stock Warning (Vehicles in inventory for > 45 days)
  const agedVehicles = vehicles.filter(v => {
    if (v.status === 'Vendido') return false;
    const purchase = new Date(v.purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchase.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 45;
  });

  // 4. Pending CRM Follow-ups (interactions scheduled for today or overdue)
  const upcomingFollowups: { customer: Customer; followUpDate: string; note: string }[] = [];
  customers.forEach(cust => {
    if (cust.status === 'Ganado' || cust.status === 'Perdido') return;
    if (cust.interactions && Array.isArray(cust.interactions)) {
      cust.interactions.forEach(inter => {
        if (inter.nextFollowUp && inter.nextFollowUp <= today) {
          // Check if already added for this customer to avoid duplicates
          if (!upcomingFollowups.some(f => f.customer.id === cust.id)) {
            upcomingFollowups.push({
              customer: cust,
              followUpDate: inter.nextFollowUp,
              note: inter.note || 'Sin nota de seguimiento'
            });
          }
        }
      });
    }
  });

  const totalAlertsCount = overdueCxC.length + overdueCxP.length + agedVehicles.length + upcomingFollowups.length;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Alertas y Recordatorios</h1>
          <p className="mt-2 text-sm text-slate-400">
            Escaneo en tiempo real de cuentas vencidas, vehículos detenidos por largo tiempo en stock y compromisos de seguimiento con clientes.
          </p>
        </div>
      </div>

      {/* Main Stats Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-5">
        <div className={`p-4 rounded-xl border ${totalAlertsCount > 0 ? 'bg-red-950/40 border-red-900/60 text-red-400 animate-pulse' : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400'}`}>
          <BadgeAlert className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-200">
            {totalAlertsCount > 0 ? `Se detectaron ${totalAlertsCount} puntos de atención requerida` : '¡Excelente! No hay alertas pendientes'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {totalAlertsCount > 0 ? 'Revise las categorías a continuación para resolver los pendientes del showroom.' : 'Todos sus cobros, pagos, stock y seguimientos CRM están al día.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overdue Cobros (CxC) Alert Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-950/50 border border-yellow-900/50 rounded-lg text-yellow-400">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-200">Cobros Vencidos (CxC)</h3>
            </div>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${overdueCxC.length > 0 ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/40' : 'bg-slate-950 text-slate-500'}`}>
              {overdueCxC.length}
            </span>
          </div>

          {overdueCxC.length === 0 ? (
            <p className="text-sm text-slate-500">No hay cobros vencidos.</p>
          ) : (
            <div className="space-y-3">
              {overdueCxC.map(acc => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{acc.entity}</span>
                    <div className="text-[10px] text-red-400 font-medium mt-1 font-mono">Venció el {formatDate(acc.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-300 font-mono">${acc.amount.toLocaleString()}</span>
                    <Link to="/cxc" className="text-indigo-400 hover:text-indigo-300">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Pagos (CxP) Alert Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-200">Pagos Vencidos (CxP)</h3>
            </div>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${overdueCxP.length > 0 ? 'bg-red-950 text-red-400 border border-red-900/40' : 'bg-slate-950 text-slate-500'}`}>
              {overdueCxP.length}
            </span>
          </div>

          {overdueCxP.length === 0 ? (
            <p className="text-sm text-slate-500">No hay pagos vencidos.</p>
          ) : (
            <div className="space-y-3">
              {overdueCxP.map(acc => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{acc.entity}</span>
                    <div className="text-[10px] text-red-400 font-medium mt-1 font-mono">Venció el {formatDate(acc.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-300 font-mono">${acc.amount.toLocaleString()}</span>
                    <Link to="/cxp" className="text-indigo-400 hover:text-indigo-300">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aged Stock Alert Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-950/50 border border-indigo-900/50 rounded-lg text-indigo-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-200">Aged Stock (Vehículos &gt; 45 días)</h3>
            </div>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${agedVehicles.length > 0 ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/40' : 'bg-slate-950 text-slate-500'}`}>
              {agedVehicles.length}
            </span>
          </div>

          {agedVehicles.length === 0 ? (
            <p className="text-sm text-slate-500">No hay vehículos con stock antiguo detenido.</p>
          ) : (
            <div className="space-y-3">
              {agedVehicles.map(v => {
                const purchase = new Date(v.purchaseDate);
                const diff = Math.ceil(Math.abs(new Date().getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">{v.brand} {v.model} ({v.year})</span>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">Comprado hace <span className="text-indigo-400 font-bold">{diff} días</span> ({formatDate(v.purchaseDate)})</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-300 font-mono">${v.publicationPrice.toLocaleString()}</span>
                      <Link to="/vehiculos" className="text-indigo-400 hover:text-indigo-300">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CRM Followups Alert Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-950/50 border border-emerald-900/50 rounded-lg text-emerald-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-200">Seguimientos CRM Pendientes</h3>
            </div>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${upcomingFollowups.length > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : 'bg-slate-950 text-slate-500'}`}>
              {upcomingFollowups.length}
            </span>
          </div>

          {upcomingFollowups.length === 0 ? (
            <p className="text-sm text-slate-500">No hay compromisos de contacto para hoy o días anteriores.</p>
          ) : (
            <div className="space-y-3">
              {upcomingFollowups.map(f => (
                <div key={f.customer.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{f.customer.name}</span>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium italic">"{f.note}"</div>
                    <div className="text-[9px] text-emerald-400 font-medium font-mono mt-1">Fecha programada: {formatDate(f.followUpDate)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/crm" className="text-indigo-400 hover:text-indigo-300">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
