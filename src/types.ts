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

export interface BrowserTab {
  id: string; // unique ID, e.g. "dashboard", "sales_invoices", "accounts_chart"
  tab: string;
  subTab?: string;
  title: string;
  iconName: string;
  isPinned?: boolean;
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
  costCenterId?: string;
  costCenterName?: string;
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
  sourceModule?: 'sales' | 'purchases' | 'payroll' | 'collection' | 'pos' | 'manual' | 'commission' | 'inventory' | 'expenses' | 'accounting';
  createdAt: string;
}

export interface WarehouseStockDetail {
  warehouseId: string;
  warehouseName?: string;
  shelfLocation?: string;
  quantity: number;
  minStockAlert?: number;
}

export interface ProductUnit {
  id: string;
  name: string; // e.g. 'كرتونة', 'علبة', 'دستة', 'شريط'
  factor: number; // معامل التحويل للوحدة الأساسية (مثال: 12 قطعة)
  barcode?: string;
  costPrice?: number;
  sellingPrice?: number;
  wholesalePrice?: number;
  isDefaultSale?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand?: string; // الماركة / العلامة التجارية
  originCountry?: string; // بلد المنشأ
  unit: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number; // سعر الجملة
  minSellingPrice?: number; // الحد الأدنى لسعر البيع
  stockQuantity: number;
  minStockAlert: number;
  warehouseId: string;
  shelfLocation?: string; // مكان الرف / القطاع بالمستودع
  warehouseStocks?: WarehouseStockDetail[]; // تفاصيل توزيع الأرصدة والأرفف على المستودعات
  governorate?: string; // المحافظة / الموقع التخزيني
  supplierId?: string; // المورد المفضل
  supplierName?: string;
  barcode?: string;
  units?: ProductUnit[]; // الوحدات المتعددة والعبوات
  weight?: string | number;
  dimensions?: string;
  description?: string;
  imageUrl?: string;
  imageBase64?: string;
  imageWidth?: number;
  imageHeight?: number;
  hasExpiry?: boolean; // خاضع لتاريخ الصلاحية
  productionDate?: string; // تاريخ الإنتاج
  expiryDate?: string; // تاريخ انتهاء الصلاحية
  batchNumber?: string; // رقم التشغيلة الافتراضي
}

export interface Warehouse {
  id: string;
  code?: string;
  name: string;
  location?: string;
  governorate?: string;
  manager?: string;
  keeperName?: string;
  phone?: string;
  keeperPhone?: string;
  capacity?: string | number;
  isMain?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
  notes?: string;
}

export interface StockTransferItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  date: string;
  fromWarehouseId: string;
  fromWarehouseName?: string;
  toWarehouseId: string;
  toWarehouseName?: string;
  status: 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled';
  items: StockTransferItem[];
  totalQuantity: number;
  totalCost: number;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
  receivedDate?: string;
  createdAt?: string;
}

export interface StocktakingItem {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  category?: string;
  unit?: string;
  costPrice: number;
  systemQty?: number;
  systemQuantity?: number;
  countedQty?: number;
  countedQuantity?: number;
  difference?: number;
  differenceQty?: number; // counted - system
  differenceValue: number; // differenceQty * costPrice
  batchNumber?: string;
  reason?: string;
  notes?: string;
}

