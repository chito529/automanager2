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

function initializeLocalStorageSeed() {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.vehicles)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.vehicles, JSON.stringify([
      { id: '1', brand: 'Toyota', model: 'Hilux CD 4x4', year: 2018, vin: '17GFC529X8201', supplier: 'Garden Automotores S.A.', purchaseDate: '2026-05-10', purchasePrice: 140000000, status: 'Publicado', publicationPrice: 175000000, salePrice: 170000000 },
      { id: '2', brand: 'Hyundai', model: 'Tucson GL', year: 2017, vin: 'KMHJU81B6HH045', supplier: 'Automotor S.A.', purchaseDate: '2026-06-01', purchasePrice: 85000000, status: 'En preparación', publicationPrice: 110000000, salePrice: 0 },
      { id: '3', brand: 'Chevrolet', model: 'Onix LTZ', year: 2020, vin: '9BGKS48D0LG128', supplier: 'Particular', purchaseDate: '2026-04-15', purchasePrice: 55000000, status: 'Vendido', publicationPrice: 72000000, salePrice: 70000000 }
    ]));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.customers)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.customers, JSON.stringify([
      { id: '1', name: 'Carlos Mendoza', phone: '+595 981 123456', email: 'carlos.mendoza@gmail.com', source: 'Facebook Marketplace', firstContactDate: '2026-06-20', status: 'Negociando', interactions: [{ id: 'int_1', date: '2026-06-20', type: 'WhatsApp', vehicleOfInterest: 'Toyota Hilux 2018', note: 'Consultó sobre el precio de contado y si se acepta vehículo como parte de pago.', nextFollowUp: '2026-06-25' }] },
      { id: '2', name: 'María Esquivel', phone: '+595 971 789012', email: 'maria.esquivel@outlook.com', source: 'Recomendado', firstContactDate: '2026-06-15', status: 'Ganado', interactions: [{ id: 'int_2', date: '2026-06-15', type: 'Llamada', vehicleOfInterest: 'Chevrolet Onix 2020', note: 'Interesada en financiación propia. Se coordinó visita al showroom.', nextFollowUp: '' }] }
    ]));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.sales)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.sales, JSON.stringify([
      { id: '1', date: '2026-06-29', vehicleId: '3', customerId: '2', salePrice: 70000000, downPayment: 40000000, pendingBalance: 30000000, paymentMethod: 'Transferencia Bancaria', commission: 2000000, netProfit: 13000000 }
    ]));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.expenses)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.expenses, JSON.stringify([
      { id: '1', vehicleId: '2', type: 'Mantenimiento', description: 'Cambio de pastillas de freno y aceite de motor', amount: 1500000, supplier: 'Taller El Amigo', date: '2026-06-25' },
      { id: '2', vehicleId: '1', type: 'Estética', description: 'Lavado premium y pulido de carrocería', amount: 600000, supplier: 'CarWash VIP', date: '2026-06-28' }
    ]));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.transactions)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.transactions, JSON.stringify([
      { id: '1', date: '2026-06-01', type: 'Egreso', category: 'Alquiler de Showroom', amount: 3500000, paymentMethod: 'Transferencia Bancaria' },
      { id: '2', date: '2026-06-15', type: 'Egreso', category: 'Pago de Publicidad Digital', amount: 800000, paymentMethod: 'Tarjeta de Crédito' },
      { id: '3', date: '2026-06-29', type: 'Ingreso', category: 'Seña por Venta de Chevrolet Onix', amount: 40000000, paymentMethod: 'Transferencia Bancaria', vehicleId: '3' },
      { id: '4', date: '2026-06-30', type: 'Ingreso', category: 'Venta de Servicios Auxiliares', amount: 1200000, paymentMethod: 'Efectivo' }
    ]));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.accounts)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.accounts, JSON.stringify([
      { id: '1', type: 'Cobrar', entity: 'María Esquivel', amount: 30000000, dueDate: '2026-07-29', status: 'Pendiente' },
      { id: '2', type: 'Pagar', entity: 'Taller El Amigo', amount: 1500000, dueDate: '2026-07-15', status: 'Pendiente' },
      { id: '3', type: 'Pagar', entity: 'Escribanía Servín', amount: 2500000, dueDate: '2026-07-20', status: 'Pendiente' }
    ]));
  }
}

let isLocalFallback = false;
let fallbackChecked = false;

export async function ensureFallbackChecked(): Promise<boolean> {
  if (fallbackChecked) return isLocalFallback;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      isLocalFallback = data.status !== 'ok';
    } else {
      isLocalFallback = true;
    }
  } catch (err) {
    isLocalFallback = true;
  }
  fallbackChecked = true;
  if (isLocalFallback) {
    console.warn('[API] Backend is unavailable. Automatically switching to client-side localStorage fallback database.');
    initializeLocalStorageSeed();
  }
  return isLocalFallback;
}

