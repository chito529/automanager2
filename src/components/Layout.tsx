import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CarFront, FileText, Users, ShoppingCart, 
  ArrowLeftRight, Wallet, Receipt, Bell, BarChart3, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { auth } from '../lib/auth';
import { ensureFallbackChecked } from '@/lib/api';

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
  const { currency, setCurrency } = useSettings();
  const user = auth.currentUser;
  const [isLocal, setIsLocal] = React.useState(false);

  React.useEffect(() => {
    ensureFallbackChecked().then(local => setIsLocal(local));
  }, []);

  const handleSignOut = () => {
    auth.signOut();
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
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
        <div className="p-4 mt-auto border-t border-slate-800/50 text-center">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest bg-slate-950 px-2 py-1.5 rounded-full border border-slate-800/60 inline-block w-full">
            Acceso Público
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        <header className="h-16 bg-slate-950 border-b border-slate-900 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-semibold text-slate-200">
            {navigation.find(n => n.href === location.pathname)?.name || 'AutoManager'}
          </h1>
          <div className="flex gap-3 items-center">
            {isLocal ? (
              <span className="text-[11px] bg-amber-500/10 text-amber-400 px-3 py-1 border border-amber-500/20 rounded-full font-medium flex items-center gap-1.5" title="La base de datos del servidor no está disponible. Usando almacenamiento local seguro del navegador.">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Modo Local
              </span>
            ) : (
              <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-3 py-1 border border-emerald-500/20 rounded-full font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Modo Nube
              </span>
            )}
            <span className="text-[11px] bg-indigo-900/40 text-indigo-300 px-3 py-1 border border-indigo-800/60 rounded-full font-semibold">
              USD ($)
            </span>
            <div className="flex gap-4 md:hidden items-center">
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
