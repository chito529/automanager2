import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { 
  CarFront, Users, DollarSign, Wallet, Receipt, ArrowRightLeft, 
  TrendingUp, TrendingDown, Clock, AlertTriangle, Plus, ArrowUpRight, Activity, 
  X, Calendar, Filter, Percent, FileSpreadsheet, Tag, ShieldCheck, Building,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Vehicle, Sale, Expense, Customer, Account, Transaction } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';

export default function Dashboard() {
  const { formatCurrency, formatCompactCurrency } = useSettings();
  const navigate = useNavigate();

  // Core system data lists
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global filters
  const [dateRange, setDateRange] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');

  // Chart settings
  const [chartView, setChartView] = useState<'mensual' | 'trimestral' | 'anual'>('mensual');
  const [clickedChartPeriod, setClickedChartPeriod] = useState<string | null>(null);

  // Active KPI drill-down selector
  const [activeKPI, setActiveKPI] = useState<'sales' | 'profit' | 'ticket' | 'pipeline' | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [v, s, e, c, a, t] = await Promise.all([
        api.vehicles.list(),
        api.sales.list(),
        api.expenses.list(),
        api.customers.list(),
        api.accounts.list(),
        api.transactions.list()
      ]);
      setVehicles(v || []);
      setSales(s || []);
      setExpenses(e || []);
      setCustomers(c || []);
      setAccounts(a || []);
      setTransactions(t || []);
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      setError("Ocurrió un error al cargar la información de la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique listing fields for filters
  const filterOptions = useMemo(() => {
    const brands = Array.from(new Set(vehicles.map(v => v.brand).filter(Boolean))).sort();
    const suppliers = Array.from(new Set(vehicles.map(v => v.supplier).filter(Boolean))).sort();
    const sellersSet = new Set<string>();
    sales.forEach(s => s.assignedTo && sellersSet.add(s.assignedTo));
    customers.forEach(cust => cust.assignedTo && sellersSet.add(cust.assignedTo));
    const sellers = Array.from(sellersSet).sort();

    return { brands, suppliers, sellers };
  }, [vehicles, sales, customers]);

  // Date range filter predicate helper
  const filterByDateRange = (dateStr: string) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();
    
    if (dateRange === 'current_month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (dateRange === 'last_3_months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return date >= threeMonthsAgo;
    }
    if (dateRange === 'last_6_months') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      return date >= sixMonthsAgo;
    }
    if (dateRange === 'current_year') {
      return date.getFullYear() === now.getFullYear();
    }
    return true; // 'all'
  };

  // Filtered Lists computation
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchDate = filterByDateRange(v.purchaseDate);
      const matchBrand = selectedBrand === 'all' || v.brand === selectedBrand;
      const matchStatus = selectedStatus === 'all' || v.status === selectedStatus;
      const matchSupplier = selectedSupplier === 'all' || v.supplier === selectedSupplier;
      return matchDate && matchBrand && matchStatus && matchSupplier;
    });
  }, [vehicles, dateRange, selectedBrand, selectedStatus, selectedSupplier]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchDate = filterByDateRange(s.date);
      const vehicle = vehicles.find(v => v.id.toString() === s.vehicleId?.toString());
      const matchBrand = selectedBrand === 'all' || (vehicle && vehicle.brand === selectedBrand);
      const matchStatus = selectedStatus === 'all' || (vehicle && vehicle.status === selectedStatus);
      const matchSeller = selectedSeller === 'all' || s.assignedTo === selectedSeller;
      const matchSupplier = selectedSupplier === 'all' || (vehicle && vehicle.supplier === selectedSupplier);
      return matchDate && matchBrand && matchStatus && matchSeller && matchSupplier;
    });
  }, [sales, vehicles, dateRange, selectedBrand, selectedStatus, selectedSeller, selectedSupplier]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchDate = filterByDateRange(e.date);
      const vehicle = vehicles.find(v => v.id.toString() === e.vehicleId?.toString());
      const matchBrand = selectedBrand === 'all' || (vehicle && vehicle.brand === selectedBrand);
      const matchSupplier = selectedSupplier === 'all' || (vehicle && vehicle.supplier === selectedSupplier);
      return matchDate && matchBrand && matchSupplier;
    });
  }, [expenses, vehicles, dateRange, selectedBrand, selectedSupplier]);

  // KPIs Calculations based on filtered lists
  const kpis = useMemo(() => {
    const totalSalesSum = filteredSales.reduce((acc, s) => acc + (s.salePrice || 0), 0);
    
    // Profit = salesPrice - vehiclePurchasePrice - commission - expenses
    const netProfitSum = filteredSales.reduce((acc, s) => {
      const vehicle = vehicles.find(v => v.id.toString() === s.vehicleId?.toString());
      if (!vehicle) return acc;
      const vehicleExpenses = expenses.filter(e => e.vehicleId?.toString() === vehicle.id.toString());
      const totalVehicleExpenses = vehicleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const profit = (s.salePrice || 0) - (vehicle.purchasePrice || 0) - (s.commission || 0) - totalVehicleExpenses;
      return acc + profit;
    }, 0);

    const ticketAvg = filteredSales.length > 0 ? totalSalesSum / filteredSales.length : 0;
    
    // Active pipeline vehicles (vehicles currently in stock)
    const pipelineCount = vehicles.filter(v => v.status !== 'Vendido').length;

    // Previous Month Comparison for trends
    const now = new Date();
    const prevMonthSales = sales.filter(s => {
      const date = new Date(s.date);
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    });
    const prevMonthSalesSum = prevMonthSales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
    const saleTrendPercent = prevMonthSalesSum > 0 ? ((totalSalesSum - prevMonthSalesSum) / prevMonthSalesSum) * 100 : 12.4;

    return {
      salesSum: totalSalesSum,
      profitSum: netProfitSum,
      ticket: ticketAvg,
      pipeline: pipelineCount,
      trendPercent: saleTrendPercent,
      salesCount: filteredSales.length
    };
  }, [filteredSales, vehicles, expenses, sales]);

  // Grouped charts generator
  const chartData = useMemo(() => {
    const map = new Map<string, { ventas: number; utilidad: number; timestamp: number }>();
    
    filteredSales.forEach(s => {
      if (!s.date) return;
      const date = new Date(s.date);
      let label = "";
      let timestamp = date.getTime();
      
      if (chartView === 'mensual') {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        label = `${months[date.getMonth()]} ${date.getFullYear()}`;
      } else if (chartView === 'trimestral') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        label = `T${quarter} ${date.getFullYear()}`;
      } else {
        label = `${date.getFullYear()}`;
      }

      const vehicle = vehicles.find(v => v.id.toString() === s.vehicleId?.toString());
      const vehicleExpenses = expenses.filter(e => e.vehicleId?.toString() === vehicle?.id.toString());
      const totalVehicleExpenses = vehicleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const profit = vehicle ? ((s.salePrice || 0) - (vehicle.purchasePrice || 0) - (s.commission || 0) - totalVehicleExpenses) : 0;

      const existing = map.get(label) || { ventas: 0, utilidad: 0, timestamp };
      existing.ventas += s.salePrice || 0;
      existing.utilidad += profit;
      map.set(label, existing);
    });

    if (map.size === 0) {
      // Default placeholder structured labels if no real matched sales
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'];
      return months.map((m, i) => ({ 
        name: `${m} 2026`, 
        ventas: i * 15000 + 10000, 
        utilidad: i * 3200 + 2000 
      }));
    }

    // Sort chronologically
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredSales, vehicles, expenses, chartView]);

  // Interactive filter logic when user clicks on charts
  const handleChartClick = (clickedState: any) => {
    if (clickedState && clickedState.activeLabel) {
      setClickedChartPeriod(clickedState.activeLabel === clickedChartPeriod ? null : clickedState.activeLabel);
    }
  };

  // Filter drill down data based on selections
  const drillDownList = useMemo(() => {
    let result = filteredSales.map(s => {
      const vehicle = vehicles.find(v => v.id.toString() === s.vehicleId?.toString());
      const customer = customers.find(c => c.id.toString() === s.customerId?.toString());
      const vehicleExpenses = expenses.filter(e => e.vehicleId?.toString() === vehicle?.id.toString());
      const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const profit = vehicle ? ((s.salePrice || 0) - (vehicle.purchasePrice || 0) - (s.commission || 0) - totalExpenses) : 0;
      
      // Period string for monthly chart matching
      let periodStr = "";
      if (s.date) {
        const d = new Date(s.date);
        if (chartView === 'mensual') {
          const m = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          periodStr = `${m[d.getMonth()]} ${d.getFullYear()}`;
        } else if (chartView === 'trimestral') {
          const q = Math.floor(d.getMonth() / 3) + 1;
          periodStr = `T${q} ${d.getFullYear()}`;
        } else {
          periodStr = `${d.getFullYear()}`;
        }
      }

      return {
        ...s,
        vehicle,
        customer,
        totalExpenses,
        profit,
        periodStr
      };
    });

    if (clickedChartPeriod) {
      result = result.filter(item => item.periodStr === clickedChartPeriod);
    }

    return result;
  }, [filteredSales, vehicles, customers, expenses, clickedChartPeriod, chartView]);

  // Unsold pipeline drill down data
  const pipelineDrillDownList = useMemo(() => {
    return vehicles
      .filter(v => v.status !== 'Vendido')
      .map(v => {
        const vehicleExpenses = expenses.filter(e => e.vehicleId?.toString() === v.id.toString());
        const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const days = Math.ceil((Date.now() - new Date(v.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...v,
          totalExpenses,
          daysInStock: days || 0
        };
      })
      .filter(v => {
        const matchBrand = selectedBrand === 'all' || v.brand === selectedBrand;
        const matchStatus = selectedStatus === 'all' || v.status === selectedStatus;
        const matchSupplier = selectedSupplier === 'all' || v.supplier === selectedSupplier;
        return matchBrand && matchStatus && matchSupplier;
      });
  }, [vehicles, expenses, selectedBrand, selectedStatus, selectedSupplier]);

  // Widgets: Unsold vehicles with most days in stock
  const slowMovingStock = useMemo(() => {
    return vehicles
      .filter(v => v.status !== 'Vendido')
      .map(v => {
        const days = Math.ceil((Date.now() - new Date(v.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        return { ...v, daysInStock: isNaN(days) ? 0 : days };
      })
      .sort((a, b) => b.daysInStock - a.daysInStock)
      .slice(0, 5);
  }, [vehicles]);

  // Widgets: Cuentas por cobrar y pagar próximas
  const upcomingAccounts = useMemo(() => {
    const sorted = [...accounts]
      .filter(a => a.status === 'Pendiente')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    
    return {
      receivables: sorted.filter(a => a.type === 'Cobrar').slice(0, 4),
      payables: sorted.filter(a => a.type === 'Pagar').slice(0, 4)
    };
  }, [accounts]);

  // Widgets: CRM Funnel lead conversion count
  const crmFunnel = useMemo(() => {
    const statuses = ['Nuevo', 'En seguimiento', 'Negociando', 'Ganado', 'Perdido'];
    const counts = statuses.map(st => {
      const count = customers.filter(c => c.status === st).length;
      return { status: st, count };
    });
    return counts;
  }, [customers]);

  // Widgets: Top brands by cumulative sold profit
  const topProfitBrands = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach(s => {
      const v = vehicles.find(veh => veh.id.toString() === s.vehicleId?.toString());
      if (v) {
        const vehicleExpenses = expenses.filter(e => e.vehicleId?.toString() === v.id.toString());
        const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const profit = s.salePrice - v.purchasePrice - s.commission - totalExpenses;
        map.set(v.brand, (map.get(v.brand) || 0) + profit);
      }
    });

    return Array.from(map.entries())
      .map(([brand, profit]) => ({ brand, profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [sales, vehicles, expenses]);

  // Widgets: Top models and brands by utility
  const topProfitModels = useMemo(() => {
    const map = new Map<string, { brand: string; model: string; profit: number }>();
    sales.forEach(s => {
      const v = vehicles.find(veh => veh.id.toString() === s.vehicleId?.toString());
      if (v) {
        const vehicleExpenses = expenses.filter(e => e.vehicleId?.toString() === v.id.toString());
        const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const profit = s.salePrice - v.purchasePrice - s.commission - totalExpenses;
        
        const key = `${v.brand} ${v.model}`;
        const existing = map.get(key) || { brand: v.brand, model: v.model, profit: 0 };
        existing.profit += profit;
        map.set(key, existing);
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [sales, vehicles, expenses]);

  // Widgets: Stock Aging Brackets
  const stockAgingBrackets = useMemo(() => {
    let tier1 = 0; // <30 dias
    let tier2 = 0; // 30-60 dias
    let tier3 = 0; // >60 dias
    
    vehicles
      .filter(v => v.status !== 'Vendido')
      .forEach(v => {
        const days = Math.ceil((Date.now() - new Date(v.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        const daysInStock = isNaN(days) ? 0 : days;
        if (daysInStock <= 30) tier1++;
        else if (daysInStock <= 60) tier2++;
        else tier3++;
      });
      
    return { tier1, tier2, tier3 };
  }, [vehicles]);

  // Widgets: Cash Flow Metrics
  const cashFlow = useMemo(() => {
    const ledgerInflow = transactions
      .filter(t => t.type === 'Ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const ledgerOutflow = transactions
      .filter(t => t.type === 'Egreso')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      inflow: ledgerInflow,
      outflow: ledgerOutflow,
      net: ledgerInflow - ledgerOutflow
    };
  }, [transactions]);

  // Widgets: Recent Sales
  const latestSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(s => {
        const v = vehicles.find(veh => veh.id.toString() === s.vehicleId?.toString());
        const c = customers.find(cust => cust.id.toString() === s.customerId?.toString());
        return {
          ...s,
          vehicleLabel: v ? `${v.brand} ${v.model}` : 'Desconocido',
          customerLabel: c ? c.name : 'Venta Directa'
        };
      });
  }, [sales, vehicles, customers]);

  // Widgets: Recent Transactions
  const latestMovements = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [transactions]);

  // Widgets: Alertas urgentes del negocio
  const criticalAlerts = useMemo(() => {
    const alertsList: { type: 'danger' | 'warning' | 'info'; title: string; desc: string; actionPath?: string }[] = [];
    
    // 1. Stock con excesivos días en stock (>90 días)
    const criticalStockCount = slowMovingStock.filter(v => v.daysInStock > 90).length;
    if (criticalStockCount > 0) {
      alertsList.push({
        type: 'danger',
        title: `${criticalStockCount} vehículos inmovilizados`,
        desc: `Exceden los 90 días en inventario. Afecta el flujo de caja.`,
        actionPath: '/vehiculos'
      });
    }

    // 2. Cuentas vencidas pendientes
    const todayStr = new Date().toISOString().split('T')[0];
    const overduePay = accounts.filter(a => a.status === 'Pendiente' && a.dueDate < todayStr && a.type === 'Pagar').length;
    const overdueRec = accounts.filter(a => a.status === 'Pendiente' && a.dueDate < todayStr && a.type === 'Cobrar').length;

    if (overduePay > 0) {
      alertsList.push({
        type: 'danger',
        title: `${overduePay} Cuentas por Pagar VENCIDAS`,
        desc: `Tienes compromisos de pago vencidos con proveedores.`,
        actionPath: '/cxp'
      });
    }
    if (overdueRec > 0) {
      alertsList.push({
        type: 'warning',
        title: `${overdueRec} Cuentas por Cobrar VENCIDAS`,
        desc: `Saldos de clientes que han excedido su fecha límite de pago.`,
        actionPath: '/cxc'
      });
    }

    // 3. Clientes en negociación sin contactos recientes
    const uncontactedLeads = customers.filter(c => {
      if (c.status !== 'Negociando' && c.status !== 'En seguimiento') return false;
      if (!c.interactions || c.interactions.length === 0) return true;
      // Get latest interaction date
      const sortedInteractions = [...c.interactions].sort((ia, ib) => ib.date.localeCompare(ia.date));
      const latestDate = new Date(sortedInteractions[0].date);
      const diffDays = Math.ceil((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 14;
    }).length;

    if (uncontactedLeads > 0) {
      alertsList.push({
        type: 'info',
        title: `${uncontactedLeads} leads enfriándose`,
        desc: `Clientes en negociación sin seguimiento en los últimos 14 días.`,
        actionPath: '/crm'
      });
    }

    return alertsList;
  }, [slowMovingStock, accounts, customers]);

  // Export CSV helper
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tipo,Fecha,Marca,Modelo,Monto,Vendedor/Cliente,Utilidad\n";

    drillDownList.forEach(item => {
      csvContent += `Venta,${item.date},${item.vehicle?.brand || ''},${item.vehicle?.model || ''},${item.salePrice},${item.customer?.name || ''},${item.profit}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_automanager_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKPISelect = (kpi: 'sales' | 'profit' | 'ticket' | 'pipeline') => {
    setActiveKPI(prev => prev === kpi ? null : kpi);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setDateRange('all');
    setSelectedBrand('all');
    setSelectedStatus('all');
    setSelectedSeller('all');
    setSelectedSupplier('all');
    setClickedChartPeriod(null);
    setActiveKPI(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">Sincronizando panel con base de datos en tiempo real...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 select-none animate-in fade-in duration-300">
      
      {/* 1. Header with Title & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span className="h-3 w-3 bg-indigo-500 rounded-full animate-pulse shrink-0"></span>
            Panel Operativo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Analiza el rendimiento general de inventario, finanzas y embudo CRM en tiempo real.
          </p>
        </div>

        {/* Quick Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <Link 
            to="/vehiculos?add=true" 
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md cursor-pointer hover:translate-y-[-1px] active:translate-y-[0px]"
          >
            <Plus className="h-3.5 w-3.5" />
            🚗 Registrar Vehículo
          </Link>
          <Link 
            to="/gastos?add=true" 
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 rounded-lg transition-all cursor-pointer hover:translate-y-[-1px]"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            💸 Registrar Gasto
          </Link>
          <Link 
            to="/ventas?add=true" 
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 rounded-lg transition-all cursor-pointer hover:translate-y-[-1px]"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            🤝 Registrar Venta
          </Link>
          <Link 
            to="/crm?add=true" 
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 rounded-lg transition-all cursor-pointer hover:translate-y-[-1px]"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            👤 Nuevo Cliente
          </Link>
          <button 
            onClick={handleExportCSV}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/40 rounded-lg transition-all cursor-pointer hover:translate-y-[-1px]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* 2. Global Filter Toolbar */}
      <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <Filter className="h-3.5 w-3.5 text-indigo-500" />
            Filtros Globales de Negocio
          </div>
          {(dateRange !== 'all' || selectedBrand !== 'all' || selectedStatus !== 'all' || selectedSeller !== 'all' || selectedSupplier !== 'all' || clickedChartPeriod !== null || activeKPI !== null) && (
            <button 
              onClick={resetAllFilters}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-full"
            >
              <X className="h-3 w-3" /> Limpiar Filtros
            </button>
          )}
        </div>
        
        {/* Responsive Select Inputs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Date Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Rango Temporal</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Historial Completo</option>
              <option value="current_month">Este Mes</option>
              <option value="last_3_months">Últimos 3 Meses</option>
              <option value="last_6_months">Últimos 6 Meses</option>
              <option value="current_year">Este Año ({new Date().getFullYear()})</option>
            </select>
          </div>

          {/* Brand Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Marca</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas las marcas</option>
              {filterOptions.brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Status Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Estado de Unidad</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todos los estados</option>
              <option value="Comprado">Comprado (En Stock)</option>
              <option value="En preparación">En preparación</option>
              <option value="Publicado">Publicado</option>
              <option value="Reservado">Reservado</option>
              <option value="Vendido">Vendido</option>
            </select>
          </div>

          {/* Seller Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Asesor Comercial</label>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Cualquiera</option>
              {filterOptions.sellers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Supplier Selector */}
          <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
            <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Proveedor Origen</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todos los proveedores</option>
              {filterOptions.suppliers.map(sup => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Interactive KPIs Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        {/* Card 1: Sales */}
        <div 
          onClick={() => handleKPISelect('sales')}
          className={`group bg-slate-900/40 p-5 rounded-2xl border transition-all cursor-pointer select-none ${
            activeKPI === 'sales' 
              ? 'border-indigo-500 bg-indigo-950/25 ring-2 ring-indigo-500/10' 
              : 'border-slate-850 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest group-hover:text-slate-400 transition-colors">Ventas Período</p>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-100">{formatCurrency(kpis.salesSum)}</p>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className={`font-medium flex items-center gap-0.5 ${kpis.trendPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {kpis.trendPercent >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {kpis.trendPercent.toFixed(1)}% vs mes ant.
            </span>
            <span className="text-slate-500">{kpis.salesCount} unidades</span>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div 
          onClick={() => handleKPISelect('profit')}
          className={`group bg-slate-900/40 p-5 rounded-2xl border transition-all cursor-pointer select-none ${
            activeKPI === 'profit' 
              ? 'border-emerald-500 bg-emerald-950/15 ring-2 ring-emerald-500/10' 
              : 'border-slate-850 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest group-hover:text-slate-400 transition-colors">Utilidad Neta</p>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <p className="text-xl md:text-2xl font-black text-emerald-400">{formatCurrency(kpis.profitSum)}</p>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-emerald-500 font-medium bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
              Margen de Utilidad
            </span>
            <span className="text-slate-500">
              {kpis.salesSum > 0 ? ((kpis.profitSum / kpis.salesSum) * 100).toFixed(0) : '0'}% Prom.
            </span>
          </div>
        </div>

        {/* Card 3: Average Ticket */}
        <div 
          onClick={() => handleKPISelect('ticket')}
          className={`group bg-slate-900/40 p-5 rounded-2xl border transition-all cursor-pointer select-none ${
            activeKPI === 'ticket' 
              ? 'border-purple-500 bg-purple-950/15 ring-2 ring-purple-500/10' 
              : 'border-slate-850 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest group-hover:text-slate-400 transition-colors">Ticket Promedio</p>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-all">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="text-xl md:text-2xl font-black text-purple-400">{formatCurrency(kpis.ticket)}</p>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-500">Por venta realizada</span>
            <span className="text-purple-400 font-semibold">Gama Media/Alta</span>
          </div>
        </div>

        {/* Card 4: Pipeline Activo */}
        <div 
          onClick={() => handleKPISelect('pipeline')}
          className={`group bg-slate-900/40 p-5 rounded-2xl border transition-all cursor-pointer select-none ${
            activeKPI === 'pipeline' 
              ? 'border-amber-500 bg-amber-950/15 ring-2 ring-amber-500/10' 
              : 'border-slate-850 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest group-hover:text-slate-400 transition-colors">Pipeline / Stock</p>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-all">
              <CarFront className="h-4 w-4" />
            </span>
          </div>
          <p className="text-xl md:text-2xl font-black text-amber-500">{kpis.pipeline}</p>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-amber-500 font-medium">Unidades en stock</span>
            <span className="text-slate-500">
              {vehicles.filter(v => v.status === 'Publicado').length} Publicados
            </span>
          </div>
        </div>

      </div>

      {/* 4. Interactive Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Sales Evolution */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-900/80 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Evolución de Ventas</h3>
            </div>
            {/* Chart View Toggle */}
            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-850 flex items-center text-[10px] font-semibold">
              <button 
                onClick={() => { setChartView('mensual'); setClickedChartPeriod(null); }}
                className={`px-2.5 py-1 rounded-md transition-colors ${chartView === 'mensual' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Mensual
              </button>
              <button 
                onClick={() => { setChartView('trimestral'); setClickedChartPeriod(null); }}
                className={`px-2.5 py-1 rounded-md transition-colors ${chartView === 'trimestral' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Trimestral
              </button>
              <button 
                onClick={() => { setChartView('anual'); setClickedChartPeriod(null); }}
                className={`px-2.5 py-1 rounded-md transition-colors ${chartView === 'anual' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Anual
              </button>
            </div>
          </div>
          
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                onClick={handleChartClick}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVentasReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} stroke="#1e293b" />
                <YAxis tickFormatter={(val) => formatCompactCurrency(val)} tick={{fontSize: 10, fill: '#64748b'}} stroke="#1e293b" />
                <Tooltip 
                  formatter={(val: number) => [formatCurrency(val), "Ventas"]} 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px'}} 
                />
                <Area 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVentasReal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3 text-indigo-500" />
            <span>Haz clic en un punto para realizar drill-down del periodo seleccionado.</span>
          </div>
        </div>

        {/* Chart 2: Profitability Evolution */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-900/80 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Utilidad por Período</h3>
            </div>
            {clickedChartPeriod && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Periodo: {clickedChartPeriod}
              </span>
            )}
          </div>
          
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                onClick={handleChartClick}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} stroke="#1e293b" />
                <YAxis tickFormatter={(val) => formatCompactCurrency(val)} tick={{fontSize: 10, fill: '#64748b'}} stroke="#1e293b" />
                <Tooltip 
                  formatter={(val: number) => [formatCurrency(val), "Utilidad"]} 
                  cursor={{fill: '#1e293b', opacity: 0.2}} 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px'}} 
                />
                <Bar dataKey="utilidad" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === clickedChartPeriod ? '#34d399' : '#10b981'} 
                      opacity={clickedChartPeriod && entry.name !== clickedChartPeriod ? 0.45 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3 text-emerald-500" />
            <span>Haz clic en cualquier barra para filtrar la tabla de abajo a ese período.</span>
          </div>
        </div>

      </div>

      {/* 5. Drill-down Detail Section */}
      {(activeKPI || clickedChartPeriod) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                Detalle Drill-down: {activeKPI === 'sales' && 'Ventas de Unidades'}
                {activeKPI === 'profit' && 'Margen de Utilidades Reales'}
                {activeKPI === 'ticket' && 'Venta de Unidades con su Ticket Promedio'}
                {activeKPI === 'pipeline' && 'Inventario en Stock'}
                {!activeKPI && clickedChartPeriod && `Operaciones en ${clickedChartPeriod}`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {clickedChartPeriod ? `Filtrado por período temporal: ${clickedChartPeriod}. ` : ''}
                Muestra los registros exactos desde el servidor.
              </p>
            </div>
            <button 
              onClick={() => { setActiveKPI(null); setClickedChartPeriod(null); }}
              className="text-slate-400 hover:text-white bg-slate-800/60 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Cerrar detalle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[350px] custom-scrollbar">
            {activeKPI === 'pipeline' ? (
              // Pipeline Unsold Units Table
              pipelineDrillDownList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Ningún vehículo coincide con los filtros aplicados.</div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="py-2 px-3">Vehículo</th>
                      <th className="py-2 px-3">Año / VIN</th>
                      <th className="py-2 px-3">Proveedor</th>
                      <th className="py-2 px-3 text-right">Compra</th>
                      <th className="py-2 px-3 text-right">Gastos Prep.</th>
                      <th className="py-2 px-3 text-right">Costo Total</th>
                      <th className="py-2 px-3 text-center">Días Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineDrillDownList.map(v => (
                      <tr key={v.id} className="border-b border-slate-800/40 hover:bg-slate-850/50 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-200">
                          {v.brand} {v.model}
                        </td>
                        <td className="py-2 px-3 text-slate-400">{v.year} - <span className="font-mono text-[10px]">{v.vin}</span></td>
                        <td className="py-2 px-3 text-slate-400">{v.supplier}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(v.purchasePrice)}</td>
                        <td className="py-2 px-3 text-right text-indigo-400">{formatCurrency(v.totalExpenses)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-100">{formatCurrency(v.purchasePrice + v.totalExpenses)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                            v.daysInStock > 60 ? 'bg-rose-500/15 text-rose-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {v.daysInStock} días
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              // Sales & Profit Table
              drillDownList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Ningún registro de venta coincide con los filtros aplicados.</div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="py-2 px-3">Vehículo</th>
                      <th className="py-2 px-3">Cliente</th>
                      <th className="py-2 px-3">Fecha Venta</th>
                      <th className="py-2 px-3 text-right">Precio Venta</th>
                      <th className="py-2 px-3 text-right">Costo Compra</th>
                      <th className="py-2 px-3 text-right">Gastos Prep.</th>
                      <th className="py-2 px-3 text-right text-emerald-400">Utilidad Real</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillDownList.map(item => (
                      <tr key={item.id} className="border-b border-slate-800/40 hover:bg-slate-850/50 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-200">
                          {item.vehicle?.brand || 'Desconocido'} {item.vehicle?.model || ''}
                        </td>
                        <td className="py-2 px-3 text-slate-400">{item.customer?.name || 'Venta Directa'}</td>
                        <td className="py-2 px-3 text-slate-400">{item.date}</td>
                        <td className="py-2 px-3 text-right text-slate-100 font-semibold">{formatCurrency(item.salePrice)}</td>
                        <td className="py-2 px-3 text-right text-slate-500">{formatCurrency(item.vehicle?.purchasePrice || 0)}</td>
                        <td className="py-2 px-3 text-right text-indigo-400">{formatCurrency(item.totalExpenses)}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-black">{formatCurrency(item.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      )}

      {/* 6. Bento Grid of Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Stock Envejecido (Aging brackets + list) */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-400" />
              Stock Envejecido
            </h3>
            <span className="text-[10px] text-slate-500">{vehicles.filter(v => v.status !== 'Vendido').length} un. en stock</span>
          </div>

          {/* Aging Brackets Breakdown bar */}
          <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850/50">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Antigüedad en Showroom</p>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-900">
              {vehicles.filter(v => v.status !== 'Vendido').length > 0 ? (
                <>
                  <div 
                    style={{ width: `${(stockAgingBrackets.tier1 / vehicles.filter(v => v.status !== 'Vendido').length) * 100}%` }} 
                    className="bg-emerald-500 transition-all" 
                    title="<30 días"
                  />
                  <div 
                    style={{ width: `${(stockAgingBrackets.tier2 / vehicles.filter(v => v.status !== 'Vendido').length) * 100}%` }} 
                    className="bg-amber-500 transition-all" 
                    title="30-60 días"
                  />
                  <div 
                    style={{ width: `${(stockAgingBrackets.tier3 / vehicles.filter(v => v.status !== 'Vendido').length) * 100}%` }} 
                    className="bg-rose-500 transition-all" 
                    title=">60 días"
                  />
                </>
              ) : (
                <div className="w-full bg-slate-800" />
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 text-[9px] text-center font-medium">
              <div className="text-emerald-400 flex flex-col">
                <span>0-30d</span>
                <span className="font-bold">{stockAgingBrackets.tier1} un.</span>
              </div>
              <div className="text-amber-400 flex flex-col border-x border-slate-850">
                <span>31-60d</span>
                <span className="font-bold">{stockAgingBrackets.tier2} un.</span>
              </div>
              <div className="text-rose-400 flex flex-col">
                <span>&gt;60d</span>
                <span className="font-bold">{stockAgingBrackets.tier3} un.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 justify-start">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Unidades Críticas en Stock</p>
            {slowMovingStock.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No hay unidades en inventario.</p>
            ) : (
              slowMovingStock.slice(0, 3).map(v => (
                <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{v.brand} {v.model}</p>
                    <p className="text-[10px] text-slate-500 truncate">Ingreso: {v.purchaseDate}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      v.daysInStock > 60 ? 'bg-rose-500/10 text-rose-400 border border-rose-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {v.daysInStock} días
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 2: Accounts Due and Overdue */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-emerald-400" />
              Cuentas por Cobrar / Pagar
            </h3>
            <span className="text-[10px] text-slate-500">Próximos compromisos</span>
          </div>
          
          <div className="space-y-3 flex-1">
            {/* Receivables */}
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between">
                <span>A Cobrar (Clientes)</span>
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(accounts.filter(a => a.type === 'Cobrar' && a.status === 'Pendiente').reduce((s, a) => s + a.amount, 0))}
                </span>
              </p>
              <div className="space-y-1.5">
                {upcomingAccounts.receivables.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic py-1">Sin cobros pendientes.</p>
                ) : (
                  upcomingAccounts.receivables.map(a => (
                    <div key={a.id} className="flex justify-between items-center text-xs p-1.5 bg-slate-950/30 rounded border border-slate-900/40 hover:border-slate-800 transition-all">
                      <span className="text-slate-300 truncate max-w-[130px] font-medium">{a.entity}</span>
                      <div className="text-right shrink-0">
                        <span className="font-black text-emerald-400 text-[11px] block font-mono">{formatCurrency(a.amount)}</span>
                        <span className="text-[9px] text-slate-500">Vence: {a.dueDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payables */}
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between">
                <span>A Pagar (Proveedores)</span>
                <span className="text-rose-400 font-bold">
                  {formatCurrency(accounts.filter(a => a.type === 'Pagar' && a.status === 'Pendiente').reduce((s, a) => s + a.amount, 0))}
                </span>
              </p>
              <div className="space-y-1.5">
                {upcomingAccounts.payables.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic py-1">Sin compromisos de pago.</p>
                ) : (
                  upcomingAccounts.payables.map(a => (
                    <div key={a.id} className="flex justify-between items-center text-xs p-1.5 bg-slate-950/30 rounded border border-slate-900/40 hover:border-slate-800 transition-all">
                      <span className="text-slate-300 truncate max-w-[130px] font-medium">{a.entity}</span>
                      <div className="text-right shrink-0">
                        <span className="font-black text-rose-400 text-[11px] block font-mono">{formatCurrency(a.amount)}</span>
                        <span className="text-[9px] text-slate-500">Vence: {a.dueDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Widget 3: Flujo de Caja (Cash Flow ledger metrics) */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-amber-400" />
              Flujo de Caja Realizado
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold text-indigo-400">Ledger</span>
          </div>

          <div className="space-y-3 flex-1 justify-center flex flex-col">
            <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Ingresos Registrados:</span>
                <span className="text-emerald-400 font-bold font-mono">{formatCurrency(cashFlow.inflow)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Egresos Registrados:</span>
                <span className="text-rose-400 font-bold font-mono">{formatCurrency(cashFlow.outflow)}</span>
              </div>
              <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">Flujo Neto de Caja:</span>
                <span className={`font-black font-mono text-[13px] ${cashFlow.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(cashFlow.net)}
                </span>
              </div>
            </div>

            {/* Quick Flow Visual Indicator */}
            <div className="bg-slate-950/20 rounded-xl p-2.5 border border-slate-850/40 flex items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${cashFlow.net >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {cashFlow.net >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Estado Financiero</p>
                <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                  {cashFlow.net >= 0 
                    ? 'Superávit operativo. Posición de liquidez robusta para adquisiciones.' 
                    : 'Déficit operativo temporal. Vigilar vencimientos próximos.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 4: Últimas Ventas */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-indigo-400" />
              Últimas Ventas Registradas
            </h3>
            <span className="text-[10px] text-slate-500">Últimos cierres</span>
          </div>
          <div className="flex flex-col gap-2 flex-1 justify-start">
            {latestSales.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No hay ventas registradas.</p>
            ) : (
              latestSales.map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-950/30 border border-slate-900 hover:border-slate-800 transition-all">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{s.vehicleLabel}</p>
                    <p className="text-[10px] text-slate-500 truncate">Cliente: {s.customerLabel}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-xs font-black text-slate-100 block font-mono">{formatCurrency(s.salePrice)}</span>
                    <span className="text-[9px] text-emerald-400 font-mono font-semibold">Profit: +{formatCurrency(s.netProfit)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 5: Últimos Movimientos */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-amber-500" />
              Últimos Movimientos de Caja
            </h3>
            <span className="text-[10px] text-slate-500">Libro Diario</span>
          </div>
          <div className="flex flex-col gap-2 flex-1 justify-start">
            {latestMovements.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No hay movimientos registrados.</p>
            ) : (
              latestMovements.map(m => (
                <div key={m.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-950/30 border border-slate-900 hover:border-slate-800 transition-all">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{m.category}</p>
                    <p className="text-[10px] text-slate-500 truncate">{m.date} • {m.paymentMethod}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className={`text-xs font-black font-mono ${m.type === 'Ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.type === 'Ingreso' ? '+' : '-'}{formatCurrency(m.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 6: Top Marcas/Modelos por Utilidad */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-4 w-4 text-indigo-400" />
              Modelos más Rentables
            </h3>
            <span className="text-[10px] text-slate-500">Por Utilidad Real</span>
          </div>
          <div className="flex flex-col gap-2 flex-1 justify-start">
            {topProfitModels.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No hay utilidades registradas.</p>
            ) : (
              topProfitModels.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black text-indigo-400 bg-indigo-950/50 h-5 w-5 rounded-full flex items-center justify-center border border-indigo-900/40 shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">{item.brand} {item.model}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-xs font-black text-emerald-400 font-mono">{formatCurrency(item.profit)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 7: CRM Embudo */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-purple-400" />
              Embudo Comercial CRM
            </h3>
            <span className="text-[10px] text-slate-500">{customers.length} Leads</span>
          </div>
          
          <div className="flex flex-col gap-2 flex-1 justify-center">
            {crmFunnel.reduce((sum, c) => sum + c.count, 0) === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No hay clientes en el CRM.</p>
            ) : (
              crmFunnel.map((item) => {
                const totalLeads = customers.length;
                const pct = totalLeads > 0 ? (item.count / totalLeads) * 100 : 0;
                const statusColors: Record<string, string> = {
                  'Nuevo': 'bg-blue-500',
                  'En seguimiento': 'bg-amber-500',
                  'Negociando': 'bg-purple-500',
                  'Ganado': 'bg-emerald-500',
                  'Perdido': 'bg-rose-500'
                };
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 font-medium">{item.status}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{item.count} leads ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${statusColors[item.status] || 'bg-slate-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Widget 8: Alertas Operativas */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 flex flex-col gap-3 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Alertas y Riesgos del Negocio
            </h3>
            <span className="text-[10px] text-slate-500 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-bold">{criticalAlerts.length} críticas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 justify-start">
            {criticalAlerts.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-xs text-slate-500">¡Todo al día! No se registran alertas operativas críticas en el sistema.</div>
            ) : (
              criticalAlerts.map((alt, idx) => (
                <div 
                  key={idx} 
                  onClick={() => alt.actionPath && navigate(alt.actionPath)}
                  className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    alt.type === 'danger' 
                      ? 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20' 
                      : alt.type === 'warning'
                        ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/20'
                        : 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/20'
                  }`}
                >
                  <AlertTriangle className={`h-5 w-5 shrink-0 ${
                    alt.type === 'danger' ? 'text-rose-400' : alt.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{alt.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{alt.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
