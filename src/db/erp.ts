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

      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        receipt_number TEXT NOT NULL,
        type TEXT NOT NULL,
        party_id TEXT,
        party_name TEXT NOT NULL,
        sales_rep_id TEXT,
        sales_rep_name TEXT,
        invoice_id TEXT,
        amount DOUBLE PRECISION DEFAULT 0 NOT NULL,
        payment_method TEXT DEFAULT 'cash' NOT NULL,
        date TEXT NOT NULL,
        reference_number TEXT,
        account_id TEXT NOT NULL,
        account_name TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS collection_plans (
        id TEXT PRIMARY KEY,
        plan_number TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        total_debt DOUBLE PRECISION DEFAULT 0 NOT NULL,
        total_amount DOUBLE PRECISION DEFAULT 0,
        collected_amount DOUBLE PRECISION DEFAULT 0,
        agreement_date TEXT,
        start_date TEXT,
        sales_invoice_id TEXT,
        invoice_number TEXT,
        installments JSONB DEFAULT '[]'::jsonb NOT NULL,
        status TEXT DEFAULT 'active' NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS collection_reminders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT,
        plan_id TEXT,
        channel TEXT DEFAULT 'whatsapp' NOT NULL,
        scheduled_date TEXT,
        date TEXT,
        due_amount DOUBLE PRECISION DEFAULT 0,
        status TEXT DEFAULT 'scheduled' NOT NULL,
        promised_date TEXT,
        collector_name TEXT,
        notes TEXT,
        message_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        employee_code TEXT NOT NULL,
        name TEXT NOT NULL,
        national_id TEXT,
        phone TEXT,
        email TEXT,
        department TEXT,
        job_title TEXT,
        basic_salary DOUBLE PRECISION DEFAULT 0,
        status TEXT DEFAULT 'active' NOT NULL,
        hire_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cheques (
        id TEXT PRIMARY KEY,
        cheque_number TEXT NOT NULL,
        type TEXT NOT NULL,
        bank_name TEXT NOT NULL,
        amount DOUBLE PRECISION DEFAULT 0 NOT NULL,
        due_date TEXT NOT NULL,
        issue_date TEXT,
        party_id TEXT,
        party_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        account_id TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS price_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        currency TEXT DEFAULT 'EGP',
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        items JSONB DEFAULT '[]'::jsonb NOT NULL,
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
    console.log('✓ All 18 core PostgreSQL tables verified & ready.');
    return { ok: true };
  } catch (error: any) {
    console.error('Warning during ensureCoreTablesExist:', error.message);
    return { ok: false, error: error.message };
  }
}

