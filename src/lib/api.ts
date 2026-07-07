import { Vehicle, Customer, Sale, Expense } from '../types';

// Helper to delay response for realism and compatibility with React loading states
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Key constants for local storage
const KEYS = {
  VEHICLES: 'automanager_vehicles',
  CUSTOMERS: 'automanager_customers',
  SALES: 'automanager_sales',
  EXPENSES: 'automanager_expenses',
};

// Seed Data
const initialVehicles: Vehicle[] = [
  {
    id: 'v1',
    brand: 'Toyota',
    model: 'Hilux CD 4x4',
    year: 2018,
    vin: '17GFC529X8201',
    supplier: 'Garden Automotores S.A.',
    purchaseDate: '2026-05-10',
    purchasePrice: 140000000,
    status: 'Publicado',
    publicationPrice: 175000000,
    salePrice: 170000000,
  },
  {
    id: 'v2',
    brand: 'Hyundai',
    model: 'Tucson GL',
    year: 2017,
    vin: 'KMHJU81B6HH045',
    supplier: 'Automotor S.A.',
    purchaseDate: '2026-06-01',
    purchasePrice: 85000000,
    status: 'En preparación',
    publicationPrice: 110000000,
    salePrice: 0,
  },
  {
    id: 'v3',
    brand: 'Chevrolet',
    model: 'Onix LTZ',
    year: 2020,
    vin: '9BGKS48D0LG128',
    supplier: 'Particular',
    purchaseDate: '2026-04-15',
    purchasePrice: 55000000,
    status: 'Vendido',
    publicationPrice: 72000000,
    salePrice: 70000000,
  }
];

const initialCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Carlos Mendoza',
    phone: '+595 981 123456',
    email: 'carlos.mendoza@gmail.com',
    source: 'Facebook Marketplace',
    firstContactDate: '2026-06-20',
    status: 'Negociando',
    interactions: [
      {
        id: 'int1',
        date: '2026-06-20',
        type: 'WhatsApp',
        vehicleOfInterest: 'Toyota Hilux 2018',
        note: 'Consultó sobre el precio de contado y si se acepta vehículo como parte de pago.',
        nextFollowUp: '2026-06-25'
      }
    ]
  },
  {
    id: 'c2',
    name: 'María Esquivel',
    phone: '+595 971 789012',
    email: 'maria.esquivel@outlook.com',
    source: 'Recomendado',
    firstContactDate: '2026-06-15',
    status: 'Ganado',
    interactions: [
      {
        id: 'int2',
        date: '2026-06-15',
        type: 'Llamada',
        vehicleOfInterest: 'Chevrolet Onix 2020',
        note: 'Interesada en financiación propia. Se coordinó visita al showroom.',
        nextFollowUp: ''
      }
    ]
  }
];

const initialSales: Sale[] = [
  {
    id: 's1',
    date: '2026-06-29',
    vehicleId: 'v3',
    customerId: 'c2',
    salePrice: 70000000,
    downPayment: 40000000,
    pendingBalance: 30000000,
    paymentMethod: 'Transferencia Bancaria',
    commission: 2000000,
    netProfit: 13000000,
  }
];

const initialExpenses: Expense[] = [
  {
    id: 'e1',
    vehicleId: 'v2',
    type: 'Mantenimiento',
    description: 'Cambio de pastillas de freno y aceite de motor',
    amount: 1500000,
    supplier: 'Taller El Amigo',
    date: '2026-06-25',
  },
  {
    id: 'e2',
    vehicleId: 'v1',
    type: 'Estética',
    description: 'Lavado premium y pulido de carrocería',
    amount: 600000,
    supplier: 'CarWash VIP',
    date: '2026-06-28',
  }
];

// Helper functions for local storage operations
const getStored = <T>(key: string, defaultData: T[]): T[] => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

const setStored = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  vehicles: {
    list: async () => {
      await delay();
      return getStored<Vehicle>(KEYS.VEHICLES, initialVehicles);
    },
    create: async (data: Omit<Vehicle, 'id'>) => {
      await delay();
      const list = getStored<Vehicle>(KEYS.VEHICLES, initialVehicles);
      const newId = 'v_' + Math.random().toString(36).substr(2, 9);
      const newVehicle: Vehicle = { id: newId, ...data };
      list.push(newVehicle);
      setStored(KEYS.VEHICLES, list);
      return newId;
    },
    update: async (id: string, data: Partial<Vehicle>) => {
      await delay();
      const list = getStored<Vehicle>(KEYS.VEHICLES, initialVehicles);
      const index = list.findIndex(v => v.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...data };
        setStored(KEYS.VEHICLES, list);
      }
    },
    delete: async (id: string) => {
      await delay();
      const list = getStored<Vehicle>(KEYS.VEHICLES, initialVehicles);
      const filtered = list.filter(v => v.id !== id);
      setStored(KEYS.VEHICLES, filtered);
    }
  },
  customers: {
    list: async () => {
      await delay();
      return getStored<Customer>(KEYS.CUSTOMERS, initialCustomers);
    },
    create: async (data: Omit<Customer, 'id'>) => {
      await delay();
      const list = getStored<Customer>(KEYS.CUSTOMERS, initialCustomers);
      const newId = 'c_' + Math.random().toString(36).substr(2, 9);
      const newCustomer: Customer = { id: newId, ...data };
      list.push(newCustomer);
      setStored(KEYS.CUSTOMERS, list);
      return newId;
    },
    update: async (id: string, data: Partial<Customer>) => {
      await delay();
      const list = getStored<Customer>(KEYS.CUSTOMERS, initialCustomers);
      const index = list.findIndex(c => c.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...data };
        setStored(KEYS.CUSTOMERS, list);
      }
    }
  },
  sales: {
    list: async () => {
      await delay();
      return getStored<Sale>(KEYS.SALES, initialSales);
    },
    create: async (data: Omit<Sale, 'id'>) => {
      await delay();
      const list = getStored<Sale>(KEYS.SALES, initialSales);
      const newId = 's_' + Math.random().toString(36).substr(2, 9);
      const newSale: Sale = { id: newId, ...data };
      list.push(newSale);
      setStored(KEYS.SALES, list);
      return newId;
    }
  },
  expenses: {
    list: async () => {
      await delay();
      return getStored<Expense>(KEYS.EXPENSES, initialExpenses);
    },
    create: async (data: Omit<Expense, 'id'>) => {
      await delay();
      const list = getStored<Expense>(KEYS.EXPENSES, initialExpenses);
      const newId = 'e_' + Math.random().toString(36).substr(2, 9);
      const newExpense: Expense = { id: newId, ...data };
      list.push(newExpense);
      setStored(KEYS.EXPENSES, list);
      return newId;
    }
  }
};
