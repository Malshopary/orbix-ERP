import { pgTable, serial, text, doublePrecision, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Users table (mandatory for Firebase Auth link)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('admin'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Customers table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  phone: text('phone'),
  email: text('email'),
  taxNumber: text('tax_number'),
  creditLimit: doublePrecision('credit_limit').default(0),
  balance: doublePrecision('balance').default(0),
  address: text('address'),
  category: text('category'),
  paymentTerms: text('payment_terms'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Vendors table
export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  phone: text('phone'),
  email: text('email'),
  taxNumber: text('tax_number'),
  balance: doublePrecision('balance').default(0),
  address: text('address'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products & Inventory table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku'),
  barcode: text('barcode'),
  category: text('category'),
  unit: text('unit').default('قطعة'),
  costPrice: doublePrecision('cost_price').default(0),
  sellingPrice: doublePrecision('selling_price').default(0),
  minStockAlert: doublePrecision('min_stock_alert').default(5),
  totalStock: doublePrecision('total_stock').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Warehouses table
export const warehouses = pgTable('warehouses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  location: text('location'),
  keeperName: text('keeper_name'),
  phone: text('phone'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Chart of Accounts table
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull(), // asset, liability, equity, revenue, expense
  parentCode: text('parent_code'),
  balance: doublePrecision('balance').default(0),
  isHeader: boolean('is_header').default(false),
  description: text('description'),
});

// Journal Entries table
export const journalEntries = pgTable('journal_entries', {
  id: text('id').primaryKey(),
  entryNumber: text('entry_number').notNull().unique(),
  date: text('date').notNull(),
  reference: text('reference'),
  description: text('description'),
  totalDebit: doublePrecision('total_debit').default(0),
  totalCredit: doublePrecision('total_credit').default(0),
  isPosted: boolean('is_posted').default(true),
  sourceModule: text('source_module').default('manual'),
  linesJson: jsonb('lines_json').notNull(), // Array of JournalLine items
  createdAt: timestamp('created_at').defaultNow(),
});

// Sales Invoices table
export const salesInvoices = pgTable('sales_invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  customerId: text('customer_id'),
  customerName: text('customer_name').notNull(),
  date: text('date').notNull(),
  dueDate: text('due_date'),
  subtotal: doublePrecision('subtotal').default(0),
  taxTotal: doublePrecision('tax_total').default(0),
  discountTotal: doublePrecision('discount_total').default(0),
  total: doublePrecision('total').default(0),
  paidAmount: doublePrecision('paid_amount').default(0),
  balanceDue: doublePrecision('balance_due').default(0),
  paymentMethod: text('payment_method').default('cash'),
  status: text('status').default('paid'),
  itemsJson: jsonb('items_json').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Purchases Invoices table
export const purchaseInvoices = pgTable('purchase_invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  vendorId: text('vendor_id'),
  vendorName: text('vendor_name').notNull(),
  date: text('date').notNull(),
  dueDate: text('due_date'),
  subtotal: doublePrecision('subtotal').default(0),
  taxTotal: doublePrecision('tax_total').default(0),
  discountTotal: doublePrecision('discount_total').default(0),
  total: doublePrecision('total').default(0),
  paidAmount: doublePrecision('paid_amount').default(0),
  balanceDue: doublePrecision('balance_due').default(0),
  paymentMethod: text('payment_method').default('cash'),
  status: text('status').default('paid'),
  itemsJson: jsonb('items_json').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Central ERP State Snapshot & Collections storage table
export const appSyncStore = pgTable('app_sync_store', {
  key: text('key').primaryKey(), // e.g. 'erp_full_state', 'company_profile', etc.
  payload: jsonb('payload').notNull(),
  version: doublePrecision('version').default(1),
  updatedAt: timestamp('updated_at').defaultNow(),
});