export interface StocktakingSession {
  id: string;
  sessionNumber: string;
  title?: string;
  date: string;
  warehouseId: string;
  warehouseName?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  items: StocktakingItem[];
  totalSystemQty?: number;
  totalCountedQty?: number;
  totalShortageQty?: number; // عجز
  totalSurplusQty?: number; // زيادة
  totalDiscrepancyValue?: number; // صافي القيمة المالية للفروقات
  notes?: string;
  responsiblePerson?: string;
  auditorName?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface ScrapVoucherItem {
  productId: string;
  productName: string;
  sku: string;
  unit?: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
  reason?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface ScrapVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  warehouseId: string;
  warehouseName?: string;
  reason?: 'expired' | 'damaged_transit' | 'manufacturing_defect' | 'damaged' | 'sample' | 'storage_defect' | 'other';
  reasonCategory?: 'expired' | 'damaged' | 'sample' | 'storage_defect' | 'other';
  items: ScrapVoucherItem[];
  totalQuantity?: number;
  totalCostLoss?: number;
  totalLossValue?: number;
  totalCost?: number;
  notes?: string;
  approvedBy?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface StockAdjustmentItem {
  productId: string;
  productName: string;
  sku: string;
  unit?: string;
  costPrice: number;
  currentQuantity: number; // الرصيد بالنظام قبل التسوية
  adjustedQuantity: number; // الرصيد الفعلي المعدل
  deltaQuantity: number; // الفرق (+ إضافة، - خصم)
  type: 'increase' | 'decrease'; // نوع الحركة للبند
  totalCostImpact: number; // الأثر المالي للبند (deltaQuantity * costPrice)
  batchNumber?: string;
  shelfLocation?: string;
  reason?: string;
  notes?: string;
  time?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string; // ADJ-2026-001
  date: string;
  time?: string;
  warehouseId: string;
  warehouseName?: string;
  type: 'general' | 'increase' | 'decrease' | 'initial_balance' | 'correction';
  reason: 'inventory_variance' | 'initial_balance' | 'audit_correction' | 'gift_promotion' | 'damage_settlement' | 'sample' | 'other';
  reasonLabel?: string;
  status: 'draft' | 'posted' | 'cancelled';
  items: StockAdjustmentItem[];
  totalItemsCount: number;
  totalIncreaseQuantity: number;
  totalDecreaseQuantity: number;
  netQuantityDelta: number;
  totalCostImpact: number; // صافي الأثر المالي (+ / -)
  totalCostAbsValuation: number; // إجمالي قيمة البضاعة الخاضعة للتسوية
  notes?: string;
  responsiblePerson?: string;
  approvedBy?: string;
  createdByName?: string;
  createdAt?: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  warehouseId?: string;
  warehouseName?: string;
  batchNumber: string;
  productionDate?: string;
  expiryDate: string;
  quantity: number;
  initialQuantity?: number;
  costPrice?: number;
  sellingPrice?: number;
  status?: 'valid' | 'near_expiry' | 'expired';
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  unit?: string;
  warehouseId?: string;
  warehouseName?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'SCRAP' | 'STOCKTAKING' | 'transfer_in' | 'transfer_out' | 'adjustment_in' | 'adjustment_out' | 'adjustment' | 'scrap';
  quantity: number;
  unitPrice?: number;
  date: string;
  reference?: string;
  referenceType?: string;
  referenceNumber?: string;
  batchNumber?: string;
  notes?: string;
  createdAt?: string;
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
  commercialRegister?: string; // السجل التجاري
  governorate?: string; // المحافظة
  region?: string; // المنطقة / الحي
  address: string;
  postalCode?: string;
  contactPerson?: string; // جهة الاتصال / الشخص المسؤول
  contactPersonPhone?: string; // هاتف المسؤول
  customerCategory?: 'retail' | 'wholesale' | 'distributor' | 'vip' | 'corporate'; // تصنيف العميل
  acquisitionChannel?: 'direct' | 'sales_rep' | 'social_media' | 'referral' | 'website' | 'exhibition' | 'campaign'; // قناة الاستقطاب
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
  commercialRegister?: string; // السجل التجاري
  governorate?: string; // المحافظة
  region?: string; // المنطقة / الحي
  address: string;
  contactPerson?: string; // مندوب / مسؤول المورد
  contactPersonPhone?: string; // هاتف المسؤول
  category?: string; // تصنيف المورد
  bankName?: string;
  bankIban?: string;
  creditLimit?: number; // سقف الائتمان المتاح
  rating?: number; // تقييم المورد (1-5)
  currentBalance: number; // Positive = we owe them money
  paymentTermsDays: number;
  accountId?: string; // Linked sub-account in Chart of Accounts
  notes?: string;
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
  unitName?: string;
  unitFactor?: number;
  unitBarcode?: string;
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
  unitName?: string;
  unitFactor?: number;
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

export interface QuotationItem {
  id?: string;
  productId: string;
  productName: string;
  sku?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. "QUO-2026-001"
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerTaxNumber?: string;
  salesRepId?: string;
  salesRepName?: string;
  date: string;
  validUntil: string; // تاريخ انتهاء سريان العرض
  items: QuotationItem[];
  subtotal: number;
  discountTotal: number;
  vatRate: number;
  vatTotal: number;
  grandTotal: number;
  status: 'draft' | 'sent' | 'pending' | 'approved' | 'rejected' | 'converted_to_order' | 'converted_to_invoice' | 'expired';
  terms?: string; // شروط العرض والدفع والتسليم
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  convertedToOrderId?: string;
  convertedToOrderNumber?: string;
  convertedToInvoiceId?: string;
  convertedToInvoiceNumber?: string;
  createdAt: string;
}

export interface SalesOrderItem {
  id?: string;
  productId: string;
  productName: string;
  sku?: string;
  unit?: string;
  quantity: number;
  deliveredQuantity?: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // e.g. "SO-2026-001"
  quotationId?: string;
  quotationNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerTaxNumber?: string;
  salesRepId?: string;
  salesRepName?: string;
  date: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  items: SalesOrderItem[];
  subtotal: number;
  discountTotal: number;
  vatRate: number;
  vatTotal: number;
  grandTotal: number;
  status: 'pending' | 'confirmed' | 'processing' | 'partially_delivered' | 'delivered' | 'completed' | 'invoiced' | 'cancelled';
  shippingAddress?: string;
  paymentTerms?: string;
  deliveryNotes?: string;
  notes?: string;
  convertedToInvoiceId?: string;
  convertedToInvoiceNumber?: string;
  createdAt: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  quotationId?: string;
  quotationNumber?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
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
  paymentMethod?: string;
  notes?: string;
  qrData?: string;
  createdAt?: string;
}

export interface PurchaseInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unitName?: string;
  unitFactor?: number;
  batchNumber?: string;
  productionDate?: string;
  expiryDate?: string;
  warehouseId?: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  dueDate: string;
  warehouseId?: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
  notes?: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'credit';

export type PaymentReceiptType = 'collection' | 'vendor_payment' | 'expense_payment' | 'general_payment';

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  type: PaymentReceiptType; // سند قبض أو صرف مورد أو صرف مصروف أو عام
  partyId?: string;
  partyName: string;
  salesRepId?: string;
  salesRepName?: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  referenceNumber?: string;
  notes?: string;
  accountId: string; // الخزينة أو البنك المصروف منه أو المحصل إليه
  accountName?: string;
  expenseAccountId?: string; // حساب المصروف المدين في سندات الصرف
  expenseAccountName?: string;
  expenseCategory?: string; // تصنيف المصروف (إيجار، صيانة، مرافق، نثرية، إعلانات، إلخ)
  payeeName?: string; // اسم المستفيد / المستلم
  checkNumber?: string;
  checkDueDate?: string;
  bankName?: string;
  taxAmount?: number;
  taxNumber?: string;
  costCenterId?: string;
  costCenterName?: string;
  createdAt?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  jobTitle: string;
  department: string;
  branch?: string; // الفرع / موقع العمل
  governorate?: string; // المحافظة
  region?: string; // المنطقة / الحي
  address?: string; // العنوان التفصيلي
  gender?: 'male' | 'female';
  birthDate?: string; // تاريخ الميلاد
  hireDate: string;
  phone: string;
  email: string;
  nationalId: string;
  emergencyContactName?: string; // جهة اتصال الطوارئ
  emergencyContactPhone?: string; // هاتف الطوارئ
  contractType?: 'full_time' | 'part_time' | 'contract' | 'probation'; // نوع العقد
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
  salaryPaymentMethod?: 'bank_transfer' | 'cash'; // طريقة صرف الراتب (تحويل بنكي / نقداً من الخزينة)
  salaryDisbursementAccountId?: string; // حساب الصرف المالي (1120 للبنك، 1110 للخزينة، أو حساب مخصص)
  isSalesRep?: boolean; // هل يعمل كمندوب مبيعات
  commissionRate?: number;
  monthlySalesTarget?: number;
  salesTarget?: number;
  notes?: string;
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
  loanDeduction?: number;
  penaltyDeduction?: number;
  socialInsuranceDeduction: number;
  taxDeduction: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
  paymentMethod?: 'bank_transfer' | 'cash'; // طريقة الصرف (تحويل بنكي / نقداً)
  disbursementAccountId?: string; // حساب الصرف (1120 للبنك، 1110 للخزينة)
  disbursementAccountName?: string; // اسم حساب الصرف
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  date: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalCashDisbursement?: number; // إجمالي المنصرف نقداً من الخزينة
  totalBankDisbursement?: number; // إجمالي المنصرف عبر التحويلات البنكية
  employeesCount: number;
  status: 'draft' | 'approved' | 'posted_to_accounts';
  payslips: Payslip[];
}

// ==========================================
// HR ENTERPRISE MODULES (الموارد البشرية المتكاملة)
// ==========================================

// 1. الحضور والانصراف والورديات (Attendance & Shifts)
export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm e.g. "08:30"
  checkOut?: string; // HH:mm e.g. "17:00"
  status: 'present' | 'absent' | 'late' | 'excused' | 'leave';
  lateMinutes: number;
  overtimeHours: number;
  workShift?: 'morning' | 'evening' | 'flexible';
  notes?: string;
}

// 2. الإجازات والأذونات الرسمية (Leaves & Permissions)
export type LeaveType = 'annual' | 'sick' | 'casual' | 'unpaid' | 'maternity' | 'emergency';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  actionDate?: string;
  notes?: string;
  createdAt: string;
}