// Synchronize frontend snapshot entities directly into relational tables
export async function syncSnapshotToRelationalTables(state: any) {
  if (!state || typeof state !== 'object') return;
  const pool = createPool();

  try {
    // 1. Sync Customers
    if (Array.isArray(state.customers)) {
      for (const c of state.customers) {
        if (!c?.id) continue;
        await pool.query(
          `INSERT INTO customers (id, name, code, phone, email, tax_number, credit_limit, balance, address, category, payment_terms, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             code = EXCLUDED.code,
             phone = EXCLUDED.phone,
             email = EXCLUDED.email,
             tax_number = EXCLUDED.tax_number,
             credit_limit = EXCLUDED.credit_limit,
             balance = EXCLUDED.balance,
             address = EXCLUDED.address,
             category = EXCLUDED.category,
             payment_terms = EXCLUDED.payment_terms,
             status = EXCLUDED.status;`,
          [
            String(c.id),
            String(c.name || 'عميل'),
            c.code || null,
            c.phone || null,
            c.email || null,
            c.taxNumber || null,
            Number(c.creditLimit) || 0,
            Number(c.balance) || 0,
            c.address || null,
            c.category || null,
            c.paymentTerms || null,
            c.status || 'active',
          ]
        );
      }
      if (state.customers.length === 0) {
        await pool.query('DELETE FROM customers;');
      } else {
        const ids = state.customers.map((c: any) => c.id).filter(Boolean);
        if (ids.length > 0) {
          await pool.query('DELETE FROM customers WHERE id NOT IN (' + ids.map((_: any, idx: number) => `$${idx + 1}`).join(',') + ');', ids);
        }
      }
    }

    // 2. Sync Vendors
    if (Array.isArray(state.vendors)) {
      for (const v of state.vendors) {
        if (!v?.id) continue;
        await pool.query(
          `INSERT INTO vendors (id, name, code, phone, email, tax_number, balance, address, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             code = EXCLUDED.code,
             phone = EXCLUDED.phone,
             email = EXCLUDED.email,
             tax_number = EXCLUDED.tax_number,
             balance = EXCLUDED.balance,
             address = EXCLUDED.address,
             status = EXCLUDED.status;`,
          [
            String(v.id),
            String(v.name || 'مورد'),
            v.code || null,
            v.phone || null,
            v.email || null,
            v.taxNumber || null,
            Number(v.balance) || 0,
            v.address || null,
            v.status || 'active',
          ]
        );
      }
      if (state.vendors.length === 0) {
        await pool.query('DELETE FROM vendors;');
      } else {
        const ids = state.vendors.map((v: any) => v.id).filter(Boolean);
        if (ids.length > 0) {
          await pool.query('DELETE FROM vendors WHERE id NOT IN (' + ids.map((_: any, idx: number) => `$${idx + 1}`).join(',') + ');', ids);
        }
      }
    }

    // 3. Sync Products
    if (Array.isArray(state.products)) {
      for (const p of state.products) {
        if (!p?.id) continue;
        await pool.query(
          `INSERT INTO products (id, name, sku, barcode, category, unit, cost_price, selling_price, min_stock_alert, total_stock, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             sku = EXCLUDED.sku,
             barcode = EXCLUDED.barcode,
             category = EXCLUDED.category,
             unit = EXCLUDED.unit,
             cost_price = EXCLUDED.cost_price,
             selling_price = EXCLUDED.selling_price,
             min_stock_alert = EXCLUDED.min_stock_alert,
             total_stock = EXCLUDED.total_stock,
             is_active = EXCLUDED.is_active;`,
          [
            String(p.id),
            String(p.name || 'منتج'),
            p.sku || null,
            p.barcode || null,
            p.category || null,
            p.unit || 'قطعة',
            Number(p.costPrice) || 0,
            Number(p.sellingPrice) || 0,
            Number(p.minStockAlert) || 5,
            Number(p.totalStock) || 0,
            p.isActive !== false,
          ]
        );
      }
      if (state.products.length === 0) {
        await pool.query('DELETE FROM products;');
      } else {
        const ids = state.products.map((p: any) => p.id).filter(Boolean);
        if (ids.length > 0) {
          await pool.query('DELETE FROM products WHERE id NOT IN (' + ids.map((_: any, idx: number) => `$${idx + 1}`).join(',') + ');', ids);
        }
      }
    }

    // 4. Sync Sales Invoices
    if (Array.isArray(state.salesInvoices)) {
      for (const inv of state.salesInvoices) {
        if (!inv?.id) continue;
        await pool.query(
          `INSERT INTO sales_invoices (id, invoice_number, customer_id, customer_name, date, due_date, subtotal, tax_total, discount_total, total, paid_amount, balance_due, payment_method, status, items_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET
             invoice_number = EXCLUDED.invoice_number,
             customer_id = EXCLUDED.customer_id,
             customer_name = EXCLUDED.customer_name,
             date = EXCLUDED.date,
             due_date = EXCLUDED.due_date,
             subtotal = EXCLUDED.subtotal,
             tax_total = EXCLUDED.tax_total,
             discount_total = EXCLUDED.discount_total,
             total = EXCLUDED.total,
             paid_amount = EXCLUDED.paid_amount,
             balance_due = EXCLUDED.balance_due,
             payment_method = EXCLUDED.payment_method,
             status = EXCLUDED.status,
             items_json = EXCLUDED.items_json;`,
          [
            String(inv.id),
            String(inv.invoiceNumber || inv.id),
            inv.customerId || null,
            String(inv.customerName || 'عميل نقدي'),
            inv.date || new Date().toISOString().split('T')[0],
            inv.dueDate || null,
            Number(inv.subtotal) || 0,
            Number(inv.taxTotal || inv.tax) || 0,
            Number(inv.discountTotal || inv.discount) || 0,
            Number(inv.total) || 0,
            Number(inv.paidAmount) || 0,
            Number(inv.balanceDue || (Number(inv.total) || 0) - (Number(inv.paidAmount) || 0)),
            inv.paymentMethod || 'cash',
            inv.status || 'paid',
            JSON.stringify(inv.items || []),
          ]
        );
      }
      if (state.salesInvoices.length === 0) {
        await pool.query('DELETE FROM sales_invoices;');
      } else {
        const ids = state.salesInvoices.map((i: any) => i.id).filter(Boolean);
        if (ids.length > 0) {
          await pool.query('DELETE FROM sales_invoices WHERE id NOT IN (' + ids.map((_: any, idx: number) => `$${idx + 1}`).join(',') + ');', ids);
        }
      }
    }

    // 5. Sync Receipts (سندات القبض والصرف)
    if (Array.isArray(state.receipts)) {
      for (const r of state.receipts) {
        if (!r?.id) continue;
        await pool.query(
          `INSERT INTO receipts (id, receipt_number, type, party_id, party_name, sales_rep_id, sales_rep_name, invoice_id, amount, payment_method, date, reference_number, account_id, account_name, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET
             receipt_number = EXCLUDED.receipt_number,
             type = EXCLUDED.type,
             party_id = EXCLUDED.party_id,
             party_name = EXCLUDED.party_name,
             sales_rep_id = EXCLUDED.sales_rep_id,
             sales_rep_name = EXCLUDED.sales_rep_name,
             invoice_id = EXCLUDED.invoice_id,
             amount = EXCLUDED.amount,
             payment_method = EXCLUDED.payment_method,
             date = EXCLUDED.date,
             reference_number = EXCLUDED.reference_number,
             account_id = EXCLUDED.account_id,
             account_name = EXCLUDED.account_name,
             notes = EXCLUDED.notes;`,
          [
            String(r.id),
            String(r.receiptNumber || r.id),
            String(r.type || 'collection'),
            r.partyId || null,
            String(r.partyName || ''),
            r.salesRepId || null,
            r.salesRepName || null,
            r.invoiceId || null,
            Number(r.amount) || 0,
            String(r.paymentMethod || 'cash'),
            String(r.date || new Date().toISOString().split('T')[0]),
            r.referenceNumber || null,
            String(r.accountId || 'acc-cash'),
            r.accountName || null,
            r.notes || null,
          ]
        );
      }
      if (state.receipts.length === 0) {
        await pool.query('DELETE FROM receipts;');
      } else {
        const ids = state.receipts.map((r: any) => r.id).filter(Boolean);
        if (ids.length > 0) {
          await pool.query('DELETE FROM receipts WHERE id NOT IN (' + ids.map((_: any, idx: number) => `$${idx + 1}`).join(',') + ');', ids);
        }
      }
    }

    // 6. Sync Collection Plans (خطط وجدولة التحصيل)
    if (Array.isArray(state.collectionPlans)) {
      for (const cp of state.collectionPlans) {
        if (!cp?.id) continue;
        await pool.query(
          `INSERT INTO collection_plans (id, plan_number, customer_id, customer_name, total_debt, total_amount, collected_amount, agreement_date, start_date, sales_invoice_id, invoice_number, installments, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
             plan_number = EXCLUDED.plan_number,
             customer_id = EXCLUDED.customer_id,
             customer_name = EXCLUDED.customer_name,
             total_debt = EXCLUDED.total_debt,
             total_amount = EXCLUDED.total_amount,
             collected_amount = EXCLUDED.collected_amount,
             agreement_date = EXCLUDED.agreement_date,
             start_date = EXCLUDED.start_date,
             sales_invoice_id = EXCLUDED.sales_invoice_id,
             invoice_number = EXCLUDED.invoice_number,
             installments = EXCLUDED.installments,
             status = EXCLUDED.status,
             notes = EXCLUDED.notes;`,
          [
            String(cp.id),
            String(cp.planNumber || cp.id),
            String(cp.customerId || ''),
            String(cp.customerName || ''),
            Number(cp.totalDebt) || 0,
            Number(cp.totalAmount || cp.totalDebt) || 0,
            Number(cp.collectedAmount) || 0,
            cp.agreementDate || null,
            cp.startDate || null,
            cp.salesInvoiceId || null,
            cp.invoiceNumber || null,
            JSON.stringify(cp.installments || []),
            cp.status || 'active',
            cp.notes || null,
          ]
        );
      }
      if (state.collectionPlans.length === 0) {
        await pool.query('DELETE FROM collection_plans;');
      } else {
        const ids = state.collectionPlans.map((cp: any) => cp.id).filter(Boolean);
        if (ids.length > 0) {
          await pool.query('DELETE FROM collection_plans WHERE id NOT IN (' + ids.map((_: any, idx: number) => `$${idx + 1}`).join(',') + ');', ids);
        }
      }
    }

    // 7. Sync Collection Reminders (تذكيرات التحصيل)
    if (Array.isArray(state.collectionReminders)) {
      for (const cr of state.collectionReminders) {
        if (!cr?.id) continue;
        await pool.query(
          `INSERT INTO collection_reminders (id, customer_id, customer_name, phone, plan_id, channel, scheduled_date, date, due_amount, status, promised_date, collector_name, notes, message_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
             customer_id = EXCLUDED.customer_id,
             customer_name = EXCLUDED.customer_name,
             phone = EXCLUDED.phone,
             plan_id = EXCLUDED.plan_id,
             channel = EXCLUDED.channel,
             scheduled_date = EXCLUDED.scheduled_date,
             date = EXCLUDED.date,
             due_amount = EXCLUDED.due_amount,
             status = EXCLUDED.status,
             promised_date = EXCLUDED.promised_date,
             collector_name = EXCLUDED.collector_name,
             notes = EXCLUDED.notes,
             message_text = EXCLUDED.message_text;`,
          [
            String(cr.id),
            String(cr.customerId || ''),
            String(cr.customerName || ''),
            cr.phone || null,
            cr.planId || null,
            cr.channel || 'whatsapp',
            cr.scheduledDate || null,
            cr.date || null,
            Number(cr.dueAmount || cr.amountDue) || 0,
            cr.status || 'scheduled',
            cr.promisedDate || null,
            cr.collectorName || cr.agentName || null,
            cr.notes || null,
            cr.messageText || null,
          ]
        );
      }
      if (state.collectionReminders.length === 0) {
        await pool.query('DELETE FROM collection_reminders;');
      } else {
        const ids = state.collectionReminders.map((cr: any) => cr.id).filter(Boolean);
        if (ids.length > 0) {
          await pool.query('DELETE FROM collection_reminders WHERE id NOT IN (' + ids.map((_: any, idx: number) => `$${idx + 1}`).join(',') + ');', ids);
        }
      }
    }

    // 8. Sync Employees (الموظفين)
    if (Array.isArray(state.employees)) {
      for (const emp of state.employees) {
        if (!emp?.id) continue;
        await pool.query(
          `INSERT INTO employees (id, employee_code, name, national_id, phone, email, department, job_title, basic_salary, status, hire_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             employee_code = EXCLUDED.employee_code,
             name = EXCLUDED.name,
             national_id = EXCLUDED.national_id,
             phone = EXCLUDED.phone,
             email = EXCLUDED.email,
             department = EXCLUDED.department,
             job_title = EXCLUDED.job_title,
             basic_salary = EXCLUDED.basic_salary,
             status = EXCLUDED.status,
             hire_date = EXCLUDED.hire_date;`,
          [
            String(emp.id),
            String(emp.employeeCode || emp.code || emp.id),
            String(emp.name || ''),
            emp.nationalId || null,
            emp.phone || null,
            emp.email || null,
            emp.department || null,
            emp.jobTitle || null,
            Number(emp.basicSalary) || 0,
            emp.status || 'active',
            emp.hireDate || null,
          ]
        );
      }
      if (state.employees.length === 0) {
        await pool.query('DELETE FROM employees;');
      } else {
        const ids = state.employees.map((e: any) => e.id).filter(Boolean);
        if (ids.length > 0) {
          await pool.query('DELETE FROM employees WHERE id NOT IN (' + ids.map((_: any, idx: number) => `$${idx + 1}`).join(',') + ');', ids);
        }
      }
    }
  } catch (err: any) {
    console.warn('[Sync Relational Tables Warning]:', err?.message || err);
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
      'receipts',
      'collection_plans',
      'collection_reminders',
      'employees',
      'cheques',
      'price_lists',
      'employee_tasks',
      'chat_messages',
      'journal_entries',
      'accounts',
      'warehouses',
      'users',
      'app_sync_store',
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
    console.log('✓ All 18 database tables completely purged and reset for new client.');
    return { ok: true };
  } catch (error: any) {
    console.error('Error in purgeAllDbData:', error);
    return { ok: false, error: error.message };
  }
}

