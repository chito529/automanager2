import { collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Vehicle, Customer, Sale, Expense, Transaction, Account } from '../types';

// Generic fetch
const fetchCollection = async <T>(collName: string) => {
  const q = query(collection(db, collName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const api = {
  vehicles: {
    list: () => fetchCollection<Vehicle>('vehicles'),
    create: async (data: Omit<Vehicle, 'id'>) => {
      const docRef = await addDoc(collection(db, 'vehicles'), data);
      return docRef.id;
    },
    update: async (id: string, data: Partial<Vehicle>) => {
      await updateDoc(doc(db, 'vehicles', id), data);
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, 'vehicles', id));
    }
  },
  customers: {
    list: () => fetchCollection<Customer>('customers'),
    create: async (data: Omit<Customer, 'id'>) => {
      const docRef = await addDoc(collection(db, 'customers'), data);
      return docRef.id;
    },
    update: async (id: string, data: Partial<Customer>) => {
      await updateDoc(doc(db, 'customers', id), data);
    }
  },
  sales: {
    list: () => fetchCollection<Sale>('sales'),
    create: async (data: Omit<Sale, 'id'>) => {
      const docRef = await addDoc(collection(db, 'sales'), data);
      return docRef.id;
    }
  },
  expenses: {
    list: () => fetchCollection<Expense>('expenses'),
    create: async (data: Omit<Expense, 'id'>) => {
      const docRef = await addDoc(collection(db, 'expenses'), data);
      return docRef.id;
    }
  }
};