// 3. السلف والقروض والأقساط الشهرية (Loans & Advances)
export interface LoanInstallment {
  id: string;
  installmentNumber: number;
  month: number;
  year: number;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
  payrollRunId?: string;
}

export interface EmployeeLoan {
  id: string;
  loanNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  totalAmount: number;
  monthlyInstallment: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: string; // YYYY-MM-DD
  termMonths: number;
  reason?: string;
  status: 'active' | 'completed' | 'cancelled';
  installments: LoanInstallment[];
  createdAt: string;
}

// 4. الجزاءات والمكافآت (Penalties & Bonuses)
export type AdjustmentType = 'bonus' | 'reward' | 'penalty' | 'deduction';

export interface EmployeeAdjustment {
  id: string;
  adjustmentNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  type: AdjustmentType;
  amount: number;
  daysEquivalent?: number; // مثلاً خصم يوم أو مكافأة يومين
  date: string; // YYYY-MM-DD
  month: number;
  year: number;
  reason: string;
  status: 'pending' | 'applied_to_payroll';
  payrollRunId?: string;
  appliedDate?: string;
  createdAt: string;
}

// 5. العهد العينية والمالية (Custodies & Company Assets)
export type CustodyCategory = 'laptop' | 'mobile' | 'vehicle' | 'cash_advance' | 'keys' | 'tools' | 'device' | 'other';
export type CustodyStatus = 'delivered' | 'returned' | 'damaged' | 'lost';

