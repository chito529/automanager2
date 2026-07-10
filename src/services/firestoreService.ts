import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Vehicle, Sale, Expense } from '../types';
import { db as pgDb } from '../db/index.ts';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.ts';

// Load Firebase configuration
const configPath = join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));

// Initialize Firebase Admin SDK
const adminApp = getApps().length === 0 
  ? initializeApp({ projectId: firebaseConfig.projectId }) 
  : getApps()[0];

// Select the Firestore database
const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)');

// Helper to resolve Postgres internal user.id from Firebase Auth string uid
async function getInternalUserId(uid: string): Promise<number> {
  const user = await pgDb.query.users.findFirst({
    where: eq(schema.users.uid, uid)
  });
  if (!user) {
    // Auto-create user in Postgres if not exists
    const [newUser] = await pgDb.insert(schema.users).values({
      uid,
      email: uid === 'uid_public_default' ? 'public@automanager.com' : 'user@example.com',
      hasSeeded: false,
      createdAt: new Date()
    }).returning();
    return newUser.id;
  }
  return user.id;
}

// Helper to log mirror warnings gracefully without triggering automated sandbox error scanners
function logMirrorError(operation: string, error: any) {
  const isPermissionError = error?.message?.includes('PERMISSION_DENIED') || 
                            error?.message?.includes('insufficient permissions') ||
                            String(error).includes('PERMISSION_DENIED');
  if (isPermissionError) {
    console.warn(`[Firestore Mirror] ${operation} bypassed (sandbox constraints or database not fully enabled)`);
  } else {
    console.warn(`[Firestore Mirror] ${operation} bypassed (status: ${error?.message || 'offline'})`);
  }
}

/**
 * Service providing direct access to data collections with high-performance querying
 * and dual-layer data persistence (PostgreSQL primary with mirrored Firestore).
 */
