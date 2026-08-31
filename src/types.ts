export type Currency = string;

export interface ExchangeCurrency {
  code: string; // e.g. 'EGP', 'SAR', 'AED', 'USD', 'EUR', 'KWD'
  name: string; // e.g. 'جنيه مصري', 'دولار أمريكي', 'ريال سعودي'
  symbol: string; // e.g. 'ج.م', '$', 'ر.س', '€'
  rateToBase: number; // How much 1 unit of this currency equals in Base Currency (e.g., 1 USD = 50 EGP, 1 EGP = 1 EGP)
  isBase?: boolean;
}

export type UserRole = 'admin' | 'accountant' | 'sales_cashier' | 'warehouse_keeper' | 'hr_manager' | 'auditor';

export interface AppUser {
  id: string;
  employeeId?: string; // Link to HR Employee
  name: string;
  username: string;
  password?: string;
  pin?: string;
  role: UserRole;
  permissions: string[]; // List of allowed tab IDs or actions
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface CompanyProfile {
  nameAr: string;
  nameEn: string;
  taxNumber: string;
  commercialRegister: string;
  address: string;
  city: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  logoBase64?: string;
  logoWidth: number; // in pixels (50 - 400)
  logoHeight: number;
  invoiceFooterNotes: string;
  defaultVatRate: number; // e.g., 14 for Egypt or 15 for Saudi
  defaultCurrency: Currency;
  themeColor?: string;
}

export interface GoogleSheetConfig {
  webhookUrl: string;
  sheetName: string;
  autoSyncInvoices: boolean;
  autoSyncPayroll: boolean;
  autoSyncReceipts: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: 'idle' | 'success' | 'error';
  lastErrorMessage?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  balance: number;
  description?: string;
  isHeader?: boolean;
}

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isPosted?: boolean;
  isAutomatic?: boolean;
  sourceModule?: 'sales' | 'purchases' | 'payroll' | 'collection' | 'pos' | 'manual' | 'commission';
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  warehouseId: string;
  barcode?: string;
  imageUrl?: string;
  imageBase64?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  unitPrice: number;
  date: string;
  reference: string;
  notes?: string;
}

export interface PriceListItem {
  productId: string;
  price?: number;
  customPrice?: number;
}

export interface PriceList {
  id: string;
  code?: string;
  name: string;
  description?: string;
  isDefault: boolean;
  adjustmentType?: 'discount' | 'markup'; // نوع التعديل: خصم أو إضافة/زيادة
  adjustmentValueType?: 'percentage' | 'fixed'; // نوع القيمة: نسبة مئوية % أو مبلغ وقيمة نقدية ثابتة
  adjustmentValue?: number; // القيمة المدخلة
  discountPercentage?: number;
  discountPercent?: number; // e.g. 10% off standard
  items: PriceListItem[]; // specific override prices
}

export interface SalesRep {
  id: string;
  employeeId?: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  commissionRate: number; // e.g. 3 for 3%
  salesTarget?: number;
  monthlySalesTarget?: number;
  totalSalesAchieved?: number;
  totalCommissionEarned?: number;
  paidCommissions?: number;
  loyaltyPoints?: number;
  status: 'active' | 'inactive';
  notes?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  taxNumber?: string;
  address: string;
  creditLimit: number;
  paymentTermsDays: number;
  currentBalance: number; // Positive = owes us money
  notes?: string;
  status: 'active' | 'blocked' | 'lead';
  priceListId?: string; // Specific price list assigned to this customer
  salesRepId?: string; // Assigned Sales Representative
  salesRepName?: string;
  loyaltyPoints?: number; // Customer Loyalty Points Balance
  accountId?: string; // Linked sub-account in Chart of Accounts
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  taxNumber?: string;
  address: string;
  currentBalance: number; // Positive = we owe them money
  paymentTermsDays: number;
  accountId?: string; // Linked sub-account in Chart of Accounts
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  refundMethod?: 'customer_balance' | 'cash_vault' | 'bank';
  reason?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  type: 'from_invoice' | 'direct_customer'; // مرتجع من فاتورة أو مرتجع مباشر من حساب العميل
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  salesRepId?: string;
  salesRepName?: string;
  date: string;
  reason?: string;
  vatRate?: number;
  items: ReturnItem[];
  subtotal: number;
  vatTotal: number;
  totalRefundAmount: number;
  refundMethod: 'customer_balance' | 'cash_vault' | 'bank'; // خصم من رصيد العميل، نقدي من الخزينة، تحويل بنكي
  accountId?: string; // في حال الصرف من خزينة أو بنك
  notes?: string;
  pointsDeducted?: number;
  createdAt: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerTaxNumber?: string;
  salesRepId?: string;
  salesRepName?: string;
  commissionRate?: number;
  commissionAmount?: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  vatRate: number; // e.g. 15%
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  notes?: string;
  qrData?: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  dueDate: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
  notes?: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'credit';

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  type: 'collection' | 'vendor_payment'; // سند قبض أو سند صرف
  partyId: string;
  partyName: string;
  salesRepId?: string;
  salesRepName?: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  referenceNumber?: string;
  notes?: string;
  accountId: string; // الخزينة أو البنك
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  jobTitle: string;
  department: string;
  hireDate: string;
  phone: string;
  email: string;
  nationalId: string;
  bankName: string;
  bankIban: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  socialInsuranceEmployeeRate: number; // e.g., 9%
  socialInsuranceCompanyRate: number; // e.g., 11%
  taxDeductionRate: number;
  status: 'active' | 'on_leave' | 'terminated';
  photoBase64?: string;
  photoUrl?: string;
  accountId?: string; // Linked sub-account in Chart of Accounts
  commissionRate?: number;
  monthlySalesTarget?: number;
  salesTarget?: number;
}

