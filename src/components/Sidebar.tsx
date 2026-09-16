import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  BookOpenCheck,
  Package,
  Receipt,
  ShoppingCart,
  Users2,
  BadgeDollarSign,
  Briefcase,
  PieChart,
  Lightbulb,
  Zap,
  Sliders,
  FolderTree,
  FileText,
  CreditCard,
  Award,
  Tag,
  FileSpreadsheet,
  RotateCcw,
  Building,
  Layers,
  AlertTriangle,
  ArrowDownUp,
  UserCheck,
  Target,
  PhoneCall,
  LifeBuoy,
  TrendingUp,
  Calendar,
  Users,
  Scale,
  Building2,
  Coins,
  ShieldCheck,
  Database,
  Laptop,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileBadge,
  ClipboardList,
  BarChart3,
  Barcode,
  ClipboardCheck,
  ArrowUpDown,
  Trash2,
  Warehouse,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  Landmark,
  FileCheck2,
  PackageCheck,
  Ship,
  Clock,
  CalendarDays,
  CalendarCheck,
  Bell,
  DollarSign,
  CheckCircle2,
  Eye,
  EyeOff,
  Star,
  X,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { OrbixLogo } from './OrbixLogo';
import { PrivacyPinModal } from './PrivacyPinModal';

export type ActiveTab =
  | 'dashboard'
  | 'quick_pos'
  | 'accounts'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'crm_collections'
  | 'hr_payroll'
  | 'financial_reports'
  | 'settings'
  | 'erp_blueprint';

export interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  children?: SubMenuItem[];
}