export interface EmployeeCustody {
  id: string;
  custodyNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  itemName: string;
  category: CustodyCategory;
  serialNumber?: string;
  estimatedValue?: number;
  deliveredDate: string;
  expectedReturnDate?: string;
  returnedAt?: string;
  status: CustodyStatus;
  condition?: string; // الحالة عند التسليم
  returnCondition?: string; // الحالة عند الاسترجاع
  notes?: string;
  createdAt: string;
}

// 6. العقود ومكافأة نهاية الخدمة والوثائق (Contracts & Documents & Gratuity)
export interface EmployeeDocument {
  id: string;
  employeeId: string;
  title: string;
  category: 'national_id' | 'contract' | 'certificate' | 'medical' | 'military' | 'other';
  documentNumber?: string;
  expiryDate?: string;
  fileBase64?: string;
  fileName?: string;
  notes?: string;
  uploadedAt: string;
}

export interface EndOfServiceCalculation {
  employeeId: string;
  employeeName: string;
  hireDate: string;
  terminationDate: string;
  lastBasicSalary: number;
  lastGrossSalary: number;
  yearsOfService: number;
  monthsOfService: number;
  daysOfService: number;
  reason: 'resignation' | 'contract_end' | 'termination' | 'retirement' | 'death';
  gratuityAmount: number;
  leaveEncashmentAmount: number; // بدل رصيد الإجازات المتبقي
  pendingLoanBalance: number; // السلف المتبقية للخصم
  finalSettlementNet: number; // صافي مستحقات نهاية الخدمة
  calculatedAt: string;
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
  quotations?: SequenceConfig;
  salesOrders?: SequenceConfig;
}

