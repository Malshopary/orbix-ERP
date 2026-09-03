import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import {
  Search,
  X,
  Package,
  Users,
  Building,
  FileText,
  ShoppingCart,
  Receipt,
  BookOpen,
  UserCheck,
  LifeBuoy,
  Target,
  ArrowRight,
  TrendingUp,
  Zap,
  CornerDownLeft,
  Sliders,
  Sparkles,
  Layers,
  ChevronRight,
  Clock,
  ExternalLink,
  Shield,
  CreditCard,
  RotateCcw,
  FileCheck2,
  Phone,
  Mail,
  MapPin,
  Tag,
  Hash
} from 'lucide-react';

export type SearchCategory = 
  | 'all'
  | 'products'
  | 'customers'
  | 'vendors'
  | 'invoices'
  | 'purchases'
  | 'accounts'
  | 'employees'
  | 'navigation';

interface SearchResultItem {
  id: string;
  category: SearchCategory;
  categoryLabel: string;
  categoryIcon: React.ElementType;
  categoryColor: string;
  title: string;
  subtitle: string;
  metaBadge?: string;
  metaBadgeColor?: string;
  extraInfo?: string;
  actionTab: string;
  actionSubTab?: string;
  tag?: string;
}

export const GlobalQuickSearch: React.FC = () => {
  const {
    products,
    customers,
    vendors,
    salesInvoices,
    purchaseInvoices,
    quotations,
    salesOrders,
    salesReturns,
    receipts,
    accounts,
    employees,
    salesReps,
    crmTickets,
    crmLeads,
    formatMoney,
    navigateTo,
    currentUser,
  } = useErp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('orbix_recent_searches');
      return saved ? JSON.parse(saved) : ['عميل', 'فاتورة', 'صنف', 'خزينة'];
    } catch {
      return ['عميل', 'فاتورة', 'صنف', 'خزينة'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcut if typing in another input / textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System Navigation & Action Shortcuts
  const systemNavigationItems: SearchResultItem[] = useMemo(() => [
    {
      id: 'nav-pos',
      category: 'navigation',
      categoryLabel: 'شاشات سريعة',
      categoryIcon: Zap,
      categoryColor: 'bg-amber-100 text-amber-800 border-amber-300',
      title: 'شاشة الكاشير السريع (Quick POS)',
      subtitle: 'إصدار فواتير بيع سريعة مع طباعة الإيصال والباركود الفوري',
      metaBadge: 'POS مباشر',
      metaBadgeColor: 'bg-amber-500 text-white',
      actionTab: 'quick_pos',
      tag: 'كاشير بيع نقطة بيع فواتير سريعة pos',
    },
    {
      id: 'nav-new-sale',
      category: 'navigation',
      categoryLabel: 'شاشات المبيعات',
      categoryIcon: ShoppingCart,
      categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      title: 'إصدار فاتورة مبيعات جديدة',
      subtitle: 'إنشاء فاتورة مبيعات ضريبية نقدية أو آجلة',
      metaBadge: 'مبيعات',
      metaBadgeColor: 'bg-emerald-600 text-white',
      actionTab: 'sales',
      actionSubTab: 'invoices',
      tag: 'مبيعات فاتورة بيع ضريبية عملاء عروض أسعار',
    },
    {
      id: 'nav-quotations',
      category: 'navigation',
      categoryLabel: 'عروض الأسعار',
      categoryIcon: FileCheck2,
      categoryColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      title: 'عروض الأسعار والمقايسات (Quotations)',
      subtitle: 'إعداد عروض الأسعار والتحويل المباشر لأوامر وفواتير',
      metaBadge: 'عروض أسعار',
      metaBadgeColor: 'bg-cyan-600 text-white',
      actionTab: 'quotations',
      tag: 'عرض سعر مقايسة تسعير quotation',
    },
    {
      id: 'nav-sales-orders',
      category: 'navigation',
      categoryLabel: 'أوامر البيع',
      categoryIcon: Layers,
      categoryColor: 'bg-blue-100 text-blue-800 border-blue-300',
      title: 'أوامر البيع والتوريد (Sales Orders)',
      subtitle: 'حجز البضاعة ومتابعة التجهيز والفوترة',
      metaBadge: 'أوامر بيع',
      metaBadgeColor: 'bg-blue-600 text-white',
      actionTab: 'sales_orders',
      tag: 'أمر بيع حجز توريد order',
    },
    {
      id: 'nav-purchases',
      category: 'navigation',
      categoryLabel: 'المشتريات',
      categoryIcon: Building,
      categoryColor: 'bg-violet-100 text-violet-800 border-violet-300',
      title: 'فواتير المشتريات والموردين',
      subtitle: 'تسجيل فواتير المشتريات وإثبات التكاليف وحسابات الموردين',
      metaBadge: 'مشتريات',
      metaBadgeColor: 'bg-violet-600 text-white',
      actionTab: 'purchases',
      actionSubTab: 'invoices',
      tag: 'مشتريات شراء موردين فواتير شراء purchase',
    },
    {
      id: 'nav-inventory',
      category: 'navigation',
      categoryLabel: 'المخزون',
      categoryIcon: Package,
      categoryColor: 'bg-orange-100 text-orange-800 border-orange-300',
      title: 'إدارة المخازن وحركة الأصناف',
      subtitle: 'دليل المنتجات، تنبيهات النواقص، الجرد، وسجل حركات المخزن',
      metaBadge: 'المستودعات',
      metaBadgeColor: 'bg-orange-600 text-white',
      actionTab: 'inventory',
      actionSubTab: 'products',
      tag: 'مخازن جرد مستودع بضاعة أصناف مخزون كارت صنف',
    },
    {
      id: 'nav-accounts',
      category: 'navigation',
      categoryLabel: 'المالية والمحاسبة',
      categoryIcon: BookOpen,
      categoryColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      title: 'دليل وشجرة الحسابات (Chart of Accounts)',
      subtitle: 'هيكل الدليل المحاسبي، الأصول، الخصوم، الإيرادات، والمصروفات',
      metaBadge: 'دليل الحسابات',
      metaBadgeColor: 'bg-indigo-600 text-white',
      actionTab: 'accounts',
      actionSubTab: 'chart',
      tag: 'شجرة حسابات دليل قيود خزينة بنك دفتر أستاذ',
    },
    {
      id: 'nav-receipts',
      category: 'navigation',
      categoryLabel: 'الخزينة والسندات',
      categoryIcon: CreditCard,
      categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      title: 'سندات القبض والصرف (Vouchers)',
      subtitle: 'تحصيل مقبوضات نقدية وشيكات وصرف نفقات وسداد موردين',
      metaBadge: 'سندات مالية',
      metaBadgeColor: 'bg-emerald-700 text-white',
      actionTab: 'accounts',
      actionSubTab: 'receipts',
      tag: 'سند قبض سند صرف شيكات خزينة تحصيل سداد',
    },
    {
      id: 'nav-journal-entries',
      category: 'navigation',
      categoryLabel: 'القيود اليومية',
      categoryIcon: FileText,
      categoryColor: 'bg-slate-100 text-slate-800 border-slate-300',
      title: 'دفتر القيود اليومية العامة (Journal Entries)',
      subtitle: 'استعراض القيود المحاسبية اليدوية والآلية وإجراء تسويات',
      metaBadge: 'قيود اليومية',
      metaBadgeColor: 'bg-slate-700 text-white',
      actionTab: 'accounts',
      actionSubTab: 'journal',
      tag: 'قيد يومية مدين دائن تسوية محاسبية دفتر اليومية',
    },
    {
      id: 'nav-financial-reports',
      category: 'navigation',
      categoryLabel: 'التقارير المالية',
      categoryIcon: TrendingUp,
      categoryColor: 'bg-teal-100 text-teal-800 border-teal-300',
      title: 'القوائم المالية (أرباح وخسائر / ميزانية عمومية / ميزان مراجعة)',
      subtitle: 'قائمة الدخل، المركز المالي، كشف التدفقات النقدية والإقرارات الضريبية',
      metaBadge: 'تقارير مالية',
      metaBadgeColor: 'bg-teal-600 text-white',
      actionTab: 'financial_reports',
      tag: 'ميزانية عمومية أرباح وخسائر قائمة دخل ميزان مراجعة تقارير ضريبة vat',
    },
    {
      id: 'nav-crm',
      category: 'navigation',
      categoryLabel: 'CRM وعلاقات العملاء',
      categoryIcon: Users,
      categoryColor: 'bg-pink-100 text-pink-800 border-pink-300',
      title: 'إدارة علاقات العملاء (CRM 360 & Analytics)',
      subtitle: 'تحليلات المناديب، مسار الفرص، المتابعات وتذاكر الدعم',
      metaBadge: 'CRM',
      metaBadgeColor: 'bg-pink-600 text-white',
      actionTab: 'crm_collections',
      actionSubTab: 'crm_analytics',
      tag: 'crm عملاء مناديب فرص بيع تذاكر دعم متابعات',
    },
    {
      id: 'nav-hr-payroll',
      category: 'navigation',
      categoryLabel: 'الموارد البشرية والرواتب',
      categoryIcon: UserCheck,
      categoryColor: 'bg-purple-100 text-purple-800 border-purple-300',
      title: 'الموظفين والرواتب والأجور (HR & Payroll)',
      subtitle: 'سجلات الموظفين، مسيرات الرواتب الشهرية، البدلات والخصومات',
      metaBadge: 'HR & رواتب',
      metaBadgeColor: 'bg-purple-600 text-white',
      actionTab: 'hr_payroll',
      actionSubTab: 'payroll',
      tag: 'موظفين رواتب مسير رواتب بدلات حضور سلف hr payroll',
    },
    {
      id: 'nav-settings',
      category: 'navigation',
      categoryLabel: 'إعدادات النظام',
      categoryIcon: Sliders,
      categoryColor: 'bg-slate-100 text-slate-800 border-slate-300',
      title: 'مركز الإعدادات والصلاحيات (Settings)',
      subtitle: 'بيانات الشركة، العملات، المستخدمين، النسخ الاحتياطي والترقيم',
      metaBadge: 'الإعدادات',
      metaBadgeColor: 'bg-slate-800 text-white',
      actionTab: 'settings',
      tag: 'إعدادات مستخدمين صلاحيات بروفايل نسخ احتياطي عملات لوجو',
    },
  ], []);

  // Filter and Gather All System Records
  const allSearchResults = useMemo<SearchResultItem[]>(() => {
    const rawQuery = query.trim().toLowerCase();
    if (!rawQuery) {
      // Default initial view: show system navigation & popular features
      return systemNavigationItems;
    }

    const results: SearchResultItem[] = [];

    // 1. MATCH SYSTEM NAVIGATION SHORTCUTS
    systemNavigationItems.forEach((nav) => {
      const matchText = `${nav.title} ${nav.subtitle} ${nav.tag || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push(nav);
      }
    });

    // 2. MATCH PRODUCTS & INVENTORY
    products.forEach((p) => {
      const matchText = `${p.name} ${p.sku || ''} ${p.barcode || ''} ${p.category || ''} ${p.description || ''} ${p.brand || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        const isLowStock = p.stockQuantity <= (p.minStockAlert || 5);
        results.push({
          id: `prod-${p.id}`,
          category: 'products',
          categoryLabel: 'المنتجات والمخزون',
          categoryIcon: Package,
          categoryColor: 'bg-orange-100 text-orange-800 border-orange-200',
          title: p.name,
          subtitle: `كود SKU: ${p.sku || 'N/A'} • باركود: ${p.barcode || '—'} • التصنيف: ${p.category || 'عام'}`,
          metaBadge: `${p.stockQuantity} ${p.unit || 'قطعة'}`,
          metaBadgeColor: isLowStock ? 'bg-rose-500 text-white font-bold' : 'bg-emerald-600 text-white',
          extraInfo: `سعر البيع: ${formatMoney(p.price)} ${p.costPrice ? `(تكلفة: ${formatMoney(p.costPrice)})` : ''}`,
          actionTab: 'inventory',
          actionSubTab: 'products',
        });
      }
    });

    // 3. MATCH CUSTOMERS (CRM)
    customers.forEach((c) => {
      const matchText = `${c.name} ${c.companyName || ''} ${c.phone || ''} ${c.code || ''} ${c.email || ''} ${c.taxNumber || ''} ${c.governorate || ''} ${c.region || ''} ${c.contactPerson || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `cust-${c.id}`,
          category: 'customers',
          categoryLabel: 'العملاء (CRM)',
          categoryIcon: Users,
          categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          title: c.name + (c.companyName ? ` (${c.companyName})` : ''),
          subtitle: `كود: ${c.code || c.id} • هاتف: ${c.phone || '—'} • ${c.governorate || 'الموقع غير محدد'}`,
          metaBadge: formatMoney(c.currentBalance || 0),
          metaBadgeColor: (c.currentBalance || 0) > 0 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white',
          extraInfo: `حد ائتماني: ${formatMoney(c.creditLimit || 0)} • الفئة: ${c.customerCategory || 'قطاعي'}`,
          actionTab: 'crm_collections',
          actionSubTab: 'customers',
        });
      }
    });

    // 4. MATCH VENDORS / SUPPLIERS
    vendors.forEach((v) => {
      const matchText = `${v.name} ${v.companyName || ''} ${v.phone || ''} ${v.code || ''} ${v.email || ''} ${v.taxNumber || ''} ${v.governorate || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `vend-${v.id}`,
          category: 'vendors',
          categoryLabel: 'الموردين والشركاء',
          categoryIcon: Building,
          categoryColor: 'bg-violet-100 text-violet-800 border-violet-200',
          title: v.name + (v.companyName ? ` - ${v.companyName}` : ''),
          subtitle: `كود: ${v.code || v.id} • هاتف: ${v.phone || '—'} • ${v.businessType || 'مورد تجاري'}`,
          metaBadge: `مستحق: ${formatMoney(v.currentBalance || 0)}`,
          metaBadgeColor: (v.currentBalance || 0) > 0 ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white',
          actionTab: 'purchases',
          actionSubTab: 'vendors',
        });
      }
    });

    // 5. MATCH SALES INVOICES
    salesInvoices.forEach((inv) => {
      const matchText = `${inv.invoiceNumber} ${inv.customerName || ''} ${inv.paymentMethod || ''} ${inv.date || ''} ${inv.notes || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        const isPaid = inv.status === 'paid';
        const isPartial = inv.status === 'partially_paid';
        results.push({
          id: `inv-${inv.id}`,
          category: 'invoices',
          categoryLabel: 'فواتير المبيعات',
          categoryIcon: ShoppingCart,
          categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          title: `فاتورة مبيعات: ${inv.invoiceNumber}`,
          subtitle: `العميل: ${inv.customerName || 'عميل نقدي'} • التاريخ: ${inv.date} • ${inv.paymentMethod === 'cash' ? 'نقدي' : 'آجل'}`,
          metaBadge: formatMoney(inv.total),
          metaBadgeColor: isPaid ? 'bg-emerald-600 text-white' : isPartial ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white',
          extraInfo: `الحالة: ${isPaid ? 'مدفوعة بالكامل' : isPartial ? 'مدفوعة جزئياً' : 'غير مسددة'}`,
          actionTab: 'sales',
          actionSubTab: 'invoices',
        });
      }
    });

    // 6. MATCH PURCHASE INVOICES
    purchaseInvoices.forEach((pur) => {
      const matchText = `${pur.invoiceNumber} ${pur.vendorName || ''} ${pur.date || ''} ${pur.notes || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `pur-${pur.id}`,
          category: 'purchases',
          categoryLabel: 'فواتير المشتريات',
          categoryIcon: Building,
          categoryColor: 'bg-violet-100 text-violet-800 border-violet-200',
          title: `فاتورة مشتريات: ${pur.invoiceNumber}`,
          subtitle: `المورد: ${pur.vendorName || 'مورد عام'} • التاريخ: ${pur.date}`,
          metaBadge: formatMoney(pur.total),
          metaBadgeColor: 'bg-violet-600 text-white',
          actionTab: 'purchases',
          actionSubTab: 'invoices',
        });
      }
    });

    // 7. MATCH QUOTATIONS & SALES ORDERS
    quotations.forEach((q) => {
      const matchText = `${q.quotationNumber} ${q.customerName || ''} ${q.date || ''} ${q.status || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `quote-${q.id}`,
          category: 'invoices',
          categoryLabel: 'عروض الأسعار',
          categoryIcon: FileCheck2,
          categoryColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          title: `عرض سعر: ${q.quotationNumber}`,
          subtitle: `العميل: ${q.customerName} • التاريخ: ${q.date}`,
          metaBadge: formatMoney(q.total),
          metaBadgeColor: 'bg-cyan-600 text-white',
          actionTab: 'quotations',
        });
      }
    });

    salesOrders.forEach((so) => {
      const matchText = `${so.orderNumber} ${so.customerName || ''} ${so.date || ''} ${so.status || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `so-${so.id}`,
          category: 'invoices',
          categoryLabel: 'أوامر البيع والتوريد',
          categoryIcon: Layers,
          categoryColor: 'bg-blue-100 text-blue-800 border-blue-200',
          title: `أمر بيع: ${so.orderNumber}`,
          subtitle: `العميل: ${so.customerName} • التاريخ: ${so.date}`,
          metaBadge: formatMoney(so.total),
          metaBadgeColor: 'bg-blue-600 text-white',
          actionTab: 'sales_orders',
        });
      }
    });

    // 8. MATCH PAYMENT RECEIPTS & VOUCHERS
    receipts.forEach((r) => {
      const matchText = `${r.receiptNumber} ${r.partyName || ''} ${r.amount || ''} ${r.notes || ''} ${r.paymentMethod || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        const isReceipt = r.type === 'receipt';
        results.push({
          id: `rec-${r.id}`,
          category: 'accounts',
          categoryLabel: isReceipt ? 'سند قبض نقدية' : 'سند صرف نقدية',
          categoryIcon: Receipt,
          categoryColor: isReceipt ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200',
          title: `${isReceipt ? 'سند قبض' : 'سند صرف'}: ${r.receiptNumber}`,
          subtitle: `الطرف: ${r.partyName || 'طرف عام'} • التاريخ: ${r.date} • ${r.notes || 'سند مالي'}`,
          metaBadge: formatMoney(r.amount),
          metaBadgeColor: isReceipt ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white',
          actionTab: 'accounts',
          actionSubTab: 'receipts',
        });
      }
    });

    // 9. MATCH CHART OF ACCOUNTS
    accounts.forEach((acc) => {
      const matchText = `${acc.name} ${acc.code} ${acc.type || ''} ${acc.category || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `acc-${acc.id}`,
          category: 'accounts',
          categoryLabel: 'دليل الحسابات',
          categoryIcon: BookOpen,
          categoryColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          title: `${acc.name} (${acc.code})`,
          subtitle: `النوع: ${acc.type === 'asset' ? 'أصول' : acc.type === 'liability' ? 'خصوم' : acc.type === 'equity' ? 'حقوق ملكية' : acc.type === 'revenue' ? 'إيرادات' : 'مصروفات'} • التصنيف: ${acc.category || 'عام'}`,
          metaBadge: formatMoney(acc.balance || 0),
          metaBadgeColor: 'bg-indigo-700 text-white font-mono',
          actionTab: 'accounts',
          actionSubTab: 'chart',
        });
      }
    });

    // 10. MATCH EMPLOYEES & SALES REPS
    employees.forEach((emp) => {
      const matchText = `${emp.name} ${emp.employeeCode || ''} ${emp.jobTitle || ''} ${emp.department || ''} ${emp.phone || ''} ${emp.nationalId || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `emp-${emp.id}`,
          category: 'employees',
          categoryLabel: 'فريق العمل والموظفين',
          categoryIcon: UserCheck,
          categoryColor: 'bg-purple-100 text-purple-800 border-purple-200',
          title: emp.name,
          subtitle: `كود: ${emp.employeeCode || emp.id} • الوظيفة: ${emp.jobTitle || 'موظف'} • القسم: ${emp.department || 'عام'}`,
          metaBadge: emp.jobTitle || 'موظف',
          metaBadgeColor: 'bg-purple-700 text-white',
          extraInfo: `الراتب الأساسي: ${formatMoney(emp.basicSalary || 0)} • الهاتف: ${emp.phone || '—'}`,
          actionTab: 'hr_payroll',
          actionSubTab: 'employees',
        });
      }
    });

    salesReps.forEach((rep) => {
      const matchText = `${rep.name} ${rep.code || ''} ${rep.phone || ''} ${rep.jobTitle || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `rep-${rep.id}`,
          category: 'employees',
          categoryLabel: 'مناديب المبيعات',
          categoryIcon: TrendingUp,
          categoryColor: 'bg-pink-100 text-pink-800 border-pink-200',
          title: `مندوب مبيعات: ${rep.name}`,
          subtitle: `كود المندوب: ${rep.code || rep.id} • هاتف: ${rep.phone || '—'}`,
          metaBadge: `عمولة: ${rep.commissionRate || 0}%`,
          metaBadgeColor: 'bg-pink-600 text-white',
          actionTab: 'crm_collections',
          actionSubTab: 'sales_reps',
        });
      }
    });

    // 11. MATCH CRM TICKETS & LEADS
    crmTickets.forEach((t) => {
      const matchText = `${t.ticketNumber} ${t.subject || ''} ${t.customerName || ''} ${t.description || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `ticket-${t.id}`,
          category: 'customers',
          categoryLabel: 'تذاكر الدعم الفني',
          categoryIcon: LifeBuoy,
          categoryColor: 'bg-rose-100 text-rose-800 border-rose-200',
          title: `تذكرة [${t.ticketNumber}]: ${t.subject}`,
          subtitle: `العميل: ${t.customerName} • الأولوية: ${t.priority || 'عادية'}`,
          metaBadge: t.status === 'resolved' ? 'تم الحل' : t.status === 'closed' ? 'مغلقة' : 'مفتوحة',
          metaBadgeColor: t.status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white',
          actionTab: 'crm_collections',
          actionSubTab: 'tickets',
        });
      }
    });

    crmLeads.forEach((lead) => {
      const matchText = `${lead.contactName || ''} ${lead.companyName || ''} ${lead.title || ''} ${lead.phone || ''}`.toLowerCase();
      if (matchText.includes(rawQuery)) {
        results.push({
          id: `lead-${lead.id}`,
          category: 'customers',
          categoryLabel: 'الفرص البيعية (Pipeline)',
          categoryIcon: Target,
          categoryColor: 'bg-amber-100 text-amber-800 border-amber-200',
          title: `فرصة: ${lead.title || lead.companyName || lead.contactName}`,
          subtitle: `الجهة: ${lead.companyName || lead.contactName} • المرحلة: ${lead.stage || 'جديدة'}`,
          metaBadge: formatMoney(lead.expectedValue || 0),
          metaBadgeColor: 'bg-amber-600 text-white',
          actionTab: 'crm_collections',
          actionSubTab: 'pipeline',
        });
      }
    });

    return results;
  }, [
    query,
    products,
    customers,
    vendors,
    salesInvoices,
    purchaseInvoices,
    quotations,
    salesOrders,
    receipts,
    accounts,
    employees,
    salesReps,
    crmTickets,
    crmLeads,
    systemNavigationItems,
    formatMoney,
  ]);

  // Filter by selected tab category
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return allSearchResults;
    return allSearchResults.filter((item) => item.category === selectedCategory);
  }, [allSearchResults, selectedCategory]);

  // Save recent search
  const addRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const next = [term.trim(), ...recentSearches.filter((s) => s !== term.trim())].slice(0, 6);
    setRecentSearches(next);
    try {
      localStorage.setItem('orbix_recent_searches', JSON.stringify(next));
    } catch {}
  };

  // Handle selecting an item
  const handleSelectItem = (item: SearchResultItem) => {
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
    navigateTo(item.actionTab, item.actionSubTab);
    setIsOpen(false);
  };

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults.length > 0 && selectedIndex >= 0 && selectedIndex < filteredResults.length) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Categories list for tabs
  const categoryFilters: { id: SearchCategory; label: string; count: number }[] = [
    { id: 'all', label: 'الكل', count: allSearchResults.length },
    { id: 'products', label: 'الأصناف', count: allSearchResults.filter((i) => i.category === 'products').length },
    { id: 'customers', label: 'العملاء', count: allSearchResults.filter((i) => i.category === 'customers').length },
    { id: 'invoices', label: 'الفواتير', count: allSearchResults.filter((i) => i.category === 'invoices').length },
    { id: 'vendors', label: 'الموردين', count: allSearchResults.filter((i) => i.category === 'vendors').length },
    { id: 'accounts', label: 'المالية', count: allSearchResults.filter((i) => i.category === 'accounts').length },
    { id: 'employees', label: 'الموظفين', count: allSearchResults.filter((i) => i.category === 'employees').length },
    { id: 'navigation', label: 'الشاشات', count: allSearchResults.filter((i) => i.category === 'navigation').length },
  ];

  return (
    <div className="relative flex-1 max-w-xl mx-2 sm:mx-4" ref={containerRef}>
      {/* Central Search Input Bar */}
      <div className="relative flex items-center w-full">
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-slate-400">
          <Search className="w-4 h-4 text-emerald-600 transition-colors" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="بحث سريع في السيستم (عملاء، فواتير، أصناف، حسابات، سندات...)"
          className="w-full h-10 pr-10 pl-24 bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-semibold focus:outline-hidden transition-all shadow-2xs focus:shadow-md"
        />

        {/* Action icons on left (in RTL layout) */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 cursor-pointer transition-colors"
              title="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white/80 border border-slate-200 rounded shadow-2xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}

          {query && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
              {filteredResults.length}
            </span>
          )}
        </div>
      </div>

      {/* Floating Instant Search Results Dropdown */}
      {isOpen && (
        <div className="absolute right-0 left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[75vh]">
          {/* Categories Quick Filter Chips */}
          <div className="flex items-center gap-1.5 p-2.5 bg-slate-50 border-b border-slate-100 overflow-x-auto shrink-0 scrollbar-none">
            {categoryFilters.map((cat) => {
              const isActive = selectedCategory === cat.id;
              if (cat.count === 0 && cat.id !== 'all') return null;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedIndex(0);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Results List */}
          <div ref={listRef} className="overflow-y-auto p-2 space-y-1 flex-1 divide-y divide-slate-50">
            {filteredResults.length > 0 ? (
              filteredResults.map((item, index) => {
                const isSelected = selectedIndex === index;
                const IconComponent = item.categoryIcon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/90 border border-emerald-200 text-slate-900 shadow-2xs'
                        : 'hover:bg-slate-50 border border-transparent text-slate-800'
                    }`}
                  >
                    {/* Left Info with Icon */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.categoryColor}`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1 text-right">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {item.categoryLabel}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </span>

                        {item.extraInfo && (
                          <span className="text-[10px] text-emerald-700 font-semibold truncate mt-0.5">
                            {item.extraInfo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Badges & Enter Hint */}
                    <div className="flex items-center gap-2 shrink-0 mr-2">
                      {item.metaBadge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-bold shadow-2xs ${
                            item.metaBadgeColor || 'bg-slate-800 text-white'
                          }`}
                        >
                          {item.metaBadge}
                        </span>
                      )}

                      {isSelected ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-1 rounded-md">
                          <span>فتح</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    لا توجد نتائج مطابقة لـ "{query}"
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    جرب البحث بالاسم، رقم الفاتورة، كود الصنف SKU، رقم الهاتف، أو اسم الشاشة المطلوبة.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Recent Searches & Footer Shortcuts */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> عمليات شائعة:
              </span>
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    inputRef.current?.focus();
                  }}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded-md text-[10px] font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-400 mr-auto font-mono">
              <span className="inline-flex items-center gap-1">
                <kbd className="bg-white px-1 py-0.5 rounded border border-slate-200">↑</kbd>
                <kbd className="bg-white px-1 py-0.5 rounded border border-slate-200">↓</kbd> للتنقل
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="bg-white px-1 py-0.5 rounded border border-slate-200">↵</kbd> للاختيار
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="bg-white px-1 py-0.5 rounded border border-slate-200">ESC</kbd> للإغلاق
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
