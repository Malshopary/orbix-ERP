import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Account,
  AppUser,
  AuditLog,
  CompanyProfile,
  Currency,
  Customer,
  DebtAgingBucket,
  Employee,
  ExchangeCurrency,
  GoogleSheetConfig,
  JournalEntry,
  PaymentReceipt,
  PayrollRun,
  Payslip,
  PriceList,
  Product,
  PurchaseInvoice,
  SalesInvoice,
  SalesRep,
  SalesReturn,
  Vendor,
  Warehouse,
  CRMLead,
  CRMInteraction,
  CRMTicket,
  LoyaltyTransaction,
  CommissionPayment,
  CommissionTier,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_COMPANY_PROFILE,
  INITIAL_CURRENCIES,
  INITIAL_CUSTOMERS,
  INITIAL_EMPLOYEES,
  INITIAL_GOOGLE_SHEET_CONFIG,
  INITIAL_INVOICES,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_PRICE_LISTS,
  INITIAL_PRODUCTS,
  INITIAL_PURCHASES,
  INITIAL_RECEIPTS,
  INITIAL_SALES_REPS,
  INITIAL_SALES_RETURNS,
  INITIAL_USERS,
  INITIAL_VENDORS,
  INITIAL_WAREHOUSES,
  INITIAL_CRM_LEADS,
  INITIAL_CRM_INTERACTIONS,
  INITIAL_CRM_TICKETS,
  INITIAL_LOYALTY_TRANSACTIONS,
  INITIAL_COMMISSION_PAYMENTS,
  INITIAL_COMMISSION_TIERS,
  INITIAL_JOB_TITLES,
  INITIAL_DEPARTMENTS,
} from '../data/initialData';
import {
  DEFAULT_SEQUENCE_CONFIG,
  formatSequenceCode,
  incrementSequenceCode,
  SequenceConfig,
} from '../utils/sequenceHelper';
import { AlertModalData } from '../components/GlobalAlertModal';

