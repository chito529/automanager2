import { auth } from './auth';
import { Vehicle, Customer, Sale, Expense, Transaction, Account } from '../types';

const LOCAL_STORAGE_KEYS = {
  vehicles: 'auto_manager_vehicles',
  customers: 'auto_manager_customers',
  sales: 'auto_manager_sales',
  expenses: 'auto_manager_expenses',
  transactions: 'auto_manager_transactions',
  accounts: 'auto_manager_accounts'
};

// Safe storage wrapper to prevent crashes in restricted iframe / sandbox environments
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn(`[Storage] Failed to read from localStorage for key "${key}", falling back to memory.`, err);
      return memoryStorage[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[Storage] Failed to write to localStorage for key "${key}", falling back to memory.`, err);
      memoryStorage[key] = value;
    }
  }
};

function safeGetLocalStorageList<T>(key: string, seedData: T[] = []): T[] {
  try {
    const data = safeStorage.getItem(key);
    if (!data) {
      safeStorage.setItem(key, JSON.stringify(seedData));
      return seedData;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    safeStorage.setItem(key, JSON.stringify(seedData));
    return seedData;
  } catch (err) {
    console.error(`[Storage] safeGetLocalStorageList failed for key ${key}, reverting to seed:`, err);
    safeStorage.setItem(key, JSON.stringify(seedData));
    return seedData;
  }
}

function initializeLocalStorageSeed() {
  if (!safeStorage.getItem(LOCAL_STORAGE_KEYS.vehicles)) {
    safeStorage.setItem(LOCAL_STORAGE_KEYS.vehicles, JSON.stringify([
      { id: '1', brand: 'Toyota', model: 'Hilux CD 4x4', year: 2018, vin: '17GFC529X8201', supplier: 'Garden Automotores S.A.', purchaseDate: '2026-05-10', purchasePrice: 140000000, status: 'Publicado', publicationPrice: 175000000, salePrice: 170000000 },
      { id: '2', brand: 'Hyundai', model: 'Tucson GL', year: 2017, vin: 'KMHJU81B6HH045', supplier: 'Automotor S.A.', purchaseDate: '2026-06-01', purchasePrice: 85000000, status: 'En preparación', publicationPrice: 110000000, salePrice: 0 },
      { id: '3', brand: 'Chevrolet', model: 'Onix LTZ', year: 2020, vin: '9BGKS48D0LG128', supplier: 'Particular', purchaseDate: '2026-04-15', purchasePrice: 55000000, status: 'Vendido', publicationPrice: 72000000, salePrice: 70000000 }
    ]));
  }
  if (!safeStorage.getItem(LOCAL_STORAGE_KEYS.customers)) {
    safeStorage.setItem(LOCAL_STORAGE_KEYS.customers, JSON.stringify([
      { id: '1', name: 'Carlos Mendoza', phone: '+595 981 123456', email: 'carlos.mendoza@gmail.com', source: 'Facebook Marketplace', firstContactDate: '2026-06-20', status: 'Negociando', interactions: [{ id: 'int_1', date: '2026-06-20', type: 'WhatsApp', vehicleOfInterest: 'Toyota Hilux 2018', note: 'Consultó sobre el precio de contado y si se acepta vehículo como parte de pago.', nextFollowUp: '2026-06-25' }] },
      { id: '2', name: 'María Esquivel', phone: '+595 971 789012', email: 'maria.esquivel@outlook.com', source: 'Recomendado', firstContactDate: '2026-06-15', status: 'Ganado', interactions: [{ id: 'int_2', date: '2026-06-15', type: 'Llamada', vehicleOfInterest: 'Chevrolet Onix 2020', note: 'Interesada en financiación propia. Se coordinó visita al showroom.', nextFollowUp: '' }] }
    ]));
  }
  if (!safeStorage.getItem(LOCAL_STORAGE_KEYS.sales)) {
    safeStorage.setItem(LOCAL_STORAGE_KEYS.sales, JSON.stringify([
      { id: '1', date: '2026-06-29', vehicleId: '3', customerId: '2', salePrice: 70000000, downPayment: 40000000, pendingBalance: 30000000, paymentMethod: 'Transferencia Bancaria', commission: 2000000, netProfit: 13000000 }
    ]));
  }
  if (!safeStorage.getItem(LOCAL_STORAGE_KEYS.expenses)) {
    safeStorage.setItem(LOCAL_STORAGE_KEYS.expenses, JSON.stringify([
      { id: '1', vehicleId: '2', type: 'Mantenimiento', description: 'Cambio de pastillas de freno y aceite de motor', amount: 1500000, supplier: 'Taller El Amigo', date: '2026-06-25' },
      { id: '2', vehicleId: '1', type: 'Estética', description: 'Lavado premium y pulido de carrocería', amount: 600000, supplier: 'CarWash VIP', date: '2026-06-28' }
    ]));
  }
  if (!safeStorage.getItem(LOCAL_STORAGE_KEYS.transactions)) {
    safeStorage.setItem(LOCAL_STORAGE_KEYS.transactions, JSON.stringify([
      { id: '1', date: '2026-06-01', type: 'Egreso', category: 'Alquiler de Showroom', amount: 3500000, paymentMethod: 'Transferencia Bancaria' },
      { id: '2', date: '2026-06-15', type: 'Egreso', category: 'Pago de Publicidad Digital', amount: 800000, paymentMethod: 'Tarjeta de Crédito' },
      { id: '3', date: '2026-06-29', type: 'Ingreso', category: 'Seña por Venta de Chevrolet Onix', amount: 40000000, paymentMethod: 'Transferencia Bancaria', vehicleId: '3' },
      { id: '4', date: '2026-06-30', type: 'Ingreso', category: 'Venta de Servicios Auxiliares', amount: 1200000, paymentMethod: 'Efectivo' }
    ]));
  }
  if (!safeStorage.getItem(LOCAL_STORAGE_KEYS.accounts)) {
    safeStorage.setItem(LOCAL_STORAGE_KEYS.accounts, JSON.stringify([
      { id: '1', type: 'Cobrar', entity: 'María Esquivel', amount: 30000000, dueDate: '2026-07-29', status: 'Pendiente' },
      { id: '2', type: 'Pagar', entity: 'Taller El Amigo', amount: 1500000, dueDate: '2026-07-15', status: 'Pendiente' },
      { id: '3', type: 'Pagar', entity: 'Escribanía Servín', amount: 2500000, dueDate: '2026-07-20', status: 'Pendiente' }
    ]));
  }
}

let lastResolvedPath = '';

export function getApiUrl(path: string): string {
  lastResolvedPath = path;
  const customUrl = safeStorage.getItem('auto_manager_backend_url') || 'https://automanager-backend.juanalmiron529.workers.dev';
  const baseUrl = customUrl.trim().replace(/\/$/, '');
  
  // Option: Use CORS Proxy
  const useCorsProxy = safeStorage.getItem('auto_manager_use_cors_proxy') === 'true';
  if (useCorsProxy && baseUrl) {
    return '/api/proxy';
  }

  // Option: Remove '/api' prefix
  let resolvedPath = path;
  if (safeStorage.getItem('auto_manager_remove_api_prefix') === 'true') {
    resolvedPath = path.replace(/^\/api/, '');
  }

  return baseUrl ? `${baseUrl}${resolvedPath}` : resolvedPath;
}

let isLocalFallback = false;
let checkPromise: Promise<boolean> | null = null;

// Helper to handle and format detailed API response errors
async function handleResponseError(response: Response, defaultMessage: string): Promise<never> {
  let detail = '';
  try {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      detail = parsed.error || parsed.message || text;
    } catch {
      detail = text;
    }
  } catch {}
  
  const statusStr = response.status ? `(Status: ${response.status})` : '';
  const errorMsg = detail ? `${defaultMessage}: ${detail} ${statusStr}` : `${defaultMessage} ${statusStr}`;
  throw new Error(errorMsg);
}

// Lower-level raw fetch client that handles proxy, auth headers, preflights, custom base URLs, etc.
export async function executeWorkerCall(path: string, options: RequestInit = {}): Promise<Response> {
  const customUrl = safeStorage.getItem('auto_manager_backend_url') || 'https://automanager-backend.juanalmiron529.workers.dev';
  const baseUrl = customUrl.trim().replace(/\/$/, '');
  
  const useCorsProxy = safeStorage.getItem('auto_manager_use_cors_proxy') === 'true';
  const stripApiPrefix = safeStorage.getItem('auto_manager_remove_api_prefix') === 'true';
  const sendCredentials = safeStorage.getItem('auto_manager_send_auth') !== 'false';
  
  // Apply stripApiPrefix if toggled
  let resolvedPath = path;
  if (stripApiPrefix) {
    resolvedPath = path.replace(/^\/api/, '');
  }
  
  let requestUrl = '';
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  
  // Default to application/json if sending body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Inject authentication header if authorized and active
  if (sendCredentials) {
    const user = auth.currentUser;
    if (user) {
      try {
        const jsonStr = JSON.stringify(user);
        const utf8Bytes = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        });
        headers['Authorization'] = `Bearer ${btoa(utf8Bytes)}`;
      } catch (err) {
        headers['Authorization'] = `Bearer ${btoa(unescape(encodeURIComponent(JSON.stringify(user))))}`;
      }
    }
  } else {
    delete headers['Authorization'];
  }

  // Construct requestUrl and proxy headers
  if (useCorsProxy) {
    requestUrl = `/api/proxy`;
    headers['x-target-url'] = baseUrl ? `${baseUrl}${resolvedPath}` : resolvedPath;
  } else {
    requestUrl = baseUrl ? `${baseUrl}${resolvedPath}` : resolvedPath;
  }

  const finalOptions: RequestInit = {
    ...options,
    headers,
  };

  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1') || window.location.hostname.includes('.run.app');
  if (isDev) {
    console.log(`[Worker Client Call] ${options.method || 'GET'} -> ${requestUrl} (Original: ${path})`, {
      useCorsProxy,
      headers
    });
  }

  try {
    const response = await fetch(requestUrl, finalOptions);
    if (isDev) {
      console.log(`[Worker Client Response] ${options.method || 'GET'} -> ${requestUrl} | Status: ${response.status}`);
    }

    if (!response.ok) {
      let errorType = 'Error del Servidor';
      if (response.status === 404) {
        errorType = 'Ruta Inexistente (404)';
      } else if (response.status === 400) {
        errorType = 'Payload o Parámetro Inválido (400)';
      } else if (response.status === 401 || response.status === 403) {
        errorType = 'Error de Autorización (401/403)';
      } else if (response.status >= 500) {
        errorType = 'Error Interno del Servidor (500)';
      }
      
      const bodyText = await response.text();
      throw new Error(`${errorType}: El backend respondió con código ${response.status}. Detalle: ${bodyText}`);
    }

    return response;
  } catch (error: any) {
    console.warn(`[Worker Client Network Error] Failed on ${options.method || 'GET'} ${requestUrl}:`, error);
    
    const msg = error?.message || String(error);
    if (msg.includes('(404)') || msg.includes('(400)') || msg.includes('(401/403)') || msg.includes('(500)')) {
      throw error;
    }

    // Auto-fallback retry using our secure local Express CORS Proxy if not already using it
    if (!useCorsProxy && baseUrl) {
      console.warn('[Worker Client Fallback] Retrying request via local CORS proxy endpoint...');
      try {
        const proxyHeaders = { ...headers };
        proxyHeaders['x-target-url'] = `${baseUrl}${resolvedPath}`;
        const fallbackResponse = await fetch('/api/proxy', {
          ...options,
          headers: proxyHeaders
        });
        
        if (!fallbackResponse.ok) {
          let errorType = 'Error del Servidor (vía Proxy)';
          if (fallbackResponse.status === 404) {
            errorType = 'Ruta Inexistente (404)';
          } else if (fallbackResponse.status === 400) {
            errorType = 'Payload o Parámetro Inválido (400)';
          } else if (fallbackResponse.status >= 500) {
            errorType = 'Error Interno del Servidor (500)';
          }
          const bodyText = await fallbackResponse.text();
          throw new Error(`${errorType}: El proxy de emergencia devolvió código ${fallbackResponse.status}. Detalle: ${bodyText}`);
        }
        
        console.log('[Worker Client Fallback Success] Request completed via local CORS proxy.');
        return fallbackResponse;
      } catch (fallbackError: any) {
        console.error('[Worker Client Fallback Failed] Local CORS proxy fallback failed:', fallbackError);
      }
    }

    // Categorize error nicely for user display
    let errorType = 'Error de Red / Conexión';
    if (msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('CORS') || msg.includes('preflight') || msg.includes('origin')) {
      errorType = 'Bloqueo CORS / Error de Red Preflight (Verifica el origen en tu Worker)';
    }

    throw new Error(`${errorType}: No se pudo establecer comunicación con el backend en "${baseUrl}". Detalles del fallo: ${msg}`);
  }
}

// Helpers to load and save entities to Cloudflare Worker's KV/D1 schema (/api/load and /api/save)
async function getEntityList(entity: string): Promise<any[]> {
  try {
    const loadPath = `/api/load?key=${entity}`;
    const response = await executeWorkerCall(loadPath, { method: 'GET' });
    const result = await response.json();
    if (result.success && result.data && result.data.item_value !== undefined && result.data.item_value !== null) {
      let currentVal = result.data.item_value;
      
      // Keep parsing while it is a string that looks like serialized JSON to fully unpack nesting
      for (let i = 0; i < 5; i++) {
        if (typeof currentVal === 'string') {
          const trimmed = currentVal.trim();
          if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
              (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
              (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
            try {
              currentVal = JSON.parse(currentVal);
            } catch (err) {
              console.warn(`[API] Failed to parse string during unpacking iteration ${i}:`, err);
              break;
            }
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (Array.isArray(currentVal)) {
        // Filter out any non-object/null values from the retrieved array
        return currentVal.filter((item: any) => item && typeof item === 'object');
      } else if (currentVal && typeof currentVal === 'object') {
        return [currentVal];
      }
    }
    return [];
  } catch (err: any) {
    console.error(`Error loading entity list for ${entity}:`, err);
    return [];
  }
}

async function createEntityItem(entity: string, itemData: any): Promise<any> {
  const rawList = await getEntityList(entity);
  // Ensure we work with a clean list of objects with valid IDs
  const list = rawList.filter((item: any) => item && typeof item === 'object');
  
  const id = itemData.id || (Date.now() + Math.floor(Math.random() * 1000)).toString();
  const newItem = { ...itemData, id };
  list.push(newItem);

  const savePath = `/api/save`;
  const response = await executeWorkerCall(savePath, {
    method: 'POST',
    body: JSON.stringify({
      key: entity,
      value: JSON.stringify(list)
    })
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Worker returned success=false');
  }
  return { success: true, id };
}

async function updateEntityItem(entity: string, id: string, updates: any, isStatusOnly = false): Promise<any> {
  const rawList = await getEntityList(entity);
  const list = rawList.filter((item: any) => item && typeof item === 'object');
  
  const index = list.findIndex((item: any) => item && item.id && item.id.toString() === id.toString());
  if (index === -1) {
    throw new Error(`Item con ID ${id} no encontrado en ${entity}`);
  }
  if (isStatusOnly) {
    list[index].status = updates.status;
  } else {
    list[index] = { ...list[index], ...updates };
  }

  const savePath = `/api/save`;
  const response = await executeWorkerCall(savePath, {
    method: 'POST',
    body: JSON.stringify({
      key: entity,
      value: JSON.stringify(list)
    })
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Worker returned success=false');
  }
  return { success: true };
}

async function deleteEntityItem(entity: string, id: string): Promise<any> {
  const rawList = await getEntityList(entity);
  const list = rawList.filter((item: any) => item && typeof item === 'object');
  const updatedList = list.filter((item: any) => item && item.id && item.id.toString() !== id.toString());

  const savePath = `/api/save`;
  const response = await executeWorkerCall(savePath, {
    method: 'POST',
    body: JSON.stringify({
      key: entity,
      value: JSON.stringify(updatedList)
    })
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Worker returned success=false');
  }
  return { success: true };
}

// Unified, resilient fetch client for the external or local backend
export async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  // Check if we want to intercept REST paths to adapt to the Worker's KV/D1 schema
  const match = path.match(/^\/api\/(vehicles|customers|sales|expenses|transactions|accounts)(?:\/([^\/]+))?(?:\/status)?$/);
  
  if (match) {
    const entity = match[1];
    const id = match[2];
    const isStatusUpdate = path.endsWith('/status');
    const method = (options.method || 'GET').toUpperCase();

    try {
      if (method === 'GET') {
        const list = await getEntityList(entity);
        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'POST') {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const result = await createEntityItem(entity, body);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'PATCH' || method === 'PUT') {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const result = await updateEntityItem(entity, id, body, isStatusUpdate);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'DELETE') {
        const result = await deleteEntityItem(entity, id);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (err: any) {
      console.error(`[REST Adapter Error] Failed to process ${method} ${path}:`, err);
      let status = 500;
      let msg = err?.message || String(err);
      if (msg.includes('404')) status = 404;
      else if (msg.includes('400')) status = 400;
      else if (msg.includes('401') || msg.includes('403')) status = 403;
      
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Fallback to standard raw worker call if not a matching REST path (e.g. /api/health or others)
  return executeWorkerCall(path, options);
}

// Ensure the connection mode and health status are checked
export function ensureFallbackChecked(forceRefresh = false): Promise<boolean> {
  if (forceRefresh) {
    checkPromise = null;
  }
  if (checkPromise) return checkPromise;

  checkPromise = (async () => {
    const forced = safeStorage.getItem('auto_manager_force_cloud') !== 'false';
    if (forced) {
      console.log('[API] Cloud Mode forced. Bypassing offline check.');
      isLocalFallback = false;
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await apiRequest('/api/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        try {
          const data = await res.json();
          const isHealthy = data?.status === 'ok' || data?.ok === true || data?.status === 'success';
          isLocalFallback = !isHealthy;
        } catch {
          // If JSON failed but got 200 OK, assume it works
          isLocalFallback = false;
        }
      } else {
        isLocalFallback = true;
      }
    } catch (err) {
      console.warn('[API] Health probe failed. Activating local client-side fallback database.', err);
      isLocalFallback = true;
    }

    if (isLocalFallback) {
      initializeLocalStorageSeed();
    }
    return isLocalFallback;
  })();

  return checkPromise;
}

// Backward compatible helper to get headers (not used internally anymore)
async function getHeaders() {
  const user = auth.currentUser;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) {
    headers['Authorization'] = `Bearer ${btoa(JSON.stringify(user))}`;
  }
  return headers;
}

export const api = {
  isLocalMode: async (): Promise<boolean> => {
    return await ensureFallbackChecked();
  },

  vehicles: {
    list: async (): Promise<Vehicle[]> => {
      if (await ensureFallbackChecked()) {
        return safeGetLocalStorageList<Vehicle>(LOCAL_STORAGE_KEYS.vehicles);
      }
      const response = await apiRequest('/api/vehicles');
      if (!response.ok) await handleResponseError(response, 'Failed to fetch vehicles');
      return response.json();
    },
    create: async (data: Omit<Vehicle, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Vehicle>(LOCAL_STORAGE_KEYS.vehicles);
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        safeStorage.setItem(LOCAL_STORAGE_KEYS.vehicles, JSON.stringify(list));
        return id;
      }
      const response = await apiRequest('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) await handleResponseError(response, 'Failed to create vehicle');
      const result = await response.json();
      // Handle flexible API formats (id, data.id, insertedId, or raw value)
      return result.id || result.data?.id || result.insertedId || String(result);
    },
    update: async (id: string, data: Partial<Vehicle>): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Vehicle>(LOCAL_STORAGE_KEYS.vehicles);
        const index = list.findIndex((v: any) => v.id.toString() === id.toString());
        if (index !== -1) {
          list[index] = { ...list[index], ...data };
          safeStorage.setItem(LOCAL_STORAGE_KEYS.vehicles, JSON.stringify(list));
        }
        return;
      }
      const response = await apiRequest(`/api/vehicles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!response.ok) await handleResponseError(response, 'Failed to update vehicle');
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Vehicle>(LOCAL_STORAGE_KEYS.vehicles);
        const filtered = list.filter((v: any) => v.id.toString() !== id.toString());
        safeStorage.setItem(LOCAL_STORAGE_KEYS.vehicles, JSON.stringify(filtered));
        return;
      }
      const response = await apiRequest(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) await handleResponseError(response, 'Failed to delete vehicle');
    }
  },

  customers: {
    list: async (): Promise<Customer[]> => {
      if (await ensureFallbackChecked()) {
        return safeGetLocalStorageList<Customer>(LOCAL_STORAGE_KEYS.customers);
      }
      const response = await apiRequest('/api/customers');
      if (!response.ok) await handleResponseError(response, 'Failed to fetch customers');
      return response.json();
    },
    create: async (data: Omit<Customer, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Customer>(LOCAL_STORAGE_KEYS.customers);
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data, interactions: data.interactions || [] };
        list.push(newItem);
        safeStorage.setItem(LOCAL_STORAGE_KEYS.customers, JSON.stringify(list));
        return id;
      }
      const response = await apiRequest('/api/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) await handleResponseError(response, 'Failed to create customer');
      const result = await response.json();
      return result.id || result.data?.id || result.insertedId || String(result);
    },
    update: async (id: string, data: Partial<Customer>): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Customer>(LOCAL_STORAGE_KEYS.customers);
        const index = list.findIndex((c: any) => c.id.toString() === id.toString());
        if (index !== -1) {
          list[index] = { ...list[index], ...data };
          safeStorage.setItem(LOCAL_STORAGE_KEYS.customers, JSON.stringify(list));
        }
        return;
      }
      const response = await apiRequest(`/api/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!response.ok) await handleResponseError(response, 'Failed to update customer');
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Customer>(LOCAL_STORAGE_KEYS.customers);
        const filtered = list.filter((c: any) => c.id.toString() !== id.toString());
        safeStorage.setItem(LOCAL_STORAGE_KEYS.customers, JSON.stringify(filtered));
        return;
      }
      const response = await apiRequest(`/api/customers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) await handleResponseError(response, 'Failed to delete customer');
    }
  },

  sales: {
    list: async (): Promise<Sale[]> => {
      if (await ensureFallbackChecked()) {
        return safeGetLocalStorageList<Sale>(LOCAL_STORAGE_KEYS.sales);
      }
      const response = await apiRequest('/api/sales');
      if (!response.ok) await handleResponseError(response, 'Failed to fetch sales');
      return response.json();
    },
    create: async (data: Omit<Sale, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Sale>(LOCAL_STORAGE_KEYS.sales);
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        safeStorage.setItem(LOCAL_STORAGE_KEYS.sales, JSON.stringify(list));
        return id;
      }
      const response = await apiRequest('/api/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) await handleResponseError(response, 'Failed to create sale');
      const result = await response.json();
      return result.id || result.data?.id || result.insertedId || String(result);
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Sale>(LOCAL_STORAGE_KEYS.sales);
        const filtered = list.filter((s: any) => s.id.toString() !== id.toString());
        safeStorage.setItem(LOCAL_STORAGE_KEYS.sales, JSON.stringify(filtered));
        return;
      }
      const response = await apiRequest(`/api/sales/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) await handleResponseError(response, 'Failed to delete sale');
    }
  },

  expenses: {
    list: async (): Promise<Expense[]> => {
      if (await ensureFallbackChecked()) {
        return safeGetLocalStorageList<Expense>(LOCAL_STORAGE_KEYS.expenses);
      }
      const response = await apiRequest('/api/expenses');
      if (!response.ok) await handleResponseError(response, 'Failed to fetch expenses');
      return response.json();
    },
    create: async (data: Omit<Expense, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Expense>(LOCAL_STORAGE_KEYS.expenses);
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        safeStorage.setItem(LOCAL_STORAGE_KEYS.expenses, JSON.stringify(list));
        return id;
      }
      const response = await apiRequest('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) await handleResponseError(response, 'Failed to create expense');
      const result = await response.json();
      return result.id || result.data?.id || result.insertedId || String(result);
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Expense>(LOCAL_STORAGE_KEYS.expenses);
        const filtered = list.filter((e: any) => e.id.toString() !== id.toString());
        safeStorage.setItem(LOCAL_STORAGE_KEYS.expenses, JSON.stringify(filtered));
        return;
      }
      const response = await apiRequest(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) await handleResponseError(response, 'Failed to delete expense');
    }
  },

  transactions: {
    list: async (): Promise<Transaction[]> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Transaction>(LOCAL_STORAGE_KEYS.transactions);
        return list.sort((a: any, b: any) => b.date.localeCompare(a.date));
      }
      const response = await apiRequest('/api/transactions');
      if (!response.ok) await handleResponseError(response, 'Failed to fetch transactions');
      return response.json();
    },
    create: async (data: Omit<Transaction, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Transaction>(LOCAL_STORAGE_KEYS.transactions);
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        safeStorage.setItem(LOCAL_STORAGE_KEYS.transactions, JSON.stringify(list));
        return id;
      }
      const response = await apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) await handleResponseError(response, 'Failed to create transaction');
      const result = await response.json();
      return result.id || result.data?.id || result.insertedId || String(result);
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Transaction>(LOCAL_STORAGE_KEYS.transactions);
        const filtered = list.filter((t: any) => t.id.toString() !== id.toString());
        safeStorage.setItem(LOCAL_STORAGE_KEYS.transactions, JSON.stringify(filtered));
        return;
      }
      const response = await apiRequest(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) await handleResponseError(response, 'Failed to delete transaction');
    }
  },

  accounts: {
    list: async (): Promise<Account[]> => {
      if (await ensureFallbackChecked()) {
        return safeGetLocalStorageList<Account>(LOCAL_STORAGE_KEYS.accounts);
      }
      const response = await apiRequest('/api/accounts');
      if (!response.ok) await handleResponseError(response, 'Failed to fetch accounts');
      return response.json();
    },
    create: async (data: Omit<Account, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Account>(LOCAL_STORAGE_KEYS.accounts);
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        safeStorage.setItem(LOCAL_STORAGE_KEYS.accounts, JSON.stringify(list));
        return id;
      }
      const response = await apiRequest('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) await handleResponseError(response, 'Failed to create account');
      const result = await response.json();
      return result.id || result.data?.id || result.insertedId || String(result);
    },
    updateStatus: async (id: string, status: 'Pendiente' | 'Pagado'): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Account>(LOCAL_STORAGE_KEYS.accounts);
        const index = list.findIndex((a: any) => a.id.toString() === id.toString());
        if (index !== -1) {
          list[index].status = status;
          safeStorage.setItem(LOCAL_STORAGE_KEYS.accounts, JSON.stringify(list));
        }
        return;
      }
      const response = await apiRequest(`/api/accounts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) await handleResponseError(response, 'Failed to update account status');
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = safeGetLocalStorageList<Account>(LOCAL_STORAGE_KEYS.accounts);
        const filtered = list.filter((a: any) => a.id.toString() !== id.toString());
        safeStorage.setItem(LOCAL_STORAGE_KEYS.accounts, JSON.stringify(filtered));
        return;
      }
      const response = await apiRequest(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) await handleResponseError(response, 'Failed to delete account');
    }
  }
};