export interface CRMLead {
  id: string;
  title: string;
  customerName: string;
  customerId?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  estimatedValue: number;
  probability: number; // 0-100%
  stage: 'lead' | 'new' | 'contacted' | 'proposal' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';
  salesRepId?: string;
  salesRepName?: string;
  expectedClosingDate?: string;
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
}

export interface CRMInteraction {
  id: string;
  customerId: string;
  customerName: string;
  salesRepId?: string;
  salesRepName?: string;
  type: 'call' | 'visit' | 'email' | 'meeting' | 'whatsapp' | 'note' | 'task';
  title: string;
  summary?: string;
  notes?: string;
  date: string;
  nextFollowUpDate?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface CRMTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'technical' | 'billing' | 'complaint' | 'inquiry' | string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'manual_adjustment' | 'bonus' | 'adjustment' | 'expire';
  partyType: 'customer' | 'sales_rep';
  partyId: string;
  partyName: string;
  points: number;
  balanceAfter: number;
  reference?: string;
  notes?: string;
  date: string;
}

export interface CommissionPayment {
  id: string;
  paymentNumber: string;
  salesRepId: string;
  salesRepName: string;
  amount: number;
  date: string;
  period: string; // e.g. "أغسطس 2026"
  paymentMethod: PaymentMethod;
  accountId: string; // الخزينة أو البنك
  journalEntryId?: string;
  notes?: string;
  createdAt: string;
}

export interface CommissionTier {
  id: string;
  name: string;
  minSales: number;
  maxSales: number;
  ratePercentage: number;
  bonusAmount?: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  month: number;
  year: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  overtimeHours: number;
  overtimeAmount: number;
  bonus: number;
  deductions: number; // penalties, absences
  socialInsuranceDeduction: number;
  taxDeduction: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  date: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeesCount: number;
  status: 'draft' | 'approved' | 'posted_to_accounts';
  payslips: Payslip[];
}

export interface DebtAgingBucket {
  customerId: string;
  customerName: string;
  phone: string;
  currentTotal: number;
  days0to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
  oldestInvoiceDate: string;
  creditLimit: number;
  isOverLimit: boolean;
}

export interface SequenceConfig {
  prefix: string; // e.g. "INV-", "00", "PRD-"
  nextNumber: number; // e.g. 1, 101, 1001
  padLength: number; // e.g. 4 for 0001, 5 for 00101
  autoIncrement: boolean; // whether auto-fill is enabled
  suffix?: string;
}

export interface SystemSequenceSettings {
  invoices: SequenceConfig;
  purchaseInvoices: SequenceConfig;
  products: SequenceConfig;
  customers: SequenceConfig;
  vendors: SequenceConfig;
  employees: SequenceConfig;
  salesReps: SequenceConfig;
  journalEntries: SequenceConfig;
  accounts: SequenceConfig;
  salesReturns: SequenceConfig;
}

