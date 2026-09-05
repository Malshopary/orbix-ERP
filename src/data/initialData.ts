import {
  Account,
  AppUser,
  CompanyProfile,
  Customer,
  Employee,
  ExchangeCurrency,
  GoogleSheetConfig,
  JournalEntry,
  PaymentReceipt,
  PriceList,
  Product,
  PurchaseInvoice,
  Quotation,
  SalesInvoice,
  SalesOrder,
  SalesRep,
  SalesReturn,
  SystemSequenceSettings,
  Vendor,
  Warehouse,
  StockTransfer,
  StocktakingSession,
  StockAdjustment,
  ScrapVoucher,
  ProductBatch,
  CRMLead,
  CRMInteraction,
  CRMTicket,
  LoyaltyTransaction,
  CommissionPayment,
  CommissionTier,
  ChequeItem,
  BankReconciliationStatement,
  CostCenter,
  FixedAsset,
  AssetDepreciationRun,
  PurchaseOrder,
  GoodsReceiptNote,
  LandedCostAllocation,
  PurchaseReturn,
  CollectionPlan,
  CollectionReminderLog,
  FiscalYear,
  FiscalPeriod,
  BudgetPlan,
  BudgetItem,
} from '../types';

export const INITIAL_CURRENCIES: ExchangeCurrency[] = [
  {
    code: 'EGP',
    name: 'جنيه مصري (EGP)',
    symbol: 'ج.م',
    rateToBase: 1.0,
    isBase: true,
  },
  {
    code: 'SAR',
    name: 'ريال سعودي (SAR)',
    symbol: 'ر.س',
    rateToBase: 13.33,
  },
  {
    code: 'AED',
    name: 'درهم إماراتي (AED)',
    symbol: 'د.إ',
    rateToBase: 13.61,
  },
  {
    code: 'USD',
    name: 'دولار أمريكي (USD)',
    symbol: '$',
    rateToBase: 50.0,
  },
  {
    code: 'EUR',
    name: 'يورو أوروبي (EUR)',
    symbol: '€',
    rateToBase: 54.50,
  },
  {
    code: 'KWD',
    name: 'دينار كويتي (KWD)',
    symbol: 'د.ك',
    rateToBase: 163.0,
  },
];

export const INITIAL_COMPANY_PROFILE: CompanyProfile = {
  nameAr: 'شركة أوربكس للحلول المتكاملة والتجارة',
  nameEn: 'ORBIX Integrated Solutions & Trading Co.',
  taxNumber: '30045678900003',
  commercialRegister: '1010456789',
  address: 'المقر الرئيسي - الإدارة العامة',
  city: 'القاهرة',
  phone: '0223456789',
  mobile: '01001234567',
  email: 'info@orbix-erp.com',
  website: 'www.orbix-erp.com',
  logoWidth: 160,
  logoHeight: 50,
  invoiceFooterNotes: 'شكراً لتعاملكم معنا. تخضع جميع التعاملات للوائح والأنظمة التجارية والضريبية المعمول بها.',
  defaultVatRate: 14,
  defaultCurrency: 'EGP',
};

// Start with empty users array - First-time Admin Registration Wizard will create the super admin
export const INITIAL_USERS: AppUser[] = [];

export const INITIAL_GOOGLE_SHEET_CONFIG: GoogleSheetConfig = {
  webhookUrl: '',
  sheetName: 'ERP_Invoices',
  autoSyncInvoices: false,
  autoSyncPayroll: false,
  autoSyncReceipts: false,
  lastSyncTime: '',
  lastSyncStatus: 'idle',
};

