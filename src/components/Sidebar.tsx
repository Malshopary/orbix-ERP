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
} from 'lucide-react';
import { useErp } from '../context/ErpContext';

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
    salesInvoices,
    salesReturns,
    purchaseInvoices,
    vendors,
    products,
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

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'لوحة القيادة والملخصات',
      icon: LayoutDashboard,
      badge: 'مباشر',
    },
    {
      id: 'quick_pos',
      label: 'فاتورة سريعة / كاشير POS',
      icon: Zap,
      badge: 'سريع',
      posHighlight: true,
    },
    {
      id: 'accounts',
      label: 'الحسابات والتحصيلات والعمولات',
      icon: BookOpenCheck,
      badge: 'مالي',
      subItems: [
        {
          id: 'chart',
          label: 'شجرة ودليل الحسابات',
          icon: FolderTree,
          badge: accounts.length,
        },
        {
          id: 'journal',
          label: 'سجل قيود اليومية',
          icon: FileText,
          badge: journalEntries.length,
        },
        {
          id: 'collections',
          label: 'التحصيلات وسندات القبض',
          icon: Receipt,
        },
        {
          id: 'commissions',
          label: 'عمولات المناديب وسندات الصرف',
          icon: CreditCard,
        },
        {
          id: 'loyalty',
          label: 'نقاط الولاء والمكافآت',
          icon: Award,
        },
        {
          id: 'pricelists',
          label: 'قوائم الأسعار وتخصيص التسعير',
          icon: Tag,
          badge: priceLists.length,
        },
      ],
    },
    {
      id: 'sales',
      label: 'المبيعات والفواتير الضريبية',
      icon: Receipt,
      subItems: [
        {
          id: 'invoices',
          label: 'فواتير المبيعات الضريبية',
          icon: FileSpreadsheet,
          badge: salesInvoices.length,
        },
        {
          id: 'returns',
          label: 'مردودات ومرتجع المبيعات',
          icon: RotateCcw,
          badge: salesReturns.length > 0 ? salesReturns.length : undefined,
        },
      ],
    },
    {
      id: 'purchases',
      label: 'المشتريات والموردين',
      icon: ShoppingCart,
      subItems: [
        {
          id: 'bills',
          label: 'فواتير المشتريات والمصروفات',
          icon: FileSpreadsheet,
          badge: purchaseInvoices.length,
        },
        {
          id: 'vendors',
          label: 'دليل الموردين والشركات',
          icon: Building,
          badge: vendors.length,
        },
      ],
    },
    {
      id: 'inventory',
      label: 'المخازن وحركة المخزون',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} ناقص` : undefined,
      badgeColor: lowStockCount > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : undefined,
      subItems: [
        {
          id: 'all',
          label: 'قائمة الأصناف والمخزون',
          icon: Layers,
          badge: products.length,
        },
        {
          id: 'low_stock',
          label: 'تنبيهات النواقص والحد الأدنى',
          icon: AlertTriangle,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-rose-500/30 text-rose-300',
        },
        {
          id: 'adjust',
          label: 'تسوية وتعديل كميات المخزون',
          icon: ArrowDownUp,
        },
      ],
    },
    {
      id: 'crm_collections',
      label: 'إدارة علاقات العملاء CRM 360',
      icon: Users2,
      badge: 'مبيعات',
      subItems: [
        {
          id: 'customers',
          label: 'دليل وملفات العملاء 360',
          icon: UserCheck,
          badge: customers.length,
        },
        {
          id: 'pipeline',
          label: 'مسار الفرص البيعية Pipeline',
          icon: Target,
          badge: crmLeads.length,
        },
        {
          id: 'interactions',
          label: 'سجل المكالمات والزيارات',
          icon: PhoneCall,
          badge: crmInteractions.length,
        },
        {
          id: 'tickets',
          label: 'تذاكر الدعم والشكاوى',
          icon: LifeBuoy,
          badge: crmTickets.length,
        },
        {
          id: 'sales_reps',
          label: 'لوحة مناديب ومسؤولي المبيعات',
          icon: TrendingUp,
          badge: salesReps.length,
        },
      ],
    },
    {
      id: 'hr_payroll',
      label: 'الموارد البشرية والرواتب',
      icon: BadgeDollarSign,
      subItems: [
        {
          id: 'payroll',
          label: 'مسير الرواتب والأجور الشهرية',
          icon: Calendar,
        },
        {
          id: 'employees',
          label: 'سجل وملفات الموظفين',
          icon: Users,
          badge: employees.length,
        },
      ],
    },
    {
      id: 'financial_reports',
      label: 'التقارير والقوائم المالية',
      icon: PieChart,
      subItems: [
        {
          id: 'income',
          label: 'قائمة الدخل والأرباح والخسائر',
          icon: TrendingUp,
        },
        {
          id: 'balance_sheet',
          label: 'الميزانية العمومية والمركز المالي',
          icon: Building2,
        },
        {
          id: 'trial_balance',
          label: 'ميزان المراجعة بالأرصدة',
          icon: Scale,
        },
        {
          id: 'statement',
          label: 'كشف حساب الأستاذ العام',
          icon: FileText,
        },
      ],
    },
    {
      id: 'settings',
      label: 'الإعدادات والصلاحيات والأمان',
      icon: Sliders,
      badge: 'أدمن',
      subItems: [
        {
          id: 'company',
          label: 'بيانات المنشأة والشعار والضريبة',
          icon: Building2,
        },
        {
          id: 'currencies',
          label: 'إدارة العملات وأسعار الصرف',
          icon: Coins,
          badge: currencies.length,
        },
        {
          id: 'users_rbac',
          label: 'المستخدمين والمجموعات والصلاحيات',
          icon: ShieldCheck,
          badge: users.length,
        },
        {
          id: 'database_backup',
          label: 'النسخ الاحتياطي وقاعدة البيانات',
          icon: Database,
        },
        {
          id: 'gsheets',
          label: 'المزامنة مع Google Sheets',
          icon: FileSpreadsheet,
        },
        {
          id: 'desktop_exe',
          label: 'تصدير نسخة سطح المكتب EXE',
          icon: Laptop,
        },
      ],
    },
    {
      id: 'erp_blueprint',
      label: 'دليل متطلبات بناء نظام ERP',
      icon: Lightbulb,
      highlight: true,
    },
  ];

  return (
    <div className="w-full bg-slate-900 text-slate-300 rounded-3xl flex flex-col justify-between p-3.5 border border-slate-800 shadow-md">
      <div>
        {/* Navigation Header */}
        <div className="mb-3 px-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            وحدات وخدمات النظام
          </p>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
            {currency}
          </span>
        </div>

        {/* Navigation Menu List */}
        <nav className="space-y-1.5" role="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isMainActive = activeTab === item.id;
            const hasSub = item.subItems && item.subItems.length > 0;
            const isExpanded = !!expandedMenus[item.id];

            return (
              <div key={item.id} className="rounded-2xl overflow-hidden">
                {/* Main Menu Button */}
                <div
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    if (hasSub) {
                      setExpandedMenus((prev) => ({ ...prev, [item.id]: true }));
                      // If clicking main tab, choose first sub-item or default
                      const firstSub = item.subItems![0]?.id;
                      navigateTo(item.id, firstSub);
                    } else {
                      navigateTo(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-right cursor-pointer select-none ${
                    isMainActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20 font-semibold'
                      : item.posHighlight
                      ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-500/30'
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
                          : item.posHighlight
                          ? 'text-emerald-400'
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
                            : item.badge === 'جديد' || item.badge === 'سريع'
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

      {/* Footer Info Box */}
      <div className="mt-6 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5">
        <div className="flex items-center justify-between text-slate-200 font-semibold">
          <span className="truncate max-w-[140px] text-[11px] font-bold text-emerald-400">
            {companyProfile.nameAr}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          قيد مزدوج آلي • ضريبة {companyProfile.defaultVatRate || 14}% • أرقام قياسية
        </p>
      </div>
    </div>
  );
};