// ----------------------------------------------------
// حافظة الشيكات وأوراق القبض والدفع (Post-Dated Cheques)
// ----------------------------------------------------
export type ChequeType = 'received' | 'issued'; // شيك وارد (أوراق قبض) أو شيك صادر (أوراق دفع)
export type ChequeStatus = 'in_portfolio' | 'under_collection' | 'collected' | 'bounced' | 'cancelled';

export interface ChequeItem {
  id: string;
  chequeNumber: string;
  type: ChequeType;
  amount: number;
  issueDate: string; // تاريخ التحرير
  dueDate: string; // تاريخ الاستحقاق
  partyType: 'customer' | 'vendor' | 'other';
  partyId?: string;
  partyName: string;
  bankName: string; // البنك المسحوب عليه
  branchName?: string; // الفرع
  depositBankAccountId?: string; // البنك المودع به للتحصيل
  depositBankAccountName?: string;
  status: ChequeStatus;
  statusDate?: string; // تاريخ آخر إجراء
  bounceReason?: string;
  journalEntryId?: string;
  receiptId?: string;
  invoiceId?: string;
  notes?: string;
  createdAt: string;
}

// ----------------------------------------------------
// التسوية البنكية ومطابقة كشوف الحساب (Bank Reconciliation)
// ----------------------------------------------------
export interface BankReconciliationItem {
  id: string; // معرف الحركة
  journalEntryId?: string;
  journalLineId?: string;
  date: string;
  reference: string;
  description: string;
  debit: number; // إيداع بالبنك
  credit: number; // سحب من البنك
  isCleared: boolean;
  clearedDate?: string;
}

export interface BankReconciliationAdjustment {
  id: string;
  type: 'bank_charge' | 'interest_income' | 'other';
  amount: number;
  description: string;
  date: string;
  journalEntryId?: string;
}

export interface BankReconciliationStatement {
  id: string;
  statementNumber: string;
  bankAccountId: string;
  bankAccountName: string;
  bankAccountCode: string;
  startDate: string;
  endDate: string;
  statementEndingBalance: number; // الرصيد حسب كشف حساب البنك الفعلي
  bookOpeningBalance: number; // الرصيد الدفتري الافتتاحي
  clearedDeposits: number; // إجمالي الإيداعات المطابقة
  clearedWithdrawals: number; // إجمالي السحوبات المطابقة
  clearedBalance: number; // الرصيد الدفتري المطابق
  difference: number; // الفارق
  status: 'draft' | 'completed';
  reconciledAt?: string;
  reconciledBy?: string;
  notes?: string;
  items: BankReconciliationItem[];
  adjustments?: BankReconciliationAdjustment[];
  createdAt: string;
}