// دليل وشجرة الحسابات المحاسبية القياسية المتكاملة (الأصول، الخصوم، حقوق الملكية، الإيرادات، المصروفات)
export const INITIAL_ACCOUNTS: Account[] = [
  // 1. الأصول (Assets)
  { id: '1000', code: '1000', name: 'الأصول (Assets)', type: 'asset', balance: 0, isHeader: true },
  { id: '1100', code: '1100', name: 'الأصول المتداولة (Current Assets)', type: 'asset', parentCode: '1000', balance: 0, isHeader: true },
  { id: '1110', code: '1110', name: 'الخزينة النقدية الرئيسية (Cash in Hand)', type: 'asset', parentCode: '1100', balance: 0, description: 'النقدية المتاحة بالخزينة الرئيسية' },
  { id: '1120', code: '1120', name: 'الحساب البنكي الجاري الرئيسي (Commercial Bank)', type: 'asset', parentCode: '1100', balance: 0, description: 'حساب البنك الرئيسي للعمليات والتحويلات' },
  { id: '1125', code: '1125', name: 'المحافظ الإلكترونية والدفع الفوري (E-Wallets / InstaPay)', type: 'asset', parentCode: '1100', balance: 0, description: 'مدفوعات فورية ومحافظ رقمية' },
  { id: '1130', code: '1130', name: 'العملاء والمدينون (Accounts Receivable)', type: 'asset', parentCode: '1100', balance: 0, description: 'مستحقات وآجال العملاء' },
  { id: '1140', code: '1140', name: 'مخزون البضائع والمنتجات (Inventory)', type: 'asset', parentCode: '1100', balance: 0, description: 'تقييم المخزون الحالي بسعر التكلفة' },
  { id: '1150', code: '1150', name: 'ضريبة القيمة المضافة - مدخلات (VAT Input)', type: 'asset', parentCode: '1100', balance: 0, description: 'ضريبة مشتريات قابلة للخصم والاسترداد' },
  { id: '1160', code: '1160', name: 'أوراق القبض والشيكات تحت التحصيل (Notes Receivable)', type: 'asset', parentCode: '1100', balance: 0, description: 'شيكات وكمبيالات قيد التحصيل' },
  { id: '1170', code: '1170', name: 'سلف ومصروفات مقدمة (Prepaid Expenses & Advances)', type: 'asset', parentCode: '1100', balance: 0, description: 'مصروفات وسلف مدفوعة مقدماً' },
  
  { id: '1200', code: '1200', name: 'الأصول غير المتداولة / الثابتة (Fixed Assets)', type: 'asset', parentCode: '1000', balance: 0, isHeader: true },
  { id: '1210', code: '1210', name: 'أجهزة ومعدات ونقاط بيع POS (Equipment & POS)', type: 'asset', parentCode: '1200', balance: 0, description: 'أجهزة الحواسيب وشاشات اللمس وطابعات POS' },
  { id: '1220', code: '1220', name: 'أثاث وتجهيزات المقر (Office Furniture)', type: 'asset', parentCode: '1200', balance: 0, description: 'مكاتب ومقاعد وتجهيزات المقر' },
  { id: '1230', code: '1230', name: 'سيارات ووسائل نقل (Vehicles & Transportation)', type: 'asset', parentCode: '1200', balance: 0, description: 'سيارات نقل وتوزيع البضائع' },
  { id: '1240', code: '1240', name: 'مجمع الإهلاك المتراكم (Accumulated Depreciation)', type: 'asset', parentCode: '1200', balance: 0, description: 'مجمع إهلاك الأصول الثابتة' },

  // 2. الخصوم والالتزامات (Liabilities)
  { id: '2000', code: '2000', name: 'الخصوم والالتزامات (Liabilities)', type: 'liability', balance: 0, isHeader: true },
  { id: '2100', code: '2100', name: 'الخصوم المتداولة (Current Liabilities)', type: 'liability', parentCode: '2000', balance: 0, isHeader: true },
  { id: '2110', code: '2110', name: 'الموردون والدائنون (Accounts Payable)', type: 'liability', parentCode: '2100', balance: 0, description: 'مستحقات واجبة السداد للموردين' },
  { id: '2120', code: '2120', name: 'ضريبة القيمة المضافة - مخرجات (VAT Output)', type: 'liability', parentCode: '2100', balance: 0, description: 'ضريبة مبيعات واجبة التوريد لمصلحة الضرائب' },
  { id: '2130', code: '2130', name: 'مخصص الرواتب والأجور المستحقة (Accrued Payroll)', type: 'liability', parentCode: '2100', balance: 0, description: 'رواتب مستحقة قيد الصرف' },
  { id: '2140', code: '2140', name: 'أمانات التأمينات الاجتماعية والضرائب (Social Insurance & Tax Payable)', type: 'liability', parentCode: '2100', balance: 0, description: 'مستحقات التأمينات والضرائب العامة' },
  { id: '2150', code: '2150', name: 'أوراق الدفع والشيكات الآجلة (Notes Payable)', type: 'liability', parentCode: '2100', balance: 0, description: 'شيكات وكمبيالات مستحقة السداد' },
  { id: '2160', code: '2160', name: 'دفعات مقدمة من العملاء (Customer Advances)', type: 'liability', parentCode: '2100', balance: 0, description: 'عربونات ودفعات حجز مقدمة' },
  
  { id: '2200', code: '2200', name: 'الخصوم غير المتداولة / طويلة الأجل (Long-Term Liabilities)', type: 'liability', parentCode: '2000', balance: 0, isHeader: true },
  { id: '2210', code: '2210', name: 'قروض وتسهيلات بنكية طويلة الأجل (Long-term Loans)', type: 'liability', parentCode: '2200', balance: 0, description: 'تسهيلات ائتمانية وقروض متوسطة وطويلة الأجل' },

  // 3. حقوق الملكية (Equity)
  { id: '3000', code: '3000', name: 'حقوق الملكية (Equity)', type: 'equity', balance: 0, isHeader: true },
  { id: '3100', code: '3100', name: 'رأس المال المدفوع (Paid-in Capital)', type: 'equity', parentCode: '3000', balance: 0, description: 'رأس مال الشركة التأسيسي' },
  { id: '3200', code: '3200', name: 'الأرباح المدورة / المحتجزة (Retained Earnings)', type: 'equity', parentCode: '3000', balance: 0, description: 'أرباح السنوات السابقة المرحلة' },
  { id: '3300', code: '3300', name: 'جاري الشركاء / صاحب المنشأة (Owner/Partner Current Account)', type: 'equity', parentCode: '3000', balance: 0, description: 'مسحوبات وإيداعات الملاك' },
  { id: '3400', code: '3400', name: 'الاحتياطيات النظامية والاتفاقية (Reserves)', type: 'equity', parentCode: '3000', balance: 0, description: 'احتياطيات قانونية ونظامية' },

  // 4. الإيرادات والمبيعات (Revenue)
  { id: '4000', code: '4000', name: 'الإيرادات والمبيعات (Revenue)', type: 'revenue', balance: 0, isHeader: true },
  { id: '4100', code: '4100', name: 'إيراد مبيعات المنتجات ونقاط البيع POS (Sales Revenue)', type: 'revenue', parentCode: '4000', balance: 0, description: 'إجمالي المبيعات التجارية ونقاط البيع' },
  { id: '4200', code: '4200', name: 'إيرادات خدمات وصيانة واستشارات (Services & Maintenance Revenue)', type: 'revenue', parentCode: '4000', balance: 0, description: 'إيرادات التركيب والخدمات والصيانة' },
  { id: '4300', code: '4300', name: 'إيرادات وعوائد أخرى (Other Income)', type: 'revenue', parentCode: '4000', balance: 0, description: 'عوائد متنوعة غير تشغيلية' },
  { id: '4400', code: '4400', name: 'خصم مسموح به (Sales Discounts Allowed)', type: 'revenue', parentCode: '4000', balance: 0, description: 'خصومات المبيعات الممنوحة للعملاء' },

  // 5. المصروفات والتكاليف (Expenses)
  { id: '5000', code: '5000', name: 'المصروفات والتكاليف (Expenses)', type: 'expense', balance: 0, isHeader: true },
  { id: '5100', code: '5100', name: 'تكلفة البضاعة المباعة (Cost of Goods Sold - COGS)', type: 'expense', parentCode: '5000', balance: 0, description: 'تكلفة شراء وتوريد المنتجات المباعة' },
  { id: '5200', code: '5200', name: 'مصروفات الرواتب والأجور والبدلات (Salaries & Benefits Expense)', type: 'expense', parentCode: '5000', balance: 0, description: 'رواتب وبدلات وحوافز العاملين' },
  { id: '5300', code: '5300', name: 'مصروفات الإيجار والمرافق (Rent & Utilities)', type: 'expense', parentCode: '5000', balance: 0, description: 'إيجار المقرات والكهرباء والمياه والإنترنت' },
  { id: '5400', code: '5400', name: 'مصروفات التسويق والدعاية والإعلان (Marketing & Advertising)', type: 'expense', parentCode: '5000', balance: 0, description: 'حملات إعلانية ودعاية ومطبوعات' },
  { id: '5500', code: '5500', name: 'مصروفات الشحن والتوصيل والانتقالات (Shipping & Transportation)', type: 'expense', parentCode: '5000', balance: 0, description: 'نقل وشحن بضائع ومصاريف سفر' },
  { id: '5600', code: '5600', name: 'مصروفات صيانة واستهلاكات مكتبية (Maintenance & Office Supplies)', type: 'expense', parentCode: '5000', balance: 0, description: 'أدوات مكتبية وصيانة أجهزة' },
  { id: '5700', code: '5700', name: 'مصروفات بنكية ورسوم دفع إلكتروني (Bank & Processing Fees)', type: 'expense', parentCode: '5000', balance: 0, description: 'عمولات تحويلات بنكية وبوابات دفع' },
  { id: '5800', code: '5800', name: 'إهلاك الأصول الثابتة (Depreciation Expense)', type: 'expense', parentCode: '5000', balance: 0, description: 'مصروف إهلاك الأصول السنوي' },
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    code: 'WH-01',
    name: 'المستودع الرئيسي - القاهرة (Main Warehouse)',
    location: 'المنطقة الصناعية - مدينة نصر',
    governorate: 'القاهرة',
    manager: 'م. حسام الدين عبد الله',
    phone: '01012345678',
    capacity: '5,000 م³',
    isMain: true,
    isActive: true,
    notes: 'المستودع المركزي لاستقبال وتفريغ الشحنات والتوزيع على باقي الفروع والموزعين',
  },
  {
    id: 'wh-2',
    code: 'WH-02',
    name: 'مستودع فرع الإسكندرية (Alexandria Hub)',
    location: 'سموحة - المنطقة اللوجستية',
    governorate: 'الإسكندرية',
    manager: 'أ. طارق عبد الرحمن',
    phone: '01123456789',
    capacity: '2,200 م³',
    isMain: false,
    isActive: true,
    notes: 'مستودع إقليمي لتغذية قطاع وجه بحري ومحافظات الساحل',
  },
  {
    id: 'wh-3',
    code: 'WH-03',
    name: 'مخزن صالة العرض والمبيعات (Showroom & POS)',
    location: 'المقر التجاري - صالة البيع',
    governorate: 'القاهرة',
    manager: 'أ. سامح فؤاد',
    phone: '01234567890',
    capacity: '600 م³',
    isMain: false,
    isActive: true,
    notes: 'مخزن المنتجات المعروضة المخصصة للبيع المباشر والفوري بنقاط البيع POS',
  },
  {
    id: 'wh-4',
    code: 'WH-04',
    name: 'مستودع المرتجعات والتوالف (Damaged & Returns)',
    location: 'المقر الرئيسي - مبنى ملحق ب',
    governorate: 'القاهرة',
    manager: 'أ. مصطفى كمال',
    phone: '01099887766',
    capacity: '350 م³',
    isMain: false,
    isActive: true,
    notes: 'مخزن عزل البضائع المعيبة، المرتجعة، أو منتهية الصلاحية للفحص الفني والتسوية',
  },
];

