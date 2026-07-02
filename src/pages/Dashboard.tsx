import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CarFront, Users, DollarSign, Wallet } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const data = [
  { name: 'Ene', ventas: 40000000, utilidad: 5000000 },
  { name: 'Feb', ventas: 30000000, utilidad: 3500000 },
  { name: 'Mar', ventas: 20000000, utilidad: 2500000 },
  { name: 'Abr', ventas: 27800000, utilidad: 3908000 },
  { name: 'May', ventas: 18900000, utilidad: 4800000 },
  { name: 'Jun', ventas: 23900000, utilidad: 3800000 },
  { name: 'Jul', ventas: 34900000, utilidad: 4300000 },
];

export default function Dashboard() {
  const { formatCurrency, formatCompactCurrency } = useSettings();

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            Resumen financiero y comercial del negocio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Ventas del Mes</p>
          <p className="text-2xl font-bold">{formatCurrency(142500000)}</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
            12% vs mes ant.
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Utilidad Neta</p>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(38420000)}</p>
          <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs">
            8 Unidades vendidas
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Ticket Promedio</p>
          <p className="text-2xl font-bold">{formatCurrency(17812500)}</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
            Eficiencia 92%
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">Pipeline Activo</p>
          <p className="text-2xl font-bold text-amber-500">24</p>
          <div className="flex items-center gap-1 mt-2 text-amber-500 text-xs">
            6 Oportunidades hoy
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span>Evolución de Ventas</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} stroke="#1e293b" />
                <YAxis tickFormatter={(val) => formatCompactCurrency(val)} tick={{fontSize: 12, fill: '#64748b'}} stroke="#1e293b" />
                <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0'}} />
                <Area type="monotone" dataKey="ventas" stroke="#6366f1" fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span>Utilidad Neta por Mes</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} stroke="#1e293b" />
                <YAxis tickFormatter={(val) => formatCompactCurrency(val)} tick={{fontSize: 12, fill: '#64748b'}} stroke="#1e293b" />
                <Tooltip formatter={(val: number) => formatCurrency(val)} cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0'}} />
                <Bar dataKey="utilidad" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
