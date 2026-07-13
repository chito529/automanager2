import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CarFront, FileText, Users, ShoppingCart, 
  ArrowLeftRight, Wallet, Receipt, Bell, BarChart3, LogOut,
  Database, RefreshCw, CheckCircle2, XCircle, AlertCircle, ExternalLink, Lock
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
  
  // Connection Modal Settings
  const [isConnModalOpen, setIsConnModalOpen] = React.useState(false);
  const [backendUrl, setBackendUrl] = React.useState(localStorage.getItem('auto_manager_backend_url') || '');
  const [forceCloud, setForceCloud] = React.useState(localStorage.getItem('auto_manager_force_cloud') === 'true');
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<'success' | 'success_forced' | 'failed_local' | 'error' | null>(null);

  React.useEffect(() => {
    ensureFallbackChecked().then(local => setIsLocal(local));
  }, []);

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (backendUrl.trim()) {
        localStorage.setItem('auto_manager_backend_url', backendUrl.trim());
      } else {
        localStorage.removeItem('auto_manager_backend_url');
      }

      if (forceCloud) {
        localStorage.setItem('auto_manager_force_cloud', 'true');
      } else {
        localStorage.removeItem('auto_manager_force_cloud');
      }

      // Re-trigger health check probe with forceRefresh=true
      const isStillLocal = await ensureFallbackChecked(true);
      setIsLocal(isStillLocal);

      if (forceCloud) {
        setTestResult('success_forced');
      } else {
        if (!isStillLocal) {
          setTestResult('success');
        } else {
          setTestResult('failed_local');
        }
      }
    } catch (err: any) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

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
            <button 
              onClick={() => setIsConnModalOpen(true)}
              className="hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none"
              title="Configuración de Conexión de Base de Datos"
            >
              {isLocal ? (
                <span className="text-[11px] bg-amber-500/10 text-amber-400 px-3 py-1 border border-amber-500/20 rounded-full font-medium flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Modo Local
                </span>
              ) : (
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-3 py-1 border border-emerald-500/20 rounded-full font-medium flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Modo Nube
                </span>
              )}
            </button>
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

      {/* Database Connection Settings Modal */}
      {isConnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Centro de Conexión de Base de Datos</h3>
              </div>
              <button 
                onClick={() => {
                  setIsConnModalOpen(false);
                  setTestResult(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              {/* Status Banner */}
              <div className={cn(
                "p-4 rounded-lg border flex items-start gap-3",
                isLocal 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              )}>
                {isLocal ? (
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    {isLocal ? 'Modo de Almacenamiento Local Activo' : 'Conectado a la Base de Datos en la Nube'}
                  </h4>
                  <p className="text-xs mt-1 text-slate-400 leading-relaxed">
                    {isLocal 
                      ? 'La aplicación está operando offline e independiente en tu navegador usando almacenamiento local seguro (localStorage). Los cambios no se guardan en el servidor.'
                      : 'La aplicación está comunicándose de forma exitosa con el servidor en la nube y la base de datos de producción.'}
                  </p>
                </div>
              </div>

              {/* Form Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    URL del Backend Express (Opcional)
                  </label>
                  <input 
                    type="text" 
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://tu-api.ejemplo.com (dejar vacío para relativo)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Útil si estás hospedando la interfaz estática en <strong>Cloudflare Pages</strong> y la API está en otro servidor, como <strong>Cloud Run</strong>. De lo contrario, déjalo en blanco.
                  </p>
                </div>

                <div className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-indigo-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Forzar Modo Nube</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={forceCloud}
                        onChange={(e) => setForceCloud(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Si tu proxy (Cloudflare, etc.) bloquea la ruta de prueba rápida (<code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">/api/health</code>) pero la API funciona normalmente, activa esta opción para ignorar el check y forzar la sincronización en la nube.
                  </p>
                </div>
              </div>

              {/* Cloudflare Guide */}
              <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-lg p-4 space-y-2 text-xs text-indigo-300">
                <div className="font-semibold flex items-center gap-1.5">
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  ¿Soportando Cloudflare? Tips importantes:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed">
                  <li>
                    Asegúrate de que el modo de encriptación <strong>SSL/TLS</strong> esté configurado como <strong>Full</strong> o <strong>Full (strict)</strong> en Cloudflare para evitar loops de redirección infinita.
                  </li>
                  <li>
                    Verifica que las reglas de caché de Cloudflare no bloqueen ni cacheen las respuestas de las rutas API (<code className="bg-slate-900 text-indigo-200 px-1 rounded">/api/*</code>).
                  </li>
                </ul>
              </div>

              {/* Test Results Display */}
              {testResult && (
                <div className={cn(
                  "p-3 rounded-lg border text-xs flex items-center gap-2",
                  testResult === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
                  testResult === 'success_forced' && "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
                  testResult === 'failed_local' && "bg-amber-500/10 border-amber-500/20 text-amber-300",
                  testResult === 'error' && "bg-red-500/10 border-red-500/20 text-red-300"
                )}>
                  {testResult === 'success' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>¡Prueba exitosa! Conexión activa con el Servidor en la Nube.</span>
                    </>
                  )}
                  {testResult === 'success_forced' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>Sincronización de Nube Forzada. El sistema ignorará futuras fallas en pruebas rápidas.</span>
                    </>
                  )}
                  {testResult === 'failed_local' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>El servidor backend no respondió de manera esperada. Revertido a Modo Local para proteger tus datos.</span>
                    </>
                  )}
                  {testResult === 'error' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                      <span>Error desconocido al conectar con el servidor backend.</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setIsConnModalOpen(false);
                  setTestResult(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleSaveAndTest}
                disabled={isTesting}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-55"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Probando...
                  </>
                ) : (
                  'Guardar y Probar Conexión'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
