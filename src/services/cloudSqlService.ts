import { pool } from '../db/index.ts';
import { Vehicle, Sale } from '../types';

/**
 * Cloud SQL Connection Service using direct 'pg' package queries
 * for high-performance inventory (vehicles) and sales operations.
 */
export const cloudSqlService = {
  vehicles: {
    /**
     * Lists all vehicles for a specific user.
     */
    listByUserId: async (userId: number): Promise<Vehicle[]> => {
      const query = `
        SELECT 
          id, 
          user_id as "userId", 
          brand, 
          model, 
          year, 
          vin, 
          supplier, 
          purchase_date as "purchaseDate", 
          purchase_price as "purchasePrice", 
          status, 
          publication_price as "publicationPrice", 
          sale_price as "salePrice"
        FROM vehicles
        WHERE user_id = $1
        ORDER BY id DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows.map(row => ({
        ...row,
        id: row.id.toString(),
      }));
    },

    /**
     * Creates a new vehicle record.
     */
    create: async (userId: number, vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
      const query = `
        INSERT INTO vehicles (
          user_id, brand, model, year, vin, supplier, 
          purchase_date, purchase_price, status, publication_price, sale_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING 
          id, 
          user_id as "userId", 
          brand, 
          model, 
          year, 
          vin, 
          supplier, 
          purchase_date as "purchaseDate", 
          purchase_price as "purchasePrice", 
          status, 
          publication_price as "publicationPrice", 
          sale_price as "salePrice"
      `;
      const values = [
        userId,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.vin,
        vehicle.supplier,
        vehicle.purchaseDate,
        vehicle.purchasePrice,
        vehicle.status,
        vehicle.publicationPrice,
        vehicle.salePrice
      ];
      const result = await pool.query(query, values);
      const newRow = result.rows[0];
      return {
        ...newRow,
        id: newRow.id.toString()
      };
    },

    /**
     * Updates an existing vehicle record.
     */
    update: async (userId: number, id: number, updates: Partial<Vehicle>): Promise<boolean> => {
      // Dynamically build the update query
      const keys = [];
      const values = [];
      let paramIndex = 1;

      // Map camelCase to snake_case for db update fields
      const mapping: Record<string, string> = {
        brand: 'brand',
        model: 'model',
        year: 'year',
        vin: 'vin',
        supplier: 'supplier',
        purchaseDate: 'purchase_date',
        purchasePrice: 'purchase_price',
        status: 'status',
        publicationPrice: 'publication_price',
        salePrice: 'sale_price',
      };

      for (const [key, val] of Object.entries(updates)) {
        if (mapping[key] !== undefined && val !== undefined) {
          keys.push(`${mapping[key]} = $${paramIndex}`);
          values.push(val);
          paramIndex++;
        }
      }

      if (keys.length === 0) return false;

      // Add userId and id to params
      values.push(userId, id);
      const query = `
        UPDATE vehicles
        SET ${keys.join(', ')}
        WHERE user_id = $${paramIndex} AND id = $${paramIndex + 1}
      `;

      const result = await pool.query(query, values);
      return (result.rowCount ?? 0) > 0;
    },

    /**
     * Deletes a vehicle record.
     */
    delete: async (userId: number, id: number): Promise<boolean> => {
      // Delete associated expenses first to satisfy foreign key or logical constraints
      await pool.query(
        'DELETE FROM expenses WHERE user_id = $1 AND vehicle_id = $2',
        [userId, id.toString()]
      );

      // Delete associated sales first
      await pool.query(
        'DELETE FROM sales WHERE user_id = $1 AND vehicle_id = $2',
        [userId, id.toString()]
      );

      const query = `
        DELETE FROM vehicles
        WHERE user_id = $1 AND id = $2
      `;
      const result = await pool.query(query, [userId, id]);
      return (result.rowCount ?? 0) > 0;
    }
  },

  sales: {
    /**
     * Lists all sales for a specific user.
     */
    listByUserId: async (userId: number): Promise<Sale[]> => {
      const query = `
        SELECT 
          id,
          user_id as "userId",
          date,
          vehicle_id as "vehicleId",
          customer_id as "customerId",
          sale_price as "salePrice",
          down_payment as "downPayment",
          pending_balance as "pendingBalance",
          payment_method as "paymentMethod",
          commission,
          net_profit as "netProfit"
        FROM sales
        WHERE user_id = $1
        ORDER BY id DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows.map(row => ({
        ...row,
        id: row.id.toString()
      }));
    },

    /**
     * Creates a new sale record.
     */
    create: async (userId: number, sale: Omit<Sale, 'id'>): Promise<Sale> => {
      const query = `
        INSERT INTO sales (
          user_id, date, vehicle_id, customer_id, sale_price, 
          down_payment, pending_balance, payment_method, commission, net_profit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING 
          id,
          user_id as "userId",
          date,
          vehicle_id as "vehicleId",
          customer_id as "customerId",
          sale_price as "salePrice",
          down_payment as "downPayment",
          pending_balance as "pendingBalance",
          payment_method as "paymentMethod",
          commission,
          net_profit as "netProfit"
      `;
      const values = [
        userId,
        sale.date,
        sale.vehicleId,
        sale.customerId,
        sale.salePrice,
        sale.downPayment,
        sale.pendingBalance,
        sale.paymentMethod,
        sale.commission,
        sale.netProfit
      ];
      const result = await pool.query(query, values);
      const newRow = result.rows[0];
      return {
        ...newRow,
        id: newRow.id.toString()
      };
    }
  }
};
