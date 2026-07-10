import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (links to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  hasSeeded: boolean('has_seeded').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Vehicles table
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  vin: text('vin').notNull(),
  supplier: text('supplier').notNull(),
  purchaseDate: text('purchase_date').notNull(),
  purchasePrice: integer('purchase_price').notNull(),
  status: text('status').notNull(), // 'Publicado', 'En preparación', 'Vendido'
  publicationPrice: integer('publication_price').notNull(),
  salePrice: integer('sale_price').notNull(),
});

// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  source: text('source').notNull(), // 'Facebook Marketplace', 'Recomendado', etc.
  firstContactDate: text('first_contact_date').notNull(),
  status: text('status').notNull(), // 'Negociando', 'Ganado', 'Perdido'
});

// Customer interactions table (one customer has many interactions)
export const customerInteractions = pgTable('customer_interactions', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(),
  type: text('type').notNull(), // 'WhatsApp', 'Llamada', etc.
  vehicleOfInterest: text('vehicle_of_interest').notNull(),
  note: text('note').notNull(),
  nextFollowUp: text('next_follow_up').notNull(),
});

// Sales table
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(),
  vehicleId: text('vehicle_id').notNull(), // Stored as text to match any ID style
  customerId: text('customer_id').notNull(), // Stored as text
  salePrice: integer('sale_price').notNull(),
  downPayment: integer('down_payment').notNull(),
  pendingBalance: integer('pending_balance').notNull(),
  paymentMethod: text('payment_method').notNull(),
  commission: integer('commission').notNull(),
  netProfit: integer('net_profit').notNull(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vehicleId: text('vehicle_id').notNull(), // Links to vehicles
  type: text('type').notNull(), // 'Mantenimiento', 'Estética', etc.
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  supplier: text('supplier').notNull(),
  date: text('date').notNull(),
});

// Transactions table (for general cash flow ledger)
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(),
  type: text('type').notNull(), // 'Ingreso', 'Egreso'
  category: text('category').notNull(), // Concept/Category description
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  vehicleId: text('vehicle_id'), // Optional link to a vehicle
});

// Accounts table (for both Accounts Receivable and Accounts Payable)
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'Cobrar', 'Pagar'
  entity: text('entity').notNull(), // Customer name or Supplier name
  amount: integer('amount').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull(), // 'Pendiente', 'Pagado'
});

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  customers: many(customers),
  sales: many(sales),
  expenses: many(expenses),
  transactions: many(transactions),
  accounts: many(accounts),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  user: one(users, {
    fields: [vehicles.userId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  interactions: many(customerInteractions),
}));

export const customerInteractionsRelations = relations(customerInteractions, ({ one }) => ({
  customer: one(customers, {
    fields: [customerInteractions.customerId],
    references: [customers.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