// ----------------------------------------------------
// مراكز التكلفة والمشاريع (Cost Centers & Cost Allocation)
// ----------------------------------------------------
export type CostCenterCategory = 'project' | 'branch' | 'department' | 'activity' | 'general';

export interface CostCenter {
  id: string;
  code: string; // e.g. CC-101
  name: string;
  category: CostCenterCategory;
  parentCode?: string;
  manager?: string;
  budget?: number; // الميزانية التقديرية المعتمدة
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

// ----------------------------------------------------
// الأصول الثابتة وإهلاكها الآلي (Fixed Assets & Depreciation)
// ----------------------------------------------------
export type AssetCategory = 'vehicles' | 'computers' | 'machinery' | 'furniture' | 'buildings' | 'equipment' | 'other';
export type AssetDepreciationMethod = 'straight_line' | 'declining_balance';
export type AssetStatus = 'active' | 'fully_depreciated' | 'sold' | 'scrapped';

export interface FixedAsset {
  id: string;
  assetCode: string; // e.g. AST-001
  name: string;
  category: AssetCategory;
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number; // قيمة الخردة / النفاية
  usefulLifeMonths: number; // العمر الإنتاجي بالأشهر
  depreciationMethod: AssetDepreciationMethod;
  assetAccountId: string; // حساب الأصل (مثلاً 1230 مركبات)
  assetAccountCode?: string;
  assetAccountName?: string;
  accumulatedDepreciationAccountId: string; // حساب مجمع الإهلاك (1240)
  accumulatedDepreciationAccountCode?: string;
  accumulatedDepreciationAccountName?: string;
  depreciationExpenseAccountId: string; // حساب مصروف الإهلاك (5800)
  depreciationExpenseAccountCode?: string;
  depreciationExpenseAccountName?: string;
  costCenterId?: string; // ربط الأصل بمركز تكلفة / مشروع
  costCenterName?: string;
  currentDepreciation: number; // مجمع الإهلاك حتى الآن
  bookValue: number; // صافي القيمة الدفترية = purchaseCost - currentDepreciation
  monthlyDepreciation: number; // القسط الشهري
  lastDepreciationDate?: string;
  serialNumber?: string;
  location?: string;
  status: AssetStatus;
  notes?: string;
  createdAt: string;
}

export interface AssetDepreciationRun {
  id: string;
  runDate: string;
  periodMonth: string; // e.g. 2026-08
  totalDepreciationAmount: number;
  assetsCount: number;
  journalEntryId: string;
  journalEntryNumber: string;
  processedBy?: string;
  notes?: string;
  createdAt: string;
}

// ==========================================
// ITEM 4: PURCHASING & AP (المشتريات والموردين)
// ==========================================

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  receivedQuantity?: number;
  warehouseId?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  expectedDeliveryDate: string;
  warehouseId: string;
  warehouseName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  status: 'draft' | 'approved' | 'partially_received' | 'received' | 'billed' | 'cancelled';
  notes?: string;
  terms?: string;
  createdAt?: string;
}

export interface GoodsReceiptItem {
  productId: string;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  poId?: string;
  poNumber?: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  receivedBy: string;
  items: GoodsReceiptItem[];
  status: 'inspected' | 'accepted' | 'stored';
  notes?: string;
  createdAt?: string;
}

export interface LandedCostExpenseItem {
  id: string;
  type: 'freight' | 'customs' | 'clearance' | 'insurance' | 'handling' | 'other';
  name: string;
  amount: number;
  paymentAccountId: string;
  reference?: string;
}

export type LandedCostItem = LandedCostExpenseItem;