export const INITIAL_STOCK_TRANSFERS: StockTransfer[] = [];
export const INITIAL_STOCKTAKING_SESSIONS: StocktakingSession[] = [];
export const INITIAL_STOCK_ADJUSTMENTS: StockAdjustment[] = [];
export const INITIAL_SCRAP_VOUCHERS: ScrapVoucher[] = [];
export const INITIAL_PRODUCT_BATCHES: ProductBatch[] = [];

// Clean Operational Tables (Ready for new user data)
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_SALES_REPS: SalesRep[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-walkin',
    code: 'CUST-000',
    name: 'عميل نقدي سريع (Walk-in Customer)',
    companyName: 'مبيعات نقدية فورية POS',
    phone: '',
    email: '',
    address: 'الفرع الرئيسي - مبيعات مباشرة',
    creditLimit: 0,
    paymentTermsDays: 0,
    currentBalance: 0,
    status: 'active',
    notes: 'عميل افتراضي لحركات نقاط البيع النقدية السريعة',
    loyaltyPoints: 0,
  },
];

export const INITIAL_VENDORS: Vendor[] = [];

export const INITIAL_INVOICES: SalesInvoice[] = [];

export const INITIAL_PURCHASES: PurchaseInvoice[] = [];

export const INITIAL_RECEIPTS: PaymentReceipt[] = [];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_PRICE_LISTS: PriceList[] = [
  {
    id: 'pl-retail',
    name: 'قائمة أسعار التجزئة (الافتراضية)',
    isDefault: true,
    adjustmentType: 'discount',
    adjustmentValueType: 'percentage',
    adjustmentValue: 0,
    items: [],
    description: 'قائمة الأسعار الأساسية الافتراضية للبيع بالتجزئة',
  },
  {
    id: 'pl-wholesale',
    name: 'قائمة أسعار الجملة (-10%)',
    isDefault: false,
    adjustmentType: 'discount',
    adjustmentValueType: 'percentage',
    adjustmentValue: 10,
    discountPercent: 10,
    items: [],
    description: 'خصم 10% تلقائي لعملاء الجملة والتوزيع',
  },
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];

export const INITIAL_SALES_RETURNS: SalesReturn[] = [];

export const INITIAL_QUOTATIONS: Quotation[] = [];

export const INITIAL_SALES_ORDERS: SalesOrder[] = [];

