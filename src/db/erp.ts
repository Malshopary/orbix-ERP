import { db, createPool } from './index.ts';
import {
  customers,
  vendors,
  products,
  salesInvoices,
  purchaseInvoices,
  journalEntries,
  accounts,
  appSyncStore,
  employeeTasks,
  chatMessages,
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

// Employee Tasks & Requests CRUD
export async function getDbTasks() {
  try {
    return await db.select().from(employeeTasks).orderBy(desc(employeeTasks.createdAt));
  } catch (error) {
    console.error('Error fetching tasks from DB:', error);
    return [];
  }
}

export async function upsertDbTask(rawTask: any) {
  try {
    const taskData = {
      id: rawTask.id,
      title: rawTask.title,
      description: rawTask.description || null,
      priority: rawTask.priority || 'medium',
      status: rawTask.status || 'pending',
      createdByUserId: rawTask.createdByUserId || rawTask.created_by_user_id || 'usr-admin',
      createdByUserName: rawTask.createdByUserName || rawTask.created_by_user_name || 'موظف',
      createdByUserAvatar: rawTask.createdByUserAvatar || rawTask.created_by_user_avatar || null,
      assignedToUserIds: Array.isArray(rawTask.assignedToUserIds)
        ? rawTask.assignedToUserIds
        : Array.isArray(rawTask.assigned_to_user_ids)
        ? rawTask.assigned_to_user_ids
        : [],
      assignedToUserNames: Array.isArray(rawTask.assignedToUserNames)
        ? rawTask.assignedToUserNames
        : Array.isArray(rawTask.assigned_to_user_names)
        ? rawTask.assigned_to_user_names
        : [],
      createdAt: rawTask.createdAt || rawTask.created_at || new Date().toISOString(),
      dueDate: rawTask.dueDate || rawTask.due_date || null,
      completedAt: rawTask.completedAt || rawTask.completed_at || null,
      approvedAt: rawTask.approvedAt || rawTask.approved_at || null,
      completionNote: rawTask.completionNote || rawTask.completion_note || null,
      rejectionReason: rawTask.rejectionReason || rawTask.rejection_reason || null,
      historyJson: Array.isArray(rawTask.historyJson)
        ? rawTask.historyJson
        : Array.isArray(rawTask.history_json)
        ? rawTask.history_json
        : Array.isArray(rawTask.history)
        ? rawTask.history
        : [],
      relatedEntityType: rawTask.relatedEntityType || rawTask.related_entity_type || null,
      relatedEntityId: rawTask.relatedEntityId || rawTask.related_entity_id || null,
      relatedEntityName: rawTask.relatedEntityName || rawTask.related_entity_name || null,
      updatedAt: new Date(),
    };

    const result = await db
      .insert(employeeTasks)
      .values(taskData)
      .onConflictDoUpdate({
        target: employeeTasks.id,
        set: taskData,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error upserting task in DB:', error);
    throw new Error('Failed to upsert task', { cause: error });
  }
}

export async function deleteDbTask(taskId: string) {
  try {
    await db.delete(employeeTasks).where(eq(employeeTasks.id, taskId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting task in DB:', error);
    throw new Error('Failed to delete task', { cause: error });
  }
}

// Chat Messages CRUD
export async function getDbChatMessages(limitCount = 500) {
  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limitCount);
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error fetching chat messages from DB:', error);
    return [];
  }
}

export async function insertDbChatMessage(rawMsg: any) {
  try {
    const msgData = {
      id: rawMsg.id,
      channelId: rawMsg.channelId || rawMsg.channel_id,
      senderId: rawMsg.senderId || rawMsg.sender_id,
      senderName: rawMsg.senderName || rawMsg.sender_name,
      senderAvatar: rawMsg.senderAvatar || rawMsg.sender_avatar || null,
      senderRole: rawMsg.senderRole || rawMsg.sender_role || null,
      text: rawMsg.text,
      timestamp: rawMsg.timestamp || new Date().toISOString(),
      isSystemNotification: Boolean(rawMsg.isSystemNotification ?? rawMsg.is_system_notification),
      taskId: rawMsg.taskId || rawMsg.task_id || null,
      createdAt: new Date(),
    };

    const result = await db
      .insert(chatMessages)
      .values(msgData)
      .onConflictDoUpdate({
        target: chatMessages.id,
        set: msgData,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error inserting chat message in DB:', error);
    throw new Error('Failed to insert chat message', { cause: error });
  }
}

// Ensure all official core tables exist in connected PostgreSQL DB
export async function ensureCoreTablesExist() {
  try {
    const pool = createPool();
    const ddl = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        phone TEXT,
        email TEXT,
        tax_number TEXT,
        credit_limit DOUBLE PRECISION DEFAULT 0,
        balance DOUBLE PRECISION DEFAULT 0,
        address TEXT,
        category TEXT,
        payment_terms TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        phone TEXT,
        email TEXT,
        tax_number TEXT,
        balance DOUBLE PRECISION DEFAULT 0,
        address TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT,
        barcode TEXT,
        category TEXT,
        unit TEXT DEFAULT 'قطعة',
        cost_price DOUBLE PRECISION DEFAULT 0,
        selling_price DOUBLE PRECISION DEFAULT 0,
        min_stock_alert DOUBLE PRECISION DEFAULT 5,
        total_stock DOUBLE PRECISION DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS warehouses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        location TEXT,
        keeper_name TEXT,
        phone TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        parent_code TEXT,
        balance DOUBLE PRECISION DEFAULT 0,
        is_header BOOLEAN DEFAULT FALSE,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        entry_number TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        reference TEXT,
        description TEXT,
        total_debit DOUBLE PRECISION DEFAULT 0,
        total_credit DOUBLE PRECISION DEFAULT 0,
        is_posted BOOLEAN DEFAULT TRUE,
        source_module TEXT DEFAULT 'manual',
        lines_json JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales_invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        customer_id TEXT,
        customer_name TEXT NOT NULL,
        date TEXT NOT NULL,
        due_date TEXT,
        subtotal DOUBLE PRECISION DEFAULT 0,
        tax_total DOUBLE PRECISION DEFAULT 0,
        discount_total DOUBLE PRECISION DEFAULT 0,
        total DOUBLE PRECISION DEFAULT 0,
        paid_amount DOUBLE PRECISION DEFAULT 0,
        balance_due DOUBLE PRECISION DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        status TEXT DEFAULT 'paid',
        items_json JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        vendor_id TEXT,
        vendor_name TEXT NOT NULL,
        date TEXT NOT NULL,
        due_date TEXT,
        subtotal DOUBLE PRECISION DEFAULT 0,
        tax_total DOUBLE PRECISION DEFAULT 0,
        discount_total DOUBLE PRECISION DEFAULT 0,
        total DOUBLE PRECISION DEFAULT 0,
        paid_amount DOUBLE PRECISION DEFAULT 0,
        balance_due DOUBLE PRECISION DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        status TEXT DEFAULT 'paid',
        items_json JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employee_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium' NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_by_user_id TEXT NOT NULL,
        created_by_user_name TEXT NOT NULL,
        created_by_user_avatar TEXT,
        assigned_to_user_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
        assigned_to_user_names JSONB DEFAULT '[]'::jsonb NOT NULL,
        created_at TEXT NOT NULL,
        due_date TEXT,
        completed_at TEXT,
        approved_at TEXT,
        completion_note TEXT,
        rejection_reason TEXT,
        history_json JSONB DEFAULT '[]'::jsonb NOT NULL,
        related_entity_type TEXT,
        related_entity_id TEXT,
        related_entity_name TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE employee_tasks ALTER COLUMN history_json SET DEFAULT '[]'::jsonb;
      ALTER TABLE employee_tasks ALTER COLUMN assigned_to_user_ids SET DEFAULT '[]'::jsonb;
      ALTER TABLE employee_tasks ALTER COLUMN assigned_to_user_names SET DEFAULT '[]'::jsonb;

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_avatar TEXT,
        sender_role TEXT,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        is_system_notification BOOLEAN DEFAULT FALSE,
        task_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS app_sync_store (
        key TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        version DOUBLE PRECISION DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(ddl);
    console.log('✓ All 12 core PostgreSQL tables verified & ready.');
    return { ok: true };
  } catch (error: any) {
    console.error('Warning during ensureCoreTablesExist:', error.message);
    return { ok: false, error: error.message };
  }
}

// Health check
export async function testDbConnection() {
  try {
    const result = await db.select().from(appSyncStore).limit(1);
    return { ok: true, count: result.length };
  } catch (error: any) {
    console.error('Database health check failed:', error);
    return { ok: false, error: error.message };
  }
}

// Complete Purge / Factory Reset of Database
export async function purgeAllDbData() {
  try {
    const pool = createPool();
    const tables = [
      'sales_invoices',
      'purchase_invoices',
      'customers',
      'vendors',
      'products',
      'employee_tasks',
      'chat_messages',
      'app_sync_store',
      'users',
    ];
    for (const table of tables) {
      try {
        await pool.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
      } catch {
        try {
          await pool.query(`DELETE FROM "${table}";`);
        } catch {}
      }
    }
    console.log('✓ All database tables completely purged and reset for new client.');
    return { ok: true };
  } catch (error: any) {
    console.error('Error in purgeAllDbData:', error);
    return { ok: false, error: error.message };
  }
}

