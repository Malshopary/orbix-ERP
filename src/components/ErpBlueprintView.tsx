import React, { useState, useMemo } from 'react';
import { ActiveTab } from './Sidebar';
import { useErp } from '../context/ErpContext';
import {
  Layers,
  CheckCircle2,
  Database,
  ShieldCheck,
  Code2,
  BookOpenCheck,
  Package,
  Receipt,
  ShoppingCart,
  Users2,
  BadgeDollarSign,
  PieChart,
  Lightbulb,
  Cpu,
  Sparkles,
  ChevronRight,
  Server,
  Clock,
  Zap,
  Landmark,
  Warehouse,
  MessageSquare,
  CheckSquare,
  Scale,
  Building2,
  Target,
  TrendingUp,
  Search,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck,
  Briefcase,
  UserCheck,
  Sliders,
  FileCheck2,
  ArrowRightLeft,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ErpBlueprintViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const ErpBlueprintView: React.FC<ErpBlueprintViewProps> = ({ setActiveTab }) => {
  const {
    companyProfile,
    accounts = [],
    journalEntries = [],
    products = [],
    warehouses = [],
    salesInvoices = [],
    purchaseInvoices = [],
    customers = [],
    vendors = [],
    receipts = [],
    collectionPlans = [],
    collectionReminders = [],
    employees = [],
    cheques = [],
    priceLists = [],
    employeeTasks = [],
    chatMessages = [],
    users = [],
    navigateTo,
  } = useErp();

  const [selectedSection, setSelectedSection] = useState<
    'sops' | 'roles' | 'modules' | 'database' | 'accounting_rules' | 'architecture'
  >('sops');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState<'all' | 'accountant' | 'storekeeper' | 'cashier' | 'collector' | 'executive'>('all');

  const handleNav = (tab: ActiveTab | string, subTab?: string) => {
    if (navigateTo) {
      navigateTo(tab, subTab);
    } else {
      setActiveTab(tab as ActiveTab);
    }
  };

  // ========================================================
  // 1. إجراءات العمل والتشغيل اليومية القياسية (SOPs)
  // ========================================================
  const sopWorkflows = [
    {
      id: 'sales_cycle',
      title: 'دورة المبيعات والفوترة الإلكترونية (ZATCA Sales Cycle)',
      category: 'المبيعات والعملاء',
      icon: Receipt,
      color: 'emerald',
      badge: 'الفوترة وZATCA',
      summary: 'إصدار الفواتير الضريبية المبسطة والمعتمدة، خصم المخزون آلياً، وتوليد القيد المزدوج اللحظي.',
      steps: [
        'تسجيل العميل والتأكد من رقمه الضريبي وحده الائتماني المسموح به.',
        'إنشاء عرض أسعار (Quotation) أو أمر بيع مباشر من شاشة المبيعات.',
        'تحويل الطلب إلى فاتورة ضريبية متوافقة مع ZATCA تتضمن الـ QR المشفّر وبيانات الضريبة (15%).',
        'خصم الكميات المباعة من المستودع المختار وحساب تكلفة البضاعة المباعة COGS تلقائياً.',
        'تحصيل قيمة الفاتورة نقداً أو شبكة أو تسجيلها كمديونية آجلة مع قيد محاسبي آلي.',
      ],
      accountingImpact: 'مدين: ح/ العملاء أو الصندوق | دائن: ح/ إيرادات المبيعات + ح/ ضريبة القيمة المضافة المستحقة.',
      actions: [
        { label: 'فواتير المبيعات', tab: 'sales', subTab: 'invoices' },
        { label: 'عروض الأسعار', tab: 'sales', subTab: 'quotations' },
        { label: 'دليل العملاء', tab: 'crm_collections', subTab: 'customers' },
      ],
    },
    {
      id: 'quick_pos_cycle',
      title: 'دورة الكاشير ونقاط البيع السريع (Quick POS Workflow)',
      category: 'نقاط البيع والكاشير',
      icon: Zap,
      color: 'amber',
      badge: 'سرعة وكفاءة',
      summary: 'البيع الفوري عبر الباركود، إدارة ورديات الكاشير، والطباعة الحرارية 80mm وإغلاق الصندوق.',
      steps: [
        'فتح الوردية اليومية للكاشير وتسجيل العهدة النقدية الافتتاحية.',
        'مسح باركود المنتجات أو البحث السريع باللمس وإضافة الكميات.',
        'اختيار وسيلة الدفع (نقدي / مدى / بطاقة / تقسيم الدفع).',
        'طباعة إيصال الفاتورة الحرارية 80mm فحص QR وإتمام العملية في ثوانٍ.',
        'إغلاق الوردية ومطابقة النقدية الفعلية مع مبيعات النظام وترحيل الفارق.',
      ],
      accountingImpact: 'مدين: ح/ الصندوق أو البنك | دائن: ح/ مبيعات الكاشير + ح/ ضريبة المخرجات.',
      actions: [
        { label: 'فتح شاشة الكاشير (POS)', tab: 'quick_pos' },
        { label: 'فواتير المبيعات', tab: 'sales', subTab: 'invoices' },
      ],
    },
    {
      id: 'purchasing_cycle',
      title: 'دورة المشتريات والتوريدات والمطابقة الثلاثية (Purchases & 3-Way Match)',
      category: 'المشتريات وسلاسل الإمداد',
      icon: ShoppingCart,
      color: 'purple',
      badge: 'الرقابة والتكاليف',
      summary: 'إصدار أوامر الشراء، فحص سندات استلام المستودع GRN، واحتساب تكاليف الشحن وتوزيعها.',
      steps: [
        'تسجيل بيانات المورد وشروط السداد والائتمان.',
        'إنشاء أمر شراء معتمد (Purchase Order) بالكميات والأسعار المتفق عليها.',
        'استلام البضاعة فعلياً في المستودع وإصدار إذن استلام مخزني (GRN).',
        'مطابقة فاتورة المورد مع أمر الشروع وسند الاستلام لمنع التكرار أو التلاعب.',
        'توزيع مصاريف الشحن والتخليص الجمركي على تكلفة الوحدات المستلمة (Landed Costs).',
        'إصدار سند صرف الدفعة المستحقة للمورد وفق جدول السداد.',
      ],
      accountingImpact: 'مدين: ح/ المخزون السلعي + ح/ ضريبة المدخلات | دائن: ح/ الموردين.',
      actions: [
        { label: 'فواتير المشتريات', tab: 'purchases', subTab: 'invoices' },
        { label: 'أوامر الشراء (PO)', tab: 'purchases', subTab: 'purchase_orders' },
        { label: 'دليل الموردين', tab: 'purchases', subTab: 'vendors' },
      ],
    },
    {
      id: 'inventory_operations',
      title: 'دورة إدارة المستودعات والجرد والتسويات (Inventory & Stock Control)',
      category: 'المخازن والمستودعات',
      icon: Warehouse,
      color: 'blue',
      badge: 'تعدد المخازن والأرفف',
      summary: 'متابعة حركة المخزون بالباركود، التحويلات بين الفروع، الجرد الفعلي، ومعالجة الهالك والتسويات.',
      steps: [
        'تعريف المستودعات والفروع وتحديد مسؤول وموقع كل مستودع.',
        'إجراء أذونات التحويل الداخلي بين المخازن مع تأكيد الاستلام من الفرع المستلم.',
        'بدء جلسة جرد فعلي دورية أو مفاجئة وحصر الكميات الفعلية مقابل الدفترية.',
        'اعتماد التسوية الجردية آلياً (زيادة مخزون أو عجز جرد).',
        'تحرير محضر إتلاف للمواد منتهية الصلاحية أو التالفة وترحيل قيمتها كمصروف هالك.',
      ],
      accountingImpact: 'العجز: مدين ح/ خسائر عجز الجرد | دائن ح/ المخزون. الهالك: مدين ح/ مصروف الهالك | دائن ح/ المخزون.',
      actions: [
        { label: 'دليل المستودعات', tab: 'inventory', subTab: 'warehouses' },
        { label: 'الجرد الفعلي والتسوية', tab: 'inventory', subTab: 'stocktaking' },
        { label: 'التحويل بين المخازن', tab: 'inventory', subTab: 'transfers' },
        { label: 'محاضر الإتلاف والهالك', tab: 'inventory', subTab: 'scrap' },
      ],
    },
    {
      id: 'general_ledger_cycle',
      title: 'دورة المحاسبة المالية والقيود وشجرة الحسابات (General Ledger Engine)',
      category: 'الحسابات والمالية',
      icon: BookOpenCheck,
      color: 'cyan',
      badge: 'النواة المركزية',
      summary: 'القيد المزدوج الإلزامي، دليل الحسابات الهرمي، مراكز التكلفة، وإقفال الفترات والسنوات المالية.',
      steps: [
        'تأسيس شجرة الحسابات الهرمية (الأصول، الخصوم، حقوق الملكية، الإيرادات، المصروفات).',
        'إدخال القيود اليدوية والتسويات الجردية والتأكد من شرط التوازن (Debit = Credit).',
        'تخصيص الحركات المحاسبية لمراكز التكلفة لمراقبة ربحية الفروع والمشاريع المستقلة.',
        'مراجعة دفتر اليومية العامة وكشوف الحسابات وميزان المراجعة بالمجاميع والأرصدة.',
        'إجراء إقفال الفترة المالية وقفل الإيرادات والمصروفات في حساب الأرباح والخسائر.',
      ],
      accountingImpact: 'تطبيق معادلة الميزانية: الأصول = الخصوم + حقوق الملكية + أرباح الفترة.',
      actions: [
        { label: 'دليل الحسابات', tab: 'accounts', subTab: 'chart' },
        { label: 'قيود اليومية', tab: 'accounts', subTab: 'journal' },
        { label: 'مراكز التكلفة', tab: 'accounts', subTab: 'costcenters' },
        { label: 'إقفال الفترات المالية', tab: 'accounts', subTab: 'fiscal_closing' },
      ],
    },
    {
      id: 'banking_cheques_cycle',
      title: 'دورة الشيكات وأوراق القبض والتسويات البنكية (Cheques & Bank Reconciliation)',
      category: 'البنوك والسيولة',
      icon: Landmark,
      color: 'indigo',
      badge: 'الرقابة المصرفية',
      summary: 'متابعة دورة حياة الشيكات الصادرة والواردة، ومطابقة كشوف الحساب البنكية مع الدفاتر.',
      steps: [
        'تسجيل الشيك الوارد في حافظة أوراق القبض (حالة: قيد الانتظار).',
        'إيداع الشيك في الحساب البنكي للشركة (حالة: برسم التحصيل).',
        'تأكيد تحصيل الشيك وإيداع القيمة في رصيد البنك أو تسجيل ارتداده وإعادة المديونية.',
        'تسجيل الشيكات الصادرة للموردين ومتابعة تواريخ استحقاقها لدى البنك.',
        'استيراد كشف الحساب البنكي ومطابقة العمليات آلياً وإثبات فوائد أو عمولات البنك.',
      ],
      accountingImpact: 'القبض: مدين ح/ أوراق القبض | دائن ح/ العملاء. التحصيل: مدين ح/ البنك | دائن ح/ أوراق القبض.',
      actions: [
        { label: 'حافظة الشيكات وأوراق القبض', tab: 'accounts', subTab: 'cheques' },
        { label: 'التسوية البنكية', tab: 'accounts', subTab: 'reconciliation' },
        { label: 'سندات القبض', tab: 'accounts', subTab: 'collections' },
        { label: 'سندات الصرف', tab: 'accounts', subTab: 'payments' },
      ],
    },
    {
      id: 'credit_collections_cycle',
      title: 'دورة الائتمان ومصفوفة أعمار الديون والتحصيل (Credit & Debt Aging)',
      category: 'المبيعات والعملاء',
      icon: Users2,
      color: 'rose',
      badge: 'حماية التدفقات النقدية',
      summary: 'مراقبة فترات الاستحقاق، حظر العملاء المتعثرين، جدولة خطط الأقساط، وإرسال تنبيهات السداد.',
      steps: [
        'مراقبة مصفوفة أعمار الديون اللحظية المقسمة إلى شرائح (0-30، 31-60، 61-90، +90 يوم).',
        'حظر البيع الآجل تلقائياً للعملاء المتجاوزين للحد الائتماني أو مدة السماح.',
        'إنشاء خطة تحصيل وجدولة أقساط للعملاء المتعثرين مع تواريخ استحقاق ملزمة.',
        'إرسال تذكيرات تحصيل آلية للعملاء عبر الرسائل أو واتساب قبل موعد القسط.',
        'إصدار سند قبض وتخصيصه مباشرة للفواتير أو الأقساط المفتوحة لتصفيتها.',
      ],
      accountingImpact: 'تخفيض فوري لرصيد العميل ونقله إلى الصندوق أو البنك وتحرير حالة الحظر.',
      actions: [
        { label: 'مصفوفة أعمار الديون', tab: 'accounts', subTab: 'aging' },
        { label: 'سندات القبض', tab: 'accounts', subTab: 'collections' },
        { label: 'دليل العملاء والائتمان', tab: 'crm_collections', subTab: 'customers' },
      ],
    },
    {
      id: 'hr_payroll_cycle',
      title: 'دورة الموارد البشرية ومسير الرواتب وحماية الأجور (HR & Payroll WPS)',
      category: 'الموارد البشرية والرواتب',
      icon: BadgeDollarSign,
      color: 'sky',
      badge: 'الامتثال وقانون العمل',
      summary: 'إدارة الموظفين، تتبع الحضور والسلف، إصدار مسير الرواتب وتصدير ملف حماية الأجور وترحيل القيد.',
      steps: [
        'تسجيل بيانات الموظف، الراتب الأساسي، بدلات السكن والنقل، والتأمينات الاجتماعية (GOSI).',
        'تسجيل الحضور والانصراف، الإجازات المستحقة، وخصم أقساط السلف والجزاءات.',
        'توليد مسير الرواتب الشهري الآلي ومراجعة صافي الرواتب المستحقة.',
        'تصدير ملف حماية الأجور المعتمد للبنوك (WPS SIF File) بضغطة زر.',
        'ترحيل المسير المعتمد إلى قيود اليومية العامة لإثبات المصروف والالتزامات.',
      ],
      accountingImpact: 'مدين: ح/ مصروف الرواتب والبدلات | دائن: ح/ مخصص رواتب مستحقة + ح/ أمانات التأمينات + ح/ سلف الموظفين.',
      actions: [
        { label: 'سجلات الموظفين', tab: 'hr_payroll', subTab: 'employees' },
        { label: 'مسيرات الرواتب الشهرية', tab: 'hr_payroll', subTab: 'payroll_runs' },
        { label: 'السلف والقروض', tab: 'hr_payroll', subTab: 'loans' },
      ],
    },
    {
      id: 'backup_and_db_cycle',
      title: 'دورة إدارة قواعد البيانات والنسخ الاحتياطي والمزامنة (Database Management)',
      category: 'الإدارة والنظام',
      icon: Server,
      color: 'slate',
      badge: 'الأمان واستمرارية الأعمال',
      summary: 'سلامة الـ 18 جدولاً في PostgreSQL، تصدير النسخ الاحتياطية المشفرة، والتكامل السحابي.',
      steps: [
        'مراقبة اتصال السيرفر المحلي بقاعدة بيانات PostgreSQL والتأكد من سلامة الجداول الـ 18.',
        'تصدير نسخ احتياطية كاملة (Full Database JSON Backup) بصورة يومية وتخزينها بأمان.',
        'مزامنة البيانات الحيوية مع Google Sheets للمراجعة الخارجية وإعداد التقارير الإدارية.',
        'استخدام خاصية "بدء شركة جديدة وتفريغ البيانات" عند الانتقال لنشاط جديد أو تهيئة عميل.',
      ],
      accountingImpact: 'حماية السجلات المالية من الفقدان والالتزام بمتطلبات حفظ الدفاتر النظامية.',
      actions: [
        { label: 'إدارة قواعد البيانات والنسخ', tab: 'settings', subTab: 'database_backup' },
        { label: 'التكامل مع Google Sheets', tab: 'settings', subTab: 'google_sheets' },
        { label: 'إعدادات الشركة', tab: 'settings', subTab: 'company' },
      ],
    },
  ];

  // ========================================================
  // 2. مسارات العمل حسب الدور الوظيفي (Role-Based Workflows)
  // ========================================================
  const roleWorkflows = [
    {
      roleKey: 'accountant',
      roleTitle: 'المحاسب المالي ومدير الحسابات (Accountant & CFO)',
      icon: Scale,
      color: 'emerald',
      description: 'المسؤول عن سلامة شجرة الحسابات، مراجعة القيود الآلية، إدخال التسويات، مراقبة السيولة، وإصدار القوائم المالية.',
      dailyRoutine: [
        'مراجعة قيود اليومية الآلية المتولدة عن فواتير البيع والشراء وسندات القبض والصرف.',
        'تدقيق حافظة الشيكات الواردة والصادرة وإجراء مطابقة كشف الحساب البنكي (Bank Reconciliation).',
        'فحص ميزان المراجعة بالمجاميع والأرصدة والتأكد من توازن الأصول مع الخصوم وحقوق الملكية.',
        'إجراء التسويات الجردية الشهرية، احتساب إهلاك الأصول الثابتة، وترحيل مسير الرواتب.',
        'استخراج إقرار ضريبة القيمة المضافة ومراجعة قائمة الدخل والميزانية العمومية.',
      ],
      primaryScreens: [
        { name: 'دليل الحسابات', tab: 'accounts', subTab: 'chart' },
        { name: 'قيود اليومية', tab: 'accounts', subTab: 'journal' },
        { name: 'أوراق القبض والشيكات', tab: 'accounts', subTab: 'cheques' },
        { name: 'التسوية البنكية', tab: 'accounts', subTab: 'reconciliation' },
        { name: 'القوائم والتقارير المالية', tab: 'financial_reports' },
      ],
    },
    {
      roleKey: 'storekeeper',
      roleTitle: 'أمين المستودع ومدير المخازن (Warehouse Keeper)',
      icon: Package,
      color: 'blue',
      description: 'المسؤول عن استلام البضائع من الموردين، التحويلات بين الفروع، الرقابة على الأرفف، والجرد الدوري ومنع العجز.',
      dailyRoutine: [
        'استلام طلبيات الشراء الواردة ومطابقتها مع أمر الشراء وإصدار إذن استلام مخزني (GRN).',
        'مراقبة تنبيهات الأصناف التي وصلت إلى حد إعادة الطلب وتنبيه قسم المشتريات.',
        'تنفيذ أذونات التحويل الداخلي بين المخازن وتأكيد استلام ونقل الكميات بالأرقام التسلسلية.',
        'إجراء جلسات الجرد الفعلي للمستودع وتوثيق أي فروقات في محضر التسوية الجردية.',
        'إثبات السلع التالفة أو المنتهية عبر محاضر الهالك لمنع تراكم المخزون الراكد.',
      ],
      primaryScreens: [
        { name: 'دليل الأصناف والمخزون', tab: 'inventory' },
        { name: 'المستودعات والفروع', tab: 'inventory', subTab: 'warehouses' },
        { name: 'الجرد الفعلي والتسويات', tab: 'inventory', subTab: 'stocktaking' },
        { name: 'التحويلات المخزنية', tab: 'inventory', subTab: 'transfers' },
        { name: 'محاضر الإتلاف والهالك', tab: 'inventory', subTab: 'scrap' },
      ],
    },
    {
      roleKey: 'cashier',
      roleTitle: 'الكاشير ومسؤول نقطة البيع (POS Cashier & Retailer)',
      icon: Zap,
      color: 'amber',
      description: 'المسؤول عن العمليات المباشرة مع العملاء في المعرض، البيع السريع بالباركود، استلام المبالغ، وإغلاق الوردية.',
      dailyRoutine: [
        'استلام الصندوق والتأكد من فتح الوردية وإدخال رصيد النقدية الافتتاحي.',
        'استخدام ماسح الباركود لقراءة المنتجات بسرعة ودقة وتطبيق الخصومات المصرح بها.',
        'استلام المبالغ نقداً أو عبر بطاقات مدى والشبكة والتأكد من صحة العملية.',
        'طباعة الفاتورة الضريبية المبسطة مع كود QR وتسليم الإيصال للعميل.',
        'معالجة مرتجعات المبيعات وفق الفاتورة الأصلية ورصيد المخزون المتاح.',
        'إجراء جرد الصندوق في نهاية الوردية وإغلاق الوردية وتسليم النقدية للإدارة.',
      ],
      primaryScreens: [
        { name: 'شاشة الكاشير السريع (POS)', tab: 'quick_pos' },
        { name: 'فواتير المبيعات', tab: 'sales', subTab: 'invoices' },
        { name: 'مرتجعات المبيعات', tab: 'sales', subTab: 'returns' },
      ],
    },
    {
      roleKey: 'collector',
      roleTitle: 'مسؤول الائتمان والتحصيل (Credit Controller)',
      icon: Users2,
      color: 'rose',
      description: 'المسؤول عن تقييم الجدارة الائتمانية للعملاء، متابعة الفواتير المستحقة، تحصيل الديون، وتقليل الديون المعدومة.',
      dailyRoutine: [
        'فحص تقرير أعمار الديون اليومي والتركيز على الفواتير التي تجاوزت 30 و60 يوماً.',
        'تحديد العملاء المتأخرين عن السداد والتواصل معهم لتسجيل وعود سداد جديدة.',
        'إعداد خطط تحصيل وجدولة مديونيات للأطراف المتعثرة مع متابعة الأقساط.',
        'إرسال إشعارات وتذكيرات التحصيل عبر رسائل واتساب والبريد الإلكتروني.',
        'تسجيل سندات القبض اللحظية وتخصيصها لتصفية الفواتير المستحقة.',
      ],
      primaryScreens: [
        { name: 'مصفوفة أعمار الديون', tab: 'accounts', subTab: 'aging' },
        { name: 'سندات القبض', tab: 'accounts', subTab: 'collections' },
        { name: 'دليل العملاء والائتمان', tab: 'crm_collections', subTab: 'customers' },
      ],
    },
    {
      roleKey: 'executive',
      roleTitle: 'المدير العام والمالك (Executive / General Manager)',
      icon: Target,
      color: 'purple',
      description: 'صاحب القرار الاستراتيجي، متابعة مؤشرات الأداء اللحظية (KPIs)، تقييم السيولة والأرباح، والرقابة العليا.',
      dailyRoutine: [
        'الاطلاع على لوحة المؤشرات المركزية (Dashboard) لمتابعة مبيعات اليوم وصافي الأرباح.',
        'مراقبة مؤشرات السيولة النقدية وأرصدة البنوك والتدفقات النقدية المتوقعة.',
        'متابعة أداء المندوبين والفروع وأعلى المنتجات مبيعاً وأكثرها ربحية.',
        'مراجعة تقرير الأرباح والخسائر المقارن وتكلفة البضاعة المباعة COGS.',
        'اعتماد صلاحيات المستخدمين والتحقق من حفظ النسخ الاحتياطية المنتظمة للنظام.',
      ],
      primaryScreens: [
        { name: 'لوحة المؤشرات المباشرة', tab: 'dashboard' },
        { name: 'قائمة الدخل والأرباح (P&L)', tab: 'accounts', subTab: 'income' },
        { name: 'الميزانية والمركز المالي', tab: 'accounts', subTab: 'balance_sheet' },
        { name: 'إدارة المستخدمين والصلاحيات', tab: 'settings', subTab: 'users' },
        { name: 'إدارة قواعد البيانات', tab: 'settings', subTab: 'database_backup' },
      ],
    },
  ];

  // ========================================================
  // 3. هيكل قاعدة البيانات الحقيقي (18 PostgreSQL Tables)
  // ========================================================
  const realDatabaseTables = useMemo(() => [
    {
      name: 'users',
      title: 'جدول المستخدمين والصلاحيات',
      count: users.length,
      category: 'النظام والأمان',
      pk: 'id (serial / uid)',
      description: 'سجلات مديري النظام والمحاسبين والموظفين وحسابات الدخول مع الصلاحيات والأدوار المخصصة.',
      keyFields: 'id, uid, email, name, role, created_at',
    },
    {
      name: 'customers',
      title: 'جدول العملاء وأرصدة الذمم',
      count: customers.length,
      category: 'المبيعات والعملاء',
      pk: 'id (text)',
      description: 'دليل العملاء، الأرقام الضريبية، الحدود الائتمانية، فترات السماح، والأرصدة المدينة اللحظية.',
      keyFields: 'id, name, code, phone, tax_number, credit_limit, balance, category, payment_terms',
    },
    {
      name: 'vendors',
      title: 'جدول الموردين والأرصدة الدائنة',
      count: vendors.length,
      category: 'المشتريات والتوريدات',
      pk: 'id (text)',
      description: 'سجلات الموردين المعتمدين، الشروط التجارية، الأرقام الضريبية، ومستحقات المشتريات القائمة.',
      keyFields: 'id, name, code, phone, tax_number, balance, address, status, created_at',
    },
    {
      name: 'products',
      title: 'جدول الأصناف والمخزون والتكاليف',
      count: products.length,
      category: 'المخازن والمستودعات',
      pk: 'id (text)',
      description: 'بطاقات الأصناف والباركود والتسعير وسعر التكلفة ومتوسط التكلفة WAC والحد الأدنى للطلب.',
      keyFields: 'id, name, sku, barcode, category, unit, cost_price, selling_price, min_stock_alert, total_stock',
    },
    {
      name: 'warehouses',
      title: 'جدول المستودعات والمواقع التخزينية',
      count: warehouses.length,
      category: 'المخازن والمستودعات',
      pk: 'id (text)',
      description: 'فروع ومستودعات الشركة، أسماء أمناء المخازن، الأرفف، والمواقع الجغرافية لكل مستودع.',
      keyFields: 'id, name, code, location, keeper_name, phone, is_active, created_at',
    },
    {
      name: 'accounts',
      title: 'جدول دليل وشجرة الحسابات (COA)',
      count: accounts.length,
      category: 'المالية والحسابات',
      pk: 'id (text) / code (unique)',
      description: 'الشجرة الهرمية المحاسبية المعتمدة (الأصول، الخصوم، حقوق الملكية، الإيرادات، المصروفات).',
      keyFields: 'id, code, name, type (asset/liability/equity/revenue/expense), parent_code, balance, is_header',
    },
    {
      name: 'journal_entries',
      title: 'جدول قيود اليومية المزدوجة',
      count: journalEntries.length,
      category: 'المالية والحسابات',
      pk: 'id (text) / entry_number (unique)',
      description: 'دفتر اليومية العامة المركزي، القيود المتزنة، أطراف المدين والدائن، وتتبع مصدر القيد.',
      keyFields: 'id, entry_number, date, reference, description, total_debit, total_credit, lines_json',
    },
    {
      name: 'sales_invoices',
      title: 'جدول فواتير المبيعات وضريبة ZATCA',
      count: salesInvoices.length,
      category: 'المبيعات والعملاء',
      pk: 'id (text) / invoice_number (unique)',
      description: 'فواتير المبيعات الضريبية المعتمدة، كود QR المشفر، تفاصيل البنود، ضريبة 15%، وحالة السداد.',
      keyFields: 'id, invoice_number, customer_id, date, subtotal, tax_total, total, paid_amount, status, items_json',
    },
    {
      name: 'purchase_invoices',
      title: 'جدول فواتير المشتريات والموردين',
      count: purchaseInvoices.length,
      category: 'المشتريات والتوريدات',
      pk: 'id (text) / invoice_number (unique)',
      description: 'فواتير الموردين المستلمة، ضريبة المدخلات القابلة للخصم، بنود الشراء، وأرصدة المشتريات.',
      keyFields: 'id, invoice_number, vendor_id, date, subtotal, tax_total, total, paid_amount, items_json',
    },
    {
      name: 'receipts',
      title: 'جدول سندات القبض وسندات الصرف',
      count: receipts.length,
      category: 'المالية والحسابات',
      pk: 'id (text)',
      description: 'حركات المقبوضات النقدية والبنكية وسندات الصرف مع الربط المباشر بالحسابات والفواتير.',
      keyFields: 'id, receipt_number, type (collection/payment), party_id, amount, payment_method, account_id, date',
    },
    {
      name: 'cheques',
      title: 'جدول الشيكات وأوراق القبض والدفع',
      count: cheques.length,
      category: 'المالية والحسابات',
      pk: 'id (text)',
      description: 'حافظة الشيكات تحت التحصيل، الشيكات المحصلة، المرتدة، والمسحوبة لصالح الموردين والجهات.',
      keyFields: 'id, cheque_number, type (receivable/payable), bank_name, amount, due_date, party_id, status',
    },
    {
      name: 'collection_plans',
      title: 'جدول خطط وجدولة تحصيل الديون',
      count: collectionPlans.length,
      category: 'المبيعات والعملاء',
      pk: 'id (text)',
      description: 'اتفاقيات الجدولة مع العملاء المتعثرين، جداول الأقساط الشهرية، والمبالغ المحصلة والمتبقية.',
      keyFields: 'id, plan_number, customer_id, total_debt, collected_amount, installments (jsonb), status',
    },
    {
      name: 'collection_reminders',
      title: 'جدول سجل تذكيرات ومتابعات التحصيل',
      count: collectionReminders.length,
      category: 'المبيعات والعملاء',
      pk: 'id (text)',
      description: 'تاريخ تذكيرات الديون المرسلة للعملاء، القنوات (واتساب/رسائل/اتصال)، ووعود السداد المستقبلية.',
      keyFields: 'id, customer_id, phone, scheduled_date, due_amount, status, promised_date, message_text',
    },
    {
      name: 'employees',
      title: 'جدول الموظفين والرواتب والهيكل الإداري',
      count: employees.length,
      category: 'الموارد البشرية والرواتب',
      pk: 'id (text)',
      description: 'ملفات الموظفين، الرواتب الأساسية، البدلات، الهوية الوطنية، الإدارات، والمسميات الوظيفية.',
      keyFields: 'id, employee_code, name, national_id, department, job_title, basic_salary, status, hire_date',
    },
    {
      name: 'price_lists',
      title: 'جدول قوائم الأسعار الترويجية والفئات',
      count: priceLists.length,
      category: 'المبيعات والعملاء',
      pk: 'id (text)',
      description: 'قوائم الأسعار الخاصة (جملة، تجزئة، موزعين، VIP) مع نسب الخصم وتخصيصها للعملاء.',
      keyFields: 'id, name, code, currency, is_default, is_active, items (jsonb), created_at',
    },
    {
      name: 'employee_tasks',
      title: 'جدول المهام والتكليفات الإدارية',
      count: employeeTasks.length,
      category: 'التشغيل وفريق العمل',
      pk: 'id (text)',
      description: 'نظام إدارة المهام والتكليفات بين موظفي الشركة مع الأولويات، المواعيد النهائية، والاعتمادات.',
      keyFields: 'id, title, priority, status, created_by_user_id, assigned_to_user_ids (jsonb), due_date, history_json',
    },
    {
      name: 'chat_messages',
      title: 'جدول المحادثات الفورية والتواصل الداخلي',
      count: chatMessages.length,
      category: 'التشغيل وفريق العمل',
      pk: 'id (text)',
      description: 'الرسائل الفورية والإشعارات الآلية وتنبيهات المهام والتواصل التشاركي بين فرق العمل.',
      keyFields: 'id, channel_id, sender_id, sender_name, text, timestamp, is_system_notification, task_id',
    },
    {
      name: 'app_sync_store',
      title: 'جدول مستودع المزامنة والحالة المركزية',
      count: 1,
      category: 'النظام والأمان',
      pk: 'key (text)',
      description: 'مستودع المزامنة السحابية واللقطات الشاملة (Full State Snapshot) وإعدادات التكامل والنسخ.',
      keyFields: 'key, payload (jsonb), version, updated_at',
    },
  ], [
    users.length,
    customers.length,
    vendors.length,
    products.length,
    warehouses.length,
    accounts.length,
    journalEntries.length,
    salesInvoices.length,
    purchaseInvoices.length,
    receipts.length,
    cheques.length,
    collectionPlans.length,
    collectionReminders.length,
    employees.length,
    priceLists.length,
    employeeTasks.length,
    chatMessages.length,
  ]);

  // ========================================================
  // 4. الوحدات النمطية الـ 11 الموسعة
  // ========================================================
  const expandedModules = [
    {
      id: 'accounts',
      title: '1. المالية وشجرة الحسابات (General Ledger & COA)',
      tag: 'النواة المركزية',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: BookOpenCheck,
      desc: 'قيد اليومية المزدوج الآلي (Double-Entry Engine)، شجرة حسابات مرنة هرمية، مراكز التكلفة، وإقفال الفترات المالية.',
      requirements: [
        'محرك قيد محاسبي مزدوج (Debit = Credit) إلزامي مع كل حركة مالية أو مخزنية.',
        'شجرة حسابات هرمية خماسية (1-الأصول، 2-الخصوم، 3-حقوق الملكية، 4-الإيرادات، 5-المصروفات).',
        'مراكز تكلفة (Cost Centers) لتوزيع المصاريف على المشاريع أو الفروع.',
        'نظام إقفال شهري وسنوي وترحيل الأرصدة إلى الأرباح المبقاة وتجميد التعديلات.',
      ],
      actions: [
        { label: 'شجرة الحسابات', subTab: 'chart' },
        { label: 'قيود اليومية', subTab: 'journal' },
        { label: 'مراكز التكلفة', subTab: 'costcenters' },
      ],
    },
    {
      id: 'inventory',
      title: '2. المخازن وإدارة المخزون المتعدد (Inventory Management)',
      tag: 'إدارة السلع والتكلفة',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Package,
      desc: 'تتبع الأصناف بالباركود والأرقام التسلسلية، تقييم المخزون بالمتوسط المرجح WAC، تنبيهات حد الطلب، والتحويلات ومحاضر الجرد.',
      requirements: [
        'حساب تكلفة البضاعة المباعة COGS آلياً مع كل فاتورة بيع.',
        'تعدد المستودعات مع أذونات التحويل الداخلي بين المخازن وتأكيد الاستلام.',
        'تتبع تواريخ الصلاحية وأرقام الشحنات (Batches) والمواقع على الأرفف.',
        'ربط الجرد الدوري والمستمر مباشرة بحساب الأصول المخزنية في دليل الحسابات.',
      ],
      actions: [
        { label: 'دليل الأصناف', subTab: undefined },
        { label: 'المستودعات', subTab: 'warehouses' },
        { label: 'الجرد الفعلي', subTab: 'stocktaking' },
      ],
    },
    {
      id: 'quick_pos',
      title: '3. نقاط البيع السريع ونظام الكاشير (Quick POS System)',
      tag: 'الكاشير والباركود',
      tagColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: Zap,
      desc: 'واجهة سريعة للبائعين، ماسح الباركود، ورديات الكاشير، تعدد وسائل الدفع، والطباعة الحرارية 80mm.',
      requirements: [
        'واجهة مخصصة لشاشات اللمس مع اختصارات لوحة المفاتيح والباركود.',
        'إدارة ورديات الكاشير (فتح، تسليم، إغلاق، جرد النقدية ومطابقة العهدة).',
        'دعم الدفع المتعدد (نقدي + شبكة مدى + آجل) في نفس الفاتورة.',
        'طباعة إيصالات حرارية 80mm متضمنة رمز QR الضريبي المعتمد.',
      ],
      actions: [
        { label: 'فتح الكاشير السريع (POS)', subTab: undefined },
      ],
    },
    {
      id: 'sales',
      title: '4. المبيعات والفوترة الإلكترونية (Sales & ZATCA E-Invoicing)',
      tag: 'ZATCA & الضرائب',
      tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Receipt,
      desc: 'عروض أسعار، أوامر بيع، فواتير ضريبية مبسطة وأساسية متوافقة مع متطلبات ZATCA ورمز الاستجابة السريع QR المشفر.',
      requirements: [
        'توليد الفاتورة الضريبية وفق اشتراطات هيئة الزكاة والضريبة والجمارك (ZATCA Phase 1 & 2).',
        `احتساب ضريبة القيمة المضافة (VAT ${companyProfile.defaultVatRate}%) آلياً وتوزيعها بحساب الأمانات الضريبية.`,
        'تحويل عرض السعر إلى أمر بيع ثم فاتورة بضغطة زر واحدة دون إعادة إدخال.',
        'تحديث المخزون ورصيد العميل وإنشاء القيد المحاسبي تلقائياً لحظة حفظ الفاتورة.',
      ],
      actions: [
        { label: 'فواتير المبيعات', subTab: 'invoices' },
        { label: 'عروض الأسعار', subTab: 'quotations' },
        { label: 'أوامر البيع', subTab: 'orders' },
      ],
    },
    {
      id: 'purchases',
      title: '5. المشتريات والموردين (Purchasing & AP)',
      tag: 'سلاسل الإمداد',
      tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: ShoppingCart,
      desc: 'طلبات الشراء، أوامر الشراء، فواتير الموردين، سندات الاستلام المخزني GRN، ومطابقة الفاتورة الثلاثية (3-Way Matching).',
      requirements: [
        'مطابقة أمر الشراء + إذن استلام المخزن + فاتورة المورد لمنع الازدواجية.',
        'تسجيل التكاليف الإضافية (الشحن، الجمارك، التخليص) وتوزيعها على تكلفة السلع (Landed Costs).',
        'جدولة دفعات الموردين ومتابعة فترات الائتمان وسندات الصرف.',
      ],
      actions: [
        { label: 'فواتير المشتريات', subTab: 'invoices' },
        { label: 'أوامر الشراء', subTab: 'purchase_orders' },
        { label: 'دليل الموردين', subTab: 'vendors' },
      ],
    },
    {
      id: 'crm_collections',
      title: '6. إدارة الائتمان وأعمار الديون والتحصيل (Credit & Debt Aging)',
      tag: 'حماية السيولة',
      tagColor: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: Users2,
      desc: 'تتبع العملاء، الحدود الائتمانية، تقارير أعمار الديون (0-30، 31-60، 61-90، +90 يوم)، وسندات القبض والتذكير الآلي بالتحصيل.',
      requirements: [
        'تحديد حد ائتماني ومدة سماح لكل عميل مع حظر إصدار فواتير آجلة عند تجاوز الحد.',
        'مصفوفة أعمار الديون اللحظية لكشف الديون المعدومة والراكدة وتوليد مخصص ديون مشكوك فيها.',
        'إصدار سندات القبض وربطها المباشر بالفواتير المفتوحة لتصفيتها.',
        'تذكيرات آلية عبر البريد ورسائل واتساب قبل استحقاق الفواتير.',
      ],
      actions: [
        { label: 'دليل العملاء', subTab: 'customers' },
        { label: 'خطط التحصيل', subTab: 'plans' },
        { label: 'تذكيرات السداد', subTab: 'reminders' },
      ],
    },
    {
      id: 'accounts',
      title: '7. أوراق القبض وحافظة الشيكات والتسويات البنكية (Cheques & Banking)',
      tag: 'إدارة أوراق الدفع والقبض',
      tagColor: 'bg-teal-100 text-teal-800 border-teal-300',
      icon: Landmark,
      desc: 'إدارة دورة حياة الشيكات (انتظار، تحصيل، ارتداد، إلغاء)، ومطابقة كشوف الحساب البنكية مع الدفاتر.',
      requirements: [
        'تتبع الشيكات الواردة من العملاء حتى تاريخ استحقاقها وإيداعها في البنك.',
        'تتبع الشيكات الصادرة للموردين والالتزامات البنكية المؤجلة.',
        'قيود وسيطة (أوراق قبض تحت التحصيل) لمنع تضخيم رصيد البنك قبل الصرف الفعلي.',
        'شاشة تسوية بنكية تفاعلية لمطابقة كشف حساب البنك وتسجيل العمولات والفوائد.',
      ],
      actions: [
        { label: 'حافظة الشيكات', subTab: 'cheques' },
        { label: 'التسوية البنكية', subTab: 'reconciliation' },
      ],
    },
    {
      id: 'hr_payroll',
      title: '8. الموارد البشرية ومسير الرواتب (HR & Payroll WPS)',
      tag: 'حماية الأجور والتأمينات',
      tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      icon: BadgeDollarSign,
      desc: 'سجلات الموظفين، هيكل الرواتب والبدلات، التأمينات الاجتماعية (GOSI)، مسيرات الرواتب الشهرية، وملفات حماية الأجور WPS، ومستحقات نهاية الخدمة.',
      requirements: [
        'احتساب تلقائي للبدلات (سكن، نقل) والخصومات (تأمينات اجتماعية، غيابات، سلف).',
        'توليد ملف حماية الأجور (WPS SIF File) المتوافق مع البنوك المركزية ووزارة الموارد البشرية.',
        'ترحيل مسير الرواتب إلى قيود محاسبية آلية (مصروف رواتب، مستحقات رواتب، أمانات تأمينات).',
        'حاسبة مخصص مكافأة نهاية الخدمة وفق قانون العمل المعمول به.',
      ],
      actions: [
        { label: 'سجلات الموظفين', subTab: 'employees' },
        { label: 'مسيرات الرواتب', subTab: 'payroll_runs' },
        { label: 'السلف والقروض', subTab: 'loans' },
      ],
    },
    {
      id: 'financial_reports',
      title: '9. التقارير والقوائم المالية (Financial Statements & BI)',
      tag: 'القرارات الاستراتيجية',
      tagColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      icon: PieChart,
      desc: 'قائمة الدخل (P&L)، الميزانية العمومية (Balance Sheet)، ميزان المراجعة، كشوف الحسابات التفصيلية، وتحليل التدفقات النقدية ومعدل دوران المخزون.',
      requirements: [
        'استخراج القوائم المالية وفق معايير المحاسبة الدولية IFRS.',
        'ميزان مراجعة فوري ومتوازن على مستوى كل مستوى من شجرة الحسابات.',
        'إمكانية الحفر لأسفل (Drill-Down) من أي رقم في التقرير إلى القيد وأصل الفاتورة.',
        'تصدير التقارير بصيغ PDF وExcel وطباعة معتمدة للتدقيق المالي.',
      ],
      actions: [
        { label: 'قائمة الدخل (P&L)', subTab: 'income' },
        { label: 'الميزانية العمومية', subTab: 'balance_sheet' },
        { label: 'ميزان المراجعة', subTab: 'trial_balance' },
      ],
    },
    {
      id: 'settings',
      title: '10. إدارة التكليفات والمهام والتواصل الداخلي (Tasks & Team Chat)',
      tag: 'الإنتاجية وفريق العمل',
      tagColor: 'bg-violet-100 text-violet-800 border-violet-300',
      icon: MessageSquare,
      desc: 'توزيع التكليفات الإدارية والمحاسبية بين فريق العمل، تتبع مراحل الإنجاز، والمراسلات الفورية والإشعارات.',
      requirements: [
        'ربط المهام بالكيانات المحاسبية (مهمة جرد، مهمة تحصيل فاتورة، مهمة مراجعة قيد).',
        'سجل تاريخي (Audit History) لكل مهمة من الإنشاء حتى الاعتماد والإغلاق.',
        'نظام محادثات فورية تشاركي مع إشعارات النظام الآلية عند حدوث أي حركة هامة.',
      ],
      actions: [
        { label: 'إدارة المستخدمين', subTab: 'users' },
      ],
    },
    {
      id: 'settings',
      title: '11. إدارة قواعد البيانات والربط السحابي (Database & Cloud Engine)',
      tag: 'البنية التحتية',
      tagColor: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: Server,
      desc: 'محرك الربط مع PostgreSQL، تهيئة قواعد البيانات المستقلة للمنشآت الجديدة، المزامنة مع Google Sheets، والنسخ الاحتياطي.',
      requirements: [
        'دعم العمل المحلي دون إنترنت (Offline-First LAN Server) والمزامنة المركزية.',
        'الإنشاء التلقائي للمستخدم وقاعدة البيانات المنعزلة للشركات الجديدة.',
        'حماية الـ 18 جدولاً عبر Drizzle ORM ومنع التضارب أثناء تعدد المستخدمين.',
        'تصدير واسترجاع النسخ الاحتياطية المشفرة وتفريغ النشاط بضغطة زر.',
      ],
      actions: [
        { label: 'إدارة قواعد البيانات', subTab: 'database_backup' },
        { label: 'المزامنة مع Google Sheets', subTab: 'google_sheets' },
      ],
    },
  ];

  // تصفية المحتوى بناءً على البحث
  const filteredSops = useMemo(() => {
    if (!searchQuery.trim()) return sopWorkflows;
    const q = searchQuery.toLowerCase();
    return sopWorkflows.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.steps.some((st) => st.toLowerCase().includes(q))
    );
  }, [sopWorkflows, searchQuery]);

  const filteredRoles = useMemo(() => {
    let list = roleWorkflows;
    if (activeRoleFilter !== 'all') {
      list = list.filter((r) => r.roleKey === activeRoleFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.roleTitle.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.dailyRoutine.some((dr) => dr.toLowerCase().includes(q))
    );
  }, [roleWorkflows, activeRoleFilter, searchQuery]);

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return realDatabaseTables;
    const q = searchQuery.toLowerCase();
    return realDatabaseTables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keyFields.toLowerCase().includes(q)
    );
  }, [realDatabaseTables, searchQuery]);

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return expandedModules;
    const q = searchQuery.toLowerCase();
    return expandedModules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q) ||
        m.requirements.some((r) => r.toLowerCase().includes(q))
    );
  }, [expandedModules, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                دليل ومرجع أوربكس الشامل
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full border border-slate-700">
                Orbix Master Blueprint & SOPs
              </span>
            </div>

            {/* Realtime Database Badge */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>18 جدولاً علائقياً نشطاً في PostgreSQL</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            دليل التشغيل وإجراءات العمل والمرجع المعماري لنظام Orbix ERP
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
            المرجع المتكامل لإدارة المنشأة: إجراءات العمل القياسية (SOPs)، مسارات العمل اليومية حسب الأدوار الوظيفية، التوثيق البرمجي للجداول الـ 18 الحقيقية، والضوابط المحاسبية الإلزامية المتوافقة مع هيئة الزكاة والضريبة والجمارك (ZATCA) وحماية الأجور (WPS).
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">الوحدات الإدارية</p>
                <p className="text-sm font-bold text-white">11 وحدة متكاملة</p>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">جداول قاعدة البيانات</p>
                <p className="text-sm font-bold text-white">18 جدولاً في PostgreSQL</p>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">محرك القيود</p>
                <p className="text-sm font-bold text-white">Double-Entry 100%</p>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">الامتثال القانوني</p>
                <p className="text-sm font-bold text-white">ZATCA & WPS Ready</p>
              </div>
            </div>
          </div>

          {/* Smart Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في كامل الدليل (مثلاً: فاتورة ضريبية، قيد مزدوج، كاشير POS، جرد مستودع، شيكات، رواتب WPS، PostgreSQL)..."
                className="w-full bg-slate-800/90 text-white placeholder-slate-400 pr-11 pl-10 py-3 rounded-2xl border border-slate-700 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Search Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-400">بحث شائع:</span>
              {['فاتورة ضريبية', 'كاشير POS', 'قيد يومية', 'شيكات وبنوك', 'جرد مستودع', 'أعمار الديون', 'مسير رواتب', 'PostgreSQL'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800">
            <button
              onClick={() => setSelectedSection('sops')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedSection === 'sops'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              1. دليل التشغيل وإجراءات العمل (SOPs)
            </button>

            <button
              onClick={() => setSelectedSection('roles')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedSection === 'roles'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <Users2 className="w-4 h-4" />
              2. مسارات العمل حسب الدور الوظيفي
            </button>

            <button
              onClick={() => setSelectedSection('database')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedSection === 'database'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <Database className="w-4 h-4" />
              3. هيكل قاعدة البيانات (18 جدولاً حياً)
            </button>

            <button
              onClick={() => setSelectedSection('modules')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedSection === 'modules'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              4. تفصيل الوحدات النمطية الـ 11
            </button>

            <button
              onClick={() => setSelectedSection('accounting_rules')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedSection === 'accounting_rules'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              5. الضوابط والقواعد المحاسبية الصارمة
            </button>

            <button
              onClick={() => setSelectedSection('architecture')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedSection === 'architecture'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <Cpu className="w-4 h-4" />
              6. المعمارية التقنية والتدفق المؤتمت
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: STANDARD OPERATING PROCEDURES (SOPs) */}
      {selectedSection === 'sops' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-600" />
                إجراءات العمل القياسية ودليل التشغيل اليومي (Standard Operating Procedures)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                خطوات تنفيذ العمليات المحورية خطوة بخطوة مع توضيح الأثر المحاسبي التلقائي وروابط الانتقال المباشر للشاشات:
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              {filteredSops.length} إجراء تشغيلي متاح
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {filteredSops.map((sop) => {
              const Icon = sop.icon;
              return (
                <div
                  key={sop.id}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">{sop.title}</h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {sop.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{sop.category}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {sop.summary}
                  </p>

                  {/* Steps List */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      خطوات التنفيذ المنهجية:
                    </p>
                    <ol className="space-y-2">
                      {sop.steps.map((st, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-white border border-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Accounting Impact */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>الأثر المحاسبي التلقائي (Automatic Journal Entry):</span>
                    </div>
                    <span className="font-mono text-emerald-800 font-semibold text-[11px] bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                      {sop.accountingImpact}
                    </span>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium ml-2">انتقال سريع للشاشة:</span>
                    {sop.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleNav(act.tab, act.subTab)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>{act.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-180 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: ROLE-BASED WORKFLOWS */}
      {selectedSection === 'roles' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Users2 className="w-5 h-5 text-emerald-600" />
                مسارات العمل اليومية حسب الدور الوظيفي (Role-Based Workflows)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                دليل مهام كل مسؤول في المنشأة لضمان وضوح المسؤوليات وسلاسة إنجاز المهام:
              </p>
            </div>

            {/* Filter by Role */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all', label: 'كافة الأدوار' },
                { key: 'accountant', label: 'المحاسب المالي' },
                { key: 'storekeeper', label: 'أمين المستودع' },
                { key: 'cashier', label: 'الكاشير' },
                { key: 'collector', label: 'التحصيل والائتمان' },
                { key: 'executive', label: 'المدير العام' },
              ].map((rf) => (
                <button
                  key={rf.key}
                  onClick={() => setActiveRoleFilter(rf.key as any)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    activeRoleFilter === rf.key
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredRoles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.roleKey}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{role.roleTitle}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">مسار الإنجاز والمسؤوليات</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {role.description}
                    </p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-900 mb-2">جدول المهام اليومية للمسؤول:</p>
                      <ul className="space-y-2">
                        {role.dailyRoutine.map((rt, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{rt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Target Screens for this Role */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 mb-2">الشاشات والتقارير الأساسية لهذا الدور:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {role.primaryScreens.map((scr, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleNav(scr.tab, (scr as any).subTab)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>{scr.name}</span>
                          <ChevronRight className="w-3 h-3 rotate-180" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: REAL RELATIONAL DATABASE SCHEMA (18 TABLES) */}
      {selectedSection === 'database' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                هيكل قاعدة البيانات العلائقية الحقيقية (Real 18-Table PostgreSQL Schema)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                توثيق كامل الجداول الـ 18 النشطة في قاعدة البيانات مع عدد السجلات اللحظية، المفاتيح الأساسية والحقول الجوهرية:
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                PostgreSQL + Drizzle ORM
              </span>
              <button
                onClick={() => handleNav('settings', 'database_backup')}
                className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-1 rounded-xl transition-colors cursor-pointer"
              >
                إدارة النسخ الاحتياطي
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTables.map((tbl, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      {tbl.name}
                    </span>
                    {/* Live Record Counter */}
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>{tbl.count} سجل</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">{tbl.title}</h3>
                  <p className="text-[11px] text-slate-500 mb-2">{tbl.description}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">المفتاح: {tbl.pk}</span>
                    <span className="bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px]">{tbl.category}</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200 break-words leading-relaxed">
                    {tbl.keyFields}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Database Integrity Notice */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex items-start gap-3 text-xs text-indigo-900">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">سلامة البيانات والترابط العلائقي (Relational Integrity):</p>
              <p className="text-indigo-800 leading-relaxed text-[11px]">
                تم ربط كافة الجداول الـ 18 بآلية المزامنة المركزية المزدوجة (<code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">syncSnapshotToRelationalTables</code>) مع التحقق المستمر من توافق الحقول، وتحديث عداد الجداول الفعلي ديناميكياً من <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">information_schema.tables</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: THE 11 INTEGRATED CORE MODULES */}
      {selectedSection === 'modules' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                الوحدات الإدارية والمالية الـ 11 المتكاملة (Integrated ERP Modules)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                الهيكل التفصيلي للوحدات المترابطة مع النواة المحاسبية المركزية:
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
              11 وحدة مكتملة
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredModules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div
                  key={i}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base">{mod.title}</h3>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${mod.tagColor}`}>
                        {mod.tag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">{mod.desc}</p>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-800 mb-2">المتطلبات التقنية والمحاسبية الإلزامية:</p>
                      <ul className="space-y-1.5">
                        {mod.requirements.map((req, idx) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                    {mod.actions.map((act, actIdx) => (
                      <button
                        key={actIdx}
                        onClick={() => handleNav(mod.id, act.subTab)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <span>{act.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: STRICT ACCOUNTING RULES */}
      {selectedSection === 'accounting_rules' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              القواعد والضوابط المحاسبية الصارمة (Strict Accounting Invariants)
            </h2>
            <p className="text-xs text-slate-500">
              ضوابط برمجية مدمجة تحظر التجاوزات وتضمن توازن الدفاتر ومصداقية القوائم المالية أمام المراجعين وهيئة الزكاة والضرائب:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="font-extrabold text-rose-950 text-sm">توازن القيد المزدوج الإجباري (Zero Imbalance)</h3>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                ممنوع حفظ أو ترحيل أي قيد يومية إذا كان مجموع المدين لا يساوي مجموع الدائن بدقة متناهية (<code className="font-mono font-bold">Debit === Credit</code>). يتم التحقق على مستوى الواجهة، محرك القيد، وقيود قاعدة البيانات.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="font-extrabold text-amber-950 text-sm">عدم حذف القيود المرحلة (Audit Trail Immutability)</h3>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                بمجرد ترحيل الفاتورة أو القيد المالي، يحظر النظام حذفه نهائياً من قاعدة البيانات. التعديل يتم حصراً عبر إصدار "قيد عكسي / إشعار دائن أو مدين" للحفاظ على المسار التدقيقي الكامل المتوافق مع متطلبات التدقيق القانوني.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                <h3 className="font-extrabold text-emerald-950 text-sm">معادلة المركز المالي المتوازن (Balance Sheet Equation)</h3>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                معادلة الميزانية العمومية الصفرية: <code className="font-mono font-bold">الأصول = الخصوم + حقوق الملكية + أرباح الفترة الحالية</code>. أي انحراف يتم رصده وإبراز تنبيه أحمر فوري للمدير المالي لمراجعة الحسابات المعلقة.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</div>
                <h3 className="font-extrabold text-blue-950 text-sm">الرقابة الصارمة على الائتمان والتحصيل</h3>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                حظر آلي لإصدار أي فواتير بيع آجلة للعملاء الذين تجاوزوا الحد الائتماني المصرح به أو لديهم فواتير متعثرة تجاوزت 90 يوماً، مع وجوب سداد دفعة نقدية أو تسوية خطة الجدولة لفك الحظر.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">5</div>
                <h3 className="font-extrabold text-purple-950 text-sm">تقييم المخزون المعتمد (Weighted Average Cost)</h3>
              </div>
              <p className="text-xs text-purple-900 leading-relaxed">
                تحديث متوسط تكلفة الوحدة المرجح (WAC) آلياً مع كل إذن استلام بضاعة أو فاتورة شراء، وإثبات تكلفة البضاعة المباعة COGS بقيد آلي عند كل عملية بيع لضمان دقة هامش الربح الحقيقي.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold">6</div>
                <h3 className="font-extrabold text-slate-900 text-sm">إقفال الفترات والسنوات المالية (Fiscal Locking)</h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                إمكانية قفل الفترات المحاسبية الشهرية والسنوية لمنع أي مستخدم من إدخال أو تعديل حركات بتواريخ سابقة، مع ترحيل صافي أرباح السنة المنتهية إلى حساب الأرباح المبقاة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: ARCHITECTURE & AUTOMATED FLOW */}
      {selectedSection === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">
                النواة المحاسبية المركزية (GL Engine)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                كل حركة في النظام (بيع، شراء، صرف، قبض، رواتب، إتلاف مخزون) تُترجم لحظياً إلى قيد محاسبي مزدوج متزن دون أي تدخل يدوي.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">
                منع تضارب وتكرار البيانات (Single Source of Truth)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                العميل، المورد، الصنف، والموظف يتم تسجيلهم مرة واحدة في قاعدة البيانات وتتشارك جميع الوحدات سجلاتهم لمنع الازدواجية والتناقض.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">
                الامتثال القانوني والضريبي (ZATCA & WPS)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تطبيق معايير الفوترة الإلكترونية مع توليد رموز الاستجابة السريعة المشفرة، وملفات حماية الأجور للبنوك، وضريبة القيمة المضافة {companyProfile.defaultVatRate}%.
              </p>
            </div>
          </div>

          {/* Interactive Flow Diagram */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              مخطط تدفق العمليات المحاسبية المؤتمتة لحظياً (Automated ERP Flow)
            </h3>
            <p className="text-xs text-slate-500">
              كيف تتكامل العمليات التشغيلية وتتحول تلقائياً إلى تقارير ختامية وقوائم مالية لحظية:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">عملية بيع أو كاشير (Sales / POS Invoice)</h4>
                    <p className="text-xs text-slate-500">إصدار فاتورة ضريبية إلكترونية لعميل بقيمة 5,000 ريال</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-mono">
                  مدين: ح/ العملاء أو الصندوق (5,000) | دائن: ح/ المبيعات (4,347.83) + ح/ ضريبة القيمة المضافة (652.17)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">تأثير المخزون الفوري (Inventory COGS)</h4>
                    <p className="text-xs text-slate-500">خصم الكميات المباعة من المستودع تلقائياً وحساب التكلفة</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-mono">
                  مدين: ح/ تكلفة البضاعة المباعة COGS (3,200) | دائن: ح/ المخزون السلعي (3,200)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">تحديث مصفوفة أعمار الديون (CRM Aging)</h4>
                    <p className="text-xs text-slate-500">مراقبة سداد الفاتورة وفترة الاستحقاق (0-30، 31-60، إلخ)</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  تحديث الرصيد اللحظي للعميل وإرسال تنبيه بالتحصيل وجدولة الأقساط
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">التقارير الختامية الفورية (Financial Reports)</h4>
                    <p className="text-xs text-slate-500">انعكاس الإيراد والتكلفة في قائمة الدخل والميزانية</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-purple-900 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                  تحديث فوري لقائمة الدخل (مجمل الربح 1,147.83 ريال) والميزانية العمومية وميزان المراجعة
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