export interface LandedCostAllocatedItem {
  productId: string;
  productName: string;
  quantity: number;
  baseUnitCost: number;
  allocatedCostPerUnit: number;
  newUnitCost: number;
  totalAllocatedCost: number;
}

export type LandedCostAllocatedProduct = LandedCostAllocatedItem;

export interface LandedCostAllocation {
  id: string;
  costNumber: string;
  date: string;
  purchaseInvoiceId: string;
  invoiceNumber: string;
  vendorName: string;
  costs: LandedCostExpenseItem[];
  totalLandedCost: number;
  allocationMethod: 'value' | 'quantity';
  allocatedItems: LandedCostAllocatedItem[];
  journalEntryId?: string;
  notes?: string;
  createdAt?: string;
}

export interface PurchaseReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  batchNumber?: string;
  reason?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  purchaseInvoiceId?: string;
  invoiceNumber?: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  items: PurchaseReturnItem[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  refundMethod: 'vendor_credit' | 'cash' | 'bank';
  accountId?: string;
  journalEntryId?: string;
  notes?: string;
  status: 'completed';
  createdAt?: string;
}

export interface VendorAgingBucket {
  vendorId: string;
  vendorName: string;
  phone: string;
  currentTotal: number;
  days0to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
  oldestBillDate: string;
}

// ==========================================
// ITEM 5: CRM & DEBT COLLECTIONS (العملاء والتحصيل)
// ==========================================

export interface CollectionInstallment {
  id?: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'pending' | 'partially_paid' | 'partial' | 'paid' | 'overdue';
  receiptId?: string;
  paymentDate?: string;
  notes?: string;
}

export interface CollectionPlan {
  id: string;
  planNumber: string;
  customerId: string;
  customerName: string;
  totalDebt: number;
  totalAmount?: number;
  collectedAmount?: number;
  agreementDate?: string;
  startDate?: string;
  salesInvoiceId?: string;
  invoiceNumber?: string;
  installments: CollectionInstallment[];
  status: 'active' | 'completed' | 'defaulted' | 'overdue';
  notes?: string;
  createdAt?: string;
}

export interface CollectionReminder {
  id: string;
  customerId: string;
  customerName: string;
  phone?: string;
  planId?: string;
  channel: 'whatsapp' | 'phone' | 'email' | 'visit' | 'legal_notice' | 'sms' | 'phone_call';
  scheduledDate?: string;
  date?: string;
  dueAmount?: number;
  amountDue?: number;
  status: 'scheduled' | 'sent' | 'acknowledged' | 'ignored' | 'promised_payment' | 'disputed' | 'unreachable';
  promisedDate?: string;
  collectorName?: string;
  agentName?: string;
  notes?: string;
  messageText?: string;
  createdAt?: string;
}

export type CollectionReminderLog = CollectionReminder;

// ==========================================
// 6. إقفال الفترات والسنوات المالية (Fiscal Year Closing)
// ==========================================
export interface FiscalPeriod {
  id: string; // e.g. 'p-2025-01'
  fiscalYearId: string; // e.g. 'fy-2025'
  periodNumber: number; // 1 to 12
  name: string; // e.g. 'يناير 2025'
  startDate: string; // '2025-01-01'
  endDate: string; // '2025-01-31'
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  notes?: string;
}

export interface FiscalYear {
  id: string; // e.g. 'fy-2024', 'fy-2025', 'fy-2026'
  year: number; // 2025
  name: string; // 'السنة المالية 2025'
  startDate: string; // '2025-01-01'
  endDate: string; // '2025-12-31'
  status: 'open' | 'closed';
  closedAt?: string;
  closedBy?: string;
  retainedEarningsAccountId: string; // e.g. '3200'
  closingJournalEntryId?: string; // قيد الإقفال السنوي
  closingJournalEntryNumber?: string;
  openingJournalEntryId?: string; // القيد الافتتاحي للعام الجديد
  openingJournalEntryNumber?: string;
  netIncomeBeforeClosing?: number; // صافي الأرباح/الخسائر المحولة
  totalRevenueClosed?: number; // إجمالي الإيرادات المقفلة
  totalExpenseClosed?: number; // إجمالي المصروفات المقفلة
  periods: FiscalPeriod[];
  notes?: string;
}

