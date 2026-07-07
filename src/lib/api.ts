import { auth } from './firebase';
import { Vehicle, Customer, Sale, Expense } from '../types';

async function getHeaders() {
  const token = await auth.currentUser?.getIdToken();
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
    }
  }
};