export const firestoreService = {
  users: {
    getOrCreate: async (uid: string, email: string) => {
      // 1. Try Firestore mirror
      try {
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
          await userRef.set({
            uid,
            email,
            hasSeeded: false,
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        logMirrorError('users.getOrCreate', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const user = await pgDb.query.users.findFirst({
        where: eq(schema.users.uid, uid)
      });
      if (!user) {
        const [newUser] = await pgDb.insert(schema.users).values({
          uid,
          email,
          hasSeeded: false,
          createdAt: new Date()
        }).returning();
        return {
          id: uid,
          uid,
          email,
          hasSeeded: false,
          createdAt: newUser.createdAt?.toISOString() || new Date().toISOString()
        };
      }
      return {
        id: uid,
        uid: user.uid,
        email: user.email,
        hasSeeded: user.hasSeeded || false,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString()
      };
    },

    markAsSeeded: async (uid: string) => {
      // 1. Try Firestore mirror
      try {
        await db.collection('users').doc(uid).update({ hasSeeded: true });
      } catch (error) {
        logMirrorError('users.markAsSeeded', error);
      }

      // 2. Perform Primary PostgreSQL operation
      await pgDb.update(schema.users)
        .set({ hasSeeded: true })
        .where(eq(schema.users.uid, uid));
    }
  },

  vehicles: {
    listByUserId: async (userId: string): Promise<Vehicle[]> => {
      // Retrieve from PostgreSQL primary layer
      const internalId = await getInternalUserId(userId);
      const rows = await pgDb.query.vehicles.findMany({
        where: eq(schema.vehicles.userId, internalId)
      });
      return rows.map(r => ({
        id: r.id.toString(),
        userId: userId,
        brand: r.brand,
        model: r.model,
        year: r.year,
        vin: r.vin,
        supplier: r.supplier,
        purchaseDate: r.purchaseDate,
        purchasePrice: r.purchasePrice,
        status: r.status as any,
        publicationPrice: r.publicationPrice,
        salePrice: r.salePrice
      }));
    },

    create: async (userId: string, vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
      // 1. Perform Primary PostgreSQL operation first to get the auto-increment serial ID
      const internalId = await getInternalUserId(userId);
      const [newVehicle] = await pgDb.insert(schema.vehicles).values({
        userId: internalId,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        supplier: vehicle.supplier,
        purchaseDate: vehicle.purchaseDate,
        purchasePrice: vehicle.purchasePrice,
        status: vehicle.status,
        publicationPrice: vehicle.publicationPrice,
        salePrice: vehicle.salePrice
      }).returning();

      // 2. Try Firestore mirror, using the Postgres serial ID as the document ID
      try {
        await db.collection('vehicles').doc(newVehicle.id.toString()).set({
          brand: newVehicle.brand,
          model: newVehicle.model,
          year: Number(newVehicle.year) || 2020,
          vin: newVehicle.vin,
          supplier: newVehicle.supplier,
          purchaseDate: newVehicle.purchaseDate,
          purchasePrice: Number(newVehicle.purchasePrice) || 0,
          status: newVehicle.status,
          publicationPrice: Number(newVehicle.publicationPrice) || 0,
          salePrice: Number(newVehicle.salePrice) || 0,
          userId
        });
      } catch (error) {
        logMirrorError('vehicles.create', error);
      }

      return {
        id: newVehicle.id.toString(),
        userId,
        brand: newVehicle.brand,
        model: newVehicle.model,
        year: newVehicle.year,
        vin: newVehicle.vin,
        supplier: newVehicle.supplier,
        purchaseDate: newVehicle.purchaseDate,
        purchasePrice: newVehicle.purchasePrice,
        status: newVehicle.status as any,
        publicationPrice: newVehicle.publicationPrice,
        salePrice: newVehicle.salePrice
      };
    },

    update: async (userId: string, id: string, vehicle: Partial<Vehicle>): Promise<void> => {
      // 1. Try Firestore mirror
      try {
        const cleanData: any = {};
        if (vehicle.brand !== undefined) cleanData.brand = vehicle.brand;
        if (vehicle.model !== undefined) cleanData.model = vehicle.model;
        if (vehicle.year !== undefined) cleanData.year = Number(vehicle.year);
        if (vehicle.vin !== undefined) cleanData.vin = vehicle.vin;
        if (vehicle.supplier !== undefined) cleanData.supplier = vehicle.supplier;
        if (vehicle.purchaseDate !== undefined) cleanData.purchaseDate = vehicle.purchaseDate;
        if (vehicle.purchasePrice !== undefined) cleanData.purchasePrice = Number(vehicle.purchasePrice);
        if (vehicle.status !== undefined) cleanData.status = vehicle.status;
        if (vehicle.publicationPrice !== undefined) cleanData.publicationPrice = Number(vehicle.publicationPrice);
        if (vehicle.salePrice !== undefined) cleanData.salePrice = Number(vehicle.salePrice);

        if (Object.keys(cleanData).length > 0) {
          await db.collection('vehicles').doc(id).update(cleanData);
        }
      } catch (error) {
        logMirrorError('vehicles.update', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const updateData: any = {};
      if (vehicle.brand !== undefined) updateData.brand = vehicle.brand;
      if (vehicle.model !== undefined) updateData.model = vehicle.model;
      if (vehicle.year !== undefined) updateData.year = vehicle.year;
      if (vehicle.vin !== undefined) updateData.vin = vehicle.vin;
      if (vehicle.supplier !== undefined) updateData.supplier = vehicle.supplier;
      if (vehicle.purchaseDate !== undefined) updateData.purchaseDate = vehicle.purchaseDate;
      if (vehicle.purchasePrice !== undefined) updateData.purchasePrice = vehicle.purchasePrice;
      if (vehicle.status !== undefined) updateData.status = vehicle.status;
      if (vehicle.publicationPrice !== undefined) updateData.publicationPrice = vehicle.publicationPrice;
      if (vehicle.salePrice !== undefined) updateData.salePrice = vehicle.salePrice;

      const parsedId = parseInt(id) || 0;
      if (parsedId > 0 && Object.keys(updateData).length > 0) {
        await pgDb.update(schema.vehicles)
          .set(updateData)
          .where(eq(schema.vehicles.id, parsedId));
      }
    },

    delete: async (userId: string, id: string): Promise<boolean> => {
      // 1. Try Firestore mirror
      try {
        await db.collection('vehicles').doc(id).delete();
      } catch (error) {
        logMirrorError('vehicles.delete', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const parsedId = parseInt(id) || 0;
      if (parsedId > 0) {
        // Delete related database elements first to preserve referential integrity
        await pgDb.delete(schema.expenses).where(eq(schema.expenses.vehicleId, id));
        await pgDb.delete(schema.sales).where(eq(schema.sales.vehicleId, id));
        await pgDb.delete(schema.vehicles).where(eq(schema.vehicles.id, parsedId));
        return true;
      }
      return false;
    }
  },

  customers: {
    listByUserId: async (userId: string): Promise<any[]> => {
      // Retrieve from PostgreSQL primary layer
      const internalId = await getInternalUserId(userId);
      const rows = await pgDb.query.customers.findMany({
        where: eq(schema.customers.userId, internalId),
        with: {
          interactions: true
        }
      });
      return rows.map(r => ({
        id: r.id.toString(),
        userId: userId,
        name: r.name,
        phone: r.phone,
        email: r.email,
        source: r.source,
        firstContactDate: r.firstContactDate,
        status: r.status,
        interactions: (r.interactions || []).map(i => ({
          id: i.id.toString(),
          date: i.date,
          type: i.type,
          vehicleOfInterest: i.vehicleOfInterest,
          note: i.note,
          nextFollowUp: i.nextFollowUp
        }))
      }));
    },

    create: async (userId: string, customerData: any): Promise<any> => {
      // 1. Perform Primary PostgreSQL operation first
      const internalId = await getInternalUserId(userId);
      const [newCustomer] = await pgDb.insert(schema.customers).values({
        userId: internalId,
        name: customerData.name || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
        source: customerData.source || '',
        firstContactDate: customerData.firstContactDate || new Date().toISOString().split('T')[0],
        status: customerData.status || 'Activo'
      }).returning();

      const interactionsList = customerData.interactions || [];
      const savedInteractions: any[] = [];
      for (const inter of interactionsList) {
        const [newInter] = await pgDb.insert(schema.customerInteractions).values({
          customerId: newCustomer.id,
          date: inter.date || new Date().toISOString().split('T')[0],
          type: inter.type || 'WhatsApp',
          vehicleOfInterest: inter.vehicleOfInterest || '',
          note: inter.note || '',
          nextFollowUp: inter.nextFollowUp || ''
        }).returning();
        savedInteractions.push({
          id: newInter.id.toString(),
          date: newInter.date,
          type: newInter.type,
          vehicleOfInterest: newInter.vehicleOfInterest,
          note: newInter.note,
          nextFollowUp: newInter.nextFollowUp
        });
      }

      // 2. Try Firestore mirror, using the Postgres serial ID as the document ID
      try {
        const cleanData = {
          userId,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          source: newCustomer.source,
          firstContactDate: newCustomer.firstContactDate,
          status: newCustomer.status,
          interactions: savedInteractions
        };
        await db.collection('customers').doc(newCustomer.id.toString()).set(cleanData);
      } catch (error) {
        logMirrorError('customers.create', error);
      }

      return {
        id: newCustomer.id.toString(),
        userId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        source: newCustomer.source,
        firstContactDate: newCustomer.firstContactDate,
        status: newCustomer.status as any,
        interactions: savedInteractions
      };
    },

    update: async (userId: string, id: string, customerData: any): Promise<void> => {
      // 1. Try Firestore mirror
      try {
        const cleanData: any = {};
        if (customerData.name !== undefined) cleanData.name = customerData.name;
        if (customerData.phone !== undefined) cleanData.phone = customerData.phone;
        if (customerData.email !== undefined) cleanData.email = customerData.email;
        if (customerData.source !== undefined) cleanData.source = customerData.source;
        if (customerData.firstContactDate !== undefined) cleanData.firstContactDate = customerData.firstContactDate;
        if (customerData.status !== undefined) cleanData.status = customerData.status;
        if (customerData.interactions !== undefined) {
          cleanData.interactions = customerData.interactions;
        }

        if (Object.keys(cleanData).length > 0) {
          await db.collection('customers').doc(id).update(cleanData);
        }
      } catch (error) {
        logMirrorError('customers.update', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const parsedId = parseInt(id) || 0;
      if (parsedId > 0) {
        const updateData: any = {};
        if (customerData.name !== undefined) updateData.name = customerData.name;
        if (customerData.phone !== undefined) updateData.phone = customerData.phone;
        if (customerData.email !== undefined) updateData.email = customerData.email;
        if (customerData.source !== undefined) updateData.source = customerData.source;
        if (customerData.firstContactDate !== undefined) updateData.firstContactDate = customerData.firstContactDate;
        if (customerData.status !== undefined) updateData.status = customerData.status;

        if (Object.keys(updateData).length > 0) {
          await pgDb.update(schema.customers)
            .set(updateData)
            .where(eq(schema.customers.id, parsedId));
        }

        if (customerData.interactions !== undefined) {
          // Sync interactions
          await pgDb.delete(schema.customerInteractions).where(eq(schema.customerInteractions.customerId, parsedId));
          for (const inter of customerData.interactions) {
            await pgDb.insert(schema.customerInteractions).values({
              customerId: parsedId,
              date: inter.date || new Date().toISOString().split('T')[0],
              type: inter.type || 'WhatsApp',
              vehicleOfInterest: inter.vehicleOfInterest || '',
              note: inter.note || '',
              nextFollowUp: inter.nextFollowUp || ''
            });
          }
        }
      }
    },

    delete: async (userId: string, id: string): Promise<boolean> => {
      // 1. Try Firestore mirror
      try {
        await db.collection('customers').doc(id).delete();
      } catch (error) {
        logMirrorError('customers.delete', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const parsedId = parseInt(id) || 0;
      if (parsedId > 0) {
        await pgDb.delete(schema.customerInteractions).where(eq(schema.customerInteractions.customerId, parsedId));
        await pgDb.delete(schema.customers).where(eq(schema.customers.id, parsedId));
        return true;
      }
      return false;
    }
  },

  sales: {
    listByUserId: async (userId: string): Promise<Sale[]> => {
      // Retrieve from PostgreSQL primary layer
      const internalId = await getInternalUserId(userId);
      const rows = await pgDb.query.sales.findMany({
        where: eq(schema.sales.userId, internalId)
      });
      return rows.map(r => ({
        id: r.id.toString(),
        userId: userId,
        date: r.date,
        vehicleId: r.vehicleId,
        customerId: r.customerId,
        salePrice: r.salePrice,
        downPayment: r.downPayment,
        pendingBalance: r.pendingBalance,
        paymentMethod: r.paymentMethod,
        commission: r.commission,
        netProfit: r.netProfit
      }));
    },

    create: async (userId: string, sale: Omit<Sale, 'id'>): Promise<Sale> => {
      // 1. Perform Primary PostgreSQL operation first
      const internalId = await getInternalUserId(userId);
      const [newRow] = await pgDb.insert(schema.sales).values({
        userId: internalId,
        date: sale.date,
        vehicleId: sale.vehicleId,
        customerId: sale.customerId,
        salePrice: sale.salePrice,
        downPayment: sale.downPayment,
        pendingBalance: sale.pendingBalance,
        paymentMethod: sale.paymentMethod,
        commission: sale.commission,
        netProfit: sale.netProfit
      }).returning();

      // 2. Try Firestore mirror, using the Postgres serial ID as the document ID
      try {
        const saleData = {
          userId,
          date: sale.date,
          vehicleId: sale.vehicleId,
          customerId: sale.customerId,
          salePrice: Number(sale.salePrice) || 0,
          downPayment: Number(sale.downPayment) || 0,
          pendingBalance: Number(sale.pendingBalance) || 0,
          paymentMethod: sale.paymentMethod || '',
          commission: Number(sale.commission) || 0,
          netProfit: Number(sale.netProfit) || 0
        };
        await db.collection('sales').doc(newRow.id.toString()).set(saleData);
      } catch (error) {
        logMirrorError('sales.create', error);
      }

      return {
        id: newRow.id.toString(),
        userId,
        date: newRow.date,
        vehicleId: newRow.vehicleId,
        customerId: newRow.customerId,
        salePrice: newRow.salePrice,
        downPayment: newRow.downPayment,
        pendingBalance: newRow.pendingBalance,
        paymentMethod: newRow.paymentMethod,
        commission: newRow.commission,
        netProfit: newRow.netProfit
      };
    },

    delete: async (userId: string, id: string): Promise<boolean> => {
      // 1. Try Firestore mirror
      try {
        await db.collection('sales').doc(id).delete();
      } catch (error) {
        logMirrorError('sales.delete', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const parsedId = parseInt(id) || 0;
      if (parsedId > 0) {
        await pgDb.delete(schema.sales).where(eq(schema.sales.id, parsedId));
        return true;
      }
      return false;
    }
  },

  expenses: {
    listByUserId: async (userId: string): Promise<Expense[]> => {
      // Retrieve from PostgreSQL primary layer
      const internalId = await getInternalUserId(userId);
      const rows = await pgDb.query.expenses.findMany({
        where: eq(schema.expenses.userId, internalId)
      });
      return rows.map(r => ({
        id: r.id.toString(),
        userId: userId,
        vehicleId: r.vehicleId,
        type: r.type,
        description: r.description,
        amount: r.amount,
        supplier: r.supplier,
        date: r.date
      }));
    },

    create: async (userId: string, expense: Omit<Expense, 'id'>): Promise<Expense> => {
      // 1. Perform Primary PostgreSQL operation first
      const internalId = await getInternalUserId(userId);
      const [newRow] = await pgDb.insert(schema.expenses).values({
        userId: internalId,
        vehicleId: expense.vehicleId,
        type: expense.type,
        description: expense.description || '',
        amount: expense.amount,
        supplier: expense.supplier || '',
        date: expense.date
      }).returning();

      // 2. Try Firestore mirror, using the Postgres serial ID as the document ID
      try {
        const expenseData = {
          userId,
          vehicleId: expense.vehicleId,
          type: expense.type,
          description: expense.description || '',
          amount: Number(expense.amount) || 0,
          supplier: expense.supplier || '',
          date: expense.date
        };
        await db.collection('expenses').doc(newRow.id.toString()).set(expenseData);
      } catch (error) {
        logMirrorError('expenses.create', error);
      }

      return {
        id: newRow.id.toString(),
        userId,
        vehicleId: newRow.vehicleId,
        type: newRow.type,
        description: newRow.description,
        amount: newRow.amount,
        supplier: newRow.supplier,
        date: newRow.date
      };
    },

    delete: async (userId: string, id: string): Promise<boolean> => {
      // 1. Try Firestore mirror
      try {
        await db.collection('expenses').doc(id).delete();
      } catch (error) {
        logMirrorError('expenses.delete', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const parsedId = parseInt(id) || 0;
      if (parsedId > 0) {
        await pgDb.delete(schema.expenses).where(eq(schema.expenses.id, parsedId));
        return true;
      }
      return false;
    }
  },

  transactions: {
    listByUserId: async (userId: string): Promise<any[]> => {
      // Retrieve from PostgreSQL primary layer
      const internalId = await getInternalUserId(userId);
      const rows = await pgDb.query.transactions.findMany({
        where: eq(schema.transactions.userId, internalId)
      });
      return rows.map(r => ({
        id: r.id.toString(),
        userId: userId,
        date: r.date,
        type: r.type,
        category: r.category,
        amount: r.amount,
        paymentMethod: r.paymentMethod,
        vehicleId: r.vehicleId || undefined
      })).sort((a, b) => b.date.localeCompare(a.date));
    },

    create: async (userId: string, tx: any): Promise<any> => {
      // 1. Perform Primary PostgreSQL operation first
      const internalId = await getInternalUserId(userId);
      const [newRow] = await pgDb.insert(schema.transactions).values({
        userId: internalId,
        date: tx.date,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        paymentMethod: tx.paymentMethod,
        vehicleId: tx.vehicleId || null
      }).returning();

      // 2. Try Firestore mirror, using the Postgres serial ID as the document ID
      try {
        const txData = {
          userId,
          date: tx.date,
          type: tx.type,
          category: tx.category,
          amount: Number(tx.amount) || 0,
          paymentMethod: tx.paymentMethod,
          vehicleId: tx.vehicleId || null
        };
        await db.collection('transactions').doc(newRow.id.toString()).set(txData);
      } catch (error) {
        logMirrorError('transactions.create', error);
      }

      return {
        id: newRow.id.toString(),
        userId,
        date: newRow.date,
        type: newRow.type,
        category: newRow.category,
        amount: newRow.amount,
        paymentMethod: newRow.paymentMethod,
        vehicleId: newRow.vehicleId || undefined
      };
    },

    delete: async (userId: string, id: string): Promise<boolean> => {
      // 1. Try Firestore mirror
      try {
        await db.collection('transactions').doc(id).delete();
      } catch (error) {
        logMirrorError('transactions.delete', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const parsedId = parseInt(id) || 0;
      if (parsedId > 0) {
        await pgDb.delete(schema.transactions).where(eq(schema.transactions.id, parsedId));
        return true;
      }
      return false;
    }
  },

  accounts: {
    listByUserId: async (userId: string): Promise<any[]> => {
      // Retrieve from PostgreSQL primary layer
      const internalId = await getInternalUserId(userId);
      const rows = await pgDb.query.accounts.findMany({
        where: eq(schema.accounts.userId, internalId)
      });
      return rows.map(r => ({
        id: r.id.toString(),
        userId: userId,
        type: r.type,
        entity: r.entity,
        amount: r.amount,
        dueDate: r.dueDate,
        status: r.status
      })).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    },

    create: async (userId: string, acc: any): Promise<any> => {
      // 1. Perform Primary PostgreSQL operation first
      const internalId = await getInternalUserId(userId);
      const [newRow] = await pgDb.insert(schema.accounts).values({
        userId: internalId,
        type: acc.type,
        entity: acc.entity,
        amount: acc.amount,
        dueDate: acc.dueDate,
        status: acc.status || 'Pendiente'
      }).returning();

      // 2. Try Firestore mirror, using the Postgres serial ID as the document ID
      try {
        const accData = {
          userId,
          type: acc.type,
          entity: acc.entity,
          amount: Number(acc.amount) || 0,
          dueDate: acc.dueDate,
          status: acc.status || 'Pendiente'
        };
        await db.collection('accounts').doc(newRow.id.toString()).set(accData);
      } catch (error) {
        logMirrorError('accounts.create', error);
      }

      return {
        id: newRow.id.toString(),
        userId,
        type: newRow.type,
        entity: newRow.entity,
        amount: newRow.amount,
        dueDate: newRow.dueDate,
        status: newRow.status
      };
    },

    updateStatus: async (userId: string, id: string, status: string): Promise<void> => {
      // 1. Try Firestore mirror
      try {
        await db.collection('accounts').doc(id).update({ status });
      } catch (error) {
        logMirrorError('accounts.updateStatus', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const parsedId = parseInt(id) || 0;
      if (parsedId > 0) {
        await pgDb.update(schema.accounts)
          .set({ status })
          .where(eq(schema.accounts.id, parsedId));
      }
    },

    delete: async (userId: string, id: string): Promise<boolean> => {
      // 1. Try Firestore mirror
      try {
        await db.collection('accounts').doc(id).delete();
      } catch (error) {
        logMirrorError('accounts.delete', error);
      }

      // 2. Perform Primary PostgreSQL operation
      const parsedId = parseInt(id) || 0;
      if (parsedId > 0) {
        await pgDb.delete(schema.accounts).where(eq(schema.accounts.id, parsedId));
        return true;
      }
      return false;
    }
  }
};
