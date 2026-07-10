import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Sale, Expense, Transaction, Vehicle } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, Activity, FilePieChart, Award } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reportes() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, expensesData, txsData, vehData] = await Promise.all([
        api.sales.list(),
        api.expenses.list(),
        api.transactions.list(),
        api.vehicles.list()
      ]);
      setSales(salesData);
      setExpenses(expensesData);
      setTransactions(txsData);
      setVehicles(vehData);
    } catch (e) {
      console.error('Error loading report data:', e);
    } finally {
      setLoading(false);
    }
  };

  // 1. Calculations: Financial Summary
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.salePrice, 0);
  const totalSalesCost = sales.reduce((sum, s) => {
    // Find the original purchase price of the vehicle
    const vehicle = vehicles.find(v => v.id.toString() === s.vehicleId.toString());
    return sum + (vehicle ? vehicle.purchasePrice : 0);
  }, 0);
  
  const totalVehicleExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Gross Profit = Total Sales Price - Total Purchase Price - Renovation expenses
  const grossProfit = totalSalesRevenue - totalSalesCost - totalVehicleExpenses;

  // Operational Expenses from Ledger (Egreso transactions)
  const operationalCosts = transactions
    .filter(t => t.type === 'Egreso')
    .reduce((sum, t) => sum + t.amount, 0);

  // Operational Revenue from Ledger (Ingreso transactions, excluding vehicle sale payments/senas to avoid double counting)
  const additionalRevenue = transactions
    .filter(t => t.type === 'Ingreso' && !t.vehicleId)
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = grossProfit - operationalCosts + additionalRevenue;

  // 2. Bar Chart Data: Monthly Sales Volume
  // Group sales by month (e.g. "2026-06")
  const monthlySalesMap: { [key: string]: number } = {};
  sales.forEach(s => {
    const month = s.date.substring(0, 7); // "YYYY-MM"
    monthlySalesMap[month] = (monthlySalesMap[month] || 0) + s.salePrice;
  });

  const barChartData = Object.keys(monthlySalesMap)
    .sort()
    .map(month => ({
      name: month,
      Ventas: monthlySalesMap[month]
    }));

  // 3. Pie Chart Data: Expenses by Category
  const expenseCatMap: { [key: string]: number } = {};
  expenses.forEach(e => {
    const type = e.type || 'Otros';
    expenseCatMap[type] = (expenseCatMap[type] || 0) + e.amount;
  });

  const pieChartData = Object.keys(expenseCatMap).map(cat => ({
    name: cat,
    value: expenseCatMap[cat]
  }));

  // 4. Top Selling Models (Ranking)
  const soldVehicles = sales.map(s => {
    const vehicle = vehicles.find(v => v.id.toString() === s.vehicleId.toString());
    return {
      id: s.id,
      name: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})` : 'Vehículo desconocido',
      price: s.salePrice,
      profit: s.netProfit
    };
  }).sort((a, b) => b.profit - a.profit).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">Reportes Financieros</h1>
          <p className="mt-2 text-sm text-slate-400">
            Cuadros de mando analíticos e indicadores clave de rendimiento (KPI) consolidados a partir de su base de datos.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-950/50 border border-indigo-900/60 rounded-xl text-indigo-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ingreso de Ventas</p>
            <p className="text-xl font-bold text-slate-100 mt-1 font-mono">{formatCurrency(totalSalesRevenue)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-950/50 border border-emerald-900/60 rounded-xl text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Margen Bruto de Venta</p>
            <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(grossProfit)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-red-950/50 border border-red-900/60 rounded-xl text-red-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Costos Operativos (Caja)</p>
            <p className="text-xl font-bold text-red-400 mt-1 font-mono">{formatCurrency(operationalCosts)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-950/50 border border-purple-900/60 rounded-xl text-purple-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Utilidad Neta Estimada</p>
            <p className={`text-xl font-bold mt-1 font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netProfit)}</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales by Month */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-1.5 text-sm">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            Ventas Mensuales (Volumen en USD)
          </h3>
          <div className="h-64">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">Sin datos de ventas disponibles</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="Ventas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-1.5 text-sm">
            <FilePieChart className="h-4 w-4 text-emerald-400" />
            Distribución de Gastos de Puesta a Punto
          </h3>
          <div className="h-64 flex flex-col justify-center">
            {pieChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">Sin gastos de adecuación registrados</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f1f5f9' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs space-y-2.5">
                  {pieChartData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        {entry.name}
                      </div>
                      <span className="font-bold text-slate-200 font-mono">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Profits Rank */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-1.5 text-sm">
          <Award className="h-4 w-4 text-yellow-400" />
          Top 3 Ventas Más Rentables
        </h3>
        {soldVehicles.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no se registran utilidades por ventas.</p>
        ) : (
          <div className="space-y-4">
            {soldVehicles.map((rank, index) => (
              <div key={rank.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-indigo-400 w-6">#{index + 1}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{rank.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Precio de venta: {formatCurrency(rank.price)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400">Ganancia Neta</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">+{formatCurrency(rank.profit)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