export interface MenuItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  posHighlight?: boolean;
  highlight?: boolean;
  subItems?: SubMenuItem[];
}

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isCollapsed = false, 
  onToggleCollapse,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const {
    companyProfile,
    currency,
    accounts = [],
    journalEntries = [],
    receipts = [],
    cheques = [],
    bankReconciliations = [],
    salesInvoices = [],
    quotations = [],
    salesOrders = [],
    salesReturns = [],
    purchaseInvoices = [],
    purchaseOrders = [],
    goodsReceipts = [],
    goodsReceiptNotes = [],
    landedCosts = [],
    purchaseReturns = [],
    vendors = [],
    products = [],
    warehouses = [],
    stockTransfers = [],
    stocktakingSessions = [],
    stockAdjustments = [],
    scrapVouchers = [],
    productBatches = [],
    customers = [],
    collectionPlans = [],
    collectionReminders = [],
    crmLeads = [],
    crmInteractions = [],
    crmTickets = [],
    salesReps = [],
    employees = [],
    attendances = [],
    leaveRequests = [],
    employeeLoans = [],
    employeeAdjustments = [],
    employeeCustodies = [],
    employeeDocuments = [],
    currencies = [],
    users = [],
    costCenters = [],
    fixedAssets = [],
    activeSubTab,
    navigateTo,
    isPrivacyMode,
    setPrivacyMode,
    favorites = [],
    toggleFavorite,
    isFavorite,
  } = useErp();

  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);

  const handleNavigate = (tabId: ActiveTab, subTabId?: string) => {
    navigateTo(tabId, subTabId);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;
  const activeLoansCount = employeeLoans.filter((l) => l.status === 'active').length;
  const assignedCustodiesCount = employeeCustodies.filter((c) => c.status === 'delivered').length;

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Low stock products count
  const lowStockCount = (products || []).filter((p) => p && p.stockQuantity <= p.minStockAlert).length;

  // Track expanded menu state - only one accordion is open at a time
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    return ['accounts', 'sales', 'purchases', 'inventory', 'crm_collections', 'hr_payroll', 'settings'].includes(activeTab)
      ? { [activeTab]: true }
      : { accounts: true };
  });

  // Auto expand the active tab when activeTab changes
  useEffect(() => {
    if (['accounts', 'sales', 'purchases', 'inventory', 'crm_collections', 'hr_payroll', 'settings'].includes(activeTab)) {
      setExpandedMenus({ [activeTab]: true });
    } else {
      setExpandedMenus({});
    }
  }, [activeTab]);

  const toggleMenu = (menuId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMenus((prev) => {
      const isCurrentlyOpen = !!prev[menuId];
      if (isCurrentlyOpen) {
        return {};
      } else {
        return { [menuId]: true };
      }
    });
  };

  const [expandedSubMenus, setExpandedSubMenus] = useState<Record<string, boolean>>({
    reports: true,
    sales_reports: true,
    purchases_reports: true,
    inventory_reports: true,
    crm_reports: true,
  });

  const toggleSubMenu = (subId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedSubMenus((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  useEffect(() => {
    if (
      activeTab === 'accounts' &&
      [
        'reports',
        'financial_reports',
        'income',
        'balance_sheet',
        'trial_balance',
        'statement',
        'journal_book',
        'cash_flow',
        'cost_centers',
        'aging',
        'tax',
      ].includes(activeSubTab)
    ) {
      setExpandedSubMenus((prev) => ({ ...prev, reports: true }));
    }

    if (
      activeTab === 'sales' &&
      [
        'sales_reports',
        'sales_summary',
        'sales_by_payment',
        'sales_top_products',
        'sales_profit_margin',
        'sales_by_customer',
        'sales_inactive_customers',
        'sales_rep_performance',
        'sales_quotes_conversion',
        'sales_returns_analysis',
      ].includes(activeSubTab)
    ) {
      setExpandedSubMenus((prev) => ({ ...prev, sales_reports: true }));
    }

    if (
      activeTab === 'purchases' &&
      [
        'purchases_reports',
        'purchases_summary',
        'purchases_by_payment',
        'purchases_vat_report',
        'purchases_top_vendors',
        'purchases_ap_aging',
        'purchases_top_items',
        'purchases_price_variance',
        'purchases_returns_analysis',
      ].includes(activeSubTab)
    ) {
      setExpandedSubMenus((prev) => ({ ...prev, purchases_reports: true }));
    }

    if (
      activeTab === 'inventory' &&
      [
        'inventory_reports',
        'inventory_valuation',
        'inventory_movement',
        'inventory_reorder',
        'inventory_aging',
        'inventory_warehouses_balance',
        'inventory_warehouses_report',
        'inventory_variance',
        'inventory_expiry',
        'inventory_profitability',
      ].includes(activeSubTab)
    ) {
      setExpandedSubMenus((prev) => ({ ...prev, inventory_reports: true }));
    }
  }, [activeTab, activeSubTab]);

  const pinnedItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: LayoutDashboard,
      badge: 'مباشر',
    },
    {
      id: 'quick_pos',
      label: 'الكاشير',
      icon: Zap,
      badge: 'سريع',
      posHighlight: true,
    },
  ];

  const serviceItems: MenuItem[] = [
    {
      id: 'accounts',
      label: 'الحسابات',
      icon: BookOpenCheck,
      badge: 'مالي',
      subItems: [
        {
          id: 'chart',
          label: 'دليل الحسابات',
          icon: FolderTree,
          badge: accounts.length,
        },
        {
          id: 'journal',
          label: 'قيود اليومية',
          icon: FileText,
          badge: journalEntries.length,
        },
        {
          id: 'collections',
          label: 'سندات القبض',
          icon: ArrowDownLeft,
          badge: receipts.filter((r) => r.type === 'collection').length || undefined,
        },
        {
          id: 'payments',
          label: 'سندات الصرف',
          icon: ArrowUpRight,
          badge: receipts.filter((r) => r.type !== 'collection').length || undefined,
        },
        {
          id: 'cheques',
          label: 'أوراق القبض والشيكات',
          icon: Landmark,
          badge: cheques.filter((c) => c.status !== 'collected' && c.status !== 'cancelled').length || undefined,
        },
        {
          id: 'reconciliation',
          label: 'التسوية البنكية',
          icon: FileCheck2,
          badge: bankReconciliations.filter((b) => b.status === 'in_progress').length || undefined,
        },
        {
          id: 'costcenters',
          label: 'مراكز التكلفة والمشاريع',
          icon: Target,
          badge: costCenters.length || undefined,
        },
        {
          id: 'fixedassets',
          label: 'الأصول الثابتة والإهلاك',
          icon: Building,
          badge: fixedAssets.length || undefined,
        },
        {
          id: 'fiscal_closing',
          label: 'إقفال الفترات والسنوات المالية',
          icon: CalendarCheck,
          badge: 'إقفال',
        },
        {
          id: 'budgets',
          label: 'الموازنات التقديرية',
          icon: PieChart,
          badge: 'موازنة',
        },
        {
          id: 'reports',
          label: 'التقارير المالية',
          icon: Scale,
          badge: '9 تقارير',
          children: [
            {
              id: 'income',
              label: 'قائمة الدخل والأرباح (P&L)',
              icon: TrendingUp,
            },
            {
              id: 'balance_sheet',
              label: 'الميزانية والمركز المالي',
              icon: Building2,
            },
            {
              id: 'trial_balance',
              label: 'ميزان المراجعة بالمجاميع',
              icon: Scale,
            },
            {
              id: 'statement',
              label: 'دفتر الأستاذ وكشف الحساب',
              icon: BookOpenCheck,
            },
            {
              id: 'journal_book',
              label: 'دفتر اليومية العامة',
              icon: FileText,
            },
            {
              id: 'cash_flow',
              label: 'قائمة التدفقات النقدية',
              icon: Banknote,
            },
            {
              id: 'cost_centers',
              label: 'أرباح مراكز التكلفة',
              icon: Target,
            },
            {
              id: 'aging',
              label: 'أعمار الديون والذمم',
              icon: Clock,
            },
            {
              id: 'tax',
              label: 'ملخص الضريبة المضافة (VAT)',
              icon: Receipt,
            },
          ],
        },
      ],
    },
    {
      id: 'sales',
      label: 'المبيعات',
      icon: Receipt,
      subItems: [
        {
          id: 'quotes',
          label: 'العروض',
          icon: FileBadge,
          badge: quotations.length > 0 ? quotations.length : undefined,
        },
        {
          id: 'orders',
          label: 'الطلبيات',
          icon: ClipboardList,
          badge: salesOrders.length > 0 ? salesOrders.length : undefined,
        },
        {
          id: 'invoices',
          label: 'الفواتير',
          icon: FileSpreadsheet,
          badge: salesInvoices.length,
        },
        {
          id: 'returns',
          label: 'المردودات',
          icon: RotateCcw,
          badge: salesReturns.length > 0 ? salesReturns.length : undefined,
        },
        {
          id: 'sales_reports',
          label: 'تقارير المبيعات',
          icon: BarChart3,
          badge: '9',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          children: [
            {
              id: 'sales_summary',
              label: 'ملخص المبيعات الدوري',
              icon: TrendingUp,
            },
            {
              id: 'sales_by_payment',
              label: 'المبيعات حسب طرق الدفع',
              icon: CreditCard,
            },
            {
              id: 'sales_top_products',
              label: 'الأصناف الأكثر مبيعاً وربحية',
              icon: Package,
            },
            {
              id: 'sales_profit_margin',
              label: 'هوامش ومجمل ربح المبيعات',
              icon: PieChart,
            },
            {
              id: 'sales_by_customer',
              label: 'تحليل مبيعات كبار العملاء',
              icon: Users2,
            },
            {
              id: 'sales_inactive_customers',
              label: 'العملاء الراكدون وغير النشطين',
              icon: Clock,
            },
            {
              id: 'sales_rep_performance',
              label: 'أداء المناديب وتحقيق المستهدف',
              icon: Target,
            },
            {
              id: 'sales_quotes_conversion',
              label: 'كفاءة وتحويل عروض الأسعار',
              icon: FileBadge,
            },
            {
              id: 'sales_returns_analysis',
              label: 'تحليل المرتجعات ونسبة الهدر',
              icon: RotateCcw,
            },
          ],
        },
      ],
    },
    {
      id: 'purchases',
      label: 'المشتريات',
      icon: ShoppingCart,
      subItems: [
        {
          id: 'bills',
          label: 'الفواتير',
          icon: FileSpreadsheet,
          badge: purchaseInvoices.length,
        },
        {
          id: 'purchase_orders',
          label: 'أوامر الشراء',
          icon: FileCheck2,
          badge: purchaseOrders.length > 0 ? purchaseOrders.length : undefined,
        },
        {
          id: 'goods_receipts',
          label: 'أذونات الاستلام (GRN)',
          icon: PackageCheck,
          badge:
            (goodsReceiptNotes?.length || goodsReceipts?.length || 0) > 0
              ? goodsReceiptNotes?.length || goodsReceipts?.length
              : undefined,
        },
        {
          id: 'landed_costs',
          label: 'تكاليف الشحن والجمارك',
          icon: Ship,
          badge: landedCosts.length > 0 ? landedCosts.length : undefined,
        },
        {
          id: 'returns',
          label: 'مردودات المشتريات',
          icon: RotateCcw,
          badge: purchaseReturns.length > 0 ? purchaseReturns.length : undefined,
        },
        {
          id: 'vendor_aging',
          label: 'أعمار ديون الموردين',
          icon: Clock,
        },
        {
          id: 'vendors',
          label: 'الموردين',
          icon: Building,
          badge: vendors.length,
        },
        {
          id: 'purchases_reports',
          label: 'تقارير المشتريات',
          icon: BarChart3,
          badge: '8',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          children: [
            {
              id: 'purchases_summary',
              label: 'ملخص المشتريات الدوري',
              icon: TrendingUp,
            },
            {
              id: 'purchases_by_payment',
              label: 'المشتريات حسب طرق السداد',
              icon: CreditCard,
            },
            {
              id: 'purchases_vat_report',
              label: 'ضريبة المدخلات (VAT)',
              icon: Receipt,
            },
            {
              id: 'purchases_top_vendors',
              label: 'تحليل كبار الموردين',
              icon: Users2,
            },
            {
              id: 'purchases_ap_aging',
              label: 'أعمار ديون الموردين والمدفوعات',
              icon: Clock,
            },
            {
              id: 'purchases_top_items',
              label: 'الأصناف الأكثر شراءً وإنفاقاً',
              icon: Package,
            },
            {
              id: 'purchases_price_variance',
              label: 'تذبذب وتغير أسعار الشراء',
              icon: ArrowUpDown,
            },
            {
              id: 'purchases_returns_analysis',
              label: 'تحليل مردودات المشتريات',
              icon: RotateCcw,
            },
          ],
        },
      ],
    },
    {
      id: 'inventory',
      label: 'المخزون',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
      badgeColor: lowStockCount > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : undefined,
      subItems: [
        {
          id: 'all',
          label: 'الأصناف',
          icon: Layers,
          badge: products.length,
        },
        {
          id: 'low_stock',
          label: 'النواقص',
          icon: AlertTriangle,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-rose-500/30 text-rose-300',
        },
        {
          id: 'transfers',
          label: 'التحويلات',
          icon: ArrowRightLeft,
          badge: stockTransfers.filter((t) => t.status === 'in_transit' || t.status === 'pending').length > 0
            ? stockTransfers.filter((t) => t.status === 'in_transit' || t.status === 'pending').length
            : undefined,
        },
        {
          id: 'stocktaking',
          label: 'الجرد',
          icon: ClipboardCheck,
          badge: stocktakingSessions.filter((s) => s.status === 'in_progress').length > 0
            ? stocktakingSessions.filter((s) => s.status === 'in_progress').length
            : undefined,
        },
        {
          id: 'adjustments',
          label: 'التسوية',
          icon: ArrowUpDown,
          badge: stockAdjustments.length > 0 ? stockAdjustments.length : undefined,
        },
        {
          id: 'scrap',
          label: 'التوالف',
          icon: Trash2,
          badge: scrapVouchers.length > 0 ? scrapVouchers.length : undefined,
        },
        {
          id: 'batches',
          label: 'الصلاحيات',
          icon: Calendar,
          badge: productBatches.filter((b) => b.status === 'expired' || b.status === 'near_expiry').length > 0
            ? productBatches.filter((b) => b.status === 'expired' || b.status === 'near_expiry').length
            : undefined,
          badgeColor: 'bg-amber-500/30 text-amber-300',
        },
        {
          id: 'barcodes',
          label: 'الباركود',
          icon: Barcode,
        },
        {
          id: 'warehouses',
          label: 'المستودعات',
          icon: Warehouse,
          badge: warehouses.length,
        },
        {
          id: 'inventory_reports',
          label: 'تقارير المخزون',
          icon: BarChart3,
          badge: '8',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          children: [
            {
              id: 'inventory_valuation',
              label: 'تقييم المخزون المالي',
              icon: DollarSign,
            },
            {
              id: 'inventory_movement',
              label: 'كشف وحركة الصنف',
              icon: ArrowRightLeft,
            },
            {
              id: 'inventory_reorder',
              label: 'مراقبة النواقص وحد الطلب',
              icon: AlertTriangle,
            },
            {
              id: 'inventory_aging',
              label: 'دوران وركود المخزون',
              icon: Clock,
            },
            {
              id: 'inventory_warehouses_balance',
              label: 'أرصدة المستودعات والمقارنة',
              icon: Building2,
            },
            {
              id: 'inventory_variance',
              label: 'عجز وفروقات الجرد',
              icon: Scale,
            },
            {
              id: 'inventory_expiry',
              label: 'الصلاحيات والتشغيلات والتوالف',
              icon: Calendar,
            },
            {
              id: 'inventory_profitability',
              label: 'ربحية وهامش الأصناف',
              icon: TrendingUp,
            },
          ],
        },
      ],
    },
    {
      id: 'crm_collections',
      label: 'العملاء',
      icon: Users2,
      badge: 'CRM',
      subItems: [
        {
          id: 'crm_analytics',
          label: 'التحليلات والرسوم',
          icon: BarChart3,
        },
        {
          id: 'customers',
          label: 'الدليل',
          icon: UserCheck,
          badge: customers.length,
        },
        {
          id: 'collection_plans',
          label: 'خطط وجدولة التحصيل',
          icon: CalendarDays,
          badge: collectionPlans.length > 0 ? collectionPlans.length : undefined,
        },
        {
          id: 'collection_reminders',
          label: 'تذكيرات ومتابعات التحصيل',
          icon: Bell,
          badge: collectionReminders.length > 0 ? collectionReminders.length : undefined,
        },
        {
          id: 'customer_aging',
          label: 'أعمار ديون العملاء',
          icon: Clock,
        },
        {
          id: 'pipeline',
          label: 'الفرص',
          icon: Target,
          badge: crmLeads.length,
        },
        {
          id: 'interactions',
          label: 'المتابعات',
          icon: PhoneCall,
          badge: crmInteractions.length,
        },
        {
          id: 'tickets',
          label: 'التذاكر',
          icon: LifeBuoy,
          badge: crmTickets.length,
        },
        {
          id: 'sales_reps',
          label: 'المناديب',
          icon: TrendingUp,
          badge: salesReps.length,
        },
        {
          id: 'crm_reports',
          label: 'تقارير العملاء والتحصيل',
          icon: BarChart3,
          badge: '8',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          children: [
            {
              id: 'crm_customer_statement',
              label: 'كشف حساب العميل التحليلي',
              icon: FileText,
            },
            {
              id: 'crm_collection_efficiency',
              label: 'كفاءة ونسب التحصيل الشهري',
              icon: CheckCircle2,
            },
            {
              id: 'crm_rfm_segmentation',
              label: 'تصنيف العملاء (RFM)',
              icon: Award,
            },
            {
              id: 'crm_credit_risk',
              label: 'أعمار الديون والمخاطر الائتمانية',
              icon: AlertTriangle,
            },
            {
              id: 'crm_rep_productivity',
              label: 'أداء وإنتاجية المناديب',
              icon: TrendingUp,
            },
            {
              id: 'crm_pipeline_funnel',
              label: 'مسار الفرص ونسب التحويل',
              icon: Target,
            },
            {
              id: 'crm_touchpoints_activity',
              label: 'سجل الاتصالات والمتابعات',
              icon: PhoneCall,
            },
            {
              id: 'crm_support_sla',
              label: 'تذاكر الدعم وسرعة الاستجابة',
              icon: LifeBuoy,
            },
          ],
        },
      ],
    },
    {
      id: 'hr_payroll',
      label: 'الموارد البشرية',
      icon: Briefcase,
      badge: 'HR',
      subItems: [
        {
          id: 'payroll',
          label: 'الرواتب والأجور',
          icon: Banknote,
        },
        {
          id: 'employees',
          label: 'دليل وسجل الموظفين',
          icon: Users,
          badge: employees.length,
        },
        {
          id: 'attendance',
          label: 'الحضور والانصراف والورديات',
          icon: Clock,
          badge: attendances.length > 0 ? attendances.length : undefined,
        },
        {
          id: 'leaves',
          label: 'الإجازات والأذونات',
          icon: CalendarDays,
          badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
          badgeColor: 'bg-amber-500/30 text-amber-300',
        },
        {
          id: 'loans',
          label: 'السلف والقروض وجدولتها',
          icon: CreditCard,
          badge: activeLoansCount > 0 ? activeLoansCount : undefined,
        },
        {
          id: 'adjustments',
          label: 'الجزاءات والمكافآت',
          icon: Award,
        },
        {
          id: 'custodies',
          label: 'العهد العينية والمالية',
          icon: ShieldCheck,
          badge: assignedCustodiesCount > 0 ? assignedCustodiesCount : undefined,
        },
        {
          id: 'contracts_docs',
          label: 'العقود ومكافأة نهاية الخدمة',
          icon: FileText,
        },
        {
          id: 'hr_reports',
          label: 'تقارير وتحليلات الموارد البشرية',
          icon: BarChart3,
          badge: 'KPI',
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        },
      ],
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: Sliders,
      badge: 'أدمن',
      subItems: [
        {
          id: 'company',
          label: 'المنشأة',
          icon: Building2,
        },
        {
          id: 'currencies',
          label: 'العملات',
          icon: Coins,
          badge: currencies.length,
        },
        {
          id: 'users_rbac',
          label: 'المستخدمين',
          icon: ShieldCheck,
          badge: users.length,
        },
        {
          id: 'database_backup',
          label: 'النسخ',
          icon: Database,
        },
        {
          id: 'gsheets',
          label: 'Sheets',
          icon: FileSpreadsheet,
        },
        {
          id: 'desktop_exe',
          label: 'EXE',
          icon: Laptop,
        },
      ],
    },
    {
      id: 'erp_blueprint',
      label: 'الدليل',
      icon: Lightbulb,
      highlight: true,
    },
  ];

  interface FavoriteDetail {
    key: string;
    label: string;
    tabId: ActiveTab;
    subTabId?: string;
    groupLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const getFavoriteItemDetails = (favKey: string): FavoriteDetail | null => {
    if (!favKey) return null;

    // 1. Check pinnedItems
    const pinned = pinnedItems.find((p) => p.id === favKey);
    if (pinned) {
      return {
        key: pinned.id,
        label: pinned.label,
        tabId: pinned.id as ActiveTab,
        groupLabel: 'رئيسي',
        icon: pinned.icon,
      };
    }

    // 2. Check direct serviceItem
    const directService = serviceItems.find((s) => s.id === favKey);
    if (directService) {
      return {
        key: directService.id,
        label: directService.label,
        tabId: directService.id,
        groupLabel: 'خدمات',
        icon: directService.icon,
      };
    }

    // 3. Check format "tabId:subId"
    if (favKey.includes(':')) {
      const [tabId, subId] = favKey.split(':');
      const parentMenu = serviceItems.find((m) => m.id === tabId);
      if (parentMenu && parentMenu.subItems) {
        const sub = parentMenu.subItems.find((s) => s.id === subId);
        if (sub) {
          return {
            key: favKey,
            label: sub.label,
            tabId: tabId as ActiveTab,
            subTabId: subId,
            groupLabel: parentMenu.label,
            icon: sub.icon,
          };
        }

        for (const s of parentMenu.subItems) {
          if (s.children) {
            const child = s.children.find((c) => c.id === subId);
            if (child) {
              return {
                key: favKey,
                label: child.label,
                tabId: tabId as ActiveTab,
                subTabId: subId,
                groupLabel: parentMenu.label,
                icon: child.icon,
              };
            }
          }
        }
      }
    }

    // 4. Shorthand fallback without colon
    for (const parentMenu of serviceItems) {
      if (parentMenu.subItems) {
        const sub = parentMenu.subItems.find((s) => s.id === favKey);
        if (sub) {
          return {
            key: `${parentMenu.id}:${sub.id}`,
            label: sub.label,
            tabId: parentMenu.id as ActiveTab,
            subTabId: sub.id,
            groupLabel: parentMenu.label,
            icon: sub.icon,
          };
        }
        for (const s of parentMenu.subItems) {
          if (s.children) {
            const child = s.children.find((c) => c.id === favKey);
            if (child) {
              return {
                key: `${parentMenu.id}:${child.id}`,
                label: child.label,
                tabId: parentMenu.id as ActiveTab,
                subTabId: child.id,
                groupLabel: parentMenu.label,
                icon: child.icon,
              };
            }
          }
        }
      }
    }

    return null;
  };

  // Compute strictly valid, deduplicated favorites
  const validFavorites = useMemo(() => {
    const seen = new Set<string>();
    const list: FavoriteDetail[] = [];
    for (const key of favorites) {
      const detail = getFavoriteItemDetails(key);
      if (detail) {
        const uniqueKey = `${detail.tabId}:${detail.subTabId || ''}`;
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          list.push(detail);
        }
      }
    }
    return list;
  }, [favorites, serviceItems, pinnedItems]);

  return (
    <div className="w-full h-full bg-slate-900 text-slate-300 rounded-none flex flex-col justify-between border-0 shadow-none overflow-hidden select-none">
      {/* 1. TOP PINNED SECTION: Header + الرئيسية + الكاشير */}
      <div className={`shrink-0 bg-slate-900 border-b border-slate-800/90 transition-all ${
        isCollapsed ? 'p-2 space-y-2' : 'p-3 pb-2.5 space-y-2'
      }`}>
        {/* Navigation Header */}
        {!isCollapsed ? (
          <div className="px-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                وحدات وخدمات النظام
              </p>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                {currency}
              </span>
            </div>
            {isMobileDrawer ? (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                title="إغلاق القائمة"
                aria-label="إغلاق القائمة"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-400 hover:text-emerald-400 border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                title="طي القائمة الجانبية (إظهار الأيقونات فقط)"
                aria-label="طي القائمة الجانبية"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 group"
              title="توسيع القائمة الجانبية (عرض كامل)"
              aria-label="توسيع القائمة الجانبية"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Pinned Primary Navigation Items (الرئيسية & الكاشير) */}
        <div className="space-y-1.5">
          {pinnedItems.map((item) => {
            const Icon = item.icon;
            const isMainActive = activeTab === item.id;

            if (isCollapsed) {
              return (
                <div key={item.id} className="flex justify-center">
                  <button
                    type="button"
                    id={`nav-tab-${item.id}`}
                    onClick={() => {
                      setExpandedMenus({});
                      handleNavigate(item.id);
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative shadow-2xs active:scale-95 ${
                      isMainActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-bold'
                        : item.posHighlight
                        ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-500/40'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                    title={`${item.label}${item.badge ? ` (${item.badge})` : ''}`}
                    aria-label={item.label}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isMainActive
                          ? 'text-white'
                          : item.posHighlight
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    />
                    {isMainActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                    )}
                    {item.id === 'dashboard' && isPrivacyMode && (
                      <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" title="وضع الخصوصية نشط" />
                    )}
                  </button>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  setExpandedMenus({});
                  handleNavigate(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-right cursor-pointer select-none ${
                  isMainActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30 font-bold'
                    : item.posHighlight
                    ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                      isMainActive
                        ? 'text-white'
                        : item.posHighlight
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 mr-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                        isMainActive
                          ? 'bg-white/20 text-white'
                          : item.badge === 'سريع'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Star Toggle for quick_pos */}
                  {item.id === 'quick_pos' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite('quick_pos');
                      }}
                      className="p-1 rounded-md hover:bg-emerald-800/50 transition-all cursor-pointer flex items-center justify-center"
                      title={isFavorite('quick_pos') ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 transition-all ${
                          isFavorite('quick_pos')
                            ? 'fill-amber-400 text-amber-400 scale-110'
                            : 'text-emerald-400/60 hover:text-amber-400 opacity-60 hover:opacity-100'
                        }`}
                      />
                    </button>
                  )}

                  {/* Privacy Mode Eye Toggle next to 'مباشر' */}
                  {item.id === 'dashboard' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPrivacyMode) {
                          setIsPinModalOpen(true);
                        } else {
                          setPrivacyMode(true);
                        }
                      }}
                      className={`p-1 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                        isPrivacyMode
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-sm'
                          : isMainActive
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title={
                        isPrivacyMode
                          ? 'وضع الخصوصية مفعل (الأرقام محجوبة) - اضغط لإلغاء الحجب برمز PIN'
                          : 'تفعيل وضع الخصوصية وحجب الأرقام المالية الحساسة'
                      }
                      aria-label="تبديل وضع الخصوصية"
                    >
                      {isPrivacyMode ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SCROLLABLE SERVICES LIST: الحسابات، المبيعات، المشتريات، المخزون، العملاء، الموظفين، التقارير، الإعدادات، الدليل */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 sidebar-scrollbar transition-all ${
        isCollapsed ? 'p-2 py-2' : 'p-3 py-2'
      }`}>
        <nav className="space-y-1.5" role="menu">
          {/* FAVORITES SECTION (قائمة الخدمات المفضلة) */}
          {isCollapsed ? (
            <div className="flex justify-center mb-2">
              <button
                type="button"
                onClick={() => onToggleCollapse?.()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative shadow-2xs active:scale-95 ${
                  validFavorites.length > 0
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40 hover:bg-amber-900/60'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
                title={`الخدمات المفضلة (${validFavorites.length})`}
                aria-label="الخدمات المفضلة"
              >
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                {validFavorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                    {validFavorites.length}
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-amber-950/20 overflow-hidden shadow-xs mb-2 transition-all">
              {/* Favorites Accordion Header */}
              <div
                onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-2xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <span className="font-extrabold text-amber-300 text-xs sm:text-sm">الخدمات المفضلة</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 mr-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-amber-400 text-slate-950 shadow-2xs">
                    {validFavorites.length}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFavoritesOpen(!isFavoritesOpen);
                    }}
                    className="p-0.5 rounded text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    {isFavoritesOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronLeft className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Favorites Dropdown List */}
              {isFavoritesOpen && (
                <div className="px-2 pb-2.5 pt-0.5 space-y-1 border-t border-amber-500/20">
                  {validFavorites.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-[11px] bg-slate-900/60 rounded-xl border border-slate-800 my-1">
                      <p className="font-semibold text-slate-300 mb-0.5">لا توجد خدمات في المفضلة بعد.</p>
                      <p className="text-[10px] text-amber-400/80">اضغط على رمز النجمة (☆) بجانب أي خدمة لإضافتها هنا للوصول السريع!</p>
                    </div>
                  ) : (
                    validFavorites.map((detail) => {
                      const FavIcon = detail.icon;
                      const isFavActive = activeTab === detail.tabId && (!detail.subTabId || activeSubTab === detail.subTabId);

                      return (
                        <div
                          key={detail.key}
                          onClick={() => handleNavigate(detail.tabId, detail.subTabId)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer group border ${
                            isFavActive
                              ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 font-bold'
                              : 'bg-slate-900/70 hover:bg-slate-800/80 text-slate-200 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FavIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate font-medium">{detail.label}</span>
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-slate-700/60 shrink-0">
                              {detail.groupLabel}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(detail.key);
                            }}
                            className="p-1 rounded-md text-amber-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
                            title="إزالة من المفضلة"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 hover:fill-rose-400" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {serviceItems.map((item) => {
            const Icon = item.icon;
            const hasSub = item.subItems && item.subItems.length > 0;
            const isExpanded = !!expandedMenus[item.id];
            const isMainActive = activeTab === item.id;
            const isHeaderGreen = hasSub ? isExpanded : isMainActive;

            if (isCollapsed) {
              return (
                <div key={item.id} className="flex justify-center">
                  <button
                    type="button"
                    id={`nav-tab-${item.id}`}
                    onClick={() => {
                      if (hasSub) {
                        const firstSub = item.subItems![0]?.id;
                        handleNavigate(item.id, firstSub);
                      } else {
                        handleNavigate(item.id);
                      }
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative shadow-2xs active:scale-95 ${
                      isMainActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-bold'
                        : item.highlight
                        ? 'bg-slate-800/80 text-amber-300 hover:bg-slate-800 hover:text-amber-200 border border-amber-500/20'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                    }`}
                    title={`${item.label}${item.badge ? ` (${item.badge})` : ''}`}
                    aria-label={item.label}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isMainActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                    {isMainActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                    )}
                  </button>
                </div>
              );
            }

            return (
              <div key={item.id} className="rounded-2xl overflow-hidden">
                {/* Service Menu Button */}
                <div
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    if (hasSub) {
                      toggleMenu(item.id);
                      if (activeTab !== item.id) {
                        const defaultSub = item.subItems?.[0]?.id;
                        handleNavigate(item.id, defaultSub);
                      }
                    } else {
                      handleNavigate(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-right cursor-pointer select-none ${
                    isHeaderGreen
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20 font-semibold'
                      : item.highlight
                      ? 'bg-slate-800/80 text-amber-300 hover:bg-slate-800 hover:text-amber-200 border border-amber-500/20'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                        isHeaderGreen
                          ? 'text-white'
                          : item.highlight
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 mr-2">
                    {item.badge && !isHeaderGreen && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                          item.badgeColor
                            ? item.badgeColor
                            : item.badge === 'جديد'
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : item.badge === 'تحصيل'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {hasSub ? (
                      <button
                        type="button"
                        onClick={(e) => toggleMenu(item.id, e)}
                        className={`p-1 rounded-lg hover:bg-slate-700/60 transition-transform ${
                          isHeaderGreen ? 'text-white' : 'text-slate-400'
                        }`}
                        title={isExpanded ? 'طي القائمة' : 'توسيع القائمة'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronLeft className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className="p-1 rounded-md hover:bg-slate-700/80 transition-all cursor-pointer"
                        title={isFavorite(item.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 transition-all ${
                            isFavorite(item.id)
                              ? 'fill-amber-400 text-amber-400 scale-110'
                              : 'text-slate-500 hover:text-amber-400 opacity-40 hover:opacity-100'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Menu Dropdown Accordion */}
                {hasSub && isExpanded && (
                  <div className="mt-1 mr-3 pr-2.5 border-r border-slate-700/70 space-y-0.5 py-1">
                    {item.subItems!.map((sub) => {
                      const SubIcon = sub.icon;
                      const hasChildren = sub.children && sub.children.length > 0;
                      const isSubExpanded = !!expandedSubMenus[sub.id];

                      const isChildActive =
                        hasChildren &&
                        isMainActive &&
                        sub.children!.some((c) => c.id === activeSubTab);

                      const isSubActive =
                        isMainActive &&
                        (activeSubTab === sub.id ||
                          isChildActive ||
                          (sub.id === 'reports' &&
                            [
                              'reports',
                              'financial_reports',
                              'income',
                              'balance_sheet',
                              'trial_balance',
                              'statement',
                              'journal_book',
                              'cash_flow',
                              'cost_centers',
                              'aging',
                              'tax',
                            ].includes(activeSubTab)) ||
                          (sub.id === 'collections' && activeSubTab === 'receipts') ||
                          (sub.id === 'payments' && activeSubTab === 'expenses'));

                      const subKey = `${item.id}:${sub.id}`;
                      const subIsFav = isFavorite(subKey);

                      return (
                        <div key={sub.id} className="space-y-0.5">
                          <button
                            id={`subnav-${item.id}-${sub.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasChildren) {
                                toggleSubMenu(sub.id);
                                if (!isChildActive) {
                                  handleNavigate(item.id, sub.children![0].id);
                                }
                              } else {
                                handleNavigate(item.id, sub.id);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-right cursor-pointer group ${
                              isSubActive
                                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border-r-2 border-emerald-400'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SubIcon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSubActive ? 'text-emerald-400' : 'text-slate-500'
                                }`}
                              />
                              <span className="truncate">{sub.label}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {sub.badge !== undefined && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono tabular-nums ${
                                    sub.badgeColor
                                      ? sub.badgeColor
                                      : isSubActive
                                      ? 'bg-emerald-400/20 text-emerald-300'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                                  }`}
                                >
                                  {sub.badge}
                                </span>
                              )}

                              {/* Star Toggle for SubItem (when not a parent with children) */}
                              {!hasChildren && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(subKey);
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-700/80 transition-all cursor-pointer flex items-center justify-center"
                                  title={subIsFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 transition-all ${
                                      subIsFav
                                        ? 'fill-amber-400 text-amber-400 scale-110'
                                        : 'text-slate-500 hover:text-amber-400 opacity-40 group-hover:opacity-100 hover:scale-110'
                                    }`}
                                  />
                                </span>
                              )}

                              {hasChildren && (
                                <span
                                  onClick={(e) => toggleSubMenu(sub.id, e)}
                                  className="p-0.5 rounded hover:bg-slate-700/60 text-slate-400"
                                >
                                  {isSubExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <ChevronLeft className="w-3 h-3 text-slate-400" />
                                  )}
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Nested Dropdown for sub.children (e.g. the 9 Financial Reports) */}
                          {hasChildren && isSubExpanded && (
                            <div className="mr-3 pr-2 border-r border-emerald-500/30 space-y-0.5 py-1 my-0.5">
                              {sub.children!.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildBtnActive = isMainActive && activeSubTab === child.id;
                                const childKey = `${item.id}:${child.id}`;
                                const childIsFav = isFavorite(childKey);

                                return (
                                  <button
                                    key={child.id}
                                    id={`subnav-child-${item.id}-${child.id}`}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNavigate(item.id, child.id);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] transition-all text-right cursor-pointer group ${
                                      isChildBtnActive
                                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 font-medium'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <ChildIcon
                                        className={`w-3.5 h-3.5 shrink-0 ${
                                          isChildBtnActive ? 'text-slate-950' : 'text-slate-500'
                                        }`}
                                      />
                                      <span className="truncate">{child.label}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isChildBtnActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 shrink-0"></span>
                                      )}
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(childKey);
                                        }}
                                        className="p-0.5 rounded hover:bg-slate-700/80 transition-all cursor-pointer flex items-center justify-center"
                                        title={childIsFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                                      >
                                        <Star
                                          className={`w-3.5 h-3.5 transition-all ${
                                            childIsFav
                                              ? 'fill-amber-400 text-amber-400 scale-110'
                                              : isChildBtnActive
                                              ? 'text-slate-800 hover:text-amber-300 opacity-60 hover:opacity-100'
                                              : 'text-slate-500 hover:text-amber-400 opacity-40 group-hover:opacity-100 hover:scale-110'
                                          }`}
                                        />
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 3. BOTTOM PINNED FOOTER */}
      {isCollapsed ? (
        <div className="shrink-0 p-2 bg-slate-900 border-t border-slate-800 flex justify-center">
          <div 
            className="w-10 h-10 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-center justify-center text-emerald-400 relative cursor-default"
            title={`${companyProfile.nameAr} - قيد مزدوج آلي`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="shrink-0 p-3 bg-slate-900 border-t border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-200 font-semibold">
              <span className="truncate max-w-[140px] text-[11px] font-bold text-emerald-400">
                {companyProfile.nameAr}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              قيد مزدوج آلي • ضريبة {companyProfile.defaultVatRate || 14}%
            </p>
          </div>
        </div>
      )}

      {/* Privacy Mode PIN Verification Modal */}
      <PrivacyPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => setPrivacyMode(false)}
      />
    </div>
  );
};
