import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { eq, and } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import { vehicles, customers, customerInteractions, sales, expenses } from './src/db/schema.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { cloudSqlService } from './src/services/cloudSqlService.ts';

// Seeding function to populate user's database with high-quality sample data if empty
async function seedUserData(userId: number) {
  try {
    const existingVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, userId));
    if (existingVehicles.length > 0) return; // Already seeded

    console.log(`Pre-seeding realistic sample data for user ID: ${userId}`);

    // Seed Vehicles
    const [v1] = await db.insert(vehicles).values({
      userId,
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
    }).returning();

    const [v2] = await db.insert(vehicles).values({
      userId,
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
    }).returning();

    const [v3] = await db.insert(vehicles).values({
      userId,
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
    }).returning();

    // Seed Customers
    const [c1] = await db.insert(customers).values({
      userId,
      name: 'Carlos Mendoza',
      phone: '+595 981 123456',
      email: 'carlos.mendoza@gmail.com',
      source: 'Facebook Marketplace',
      firstContactDate: '2026-06-20',
      status: 'Negociando',
    }).returning();

    await db.insert(customerInteractions).values({
      customerId: c1.id,
      date: '2026-06-20',
      type: 'WhatsApp',
      vehicleOfInterest: 'Toyota Hilux 2018',
      note: 'Consultó sobre el precio de contado y si se acepta vehículo como parte de pago.',
      nextFollowUp: '2026-06-25',
    });

    const [c2] = await db.insert(customers).values({
      userId,
      name: 'María Esquivel',
      phone: '+595 971 789012',
      email: 'maria.esquivel@outlook.com',
      source: 'Recomendado',
      firstContactDate: '2026-06-15',
      status: 'Ganado',
    }).returning();

    await db.insert(customerInteractions).values({
      customerId: c2.id,
      date: '2026-06-15',
      type: 'Llamada',
      vehicleOfInterest: 'Chevrolet Onix 2020',
      note: 'Interesada en financiación propia. Se coordinó visita al showroom.',
      nextFollowUp: '',
    });

    // Seed Sales
    await db.insert(sales).values({
      userId,
      date: '2026-06-29',
      vehicleId: v3.id.toString(),
      customerId: c2.id.toString(),
      salePrice: 70000000,
      downPayment: 40000000,
      pendingBalance: 30000000,
      paymentMethod: 'Transferencia Bancaria',
      commission: 2000000,
      netProfit: 13000000,
    });

    // Seed Expenses
    await db.insert(expenses).values({
      userId,
      vehicleId: v2.id.toString(),
      type: 'Mantenimiento',
      description: 'Cambio de pastillas de freno y aceite de motor',
      amount: 1500000,
      supplier: 'Taller El Amigo',
      date: '2026-06-25',
    });

    await db.insert(expenses).values({
      userId,
      vehicleId: v1.id.toString(),
      type: 'Estética',
      description: 'Lavado premium y pulido de carrocería',
      amount: 600000,
      supplier: 'CarWash VIP',
      date: '2026-06-28',
    });
  } catch (error) {
    console.error("Error during auto seeding user data:", error);
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
      await seedUserData(userId);

      const list = await cloudSqlService.vehicles.listByUserId(userId);
      res.json(list);
    } catch (error: any) {
      console.error("Failed to fetch vehicles:", error);
      res.status(500).json({ error: error.message || "Failed to fetch vehicles" });
    }
  });

  app.post("/api/vehicles", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const newVehicle = await cloudSqlService.vehicles.create(userId, req.body);
      res.status(201).json(newVehicle);
    } catch (error: any) {
      console.error("Failed to create vehicle:", error);
      res.status(500).json({ error: error.message || "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const vehicleId = parseInt(req.params.id, 10);
      if (isNaN(vehicleId)) {
        return res.status(400).json({ error: "Invalid vehicle ID" });
      }

      await cloudSqlService.vehicles.update(userId, vehicleId, req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to update vehicle:", error);
      res.status(500).json({ error: error.message || "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const vehicleId = parseInt(req.params.id, 10);
      if (isNaN(vehicleId)) {
        return res.status(400).json({ error: "Invalid vehicle ID" });
      }

      await cloudSqlService.vehicles.delete(userId, vehicleId);
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
      const list = await db.select().from(customers).where(eq(customers.userId, userId));
      
      const enrichedList = [];
      for (const customer of list) {
        const interactions = await db.select()
          .from(customerInteractions)
          .where(eq(customerInteractions.customerId, customer.id));
        
        enrichedList.push({
          ...customer,
          id: customer.id.toString(),
          interactions: interactions.map(i => ({ ...i, id: i.id.toString() }))
        });
      }

      res.json(enrichedList);
    } catch (error: any) {
      console.error("Failed to fetch customers:", error);
      res.status(500).json({ error: error.message || "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const { interactions, ...customerData } = req.body;

      const [newCustomer] = await db.insert(customers).values({
        ...customerData,
        userId,
      }).returning();

      if (interactions && Array.isArray(interactions)) {
        for (const inter of interactions) {
          await db.insert(customerInteractions).values({
            customerId: newCustomer.id,
            date: inter.date || new Date().toISOString().split('T')[0],
            type: inter.type || 'WhatsApp',
            vehicleOfInterest: inter.vehicleOfInterest || '',
            note: inter.note || '',
            nextFollowUp: inter.nextFollowUp || '',
          });
        }
      }

      res.status(201).json({ ...newCustomer, id: newCustomer.id.toString(), interactions: [] });
    } catch (error: any) {
      console.error("Failed to create customer:", error);
      res.status(500).json({ error: error.message || "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const customerId = parseInt(req.params.id, 10);
      if (isNaN(customerId)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }

      const { interactions, ...customerData } = req.body;

      await db.update(customers)
        .set(customerData)
        .where(and(eq(customers.id, customerId), eq(customers.userId, userId)));

      // If interactions are provided, update/insert them
      if (interactions && Array.isArray(interactions)) {
        for (const inter of interactions) {
          if (inter.id) {
            const interId = parseInt(inter.id, 10);
            if (!isNaN(interId)) {
              await db.update(customerInteractions)
                .set({
                  date: inter.date,
                  type: inter.type,
                  vehicleOfInterest: inter.vehicleOfInterest,
                  note: inter.note,
                  nextFollowUp: inter.nextFollowUp,
                })
                .where(eq(customerInteractions.id, interId));
            }
          } else {
            await db.insert(customerInteractions).values({
              customerId,
              date: inter.date || new Date().toISOString().split('T')[0],
              type: inter.type || 'WhatsApp',
              vehicleOfInterest: inter.vehicleOfInterest || '',
              note: inter.note || '',
              nextFollowUp: inter.nextFollowUp || '',
            });
          }
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to update customer:", error);
      res.status(500).json({ error: error.message || "Failed to update customer" });
    }
  });

  // ---- SECURE SALES ENDPOINTS ----
  app.get("/api/sales", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const list = await cloudSqlService.sales.listByUserId(userId);
      res.json(list);
    } catch (error: any) {
      console.error("Failed to fetch sales:", error);
      res.status(500).json({ error: error.message || "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const newSale = await cloudSqlService.sales.create(userId, req.body);
      res.status(201).json(newSale);
    } catch (error: any) {
      console.error("Failed to create sale:", error);
      res.status(500).json({ error: error.message || "Failed to create sale" });
    }
  });

  // ---- SECURE EXPENSES ENDPOINTS ----
  app.get("/api/expenses", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const list = await db.select().from(expenses).where(eq(expenses.userId, userId));
      res.json(list.map(e => ({ ...e, id: e.id.toString() })));
    } catch (error: any) {
      console.error("Failed to fetch expenses:", error);
      res.status(500).json({ error: error.message || "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const [newExpense] = await db.insert(expenses).values({
        ...req.body,
        userId,
      }).returning();
      res.status(201).json({ ...newExpense, id: newExpense.id.toString() });
    } catch (error: any) {
      console.error("Failed to create expense:", error);
      res.status(500).json({ error: error.message || "Failed to create expense" });
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
