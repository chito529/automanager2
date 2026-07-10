import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { firestoreService } from './src/services/firestoreService.ts';

// Seeding function to populate user's Firestore database with high-quality sample data if empty
async function seedUserData(userId: string, email: string) {
  try {
    const user: any = await firestoreService.users.getOrCreate(userId, email);
    if (user.hasSeeded) return; // Already seeded

    console.log(`Pre-seeding realistic Firestore sample data for user ID: ${userId}`);

    // Mark as seeded first to prevent double-triggering
    await firestoreService.users.markAsSeeded(userId);

    // Seed Vehicles
    const v1 = await firestoreService.vehicles.create(userId, {
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
    });

    const v2 = await firestoreService.vehicles.create(userId, {
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
    });

    const v3 = await firestoreService.vehicles.create(userId, {
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
    });

    // Seed Customers & Interactions
    const c1 = await firestoreService.customers.create(userId, {
      name: 'Carlos Mendoza',
      phone: '+595 981 123456',
      email: 'carlos.mendoza@gmail.com',
      source: 'Facebook Marketplace',
      firstContactDate: '2026-06-20',
      status: 'Negociando',
      interactions: [
        {
          date: '2026-06-20',
          type: 'WhatsApp',
          vehicleOfInterest: 'Toyota Hilux 2018',
          note: 'Consultó sobre el precio de contado y si se acepta vehículo como parte de pago.',
          nextFollowUp: '2026-06-25',
        }
      ]
    });

    const c2 = await firestoreService.customers.create(userId, {
      name: 'María Esquivel',
      phone: '+595 971 789012',
      email: 'maria.esquivel@outlook.com',
      source: 'Recomendado',
      firstContactDate: '2026-06-15',
      status: 'Ganado',
      interactions: [
        {
          date: '2026-06-15',
          type: 'Llamada',
          vehicleOfInterest: 'Chevrolet Onix 2020',
          note: 'Interesada en financiación propia. Se coordinó visita al showroom.',
          nextFollowUp: '',
        }
      ]
    });

    // Seed Sales
    await firestoreService.sales.create(userId, {
      date: '2026-06-29',
      vehicleId: v3.id,
      customerId: c2.id,
      salePrice: 70000000,
      downPayment: 40000000,
      pendingBalance: 30000000,
      paymentMethod: 'Transferencia Bancaria',
      commission: 2000000,
      netProfit: 13000000,
    });

    // Seed Expenses
    await firestoreService.expenses.create(userId, {
      vehicleId: v2.id,
      type: 'Mantenimiento',
      description: 'Cambio de pastillas de freno y aceite de motor',
      amount: 1500000,
      supplier: 'Taller El Amigo',
      date: '2026-06-25',
    });

    await firestoreService.expenses.create(userId, {
      vehicleId: v1.id,
      type: 'Estética',
      description: 'Lavado premium y pulido de carrocería',
      amount: 600000,
      supplier: 'CarWash VIP',
      date: '2026-06-28',
    });

    // Seed Cash flow ledger Transactions
    await firestoreService.transactions.create(userId, {
      date: '2026-06-01',
      type: 'Egreso',
      category: 'Alquiler de Showroom',
      amount: 3500000,
      paymentMethod: 'Transferencia Bancaria'
    });

    await firestoreService.transactions.create(userId, {
      date: '2026-06-15',
      type: 'Egreso',
      category: 'Pago de Publicidad Digital',
      amount: 800000,
      paymentMethod: 'Tarjeta de Crédito'
    });

    await firestoreService.transactions.create(userId, {
      date: '2026-06-29',
      type: 'Ingreso',
      category: 'Seña por Venta de Chevrolet Onix',
      amount: 40000000,
      paymentMethod: 'Transferencia Bancaria',
      vehicleId: v3.id
    });

    await firestoreService.transactions.create(userId, {
      date: '2026-06-30',
      type: 'Ingreso',
      category: 'Venta de Servicios Auxiliares',
      amount: 1200000,
      paymentMethod: 'Efectivo'
    });

    // Seed Accounts Receivable & Payable (Cuentas por cobrar/pagar)
    await firestoreService.accounts.create(userId, {
      type: 'Cobrar',
      entity: 'María Esquivel',
      amount: 30000000, // Remaining balance of Chevrolet Onix sale
      dueDate: '2026-07-29',
      status: 'Pendiente'
    });

    await firestoreService.accounts.create(userId, {
      type: 'Pagar',
      entity: 'Taller El Amigo',
      amount: 1500000, // Remaining balance for Tucson maintenance
      dueDate: '2026-07-15',
      status: 'Pendiente'
    });

    await firestoreService.accounts.create(userId, {
      type: 'Pagar',
      entity: 'Escribanía Servín',
      amount: 2500000, // Transfer paperwork
      dueDate: '2026-07-20',
      status: 'Pendiente'
    });
  } catch (error) {
    console.error("Error during auto seeding Firestore user data:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ---- SECURE VEHICLES ENDPOINTS ----
  app.get("/api/vehicles", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      // Trigger automatic background seeding if empty
      await seedUserData(userId, req.user!.email);

      const list = await firestoreService.vehicles.listByUserId(userId);
      res.json(list);
    } catch (error: any) {
      console.error("Failed to fetch vehicles:", error);
      res.status(500).json({ error: error.message || "Failed to fetch vehicles" });
    }
  });

  app.post("/api/vehicles", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const newVehicle = await firestoreService.vehicles.create(userId, req.body);
      res.status(201).json(newVehicle);
    } catch (error: any) {
      console.error("Failed to create vehicle:", error);
      res.status(500).json({ error: error.message || "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const vehicleId = req.params.id;

      await firestoreService.vehicles.update(userId, vehicleId, req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to update vehicle:", error);
      res.status(500).json({ error: error.message || "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const vehicleId = req.params.id;

      await firestoreService.vehicles.delete(userId, vehicleId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to delete vehicle:", error);
      res.status(500).json({ error: error.message || "Failed to delete vehicle" });
    }
  });

  // ---- SECURE CUSTOMERS ENDPOINTS ----
  app.get("/api/customers", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const list = await firestoreService.customers.listByUserId(userId);
      res.json(list);
    } catch (error: any) {
      console.error("Failed to fetch customers:", error);
      res.status(500).json({ error: error.message || "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const newCustomer = await firestoreService.customers.create(userId, req.body);
      res.status(201).json(newCustomer);
    } catch (error: any) {
      console.error("Failed to create customer:", error);
      res.status(500).json({ error: error.message || "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const customerId = req.params.id;

      await firestoreService.customers.update(userId, customerId, req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to update customer:", error);
      res.status(500).json({ error: error.message || "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const customerId = req.params.id;

      const success = await firestoreService.customers.delete(userId, customerId);
      res.json({ success });
    } catch (error: any) {
      console.error("Failed to delete customer:", error);
      res.status(500).json({ error: error.message || "Failed to delete customer" });
    }
  });

  // ---- SECURE SALES ENDPOINTS ----
  app.get("/api/sales", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const list = await firestoreService.sales.listByUserId(userId);
      res.json(list);
    } catch (error: any) {
      console.error("Failed to fetch sales:", error);
      res.status(500).json({ error: error.message || "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const newSale = await firestoreService.sales.create(userId, req.body);
      res.status(201).json(newSale);
    } catch (error: any) {
      console.error("Failed to create sale:", error);
      res.status(500).json({ error: error.message || "Failed to create sale" });
    }
  });

  app.delete("/api/sales/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const saleId = req.params.id;

      const success = await firestoreService.sales.delete(userId, saleId);
      res.json({ success });
    } catch (error: any) {
      console.error("Failed to delete sale:", error);
      res.status(500).json({ error: error.message || "Failed to delete sale" });
    }
  });

  // ---- SECURE EXPENSES ENDPOINTS ----
  app.get("/api/expenses", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const list = await firestoreService.expenses.listByUserId(userId);
      res.json(list);
    } catch (error: any) {
      console.error("Failed to fetch expenses:", error);
      res.status(500).json({ error: error.message || "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const newExpense = await firestoreService.expenses.create(userId, req.body);
      res.status(201).json(newExpense);
    } catch (error: any) {
      console.error("Failed to create expense:", error);
      res.status(500).json({ error: error.message || "Failed to create expense" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const expenseId = req.params.id;

      const success = await firestoreService.expenses.delete(userId, expenseId);
      res.json({ success });
    } catch (error: any) {
      console.error("Failed to delete expense:", error);
      res.status(500).json({ error: error.message || "Failed to delete expense" });
    }
  });

  // ---- SECURE TRANSACTIONS ENDPOINTS ----
  app.get("/api/transactions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const list = await firestoreService.transactions.listByUserId(userId);
      res.json(list);
    } catch (error: any) {
      console.error("Failed to fetch transactions:", error);
      res.status(500).json({ error: error.message || "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const newTx = await firestoreService.transactions.create(userId, req.body);
      res.status(201).json(newTx);
    } catch (error: any) {
      console.error("Failed to create transaction:", error);
      res.status(500).json({ error: error.message || "Failed to create transaction" });
    }
  });

  app.delete("/api/transactions/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const txId = req.params.id;
      await firestoreService.transactions.delete(userId, txId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to delete transaction:", error);
      res.status(500).json({ error: error.message || "Failed to delete transaction" });
    }
  });

  // ---- SECURE ACCOUNTS ENDPOINTS ----
  app.get("/api/accounts", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const list = await firestoreService.accounts.listByUserId(userId);
      res.json(list);
    } catch (error: any) {
      console.error("Failed to fetch accounts:", error);
      res.status(500).json({ error: error.message || "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const newAcc = await firestoreService.accounts.create(userId, req.body);
      res.status(201).json(newAcc);
    } catch (error: any) {
      console.error("Failed to create account:", error);
      res.status(500).json({ error: error.message || "Failed to create account" });
    }
  });

  app.patch("/api/accounts/:id/status", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const accId = req.params.id;
      const { status } = req.body;
      await firestoreService.accounts.updateStatus(userId, accId, status);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to update account status:", error);
      res.status(500).json({ error: error.message || "Failed to update account status" });
    }
  });

  app.delete("/api/accounts/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const accId = req.params.id;
      await firestoreService.accounts.delete(userId, accId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      res.status(500).json({ error: error.message || "Failed to delete account" });
    }
  });

  // Vite middleware for dev / static files for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