// Helper to get auth headers
async function getHeaders() {
  const user = auth.currentUser;
  const token = user ? btoa(unescape(encodeURIComponent(JSON.stringify(user)))) : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const api = {
  isLocalMode: async (): Promise<boolean> => {
    return await ensureFallbackChecked();
  },

  vehicles: {
    list: async (): Promise<Vehicle[]> => {
      if (await ensureFallbackChecked()) {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.vehicles) || '[]');
      }
      const response = await fetch('/api/vehicles', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      return response.json();
    },
    create: async (data: Omit<Vehicle, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.vehicles) || '[]');
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        localStorage.setItem(LOCAL_STORAGE_KEYS.vehicles, JSON.stringify(list));
        return id;
      }
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create vehicle');
      const result = await response.json();
      return result.id;
    },
    update: async (id: string, data: Partial<Vehicle>): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.vehicles) || '[]');
        const index = list.findIndex((v: any) => v.id.toString() === id.toString());
        if (index !== -1) {
          list[index] = { ...list[index], ...data };
          localStorage.setItem(LOCAL_STORAGE_KEYS.vehicles, JSON.stringify(list));
        }
        return;
      }
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update vehicle');
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.vehicles) || '[]');
        const filtered = list.filter((v: any) => v.id.toString() !== id.toString());
        localStorage.setItem(LOCAL_STORAGE_KEYS.vehicles, JSON.stringify(filtered));
        return;
      }
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete vehicle');
    }
  },

  customers: {
    list: async (): Promise<Customer[]> => {
      if (await ensureFallbackChecked()) {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.customers) || '[]');
      }
      const response = await fetch('/api/customers', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    create: async (data: Omit<Customer, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.customers) || '[]');
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data, interactions: data.interactions || [] };
        list.push(newItem);
        localStorage.setItem(LOCAL_STORAGE_KEYS.customers, JSON.stringify(list));
        return id;
      }
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create customer');
      const result = await response.json();
      return result.id;
    },
    update: async (id: string, data: Partial<Customer>): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.customers) || '[]');
        const index = list.findIndex((c: any) => c.id.toString() === id.toString());
        if (index !== -1) {
          list[index] = { ...list[index], ...data };
          localStorage.setItem(LOCAL_STORAGE_KEYS.customers, JSON.stringify(list));
        }
        return;
      }
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update customer');
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.customers) || '[]');
        const filtered = list.filter((c: any) => c.id.toString() !== id.toString());
        localStorage.setItem(LOCAL_STORAGE_KEYS.customers, JSON.stringify(filtered));
        return;
      }
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete customer');
    }
  },

  sales: {
    list: async (): Promise<Sale[]> => {
      if (await ensureFallbackChecked()) {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.sales) || '[]');
      }
      const response = await fetch('/api/sales', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch sales');
      return response.json();
    },
    create: async (data: Omit<Sale, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.sales) || '[]');
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        localStorage.setItem(LOCAL_STORAGE_KEYS.sales, JSON.stringify(list));
        return id;
      }
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create sale');
      const result = await response.json();
      return result.id;
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.sales) || '[]');
        const filtered = list.filter((s: any) => s.id.toString() !== id.toString());
        localStorage.setItem(LOCAL_STORAGE_KEYS.sales, JSON.stringify(filtered));
        return;
      }
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete sale');
    }
  },

  expenses: {
    list: async (): Promise<Expense[]> => {
      if (await ensureFallbackChecked()) {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.expenses) || '[]');
      }
      const response = await fetch('/api/expenses', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },
    create: async (data: Omit<Expense, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.expenses) || '[]');
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        localStorage.setItem(LOCAL_STORAGE_KEYS.expenses, JSON.stringify(list));
        return id;
      }
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create expense');
      const result = await response.json();
      return result.id;
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.expenses) || '[]');
        const filtered = list.filter((e: any) => e.id.toString() !== id.toString());
        localStorage.setItem(LOCAL_STORAGE_KEYS.expenses, JSON.stringify(filtered));
        return;
      }
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete expense');
    }
  },

  transactions: {
    list: async (): Promise<Transaction[]> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.transactions) || '[]');
        return list.sort((a: any, b: any) => b.date.localeCompare(a.date));
      }
      const response = await fetch('/api/transactions', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    create: async (data: Omit<Transaction, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.transactions) || '[]');
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        localStorage.setItem(LOCAL_STORAGE_KEYS.transactions, JSON.stringify(list));
        return id;
      }
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create transaction');
      const result = await response.json();
      return result.id;
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.transactions) || '[]');
        const filtered = list.filter((t: any) => t.id.toString() !== id.toString());
        localStorage.setItem(LOCAL_STORAGE_KEYS.transactions, JSON.stringify(filtered));
        return;
      }
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete transaction');
    }
  },

  accounts: {
    list: async (): Promise<Account[]> => {
      if (await ensureFallbackChecked()) {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.accounts) || '[]');
      }
      const response = await fetch('/api/accounts', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
    create: async (data: Omit<Account, 'id'>): Promise<string> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.accounts) || '[]');
        const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const newItem = { id, ...data };
        list.push(newItem);
        localStorage.setItem(LOCAL_STORAGE_KEYS.accounts, JSON.stringify(list));
        return id;
      }
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create account');
      const result = await response.json();
      return result.id;
    },
    updateStatus: async (id: string, status: 'Pendiente' | 'Pagado'): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.accounts) || '[]');
        const index = list.findIndex((a: any) => a.id.toString() === id.toString());
        if (index !== -1) {
          list[index].status = status;
          localStorage.setItem(LOCAL_STORAGE_KEYS.accounts, JSON.stringify(list));
        }
        return;
      }
      const response = await fetch(`/api/accounts/${id}/status`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update account status');
    },
    delete: async (id: string): Promise<void> => {
      if (await ensureFallbackChecked()) {
        const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.accounts) || '[]');
        const filtered = list.filter((a: any) => a.id.toString() !== id.toString());
        localStorage.setItem(LOCAL_STORAGE_KEYS.accounts, JSON.stringify(filtered));
        return;
      }
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete account');
    }
  }
};
