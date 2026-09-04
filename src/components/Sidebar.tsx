import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpenCheck,
  Package,
  Receipt,
  ShoppingCart,
  Users2,
  BadgeDollarSign,
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
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { OrbixLogo } from './OrbixLogo';

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
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const {
    companyProfile,
    currency,
    accounts,
    journalEntries,
    receipts,
    salesInvoices,
    quotations,
    salesOrders,
    salesReturns,
    purchaseInvoices,
    vendors,
    products,
    warehouses,
    stockTransfers,
    stocktakingSessions,
    stockAdjustments,
    scrapVouchers,
    productBatches,
    customers,
    crmLeads,
    crmInteractions,
    crmTickets,
    salesReps,
    priceLists,
    employees,
    currencies,
    users,
    activeSubTab,
    navigateTo,
  } = useErp();

  // Low stock products count
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

  // Track expanded menu state - default to auto-expand active tab
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    accounts: true,
    sales: false,
    purchases: false,
    inventory: false,
    crm_collections: false,
    hr_payroll: false,
    financial_reports: false,
    settings: false,
  });

  // Auto expand when activeTab changes
  useEffect(() => {
    setExpandedMenus((prev) => ({
      ...prev,
      [activeTab]: true,
    }));
  }, [activeTab]);

  const toggleMenu = (menuId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

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
          label: 'الدليل',
          icon: FolderTree,
          badge: accounts.length,
        },
        {
          id: 'journal',
          label: 'القيود',
          icon: FileText,
          badge: journalEntries.length,
        },
        {
          id: 'collections',
          label: 'القبض',
          icon: ArrowDownLeft,
          badge: receipts.filter((r) => r.type === 'collection').length || undefined,
        },
        {
          id: 'payments',
          label: 'الصرف',
          icon: ArrowUpRight,
          badge: receipts.filter((r) => r.type !== 'collection').length || undefined,
        },
        {
          id: 'commissions',
          label: 'العمولات',
          icon: CreditCard,
        },
        {
          id: 'loyalty',
          label: 'الولاء',
          icon: Award,
        },
        {
          id: 'pricelists',
          label: 'الأسعار',
          icon: Tag,
          badge: priceLists.length,
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
          id: 'vendors',
          label: 'الموردين',
          icon: Building,
          badge: vendors.length,
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
      ],
    },
    {
      id: 'hr_payroll',
      label: 'الموظفين',
      icon: BadgeDollarSign,
      subItems: [
        {
          id: 'payroll',
          label: 'الرواتب',
          icon: Calendar,
        },
        {
          id: 'employees',
          label: 'الموظفين',
          icon: Users,
          badge: employees.length,
        },
      ],
    },
    {
      id: 'financial_reports',
      label: 'التقارير',
      icon: PieChart,
      subItems: [
        {
          id: 'income',
          label: 'الأرباح',
          icon: TrendingUp,
        },
        {
          id: 'balance_sheet',
          label: 'الميزانية',
          icon: Building2,
        },
        {
          id: 'trial_balance',
          label: 'المراجعة',
          icon: Scale,
        },
        {
          id: 'statement',
          label: 'الأستاذ',
          icon: FileText,
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

  return (
    <div className="w-full h-full bg-slate-900 text-slate-300 rounded-none flex flex-col justify-between border-0 shadow-none overflow-hidden select-none">
      {/* 1. TOP PINNED SECTION: Header + الرئيسية + الكاشير */}
      <div className="shrink-0 p-3 pb-2.5 bg-slate-900 border-b border-slate-800/90 space-y-2">
        {/* Navigation Header */}
        <div className="px-1 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            وحدات وخدمات النظام
          </p>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
            {currency}
          </span>
        </div>

        {/* Pinned Primary Navigation Items (الرئيسية & الكاشير) */}
        <div className="space-y-1.5">
          {pinnedItems.map((item) => {
            const Icon = item.icon;
            const isMainActive = activeTab === item.id;

            return (
              <div
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => navigateTo(item.id)}
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
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SCROLLABLE SERVICES LIST: الحسابات، المبيعات، المشتريات، المخزون، العملاء، الموظفين، التقارير، الإعدادات، الدليل */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 py-2 space-y-1.5 sidebar-scrollbar">
        <nav className="space-y-1.5" role="menu">
          {serviceItems.map((item) => {
            const Icon = item.icon;
            const isMainActive = activeTab === item.id;
            const hasSub = item.subItems && item.subItems.length > 0;
            const isExpanded = !!expandedMenus[item.id];

            return (
              <div key={item.id} className="rounded-2xl overflow-hidden">
                {/* Service Menu Button */}
                <div
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    if (hasSub) {
                      setExpandedMenus((prev) => ({ ...prev, [item.id]: true }));
                      const firstSub = item.subItems![0]?.id;
                      navigateTo(item.id, firstSub);
                    } else {
                      navigateTo(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-right cursor-pointer select-none ${
                    isMainActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20 font-semibold'
                      : item.highlight
                      ? 'bg-slate-800/80 text-amber-300 hover:bg-slate-800 hover:text-amber-200 border border-amber-500/20'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                        isMainActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 mr-2">
                    {item.badge && !isMainActive && (
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

                    {hasSub && (
                      <button
                        type="button"
                        onClick={(e) => toggleMenu(item.id, e)}
                        className={`p-1 rounded-lg hover:bg-slate-700/60 transition-transform ${
                          isMainActive ? 'text-white' : 'text-slate-400'
                        }`}
                        title={isExpanded ? 'طي القائمة' : 'توسيع القائمة'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronLeft className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Menu Dropdown Accordion */}
                {hasSub && isExpanded && (
                  <div className="mt-1 mr-3 pr-2.5 border-r border-slate-700/70 space-y-0.5 py-1">
                    {item.subItems!.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = isMainActive && activeSubTab === sub.id;

                      return (
                        <button
                          key={sub.id}
                          id={`subnav-${item.id}-${sub.id}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateTo(item.id, sub.id);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-right cursor-pointer ${
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
                        </button>
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
    </div>
  );
};
