import { db } from './index.ts';
import {
  customers,
  vendors,
  products,
  salesInvoices,
  purchaseInvoices,
  journalEntries,
  accounts,
  appSyncStore,
} from './schema.ts';
import { eq, desc } from 'drizzle-orm';

// Sync store helpers
export async function getSyncPayload(key: string) {
  try {
    const rows = await db
      .select()
      .from(appSyncStore)
      .where(eq(appSyncStore.key, key))
      .limit(1);
    return rows[0]?.payload || null;
  } catch (error) {
    console.error(`Error reading sync payload for ${key}:`, error);
    return null;
  }
}

export async function setSyncPayload(key: string, payload: any) {
  try {
    const result = await db
      .insert(appSyncStore)
      .values({
        key,
        payload,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appSyncStore.key,
        set: {
          payload,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Error saving sync payload for ${key}:`, error);
    throw new Error('Failed to persist sync payload', { cause: error });
  }
}

// Customers
export async function getDbCustomers() {
  try {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers', { cause: error });
  }
}

export async function upsertDbCustomer(customerData: typeof customers.$inferInsert) {
  try {
    const result = await db
      .insert(customers)
      .values(customerData)
      .onConflictDoUpdate({
        target: customers.id,
        set: customerData,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error upserting customer:', error);
    throw new Error('Failed to upsert customer', { cause: error });
  }
}

// Products
export async function getDbProducts() {
  try {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products', { cause: error });
  }
}

// Sales Invoices
export async function getDbSalesInvoices() {
  try {
    return await db.select().from(salesInvoices).orderBy(desc(salesInvoices.createdAt));
  } catch (error) {
    console.error('Error fetching sales invoices:', error);
    throw new Error('Failed to fetch sales invoices', { cause: error });
  }
}

// Health check
export async function testDbConnection() {
  try {
    const result = await db.select().from(accounts).limit(1);
    return { ok: true, count: result.length };
  } catch (error: any) {
    console.error('Database health check failed:', error);
    return { ok: false, error: error.message };
  }
}