// ==========================================
// 7. الموازنات التقديرية (Budgets vs. Actual)
// ==========================================
export interface BudgetItem {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  annualAmount: number;
  monthlyAmounts: number[]; // 12 numbers for months 1-12
  alertThresholdPercent?: number; // e.g. 90 or 100
  notes?: string;
}

export interface BudgetPlan {
  id: string; // e.g. 'bdg-2026'
  name: string; // e.g. 'الموازنة التقديرية المعتمدة لعام 2026'
  fiscalYear: number; // 2026
  startDate: string;
  endDate: string;
  costCenterId?: string; // optional link to specific cost center or 'all'
  costCenterName?: string;
  status: 'draft' | 'approved' | 'active';
  totalBudget: number;
  items: BudgetItem[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

// ==========================================
// 8. ورديات الكاشير والإغلاق اليومي (Z-Report)
// ==========================================
export interface CashierShift {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  initialCash: number; // رصيد بداية الدرج
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalEWallet: number;
  totalCredit: number;
  totalReturns: number;
  totalDiscounts: number;
  totalTax: number;
  invoiceCount: number;
  expectedCash: number; // النقدية المتوقعة بالدرج
  actualCash?: number; // النقدية الفعلية بعد الجرد
  difference?: number; // العجز أو الزيادة (actualCash - expectedCash)
  notes?: string;
  status: 'open' | 'closed';
  closedAt?: string;
}

// ==========================================
// 9. نظام الدردشة التفاعلية والمهام التشاركية (Team Chat & To-Do System)
// ==========================================
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus =
  | 'pending'                 // قيد الانتظار / جارية التنفيذ لدى المنفّذ
  | 'completed_by_assignee'   // أكد المنفّذ أنه أنجزها (في انتظار اعتماد ومراجعة الطالب)
  | 'approved'                // اعتمدها الطالب وتأكدت نهائياً وأرشفت
  | 'reopened';               // أعاد الطالب فتحها لعدم اكتمال التنفيذ

export interface TaskVerificationHistory {
  id: string;
  action: 'created' | 'marked_completed' | 'approved' | 'reopened';
  byUserId: string;
  byUserName: string;
  timestamp: string;
  notes?: string;
}

export interface EmployeeTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;

  // الطالب / منشئ المهمة
  createdByUserId: string;
  createdByUserName: string;
  createdByUserAvatar?: string;

  // الموظفون المكلفون بالتنفيذ (دعم التعيين الفردي والمتعدد)
  assignedToUserIds: string[];
  assignedToUserNames: string[];

  // التواريخ الزمنية
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  approvedAt?: string;

  // ملاحظات التنفيذ والاعتماد / الرفض
  completionNote?: string;  // ملاحظة يكتبها المنفّذ عند إنجاز المهمة
  rejectionReason?: string; // سبب الإعادة يكتبه الطالب إذا أعاد فتحها

  // السجل الزمني للتأكيدات (Audit Trail)
  history: TaskVerificationHistory[];

  // ربط اختياري بكيانات النظام (فاتورة، عميل، مورد، صنف)
  relatedEntityType?: 'invoice' | 'customer' | 'supplier' | 'product' | 'general';
  relatedEntityId?: string;
  relatedEntityName?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string; // 'general' أو `dm_${minId}_${maxId}`
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  text: string;
  timestamp: string;
  isSystemNotification?: boolean;
  taskId?: string; // إذا كانت الرسالة مرتبطة بمهمة
}

export interface ChatChannel {
  id: string;
  type: 'direct' | 'group';
  name: string;
  memberIds: string[];
  lastMessage?: string;
  lastMessageTime?: string;
}
