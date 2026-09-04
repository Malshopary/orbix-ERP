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
