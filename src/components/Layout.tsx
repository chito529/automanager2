import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CarFront, FileText, Users, ShoppingCart, 
  ArrowLeftRight, Wallet, Receipt, Bell, BarChart3, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useSettings } from '@/contexts/SettingsContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vehículos', href: '/vehiculos', icon: CarFront },
  { name: 'Gastos', href: '/gastos', icon: FileText },
  { name: 'Clientes (CRM)', href: '/crm', icon: Users },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Movimientos', href: '/movimientos', icon: ArrowLeftRight },
  { name: 'Cuentas por Cobrar', href: '/cxc', icon: Wallet },
  { name: 'Cuentas por Pagar', href: '/cxp', icon: Receipt },
  { name: 'Alertas', href: '/alertas', icon: Bell },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();
  const user = auth.currentUser;
  const { currency, setCurrency } = useSettings();
  
  const handleSignOut = () => {
    signOut(auth);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="p-6 mb-2">
          <div className="text-indigo-500 font-bold text-xl flex items-center gap-2">
            <CarFront className="h-8 w-8 text-indigo-500" />
            AutoManager
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Business Manager</p>
        </div>
        <nav className="flex-1 px-4 space-y-1 text-sm font-medium overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white',
                  'group flex items-center px-3 py-2 rounded-lg transition-colors gap-3 relative'
                )}
              >
                {isActive && <span className="absolute left-0 w-1 h-4 bg-indigo-500 rounded-full"></span>}
                <item.icon
                  className={cn(
                    isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-300',
                    'h-5 w-5 flex-shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(user?.displayName || user?.email)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate text-slate-200">{user?.displayName || user?.email || 'Usuario'}</p>
                <p className="text-[10px] text-slate-500">Administrador</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        <header className="h-16 bg-slate-950 border-b border-slate-900 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-semibold text-slate-200">
            {navigation.find(n => n.href === location.pathname)?.name || 'AutoManager'}
          </h1>
          <div className="flex gap-4 items-center">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'PYG' | 'USD')}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden md:block"
            >
              <option value="PYG">Guaraníes (₲)</option>
              <option value="USD">Dólares ($)</option>
            </select>
            <div className="flex gap-4 md:hidden items-center">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'PYG' | 'USD')}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="PYG">₲</option>
                <option value="USD">$</option>
              </select>
              <CarFront className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