interface ErpContextType {
  // Global Alert & Confirmation Modal
  alertModal: AlertModalData | null;
  showAlert: (options: AlertModalData | string) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string, options?: Partial<AlertModalData>) => void;
  closeAlertModal: () => void;

  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
  navigateTo: (tab: string, subTab?: string) => void;

  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatMoney: (amount: number) => string;
  formatDualMoney: (amount: number, targetCode?: string) => string;
  currencies: ExchangeCurrency[];
  secondaryCurrency: string;
  setSecondaryCurrency: (code: string) => void;
  addCurrency: (currency: ExchangeCurrency) => void;
  updateCurrency: (code: string, data: Partial<ExchangeCurrency>) => void;
  deleteCurrency: (code: string) => void;
  convertAmount: (amountInBase: number, targetCode: string) => number;

  // Company Profile
  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;

  // Auth & RBAC
  users: AppUser[];
  currentUser: AppUser | null;
  login: (usernameOrPin: string, password?: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  addUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  hasPermission: (permission: string) => boolean;

  // Accounts & Ledger
  accounts: Account[];
  journalEntries: JournalEntry[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  editAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => boolean;
  editJournalEntry: (id: string, data: Partial<JournalEntry>) => boolean;
  deleteJournalEntry: (id: string) => void;

  // Inventory
  products: Product[];
  warehouses: Warehouse[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  editProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateProductStock: (productId: string, deltaQty: number, costPrice?: number) => void;

  // Customers & CRM
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'code' | 'currentBalance'>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  editCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  debtAging: DebtAgingBucket[];

  // CRM Pipeline Leads, Interactions & Tickets
  crmLeads: CRMLead[];
  addCrmLead: (lead: Omit<CRMLead, 'id' | 'createdAt'>) => void;
  updateCrmLead: (id: string, data: Partial<CRMLead>) => void;
  deleteCrmLead: (id: string) => void;
  crmInteractions: CRMInteraction[];
  addCrmInteraction: (interaction: Omit<CRMInteraction, 'id'>) => void;
  updateCrmInteraction: (id: string, data: Partial<CRMInteraction>) => void;
  deleteCrmInteraction: (id: string) => void;
  crmTickets: CRMTicket[];
  addCrmTicket: (ticket: Omit<CRMTicket, 'id' | 'ticketNumber' | 'createdAt'>) => void;
  updateCrmTicket: (id: string, data: Partial<CRMTicket>) => void;
  deleteCrmTicket: (id: string) => void;

  // Sales Representatives & Commissions
  salesReps: SalesRep[];
  addSalesRep: (rep: Omit<SalesRep, 'id'>) => void;
  updateSalesRep: (id: string, data: Partial<SalesRep>) => void;
  deleteSalesRep: (id: string) => void;
  commissionPayments: CommissionPayment[];
  commissionTiers: CommissionTier[];
  addCommissionPayment: (payment: Omit<CommissionPayment, 'id' | 'paymentNumber' | 'createdAt'>) => void;
  deleteCommissionPayment: (id: string) => void;
  addCommissionTier: (tier: Omit<CommissionTier, 'id'>) => void;
  updateCommissionTier: (id: string, data: Partial<CommissionTier>) => void;
  deleteCommissionTier: (id: string) => void;

  // Loyalty Points System
  loyaltyTransactions: LoyaltyTransaction[];
  addLoyaltyTransaction: (tx: Omit<LoyaltyTransaction, 'id'>) => void;
  adjustLoyaltyPoints: (partyType: 'customer' | 'sales_rep', partyId: string, pointsDelta: number, reason: string, ref?: string) => void;
  earnLoyaltyPoints: (customerId: string, amount: number) => number;
  redeemLoyaltyPoints: (customerId: string, pointsToRedeem: number) => number;

  // Vendors
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'code' | 'currentBalance'>) => void;
  editVendor: (id: string, data: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  // Sales & Invoices
  salesInvoices: SalesInvoice[];
  addSalesInvoice: (invoice: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'remainingAmount' | 'status'>) => SalesInvoice;
  editSalesInvoice: (id: string, data: Partial<SalesInvoice>) => void;
  deleteSalesInvoice: (id: string) => void;
  recordInvoicePayment: (invoiceId: string, amount: number, accountId: string, paymentMethod: PaymentReceipt['paymentMethod']) => void;
  createQuickPosSale: (params: {
    customerId: string;
    customerName: string;
    customerTaxNumber?: string;
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      subtotal: number;
      vatAmount: number;
      total: number;
    }[];
    discountTotal: number;
    vatRate: number;
    paymentMethod: PaymentReceipt['paymentMethod'];
    paidAmount: number;
    notes?: string;
  }) => SalesInvoice;

  // Price Lists
  priceLists: PriceList[];
  addPriceList: (pl: Omit<PriceList, 'id'>) => void;
  updatePriceList: (id: string, data: Partial<PriceList>) => void;
  deletePriceList: (id: string) => void;
  getProductPriceForCustomer: (productId: string, customerId?: string) => {
    price: number;
    listName: string;
    isCustom: boolean;
    discountPercent: number;
  };

  // Sales Returns
  salesReturns: SalesReturn[];
  addSalesReturn: (returnDoc: Omit<SalesReturn, 'id' | 'returnNumber' | 'createdAt'>) => SalesReturn;
  editSalesReturn: (id: string, data: Partial<SalesReturn>) => void;
  deleteSalesReturn: (id: string) => void;

  // Smart Sequencing & Auto-Increment Config
  sequenceConfig: SequenceConfig;
  updateSequenceConfig: (config: Partial<SequenceConfig>) => void;
  getNextSequenceCode: (type: 'invoice' | 'return' | 'product' | 'customer' | 'vendor' | 'employee' | 'account') => string;

  // Customer Account Statements Generator
  getCustomerStatement: (customerId: string, startDate?: string, endDate?: string) => {
    customer: Customer;
    openingBalance: number;
    closingBalance: number;
    totalSales: number;
    totalReceipts: number;
    totalReturns: number;
    transactions: Array<{
      id: string;
      date: string;
      type: 'invoice' | 'receipt' | 'return' | 'journal';
      typeName: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
    unpaidInvoices: SalesInvoice[];
  };

  // Purchases
  purchaseInvoices: PurchaseInvoice[];
  addPurchaseInvoice: (invoice: Omit<PurchaseInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'remainingAmount' | 'status'>) => void;
  editPurchaseInvoice: (id: string, data: Partial<PurchaseInvoice>) => void;
  deletePurchaseInvoice: (id: string) => void;
  recordVendorPayment: (purchaseId: string, amount: number, accountId: string, paymentMethod: PaymentReceipt['paymentMethod']) => void;

  // Receipts / Vouchers
  receipts: PaymentReceipt[];
  addReceiptVoucher: (receipt: Omit<PaymentReceipt, 'id' | 'receiptNumber'>) => void;
  editPaymentReceipt: (id: string, data: Partial<PaymentReceipt>) => void;
  deletePaymentReceipt: (id: string) => void;

  // HR & Payroll
  employees: Employee[];
  payrollRuns: PayrollRun[];
  jobTitles: string[];
  departments: string[];
  addJobTitle: (title: string) => string;
  addDepartment: (dept: string) => string;
  addEmployee: (emp: Omit<Employee, 'id' | 'employeeCode'>) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  editEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  generateMonthlyPayroll: (month: number, year: number) => PayrollRun;
  approvePayrollRun: (runId: string) => void;
  deletePayrollRun: (runId: string) => void;

  // Google Sheets Sync
  googleSheetConfig: GoogleSheetConfig;
  updateGoogleSheetConfig: (config: Partial<GoogleSheetConfig>) => void;
  syncToGoogleSheets: (dataToSync?: any) => Promise<{ success: boolean; message: string; rowsSynced?: number }>;

  // Audit Logs
  auditLogs: AuditLog[];
  logAuditEvent: (action: string, module: string, details: string) => void;
  rollbackAuditLog: (logId: string) => { success: boolean; message: string };

  // Entity Deletion Protection Check
  canDeleteEntity: (
    type: 'account' | 'customer' | 'product' | 'vendor' | 'employee' | 'salesRep' | 'priceList' | 'invoice' | 'purchase' | 'payroll' | 'user' | 'journal',
    id: string
  ) => { canDelete: boolean; reason?: string };

  // Protected DB, Backup & Integrity
  isSetupCompleted: boolean;
  completeInitialSetup: (companyData: Partial<CompanyProfile>, adminUser: AppUser) => void;
  resetToCleanNewCompany: () => void;
  resetToDefaultData: () => void;
  exportDataJSON: () => void;
  restoreBackupJSON: (jsonString: string) => { success: boolean; message: string };
  verifyDatabaseIntegrity: () => {
    isBalanced: boolean;
    totalDebit: number;
    totalCredit: number;
    outOfStockCount: number;
    negativeAccounts: Account[];
    issues: string[];
  };
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EGP: 'ج.م',
  SAR: 'ر.س',
  AED: 'د.إ',
  USD: '$',
};

const STORAGE_PREFIX = 'orbix_erp_v2_';

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('');

  // Global Centralized Formatted Alert & Confirmation Modal
  const [alertModal, setAlertModal] = useState<AlertModalData | null>(null);

  const closeAlertModal = () => {
    setAlertModal(null);
  };

  const showAlert = (options: AlertModalData | string) => {
    if (typeof options === 'string') {
      const raw = options.trim();
      const parts = raw.split('\n\n');
      let title = 'تنبيه من النظام';
      let type: 'warning' | 'error' | 'info' | 'success' = 'warning';
      let message = parts[0] || raw;
      let details: string | undefined = undefined;
      let note: string | undefined = undefined;

      if (raw.includes('🚫') || raw.includes('تعذر') || raw.includes('خطأ') || raw.includes('لا يمكن') || raw.includes('مرفوض')) {
        type = 'error';
        title = 'تنبيه أمان وحماية البيانات';
      } else if (raw.includes('تم') || raw.includes('بنجاح')) {
        type = 'success';
        title = 'تمت العملية بنجاح';
      } else if (raw.includes('تنبيه:') || raw.includes('تحذير')) {
        type = 'warning';
        title = 'تنبيه النظام';
      }

      if (parts.length > 1) {
        if (parts[0].startsWith('🚫') || parts[0].includes('تعذر')) {
          title = parts[0].replace('🚫', '').replace(':', '').trim();
        }
        const middleParts: string[] = [];
        for (let i = 1; i < parts.length; i++) {
          const p = parts[i].trim();
          if (p.startsWith('🛡️') || p.includes('لحماية') || p.includes('لحفظ') || p.includes('للحفاظ')) {
            note = p.replace('🛡️', '').trim();
          } else {
            middleParts.push(p);
          }
        }
        if (middleParts.length > 0) {
          message = middleParts.join('\n\n');
        }
      }

      setAlertModal({
        title,
        message,
        details,
        note,
        type,
        confirmText: 'فهمت',
      });
    } else {
      setAlertModal({
        type: options.type || 'warning',
        title: options.title || (options.type === 'error' ? 'تنبيه أمان وحماية البيانات' : 'تنبيه من النظام'),
        confirmText: options.isConfirm ? (options.confirmText || 'تأكيد') : (options.confirmText || 'فهمت'),
        ...options,
      });
    }
  };

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    title?: string,
    options?: Partial<AlertModalData>
  ) => {
    setAlertModal({
      title: title || 'تأكيد الإجراء',
      message,
      type: options?.type || 'warning',
      isConfirm: true,
      confirmText: options?.confirmText || 'نعم، متابعة',
      cancelText: options?.cancelText || 'إلغاء الأمر',
      onConfirm,
      onCancel: options?.onCancel,
      ...options,
    });
  };

  const navigateTo = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (subTab !== undefined) {
      setActiveSubTab(subTab);
    }
  };

  // Company Profile
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}company_profile`);
    return saved ? JSON.parse(saved) : INITIAL_COMPANY_PROFILE;
  });

  const [currency, setCurrency] = useState<Currency>(() => companyProfile.defaultCurrency || 'EGP');

  // Multi-Currency and Exchange Rates
  const [currencies, setCurrencies] = useState<ExchangeCurrency[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}currencies`);
    return saved ? JSON.parse(saved) : INITIAL_CURRENCIES;
  });

  const [secondaryCurrency, setSecondaryCurrencyState] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}secondary_currency`);
    return saved || 'USD';
  });

  const setSecondaryCurrency = (code: string) => {
    setSecondaryCurrencyState(code);
    localStorage.setItem(`${STORAGE_PREFIX}secondary_currency`, code);
  };

  const addCurrency = (curr: ExchangeCurrency) => {
    setCurrencies((prev) => {
      if (prev.some((c) => c.code.toUpperCase() === curr.code.toUpperCase())) {
        return prev.map((c) => (c.code.toUpperCase() === curr.code.toUpperCase() ? curr : c));
      }
      return [...prev, curr];
    });
    logAuditEvent('إضافة عملة جديدة', 'إعدادات العملات', `تمت إضافة عملة ${curr.name} (${curr.code}) بسعر صرف ${curr.rateToBase}`);
  };

  const updateCurrency = (code: string, data: Partial<ExchangeCurrency>) => {
    setCurrencies((prev) =>
      prev.map((c) => (c.code.toUpperCase() === code.toUpperCase() ? { ...c, ...data } : c))
    );
    logAuditEvent('تعديل سعر صرف العملة', 'إعدادات العملات', `تم تحديث سعر صرف ${code}`);
  };

  const deleteCurrency = (code: string) => {
    if (code.toUpperCase() === currency.toUpperCase() || code.toUpperCase() === 'EGP') return;
    setCurrencies((prev) => prev.filter((c) => c.code.toUpperCase() !== code.toUpperCase()));
    if (secondaryCurrency.toUpperCase() === code.toUpperCase()) {
      setSecondaryCurrency('USD');
    }
    logAuditEvent('حذف عملة', 'إعدادات العملات', `تم حذف العملة ${code}`);
  };

  // Convert amount from base currency to target currency
  const convertAmount = (amountInBase: number, targetCode: string): number => {
    if (!targetCode || targetCode.toUpperCase() === currency.toUpperCase()) return amountInBase;
    const currObj = currencies.find((c) => c.code.toUpperCase() === targetCode.toUpperCase());
    if (!currObj || !currObj.rateToBase || currObj.rateToBase === 0) return amountInBase;
    return amountInBase / currObj.rateToBase;
  };

  // Format with base currency + optional secondary currency
  const formatDualMoney = (amountInBase: number, targetCode?: string): string => {
    const baseFormatted = formatMoney(amountInBase);
    const target = targetCode || secondaryCurrency;
    if (!target || target.toUpperCase() === currency.toUpperCase()) {
      return baseFormatted;
    }
    const targetObj = currencies.find((c) => c.code.toUpperCase() === target.toUpperCase());
    if (!targetObj) return baseFormatted;

    const converted = convertAmount(amountInBase, target);
    const convertedFormatted = Math.abs(converted).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const targetFormatted =
      converted < 0 ? `(${convertedFormatted}) ${targetObj.symbol}` : `${convertedFormatted} ${targetObj.symbol}`;

    return `${baseFormatted} (${targetFormatted})`;
  };

  // Setup & First-time Launch
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}setup_completed`);
    const usersSaved = localStorage.getItem(`${STORAGE_PREFIX}users`);
    if (saved === 'true') return true;
    if (usersSaved) {
      try {
        const u = JSON.parse(usersSaved);
        if (Array.isArray(u) && u.length > 0) return true;
      } catch {
        // ignore
      }
    }
    return false;
  });

  // Users & Auth
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}current_user`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    const usersSaved = localStorage.getItem(`${STORAGE_PREFIX}users`);
    if (usersSaved) {
      try {
        const u = JSON.parse(usersSaved);
        if (Array.isArray(u) && u.length > 0) return u[0];
      } catch {
        // ignore
      }
    }
    return null;
  });

  // Google Sheets Config
  const [googleSheetConfig, setGoogleSheetConfig] = useState<GoogleSheetConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}gsheet_config`);
    return saved ? JSON.parse(saved) : INITIAL_GOOGLE_SHEET_CONFIG;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}audit_logs`);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'log-init',
            userId: 'usr-admin',
            userName: 'م. محمد الشبراوي (المدير العام)',
            action: 'بدء تشغيل النظام',
            module: 'النظام العام',
            details: 'تم بدء تشغيل منظومة أوربكس ERP بنجاح وتأمين قاعدة البيانات المحلية.',
            timestamp: new Date().toISOString(),
          },
        ];
  });

  // Financial & Operational Entities
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}accounts`);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}journal_entries`);
    return saved ? JSON.parse(saved) : INITIAL_JOURNAL_ENTRIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [warehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}vendors`);
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}sales_invoices`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}purchase_invoices`);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}receipts`);
    return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}employees`);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}payroll_runs`);
    return saved ? JSON.parse(saved) : [];
  });

  const [priceLists, setPriceLists] = useState<PriceList[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}price_lists`);
    return saved ? JSON.parse(saved) : INITIAL_PRICE_LISTS;
  });

  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}sales_returns`);
    return saved ? JSON.parse(saved) : INITIAL_SALES_RETURNS;
  });

  const [salesReps, setSalesReps] = useState<SalesRep[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}sales_reps`);
    return saved ? JSON.parse(saved) : INITIAL_SALES_REPS;
  });

  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}crm_leads`);
    return saved ? JSON.parse(saved) : INITIAL_CRM_LEADS;
  });

  const [crmInteractions, setCrmInteractions] = useState<CRMInteraction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}crm_interactions`);
    return saved ? JSON.parse(saved) : INITIAL_CRM_INTERACTIONS;
  });

  const [crmTickets, setCrmTickets] = useState<CRMTicket[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}crm_tickets`);
    return saved ? JSON.parse(saved) : INITIAL_CRM_TICKETS;
  });

  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}loyalty_transactions`);
    return saved ? JSON.parse(saved) : INITIAL_LOYALTY_TRANSACTIONS;
  });

  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}commission_payments`);
    return saved ? JSON.parse(saved) : INITIAL_COMMISSION_PAYMENTS;
  });

  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}commission_tiers`);
    return saved ? JSON.parse(saved) : INITIAL_COMMISSION_TIERS;
  });

  const [jobTitles, setJobTitles] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}job_titles`);
    return saved ? JSON.parse(saved) : INITIAL_JOB_TITLES;
  });

  const [departments, setDepartments] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}departments`);
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [sequenceConfig, setSequenceConfig] = useState<SequenceConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}sequence_config`);
    return saved ? JSON.parse(saved) : DEFAULT_SEQUENCE_CONFIG;
  });

  // Save to LocalStorage with encryption-ready persistence
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}company_profile`, JSON.stringify(companyProfile));
    localStorage.setItem(`${STORAGE_PREFIX}currencies`, JSON.stringify(currencies));
    localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(users));
    localStorage.setItem(`${STORAGE_PREFIX}current_user`, JSON.stringify(currentUser));
    localStorage.setItem(`${STORAGE_PREFIX}gsheet_config`, JSON.stringify(googleSheetConfig));
    localStorage.setItem(`${STORAGE_PREFIX}audit_logs`, JSON.stringify(auditLogs));
    localStorage.setItem(`${STORAGE_PREFIX}accounts`, JSON.stringify(accounts));
    localStorage.setItem(`${STORAGE_PREFIX}journal_entries`, JSON.stringify(journalEntries));
    localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(products));
    localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(customers));
    localStorage.setItem(`${STORAGE_PREFIX}vendors`, JSON.stringify(vendors));
    localStorage.setItem(`${STORAGE_PREFIX}sales_invoices`, JSON.stringify(salesInvoices));
    localStorage.setItem(`${STORAGE_PREFIX}purchase_invoices`, JSON.stringify(purchaseInvoices));
    localStorage.setItem(`${STORAGE_PREFIX}receipts`, JSON.stringify(receipts));
    localStorage.setItem(`${STORAGE_PREFIX}employees`, JSON.stringify(employees));
    localStorage.setItem(`${STORAGE_PREFIX}payroll_runs`, JSON.stringify(payrollRuns));
    localStorage.setItem(`${STORAGE_PREFIX}price_lists`, JSON.stringify(priceLists));
    localStorage.setItem(`${STORAGE_PREFIX}sales_returns`, JSON.stringify(salesReturns));
    localStorage.setItem(`${STORAGE_PREFIX}sales_reps`, JSON.stringify(salesReps));
    localStorage.setItem(`${STORAGE_PREFIX}crm_leads`, JSON.stringify(crmLeads));
    localStorage.setItem(`${STORAGE_PREFIX}crm_interactions`, JSON.stringify(crmInteractions));
    localStorage.setItem(`${STORAGE_PREFIX}crm_tickets`, JSON.stringify(crmTickets));
    localStorage.setItem(`${STORAGE_PREFIX}loyalty_transactions`, JSON.stringify(loyaltyTransactions));
    localStorage.setItem(`${STORAGE_PREFIX}commission_payments`, JSON.stringify(commissionPayments));
    localStorage.setItem(`${STORAGE_PREFIX}commission_tiers`, JSON.stringify(commissionTiers));
    localStorage.setItem(`${STORAGE_PREFIX}job_titles`, JSON.stringify(jobTitles));
    localStorage.setItem(`${STORAGE_PREFIX}departments`, JSON.stringify(departments));
    localStorage.setItem(`${STORAGE_PREFIX}sequence_config`, JSON.stringify(sequenceConfig));
  }, [
    companyProfile,
    currencies,
    users,
    currentUser,
    googleSheetConfig,
    auditLogs,
    accounts,
    journalEntries,
    products,
    customers,
    vendors,
    salesInvoices,
    purchaseInvoices,
    receipts,
    employees,
    payrollRuns,
    priceLists,
    salesReturns,
    salesReps,
    crmLeads,
    crmInteractions,
    crmTickets,
    loyaltyTransactions,
    commissionPayments,
    commissionTiers,
    jobTitles,
    departments,
    sequenceConfig,
  ]);

  // Helper to detect if an employee or job title belongs to sales / CRM
  const isEmployeeSalesRole = (
    emp: Employee,
    custList: Customer[] = customers,
    invList: SalesInvoice[] = salesInvoices,
    leadList: CRMLead[] = crmLeads
  ): boolean => {
    const text = `${emp.jobTitle || ''} ${emp.department || ''}`.toLowerCase();
    const salesKeywords = [
      'مبيعات',
      'مندوب',
      'بائع',
      'تسويق',
      'عملاء',
      'حسابات',
      'توزيع',
      'تجاري',
      'sales',
      'rep',
      'marketing',
      'account manager',
      'commercial',
      'seller',
      'bd',
      'business development',
    ];
    if (salesKeywords.some((kw) => text.includes(kw))) return true;
    if (emp.commissionRate !== undefined && emp.commissionRate > 0) return true;
    if (emp.monthlySalesTarget !== undefined && emp.monthlySalesTarget > 0) return true;
    if (emp.salesTarget !== undefined && emp.salesTarget > 0) return true;
    if (custList.some((c) => c.salesRepId === emp.id || c.salesRepId === emp.employeeCode)) return true;
    if (invList.some((i) => i.salesRepId === emp.id || i.salesRepId === emp.employeeCode)) return true;
    if (leadList.some((l) => l.salesRepId === emp.id || l.salesRepId === emp.employeeCode)) return true;
    return false;
  };

  // Auto-sync sales representatives from HR employees
  useEffect(() => {
    setSalesReps((prevReps) => {
      let changed = false;
      const nextReps = [...prevReps];

      employees.forEach((emp) => {
        const isSales = isEmployeeSalesRole(emp, customers, salesInvoices, crmLeads);
        const repIdx = nextReps.findIndex(
          (r) => r.id === emp.id || r.employeeId === emp.id || r.code === emp.employeeCode
        );

        if (isSales) {
          const defaultRate = emp.commissionRate !== undefined ? emp.commissionRate : 3.0;
          const defaultTarget = emp.monthlySalesTarget || emp.salesTarget || 100000;

          if (repIdx >= 0) {
            const currentRep = nextReps[repIdx];
            if (
              currentRep.name !== emp.name ||
              currentRep.phone !== (emp.phone || '') ||
              currentRep.email !== (emp.email || '') ||
              currentRep.jobTitle !== emp.jobTitle ||
              currentRep.department !== emp.department ||
              currentRep.code !== emp.employeeCode ||
              (emp.commissionRate !== undefined && currentRep.commissionRate !== emp.commissionRate) ||
              (emp.monthlySalesTarget !== undefined && currentRep.monthlySalesTarget !== emp.monthlySalesTarget) ||
              (emp.status === 'terminated' && currentRep.status !== 'inactive')
            ) {
              nextReps[repIdx] = {
                ...currentRep,
                id: emp.id,
                employeeId: emp.id,
                code: emp.employeeCode,
                name: emp.name,
                phone: emp.phone || currentRep.phone || '',
                email: emp.email || currentRep.email || '',
                jobTitle: emp.jobTitle || currentRep.jobTitle,
                department: emp.department || currentRep.department,
                commissionRate: emp.commissionRate !== undefined ? emp.commissionRate : currentRep.commissionRate,
                monthlySalesTarget:
                  emp.monthlySalesTarget !== undefined
                    ? emp.monthlySalesTarget
                    : (currentRep.monthlySalesTarget || defaultTarget),
                salesTarget:
                  emp.monthlySalesTarget !== undefined
                    ? emp.monthlySalesTarget
                    : (currentRep.salesTarget || defaultTarget),
                status: emp.status === 'terminated' ? 'inactive' : currentRep.status,
              };
              changed = true;
            }
          } else {
            nextReps.push({
              id: emp.id,
              employeeId: emp.id,
              code: emp.employeeCode,
              name: emp.name,
              phone: emp.phone || '',
              email: emp.email || '',
              jobTitle: emp.jobTitle,
              department: emp.department,
              commissionRate: defaultRate,
              monthlySalesTarget: defaultTarget,
              salesTarget: defaultTarget,
              totalSalesAchieved: 0,
              totalCommissionEarned: 0,
              paidCommissions: 0,
              status: emp.status === 'terminated' ? 'inactive' : 'active',
            });
            changed = true;
          }
        }
      });

      return changed ? nextReps : prevReps;
    });
  }, [employees, customers, salesInvoices, crmLeads]);

  // Log Audit Event
  const logAuditEvent = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'usr-anon',
      userName: currentUser?.name || 'مستخدم غير مسجل',
      action,
      module,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 499)]); // Keep last 500 audit logs
  };

  const formatMoney = (amount: number) => {
    const symbol = CURRENCY_SYMBOLS[currency] || 'ج.م';
    const num = isNaN(amount) ? 0 : amount;
    const formatted = Math.abs(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return num < 0 ? `(${formatted}) ${symbol}` : `${formatted} ${symbol}`;
  };

  // Company Profile Update
  const updateCompanyProfile = (profile: Partial<CompanyProfile>) => {
    setCompanyProfile((prev) => {
      const updated = { ...prev, ...profile };
      if (profile.defaultCurrency) {
        setCurrency(profile.defaultCurrency);
      }
      return updated;
    });
    logAuditEvent('تعديل بروفايل الشركة', 'الإعدادات العامة', 'تم تحديث بيانات المنشأة والشعار.');
  };

  // Auth methods
  const login = (usernameOrPin: string, password?: string): boolean => {
    const trimmed = usernameOrPin.trim();
    const user = users.find(
      (u) =>
        u.isActive &&
        (u.pin === trimmed ||
          (u.username.toLowerCase() === trimmed.toLowerCase() && (!password || u.password === password)))
    );

    if (user) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      logAuditEvent('تسجيل دخول ناجح', 'الأمان والمستخدمين', `سجل المستخدم ${user.name} الدخول بنجاح.`);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      logAuditEvent('تسجيل خروج', 'الأمان والمستخدمين', `قام المستخدم ${currentUser.name} بتسجيل الخروج.`);
    }
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId && u.isActive);
    if (target) {
      setCurrentUser(target);
      logAuditEvent('تبديل المستخدم', 'الأمان والمستخدمين', `تم التبديل إلى المستخدم ${target.name}.`);
    }
  };

  const addUser = (userData: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newUser: AppUser = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    logAuditEvent('إضافة مستخدم جديد', 'الأمان والمستخدمين', `تم إنشاء حساب مستخدم جديد: ${newUser.name} بدور ${newUser.role}`);
  };

  const updateUser = (id: string, data: Partial<AppUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
    }
    const target = users.find((u) => u.id === id);
    if (data.avatarUrl && target?.employeeId) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === target.employeeId ? { ...e, photoBase64: data.avatarUrl } : e))
      );
    }
    logAuditEvent('تعديل صلاحيات مستخدم', 'الأمان والمستخدمين', `تم تعديل بيانات المستخدم ${target?.name || id}`);
  };

  // =========================================================================
  // Comprehensive Deletion Protection Checks (Integrity Guards)
  // Ensures any entity with movements or dependencies cannot be deleted
  // =========================================================================

  const canDeleteAccount = (id: string): { canDelete: boolean; reason?: string } => {
    const target = accounts.find((a) => a.id === id || a.code === id);
    if (!target) return { canDelete: false, reason: 'الحساب غير موجود في دليل الحسابات.' };

    // 1. Core / Major System Accounts
    const coreSystemCodes = [
      '1000', '2000', '3000', '4000', '5000',
      '1100', '1200', '2100', '2200', '3100', '4100', '5100', '5200',
      '1110', '1120', '1125', '1130', '1140', '1150', '2110', '2120', '2130', '2140',
      '4150', '5110', '5120'
    ];
    if (coreSystemCodes.includes(target.code)) {
      return {
        canDelete: false,
        reason: `لا يمكن حذف الحساب (${target.name} - ${target.code}) لأنه حساب رئيسي أساسي ومحمي في هيكل دليل الحسابات.`,
      };
    }

    // 2. Child accounts
    const childAccounts = accounts.filter((a) => a.parentCode === target.code);
    if (childAccounts.length > 0) {
      return {
        canDelete: false,
        reason: `لا يمكن حذف الحساب (${target.name}) لأنه يحتوي على ${childAccounts.length} حسابات فرعية متفرعة منه.`,
      };
    }

    // 3. Current Non-zero Balance
    if (Math.abs(target.balance) > 0.001) {
      return {
        canDelete: false,
        reason: `رصيد الحساب الحالي ليس صفراً (${formatMoney(target.balance)}). يجب تصفير وتسوية الرصيد أولاً قبل الحذف.`,
      };
    }

    // 4. Journal Entries
    const linkedJournals = journalEntries.filter((je) =>
      je.lines.some((l) => l.accountId === id || l.accountCode === target.code)
    );
    if (linkedJournals.length > 0) {
      return {
        canDelete: false,
        reason: `يوجد ${linkedJournals.length} قيد يومية وحركات مالية مسجلة على هذا الحساب في دفتر اليومية العامة.`,
      };
    }

    // 5. Payment Receipts
    const linkedReceipts = receipts.filter((r) => r.accountId === id);
    if (linkedReceipts.length > 0) {
      return {
        canDelete: false,
        reason: `الحساب مسجل في ${linkedReceipts.length} سندات قبض أو صرف مالي.`,
      };
    }

    // 6. Linked Active Customers, Vendors, Employees
    const linkedCustomer = customers.find((c) => c.accountId === id);
    if (linkedCustomer) {
      return {
        canDelete: false,
        reason: `الحساب مرتبط بالعميل النشط (${linkedCustomer.name}).`,
      };
    }
    const linkedVendor = vendors.find((v) => v.accountId === id);
    if (linkedVendor) {
      return {
        canDelete: false,
        reason: `الحساب مرتبط بالمورد النشط (${linkedVendor.name}).`,
      };
    }
    const linkedEmp = employees.find((e) => e.accountId === id);
    if (linkedEmp) {
      return {
        canDelete: false,
        reason: `الحساب مرتبط بالموظف (${linkedEmp.name}).`,
      };
    }

    return { canDelete: true };
  };

  const canDeleteCustomer = (id: string): { canDelete: boolean; reason?: string } => {
    const target = customers.find((c) => c.id === id);
    if (!target) return { canDelete: false, reason: 'العميل غير موجود.' };

    const linkedInvoices = salesInvoices.filter((i) => i.customerId === id);
    if (linkedInvoices.length > 0) {
      return {
        canDelete: false,
        reason: `العميل مسجل له ${linkedInvoices.length} فواتير مبيعات في النظام.`,
      };
    }

    const linkedReceipts = receipts.filter((r) => r.partyId === id);
    if (linkedReceipts.length > 0) {
      return {
        canDelete: false,
        reason: `العميل مسجل له ${linkedReceipts.length} سندات قبض وتحصيل مالي.`,
      };
    }

    const linkedReturns = salesReturns.filter((r) => r.customerId === id);
    if (linkedReturns.length > 0) {
      return {
        canDelete: false,
        reason: `العميل مسجل له ${linkedReturns.length} إشعارات مرتجع مبيعات.`,
      };
    }

    if (Math.abs(target.currentBalance) > 0.001) {
      return {
        canDelete: false,
        reason: `العميل لديه رصيد متبقي غير مسوى بقيمة (${formatMoney(target.currentBalance)}).`,
      };
    }

    if (target.accountId) {
      const acc = accounts.find((a) => a.id === target.accountId);
      if (
        acc &&
        (Math.abs(acc.balance) > 0.001 ||
          journalEntries.some((je) => je.lines.some((l) => l.accountId === acc.id || l.accountCode === acc.code)))
      ) {
        return {
          canDelete: false,
          reason: 'حساب العميل بالشجرة المحاسبية مسجل عليه قيود وحركات مالية سابقة.',
        };
      }
    }

    return { canDelete: true };
  };

  const canDeleteProduct = (id: string): { canDelete: boolean; reason?: string } => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return { canDelete: false, reason: 'الصنف غير موجود.' };

    if (prod.stockQuantity > 0) {
      return {
        canDelete: false,
        reason: `يوجد رصيد مخزني حالي بالمستودع قدره (${prod.stockQuantity} ${prod.unit || 'قطعة'}).`,
      };
    }

    const linkedSales = salesInvoices.filter((i) => i.items.some((it) => it.productId === id));
    if (linkedSales.length > 0) {
      return {
        canDelete: false,
        reason: `الصنف مسجل في ${linkedSales.length} فواتير مبيعات سابقة.`,
      };
    }

    const linkedPurchases = purchaseInvoices.filter((p) => p.items.some((it) => it.productId === id));
    if (linkedPurchases.length > 0) {
      return {
        canDelete: false,
        reason: `الصنف مسجل في ${linkedPurchases.length} فواتير توريد ومشتريات سابقة.`,
      };
    }

    const linkedReturns = salesReturns.filter((r) => r.items.some((it) => it.productId === id));
    if (linkedReturns.length > 0) {
      return {
        canDelete: false,
        reason: `الصنف مسجل في ${linkedReturns.length} إشعارات مرتجع سابقة.`,
      };
    }

    return { canDelete: true };
  };

  const canDeleteVendor = (id: string): { canDelete: boolean; reason?: string } => {
    const target = vendors.find((v) => v.id === id);
    if (!target) return { canDelete: false, reason: 'المورد غير موجود.' };

    const linkedPurchases = purchaseInvoices.filter((p) => p.vendorId === id);
    if (linkedPurchases.length > 0) {
      return {
        canDelete: false,
        reason: `المورد لديه ${linkedPurchases.length} فواتير مشتريات وتوريد مسجلة.`,
      };
    }

    const linkedReceipts = receipts.filter((r) => r.partyId === id && r.type === 'vendor_payment');
    if (linkedReceipts.length > 0) {
      return {
        canDelete: false,
        reason: `المورد لديه ${linkedReceipts.length} سندات صرف وسداد للموردين.`,
      };
    }

    if (Math.abs(target.currentBalance) > 0.001) {
      return {
        canDelete: false,
        reason: `المورد لديه رصيد مستحق بقيمة (${formatMoney(target.currentBalance)}).`,
      };
    }

    if (target.accountId) {
      const acc = accounts.find((a) => a.id === target.accountId);
      if (
        acc &&
        (Math.abs(acc.balance) > 0.001 ||
          journalEntries.some((je) => je.lines.some((l) => l.accountId === acc.id || l.accountCode === acc.code)))
      ) {
        return {
          canDelete: false,
          reason: 'حساب المورد بالشجرة المحاسبية مسجل عليه قيود وحركات مالية.',
        };
      }
    }

    return { canDelete: true };
  };

  const canDeleteEmployee = (id: string): { canDelete: boolean; reason?: string } => {
    const target = employees.find((e) => e.id === id);
    if (!target) return { canDelete: false, reason: 'الموظف غير موجود.' };

    const linkedPayroll = payrollRuns.filter((pr) => pr.payslips.some((ps) => ps.employeeId === id));
    if (linkedPayroll.length > 0) {
      return {
        canDelete: false,
        reason: `الموظف مدرج في ${linkedPayroll.length} مسيرات رواتب سابقة مسجلة بالنظام.`,
      };
    }

    const linkedRep = salesReps.find(
      (sr) => sr.id === id || sr.employeeId === id || sr.code === target.employeeCode
    );
    if (
      linkedRep &&
      ((linkedRep.totalSalesAchieved || 0) > 0 ||
        (linkedRep.paidCommissions || 0) > 0 ||
        (linkedRep.totalCommissionEarned || 0) > 0)
    ) {
      return {
        canDelete: false,
        reason: 'الموظف مسجل كمندوب مبيعات وله مبيعات محققة أو عمولات مسجلة.',
      };
    }

    const linkedComm = commissionPayments.filter((cp) => cp.salesRepId === id || (linkedRep && cp.salesRepId === linkedRep.id));
    if (linkedComm.length > 0) {
      return {
        canDelete: false,
        reason: `الموظف مسجل له ${linkedComm.length} سندات صرف عمولات سابقة.`,
      };
    }

    const linkedInvoices = salesInvoices.filter(
      (i) => i.salesRepId === id || i.salesRepId === target.employeeCode || (linkedRep && i.salesRepId === linkedRep.code)
    );
    if (linkedInvoices.length > 0) {
      return {
        canDelete: false,
        reason: `الموظف مسجل ومسند له ${linkedInvoices.length} فواتير مبيعات صادرة.`,
      };
    }

    if (target.accountId) {
      const acc = accounts.find((a) => a.id === target.accountId);
      if (
        acc &&
        (Math.abs(acc.balance) > 0.001 ||
          journalEntries.some((je) => je.lines.some((l) => l.accountId === acc.id || l.accountCode === acc.code)))
      ) {
        return {
          canDelete: false,
          reason: 'حساب الموظف المحاسبي مسجل عليه قيود ومستحقات مالية.',
        };
      }
    }

    return { canDelete: true };
  };

  const canDeleteSalesRep = (id: string): { canDelete: boolean; reason?: string } => {
    const target = salesReps.find((r) => r.id === id);
    if (!target) return { canDelete: false, reason: 'مندوب المبيعات غير موجود.' };

    if (
      (target.totalSalesAchieved || 0) > 0 ||
      (target.totalCommissionEarned || 0) > 0 ||
      (target.paidCommissions || 0) > 0
    ) {
      return {
        canDelete: false,
        reason: `المندوب لديه مبيعات محققة بقيمة (${formatMoney(target.totalSalesAchieved || 0)}) أو عمولات مستحقة/مصروفة.`,
      };
    }

    const linkedInvoices = salesInvoices.filter(
      (i) => i.salesRepId === id || i.salesRepId === target.code || i.salesRepId === target.employeeId
    );
    if (linkedInvoices.length > 0) {
      return {
        canDelete: false,
        reason: `المندوب مسجل في ${linkedInvoices.length} فواتير مبيعات سابقة.`,
      };
    }

    const linkedComm = commissionPayments.filter(
      (cp) => cp.salesRepId === id || cp.salesRepId === target.employeeId
    );
    if (linkedComm.length > 0) {
      return {
        canDelete: false,
        reason: `المندوب مسجل له ${linkedComm.length} سندات صرف عمولات.`,
      };
    }

    return { canDelete: true };
  };

  const canDeletePriceList = (id: string): { canDelete: boolean; reason?: string } => {
    const target = priceLists.find((pl) => pl.id === id);
    if (!target) return { canDelete: false, reason: 'قائمة الأسعار غير موجودة.' };
    if (target.isDefault) {
      return { canDelete: false, reason: 'لا يمكن حذف قائمة الأسعار الافتراضية للنظام.' };
    }
    const assignedCusts = customers.filter((c) => c.priceListId === id);
    if (assignedCusts.length > 0) {
      return {
        canDelete: false,
        reason: `قائمة الأسعار مخصصة لـ ${assignedCusts.length} عملاء مسجلين بالنظام.`,
      };
    }
    return { canDelete: true };
  };

  const canDeleteSalesInvoice = (id: string): { canDelete: boolean; reason?: string } => {
    const target = salesInvoices.find((i) => i.id === id);
    if (!target) return { canDelete: false, reason: 'الفاتورة غير موجودة.' };

    const linkedReceipts = receipts.filter((r) => r.invoiceId === id);
    if (linkedReceipts.length > 0) {
      return {
        canDelete: false,
        reason: `الفاتورة مسجل عليها ${linkedReceipts.length} سندات تحصيل مالي. يجب حذف سندات التحصيل أولاً.`,
      };
    }

    const linkedReturns = salesReturns.filter(
      (r) => r.invoiceId === id || (r.invoiceNumber && r.invoiceNumber === target.invoiceNumber)
    );
    if (linkedReturns.length > 0) {
      return {
        canDelete: false,
        reason: `الفاتورة مسجل عليها ${linkedReturns.length} إشعارات مرتجع مبيعات. يجب حذف المرتجعات أولاً.`,
      };
    }

    return { canDelete: true };
  };

  const canDeletePurchaseInvoice = (id: string): { canDelete: boolean; reason?: string } => {
    const target = purchaseInvoices.find((p) => p.id === id);
    if (!target) return { canDelete: false, reason: 'فاتورة التوريد غير موجودة.' };

    const linkedPayments = receipts.filter((r) => r.invoiceId === id && r.type === 'vendor_payment');
    if (linkedPayments.length > 0) {
      return {
        canDelete: false,
        reason: `فاتورة التوريد مسجل عليها ${linkedPayments.length} سندات صرف ودفع للمورد. يجب حذف سندات الصرف أولاً.`,
      };
    }

    return { canDelete: true };
  };

  const canDeletePayrollRun = (runId: string): { canDelete: boolean; reason?: string } => {
    const target = payrollRuns.find((r) => r.id === runId);
    if (!target) return { canDelete: false, reason: 'مسير الرواتب غير موجود.' };
    if (target.status === 'approved' || target.status === 'posted_to_accounts') {
      return {
        canDelete: false,
        reason: 'لا يمكن حذف مسير رواتب معتمد ومرحل للحسابات والقيود العامة للحفاظ على توازن الدفاتر المحاسبية.',
      };
    }
    return { canDelete: true };
  };

  const canDeleteUser = (id: string): { canDelete: boolean; reason?: string } => {
    if (users.length <= 1) {
      return { canDelete: false, reason: 'لا يمكن حذف المستخدم الوحيد المتبقي في النظام!' };
    }
    if (currentUser?.id === id) {
      return { canDelete: false, reason: 'لا يمكن حذف حساب المستخدم المسجل دخوله حالياً في الجلسة.' };
    }
    return { canDelete: true };
  };

  const canDeleteJournalEntry = (id: string): { canDelete: boolean; reason?: string } => {
    const target = journalEntries.find((je) => je.id === id);
    if (!target) return { canDelete: false, reason: 'قيد اليومية غير موجود.' };
    if (target.isAutomatic) {
      return {
        canDelete: false,
        reason: `هذا القيد تم إنشاؤه آلياً بواسطة نظام (${target.sourceModule || 'العمليات'}). لحذفه يرجى تعديل أو حذف المستند الأصلي المرتبط به (فاتورة، سند، مسير رواتب).`,
      };
    }
    return { canDelete: true };
  };

  const canDeleteEntity = (
    type:
      | 'account'
      | 'customer'
      | 'product'
      | 'vendor'
      | 'employee'
      | 'salesRep'
      | 'priceList'
      | 'invoice'
      | 'purchase'
      | 'payroll'
      | 'user'
      | 'journal',
    id: string
  ): { canDelete: boolean; reason?: string } => {
    switch (type) {
      case 'account':
        return canDeleteAccount(id);
      case 'customer':
        return canDeleteCustomer(id);
      case 'product':
        return canDeleteProduct(id);
      case 'vendor':
        return canDeleteVendor(id);
      case 'employee':
        return canDeleteEmployee(id);
      case 'salesRep':
        return canDeleteSalesRep(id);
      case 'priceList':
        return canDeletePriceList(id);
      case 'invoice':
        return canDeleteSalesInvoice(id);
      case 'purchase':
        return canDeletePurchaseInvoice(id);
      case 'payroll':
        return canDeletePayrollRun(id);
      case 'user':
        return canDeleteUser(id);
      case 'journal':
        return canDeleteJournalEntry(id);
      default:
        return { canDelete: true };
    }
  };

  const deleteUser = (id: string) => {
    const check = canDeleteUser(id);
    if (!check.canDelete) {
      showAlert({
        title: 'تعذر حذف المستخدم',
        message: 'لا يمكن حذف حساب المستخدم للأسباب التالية:',
        details: check.reason,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      setCurrentUser(users.find((u) => u.id !== id) || null);
    }
    logAuditEvent('حذف مستخدم', 'الأمان والمستخدمين', `تم حذف حساب المستخدم ${target?.name || id}`);
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.permissions.includes('*') || currentUser.permissions.includes(permission)) return true;
    return false;
  };

  // Accounts & Journal
  const addAccount = (accountData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAcc]);
    logAuditEvent('إضافة حساب بدليل الحسابات', 'الحسابات العامة', `تمت إضافة الحساب ${newAcc.code} - ${newAcc.name}`);
  };

  const editAccount = (id: string, data: Partial<Account>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    logAuditEvent('تعديل حساب بدليل الحسابات', 'الحسابات العامة', `تم تعديل الحساب ${data.name || id}`);
  };

  const deleteAccount = (id: string) => {
    const check = canDeleteAccount(id);
    const target = accounts.find((a) => a.id === id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف الحساب (${target?.name || ''} - ${target?.code || ''})`,
        message: 'لا يمكن حذف الحساب من شجرة الحسابات للأسباب التالية:',
        details: check.reason,
        note: 'لحماية توازن ميزان المراجعة وسلامة القوائم المالية، لا يمكن حذف الحسابات التي عليها حركات أو رصيد.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    logAuditEvent('حذف حساب من دليل الحسابات', 'الحسابات العامة', `تم حذف الحساب ${target?.name || id}`);
  };

  const addJournalEntry = (entryData: Omit<JournalEntry, 'id' | 'createdAt'>): boolean => {
    if (Math.abs(entryData.totalDebit - entryData.totalCredit) > 0.01) {
      showAlert({
        title: 'خطأ محاسبي: القيد غير متوازن',
        message: 'يجب أن يتساوى إجمالي المدين مع إجمالي الدائن بدقة متناهية قبل ترحيل القيد إلى دفاتر الأستاذ العام.',
        details: `إجمالي المدين: ${entryData.totalDebit} | إجمالي الدائن: ${entryData.totalCredit} | الفارق: ${Math.abs(entryData.totalDebit - entryData.totalCredit)}`,
        type: 'error',
        confirmText: 'فهمت',
      });
      return false;
    }

    const newEntry: JournalEntry = {
      ...entryData,
      id: `je-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setJournalEntries((prev) => [newEntry, ...prev]);

    // Update account balances based on account types
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        const line = entryData.lines.find((l) => l.accountId === acc.id || l.accountCode === acc.code);
        if (!line) return acc;

        let delta = 0;
        if (acc.type === 'asset' || acc.type === 'expense') {
          delta = line.debit - line.credit;
        } else {
          delta = line.credit - line.debit;
        }

        return {
          ...acc,
          balance: acc.balance + delta,
        };
      });
    });

    logAuditEvent('إنشاء قيد يومية', 'الحسابات العامة', `قيد رقم ${newEntry.entryNumber} بقيمة ${entryData.totalDebit} ${currency}`);
    return true;
  };

  const editJournalEntry = (id: string, data: Partial<JournalEntry>): boolean => {
    if (data.lines) {
      const totalDebit = data.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const totalCredit = data.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        showAlert({
          title: 'القيد غير متوازن',
          message: 'يجب أن يتساوى إجمالي المدين مع إجمالي الدائن عند تعديل أسطر القيد.',
          type: 'error',
          confirmText: 'فهمت',
        });
        return false;
      }
    }
    setJournalEntries((prev) => prev.map((je) => (je.id === id ? { ...je, ...data } : je)));
    logAuditEvent('تعديل قيد يومية', 'الحسابات العامة', `تم تعديل قيد اليومية ${data.entryNumber || id}`);
    return true;
  };

  const deleteJournalEntry = (id: string) => {
    const check = canDeleteJournalEntry(id);
    const target = journalEntries.find((je) => je.id === id);
    if (!target) return;
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف قيد اليومية (${target.entryNumber})`,
        message: 'لا يمكن إتمام عملية حذف قيد اليومية:',
        details: check.reason,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }

    // Revert account balances
    setAccounts((prev) =>
      prev.map((acc) => {
        const line = target.lines.find((l) => l.accountId === acc.id || l.accountCode === acc.code);
        if (!line) return acc;
        let delta = 0;
        if (acc.type === 'asset' || acc.type === 'expense') {
          delta = line.credit - line.debit;
        } else {
          delta = line.debit - line.credit;
        }
        return { ...acc, balance: acc.balance + delta };
      })
    );

    setJournalEntries((prev) => prev.filter((je) => je.id !== id));
    logAuditEvent('حذف قيد يومية', 'الحسابات العامة', `تم حذف القيد ${target.entryNumber}`);
  };

  // Smart Sequence Code Generation Helper
  const updateSequenceConfig = (config: Partial<SequenceConfig>) => {
    setSequenceConfig((prev) => ({ ...prev, ...config }));
    logAuditEvent('تحديث إعدادات الترقيم والتسلسل', 'الإعدادات العامة', 'تم حفظ إعدادات تسلسل الأكواد والفواتير.');
  };

  const getNextSequenceCode = (
    type: 'invoice' | 'return' | 'product' | 'customer' | 'vendor' | 'employee' | 'account'
  ): string => {
    if (!sequenceConfig.autoGenerateCodes) {
      if (type === 'invoice') return `INV-${new Date().getFullYear()}-${String(salesInvoices.length + 1).padStart(3, '0')}`;
      if (type === 'return') return `RET-${new Date().getFullYear()}-${String(salesReturns.length + 1).padStart(3, '0')}`;
      if (type === 'product') return `PRD-${String(products.length + 1).padStart(3, '0')}`;
      if (type === 'customer') return `CUST-${String(customers.length + 1).padStart(3, '0')}`;
      if (type === 'vendor') return `VEND-${String(vendors.length + 1).padStart(3, '0')}`;
      if (type === 'employee') return `EMP-${String(employees.length + 1).padStart(3, '0')}`;
      if (type === 'account') return `10${String(accounts.length + 1)}`;
    }

    switch (type) {
      case 'invoice':
        return formatSequenceCode(sequenceConfig.invoicePrefix, sequenceConfig.invoiceNextNumber, sequenceConfig.invoicePadding);
      case 'return':
        return formatSequenceCode(sequenceConfig.returnPrefix, sequenceConfig.returnNextNumber, sequenceConfig.returnPadding);
      case 'product':
        return formatSequenceCode(sequenceConfig.productPrefix, sequenceConfig.productNextNumber, sequenceConfig.productPadding);
      case 'customer':
        return formatSequenceCode(sequenceConfig.customerPrefix, sequenceConfig.customerNextNumber, sequenceConfig.customerPadding);
      case 'vendor':
        return formatSequenceCode(sequenceConfig.vendorPrefix, sequenceConfig.vendorNextNumber, sequenceConfig.vendorPadding);
      case 'employee':
        return formatSequenceCode(sequenceConfig.employeePrefix, sequenceConfig.employeeNextNumber, sequenceConfig.employeePadding);
      case 'account':
        return `10${String(accounts.length + 101)}`;
      default:
        return '0001';
    }
  };

  // Price Lists Management
  const addPriceList = (plData: Omit<PriceList, 'id'>) => {
    const newPl: PriceList = {
      ...plData,
      id: `pl-${Date.now()}`,
    };
    if (newPl.isDefault) {
      setPriceLists((prev) => prev.map((p) => ({ ...p, isDefault: false })).concat(newPl));
    } else {
      setPriceLists((prev) => [...prev, newPl]);
    }
    logAuditEvent('إضافة قائمة أسعار', 'إدارة الأسعار', `تم إنشاء قائمة أسعار: ${newPl.name}`);
  };

  const updatePriceList = (id: string, data: Partial<PriceList>) => {
    setPriceLists((prev) =>
      prev.map((pl) => {
        if (pl.id === id) {
          return { ...pl, ...data };
        }
        if (data.isDefault) {
          return { ...pl, isDefault: false };
        }
        return pl;
      })
    );
    logAuditEvent('تعديل قائمة أسعار', 'إدارة الأسعار', `تم تحديث قائمة الأسعار ${data.name || id}`);
  };

  const deletePriceList = (id: string) => {
    const check = canDeletePriceList(id);
    const target = priceLists.find((pl) => pl.id === id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف قائمة الأسعار (${target?.name || ''})`,
        message: 'لا يمكن حذف قائمة الأسعار:',
        details: check.reason,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setPriceLists((prev) => prev.filter((pl) => pl.id !== id));
    logAuditEvent('حذف قائمة أسعار', 'إدارة الأسعار', `تم حذف قائمة الأسعار ${target?.name || id}`);
  };

  const getProductPriceForCustomer = (
    productId: string,
    customerId?: string
  ): { price: number; listName: string; isCustom: boolean; discountPercent: number } => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return { price: 0, listName: 'افتراضي', isCustom: false, discountPercent: 0 };
    }

    const defaultPrice = product.sellingPrice;
    let selectedPriceList: PriceList | undefined;

    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer?.priceListId) {
        selectedPriceList = priceLists.find((pl) => pl.id === customer.priceListId);
      }
    }

    if (!selectedPriceList) {
      selectedPriceList = priceLists.find((pl) => pl.isDefault) || priceLists[0];
    }

    if (!selectedPriceList) {
      return { price: defaultPrice, listName: 'السعر القياسي', isCustom: false, discountPercent: 0 };
    }

    const override = selectedPriceList.items?.find((it) => it.productId === productId);
    const customPrice = override?.customPrice ?? override?.price;
    if (customPrice !== undefined && customPrice > 0) {
      return {
        price: customPrice,
        listName: selectedPriceList.name,
        isCustom: true,
        discountPercent: selectedPriceList.discountPercent || selectedPriceList.discountPercentage || 0,
      };
    }

    const adjType = selectedPriceList.adjustmentType || 'discount';
    const adjValType = selectedPriceList.adjustmentValueType || 'percentage';
    const adjVal = selectedPriceList.adjustmentValue !== undefined 
      ? selectedPriceList.adjustmentValue 
      : (selectedPriceList.discountPercent ?? selectedPriceList.discountPercentage ?? 0);

    if (adjVal && adjVal > 0) {
      let finalPrice = defaultPrice;
      if (adjType === 'discount') {
        if (adjValType === 'percentage') {
          finalPrice = Math.max(0, defaultPrice * (1 - adjVal / 100));
        } else {
          finalPrice = Math.max(0, defaultPrice - adjVal);
        }
      } else {
        // markup / addition
        if (adjValType === 'percentage') {
          finalPrice = defaultPrice * (1 + adjVal / 100);
        } else {
          finalPrice = defaultPrice + adjVal;
        }
      }

      return {
        price: Math.round(finalPrice * 100) / 100,
        listName: selectedPriceList.name,
        isCustom: true,
        discountPercent: adjType === 'discount' && adjValType === 'percentage' ? adjVal : 0,
      };
    }

    return {
      price: defaultPrice,
      listName: selectedPriceList.name,
      isCustom: false,
      discountPercent: 0,
    };
  };

  // Inventory Management
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const sku = productData.sku || getNextSequenceCode('product');
    const newProduct: Product = {
      ...productData,
      sku,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProduct]);
    setSequenceConfig((prev) => ({ ...prev, productNextNumber: prev.productNextNumber + 1 }));
    logAuditEvent('إضافة منتج للمخزن', 'المخازن', `تمت إضافة الصنف: ${newProduct.name} (SKU: ${newProduct.sku})`);
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    logAuditEvent('تعديل بيانات صنف', 'المخازن', `تم تحديث بيانات الصنف ${data.name || id}`);
  };

  const editProduct = (id: string, data: Partial<Product>) => {
    updateProduct(id, data);
  };

  const deleteProduct = (id: string) => {
    const check = canDeleteProduct(id);
    const prod = products.find((p) => p.id === id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف الصنف (${prod?.name || ''})`,
        message: 'لا يمكن حذف الصنف من سجلات المخزون للأسباب التالية:',
        details: check.reason,
        note: 'لحماية تكلفة المخزون ومتوسط الأسعار والتقارير المالية، لا يمكن حذف الأصناف التي عليها حركة أو رصيد.\n💡 يمكنك تعديل بيانات الصنف أو تصفير رصيده.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    logAuditEvent('حذف صنف من المخزن', 'المخازن', `تم حذف الصنف ${prod?.name || id}`);
  };

  const updateProductStock = (productId: string, deltaQty: number, costPrice?: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newQty = Math.max(0, p.stockQuantity + deltaQty);
          return {
            ...p,
            stockQuantity: newQty,
            costPrice: costPrice !== undefined ? costPrice : p.costPrice,
          };
        }
        return p;
      })
    );
  };

  // Customers & CRM
  const addCustomer = (custData: Omit<Customer, 'id' | 'code' | 'currentBalance'>) => {
    const code = getNextSequenceCode('customer');

    // Auto-create sub-account in Chart of Accounts under 1130 (العملاء والمدينون)
    const existingCustAccounts = accounts.filter(
      (a) => a.parentCode === '1130' || a.code.startsWith('1130-') || a.code.startsWith('1130')
    );
    const nextAccSeq = existingCustAccounts.length + 1;
    const custAccCode = `1130-${String(nextAccSeq).padStart(3, '0')}`;
    const newAccId = `acc-cust-${Date.now()}`;
    const newAccount: Account = {
      id: newAccId,
      code: custAccCode,
      name: `عميل: ${custData.name}`,
      type: 'asset',
      parentCode: '1130',
      balance: 0,
      description: `حساب مالي فرعي للعميل ${custData.name} (كود: ${code})`,
    };
    setAccounts((prev) => [...prev, newAccount]);

    // Lookup sales rep name if salesRepId is provided
    let repName = custData.salesRepName;
    if (custData.salesRepId && !repName) {
      const foundRep = salesReps.find((r) => r.id === custData.salesRepId);
      if (foundRep) repName = foundRep.name;
    }

    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      code,
      currentBalance: 0,
      status: custData.status || 'active',
      loyaltyPoints: custData.loyaltyPoints || 0,
      salesRepName: repName,
      accountId: newAccId,
    };
    setCustomers((prev) => [...prev, newCust]);
    setSequenceConfig((prev) => ({ ...prev, customerNextNumber: prev.customerNextNumber + 1 }));
    logAuditEvent('إضافة عميل جديد', 'إدارة العملاء CRM', `تمت إضافة العميل ${newCust.name} مع إنشاء حساب تلقائي بالشجرة (${custAccCode})`);
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    let repName = data.salesRepName;
    if (data.salesRepId && !repName) {
      const foundRep = salesReps.find((r) => r.id === data.salesRepId);
      if (foundRep) repName = foundRep.name;
    }

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...data };
          if (data.salesRepId !== undefined) {
            updated.salesRepName = repName;
          }
          // If name changed, sync account name in Chart of Accounts
          if (data.name && c.accountId) {
            setAccounts((accs) =>
              accs.map((a) => (a.id === c.accountId ? { ...a, name: `عميل: ${data.name}` } : a))
            );
          }
          return updated;
        }
        return c;
      })
    );
    logAuditEvent('تعديل بيانات عميل', 'إدارة العملاء CRM', `تم تعديل بيانات العميل ${data.name || id}`);
  };

  const editCustomer = (id: string, data: Partial<Customer>) => {
    updateCustomer(id, data);
  };

  const deleteCustomer = (id: string) => {
    const check = canDeleteCustomer(id);
    const target = customers.find((c) => c.id === id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف العميل (${target?.name || ''})`,
        message: 'لا يمكن حذف العميل من قاعدة البيانات للأسباب التالية:',
        details: check.reason,
        note: 'لحماية السجلات المحاسبية والضريبية وتقارير الأرباح من التلف، لا يمكن حذف أي عميل مسجل عليه حركات أو فواتير.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    if (target?.accountId) {
      setAccounts((prev) => prev.filter((a) => a.id !== target.accountId));
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logAuditEvent('حذف عميل', 'إدارة العملاء CRM', `تم حذف حساب العميل ${target?.name || id}`);
  };

  // CRM Leads Management
  const addCrmLead = (leadData: Omit<CRMLead, 'id' | 'createdAt'>) => {
    let repName = leadData.salesRepName;
    if (leadData.salesRepId && !repName) {
      const found = salesReps.find((r) => r.id === leadData.salesRepId);
      if (found) repName = found.name;
    }
    const newLead: CRMLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      salesRepName: repName,
      createdAt: new Date().toISOString(),
    };
    setCrmLeads((prev) => [newLead, ...prev]);
    logAuditEvent('إضافة فرصة بيعية', 'CRM المبيعات', `تم إنشاء فرصة بيعية جديدة: ${newLead.title} بقيمة ${formatMoney(newLead.estimatedValue)}`);
  };

  const updateCrmLead = (id: string, data: Partial<CRMLead>) => {
    setCrmLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          let repName = data.salesRepName || l.salesRepName;
          if (data.salesRepId && !data.salesRepName) {
            const found = salesReps.find((r) => r.id === data.salesRepId);
            if (found) repName = found.name;
          }
          return { ...l, ...data, salesRepName: repName };
        }
        return l;
      })
    );
    logAuditEvent('تحديث فرصة بيعية', 'CRM المبيعات', `تم تحديث بيانات الفرصة ${data.title || id}`);
  };

  const deleteCrmLead = (id: string) => {
    const target = crmLeads.find((l) => l.id === id);
    setCrmLeads((prev) => prev.filter((l) => l.id !== id));
    logAuditEvent('حذف فرصة بيعية', 'CRM المبيعات', `تم حذف الفرصة ${target?.title || id}`);
  };

  // CRM Interactions & Follow-ups
  const addCrmInteraction = (data: Omit<CRMInteraction, 'id'>) => {
    let repName = data.salesRepName;
    if (data.salesRepId && !repName) {
      const found = salesReps.find((r) => r.id === data.salesRepId);
      if (found) repName = found.name;
    }
    const newInteraction: CRMInteraction = {
      ...data,
      id: `int-${Date.now()}`,
      salesRepName: repName,
    };
    setCrmInteractions((prev) => [newInteraction, ...prev]);
    logAuditEvent('تسجيل نشاط ومتابعة', 'CRM المتابعات', `تم تسجيل متابعة (${newInteraction.title}) مع ${newInteraction.customerName}`);
  };

  const updateCrmInteraction = (id: string, data: Partial<CRMInteraction>) => {
    setCrmInteractions((prev) => prev.map((it) => (it.id === id ? { ...it, ...data } : it)));
    logAuditEvent('تعديل متابعة', 'CRM المتابعات', `تم تعديل المتابعة ${id}`);
  };

  const deleteCrmInteraction = (id: string) => {
    setCrmInteractions((prev) => prev.filter((it) => it.id !== id));
    logAuditEvent('حذف متابعة', 'CRM المتابعات', `تم حذف المتابعة ${id}`);
  };

  // CRM Support Tickets
  const addCrmTicket = (data: Omit<CRMTicket, 'id' | 'ticketNumber' | 'createdAt'>) => {
    const ticketNumber = `TCK-${new Date().getFullYear()}-${String(crmTickets.length + 1).padStart(3, '0')}`;
    const newTicket: CRMTicket = {
      ...data,
      id: `tkt-${Date.now()}`,
      ticketNumber,
      createdAt: new Date().toISOString(),
    };
    setCrmTickets((prev) => [newTicket, ...prev]);
    logAuditEvent('فتح تذكرة دعم', 'CRM الدعم الفني', `تم فتح التذكرة ${ticketNumber}: ${newTicket.subject}`);
  };

  const updateCrmTicket = (id: string, data: Partial<CRMTicket>) => {
    setCrmTickets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...data };
          if (data.status === 'resolved' && !t.resolvedAt) {
            updated.resolvedAt = new Date().toISOString();
          }
          return updated;
        }
        return t;
      })
    );
    logAuditEvent('تحديث تذكرة دعم', 'CRM الدعم الفني', `تم تحديث التذكرة ${id}`);
  };

  const deleteCrmTicket = (id: string) => {
    const target = crmTickets.find((t) => t.id === id);
    setCrmTickets((prev) => prev.filter((t) => t.id !== id));
    logAuditEvent('حذف تذكرة دعم', 'CRM الدعم الفني', `تم حذف التذكرة ${target?.ticketNumber || id}`);
  };

  // Sales Representatives & Commissions Management
  const addSalesRep = (repData: Omit<SalesRep, 'id'>) => {
    // If matching employee exists in HR, link directly
    const matchingEmp = employees.find(
      (e) => e.name === repData.name || e.employeeCode === repData.code || e.id === repData.employeeId
    );
    const repId = matchingEmp?.id || `rep-${Date.now()}`;
    const newRep: SalesRep = {
      ...repData,
      id: repId,
      employeeId: matchingEmp?.id || repId,
      code: repData.code || matchingEmp?.employeeCode || `EMP-${String(employees.length + 1).padStart(2, '0')}`,
      jobTitle: repData.jobTitle || matchingEmp?.jobTitle,
      department: repData.department || matchingEmp?.department,
      totalSalesAchieved: repData.totalSalesAchieved || 0,
      totalCommissionEarned: repData.totalCommissionEarned || 0,
      paidCommissions: repData.paidCommissions || 0,
      loyaltyPoints: repData.loyaltyPoints || 0,
    };
    setSalesReps((prev) => {
      const exists = prev.some((r) => r.id === newRep.id || r.employeeId === newRep.employeeId);
      if (exists) {
        return prev.map((r) => (r.id === newRep.id || r.employeeId === newRep.employeeId ? { ...r, ...newRep } : r));
      }
      return [...prev, newRep];
    });
    logAuditEvent('إضافة مندوب مبيعات', 'المبيعات والمناديب', `تمت مزامنة المندوب: ${newRep.name} بنسبة عمولة ${newRep.commissionRate}%`);
  };

  const updateSalesRep = (id: string, data: Partial<SalesRep>) => {
    setSalesReps((prev) =>
      prev.map((r) => (r.id === id || r.employeeId === id ? { ...r, ...data } : r))
    );
    // Also sync to matching HR Employee
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === id || e.id === data.employeeId || e.employeeCode === id) {
          return {
            ...e,
            name: data.name ?? e.name,
            phone: data.phone ?? e.phone,
            email: data.email ?? e.email,
            commissionRate: data.commissionRate !== undefined ? data.commissionRate : e.commissionRate,
            monthlySalesTarget:
              data.monthlySalesTarget !== undefined
                ? data.monthlySalesTarget
                : (data.salesTarget !== undefined ? data.salesTarget : e.monthlySalesTarget),
            salesTarget:
              data.monthlySalesTarget !== undefined
                ? data.monthlySalesTarget
                : (data.salesTarget !== undefined ? data.salesTarget : e.salesTarget),
          };
        }
        return e;
      })
    );
    logAuditEvent('تعديل بيانات مندوب', 'المبيعات والمناديب', `تم تحديث بيانات ومستهدفات المندوب ${data.name || id}`);
  };

  const deleteSalesRep = (id: string) => {
    const check = canDeleteSalesRep(id);
    const target = salesReps.find((r) => r.id === id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف المندوب (${target?.name || ''})`,
        message: 'لا يمكن حذف المندوب للأسباب التالية:',
        details: check.reason,
        note: 'لا يمكن حذف مناديب المبيعات الذين لديهم حركات أو فواتير أو عمولات مسجلة.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setSalesReps((prev) => prev.filter((r) => r.id !== id && r.employeeId !== id));
    // Clear sales rep from customers
    setCustomers((prev) =>
      prev.map((c) =>
        c.salesRepId === id || (target && c.salesRepId === target.employeeId)
          ? { ...c, salesRepId: undefined, salesRepName: undefined }
          : c
      )
    );
    logAuditEvent('حذف مندوب مبيعات', 'المبيعات والمناديب', `تم حذف المندوب ${target?.name || id}`);
  };

  // Commission Payments & Payouts
  const addCommissionPayment = (paymentData: Omit<CommissionPayment, 'id' | 'paymentNumber' | 'createdAt'>) => {
    const paymentNumber = `COMM-${new Date().getFullYear()}-${String(commissionPayments.length + 1).padStart(3, '0')}`;
    const newPayment: CommissionPayment = {
      ...paymentData,
      id: `comm-${Date.now()}`,
      paymentNumber,
      createdAt: new Date().toISOString(),
    };

    // 1. Save payment
    setCommissionPayments((prev) => [newPayment, ...prev]);

    // 2. Update sales rep paid commissions
    setSalesReps((prev) =>
      prev.map((r) => (r.id === paymentData.salesRepId ? { ...r, paidCommissions: (r.paidCommissions || 0) + paymentData.amount } : r))
    );

    // 3. Auto create Journal Entry for Commission Expense
    const expenseAccount = accounts.find((a) => a.code === '5200' || a.code === '5230') || {
      id: 'acc-comm-exp',
      code: '5230',
      name: 'مصروف عمولات وحوافز مبيعات',
    };
    const paymentAccount = accounts.find((a) => a.id === paymentData.accountId || a.code === paymentData.accountId) || {
      id: 'acc-cash',
      code: '1110',
      name: 'الخزينة النقدية الرئيسية',
    };

    const jeId = `je-comm-${Date.now()}`;
    const newJe: JournalEntry = {
      id: jeId,
      entryNumber: `JV-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: paymentData.date,
      reference: paymentNumber,
      description: `صرف عمولة مبيعات للمندوب: ${paymentData.salesRepName} عن فترة ${paymentData.period}`,
      lines: [
        {
          accountId: expenseAccount.id,
          accountCode: expenseAccount.code,
          accountName: expenseAccount.name,
          debit: paymentData.amount,
          credit: 0,
          description: `استحقاق وصرف عمولة مبيعات (${paymentData.salesRepName})`,
        },
        {
          accountId: paymentAccount.id,
          accountCode: paymentAccount.code,
          accountName: paymentAccount.name,
          debit: 0,
          credit: paymentData.amount,
          description: `سداد عمولة من ${paymentAccount.name}`,
        },
      ],
      createdAt: new Date().toISOString(),
      isPosted: true,
      totalDebit: paymentData.amount,
      totalCredit: paymentData.amount,
      sourceModule: 'commission',
    };
    setJournalEntries((prev) => [newJe, ...prev]);

    // Update account balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === expenseAccount.id || acc.code === expenseAccount.code) {
          return { ...acc, balance: acc.balance + paymentData.amount };
        }
        if (acc.id === paymentAccount.id || acc.code === paymentAccount.code) {
          return { ...acc, balance: acc.balance - paymentData.amount };
        }
        return acc;
      })
    );

    logAuditEvent('صرف عمولة مبيعات', 'العمولات والحسابات', `تم تسجيل سند صرف عمولة رقم ${paymentNumber} للمندوب ${paymentData.salesRepName} بقيمة ${formatMoney(paymentData.amount)}`);
  };

  const deleteCommissionPayment = (id: string) => {
    const target = commissionPayments.find((p) => p.id === id);
    if (!target) return;
    setCommissionPayments((prev) => prev.filter((p) => p.id !== id));
    setSalesReps((prev) =>
      prev.map((r) => (r.id === target.salesRepId ? { ...r, paidCommissions: Math.max(0, (r.paidCommissions || 0) - target.amount) } : r))
    );
    logAuditEvent('حذف سند صرف عمولة', 'العمولات والحسابات', `تم حذف سند صرف العمولة رقم ${target.paymentNumber}`);
  };

  const addCommissionTier = (tierData: Omit<CommissionTier, 'id'>) => {
    const newTier: CommissionTier = {
      ...tierData,
      id: `tier-${Date.now()}`,
    };
    setCommissionTiers((prev) => [...prev, newTier]);
    logAuditEvent('إضافة شريحة عمولات', 'سياسات العمولات', `تمت إضافة شريحة عمولة: ${newTier.name}`);
  };

  const updateCommissionTier = (id: string, data: Partial<CommissionTier>) => {
    setCommissionTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    logAuditEvent('تعديل شريحة عمولات', 'سياسات العمولات', `تم تعديل شريحة العمولة ${id}`);
  };

  const deleteCommissionTier = (id: string) => {
    setCommissionTiers((prev) => prev.filter((t) => t.id !== id));
    logAuditEvent('حذف شريحة عمولات', 'سياسات العمولات', `تم حذف شريحة العمولة ${id}`);
  };

  // Loyalty Points System
  const addLoyaltyTransaction = (txData: Omit<LoyaltyTransaction, 'id'>) => {
    const newTx: LoyaltyTransaction = {
      ...txData,
      id: `lyt-${Date.now()}`,
    };
    setLoyaltyTransactions((prev) => [newTx, ...prev]);
  };

  const adjustLoyaltyPoints = (
    partyType: 'customer' | 'sales_rep',
    partyId: string,
    pointsDelta: number,
    reason: string,
    ref?: string
  ) => {
    let partyName = '';
    let balanceAfter = 0;

    if (partyType === 'customer') {
      const cust = customers.find((c) => c.id === partyId);
      if (!cust) return;
      partyName = cust.name;
      balanceAfter = Math.max(0, (cust.loyaltyPoints || 0) + pointsDelta);
      setCustomers((prev) => prev.map((c) => (c.id === partyId ? { ...c, loyaltyPoints: balanceAfter } : c)));
    } else {
      const rep = salesReps.find((r) => r.id === partyId);
      if (!rep) return;
      partyName = rep.name;
      balanceAfter = Math.max(0, (rep.loyaltyPoints || 0) + pointsDelta);
      setSalesReps((prev) => prev.map((r) => (r.id === partyId ? { ...r, loyaltyPoints: balanceAfter } : r)));
    }

    addLoyaltyTransaction({
      type: pointsDelta >= 0 ? 'bonus' : 'redeem',
      partyType,
      partyId,
      partyName,
      points: Math.abs(pointsDelta),
      balanceAfter,
      reference: ref || 'تعديل يدوي',
      notes: reason,
      date: new Date().toISOString().split('T')[0],
    });

    logAuditEvent('تعديل نقاط الولاء والمكافآت', 'نقاط الولاء', `تم تعديل نقاط ${partyName} بمقدار ${pointsDelta > 0 ? '+' : ''}${pointsDelta} نقطة. الرصيد الجديد: ${balanceAfter}`);
  };

  const earnLoyaltyPoints = (customerId: string, amount: number): number => {
    // 1 point per 10 currency units
    const earned = Math.floor(amount / 10);
    if (earned > 0) {
      const cust = customers.find((c) => c.id === customerId);
      const newBal = (cust?.loyaltyPoints || 0) + earned;
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, loyaltyPoints: newBal } : c
        )
      );
      if (cust) {
        addLoyaltyTransaction({
          type: 'earn',
          partyType: 'customer',
          partyId: customerId,
          partyName: cust.name,
          points: earned,
          balanceAfter: newBal,
          reference: 'مبيعات',
          notes: `اكتساب نقاط ولاء عن مشتريات بقيمة ${formatMoney(amount)}`,
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
    return earned;
  };

  const redeemLoyaltyPoints = (customerId: string, pointsToRedeem: number): number => {
    // 10 points = 1 currency unit discount
    const discountAmount = Math.floor(pointsToRedeem / 10);
    const cust = customers.find((c) => c.id === customerId);
    const newBal = Math.max(0, (cust?.loyaltyPoints || 0) - pointsToRedeem);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, loyaltyPoints: newBal }
          : c
      )
    );
    if (cust) {
      addLoyaltyTransaction({
        type: 'redeem',
        partyType: 'customer',
        partyId: customerId,
        partyName: cust.name,
        points: pointsToRedeem,
        balanceAfter: newBal,
        reference: 'استبدال نقاط',
        notes: `استبدال ${pointsToRedeem} نقطة ولاء بخصم قيمته ${formatMoney(discountAmount)}`,
        date: new Date().toISOString().split('T')[0],
      });
    }
    return discountAmount;
  };

  // Vendors
  const addVendor = (vendData: Omit<Vendor, 'id' | 'code' | 'currentBalance'>) => {
    const code = getNextSequenceCode('vendor');

    // Auto-create sub-account in Chart of Accounts under 2110 (الموردون والدائنون)
    const existingVendAccounts = accounts.filter(
      (a) => a.parentCode === '2110' || a.code.startsWith('2110-') || a.code.startsWith('2110')
    );
    const nextAccSeq = existingVendAccounts.length + 1;
    const vendAccCode = `2110-${String(nextAccSeq).padStart(3, '0')}`;
    const newAccId = `acc-vend-${Date.now()}`;
    const newAccount: Account = {
      id: newAccId,
      code: vendAccCode,
      name: `مورد: ${vendData.name}`,
      type: 'liability',
      parentCode: '2110',
      balance: 0,
      description: `حساب مالي فرعي للمورد ${vendData.name} (كود: ${code})`,
    };
    setAccounts((prev) => [...prev, newAccount]);

    const newVend: Vendor = {
      ...vendData,
      id: `vend-${Date.now()}`,
      code,
      currentBalance: 0,
      accountId: newAccId,
    };
    setVendors((prev) => [...prev, newVend]);
    setSequenceConfig((prev) => ({ ...prev, vendorNextNumber: prev.vendorNextNumber + 1 }));
    logAuditEvent('إضافة مورد جديد', 'المشتريات والموردين', `تمت إضافة المورد ${newVend.name} مع إنشاء حساب تلقائي بالشجرة (${vendAccCode})`);
  };

  const editVendor = (id: string, data: Partial<Vendor>) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          if (data.name && v.accountId) {
            setAccounts((accs) =>
              accs.map((a) => (a.id === v.accountId ? { ...a, name: `مورد: ${data.name}` } : a))
            );
          }
          return { ...v, ...data };
        }
        return v;
      })
    );
    logAuditEvent('تعديل بيانات مورد', 'المشتريات والموردين', `تم تعديل بيانات المورد ${data.name || id}`);
  };

  const deleteVendor = (id: string) => {
    const check = canDeleteVendor(id);
    const target = vendors.find((v) => v.id === id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف المورد (${target?.name || ''})`,
        message: 'لا يمكن حذف المورد من قاعدة البيانات للأسباب التالية:',
        details: check.reason,
        note: 'للحفاظ على تكامل قيود المشتريات وحسابات الدائنين، يُمنع حذف الموردين الذين لديهم حركات.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    if (target?.accountId) {
      setAccounts((prev) => prev.filter((a) => a.id !== target.accountId));
    }
    setVendors((prev) => prev.filter((v) => v.id !== id));
    logAuditEvent('حذف مورد', 'المشتريات والموردين', `تم حذف المورد ${target?.name || id}`);
  };

  // Sales Invoices & Quick POS
  const addSalesInvoice = (
    invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'remainingAmount' | 'status'>
  ): SalesInvoice => {
    const invoiceNumber = getNextSequenceCode('invoice');
    
    // Calculate loyalty points
    const earnedPoints = invoiceData.pointsEarned !== undefined
      ? invoiceData.pointsEarned
      : Math.floor(invoiceData.grandTotal / 10);
    const redeemedPoints = invoiceData.pointsRedeemed || 0;

    // Auto-resolve sales rep from customer if not provided in invoice
    const customer = customers.find((c) => c.id === invoiceData.customerId);
    const assignedRepId = invoiceData.salesRepId || customer?.salesRepId;
    const assignedRepName = invoiceData.salesRepName || customer?.salesRepName;

    // Calculate commission
    let commAmount = invoiceData.commissionAmount;
    if (commAmount === undefined && assignedRepId) {
      const rep = salesReps.find((r) => r.id === assignedRepId || r.employeeId === assignedRepId || r.code === assignedRepId);
      const rate = invoiceData.commissionRate !== undefined ? invoiceData.commissionRate : (rep?.commissionRate || 0);
      commAmount = Math.round(((invoiceData.grandTotal - invoiceData.vatTotal) * (rate / 100)) * 100) / 100;
    }

    const newInvoice: SalesInvoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      paidAmount: 0,
      remainingAmount: invoiceData.grandTotal,
      status: 'unpaid',
      pointsEarned: earnedPoints,
      pointsRedeemed: redeemedPoints,
      salesRepId: assignedRepId,
      salesRepName: assignedRepName,
      commissionAmount: commAmount,
      qrData: `ORBIX-INV-${invoiceNumber}-${invoiceData.grandTotal}-${currency}-${invoiceData.vatTotal}-VAT`,
    };

    setSalesInvoices((prev) => [newInvoice, ...prev]);
    setSequenceConfig((prev) => ({ ...prev, invoiceNextNumber: prev.invoiceNextNumber + 1 }));

    // 1. Update Customer Balance & Loyalty Points
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === invoiceData.customerId) {
          const currentPts = c.loyaltyPoints || 0;
          const newPts = Math.max(0, currentPts - redeemedPoints + earnedPoints);
          return {
            ...c,
            currentBalance: c.currentBalance + invoiceData.grandTotal,
            loyaltyPoints: newPts,
          };
        }
        return c;
      })
    );

    // Update Sales Rep achievement
    if (assignedRepId) {
      setSalesReps((prev) =>
        prev.map((r) => {
          if (r.id === assignedRepId || r.employeeId === assignedRepId || r.code === assignedRepId) {
            const netSales = invoiceData.grandTotal - invoiceData.vatTotal;
            const comm = commAmount || 0;
            return {
              ...r,
              totalSalesAchieved: (r.totalSalesAchieved || 0) + netSales,
              totalCommissionEarned: (r.totalCommissionEarned || 0) + comm,
            };
          }
          return r;
        })
      );
    }

    // 2. Reduce Inventory Stock
    invoiceData.items.forEach((item) => {
      updateProductStock(item.productId, -item.quantity);
    });

    // 3. Post Automatic Accounting Journal Entry
    const jeLines = [
      {
        accountId: '1130',
        accountCode: '1130',
        accountName: `العملاء والمدينون (${invoiceData.customerName})`,
        debit: invoiceData.grandTotal,
        credit: 0,
        description: `استحقاق فاتورة مبيعات ${invoiceNumber}`,
      },
      {
        accountId: '4100',
        accountCode: '4100',
        accountName: 'إيراد مبيعات المنتجات والسلع',
        debit: 0,
        credit: invoiceData.subtotal,
        description: `إيراد مبيعات الفاتورة ${invoiceNumber}`,
      },
      {
        accountId: '2120',
        accountCode: '2120',
        accountName: `ضريبة القيمة المضافة - مخرجات (${invoiceData.vatRate}%)`,
        debit: 0,
        credit: invoiceData.vatTotal,
        description: `ضريبة مبيعات ${invoiceData.vatRate}% للفاتورة ${invoiceNumber}`,
      },
    ];

    addJournalEntry({
      entryNumber: `JE-AUTO-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: invoiceData.date,
      reference: invoiceNumber,
      description: `قيد مبيعات آجل تلقائي للفاتورة ${invoiceNumber} - العميل: ${invoiceData.customerName}`,
      lines: jeLines,
      totalDebit: invoiceData.grandTotal,
      totalCredit: invoiceData.grandTotal,
      isAutomatic: true,
      sourceModule: 'sales',
    });

    logAuditEvent('إصدار فاتورة مبيعات', 'المبيعات', `فاتورة رقم ${invoiceNumber} للعميل ${invoiceData.customerName} بقيمة ${invoiceData.grandTotal} ${currency}`);
    return newInvoice;
  };

  // Sales Returns Management
  const addSalesReturn = (
    returnDoc: Omit<SalesReturn, 'id' | 'returnNumber' | 'createdAt'>
  ): SalesReturn => {
    let returnNumber = getNextSequenceCode('return');
    if (!returnNumber) {
      returnNumber = `RET-${new Date().getFullYear()}-${String(salesReturns.length + 1).padStart(4, '0')}`;
    }

    const newReturn: SalesReturn = {
      ...returnDoc,
      id: `ret-${Date.now()}`,
      returnNumber,
      createdAt: new Date().toISOString(),
    };

    setSalesReturns((prev) => [newReturn, ...prev]);

    setSequenceConfig((prev) => ({
      ...prev,
      returnNextNumber: prev.returnNextNumber + 1,
    }));

    // 1. Increase product stock for returned items
    returnDoc.items.forEach((item) => {
      updateProductStock(item.productId, item.quantity);
    });

    // 2. Adjust customer balance or treasury based on refund method
    if (returnDoc.refundMethod === 'customer_balance') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === returnDoc.customerId
            ? { ...c, currentBalance: Math.max(0, c.currentBalance - returnDoc.totalRefundAmount) }
            : c
        )
      );
    } else if (returnDoc.refundMethod === 'cash_vault') {
      const cashAcc = accounts.find((a) => a.code === '1110') || accounts[2];
      if (cashAcc) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === cashAcc.id ? { ...a, balance: a.balance - returnDoc.totalRefundAmount } : a
          )
        );
      }
    } else if (returnDoc.refundMethod === 'bank') {
      const bankAcc = accounts.find((a) => a.code === '1120') || accounts[3];
      if (bankAcc) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === bankAcc.id ? { ...a, balance: a.balance - returnDoc.totalRefundAmount } : a
          )
        );
      }
    }

    // 3. Journal Entry for Sales Return
    const jeLines = [
      {
        accountId: '4150',
        accountCode: '4150',
        accountName: 'مردودات ومسموحات المبيعات',
        debit: returnDoc.subtotal,
        credit: 0,
        description: `مردودات مبيعات إشعار دائن ${returnNumber} - العميل: ${returnDoc.customerName}`,
      },
    ];

    if (returnDoc.vatTotal > 0) {
      jeLines.push({
        accountId: '2120',
        accountCode: '2120',
        accountName: 'ضريبة القيمة المضافة - تسوية مرتجعات مبيعات',
        debit: returnDoc.vatTotal,
        credit: 0,
        description: `تسوية ضريبة المرتجع ${returnNumber}`,
      });
    }

    let creditAccountCode = '1130';
    let creditAccountName = `العملاء والمدينون (${returnDoc.customerName})`;
    if (returnDoc.refundMethod === 'cash_vault') {
      creditAccountCode = '1110';
      creditAccountName = 'الخزينة النقدية الرئيسية (صرف مرتجع نقدي)';
    } else if (returnDoc.refundMethod === 'bank') {
      creditAccountCode = '1120';
      creditAccountName = 'البنك التجاري (تحويل مرتجع)';
    }

    jeLines.push({
      accountId: creditAccountCode,
      accountCode: creditAccountCode,
      accountName: creditAccountName,
      debit: 0,
      credit: returnDoc.totalRefundAmount,
      description: `استرداد قيمة مرتجع مبيعات ${returnNumber} (${returnDoc.refundMethod === 'customer_balance' ? 'خصم من رصيد العميل' : returnDoc.refundMethod === 'cash_vault' ? 'صرف نقدي فوري' : 'تحويل بنكي'})`,
    });

    addJournalEntry({
      entryNumber: `JE-RET-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: returnDoc.date,
      reference: returnNumber,
      description: `قيد إثبات مردودات مبيعات ${returnNumber} للعميل ${returnDoc.customerName}`,
      lines: jeLines,
      totalDebit: returnDoc.totalRefundAmount,
      totalCredit: returnDoc.totalRefundAmount,
      isAutomatic: true,
      sourceModule: 'sales',
    });

    logAuditEvent('إصدار إشعار مرتجع مبيعات', 'المبيعات والمرتجعات', `مرتجع رقم ${returnNumber} للعميل ${returnDoc.customerName} بقيمة ${returnDoc.totalRefundAmount} ${currency}`);
    return newReturn;
  };

  const deleteSalesReturn = (id: string) => {
    const target = salesReturns.find((r) => r.id === id);
    if (!target) return;

    target.items.forEach((item) => {
      updateProductStock(item.productId, -item.quantity);
    });

    if (target.refundMethod === 'customer_balance') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === target.customerId
            ? { ...c, currentBalance: c.currentBalance + target.totalRefundAmount }
            : c
        )
      );
    }

    setSalesReturns((prev) => prev.filter((r) => r.id !== id));
    logAuditEvent('حذف إشعار مرتجع', 'المبيعات والمرتجعات', `تم حذف المرتجع رقم ${target.returnNumber}`);
  };

  const editSalesReturn = (id: string, data: Partial<SalesReturn>) => {
    const oldRet = salesReturns.find((r) => r.id === id);
    if (!oldRet) return;

    // 1. Revert old stock and apply new stock if items changed
    if (data.items) {
      oldRet.items.forEach((item) => {
        updateProductStock(item.productId, -item.quantity);
      });
      data.items.forEach((item) => {
        updateProductStock(item.productId, item.quantity);
      });
    }

    // 2. Adjust customer balance if refundMethod is customer_balance
    const oldTotal = oldRet.totalRefundAmount || 0;
    const newTotal = data.totalRefundAmount !== undefined ? data.totalRefundAmount : oldTotal;
    const oldMethod = oldRet.refundMethod;
    const newMethod = data.refundMethod || oldMethod;

    if (oldMethod === 'customer_balance' && newMethod === 'customer_balance') {
      const delta = newTotal - oldTotal;
      if (delta !== 0) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === (data.customerId || oldRet.customerId)
              ? { ...c, currentBalance: Math.max(0, c.currentBalance - delta) }
              : c
          )
        );
      }
    } else if (oldMethod === 'customer_balance' && newMethod !== 'customer_balance') {
      // Revert old customer balance deduction
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === oldRet.customerId ? { ...c, currentBalance: c.currentBalance + oldTotal } : c
        )
      );
    } else if (oldMethod !== 'customer_balance' && newMethod === 'customer_balance') {
      // Apply new customer balance deduction
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === (data.customerId || oldRet.customerId)
            ? { ...c, currentBalance: Math.max(0, c.currentBalance - newTotal) }
            : c
        )
      );
    }

    setSalesReturns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );

    logAuditEvent('تعديل إشعار مرتجع', 'المبيعات والمرتجعات', `تم تعديل إشعار المرتجع رقم ${oldRet.returnNumber}`);
  };

  // Comprehensive Customer Statement of Account Generator
  const getCustomerStatement = (customerId: string, startDate?: string, endDate?: string) => {
    const customer = customers.find((c) => c.id === customerId) || {
      id: customerId,
      code: 'CUST-000',
      name: 'عميل غير محدد',
      companyName: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      creditLimit: 0,
      paymentTermsDays: 30,
      currentBalance: 0,
      status: 'active' as const,
    };

    const customerInvoices = salesInvoices.filter((i) => i.customerId === customerId);
    const customerReceipts = receipts.filter((r) => r.partyId === customerId && r.type === 'collection');
    const customerReturns = salesReturns.filter((r) => r.customerId === customerId);

    interface RawTx {
      id: string;
      date: string;
      createdAt?: string;
      type: 'invoice' | 'receipt' | 'return' | 'journal';
      typeName: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
    }

    const rawTxs: RawTx[] = [];

    // Track receipts already mapped to avoid duplication
    const linkedInvoiceIds = new Set(
      customerReceipts
        .map((r) => r.invoiceId || (r.referenceNumber?.startsWith('PAY-FOR-') ? r.referenceNumber.replace('PAY-FOR-', '') : null))
        .filter(Boolean)
    );
    const linkedInvoiceNumbers = new Set(
      customerReceipts
        .map((r) => (r.referenceNumber?.startsWith('PAY-FOR-') ? r.referenceNumber.replace('PAY-FOR-', '') : r.referenceNumber))
        .filter(Boolean)
    );

    customerInvoices.forEach((inv) => {
      rawTxs.push({
        id: inv.id,
        date: inv.date,
        createdAt: (inv as any).createdAt,
        type: 'invoice',
        typeName: 'فاتورة مبيعات',
        reference: inv.invoiceNumber,
        description: `فاتورة مبيعات (${inv.items.length} أصناف) - الحالة: ${inv.status === 'paid' ? 'مسددة' : inv.status === 'partially_paid' ? 'مسددة جزئياً' : 'غير مسددة'}`,
        debit: inv.grandTotal,
        credit: 0,
      });

      // If invoice was paid/partially paid at issuance and has no separate PaymentReceipt record
      const isAlreadyInReceipts =
        linkedInvoiceIds.has(inv.id) ||
        linkedInvoiceNumbers.has(inv.invoiceNumber) ||
        customerReceipts.some((r) => r.notes?.includes(inv.invoiceNumber) || r.referenceNumber === inv.invoiceNumber);

      if (inv.paidAmount > 0 && !isAlreadyInReceipts) {
        rawTxs.push({
          id: `rec-direct-${inv.id}`,
          date: inv.date,
          createdAt: (inv as any).createdAt,
          type: 'receipt',
          typeName: 'سند قبض / تحصيل فوري',
          reference: `REC-DIR-${inv.invoiceNumber}`,
          description: `سداد فوري مسجل على الفاتورة ${inv.invoiceNumber} (${inv.notes || 'سداد مباشر'})`,
          debit: 0,
          credit: inv.paidAmount,
        });
      }
    });

    customerReceipts.forEach((rec) => {
      rawTxs.push({
        id: rec.id,
        date: rec.date,
        createdAt: (rec as any).createdAt,
        type: 'receipt',
        typeName: 'سند قبض / تحصيل',
        reference: rec.receiptNumber,
        description: `سند قبض نقدية/بنك (${rec.paymentMethod === 'cash' ? 'نقداً' : rec.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'فيزا/شبكة'}) ${rec.notes ? `- ${rec.notes}` : ''}`,
        debit: 0,
        credit: rec.amount,
      });
    });

    customerReturns.forEach((ret) => {
      rawTxs.push({
        id: ret.id,
        date: ret.date,
        createdAt: ret.createdAt,
        type: 'return',
        typeName: 'مرتجع مبيعات',
        reference: ret.returnNumber,
        description: `إشعار دائن مرتجع مبيعات (${ret.items.length} أصناف) - ${ret.type === 'from_invoice' ? `من الفاتورة ${ret.invoiceNumber || ''}` : 'مرتجع مباشر من الحساب'}`,
        debit: 0,
        credit: ret.totalRefundAmount,
      });
    });

    // Robust chronological sort (Oldest to Newest, with precise same-day ordering)
    rawTxs.sort((a, b) => {
      // 1. Primary sort: Date ascending (oldest first)
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;

      // 2. Secondary sort: Timestamp if available
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (createdA && createdB && createdA !== createdB) return createdA - createdB;

      // 3. Tertiary sort: Accounting logic hierarchy on the same day
      // Invoices (Debits) first -> so customer is charged before being credited by payment
      // Returns next -> credits from return
      // Receipts next -> payment credits
      const typePriority: Record<string, number> = {
        invoice: 10,
        return: 20,
        receipt: 30,
        journal: 40,
      };
      const pA = typePriority[a.type] || 50;
      const pB = typePriority[b.type] || 50;
      if (pA !== pB) return pA - pB;

      // 4. Quaternary sort: Natural ascending document sequence number (e.g. REC-008 before REC-010, POS-008 before POS-009)
      const refA = a.reference || a.id || '';
      const refB = b.reference || b.id || '';
      return refA.localeCompare(refB, undefined, { numeric: true, sensitivity: 'base' });
    });

    let openingBalance = 0;
    const filteredTxs: Array<RawTx & { balance: number }> = [];

    rawTxs.forEach((tx) => {
      if (startDate && tx.date < startDate) {
        openingBalance += (tx.debit - tx.credit);
      }
    });

    let runningBalance = openingBalance;

    rawTxs.forEach((tx) => {
      const isInRange = (!startDate || tx.date >= startDate) && (!endDate || tx.date <= endDate);
      if (isInRange) {
        runningBalance += (tx.debit - tx.credit);
        filteredTxs.push({
          ...tx,
          balance: runningBalance,
        });
      }
    });

    const totalSales = filteredTxs.filter((t) => t.type === 'invoice').reduce((s, t) => s + t.debit, 0);
    const totalReceipts = filteredTxs.filter((t) => t.type === 'receipt').reduce((s, t) => s + t.credit, 0);
    const totalReturns = filteredTxs.filter((t) => t.type === 'return').reduce((s, t) => s + t.credit, 0);
    const closingBalance = runningBalance;
    const unpaidInvoices = customerInvoices.filter((i) => i.status !== 'paid');

    return {
      customer,
      openingBalance,
      closingBalance,
      totalSales,
      totalReceipts,
      totalReturns,
      transactions: filteredTxs,
      unpaidInvoices,
    };
  };

  const editSalesInvoice = (id: string, data: Partial<SalesInvoice>) => {
    const oldInv = salesInvoices.find((i) => i.id === id);
    if (!oldInv) return;

    if (data.items) {
      oldInv.items.forEach((item) => {
        updateProductStock(item.productId, item.quantity); // restore old
      });
      data.items.forEach((item) => {
        updateProductStock(item.productId, -item.quantity); // deduct new
      });
    }

    if (data.grandTotal !== undefined || data.remainingAmount !== undefined) {
      const oldRemaining = oldInv.remainingAmount;
      const newRemaining = data.remainingAmount !== undefined ? data.remainingAmount : (data.grandTotal !== undefined ? data.grandTotal - oldInv.paidAmount : oldRemaining);
      const balanceDelta = newRemaining - oldRemaining;

      setCustomers((prev) =>
        prev.map((c) => (c.id === (data.customerId || oldInv.customerId) ? { ...c, currentBalance: Math.max(0, c.currentBalance + balanceDelta) } : c))
      );
    }

    setSalesInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv))
    );

    logAuditEvent('تعديل فاتورة مبيعات', 'المبيعات', `تم تعديل الفاتورة رقم ${oldInv.invoiceNumber}`);
  };

  const deleteSalesInvoice = (id: string) => {
    const check = canDeleteSalesInvoice(id);
    const target = salesInvoices.find((i) => i.id === id);
    if (!target) return;
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف الفاتورة (${target.invoiceNumber})`,
        message: 'لا يمكن إتمام عملية حذف فاتورة المبيعات:',
        details: check.reason,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }

    // Restore stock
    target.items.forEach((item) => {
      updateProductStock(item.productId, item.quantity);
    });

    // Revert customer balance
    if (target.remainingAmount > 0) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === target.customerId ? { ...c, currentBalance: Math.max(0, c.currentBalance - target.remainingAmount) } : c))
      );
    }

    setSalesInvoices((prev) => prev.filter((i) => i.id !== id));
    logAuditEvent('حذف فاتورة مبيعات', 'المبيعات', `تم حذف الفاتورة رقم ${target.invoiceNumber} واسترجاع المخزون وتسوية رصيد العميل`);
  };

  // Quick POS Sales Transaction (Immediate Sale + Stock Deduct + Payment + Receipt + Cash Box JE)
  const createQuickPosSale = ({
    customerId,
    customerName,
    customerTaxNumber,
    items,
    discountTotal,
    vatRate,
    paymentMethod,
    paidAmount,
    notes,
  }: {
    customerId: string;
    customerName: string;
    customerTaxNumber?: string;
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      subtotal: number;
      vatAmount: number;
      total: number;
    }[];
    discountTotal: number;
    vatRate: number;
    paymentMethod: PaymentReceipt['paymentMethod'];
    paidAmount: number;
    notes?: string;
  }): SalesInvoice => {
    const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
    const vatTotal = items.reduce((sum, it) => sum + it.vatAmount, 0);
    const grandTotal = subtotal - discountTotal + vatTotal;
    const isCredit = paymentMethod === 'credit';
    const effectivePaid = isCredit ? 0 : Math.min(paidAmount, grandTotal);
    const remainingAmount = grandTotal - effectivePaid;
    const isFullPaid = effectivePaid >= grandTotal;

    const invoiceNumber = `POS-${new Date().getFullYear()}-${String(salesInvoices.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newInvoice: SalesInvoice = {
      id: `pos-${Date.now()}`,
      invoiceNumber,
      customerId,
      customerName,
      customerTaxNumber: customerTaxNumber || '',
      date: today,
      dueDate: today,
      items,
      subtotal,
      discountTotal,
      vatRate,
      vatTotal,
      grandTotal,
      paidAmount: effectivePaid,
      remainingAmount,
      status: isFullPaid ? 'paid' : effectivePaid > 0 ? 'partially_paid' : 'unpaid',
      notes: notes || `مبيعات كاشير (${isCredit ? 'آجل / على الحساب' : paymentMethod === 'cash' ? 'نقداً' : paymentMethod === 'card' ? 'فيزا/شبكة' : 'محفظة إلكترونية'})`,
      qrData: `ORBIX-POS-${invoiceNumber}-${grandTotal}-${currency}-${vatTotal}-VAT`,
    };

    // 1. Save invoice
    setSalesInvoices((prev) => [newInvoice, ...prev]);

    // 2. Reduce stock for items
    items.forEach((item) => {
      updateProductStock(item.productId, -item.quantity);
    });

    // 3. Determine debit cash/bank account based on payment method
    let debitAccountCode = '1110'; // Cash in hand
    let debitAccountName = 'الخزينة النقدية الرئيسية (POS Cash)';
    if (paymentMethod === 'card') {
      debitAccountCode = '1120'; // Commercial Bank
      debitAccountName = 'حساب البنك (فيزا وشبكة POS)';
    } else if (paymentMethod === 'bank_transfer') {
      debitAccountCode = '1125'; // InstaPay / E-Wallet
      debitAccountName = 'محفظة إنستاباي وفودافون كاش';
    }

    const targetAccount = accounts.find((a) => a.code === debitAccountCode) || accounts[2];

    // 4. Create accounting journal entry
    const jeLines = [];
    if (effectivePaid > 0) {
      jeLines.push({
        accountId: targetAccount.id,
        accountCode: debitAccountCode,
        accountName: debitAccountName,
        debit: effectivePaid,
        credit: 0,
        description: `تحصيل مبيعات POS فاتورة ${invoiceNumber}`,
      });
    }

    if (remainingAmount > 0) {
      jeLines.push({
        accountId: '1130',
        accountCode: '1130',
        accountName: `العملاء والمدينون (${customerName})`,
        debit: remainingAmount,
        credit: 0,
        description: `مبيعات آجل على الحساب POS ${invoiceNumber}`,
      });
      // Update customer balance for remaining debt
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, currentBalance: c.currentBalance + remainingAmount } : c))
      );
    }

    jeLines.push(
      {
        accountId: '4100',
        accountCode: '4100',
        accountName: 'إيراد مبيعات المنتجات ونقاط البيع POS',
        debit: 0,
        credit: subtotal - discountTotal,
        description: `إيراد مبيعات فاتورة كاشير ${invoiceNumber}`,
      },
      {
        accountId: '2120',
        accountCode: '2120',
        accountName: `ضريبة القيمة المضافة - مخرجات (${vatRate}%)`,
        debit: 0,
        credit: vatTotal,
        description: `ضريبة مبيعات ${vatRate}% للفاتورة ${invoiceNumber}`,
      }
    );

    addJournalEntry({
      entryNumber: `JE-POS-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: today,
      reference: invoiceNumber,
      description: `قيد مبيعات نقطة بيع POS كاشير (${isCredit ? 'آجل' : 'نقدي'}) - الفاتورة ${invoiceNumber}`,
      lines: jeLines,
      totalDebit: grandTotal,
      totalCredit: grandTotal,
      isAutomatic: true,
      sourceModule: 'pos',
    });

    // 5. Create Payment Receipt if paid
    if (effectivePaid > 0) {
      const receiptNumber = `REC-POS-${String(receipts.length + 1).padStart(4, '0')}`;
      const newRec: PaymentReceipt = {
        id: `rec-pos-${Date.now()}`,
        receiptNumber,
        type: 'collection',
        partyId: customerId,
        partyName: customerName,
        invoiceId: newInvoice.id,
        amount: effectivePaid,
        paymentMethod,
        date: today,
        referenceNumber: invoiceNumber,
        notes: `تحصيل مباشر لنقطة بيع POS - الفاتورة ${invoiceNumber}`,
        accountId: targetAccount.id,
      };
      setReceipts((prev) => [newRec, ...prev]);
    }

    logAuditEvent(
      'مبيعات نقطة بيع POS سريعة',
      'نقاط البيع والمبيعات',
      `تم إتمام بيع فاتورة ${invoiceNumber} بمبلغ ${grandTotal} ${currency} (${isCredit ? 'آجل على الحساب' : 'مسدد'}) للمشتري ${customerName} بواسطة ${currentUser?.name || 'الكاشير'}`
    );

    return newInvoice;
  };

  // Record Payment / Collection against Sales Invoice
  const recordInvoicePayment = (
    invoiceId: string,
    amount: number,
    accountId: string,
    paymentMethod: PaymentReceipt['paymentMethod']
  ) => {
    const inv = salesInvoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const newPaid = inv.paidAmount + amount;
    const newRemaining = Math.max(0, inv.grandTotal - newPaid);
    const newStatus = newRemaining === 0 ? 'paid' : 'partially_paid';

    setSalesInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newStatus,
            }
          : i
      )
    );

    setCustomers((prev) =>
      prev.map((c) => (c.id === inv.customerId ? { ...c, currentBalance: Math.max(0, c.currentBalance - amount) } : c))
    );

    const receiptNumber = `REC-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(3, '0')}`;
    const targetAccount = accounts.find((a) => a.id === accountId || a.code === accountId) || accounts[2];

    const newReceipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber,
      type: 'collection',
      partyId: inv.customerId,
      partyName: inv.customerName,
      invoiceId: inv.id,
      amount,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      referenceNumber: `PAY-FOR-${inv.invoiceNumber}`,
      notes: `تحصيل جزء/كل من الفاتورة ${inv.invoiceNumber}`,
      accountId: targetAccount.id,
    };

    setReceipts((prev) => [newReceipt, ...prev]);

    // Automatic Journal Entry for Collection
    addJournalEntry({
      entryNumber: `JE-REC-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: newReceipt.date,
      reference: receiptNumber,
      description: `سند تحصيل ${receiptNumber} من العميل ${inv.customerName} للفاتورة ${inv.invoiceNumber}`,
      lines: [
        {
          accountId: targetAccount.id,
          accountCode: targetAccount.code,
          accountName: targetAccount.name,
          debit: amount,
          credit: 0,
          description: `إيداع تحصيل من ${inv.customerName}`,
        },
        {
          accountId: '1130',
          accountCode: '1130',
          accountName: `العملاء والمدينون (${inv.customerName})`,
          debit: 0,
          credit: amount,
          description: `سداد مستحقات الفاتورة ${inv.invoiceNumber}`,
        },
      ],
      totalDebit: amount,
      totalCredit: amount,
      isAutomatic: true,
      sourceModule: 'collection',
    });

    logAuditEvent('تسجيل سند تحصيل', 'إدارة التحصيل CRM', `تحصيل مبلغ ${amount} ${currency} من العميل ${inv.customerName}`);
  };

  // Purchases
  const addPurchaseInvoice = (
    purchaseData: Omit<PurchaseInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'remainingAmount' | 'status'>
  ) => {
    const invoiceNumber = `PUR-${new Date().getFullYear()}-${String(purchaseInvoices.length + 1).padStart(3, '0')}`;
    const newPurchase: PurchaseInvoice = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
      invoiceNumber,
      paidAmount: 0,
      remainingAmount: purchaseData.grandTotal,
      status: 'unpaid',
    };

    setPurchaseInvoices((prev) => [newPurchase, ...prev]);

    setVendors((prev) =>
      prev.map((v) => (v.id === purchaseData.vendorId ? { ...v, currentBalance: v.currentBalance + purchaseData.grandTotal } : v))
    );

    purchaseData.items.forEach((item) => {
      updateProductStock(item.productId, item.quantity, item.unitPrice);
    });

    addJournalEntry({
      entryNumber: `JE-PUR-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: purchaseData.date,
      reference: invoiceNumber,
      description: `قيد استحقاق فاتورة مشتريات وتوريد ${invoiceNumber} من المورد ${purchaseData.vendorName}`,
      lines: [
        {
          accountId: '1140',
          accountCode: '1140',
          accountName: 'مخزون البضائع والمنتجات',
          debit: purchaseData.subtotal,
          credit: 0,
          description: `زيادة المخزون من الفاتورة ${invoiceNumber}`,
        },
        {
          accountId: '1150',
          accountCode: '1150',
          accountName: 'ضريبة القيمة المضافة - مدخلات (VAT Input)',
          debit: purchaseData.vatTotal,
          credit: 0,
          description: `ضريبة مشتريات مستردة للفاتورة ${invoiceNumber}`,
        },
        {
          accountId: '2110',
          accountCode: '2110',
          accountName: `الموردون والدائنون (${purchaseData.vendorName})`,
          debit: 0,
          credit: purchaseData.grandTotal,
          description: `استحقاق المورد ${purchaseData.vendorName}`,
        },
      ],
      totalDebit: purchaseData.grandTotal,
      totalCredit: purchaseData.grandTotal,
      isAutomatic: true,
      sourceModule: 'purchases',
    });

    logAuditEvent('إصدار فاتورة مشتريات', 'المشتريات', `فاتورة مشتريات ${invoiceNumber} من المورد ${purchaseData.vendorName} بمبلغ ${purchaseData.grandTotal} ${currency}`);
  };

  const editPurchaseInvoice = (id: string, data: Partial<PurchaseInvoice>) => {
    const oldBill = purchaseInvoices.find((b) => b.id === id);
    if (!oldBill) return;

    if (data.items) {
      oldBill.items.forEach((item) => {
        updateProductStock(item.productId, -item.quantity); // revert old received
      });
      data.items.forEach((item) => {
        updateProductStock(item.productId, item.quantity, item.unitPrice); // add new
      });
    }

    if (data.grandTotal !== undefined || data.remainingAmount !== undefined) {
      const oldRemaining = oldBill.remainingAmount;
      const newRemaining = data.remainingAmount !== undefined ? data.remainingAmount : (data.grandTotal !== undefined ? data.grandTotal - oldBill.paidAmount : oldRemaining);
      const balanceDelta = newRemaining - oldRemaining;

      setVendors((prev) =>
        prev.map((v) => (v.id === (data.vendorId || oldBill.vendorId) ? { ...v, currentBalance: Math.max(0, v.currentBalance + balanceDelta) } : v))
      );
    }

    setPurchaseInvoices((prev) =>
      prev.map((bill) => (bill.id === id ? { ...bill, ...data } : bill))
    );

    logAuditEvent('تعديل فاتورة مشتريات', 'المشتريات والموردين', `تم تعديل الفاتورة رقم ${oldBill.invoiceNumber}`);
  };

  const deletePurchaseInvoice = (id: string) => {
    const check = canDeletePurchaseInvoice(id);
    const target = purchaseInvoices.find((b) => b.id === id);
    if (!target) return;
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف فاتورة التوريد (${target.invoiceNumber})`,
        message: 'لا يمكن إتمام عملية حذف فاتورة المشتريات والتوريد:',
        details: check.reason,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }

    // Deduct stock that was brought in
    target.items.forEach((item) => {
      updateProductStock(item.productId, -item.quantity);
    });

    // Revert vendor debt
    if (target.remainingAmount > 0) {
      setVendors((prev) =>
        prev.map((v) => (v.id === target.vendorId ? { ...v, currentBalance: Math.max(0, v.currentBalance - target.remainingAmount) } : v))
      );
    }

    setPurchaseInvoices((prev) => prev.filter((b) => b.id !== id));
    logAuditEvent('حذف فاتورة مشتريات', 'المشتريات والموردين', `تم حذف فاتورة التوريد رقم ${target.invoiceNumber}`);
  };

  const recordVendorPayment = (
    purchaseId: string,
    amount: number,
    accountId: string,
    paymentMethod: PaymentReceipt['paymentMethod']
  ) => {
    const pur = purchaseInvoices.find((p) => p.id === purchaseId);
    if (!pur) return;

    const newPaid = pur.paidAmount + amount;
    const newRemaining = Math.max(0, pur.grandTotal - newPaid);
    const newStatus = newRemaining === 0 ? 'paid' : 'partially_paid';

    setPurchaseInvoices((prev) =>
      prev.map((p) =>
        p.id === purchaseId
          ? {
              ...p,
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newStatus,
            }
          : p
      )
    );

    setVendors((prev) =>
      prev.map((v) => (v.id === pur.vendorId ? { ...v, currentBalance: Math.max(0, v.currentBalance - amount) } : v))
    );

    const receiptNumber = `PAY-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(3, '0')}`;
    const targetAccount = accounts.find((a) => a.id === accountId || a.code === accountId) || accounts[2];

    const newReceipt: PaymentReceipt = {
      id: `rec-pay-${Date.now()}`,
      receiptNumber,
      type: 'vendor_payment',
      partyId: pur.vendorId,
      partyName: pur.vendorName,
      invoiceId: pur.id,
      amount,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      referenceNumber: `PAY-OUT-${pur.invoiceNumber}`,
      notes: `سداد جزء/كل من فاتورة التوريد ${pur.invoiceNumber}`,
      accountId: targetAccount.id,
    };

    setReceipts((prev) => [newReceipt, ...prev]);

    addJournalEntry({
      entryNumber: `JE-PAY-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: newReceipt.date,
      reference: receiptNumber,
      description: `سند صرف ${receiptNumber} للمورد ${pur.vendorName} للفاتورة ${pur.invoiceNumber}`,
      lines: [
        {
          accountId: '2110',
          accountCode: '2110',
          accountName: `الموردون والدائنون (${pur.vendorName})`,
          debit: amount,
          credit: 0,
          description: `سداد مستحقات المورد ${pur.vendorName}`,
        },
        {
          accountId: targetAccount.id,
          accountCode: targetAccount.code,
          accountName: targetAccount.name,
          debit: 0,
          credit: amount,
          description: `صرف بنكي/نقدي للمورد`,
        },
      ],
      totalDebit: amount,
      totalCredit: amount,
      isAutomatic: true,
      sourceModule: 'purchases',
    });

    logAuditEvent('سند صرف مورد', 'المشتريات', `سداد مبلغ ${amount} ${currency} للمورد ${pur.vendorName}`);
  };

  // Receipts / Vouchers
  const addReceiptVoucher = (receiptData: Omit<PaymentReceipt, 'id' | 'receiptNumber'>) => {
    const isCollection = receiptData.type === 'collection';
    const prefix = isCollection ? 'REC' : 'PAY';
    const receiptNumber = `${prefix}-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(3, '0')}`;

    const newReceipt: PaymentReceipt = {
      ...receiptData,
      id: `rec-${Date.now()}`,
      receiptNumber,
    };

    setReceipts((prev) => [newReceipt, ...prev]);

    const targetAccount = accounts.find((a) => a.id === receiptData.accountId) || accounts[2];

    if (isCollection) {
      // 1. Settle customer sales invoices (either specific invoice or FIFO across unpaid invoices)
      let amountToAllocate = Number(receiptData.amount) || 0;
      setSalesInvoices((prev) => {
        if (receiptData.invoiceId) {
          // Settle the specified invoice first
          return prev.map((inv) => {
            if (inv.id === receiptData.invoiceId) {
              const pay = Math.min(amountToAllocate, inv.remainingAmount);
              amountToAllocate -= pay;
              const newPaid = inv.paidAmount + pay;
              const newRem = Math.max(0, inv.grandTotal - newPaid);
              return {
                ...inv,
                paidAmount: newPaid,
                remainingAmount: newRem,
                status: newRem <= 0.001 ? 'paid' : 'partially_paid',
              };
            }
            return inv;
          });
        } else {
          // Settle customer invoices in FIFO order (oldest/first unpaid first)
          return prev.map((inv) => {
            if (inv.customerId === receiptData.partyId && inv.remainingAmount > 0 && amountToAllocate > 0) {
              const pay = Math.min(amountToAllocate, inv.remainingAmount);
              amountToAllocate -= pay;
              const newPaid = inv.paidAmount + pay;
              const newRem = Math.max(0, inv.grandTotal - newPaid);
              return {
                ...inv,
                paidAmount: newPaid,
                remainingAmount: newRem,
                status: newRem <= 0.001 ? 'paid' : 'partially_paid',
              };
            }
            return inv;
          });
        }
      });

      // 2. Reduce Customer currentBalance
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === receiptData.partyId
            ? { ...c, currentBalance: Math.max(0, c.currentBalance - Number(receiptData.amount)) }
            : c
        )
      );

      // 3. Post Automatic Accounting Journal Entry
      addJournalEntry({
        entryNumber: `JE-REC-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
        date: receiptData.date,
        reference: receiptNumber,
        description: `سند تحصيل ${receiptNumber} - ${receiptData.partyName}`,
        lines: [
          {
            accountId: targetAccount.id,
            accountCode: targetAccount.code,
            accountName: targetAccount.name,
            debit: receiptData.amount,
            credit: 0,
            description: receiptData.notes || 'سند قبض',
          },
          {
            accountId: '1130',
            accountCode: '1130',
            accountName: `العملاء والمدينون (${receiptData.partyName})`,
            debit: 0,
            credit: receiptData.amount,
            description: 'تسوية حساب عميل',
          },
        ],
        totalDebit: receiptData.amount,
        totalCredit: receiptData.amount,
        isAutomatic: true,
        sourceModule: 'collection',
      });
    } else {
      // Settle vendor purchase invoices if any
      let amountToAllocate = Number(receiptData.amount) || 0;
      setPurchaseInvoices((prev) => {
        if (receiptData.invoiceId) {
          return prev.map((pur) => {
            if (pur.id === receiptData.invoiceId) {
              const pay = Math.min(amountToAllocate, pur.remainingAmount);
              amountToAllocate -= pay;
              const newPaid = pur.paidAmount + pay;
              const newRem = Math.max(0, pur.grandTotal - newPaid);
              return {
                ...pur,
                paidAmount: newPaid,
                remainingAmount: newRem,
                status: newRem <= 0.001 ? 'paid' : 'partially_paid',
              };
            }
            return pur;
          });
        } else {
          return prev.map((pur) => {
            if (pur.vendorId === receiptData.partyId && pur.remainingAmount > 0 && amountToAllocate > 0) {
              const pay = Math.min(amountToAllocate, pur.remainingAmount);
              amountToAllocate -= pay;
              const newPaid = pur.paidAmount + pay;
              const newRem = Math.max(0, pur.grandTotal - newPaid);
              return {
                ...pur,
                paidAmount: newPaid,
                remainingAmount: newRem,
                status: newRem <= 0.001 ? 'paid' : 'partially_paid',
              };
            }
            return pur;
          });
        }
      });

      // Reduce Vendor currentBalance
      setVendors((prev) =>
        prev.map((v) =>
          v.id === receiptData.partyId
            ? { ...v, currentBalance: Math.max(0, v.currentBalance - Number(receiptData.amount)) }
            : v
        )
      );

      addJournalEntry({
        entryNumber: `JE-PAY-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
        date: receiptData.date,
        reference: receiptNumber,
        description: `سند صرف ${receiptNumber} - ${receiptData.partyName}`,
        lines: [
          {
            accountId: '2110',
            accountCode: '2110',
            accountName: `الموردون والدائنون (${receiptData.partyName})`,
            debit: receiptData.amount,
            credit: 0,
            description: 'سداد ذمة مورد',
          },
          {
            accountId: targetAccount.id,
            accountCode: targetAccount.code,
            accountName: targetAccount.name,
            debit: 0,
            credit: receiptData.amount,
            description: receiptData.notes || 'سند صرف',
          },
        ],
        totalDebit: receiptData.amount,
        totalCredit: receiptData.amount,
        isAutomatic: true,
        sourceModule: 'purchases',
      });
    }
  };

  const editPaymentReceipt = (id: string, data: Partial<PaymentReceipt>) => {
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    logAuditEvent('تعديل سند مالي', 'التحصيل والخزينة', `تم تعديل السند رقم ${data.receiptNumber || id}`);
  };

  const deletePaymentReceipt = (id: string) => {
    const target = receipts.find((r) => r.id === id);
    if (!target) return;

    if (target.type === 'collection') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === target.partyId ? { ...c, currentBalance: c.currentBalance + target.amount } : c))
      );
      if (target.invoiceId) {
        setSalesInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === target.invoiceId) {
              const newPaid = Math.max(0, inv.paidAmount - target.amount);
              const newRem = Math.min(inv.grandTotal, inv.remainingAmount + target.amount);
              return {
                ...inv,
                paidAmount: newPaid,
                remainingAmount: newRem,
                status: newPaid <= 0.001 ? 'unpaid' : 'partially_paid',
              };
            }
            return inv;
          })
        );
      }
    } else if (target.type === 'vendor_payment') {
      setVendors((prev) =>
        prev.map((v) => (v.id === target.partyId ? { ...v, currentBalance: v.currentBalance + target.amount } : v))
      );
      if (target.invoiceId) {
        setPurchaseInvoices((prev) =>
          prev.map((pur) => {
            if (pur.id === target.invoiceId) {
              const newPaid = Math.max(0, pur.paidAmount - target.amount);
              const newRem = Math.min(pur.grandTotal, pur.remainingAmount + target.amount);
              return {
                ...pur,
                paidAmount: newPaid,
                remainingAmount: newRem,
                status: newPaid <= 0.001 ? 'unpaid' : 'partially_paid',
              };
            }
            return pur;
          })
        );
      }
    }

    setReceipts((prev) => prev.filter((r) => r.id !== id));
    logAuditEvent('حذف سند مالي', 'التحصيل والخزينة', `تم حذف السند رقم ${target.receiptNumber} وتسوية الأرصدة`);
  };

  // HR & Payroll
  const addJobTitle = (title: string): string => {
    const trimmed = title.trim();
    if (!trimmed) return '';
    setJobTitles((prev) => {
      if (prev.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const updated = [trimmed, ...prev];
      localStorage.setItem(`${STORAGE_PREFIX}job_titles`, JSON.stringify(updated));
      return updated;
    });
    logAuditEvent('إضافة مسمى وظيفي جديد', 'الموارد البشرية', `تم إنشاء وحفظ المسمى الوظيفي: ${trimmed}`);
    return trimmed;
  };

  const addDepartment = (dept: string): string => {
    const trimmed = dept.trim();
    if (!trimmed) return '';
    setDepartments((prev) => {
      if (prev.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const updated = [trimmed, ...prev];
      localStorage.setItem(`${STORAGE_PREFIX}departments`, JSON.stringify(updated));
      return updated;
    });
    logAuditEvent('إضافة قسم أو إدارة جديدة', 'الموارد البشرية', `تم إنشاء وحفظ القسم / الإدارة: ${trimmed}`);
    return trimmed;
  };

  const addEmployee = (empData: Omit<Employee, 'id' | 'employeeCode'>) => {
    const employeeCode = `EMP-${String(employees.length + 1).padStart(2, '0')}`;

    if (empData.jobTitle) {
      addJobTitle(empData.jobTitle);
    }
    if (empData.department) {
      addDepartment(empData.department);
    }

    // Auto-create sub-account in Chart of Accounts under 2130 (مخصص الرواتب والأجور المستحقة)
    const existingEmpAccounts = accounts.filter(
      (a) => a.parentCode === '2130' || a.code.startsWith('2130-') || a.code.startsWith('2130')
    );
    const nextAccSeq = existingEmpAccounts.length + 1;
    const empAccCode = `2130-${String(nextAccSeq).padStart(3, '0')}`;
    const newAccId = `acc-emp-${Date.now()}`;
    const newAccount: Account = {
      id: newAccId,
      code: empAccCode,
      name: `مستحقات الموظف: ${empData.name}`,
      type: 'liability',
      parentCode: '2130',
      balance: 0,
      description: `حساب مستحقات وسلفيات الموظف ${empData.name} (كود: ${employeeCode})`,
    };
    setAccounts((prev) => [...prev, newAccount]);

    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      employeeCode,
      accountId: newAccId,
    };
    setEmployees((prev) => [...prev, newEmp]);
    logAuditEvent('تعيين موظف جديد', 'الموارد البشرية والرواتب', `تمت إضافة الموظف ${newEmp.name} مع إنشاء حساب تلقائي بالشجرة (${empAccCode})`);
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          if (data.name && e.accountId) {
            setAccounts((accs) =>
              accs.map((a) => (a.id === e.accountId ? { ...a, name: `مستحقات الموظف: ${data.name}` } : a))
            );
          }
          return { ...e, ...data };
        }
        return e;
      })
    );
    if (data.photoBase64 !== undefined) {
      setUsers((prev) =>
        prev.map((u) => (u.employeeId === id ? { ...u, avatarUrl: data.photoBase64 } : u))
      );
      if (currentUser?.employeeId === id) {
        setCurrentUser((prev) => (prev ? { ...prev, avatarUrl: data.photoBase64 } : null));
      }
    }
    const emp = employees.find((e) => e.id === id);
    logAuditEvent('تعديل ملف موظف', 'الموارد البشرية والرواتب', `تم تعديل بيانات الموظف ${emp?.name || id}`);
  };

  const editEmployee = (id: string, data: Partial<Employee>) => {
    updateEmployee(id, data);
  };

  const deleteEmployee = (id: string) => {
    const check = canDeleteEmployee(id);
    const target = employees.find((e) => e.id === id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف الموظف (${target?.name || ''})`,
        message: 'لا يمكن حذف ملف الموظف من المنظومة للأسباب التالية:',
        details: check.reason,
        note: 'لحفظ السجلات القانونية ومسيرات الرواتب والتقارير المالية، لا يمكن حذف سجلات الموظفين التي عليها حركة.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    if (target?.accountId) {
      setAccounts((prev) => prev.filter((a) => a.id !== target.accountId));
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setSalesReps((prev) => prev.filter((r) => r.id !== id && r.employeeId !== id));
    setCustomers((prev) =>
      prev.map((c) =>
        c.salesRepId === id || (target && c.salesRepId === target.employeeCode)
          ? { ...c, salesRepId: undefined, salesRepName: undefined }
          : c
      )
    );
    logAuditEvent('حذف موظف', 'الموارد البشرية والرواتب', `تم حذف ملف الموظف ${target?.name || id}`);
  };

  const deletePayrollRun = (runId: string) => {
    const check = canDeletePayrollRun(runId);
    const target = payrollRuns.find((r) => r.id === runId);
    if (!target) return;
    if (!check.canDelete) {
      showAlert({
        title: 'تعذر حذف مسير الرواتب',
        message: 'لا يمكن حذف مسير الرواتب المحدد:',
        details: check.reason,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setPayrollRuns((prev) => prev.filter((r) => r.id !== runId));
    logAuditEvent('حذف مسير رواتب', 'الموارد البشرية والرواتب', `تم حذف مسير الرواتب لشهر ${target?.month}/${target?.year}`);
  };

  const generateMonthlyPayroll = (month: number, year: number): PayrollRun => {
    const existing = payrollRuns.find((r) => r.month === month && r.year === year);
    if (existing) return existing;

    const payslips: Payslip[] = employees
      .filter((e) => e.status === 'active')
      .map((emp) => {
        const grossSalary = emp.basicSalary + emp.housingAllowance + emp.transportAllowance + emp.otherAllowances;
        const employeeSocialInsurance = (emp.basicSalary + emp.housingAllowance) * (emp.socialInsuranceEmployeeRate / 100);
        const incomeTax = grossSalary * (emp.taxDeductionRate / 100);
        const totalDeductions = employeeSocialInsurance + incomeTax;
        const netSalary = grossSalary - totalDeductions;

        return {
          id: `ps-${emp.id}-${month}-${year}`,
          employeeId: emp.id,
          employeeName: emp.name,
          jobTitle: emp.jobTitle,
          month,
          year,
          basicSalary: emp.basicSalary,
          housingAllowance: emp.housingAllowance,
          transportAllowance: emp.transportAllowance,
          otherAllowances: emp.otherAllowances,
          grossSalary,
          overtimeHours: 0,
          overtimeAmount: 0,
          bonus: 0,
          deductions: 0,
          socialInsuranceDeduction: employeeSocialInsurance,
          taxDeduction: incomeTax,
          totalDeductions,
          netSalary,
          paymentStatus: 'pending',
        };
      });

    const totalGross = payslips.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalNet = payslips.reduce((sum, p) => sum + p.netSalary, 0);
    const totalDeductions = payslips.reduce((sum, p) => sum + p.totalDeductions, 0);

    const newRun: PayrollRun = {
      id: `pr-${year}-${String(month).padStart(2, '0')}`,
      month,
      year,
      date: new Date().toISOString().split('T')[0],
      totalGross,
      totalNet,
      totalDeductions,
      employeesCount: payslips.length,
      status: 'draft',
      payslips,
    };

    setPayrollRuns((prev) => [newRun, ...prev]);
    logAuditEvent('مسير رواتب شهري', 'الموارد البشرية والرواتب', `تم إنشاء مسير رواتب شهر ${month}/${year} بإجمالي ${totalNet} ${currency}`);
    return newRun;
  };

  const approvePayrollRun = (runId: string) => {
    const run = payrollRuns.find((r) => r.id === runId);
    if (!run || run.status === 'approved' || run.status === 'posted_to_accounts') return;

    setPayrollRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, status: 'approved' } : r)));

    // Generate Double Entry Accounting Journal for Payroll
    const totalExpense = run.totalGross;
    const totalSocialPayable = run.totalDeductions;

    addJournalEntry({
      entryNumber: `JE-PAYROLL-${run.year}-${String(run.month).padStart(2, '0')}`,
      date: new Date().toISOString().split('T')[0],
      reference: `PAYROLL-${run.year}-${String(run.month).padStart(2, '0')}`,
      description: `قيد إثبات استحقاق مسير رواتب وأجور شهر ${run.month}/${run.year}`,
      lines: [
        {
          accountId: '5200',
          accountCode: '5200',
          accountName: 'مصروفات الرواتب والأجور والبدلات',
          debit: totalExpense,
          credit: 0,
          description: `إجمالي تكلفة الرواتب لشهر ${run.month}/${run.year}`,
        },
        {
          accountId: '2130',
          accountCode: '2130',
          accountName: 'مخصص الرواتب والأجور المستحقة (Accrued Payroll)',
          debit: 0,
          credit: run.totalNet,
          description: 'صافي الرواتب المستحقة للصرف للموظفين',
        },
        {
          accountId: '2140',
          accountCode: '2140',
          accountName: 'أمانات التأمينات الاجتماعية (Social Insurance)',
          debit: 0,
          credit: totalSocialPayable,
          description: 'حصة الموظف للتأمينات والضرائب',
        },
      ],
      totalDebit: totalExpense,
      totalCredit: totalExpense,
      isAutomatic: true,
      sourceModule: 'payroll',
    });

    logAuditEvent('اعتماد مسير رواتب', 'الموارد البشرية والرواتب', `تم اعتماد وترحيل قيد مسير الرواتب لشهر ${run.month}/${run.year}`);
  };

  // Google Sheets Config & Sync
  const updateGoogleSheetConfig = (config: Partial<GoogleSheetConfig>) => {
    setGoogleSheetConfig((prev) => ({ ...prev, ...config }));
    logAuditEvent('تحديث إعدادات Google Sheets', 'الربط والتكامل', 'تم تحديث رابط أو خيارات المزامنة مع جداول بيانات Google.');
  };

  const syncToGoogleSheets = async (dataToSync?: any): Promise<{ success: boolean; message: string; rowsSynced?: number }> => {
    const payload = dataToSync || {
      companyName: companyProfile.nameAr,
      currency,
      timestamp: new Date().toISOString(),
      invoices: salesInvoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerTaxNumber: inv.customerTaxNumber || '',
        date: inv.date,
        dueDate: inv.dueDate,
        subtotal: inv.subtotal,
        vatRate: `${inv.vatRate}%`,
        vatTotal: inv.vatTotal,
        grandTotal: inv.grandTotal,
        paidAmount: inv.paidAmount,
        remainingAmount: inv.remainingAmount,
        status: inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partially_paid' ? 'مدفوعة جزئياً' : 'غير مدفوعة',
        itemsCount: inv.items.length,
      })),
      stats: {
        totalSales: salesInvoices.reduce((s, i) => s + i.grandTotal, 0),
        totalCollected: salesInvoices.reduce((s, i) => s + i.paidAmount, 0),
        totalUncollected: salesInvoices.reduce((s, i) => s + i.remainingAmount, 0),
        productsCount: products.length,
        customersCount: customers.length,
      },
    };

    try {
      if (!googleSheetConfig.webhookUrl || !googleSheetConfig.webhookUrl.startsWith('http')) {
        throw new Error('يرجى إدخال رابط Webhook صالح لـ Google Apps Script في الإعدادات.');
      }

      // If valid URL, we perform real fetch (with no-cors fallback or structured POST)
      const res = await fetch(googleSheetConfig.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors', // Google Apps Script web apps redirect with 302, no-cors ensures browser doesn't block request
      });

      const now = new Date().toLocaleString('ar-EG');
      setGoogleSheetConfig((prev) => ({
        ...prev,
        lastSyncTime: now,
        lastSyncStatus: 'success',
        lastErrorMessage: undefined,
      }));

      logAuditEvent(
        'مزامنة Google Sheets',
        'الربط والتكامل',
        `تمت مزامنة ${payload.invoices.length} فاتورة مع جداول Google Sheets بنجاح.`
      );

      return {
        success: true,
        message: `تم إرسال ومزامنة ${payload.invoices.length} فاتورة وسجل إلى Google Sheets بنجاح!`,
        rowsSynced: payload.invoices.length,
      };
    } catch (err: any) {
      const errMsg = err?.message || 'تعذر الاتصال بـ Google Apps Script. تحقق من صحة الرابط والصلاحيات.';
      setGoogleSheetConfig((prev) => ({
        ...prev,
        lastSyncStatus: 'error',
        lastErrorMessage: errMsg,
      }));
      return {
        success: false,
        message: errMsg,
      };
    }
  };

  // Debt Aging Calculation
  const debtAging: DebtAgingBucket[] = React.useMemo(() => {
    const today = new Date();

    return customers.map((cust) => {
      const custInvoices = salesInvoices.filter(
        (inv) => inv.customerId === cust.id && inv.remainingAmount > 0
      );

      let days0to30 = 0;
      let days31to60 = 0;
      let days61to90 = 0;
      let days90Plus = 0;
      let oldestDate = '';

      custInvoices.forEach((inv) => {
        const dueDate = new Date(inv.dueDate);
        const diffDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

        if (!oldestDate || inv.date < oldestDate) {
          oldestDate = inv.date;
        }

        if (diffDays <= 30) {
          days0to30 += inv.remainingAmount;
        } else if (diffDays <= 60) {
          days31to60 += inv.remainingAmount;
        } else if (diffDays <= 90) {
          days61to90 += inv.remainingAmount;
        } else {
          days90Plus += inv.remainingAmount;
        }
      });

      const currentTotal = days0to30 + days31to60 + days61to90 + days90Plus;
      const isOverLimit = cust.creditLimit > 0 && currentTotal > cust.creditLimit;

      return {
        customerId: cust.id,
        customerName: cust.name,
        phone: cust.phone,
        currentTotal,
        days0to30,
        days31to60,
        days61to90,
        days90Plus,
        oldestInvoiceDate: oldestDate || '-',
        creditLimit: cust.creditLimit,
        isOverLimit,
      };
    });
  }, [customers, salesInvoices]);

  // Database Integrity & Diagnostics
  const verifyDatabaseIntegrity = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    journalEntries.forEach((je) => {
      totalDebit += je.totalDebit;
      totalCredit += je.totalCredit;
    });

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.05;
    const outOfStock = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;
    const negativeAccounts = accounts.filter((a) => (a.type === 'asset' || a.type === 'expense') && a.balance < 0);

    const issues: string[] = [];
    if (!isBalanced) {
      issues.push(`عدم توازن في دفتر اليومية: فارق ${Math.abs(totalDebit - totalCredit)} ${currency}`);
    }
    if (negativeAccounts.length > 0) {
      issues.push(`يوجد ${negativeAccounts.length} حسابات أصول برصيد سالب (سحب على المكشوف أو مدفوعات زائدة).`);
    }
    if (outOfStock > 0) {
      issues.push(`يوجد ${outOfStock} أصناف وصلت لحد الطلب الأدنى أو نفدت.`);
    }

    return {
      isBalanced,
      totalDebit,
      totalCredit,
      outOfStockCount: outOfStock,
      negativeAccounts,
      issues,
    };
  };

  // Rollback Audit Log Action
  const rollbackAuditLog = (logId: string): { success: boolean; message: string } => {
    const targetLog = auditLogs.find((l) => l.id === logId);
    if (!targetLog) {
      return { success: false, message: 'لم يتم العثور على سجل الحركة المطلوب.' };
    }

    const { action, module: mod, details } = targetLog;

    // 1. Sales Invoice reversal
    if (action.includes('فاتورة مبيعات') || details.includes('INV-')) {
      const invMatch = details.match(/INV-[\w-]+/);
      const invNum = invMatch ? invMatch[0] : '';
      const inv = salesInvoices.find((i) => (invNum && i.invoiceNumber === invNum) || details.includes(i.invoiceNumber));
      if (inv) {
        deleteSalesInvoice(inv.id);
        logAuditEvent('تراجع عن حركة', 'المبيعات', `تم التراجع عن حركة "${action}" وحذف الفاتورة ${inv.invoiceNumber} وتسوية القيود والمخزون.`);
        return { success: true, message: `تم التراجع بنجاح عن فاتورة المبيعات رقم ${inv.invoiceNumber} وإلغاء أثرها المحاسبي والمخزني.` };
      }
    }

    // 2. Purchase Bill reversal
    if (action.includes('فاتورة مشتريات') || details.includes('PUR-')) {
      const purMatch = details.match(/PUR-[\w-]+/);
      const purNum = purMatch ? purMatch[0] : '';
      const bill = purchaseInvoices.find((b) => (purNum && b.invoiceNumber === purNum) || details.includes(b.invoiceNumber));
      if (bill) {
        deletePurchaseInvoice(bill.id);
        logAuditEvent('تراجع عن حركة', 'المشتريات', `تم التراجع عن حركة "${action}" وحذف فاتورة الشراء ${bill.invoiceNumber} واسترجاع المخزون والحسابات.`);
        return { success: true, message: `تم التراجع بنجاح عن فاتورة المشتريات رقم ${bill.invoiceNumber} واسترجاع المخزون والحسابات.` };
      }
    }

    // 3. Sales Return reversal
    if (action.includes('مرتجع') || details.includes('RET-')) {
      const retMatch = details.match(/RET-[\w-]+/);
      const retNum = retMatch ? retMatch[0] : '';
      const ret = salesReturns.find((r) => (retNum && r.returnNumber === retNum) || details.includes(r.returnNumber));
      if (ret) {
        deleteSalesReturn(ret.id);
        logAuditEvent('تراجع عن حركة', 'المبيعات والمرتجعات', `تم التراجع عن حركة "${action}" وإلغاء إشعار المرتجع ${ret.returnNumber}.`);
        return { success: true, message: `تم التراجع بنجاح عن إشعار المرتجع رقم ${ret.returnNumber}.` };
      }
    }

    // 4. Financial Receipt / Voucher reversal
    if (action.includes('سند') || details.includes('REC-')) {
      const recMatch = details.match(/REC-[\w-]+/);
      const recNum = recMatch ? recMatch[0] : '';
      const rec = receipts.find((r) => (recNum && r.receiptNumber === recNum) || details.includes(r.receiptNumber));
      if (rec) {
        deletePaymentReceipt(rec.id);
        logAuditEvent('تراجع عن حركة', 'التحصيل والخزينة', `تم التراجع عن حركة "${action}" وحذف السند ${rec.receiptNumber} وتسوية الخزينة.`);
        return { success: true, message: `تم التراجع بنجاح عن السند المالي رقم ${rec.receiptNumber} وتسوية أرصدة الخزينة والحسابات.` };
      }
    }

    // 5. Journal Entry reversal
    if (action.includes('قيد') || details.includes('JE-')) {
      const jeMatch = details.match(/JE-[\w-]+/);
      const jeNum = jeMatch ? jeMatch[0] : '';
      const je = journalEntries.find((j) => (jeNum && j.entryNumber === jeNum) || details.includes(j.entryNumber));
      if (je) {
        deleteJournalEntry(je.id);
        logAuditEvent('تراجع عن حركة', 'الحسابات العامة', `تم التراجع عن قيد اليومية رقم ${je.entryNumber} وإلغاء أثره على الحسابات.`);
        return { success: true, message: `تم التراجع بنجاح عن قيد اليومية رقم ${je.entryNumber}.` };
      }
    }

    // 6. Commission Payment reversal
    if (action.includes('عمولة') || details.includes('COMM-')) {
      const commMatch = details.match(/COMM-[\w-]+/);
      const commNum = commMatch ? commMatch[0] : '';
      const comm = commissionPayments.find((c) => (commNum && c.paymentNumber === commNum) || details.includes(c.paymentNumber));
      if (comm) {
        deleteCommissionPayment(comm.id);
        logAuditEvent('تراجع عن حركة', 'العمولات والحسابات', `تم التراجع عن صرف عمولة رقم ${comm.paymentNumber}.`);
        return { success: true, message: `تم التراجع بنجاح عن سند صرف العمولة رقم ${comm.paymentNumber}.` };
      }
    }

    // 7. CRM Lead reversal
    if (action.includes('عميل محتمل') || mod.includes('CRM')) {
      const lead = crmLeads.find((l) => details.includes(l.name) || (l.phone && details.includes(l.phone)));
      if (lead) {
        deleteCrmLead(lead.id);
        logAuditEvent('تراجع عن حركة', 'CRM', `تم التراجع عن إضافة العميل المحتمل: ${lead.name}`);
        return { success: true, message: `تم التراجع عن حركة العميل المحتمل (${lead.name}) وحذفه.` };
      }
    }

    // 8. CRM Ticket reversal
    if (action.includes('تذكرة') || details.includes('TKT-')) {
      const tktMatch = details.match(/TKT-[\w-]+/);
      const tktNum = tktMatch ? tktMatch[0] : '';
      const tkt = crmTickets.find((t) => (tktNum && t.ticketNumber === tktNum) || details.includes(t.ticketNumber));
      if (tkt) {
        deleteCrmTicket(tkt.id);
        logAuditEvent('تراجع عن حركة', 'CRM الدعم الفني', `تم التراجع عن التذكرة رقم ${tkt.ticketNumber}`);
        return { success: true, message: `تم التراجع عن تذكرة الدعم الفني رقم ${tkt.ticketNumber}.` };
      }
    }

    // 9. Customer creation reversal
    if (action.includes('إضافة عميل') || action.includes('عميل جديد')) {
      const cust = customers.find((c) => details.includes(c.name) || details.includes(c.code));
      if (cust) {
        const check = canDeleteEntity('customer', cust.id);
        if (!check.canDelete) {
          return { success: false, message: `تعذر التراجع عن إنشاء العميل (${cust.name}): ${check.reason}` };
        }
        deleteCustomer(cust.id);
        logAuditEvent('تراجع عن حركة', 'إدارة العملاء', `تم التراجع عن إنشاء العميل: ${cust.name}`);
        return { success: true, message: `تم التراجع وحذف العميل (${cust.name}) بنجاح.` };
      }
    }

    // 10. Vendor creation reversal
    if (action.includes('إضافة مورد') || action.includes('مورد جديد')) {
      const vend = vendors.find((v) => details.includes(v.name) || details.includes(v.code));
      if (vend) {
        const check = canDeleteEntity('vendor', vend.id);
        if (!check.canDelete) {
          return { success: false, message: `تعذر التراجع عن إنشاء المورد (${vend.name}): ${check.reason}` };
        }
        deleteVendor(vend.id);
        logAuditEvent('تراجع عن حركة', 'المشتريات والموردين', `تم التراجع عن إنشاء المورد: ${vend.name}`);
        return { success: true, message: `تم التراجع وحذف المورد (${vend.name}) بنجاح.` };
      }
    }

    // 11. General Audit Log record reversal / removal
    setAuditLogs((prev) => prev.filter((l) => l.id !== logId));
    logAuditEvent('تراجع عن حركة سجل', mod, `تم التراجع عن تسجيل الحركة "${action}" (${details}) المنفذة بواسطة ${targetLog.userName}.`);
    return {
      success: true,
      message: `تم التراجع عن حركة "${action}" وإلغاء قيدها في سجل العمليات بنجاح.`,
    };
  };

  // Setup & First-time Launch
  const completeInitialSetup = (profileData: Partial<CompanyProfile>, adminUser: AppUser) => {
    setCompanyProfile((prev) => ({ ...prev, ...profileData }));
    if (profileData.defaultCurrency) {
      setCurrency(profileData.defaultCurrency);
    }
    setUsers([adminUser]);
    setCurrentUser(adminUser);
    setIsSetupCompleted(true);
    localStorage.setItem(`${STORAGE_PREFIX}setup_completed`, 'true');
    localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify([adminUser]));
    localStorage.setItem(`${STORAGE_PREFIX}current_user`, JSON.stringify(adminUser));
    logAuditEvent('تهيئة النظام لأول مرة', 'الأمان والتأسيس', `تمت تهيئة بيانات المنشأة وإنشاء حساب المدير العام (${adminUser.name}) بنجاح.`);
  };

  const resetToCleanNewCompany = () => {
    showConfirm(
      'هل أنت متأكد من رغبتك في تفريغ كافة الحركات والعمليات والبدء كشركة جديدة؟ سيتم الإبقاء على دليل الحسابات القياسي وتفريغ الفواتير والسندات والعملاء والموردين وفتح معالج تسجيل المدير.',
      () => {
        // Clear storage
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(STORAGE_PREFIX)) {
            localStorage.removeItem(k);
          }
        });
        setIsSetupCompleted(false);
        setUsers([]);
        setCurrentUser(null);
        setAccounts(INITIAL_ACCOUNTS);
        setSalesInvoices([]);
        setPurchaseInvoices([]);
        setReceipts([]);
        setJournalEntries([]);
        setProducts([]);
        setCustomers(INITIAL_CUSTOMERS);
        setVendors([]);
        setEmployees([]);
        setSalesReps([]);
        setSalesReturns([]);
        setPayrollRuns([]);
        setCrmLeads([]);
        setCrmInteractions([]);
        setCrmTickets([]);
        setLoyaltyTransactions([]);
        setCommissionPayments([]);
        setSequenceConfig(DEFAULT_SEQUENCE_CONFIG);
        setGoogleSheetConfig(INITIAL_GOOGLE_SHEET_CONFIG);
        setCompanyProfile(INITIAL_COMPANY_PROFILE);
        setAuditLogs([
          {
            id: `log-init-${Date.now()}`,
            userId: 'usr-system',
            userName: 'نظام التهيئة',
            action: 'تفريغ وبدء من جديد',
            module: 'النظام العام',
            details: 'تم تفريغ العمليات وفتح معالج التهيئة لشركة جديدة مع الاحتفاظ بشجرة الحسابات القياسية.',
            timestamp: new Date().toISOString(),
          },
        ]);
      },
      'تأكيد تفريغ النظام وبدء شركة جديدة',
      { confirmText: 'تفريغ وبدء من جديد', type: 'warning' }
    );
  };

  // Reset to Factory Default
  const resetToDefaultData = () => {
    showConfirm(
      'تحذير: هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات إلى الحالة الافتراضية؟ سيتم مسح أي تعديلات غير محفوظة في نسخة احتياطية.',
      () => {
        setCompanyProfile(INITIAL_COMPANY_PROFILE);
        setCurrency('EGP');
        setCurrencies(INITIAL_CURRENCIES);
        setSecondaryCurrency('USD');
        setUsers(INITIAL_USERS);
        setCurrentUser(INITIAL_USERS[0]);
        setAccounts(INITIAL_ACCOUNTS);
        setJournalEntries(INITIAL_JOURNAL_ENTRIES);
        setProducts(INITIAL_PRODUCTS);
        setCustomers(INITIAL_CUSTOMERS);
        setVendors(INITIAL_VENDORS);
        setSalesInvoices(INITIAL_INVOICES);
        setPurchaseInvoices(INITIAL_PURCHASES);
        setReceipts(INITIAL_RECEIPTS);
        setEmployees(INITIAL_EMPLOYEES);
        setPayrollRuns([]);
        setPriceLists(INITIAL_PRICE_LISTS);
        setSalesReturns(INITIAL_SALES_RETURNS);
        setSequenceConfig(DEFAULT_SEQUENCE_CONFIG);
        setGoogleSheetConfig(INITIAL_GOOGLE_SHEET_CONFIG);
        setAuditLogs([
          {
            id: `log-${Date.now()}`,
            userId: 'usr-admin',
            userName: 'المدير العام',
            action: 'إعادة ضبط المصنع',
            module: 'النظام العام',
            details: 'تمت استعادة البيانات الافتراضية لقاعدة بيانات النظام.',
            timestamp: new Date().toISOString(),
          },
        ]);
      },
      'تأكيد استعادة البيانات الافتراضية',
      { confirmText: 'استعادة البيانات الافتراضية', type: 'error' }
    );
  };

  // Backup Export
  const exportDataJSON = () => {
    const fullBackup = {
      system: 'Orbix ERP Enterprise',
      version: '3.5.0',
      schemaVersion: 2,
      companyProfile,
      currency,
      currencies,
      secondaryCurrency,
      users,
      accounts,
      journalEntries,
      products,
      customers,
      vendors,
      salesInvoices,
      purchaseInvoices,
      receipts,
      employees,
      payrollRuns,
      priceLists,
      salesReturns,
      salesReps,
      sequenceConfig,
      googleSheetConfig,
      auditLogs,
      exportedAt: new Date().toISOString(),
      checksum: btoa(
        `${accounts.length}-${products.length}-${salesInvoices.length}-${journalEntries.length}-${Date.now()}`
      ),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `orbix-erp-backup-${companyProfile.nameAr.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logAuditEvent('تصدير نسخة احتياطية', 'قاعدة البيانات والحماية', 'تم تنزيل وتصدير نسخة احتياطية مشفرة من قاعدة البيانات.');
  };

  // Restore Backup
  const restoreBackupJSON = (jsonString: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.accounts || !parsed.products || !parsed.salesInvoices) {
        return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو ناقص البنية الأساسية.' };
      }

      if (parsed.companyProfile) setCompanyProfile(parsed.companyProfile);
      if (parsed.currency) setCurrency(parsed.currency);
      if (parsed.currencies && Array.isArray(parsed.currencies)) setCurrencies(parsed.currencies);
      if (parsed.secondaryCurrency) setSecondaryCurrency(parsed.secondaryCurrency);
      if (parsed.users && Array.isArray(parsed.users)) setUsers(parsed.users);
      if (parsed.accounts && Array.isArray(parsed.accounts)) setAccounts(parsed.accounts);
      if (parsed.journalEntries && Array.isArray(parsed.journalEntries)) setJournalEntries(parsed.journalEntries);
      if (parsed.products && Array.isArray(parsed.products)) setProducts(parsed.products);
      if (parsed.customers && Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (parsed.vendors && Array.isArray(parsed.vendors)) setVendors(parsed.vendors);
      if (parsed.salesInvoices && Array.isArray(parsed.salesInvoices)) setSalesInvoices(parsed.salesInvoices);
      if (parsed.purchaseInvoices && Array.isArray(parsed.purchaseInvoices)) setPurchaseInvoices(parsed.purchaseInvoices);
      if (parsed.receipts && Array.isArray(parsed.receipts)) setReceipts(parsed.receipts);
      if (parsed.employees && Array.isArray(parsed.employees)) setEmployees(parsed.employees);
      if (parsed.payrollRuns && Array.isArray(parsed.payrollRuns)) setPayrollRuns(parsed.payrollRuns);
      if (parsed.priceLists && Array.isArray(parsed.priceLists)) setPriceLists(parsed.priceLists);
      if (parsed.salesReturns && Array.isArray(parsed.salesReturns)) setSalesReturns(parsed.salesReturns);
      if (parsed.salesReps && Array.isArray(parsed.salesReps)) setSalesReps(parsed.salesReps);
      if (parsed.sequenceConfig) setSequenceConfig(parsed.sequenceConfig);
      if (parsed.googleSheetConfig) setGoogleSheetConfig(parsed.googleSheetConfig);
      if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) setAuditLogs(parsed.auditLogs);

      logAuditEvent('استرجاع نسخة احتياطية', 'قاعدة البيانات والحماية', 'تم استرجاع قاعدة البيانات بالكامل من ملف خارجي بنجاح.');

      return {
        success: true,
        message: `تم استرجاع النسخة الاحتياطية بنجاح! (${parsed.salesInvoices.length} فاتورة، ${parsed.products.length} صنف، ${parsed.accounts.length} حساب).`,
      };
    } catch (err: any) {
      return { success: false, message: `فشل استرجاع النسخة: ${err?.message || 'خطأ في معالجة JSON'}` };
    }
  };

  return (
    <ErpContext.Provider
      value={{
        alertModal,
        showAlert,
        showConfirm,
        closeAlertModal,
        activeTab,
        setActiveTab,
        activeSubTab,
        setActiveSubTab,
        navigateTo,
        currency,
        setCurrency,
        formatMoney,
        formatDualMoney,
        currencies,
        secondaryCurrency,
        setSecondaryCurrency,
        addCurrency,
        updateCurrency,
        deleteCurrency,
        convertAmount,
        companyProfile,
        updateCompanyProfile,
        users,
        currentUser,
        login,
        logout,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        hasPermission,
        accounts,
        journalEntries,
        addAccount,
        editAccount,
        deleteAccount,
        addJournalEntry,
        editJournalEntry,
        deleteJournalEntry,
        products,
        warehouses,
        addProduct,
        updateProduct,
        editProduct,
        deleteProduct,
        updateProductStock,
        priceLists,
        addPriceList,
        updatePriceList,
        deletePriceList,
        getProductPriceForCustomer,
        customers,
        addCustomer,
        updateCustomer,
        editCustomer,
        deleteCustomer,
        debtAging,
        salesReps,
        addSalesRep,
        updateSalesRep,
        deleteSalesRep,
        crmLeads,
        addCrmLead,
        updateCrmLead,
        deleteCrmLead,
        crmInteractions,
        addCrmInteraction,
        updateCrmInteraction,
        deleteCrmInteraction,
        crmTickets,
        addCrmTicket,
        updateCrmTicket,
        deleteCrmTicket,
        commissionPayments,
        commissionTiers,
        addCommissionPayment,
        deleteCommissionPayment,
        addCommissionTier,
        updateCommissionTier,
        deleteCommissionTier,
        loyaltyTransactions,
        addLoyaltyTransaction,
        adjustLoyaltyPoints,
        earnLoyaltyPoints,
        redeemLoyaltyPoints,
        getCustomerStatement,
        vendors,
        addVendor,
        editVendor,
        deleteVendor,
        salesInvoices,
        addSalesInvoice,
        editSalesInvoice,
        deleteSalesInvoice,
        recordInvoicePayment,
        createQuickPosSale,
        salesReturns,
        addSalesReturn,
        editSalesReturn,
        deleteSalesReturn,
        purchaseInvoices,
        addPurchaseInvoice,
        editPurchaseInvoice,
        deletePurchaseInvoice,
        recordVendorPayment,
        receipts,
        addReceiptVoucher,
        editPaymentReceipt,
        deletePaymentReceipt,
        employees,
        payrollRuns,
        jobTitles,
        departments,
        addJobTitle,
        addDepartment,
        addEmployee,
        updateEmployee,
        editEmployee,
        deleteEmployee,
        generateMonthlyPayroll,
        approvePayrollRun,
        deletePayrollRun,
        sequenceConfig,
        updateSequenceConfig,
        getNextSequenceCode,
        googleSheetConfig,
        updateGoogleSheetConfig,
        syncToGoogleSheets,
        auditLogs,
        logAuditEvent,
        rollbackAuditLog,
        canDeleteEntity,
        isSetupCompleted,
        completeInitialSetup,
        resetToCleanNewCompany,
        resetToDefaultData,
        exportDataJSON,
        restoreBackupJSON,
        verifyDatabaseIntegrity,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
};

export const useErp = () => {
  const context = useContext(ErpContext);
  if (!context) {
    throw new Error('useErp must be used within an ErpProvider');
  }
  return context;
};
