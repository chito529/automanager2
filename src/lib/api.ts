import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from './firebase';
import { Vehicle, Customer, Sale, Expense } from '../types';

// Seed Data
const initialVehicles: Omit<Vehicle, 'id'>[] = [
  {
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

const initialCustomers: Omit<Customer, 'id'>[] = [
  {
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

const initialSales: Omit<Sale, 'id'>[] = [
  {
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

const initialExpenses: Omit<Expense, 'id'>[] = [
  {
    vehicleId: 'v2',
    type: 'Mantenimiento',
    description: 'Cambio de pastillas de freno y aceite de motor',
    amount: 1500000,
    supplier: 'Taller El Amigo',
    date: '2026-06-25',
  },
  {
    vehicleId: 'v1',
    type: 'Estética',
    description: 'Lavado premium y pulido de carrocería',
    amount: 600000,
    supplier: 'CarWash VIP',
    date: '2026-06-28',
  }
];

export const api = {
  vehicles: {
    list: async (): Promise<Vehicle[]> => {
      const colRef = collection(db, 'vehicles');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        const list: Vehicle[] = [];
        for (const item of initialVehicles) {
          const docRef = await addDoc(colRef, item);
          list.push({ id: docRef.id, ...item });
        }
        return list;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
    },
    create: async (data: Omit<Vehicle, 'id'>) => {
      const colRef = collection(db, 'vehicles');
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    },
    update: async (id: string, data: Partial<Vehicle>) => {
      const docRef = doc(db, 'vehicles', id);
      await updateDoc(docRef, data);
    },
    delete: async (id: string) => {
      const docRef = doc(db, 'vehicles', id);
      await deleteDoc(docRef);
    }
  },
  customers: {
    list: async (): Promise<Customer[]> => {
      const colRef = collection(db, 'customers');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        const list: Customer[] = [];
        for (const item of initialCustomers) {
          const docRef = await addDoc(colRef, item);
          list.push({ id: docRef.id, ...item });
        }
        return list;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    },
    create: async (data: Omit<Customer, 'id'>) => {
      const colRef = collection(db, 'customers');
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    },
    update: async (id: string, data: Partial<Customer>) => {
      const docRef = doc(db, 'customers', id);
      await updateDoc(docRef, data);
    }
  },
  sales: {
    list: async (): Promise<Sale[]> => {
      const colRef = collection(db, 'sales');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        const list: Sale[] = [];
        for (const item of initialSales) {
          const docRef = await addDoc(colRef, item);
          list.push({ id: docRef.id, ...item });
        }
        return list;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
    },
    create: async (data: Omit<Sale, 'id'>) => {
      const colRef = collection(db, 'sales');
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    }
  },
  expenses: {
    list: async (): Promise<Expense[]> => {
      const colRef = collection(db, 'expenses');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        const list: Expense[] = [];
        for (const item of initialExpenses) {
          const docRef = await addDoc(colRef, item);
          list.push({ id: docRef.id, ...item });
        }
        return list;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    },
    create: async (data: Omit<Expense, 'id'>) => {
      const colRef = collection(db, 'expenses');
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    }
  }
};