export const INITIAL_SEQUENCE_SETTINGS: SystemSequenceSettings = {
  invoices: {
    prefix: 'INV-2026-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
  purchaseInvoices: {
    prefix: 'PUR-2026-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
  products: {
    prefix: 'PRD-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
  customers: {
    prefix: 'CUST-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
  vendors: {
    prefix: 'VND-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
  employees: {
    prefix: 'EMP-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
  salesReps: {
    prefix: 'REP-',
    nextNumber: 1,
    padLength: 2,
    autoIncrement: true,
  },
  journalEntries: {
    prefix: 'JV-2026-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
  accounts: {
    prefix: '101',
    nextNumber: 1,
    padLength: 2,
    autoIncrement: true,
  },
  salesReturns: {
    prefix: 'RET-2026-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
  quotations: {
    prefix: 'QUO-2026-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
  salesOrders: {
    prefix: 'SO-2026-',
    nextNumber: 1,
    padLength: 4,
    autoIncrement: true,
  },
};

export const INITIAL_CRM_LEADS: CRMLead[] = [];

export const INITIAL_CRM_INTERACTIONS: CRMInteraction[] = [];

export const INITIAL_CRM_TICKETS: CRMTicket[] = [];

export const INITIAL_LOYALTY_TRANSACTIONS: LoyaltyTransaction[] = [];

export const INITIAL_COMMISSION_PAYMENTS: CommissionPayment[] = [];

export const INITIAL_COMMISSION_TIERS: CommissionTier[] = [
  {
    id: 'tier-1',
    name: 'شريحة الأساسي (مبيعات حتى 50,000)',
    minSales: 0,
    maxSales: 50000,
    ratePercentage: 2.5,
    bonusAmount: 0,
  },
  {
    id: 'tier-2',
    name: 'شريحة الفضي (مبيعات 50,001 إلى 100,000)',
    minSales: 50001,
    maxSales: 100000,
    ratePercentage: 3.5,
    bonusAmount: 1000,
  },
  {
    id: 'tier-3',
    name: 'شريحة الذهبي والرواد (أكثر من 100,000)',
    minSales: 100001,
    maxSales: 9999999,
    ratePercentage: 5.0,
    bonusAmount: 3000,
  },
];

export const INITIAL_JOB_TITLES: string[] = [
  'المدير العام والتنفيذي (CEO)',
  'مدير الحسابات والمالية (CFO)',
  'محاسب عام أول',
  'محاسب مبيعات وعملاء',
  'محاسب مشتريات وموردين',
  'أمين خزينة ومسؤول بنوك',
  'مدير المبيعات والتسويق',
  'مشرف مبيعات قطاع الشركات',
  'مندوب مبيعات خارجي',
  'مندوب مبيعات وتوزيع',
  'كاشير ومسؤول نقطة بيع POS',
  'مدير الموارد البشرية (HRM)',
  'أخصائي شؤون موظفين ورواتب',
  'مسؤول توظيف واستقطاب كفاءات',
  'مدير المخازن والعمليات اللوجستية',
  'أمين مستودع ومراقب مخزون',
  'مدير المشتريات والتوريدات',
  'أخصائي مشتريات ومناقصات',
  'مهندس برمجيات وتطوير نظم',
  'مسؤول الدعم الفني وتقنية المعلومات',
  'مدير خدمة العملاء والدعم الفني',
  'مسؤول متابعة وتحصيل ديون',
  'أخصائي تسويق رقمي وعلاقات عامة',
  'سائق مندوب توصيل',
];

export const INITIAL_DEPARTMENTS: string[] = [
  'الإدارة المالية والمحاسبة',
  'إدارة المبيعات والتسويق',
  'الموارد البشرية والشؤون الإدارية',
  'إدارة المخازن والمستودعات واللوجستيات',
  'إدارة المشتريات وسلاسل الإمداد',
  'تقنية المعلومات والتحول الرقمي (IT)',
  'خدمة العملاء ورعاية المستفيدين',
  'الشؤون القانونية والامتثال',
  'الإدارة التنفيذية والرقابة العامة',
  'إدارة التحصيل والائتمان',
];

// ----------------------------------------------------
// بيانات أولية واقعية لحافظة الشيكات وأوراق القبض والدفع
// ----------------------------------------------------
export const INITIAL_CHEQUES: ChequeItem[] = [
  {
    id: 'chq-001',
    chequeNumber: 'CHQ-882910',
    type: 'received',
    amount: 35000,
    issueDate: '2026-08-15',
    dueDate: '2026-09-10',
    partyType: 'customer',
    partyId: 'cust-1',
    partyName: 'مؤسسة الأمل للتجارة والمقاولات',
    bankName: 'البنك الأهلي المصري',
    branchName: 'فرع مدينة نصر',
    depositBankAccountId: '1120',
    depositBankAccountName: 'الحساب البنكي الجاري الرئيسي (Commercial Bank)',
    status: 'under_collection',
    statusDate: '2026-08-20',
    notes: 'شيك سداد دفعة عن فاتورة مبيعات INV-2026-001',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'chq-002',
    chequeNumber: 'CHQ-445129',
    type: 'received',
    amount: 18500,
    issueDate: '2026-08-25',
    dueDate: '2026-09-05',
    partyType: 'customer',
    partyId: 'cust-2',
    partyName: 'شركة النور للأجهزة الإلكترونية',
    bankName: 'بنك مصر',
    branchName: 'فرع مصر الجديدة',
    status: 'in_portfolio',
    notes: 'شيك مؤجل بخزينة الشركة بانتظار الإيداع بالبنك',
    createdAt: '2026-08-25T11:30:00Z',
  },
  {
    id: 'chq-003',
    chequeNumber: 'CHQ-991204',
    type: 'received',
    amount: 52000,
    issueDate: '2026-07-20',
    dueDate: '2026-08-15',
    partyType: 'customer',
    partyId: 'cust-3',
    partyName: 'مجموعة الفا للخدمات العامة',
    bankName: 'البنك التجاري الدولي (CIB)',
    branchName: 'فرع التجمع الخامس',
    depositBankAccountId: '1120',
    depositBankAccountName: 'الحساب البنكي الجاري الرئيسي (Commercial Bank)',
    status: 'collected',
    statusDate: '2026-08-16',
    notes: 'تم تحصيل الشيك وإضافته لحساب البنك بنجاح',
    createdAt: '2026-07-20T09:15:00Z',
  },
  {
    id: 'chq-004',
    chequeNumber: 'CHQ-331092',
    type: 'received',
    amount: 12000,
    issueDate: '2026-08-01',
    dueDate: '2026-08-28',
    partyType: 'customer',
    partyId: 'cust-4',
    partyName: 'شركة أفق المستقبل للاستيراد والتصدير',
    bankName: 'بنك قطر الوطني الأهلي (QNB)',
    branchName: 'فرع المعادي',
    status: 'bounced',
    statusDate: '2026-08-29',
    bounceReason: 'عدم كفاية الرصيد لدى الساحب',
    notes: 'تم إخطار العميل هاتفياً لإعادة السداد نقداً أو استبدال الشيك',
    createdAt: '2026-08-01T14:20:00Z',
  },
  {
    id: 'chq-005',
    chequeNumber: 'CHQ-ISS-1002',
    type: 'issued',
    amount: 45000,
    issueDate: '2026-08-10',
    dueDate: '2026-09-15',
    partyType: 'vendor',
    partyId: 'vend-1',
    partyName: 'شركة التوريدات العالمية للتجهيزات',
    bankName: 'الحساب البنكي الجاري الرئيسي (Commercial Bank)',
    branchName: 'شيك مسحوب على حساب شركتنا بالبنك التجاري',
    status: 'in_portfolio',
    notes: 'أوراق دفع - شيك آجل للمورد عن فاتورة مشتريات رقم PINV-2026-001',
    createdAt: '2026-08-10T12:00:00Z',
  },
];

// ----------------------------------------------------
// بيانات أولية لجلسات التسوية البنكية السابقة
// ----------------------------------------------------
export const INITIAL_BANK_RECONCILIATIONS: BankReconciliationStatement[] = [
  {
    id: 'recon-001',
    statementNumber: 'BR-2026-08',
    bankAccountId: '1120',
    bankAccountName: 'الحساب البنكي الجاري الرئيسي (Commercial Bank)',
    bankAccountCode: '1120',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    statementEndingBalance: 245800,
    bookOpeningBalance: 180000,
    clearedDeposits: 115800,
    clearedWithdrawals: 50000,
    clearedBalance: 245800,
    difference: 0,
    status: 'completed',
    reconciledAt: '2026-08-31T17:00:00Z',
    reconciledBy: 'محاسب الخزينة والبنوك',
    notes: 'تمت مطابقة كشف حساب بنك CIB عن شهر أغسطس 2026 بنجاح دون أي فروقات.',
    items: [
      {
        id: 'rec-item-1',
        date: '2026-08-05',
        reference: 'DEP-8801',
        description: 'إيداع نقدي مبيعات نقدية الأسبوع الأول',
        debit: 63800,
        credit: 0,
        isCleared: true,
        clearedDate: '2026-08-06',
      },
      {
        id: 'rec-item-2',
        date: '2026-08-16',
        reference: 'CHQ-991204',
        description: 'تحصيل شيك مقاصة من مجموعة الفا',
        debit: 52000,
        credit: 0,
        isCleared: true,
        clearedDate: '2026-08-16',
      },
      {
        id: 'rec-item-3',
        date: '2026-08-20',
        reference: 'TRF-5501',
        description: 'تحويل بنكي سداد دفعة مورد التوريدات',
        debit: 0,
        credit: 50000,
        isCleared: true,
        clearedDate: '2026-08-20',
      },
    ],
    adjustments: [
      {
        id: 'adj-1',
        type: 'bank_charge',
        amount: 250,
        description: 'مصروفات كشف حساب وعمولات بنكية',
        date: '2026-08-31',
      },
    ],
    createdAt: '2026-08-31T16:30:00Z',
  },
];

// ----------------------------------------------------
// بيانات أولية لمراكز التكلفة والمشاريع (Cost Centers)
// ----------------------------------------------------
export const INITIAL_COST_CENTERS: CostCenter[] = [
  {
    id: 'cc-01',
    code: 'CC-101',
    name: 'مشروع أبراج النرجس الجديدة',
    category: 'project',
    manager: 'م. حسام الدين عبد الرحمن',
    budget: 250000,
    startDate: '2026-01-15',
    endDate: '2026-12-31',
    isActive: true,
    notes: 'مشروع توريد وتركيب المقاولات الكهربائية وأنظمة الحماية',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'cc-02',
    code: 'CC-102',
    name: 'فرع المعادي والتوزيع المركزي',
    category: 'branch',
    manager: 'أ. طارق إبراهيم الصاوي',
    budget: 180000,
    startDate: '2026-01-01',
    isActive: true,
    notes: 'مركز تكلفة تشغيلي لنفقات وإيرادات معرض ومستودع المعادي',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'cc-03',
    code: 'CC-103',
    name: 'إدارة التسويق الرقمي والحملات',
    category: 'department',
    manager: 'أ. سارة المنشاوي',
    budget: 95000,
    startDate: '2026-02-01',
    isActive: true,
    notes: 'مخصصات الإعلانات الممولة والمعارض والترويج الفصلي',
    createdAt: '2026-02-01T09:30:00Z',
  },
  {
    id: 'cc-04',
    code: 'CC-104',
    name: 'أسطول النقل والشحن السريع',
    category: 'activity',
    manager: 'أ. محمود عبد الهادي',
    budget: 120000,
    startDate: '2026-01-01',
    isActive: true,
    notes: 'تكاليف الوقود والصيانة وتراخيص الشاحنات والتوريد للعملاء',
    createdAt: '2026-01-01T10:00:00Z',
  },
];

// ----------------------------------------------------
// بيانات أولية لسجل الأصول الثابتة (Fixed Assets)
// ----------------------------------------------------
export const INITIAL_FIXED_ASSETS: FixedAsset[] = [
  {
    id: 'ast-01',
    assetCode: 'AST-001',
    name: 'شاحنة توزيع بضائع ميتسوبيشي كانتر 2023',
    category: 'vehicles',
    purchaseDate: '2024-01-15',
    purchaseCost: 850000,
    salvageValue: 150000,
    usefulLifeMonths: 60, // 5 سنوات
    depreciationMethod: 'straight_line',
    assetAccountId: '1230',
    assetAccountCode: '1230',
    assetAccountName: 'مركبات وسيارات نقل',
    accumulatedDepreciationAccountId: '1240',
    accumulatedDepreciationAccountCode: '1240',
    accumulatedDepreciationAccountName: 'مجمع الإهلاك المتراكم',
    depreciationExpenseAccountId: '5800',
    depreciationExpenseAccountCode: '5800',
    depreciationExpenseAccountName: 'إهلاك الأصول الثابتة',
    costCenterId: 'cc-04',
    costCenterName: 'أسطول النقل والشحن السريع',
    currentDepreciation: 350000,
    bookValue: 500000,
    monthlyDepreciation: 11666.67,
    lastDepreciationDate: '2026-07-31',
    serialNumber: 'VIN-MTS-992014882',
    location: 'جراج المقر الرئيسي - المعادي',
    status: 'active',
    notes: 'شاحنة لنقل وتوزيع طلبيات كبار العملاء بين المستودعات',
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'ast-02',
    assetCode: 'AST-002',
    name: 'مجموعة خوادم رئيسية Dell PowerEdge R750',
    category: 'computers',
    purchaseDate: '2025-03-10',
    purchaseCost: 240000,
    salvageValue: 20000,
    usefulLifeMonths: 36, // 3 سنوات
    depreciationMethod: 'straight_line',
    assetAccountId: '1220',
    assetAccountCode: '1220',
    assetAccountName: 'أجهزة حاسوب وتقنية معلومات',
    accumulatedDepreciationAccountId: '1240',
    accumulatedDepreciationAccountCode: '1240',
    accumulatedDepreciationAccountName: 'مجمع الإهلاك المتراكم',
    depreciationExpenseAccountId: '5800',
    depreciationExpenseAccountCode: '5800',
    depreciationExpenseAccountName: 'إهلاك الأصول الثابتة',
    costCenterId: 'cc-02',
    costCenterName: 'فرع المعادي والتوزيع المركزي',
    currentDepreciation: 103888.89,
    bookValue: 136111.11,
    monthlyDepreciation: 6111.11,
    lastDepreciationDate: '2026-07-31',
    serialNumber: 'SRV-DLL-77192-A',
    location: 'غرفة السيرفرات والتبريد - الطابق الثاني',
    status: 'active',
    notes: 'سيرفرات استضافة قواعد بيانات وأنظمة الشركة المركزية',
    createdAt: '2025-03-10T10:30:00Z',
  },
  {
    id: 'ast-03',
    assetCode: 'AST-003',
    name: 'أثاث وتجهيزات قاعات الاجتماعات والمكاتب الفاخرة',
    category: 'furniture',
    purchaseDate: '2024-06-01',
    purchaseCost: 160000,
    salvageValue: 10000,
    usefulLifeMonths: 60,
    depreciationMethod: 'straight_line',
    assetAccountId: '1210',
    assetAccountCode: '1210',
    assetAccountName: 'أثاث وتجهيزات مكتبية',
    accumulatedDepreciationAccountId: '1240',
    accumulatedDepreciationAccountCode: '1240',
    accumulatedDepreciationAccountName: 'مجمع الإهلاك المتراكم',
    depreciationExpenseAccountId: '5800',
    depreciationExpenseAccountCode: '5800',
    depreciationExpenseAccountName: 'إهلاك الأصول الثابتة',
    costCenterId: 'cc-02',
    costCenterName: 'فرع المعادي والتوزيع المركزي',
    currentDepreciation: 65000,
    bookValue: 95000,
    monthlyDepreciation: 2500,
    lastDepreciationDate: '2026-07-31',
    serialNumber: 'FRN-EXE-2024-SET',
    location: 'الإدارة العامة والمكاتب التنفيذية',
    status: 'active',
    notes: 'طاولات اجتماعات وكراسي مكتبية وأطقم استقبال جلدية',
    createdAt: '2024-06-01T11:00:00Z',
  },
];

// ----------------------------------------------------
// سجل دورات إهلاك الأصول السابقة
// ----------------------------------------------------
export const INITIAL_ASSET_DEPRECIATION_RUNS: AssetDepreciationRun[] = [
  {
    id: 'dep-run-001',
    runDate: '2026-07-31',
    periodMonth: '2026-07',
    totalDepreciationAmount: 20277.78,
    assetsCount: 3,
    journalEntryId: 'je-dep-0726',
    journalEntryNumber: 'JE-DEP-2026-07',
    processedBy: 'المدير المالي',
    notes: 'إهلاك الأصول الثابتة لشهر يوليو 2026',
    createdAt: '2026-07-31T17:00:00Z',
  },
];

// ----------------------------------------------------
// بيانات أوامر الشراء (Purchase Orders)
// ----------------------------------------------------
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-2026-001',
    poNumber: 'PO-2026-0001',
    vendorId: 'v-al-bustan',
    vendorName: 'شركة البستان للتوريدات والتجارة الدولية',
    date: '2026-08-15',
    expectedDeliveryDate: '2026-08-25',
    warehouseId: 'wh-main',
    warehouseName: 'المستودع الرئيسي - المنطقة الصناعية',
    items: [
      {
        productId: 'prd-01',
        productName: 'حاسوب محمول فائق الأداء Core i7 16GB',
        quantity: 15,
        unitPrice: 22000,
        total: 330000,
        receivedQuantity: 15,
      },
      {
        productId: 'prd-02',
        productName: 'شاشة عرض ذكية 4K فائقة الوضوح 55 بوصة',
        quantity: 10,
        unitPrice: 11500,
        total: 115000,
        receivedQuantity: 10,
      },
    ],
    subtotal: 445000,
    vatTotal: 62300,
    grandTotal: 507300,
    status: 'billed',
    notes: 'توريد دفعة حواسيب وشاشات عرض للمخزن الرئيسي',
    terms: 'السداد خلال 30 يوم من تاريخ استلام محضر الفحص الفني والمطابقة الثلاثية',
    createdAt: '2026-08-15T09:30:00Z',
  },
  {
    id: 'po-2026-002',
    poNumber: 'PO-2026-0002',
    vendorId: 'v-delta-logistics',
    vendorName: 'مؤسسة دلتا لمهمات الشبكات والاتصالات',
    date: '2026-08-28',
    expectedDeliveryDate: '2026-09-08',
    warehouseId: 'wh-main',
    warehouseName: 'المستودع الرئيسي - المنطقة الصناعية',
    items: [
      {
        productId: 'prd-03',
        productName: 'طابعة باركود حرارية احترافية USB/LAN',
        quantity: 25,
        unitPrice: 3200,
        total: 80000,
        receivedQuantity: 20,
      },
    ],
    subtotal: 80000,
    vatTotal: 11200,
    grandTotal: 91200,
    status: 'partially_received',
    notes: 'توريد طابعات باركود لنقاط البيع والفروع',
    terms: 'سداد 50% دفعة مقدمة والباقي بعد الاستلام المخزني التام',
    createdAt: '2026-08-28T11:15:00Z',
  },
  {
    id: 'po-2026-003',
    poNumber: 'PO-2026-0003',
    vendorId: 'v-oriental-group',
    vendorName: 'مجموعة الشرق للتجهيزات المكتبية والتكنولوجية',
    date: '2026-09-01',
    expectedDeliveryDate: '2026-09-12',
    warehouseId: 'wh-maadi',
    warehouseName: 'مستودع فرع المعادي',
    items: [
      {
        productId: 'prd-04',
        productName: 'قارئ باركود لاسلكي ثنائي الأبعاد 2D QR Scanner',
        quantity: 30,
        unitPrice: 1200,
        total: 36000,
        receivedQuantity: 0,
      },
    ],
    subtotal: 36000,
    vatTotal: 5040,
    grandTotal: 41040,
    status: 'approved',
    notes: 'طلب عاجل لتغطية عجز قارئات الباركود بالمخازن',
    terms: 'الدفع عند التوريد بشيك بنكي مسحوب',
    createdAt: '2026-09-01T14:00:00Z',
  },
];

// ----------------------------------------------------
// أذونات الاستلام المخزني (Goods Receipt Notes - GRN)
// ----------------------------------------------------
export const INITIAL_GOODS_RECEIPTS: GoodsReceiptNote[] = [
  {
    id: 'grn-2026-001',
    grnNumber: 'GRN-2026-0001',
    poId: 'po-2026-001',
    poNumber: 'PO-2026-0001',
    vendorId: 'v-al-bustan',
    vendorName: 'شركة البستان للتوريدات والتجارة الدولية',
    warehouseId: 'wh-main',
    warehouseName: 'المستودع الرئيسي - المنطقة الصناعية',
    date: '2026-08-24',
    receivedBy: 'أمين المستودع الرئيسي - محمود عبد الرحمن',
    items: [
      {
        productId: 'prd-01',
        productName: 'حاسوب محمول فائق الأداء Core i7 16GB',
        orderedQuantity: 15,
        receivedQuantity: 15,
        acceptedQuantity: 15,
        rejectedQuantity: 0,
        unitPrice: 22000,
        batchNumber: 'BATCH-2026-LP01',
        notes: 'تم فحص جميع الأجهزة وتجربتها بنجاح',
      },
      {
        productId: 'prd-02',
        productName: 'شاشة عرض ذكية 4K فائقة الوضوح 55 بوصة',
        orderedQuantity: 10,
        receivedQuantity: 10,
        acceptedQuantity: 10,
        rejectedQuantity: 0,
        unitPrice: 11500,
        batchNumber: 'BATCH-2026-SC01',
        notes: 'شاشات سليمة تماماً ومطابقة للمواصفات القياسية',
      },
    ],
    status: 'stored',
    notes: 'استلام كامل وتخزين البضاعة بالرفوف المخصصة',
    createdAt: '2026-08-24T13:45:00Z',
  },
  {
    id: 'grn-2026-002',
    grnNumber: 'GRN-2026-0002',
    poId: 'po-2026-002',
    poNumber: 'PO-2026-0002',
    vendorId: 'v-delta-logistics',
    vendorName: 'مؤسسة دلتا لمهمات الشبكات والاتصالات',
    warehouseId: 'wh-main',
    warehouseName: 'المستودع الرئيسي - المنطقة الصناعية',
    date: '2026-09-02',
    receivedBy: 'أمين المستودع - خالد إبراهيم',
    items: [
      {
        productId: 'prd-03',
        productName: 'طابعة باركود حرارية احترافية USB/LAN',
        orderedQuantity: 25,
        receivedQuantity: 22,
        acceptedQuantity: 20,
        rejectedQuantity: 2,
        unitPrice: 3200,
        batchNumber: 'BATCH-2026-PR02',
        notes: 'تم رفض قطعتين لوجود كسر بالهيكل الخارجي أثناء الشحن',
      },
    ],
    status: 'accepted',
    notes: 'استلام جزئي لدفعة الطابعات ورفض قطعتين تالفتين لإعادتهما للمورد',
    createdAt: '2026-09-02T10:20:00Z',
  },
];

// ----------------------------------------------------
// تكاليف الشحن والجمارك الإضافية (Landed Costs Allocation)
// ----------------------------------------------------
export const INITIAL_LANDED_COSTS: LandedCostAllocation[] = [
  {
    id: 'lc-2026-001',
    costNumber: 'LC-2026-0001',
    date: '2026-08-26',
    purchaseInvoiceId: 'bill-001',
    invoiceNumber: 'BILL-2026-0001',
    vendorName: 'شركة البستان للتوريدات والتجارة الدولية',
    costs: [
      {
        id: 'c-1',
        type: 'freight',
        name: 'مصاريف شحن ونقل بري مؤمن',
        amount: 8500,
        paymentAccountId: '1110',
        reference: 'TRK-98442',
      },
      {
        id: 'c-2',
        type: 'customs',
        name: 'رسوم جمركية وتخليص بضائع',
        amount: 14200,
        paymentAccountId: '1120',
        reference: 'CUS-2026-778',
      },
      {
        id: 'c-3',
        type: 'handling',
        name: 'أجور تفريغ وعتالة وتخزين أولي',
        amount: 2300,
        paymentAccountId: '1110',
        reference: 'HDL-092',
      },
    ],
    totalLandedCost: 25000,
    allocationMethod: 'value',
    allocatedItems: [
      {
        productId: 'prd-01',
        productName: 'حاسوب محمول فائق الأداء Core i7 16GB',
        quantity: 15,
        baseUnitCost: 22000,
        allocatedCostPerUnit: 1236,
        newUnitCost: 23236,
        totalAllocatedCost: 18540,
      },
      {
        productId: 'prd-02',
        productName: 'شاشة عرض ذكية 4K فائقة الوضوح 55 بوصة',
        quantity: 10,
        baseUnitCost: 11500,
        allocatedCostPerUnit: 646,
        newUnitCost: 12146,
        totalAllocatedCost: 6460,
      },
    ],
    journalEntryId: 'je-lc-001',
    notes: 'توزيع تكاليف الشحن والجمارك على شحنة الحواسيب والشاشات لزيادة دقة تكلفة الوحدة المخزنية',
    createdAt: '2026-08-26T16:00:00Z',
  },
];

// ----------------------------------------------------
// مردودات المشتريات وإشعارات الخصم (Purchase Returns / Debit Notes)
// ----------------------------------------------------
export const INITIAL_PURCHASE_RETURNS: PurchaseReturn[] = [
  {
    id: 'pr-2026-001',
    returnNumber: 'PR-2026-0001',
    purchaseInvoiceId: 'bill-002',
    invoiceNumber: 'BILL-2026-0002',
    vendorId: 'v-delta-logistics',
    vendorName: 'مؤسسة دلتا لمهمات الشبكات والاتصالات',
    warehouseId: 'wh-main',
    warehouseName: 'المستودع الرئيسي - المنطقة الصناعية',
    date: '2026-09-03',
    items: [
      {
        productId: 'prd-03',
        productName: 'طابعة باركود حرارية احترافية USB/LAN',
        quantity: 2,
        unitPrice: 3200,
        total: 6400,
        batchNumber: 'BATCH-2026-PR02',
        reason: 'تلف بالهيكل الخارجي وكسر أثناء النقل البري',
      },
    ],
    subtotal: 6400,
    vatTotal: 896,
    grandTotal: 7296,
    refundMethod: 'vendor_credit',
    journalEntryId: 'je-pr-001',
    notes: 'إشعار مدين للمورد وتخفيض مديونية المورد بقيمة الطابعتين التالفتين',
    status: 'completed',
    createdAt: '2026-09-03T11:00:00Z',
  },
];

// ----------------------------------------------------
// خطط وجدولة تحصيل ديون العملاء (Collection Plans)
// ----------------------------------------------------
export const INITIAL_COLLECTION_PLANS: CollectionPlan[] = [
  {
    id: 'cp-2026-001',
    planNumber: 'PLAN-2026-0001',
    customerId: 'c-al-zahraa',
    customerName: 'مجموعة الزهراء للتوزيع والتجارة',
    totalDebt: 65000,
    agreementDate: '2026-08-20',
    installments: [
      {
        installmentNumber: 1,
        dueDate: '2026-08-31',
        amount: 25000,
        paidAmount: 25000,
        status: 'paid',
        paymentDate: '2026-08-30',
        receiptId: 'rcpt-001',
        notes: 'سداد القسط الأول بتحويل بنكي مباشر',
      },
      {
        installmentNumber: 2,
        dueDate: '2026-09-15',
        amount: 20000,
        paidAmount: 0,
        status: 'pending',
        notes: 'قسط مستحق منتصف شهر سبتمبر',
      },
      {
        installmentNumber: 3,
        dueDate: '2026-09-30',
        amount: 20000,
        paidAmount: 0,
        status: 'pending',
        notes: 'قسط نهائي لتسوية كامل الرصيد المتبقي',
      },
    ],
    status: 'active',
    notes: 'خطة جدولة ميسرة على 3 دفعات بموجب اتفاقية تسوية معتمدة مع الإدارة المالية',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'cp-2026-002',
    planNumber: 'PLAN-2026-0002',
    customerId: 'c-nile-tech',
    customerName: 'شركة النيل للحلول الرقمية والتجهيزات',
    totalDebt: 42000,
    agreementDate: '2026-08-10',
    installments: [
      {
        installmentNumber: 1,
        dueDate: '2026-08-25',
        amount: 21000,
        paidAmount: 21000,
        status: 'paid',
        paymentDate: '2026-08-25',
        receiptId: 'rcpt-002',
        notes: 'سداد نقدي عبر الخزينة المركزية',
      },
      {
        installmentNumber: 2,
        dueDate: '2026-09-10',
        amount: 21000,
        paidAmount: 0,
        status: 'pending',
        notes: 'القسط الثاني والأخير',
      },
    ],
    status: 'active',
    notes: 'جدولة مديونية فواتير توريدات شهر يوليو',
    createdAt: '2026-08-10T12:30:00Z',
  },
];

// ----------------------------------------------------
// سجل تذكيرات ومتابعات التحصيل (Collection Reminder Logs)
// ----------------------------------------------------
export const INITIAL_COLLECTION_REMINDER_LOGS: CollectionReminderLog[] = [
  {
    id: 'crl-001',
    customerId: 'c-al-zahraa',
    customerName: 'مجموعة الزهراء للتوزيع والتجارة',
    date: '2026-09-02',
    channel: 'whatsapp',
    amountDue: 40000,
    messageText: 'السادة مجموعة الزهراء، نود تذكيركم بموعد استحقاق القسط الثاني بمبلغ 20,000 ج.م في تاريخ 15/09/2026 وفق خطة الجدولة المعتمدة.',
    status: 'promised_payment',
    promisedDate: '2026-09-15',
    agentName: 'مسؤول التحصيل - أحمد رأفت',
    notes: 'أفاد المدير المالي للعميل بأنه سيتم إصدار شيك بنكي بتاريخ 15 سبتمبر',
    createdAt: '2026-09-02T11:00:00Z',
  },
  {
    id: 'crl-002',
    customerId: 'c-nile-tech',
    customerName: 'شركة النيل للحلول الرقمية والتجهيزات',
    date: '2026-09-04',
    channel: 'phone_call',
    amountDue: 21000,
    messageText: 'مكالمة هاتفية للمتابعة بشأن استحقاق القسط الثاني في 10 سبتمبر بمبلغ 21,000 ج.م.',
    status: 'sent',
    agentName: 'مسؤول التحصيل - سامح ممدوح',
    notes: 'تم التأكيد مع الحسابات وجاري تجهيز أمر التحويل البنكي',
    createdAt: '2026-09-04T15:30:00Z',
  },
];

// ----------------------------------------------------
// 6. بيانات السنوات والفترات المالية (Fiscal Years & Periods)
// ----------------------------------------------------
const generateMonthlyPeriods = (year: number, lockedUntilMonth: number = 0): FiscalPeriod[] => {
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return monthNames.map((name, idx) => {
    const monthNum = idx + 1;
    const padMonth = String(monthNum).padStart(2, '0');
    // Calculate last day of month
    const lastDay = new Date(year, monthNum, 0).getDate();
    const isLocked = monthNum <= lockedUntilMonth;
    return {
      id: `p-${year}-${padMonth}`,
      fiscalYearId: `fy-${year}`,
      periodNumber: monthNum,
      name: `${name} ${year}`,
      startDate: `${year}-${padMonth}-01`,
      endDate: `${year}-${padMonth}-${String(lastDay).padStart(2, '0')}`,
      isLocked,
      lockedAt: isLocked ? `${year}-${padMonth}-${lastDay}T23:59:59Z` : undefined,
      lockedBy: isLocked ? 'المدير المالي' : undefined,
      notes: isLocked ? `تم إقفال واعتماد فترة ${name} ${year}` : undefined,
    };
  });
};

export const INITIAL_FISCAL_YEARS: FiscalYear[] = [
  {
    id: 'fy-2024',
    year: 2024,
    name: 'السنة المالية 2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'closed',
    closedAt: '2024-12-31T23:59:59Z',
    closedBy: 'رئيس الحسابات والمدقق المالي',
    retainedEarningsAccountId: '3200',
    closingJournalEntryId: 'je-close-2024',
    closingJournalEntryNumber: 'JE-CLOSE-2024',
    openingJournalEntryId: 'je-open-2025',
    openingJournalEntryNumber: 'JE-OPEN-2025',
    netIncomeBeforeClosing: 185000,
    totalRevenueClosed: 950000,
    totalExpenseClosed: 765000,
    periods: generateMonthlyPeriods(2024, 12),
    notes: 'تم إقفال السنة المالية 2024 واعتماد القوائم المالية وترحيل الأرباح المحتجزة إلى حساب (3200).',
  },
  {
    id: 'fy-2025',
    year: 2025,
    name: 'السنة المالية 2025',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'open',
    retainedEarningsAccountId: '3200',
    periods: generateMonthlyPeriods(2025, 9),
    notes: 'السنة المالية السابقة - جاهزة لمراجعة الحسابات الختامية والإقفال السنوي وترحيل الأرصدة.',
  },
  {
    id: 'fy-2026',
    year: 2026,
    name: 'السنة المالية 2026 (الحالية)',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'open',
    retainedEarningsAccountId: '3200',
    periods: generateMonthlyPeriods(2026, 8), // Jan to Aug locked, Sept to Dec open
    notes: 'السنة المالية التشغيلية النشطة لعام 2026.',
  },
];

// ----------------------------------------------------
// 7. بيانات الموازنات التقديرية (Budget Plans & Items)
// ----------------------------------------------------
export const INITIAL_BUDGET_PLANS: BudgetPlan[] = [
  {
    id: 'bdg-2026-main',
    name: 'الموازنة التشغيلية المعتمدة لعام 2026',
    fiscalYear: 2026,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    costCenterId: 'all',
    costCenterName: 'كافة مراكز التكلفة والفروع',
    status: 'approved',
    totalBudget: 1068000,
    createdBy: 'مدير التخطيط المالي والموازنات',
    createdAt: '2026-01-02T10:00:00Z',
    approvedAt: '2026-01-05T14:30:00Z',
    approvedBy: 'مجلس الإدارة والمدير العام',
    notes: 'الموازنة التقديرية السنوية لمصروفات التشغيل والأنشطة الإدارية والتسويقية لعام 2026.',
    items: [
      {
        id: 'bi-01',
        accountId: '5200',
        accountCode: '5200',
        accountName: 'مصروفات الرواتب والأجور والبدلات',
        annualAmount: 600000,
        monthlyAmounts: Array(12).fill(50000),
        alertThresholdPercent: 95,
        notes: 'الرواتب والأجور الشهرية الثابتة مع مخصص الزيادات الدورية',
      },
      {
        id: 'bi-02',
        accountId: '5300',
        accountCode: '5300',
        accountName: 'مصروفات الإيجار والمرافق',
        annualAmount: 180000,
        monthlyAmounts: Array(12).fill(15000),
        alertThresholdPercent: 90,
        notes: 'إيجارات الفروع والمقر الرئيسي وفواتير الكهرباء والإنترنت',
      },
      {
        id: 'bi-03',
        accountId: '5400',
        accountCode: '5400',
        accountName: 'مصروفات التسويق والدعاية والإعلان',
        annualAmount: 120000,
        monthlyAmounts: Array(12).fill(10000),
        alertThresholdPercent: 85,
        notes: 'الحملات الرقمية الممولة والمعارض السنوية والمطبوعات',
      },
      {
        id: 'bi-04',
        accountId: '5500',
        accountCode: '5500',
        accountName: 'مصروفات الشحن والتوصيل والانتقالات',
        annualAmount: 96000,
        monthlyAmounts: Array(12).fill(8000),
        alertThresholdPercent: 90,
        notes: 'بنزين وسيارات التوزيع وبوالص الشحن السريع للعملاء',
      },
      {
        id: 'bi-05',
        accountId: '5600',
        accountCode: '5600',
        accountName: 'مصروفات صيانة واستهلاكات مكتبية',
        annualAmount: 48000,
        monthlyAmounts: Array(12).fill(4000),
        alertThresholdPercent: 90,
        notes: 'صيانة الحواسيب ومستلزمات الطباعة والضيافة',
      },
      {
        id: 'bi-06',
        accountId: '5700',
        accountCode: '5700',
        accountName: 'مصروفات بنكية ورسوم دفع إلكتروني',
        annualAmount: 24000,
        monthlyAmounts: Array(12).fill(2000),
        alertThresholdPercent: 90,
        notes: 'عمولات نقاط البيع POS وبوابات الدفع الإلكتروني والتحويلات',
      },
    ],
  },
];


