import { auth } from './auth';
import { Vehicle, Customer, Sale, Expense, Transaction, Account } from '../types';

async function getHeaders() {
  const user = auth.currentUser;
  const token = user ? btoa(unescape(encodeURIComponent(JSON.stringify(user)))) : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const api = {
  vehicles: {
    list: async (): Promise<Vehicle[]> => {
      const response = await fetch('/api/vehicles', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      return response.json();
    },
    create: async (data: Omit<Vehicle, 'id'>): Promise<string> => {
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
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update vehicle');
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete vehicle');
    }
  },
  customers: {
    list: async (): Promise<Customer[]> => {
      const response = await fetch('/api/customers', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    create: async (data: Omit<Customer, 'id'>): Promise<string> => {
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
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update customer');
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete customer');
    }
  },
  sales: {
    list: async (): Promise<Sale[]> => {
      const response = await fetch('/api/sales', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch sales');
      return response.json();
    },
    create: async (data: Omit<Sale, 'id'>): Promise<string> => {
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
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete sale');
    }
  },
  expenses: {
    list: async (): Promise<Expense[]> => {
      const response = await fetch('/api/expenses', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },
    create: async (data: Omit<Expense, 'id'>): Promise<string> => {
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
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete expense');
    }
  },
  transactions: {
    list: async (): Promise<Transaction[]> => {
      const response = await fetch('/api/transactions', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    create: async (data: Omit<Transaction, 'id'>): Promise<string> => {
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
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete transaction');
    }
  },
  accounts: {
    list: async (): Promise<Account[]> => {
      const response = await fetch('/api/accounts', {
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
    create: async (data: Omit<Account, 'id'>): Promise<string> => {
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
      const response = await fetch(`/api/accounts/${id}/status`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update account status');
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete account');
    }
  }
};
