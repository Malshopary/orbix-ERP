import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  Award,
  AlertTriangle,
  TrendingUp,
  Target,
  PhoneCall,
  LifeBuoy,
  Users2,
  DollarSign,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  Building2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  UserCheck,
  CheckSquare,
  AlertCircle,
  Tag,
  Mail,
  Zap,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { PrintPreviewModal } from './PrintPreviewModal';
import { Customer, SalesRep, CRMLead, CRMInteraction, CRMTicket, CollectionPlan } from '../types';

export type CrmReportType =
  | 'crm_customer_statement'
  | 'crm_collection_efficiency'
  | 'crm_rfm_segmentation'
  | 'crm_credit_risk'
  | 'crm_rep_productivity'
  | 'crm_pipeline_funnel'
  | 'crm_touchpoints_activity'
  | 'crm_support_sla';

export const CRM_REPORT_META: Record<
  CrmReportType,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  crm_customer_statement: {
    title: 'كشف حساب العميل التحليلي ورصيد المديونية (Customer Statement & Ledger)',
    subtitle: 'سجل زمني تفصيلي لكافة الفواتير والدفعات والمردودات مع حساب الرصيد القائم اللحظي',
    icon: FileText,
  },
  crm_collection_efficiency: {
    title: 'كفاءة ونسب التحصيل الشهري (Collection Efficiency & Recovery Rate)',
    subtitle: 'قياس المبالغ المحصلة فعلياً مقابل المستهدفة ورصد الأقساط المتعثرة ونسب الالتزام بالسداد',
    icon: CheckCircle2,
  },
  crm_rfm_segmentation: {
    title: 'تصنيف العملاء ودورة حياة العميل (RFM Customer Segmentation)',
    subtitle: 'تحليل حداثة وتكرار وقيمة الشراء (RFM) وتصنيف العملاء (VIP، مخلص، واعد، معرض للمغادرة، خامل)',
    icon: Award,
  },
  crm_credit_risk: {
    title: 'تحليل أعمار الديون والمخاطر الائتمانية (A/R Aging & Credit Risk Analysis)',
    subtitle: 'توزيع الديون حسب فترات الاستحقاق (0-30، 31-60، 61-90، +90) ورصد متجاوزي السقف الائتماني',
    icon: AlertTriangle,
  },
  crm_rep_productivity: {
    title: 'أداء وإنتاجية مناديب المبيعات والتحصيل (Sales Reps & Collector KPIs)',
    subtitle: 'مقارنة المستهدف البيعي والتحصيلي بالمحقق الفعلي، ونسب الإنجاز، والعمولات المستحقة',
    icon: TrendingUp,
  },
  crm_pipeline_funnel: {
    title: 'مسار الفرص البيعية ونسب التحويل (Sales Pipeline & Win/Loss Funnel)',
    subtitle: 'تحليل مراحل الصفقات من التواصل الأولي حتى الإغلاق وحساب نسب النجاح (Win Rate %)',
    icon: Target,
  },
  crm_touchpoints_activity: {
    title: 'سجل الاتصالات والأنشطة والمتابعات (Customer Touchpoints & Activities)',
    subtitle: 'رصد المكالمات والزيارات والاجتماعات لكل عميل مع تنبيه حصر العملاء المهملين دون تواصل',
    icon: PhoneCall,
  },
  crm_support_sla: {
    title: 'تذاكر الدعم الفني وسرعة الاستجابة ورضا العملاء (SLA & Support Resolution)',
    subtitle: 'معدل إغلاق التذاكر، متوسط زمن الاستجابة، وتصنيف الشكاوى لضمان جودة خدمة ما بعد البيع',
    icon: LifeBuoy,
  },
};

export const CrmReportsView: React.FC = () => {
  const {
    customers = [],
    salesReps = [],
    salesInvoices = [],
    salesReturns = [],
    collectionPlans = [],
    collectionReminders = [],
    crmLeads = [],
    crmInteractions = [],
    crmTickets = [],
    currency,
    formatMoney,
    formatDualMoney,
    activeSubTab,
    setActiveSubTab,
  } = useErp();

  // Active Report State - sync with activeSubTab
  const [selectedReport, setSelectedReport] = useState<CrmReportType>(() => {
    if (activeSubTab && Object.keys(CRM_REPORT_META).includes(activeSubTab)) {
      return activeSubTab as CrmReportType;
    }
    return 'crm_customer_statement';
  });

  React.useEffect(() => {
    if (activeSubTab && Object.keys(CRM_REPORT_META).includes(activeSubTab)) {
      setSelectedReport(activeSubTab as CrmReportType);
    }
  }, [activeSubTab]);

  // Universal Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedRepId, setSelectedRepId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '30days' | '90days' | 'year'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Initialize selected customer for statement ledger
  React.useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // Filtered customers base
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedRepId !== 'all' && c.salesRepId !== selectedRepId) return false;
      if (selectedCategory !== 'all' && c.customerCategory !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchCode = c.code?.toLowerCase().includes(q);
        const matchCompany = c.companyName?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCompany && !matchPhone) return false;
      }
      return true;
    });
  }, [customers, selectedRepId, selectedCategory, searchQuery]);

  // 1. Customer Statement & Ledger Calculation
  const customerLedger = useMemo(() => {
    if (!selectedCustomer) return [];

    type LedgerRow = {
      id: string;
      date: string;
      type: string;
      reference: string;
      notes: string;
      debit: number;
      credit: number;
      balance: number;
      status?: string;
    };

    const rows: LedgerRow[] = [];

    // Invoices (Debit - increases customer debt)
    salesInvoices
      .filter((inv) => inv.customerId === selectedCustomer.id)
      .forEach((inv) => {
        rows.push({
          id: `inv-${inv.id}`,
          date: inv.date,
          type: 'فاتورة مبيعات',
          reference: inv.invoiceNumber,
          notes: `إجمالي الفاتورة ${inv.items?.length || 0} بنود`,
          debit: inv.grandTotal,
          credit: 0,
          balance: 0,
          status: inv.status === 'paid' ? 'مسددة' : inv.status === 'partially_paid' ? 'مسددة جزئياً' : 'غير مسددة',
        });

        // If paid amount exists on invoice
        if (inv.paidAmount > 0) {
          rows.push({
            id: `pay-${inv.id}`,
            date: inv.date,
            type: 'دفعة سداد فاتورة',
            reference: `سداد ${inv.invoiceNumber}`,
            notes: inv.paymentMethod ? `طريقة السداد: ${inv.paymentMethod}` : 'سداد نقدي/بنكي',
            debit: 0,
            credit: inv.paidAmount,
            balance: 0,
            status: 'مقبوضة',
          });
        }
      });

    // Sales Returns (Credit - decreases debt)
    salesReturns
      .filter((ret) => ret.customerId === selectedCustomer.id)
      .forEach((ret) => {
        rows.push({
          id: `ret-${ret.id}`,
          date: ret.date,
          type: 'مرتجع مبيعات',
          reference: ret.returnNumber,
          notes: ret.reason || 'إشعار دائن لمرتجع',
          debit: 0,
          credit: ret.totalRefundAmount,
          balance: 0,
          status: 'معتمد',
        });
      });

    // Sort ascending by date
    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let running = 0;
    return rows.map((r) => {
      running += r.debit - r.credit;
      return {
        ...r,
        balance: running,
      };
    });
  }, [selectedCustomer, salesInvoices, salesReturns]);

  const customerStatementSummary = useMemo(() => {
    if (!selectedCustomer) {
      return { totalDebit: 0, totalCredit: 0, balance: 0, invoicesCount: 0 };
    }
    let totalDebit = 0;
    let totalCredit = 0;
    customerLedger.forEach((r) => {
      totalDebit += r.debit;
      totalCredit += r.credit;
    });
    return {
      totalDebit,
      totalCredit,
      balance: totalDebit - totalCredit,
      invoicesCount: salesInvoices.filter((i) => i.customerId === selectedCustomer.id).length,
    };
  }, [selectedCustomer, customerLedger, salesInvoices]);

  // 2. Collection Efficiency Calculations
  const collectionEfficiencyData = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let totalRemaining = 0;
    let overdueRemaining = 0;
    const now = new Date();

    const customerStats = filteredCustomers.map((c) => {
      const invs = salesInvoices.filter((i) => i.customerId === c.id);
      let custBilled = 0;
      let custCollected = 0;
      let custRemaining = 0;
      let custOverdue = 0;

      invs.forEach((inv) => {
        custBilled += inv.grandTotal;
        custCollected += inv.paidAmount;
        custRemaining += inv.remainingAmount;
        if (inv.remainingAmount > 0 && inv.dueDate && new Date(inv.dueDate) < now) {
          custOverdue += inv.remainingAmount;
        }
      });

      totalBilled += custBilled;
      totalCollected += custCollected;
      totalRemaining += custRemaining;
      overdueRemaining += custOverdue;

      const rate = custBilled > 0 ? (custCollected / custBilled) * 100 : 100;

      return {
        customer: c,
        billed: custBilled,
        collected: custCollected,
        remaining: custRemaining,
        overdue: custOverdue,
        efficiencyRate: rate,
        status: rate >= 90 ? 'ممتاز' : rate >= 70 ? 'جيد' : rate >= 40 ? 'متأخر' : 'متعثر',
      };
    });

    const overallRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    return {
      totalBilled,
      totalCollected,
      totalRemaining,
      overdueRemaining,
      overallRate,
      customerStats: customerStats.sort((a, b) => b.remaining - a.remaining),
    };
  }, [filteredCustomers, salesInvoices]);

  // 3. RFM Customer Segmentation
  const rfmData = useMemo(() => {
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    const items = filteredCustomers.map((c) => {
      const custInvoices = salesInvoices.filter((i) => i.customerId === c.id);

      // Monetary: Total spend
      const monetary = custInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

      // Frequency: Count of invoices
      const frequency = custInvoices.length;

      // Recency: Days since last invoice
      let recencyDays = 999;
      if (custInvoices.length > 0) {
        const sortedInvs = [...custInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastDate = new Date(sortedInvs[0].date).getTime();
        recencyDays = Math.max(0, Math.floor((now - lastDate) / dayMs));
      }

      // Determine Segment
      let segment: 'vip' | 'loyal' | 'promising' | 'at_risk' | 'hibernating' = 'hibernating';
      let segmentLabel = 'عميل خامل (Hibernating)';
      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
      let recommendation = 'إرسال حملة إعادة تنشيط وعروض ترويجية';

      if (recencyDays <= 30 && frequency >= 3 && monetary >= 10000) {
        segment = 'vip';
        segmentLabel = 'عميل VIP النخبة (Champion)';
        badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
        recommendation = 'تقديم مكافآت حصرية وخدمة VIP ومتابعة دورية';
      } else if (recencyDays <= 60 && frequency >= 2) {
        segment = 'loyal';
        segmentLabel = 'عميل مخلص ودائم (Loyal)';
        badgeColor = 'bg-blue-50 text-blue-800 border-blue-300';
        recommendation = 'توسيع المبيعات باقتراح منتجات تكميلية';
      } else if (recencyDays <= 30 && frequency <= 2) {
        segment = 'promising';
        segmentLabel = 'عميل جديد واعد (Promising)';
        badgeColor = 'bg-purple-50 text-purple-800 border-purple-300';
        recommendation = 'بناء الثقة ومتابعة جودة التجربة الأولى';
      } else if (recencyDays > 60 && monetary >= 5000) {
        segment = 'at_risk';
        segmentLabel = 'معرض للفقدان (At Risk)';
        badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
        recommendation = 'اتصال هاتفي فوري من المندوب لمعالجة أي معوقات';
      } else {
        segment = 'hibernating';
        segmentLabel = 'عميل خامل (Inactive)';
        badgeColor = 'bg-rose-50 text-rose-800 border-rose-300';
        recommendation = 'إعادة التواصل والتأكد من بيانات الاتصال';
      }

      return {
        customer: c,
        recencyDays,
        frequency,
        monetary,
        segment,
        segmentLabel,
        badgeColor,
        recommendation,
      };
    });

    const segmentsCount = {
      vip: items.filter((i) => i.segment === 'vip').length,
      loyal: items.filter((i) => i.segment === 'loyal').length,
      promising: items.filter((i) => i.segment === 'promising').length,
      at_risk: items.filter((i) => i.segment === 'at_risk').length,
      hibernating: items.filter((i) => i.segment === 'hibernating').length,
    };

    return {
      items: items.sort((a, b) => b.monetary - a.monetary),
      segmentsCount,
    };
  }, [filteredCustomers, salesInvoices]);

  // 4. Credit Risk and Aging Analysis
  const creditRiskData = useMemo(() => {
    const now = new Date();

    const items = filteredCustomers.map((c) => {
      const unpaid = salesInvoices.filter((inv) => inv.customerId === c.id && inv.remainingAmount > 0);

      let d0_30 = 0;
      let d31_60 = 0;
      let d61_90 = 0;
      let d90_plus = 0;

      unpaid.forEach((inv) => {
        const invDate = new Date(inv.date);
        const diff = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
        const rem = inv.remainingAmount;
        if (diff <= 30) d0_30 += rem;
        else if (diff <= 60) d31_60 += rem;
        else if (diff <= 90) d61_90 += rem;
        else d90_plus += rem;
      });

      const totalDue = d0_30 + d31_60 + d61_90 + d90_plus;
      const creditLimit = c.creditLimit || 0;
      const isOverLimit = creditLimit > 0 && totalDue > creditLimit;
      const overLimitAmount = isOverLimit ? totalDue - creditLimit : 0;

      // Risk score
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (d90_plus > 0 || overLimitAmount > 5000) riskLevel = 'critical';
      else if (d61_90 > 0 || isOverLimit) riskLevel = 'high';
      else if (d31_60 > 0) riskLevel = 'medium';

      return {
        customer: c,
        d0_30,
        d31_60,
        d61_90,
        d90_plus,
        totalDue,
        creditLimit,
        isOverLimit,
        overLimitAmount,
        riskLevel,
      };
    });

    let sum0_30 = 0;
    let sum31_60 = 0;
    let sum61_90 = 0;
    let sum90_plus = 0;
    let sumTotal = 0;
    let overLimitCount = 0;

    items.forEach((i) => {
      sum0_30 += i.d0_30;
      sum31_60 += i.d31_60;
      sum61_90 += i.d61_90;
      sum90_plus += i.d90_plus;
      sumTotal += i.totalDue;
      if (i.isOverLimit) overLimitCount += 1;
    });

    return {
      items: items.filter((i) => i.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue),
      sum0_30,
      sum31_60,
      sum61_90,
      sum90_plus,
      sumTotal,
      overLimitCount,
    };
  }, [filteredCustomers, salesInvoices]);

  // 5. Sales Rep Productivity & Collector KPIs
  const repProductivityData = useMemo(() => {
    return salesReps.map((rep) => {
      const assignedCusts = customers.filter((c) => c.salesRepId === rep.id);
      const repInvoices = salesInvoices.filter((i) => i.salesRepId === rep.id);

      const totalSalesAchieved = repInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
      const totalCollected = repInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
      const totalRemaining = repInvoices.reduce((sum, i) => sum + i.remainingAmount, 0);

      const target = rep.monthlySalesTarget || rep.salesTarget || 50000;
      const salesAchievementRate = target > 0 ? (totalSalesAchieved / target) * 100 : 0;
      const collectionRate = totalSalesAchieved > 0 ? (totalCollected / totalSalesAchieved) * 100 : 0;

      const commissionEarned = (totalSalesAchieved * (rep.commissionRate || 2)) / 100;

      return {
        rep,
        customersCount: assignedCusts.length,
        invoicesCount: repInvoices.length,
        target,
        totalSalesAchieved,
        totalCollected,
        totalRemaining,
        salesAchievementRate,
        collectionRate,
        commissionEarned,
      };
    }).sort((a, b) => b.totalSalesAchieved - a.totalSalesAchieved);
  }, [salesReps, customers, salesInvoices]);

  // 6. Pipeline Funnel & Conversion Rates
  const pipelineFunnelData = useMemo(() => {
    const stages = [
      { key: 'new', label: 'فرصة جديدة', color: 'bg-slate-100 text-slate-800' },
      { key: 'contacted', label: 'تم التواصل', color: 'bg-blue-100 text-blue-800' },
      { key: 'proposal_sent', label: 'عرض سعر مرسل', color: 'bg-purple-100 text-purple-800' },
      { key: 'negotiation', label: 'مفاوضات متقدمة', color: 'bg-amber-100 text-amber-800' },
      { key: 'won', label: 'مغلقة بفوز (Won)', color: 'bg-emerald-100 text-emerald-800' },
      { key: 'lost', label: 'مغلقة بخسارة (Lost)', color: 'bg-rose-100 text-rose-800' },
    ];

    let totalValue = 0;
    let wonValue = 0;
    let wonCount = 0;

    const stageBreakdown = stages.map((st) => {
      const leads = crmLeads.filter((l) => l.stage === st.key);
      const val = leads.reduce((sum, l) => sum + (l.expectedValue || 0), 0);
      totalValue += val;
      if (st.key === 'won') {
        wonValue += val;
        wonCount += leads.length;
      }
      return {
        ...st,
        count: leads.length,
        value: val,
        leads,
      };
    });

    const totalLeads = crmLeads.length;
    const conversionRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0;

    return {
      totalLeads,
      totalValue,
      wonValue,
      wonCount,
      conversionRate,
      stageBreakdown,
    };
  }, [crmLeads]);

  // 7. Customer Touchpoints & Activities
  const touchpointActivityData = useMemo(() => {
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    // Neglected customers (no interactions in last 30 days)
    const neglectedCustomers: Array<{ customer: Customer; daysSinceLastContact: number; lastInteraction?: CRMInteraction }> = [];

    filteredCustomers.forEach((c) => {
      const custInteractions = crmInteractions.filter((int) => int.customerId === c.id);
      if (custInteractions.length === 0) {
        neglectedCustomers.push({
          customer: c,
          daysSinceLastContact: 999,
        });
      } else {
        const sorted = [...custInteractions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const last = sorted[0];
        const days = Math.floor((now - new Date(last.date).getTime()) / dayMs);
        if (days >= 30) {
          neglectedCustomers.push({
            customer: c,
            daysSinceLastContact: days,
            lastInteraction: last,
          });
        }
      }
    });

    const callsCount = crmInteractions.filter((i) => i.type === 'call').length;
    const visitsCount = crmInteractions.filter((i) => i.type === 'visit').length;
    const emailsCount = crmInteractions.filter((i) => i.type === 'email').length;
    const meetingsCount = crmInteractions.filter((i) => i.type === 'meeting').length;

    return {
      totalInteractions: crmInteractions.length,
      callsCount,
      visitsCount,
      emailsCount,
      meetingsCount,
      neglectedCustomers: neglectedCustomers.sort((a, b) => b.daysSinceLastContact - a.daysSinceLastContact),
    };
  }, [filteredCustomers, crmInteractions]);

  // 8. Support SLA & Ticket Resolution
  const supportSlaData = useMemo(() => {
    const total = crmTickets.length;
    const open = crmTickets.filter((t) => t.status === 'open').length;
    const inProgress = crmTickets.filter((t) => t.status === 'in_progress').length;
    const resolved = crmTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

    const resolutionRate = total > 0 ? (resolved / total) * 100 : 100;

    const categoriesCount = {
      billing: crmTickets.filter((t) => t.category === 'billing').length,
      product: crmTickets.filter((t) => t.category === 'product').length,
      delivery: crmTickets.filter((t) => t.category === 'delivery').length,
      general: crmTickets.filter((t) => t.category === 'general' || !t.category).length,
    };

    const urgentCount = crmTickets.filter((t) => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length;

    return {
      total,
      open,
      inProgress,
      resolved,
      resolutionRate,
      categoriesCount,
      urgentCount,
      tickets: crmTickets,
    };
  }, [crmTickets]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const reportMeta = CRM_REPORT_META[selectedReport];

    if (selectedReport === 'crm_customer_statement') {
      headers = ['التاريخ', 'نوع الحركة', 'رقم المستند/المرجع', 'البيان/الملاحظات', 'مدين (فواتير)', 'دائن (سداد/مردود)', 'الرصيد التراكمي', 'الحالة'];
      rows = customerLedger.map((r) => [
        r.date,
        r.type,
        r.reference,
        r.notes,
        r.debit,
        r.credit,
        r.balance,
        r.status || '',
      ]);
    } else if (selectedReport === 'crm_collection_efficiency') {
      headers = ['كود العميل', 'اسم العميل', 'المندوب', 'إجمالي الفواتير', 'المحصل فعلياً', 'الرصيد المتبقي', 'المبالغ المتأخرة', 'نسبة التحصيل %', 'تقييم الالتزام'];
      rows = collectionEfficiencyData.customerStats.map((s) => [
        s.customer.code,
        s.customer.name,
        s.customer.salesRepName || '-',
        s.billed,
        s.collected,
        s.remaining,
        s.overdue,
        s.efficiencyRate.toFixed(1) + '%',
        s.status,
      ]);
    } else if (selectedReport === 'crm_rfm_segmentation') {
      headers = ['كود العميل', 'اسم العميل', 'التصنيف', 'حداثة الشراء (أيام)', 'تكرار الشراء (مرات)', 'القيمة النقدية المنفقة', 'شريحة العميل', 'التوصية الإدارية'];
      rows = rfmData.items.map((i) => [
        i.customer.code,
        i.customer.name,
        i.customer.customerCategory || 'retail',
        i.recencyDays === 999 ? 'لا يوجد' : i.recencyDays,
        i.frequency,
        i.monetary,
        i.segmentLabel,
        i.recommendation,
      ]);
    } else if (selectedReport === 'crm_credit_risk') {
      headers = ['كود العميل', 'اسم العميل', 'السقف الائتماني', 'الرصيد الإجمالي القائم', '0-30 يوم', '31-60 يوم', '61-90 يوم', '+90 يوم', 'تجاوز السقف الائتماني', 'مستوى المخاطر'];
      rows = creditRiskData.items.map((i) => [
        i.customer.code,
        i.customer.name,
        i.creditLimit,
        i.totalDue,
        i.d0_30,
        i.d31_60,
        i.d61_90,
        i.d90_plus,
        i.isOverLimit ? i.overLimitAmount : 0,
        i.riskLevel === 'critical' ? 'حرج' : i.riskLevel === 'high' ? 'مرتفع' : i.riskLevel === 'medium' ? 'متوسط' : 'منخفض',
      ]);
    } else if (selectedReport === 'crm_rep_productivity') {
      headers = ['المندوب', 'عدد العملاء', 'عدد الفواتير', 'المستهدف البيعي', 'المبيعات المحققة', 'نسبة الإنجاز %', 'التحصيلات الفعلية', 'نسبة التحصيل %', 'العمولة المستحقة'];
      rows = repProductivityData.map((r) => [
        r.rep.name,
        r.customersCount,
        r.invoicesCount,
        r.target,
        r.totalSalesAchieved,
        r.salesAchievementRate.toFixed(1) + '%',
        r.totalCollected,
        r.collectionRate.toFixed(1) + '%',
        r.commissionEarned,
      ]);
    } else if (selectedReport === 'crm_pipeline_funnel') {
      headers = ['المرحلة', 'عدد الفرص البيعية', 'القيمة المتوقعة', 'نسبة التحويل من الإجمالي %'];
      rows = pipelineFunnelData.stageBreakdown.map((s) => [
        s.label,
        s.count,
        s.value,
        pipelineFunnelData.totalValue > 0 ? ((s.value / pipelineFunnelData.totalValue) * 100).toFixed(1) + '%' : '0%',
      ]);
    } else if (selectedReport === 'crm_touchpoints_activity') {
      headers = ['كود العميل', 'اسم العميل', 'المندوب المسؤول', 'رقم الهاتف', 'أيام الانقطاع بدون تواصل', 'تاريخ آخر متابعة'];
      rows = touchpointActivityData.neglectedCustomers.map((n) => [
        n.customer.code,
        n.customer.name,
        n.customer.salesRepName || '-',
        n.customer.phone,
        n.daysSinceLastContact === 999 ? 'لم يتم التواصل نهائياً' : n.daysSinceLastContact,
        n.lastInteraction?.date || '-',
      ]);
    } else if (selectedReport === 'crm_support_sla') {
      headers = ['رقم التذكرة', 'العميل', 'الموضوع', 'التصنيف', 'الأولوية', 'المسؤول', 'الحالة', 'تاريخ الفتح'];
      rows = supportSlaData.tickets.map((t) => [
        t.id,
        t.customerName,
        t.subject,
        t.category || 'عام',
        t.priority,
        t.assignedTo || '-',
        t.status,
        t.createdAt || '-',
      ]);
    }

    const csvContent =
      '\uFEFF' +
      [
        `تقرير: ${reportMeta.title}`,
        `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`,
        '',
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val ?? '');
              return str.includes(',') || str.includes('\n') || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(',')
        ),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentMeta = CRM_REPORT_META[selectedReport];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
            <CurrentIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {currentMeta.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{currentMeta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all border border-slate-200 cursor-pointer"
            title="تصدير إلى ملف إكسل"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            title="معاينة وطباعة التقرير"
          >
            <Printer className="w-4 h-4" />
            <span>معاينة وطباعة</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Customer Selector for Statement */}
          {selectedReport === 'crm_customer_statement' && (
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">العميل المستهدف:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الكود، الجوال، الشركة..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Sales Rep Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">المندوب:</span>
            <select
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">كل المناديب</option>
              {salesReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">التصنيف:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">كل التصنيفات</option>
              <option value="retail">تجزئة</option>
              <option value="wholesale">جملة</option>
              <option value="distributor">موزع</option>
              <option value="corporate">شركات</option>
              <option value="vip">نخبة (VIP)</option>
            </select>
          </div>
        </div>
      </div>

      {/* REPORT CONTENT VIEW */}
      {selectedReport === 'crm_customer_statement' && (
        <div className="space-y-4">
          {/* Customer Snapshot KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">الرصيد القائم الحالي (المديونية)</span>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl font-black ${customerStatementSummary.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatMoney(customerStatementSummary.balance)}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700">
                  {customerStatementSummary.balance > 0 ? 'مستحق علينا تحصيله' : 'خالص / رصيد دائن'}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">إجمالي الفواتير الصادرة</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{formatMoney(customerStatementSummary.totalDebit)}</span>
                <span className="text-[11px] text-slate-500">{customerStatementSummary.invoicesCount} فاتورة</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">إجمالي المسدد والمحصل</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-emerald-600">{formatMoney(customerStatementSummary.totalCredit)}</span>
                <span className="text-[11px] text-emerald-700 font-bold">
                  {customerStatementSummary.totalDebit > 0
                    ? ((customerStatementSummary.totalCredit / customerStatementSummary.totalDebit) * 100).toFixed(1) + '%'
                    : '100%'}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">السقف الائتماني المعتمد</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">
                  {formatMoney(selectedCustomer?.creditLimit || 0)}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600">
                  {selectedCustomer?.salesRepName ? `المندوب: ${selectedCustomer.salesRepName}` : 'مباشر'}
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  كشف الحساب التفصيلي: {selectedCustomer?.name} ({selectedCustomer?.code})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  الجوال: {selectedCustomer?.phone || '-'} | العنوان: {selectedCustomer?.governorate || '-'} - {selectedCustomer?.address || '-'}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                {customerLedger.length} حركة مسجلة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">نوع الحركة</th>
                    <th className="p-3.5">رقم السند/المرجع</th>
                    <th className="p-3.5">البيان والملاحظات</th>
                    <th className="p-3.5 text-left">مدين (فواتير)</th>
                    <th className="p-3.5 text-left">دائن (سداد/مردود)</th>
                    <th className="p-3.5 text-left">الرصيد التراكمي</th>
                    <th className="p-3.5 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        لا توجد حركات مالية مسجلة لهذا العميل حتى الآن
                      </td>
                    </tr>
                  ) : (
                    customerLedger.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 text-slate-600 font-medium">{row.date}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              row.type.includes('فاتورة')
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : row.type.includes('سداد')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{row.reference}</td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate">{row.notes}</td>
                        <td className="p-3.5 text-left font-bold text-slate-900">
                          {row.debit > 0 ? formatMoney(row.debit) : '-'}
                        </td>
                        <td className="p-3.5 text-left font-bold text-emerald-600">
                          {row.credit > 0 ? formatMoney(row.credit) : '-'}
                        </td>
                        <td className="p-3.5 text-left font-black text-slate-900 dir-ltr text-right">
                          {formatMoney(row.balance)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'crm_collection_efficiency' && (
        <div className="space-y-4">
          {/* Efficiency Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">نسبة كفاءة التحصيل العامة</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">
                  {collectionEfficiencyData.overallRate.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 font-medium">معدل التعافي</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(collectionEfficiencyData.overallRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">إجمالي الفواتير والمطالبات</span>
              <span className="text-2xl font-black text-slate-900">{formatMoney(collectionEfficiencyData.totalBilled)}</span>
              <span className="text-xs text-slate-400 block mt-1">إجمالي مبيعات الفترة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">المبالغ المحصلة فعلياً</span>
              <span className="text-2xl font-black text-emerald-600">{formatMoney(collectionEfficiencyData.totalCollected)}</span>
              <span className="text-xs text-emerald-700 font-bold block mt-1">سيولة نقدية واردة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">المبالغ المتأخرة عن موعدها</span>
              <span className="text-2xl font-black text-rose-600">{formatMoney(collectionEfficiencyData.overdueRemaining)}</span>
              <span className="text-xs text-rose-600 font-bold block mt-1">تتطلب متابعة سداد عاجلة</span>
            </div>
          </div>

          {/* Efficiency Details Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">مؤشرات كفاءة التحصيل ونسب السداد لكل عميل</h3>
                <p className="text-xs text-slate-500 mt-0.5">مقارنة مبالغ الفواتير الصادرة مقابل المحصل الفعلي ونسب التخلف عن السداد</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">المندوب</th>
                    <th className="p-3.5 text-left">إجمالي الفواتير</th>
                    <th className="p-3.5 text-left">المحصل فعلياً</th>
                    <th className="p-3.5 text-left">الرصيد المتبقي</th>
                    <th className="p-3.5 text-left">المتأخر عن موعده</th>
                    <th className="p-3.5">نسبة التحصيل</th>
                    <th className="p-3.5 text-center">تقييم الالتزام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collectionEfficiencyData.customerStats.map((item) => (
                    <tr key={item.customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{item.customer.name}</div>
                        <div className="text-[11px] text-slate-400">{item.customer.code}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {item.customer.salesRepName || '-'}
                      </td>
                      <td className="p-3.5 text-left font-bold text-slate-900">{formatMoney(item.billed)}</td>
                      <td className="p-3.5 text-left font-bold text-emerald-600">{formatMoney(item.collected)}</td>
                      <td className="p-3.5 text-left font-bold text-slate-700">{formatMoney(item.remaining)}</td>
                      <td className="p-3.5 text-left font-bold text-rose-600">
                        {item.overdue > 0 ? formatMoney(item.overdue) : '-'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 min-w-[36px]">{item.efficiencyRate.toFixed(0)}%</span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.efficiencyRate >= 80
                                  ? 'bg-emerald-500'
                                  : item.efficiencyRate >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(item.efficiencyRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.status === 'ممتاز'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : item.status === 'جيد'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : item.status === 'متأخر'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'crm_rfm_segmentation' && (
        <div className="space-y-4">
          {/* RFM Segment Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
              <span className="text-xs text-emerald-800 font-bold block mb-1">عملاء VIP النخبة</span>
              <span className="text-2xl font-black text-emerald-700">{rfmData.segmentsCount.vip}</span>
              <p className="text-[11px] text-emerald-600 mt-1">أعلى إنفاق وشراء متكرر</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
              <span className="text-xs text-blue-800 font-bold block mb-1">عملاء مخلصون</span>
              <span className="text-2xl font-black text-blue-700">{rfmData.segmentsCount.loyal}</span>
              <p className="text-[11px] text-blue-600 mt-1">شراء مستمر ومنتظم</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-purple-200 bg-purple-50/30 shadow-xs">
              <span className="text-xs text-purple-800 font-bold block mb-1">عملاء جدد واعدون</span>
              <span className="text-2xl font-black text-purple-700">{rfmData.segmentsCount.promising}</span>
              <p className="text-[11px] text-purple-600 mt-1">شراء حديث بقيمة جيدة</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
              <span className="text-xs text-amber-800 font-bold block mb-1">معرضون للفقدان</span>
              <span className="text-2xl font-black text-amber-700">{rfmData.segmentsCount.at_risk}</span>
              <p className="text-[11px] text-amber-600 mt-1">انقطاع عن الشراء &gt;60 يوم</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-xs text-rose-800 font-bold block mb-1">عملاء خاملون</span>
              <span className="text-2xl font-black text-rose-700">{rfmData.segmentsCount.hibernating}</span>
              <p className="text-[11px] text-rose-600 mt-1">انقطاع طويل يتطلب إعادة تنشيط</p>
            </div>
          </div>

          {/* RFM Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">مصفوفة تصنيف العملاء وتوصيات التنشيط والمبيعات</h3>
                <p className="text-xs text-slate-500 mt-0.5">نموذج RFM: الحداثة (Recency)، التكرار (Frequency)، القيمة النقدية (Monetary)</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">المندوب</th>
                    <th className="p-3.5 text-center">آخر عملية شراء (أيام)</th>
                    <th className="p-3.5 text-center">عدد الفواتير</th>
                    <th className="p-3.5 text-left">إجمالي المشتريات</th>
                    <th className="p-3.5">الشريحة المستهدفة</th>
                    <th className="p-3.5">التوصية المقترحة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rfmData.items.map((row) => (
                    <tr key={row.customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{row.customer.name}</div>
                        <div className="text-[11px] text-slate-400">{row.customer.code}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{row.customer.salesRepName || '-'}</td>
                      <td className="p-3.5 text-center font-bold">
                        {row.recencyDays === 999 ? (
                          <span className="text-slate-400">لم يشترِ بعد</span>
                        ) : (
                          <span className={row.recencyDays <= 30 ? 'text-emerald-600' : row.recencyDays <= 60 ? 'text-blue-600' : 'text-rose-600'}>
                            منذ {row.recencyDays} يوم
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{row.frequency}</td>
                      <td className="p-3.5 text-left font-black text-slate-900">{formatMoney(row.monetary)}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${row.badgeColor}`}>
                          {row.segmentLabel}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium max-w-xs">{row.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'crm_credit_risk' && (
        <div className="space-y-4">
          {/* Aging Buckets Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">0 - 30 يوماً (جاري)</span>
              <span className="text-xl font-black text-slate-900">{formatMoney(creditRiskData.sum0_30)}</span>
              <span className="text-[11px] text-emerald-600 font-bold block mt-1">ضمن الائتمان العادي</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">31 - 60 يوماً</span>
              <span className="text-xl font-black text-amber-600">{formatMoney(creditRiskData.sum31_60)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">بداية تأخر</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">61 - 90 يوماً</span>
              <span className="text-xl font-black text-orange-600">{formatMoney(creditRiskData.sum61_90)}</span>
              <span className="text-[11px] text-orange-600 font-bold block mt-1">تأخر متوسط</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <span className="text-xs text-rose-700 font-bold block mb-1">أكثر من 90 يوماً (+90)</span>
              <span className="text-xl font-black text-rose-600">{formatMoney(creditRiskData.sum90_plus)}</span>
              <span className="text-[11px] text-rose-600 font-bold block mt-1">مخاطر ديون معدومة</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-500 font-semibold block mb-1">إجمالي المديونيات القائمة</span>
              <span className="text-xl font-black text-slate-900">{formatMoney(creditRiskData.sumTotal)}</span>
              <span className="text-[11px] text-slate-500 block mt-1">{creditRiskData.overLimitCount} عميل تجاوز السقف</span>
            </div>
          </div>

          {/* Aging Details Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">أعمار ديون العملاء والتجاوزات الائتمانية</h3>
                <p className="text-xs text-slate-500 mt-0.5">مراقبة الفترات الزمنية للديون ومطابقتها بالسقوف المعتمدة</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5 text-left">السقف الائتماني</th>
                    <th className="p-3.5 text-left">إجمالي المديونية</th>
                    <th className="p-3.5 text-left">0-30 يوم</th>
                    <th className="p-3.5 text-left">31-60 يوم</th>
                    <th className="p-3.5 text-left">61-90 يوم</th>
                    <th className="p-3.5 text-left text-rose-600">+90 يوم</th>
                    <th className="p-3.5 text-center">مستوى المخاطر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {creditRiskData.items.map((row) => (
                    <tr key={row.customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{row.customer.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {row.customer.code} {row.isOverLimit && <span className="text-rose-600 font-bold">(تجاوز السقف بمقدار {formatMoney(row.overLimitAmount)})</span>}
                        </div>
                      </td>
                      <td className="p-3.5 text-left font-bold text-slate-600">{formatMoney(row.creditLimit)}</td>
                      <td className="p-3.5 text-left font-black text-slate-900">{formatMoney(row.totalDue)}</td>
                      <td className="p-3.5 text-left font-medium text-slate-700">{row.d0_30 > 0 ? formatMoney(row.d0_30) : '-'}</td>
                      <td className="p-3.5 text-left font-medium text-amber-600">{row.d31_60 > 0 ? formatMoney(row.d31_60) : '-'}</td>
                      <td className="p-3.5 text-left font-medium text-orange-600">{row.d61_90 > 0 ? formatMoney(row.d61_90) : '-'}</td>
                      <td className="p-3.5 text-left font-bold text-rose-600">{row.d90_plus > 0 ? formatMoney(row.d90_plus) : '-'}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            row.riskLevel === 'critical'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : row.riskLevel === 'high'
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : row.riskLevel === 'medium'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {row.riskLevel === 'critical'
                            ? 'خطر حرج'
                            : row.riskLevel === 'high'
                            ? 'مخاطر مرتفعة'
                            : row.riskLevel === 'medium'
                            ? 'مخاطر متوسطة'
                            : 'ائتمان آمن'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'crm_rep_productivity' && (
        <div className="space-y-4">
          {/* Sales Rep Productivity Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">مؤشرات أداء وإنتاجية مناديب المبيعات والتحصيل (KPIs)</h3>
                <p className="text-xs text-slate-500 mt-0.5">مقارنة التارجت البيعي والتحصيلي بالمحقق الفعلي واحتساب العمولات</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3.5">المندوب</th>
                    <th className="p-3.5 text-center">العملاء التابعين</th>
                    <th className="p-3.5 text-center">عدد الفواتير</th>
                    <th className="p-3.5 text-left">المستهدف البيعي</th>
                    <th className="p-3.5 text-left">المبيعات المحققة</th>
                    <th className="p-3.5">نسبة تحقيق الهدف</th>
                    <th className="p-3.5 text-left">التحصيل الفعلي</th>
                    <th className="p-3.5">نسبة التحصيل</th>
                    <th className="p-3.5 text-left">العمولة المستحقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repProductivityData.map((row) => (
                    <tr key={row.rep.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{row.rep.name}</div>
                        <div className="text-[11px] text-slate-400">{row.rep.phone} | عمولة {row.rep.commissionRate}%</div>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{row.customersCount}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{row.invoicesCount}</td>
                      <td className="p-3.5 text-left font-bold text-slate-500">{formatMoney(row.target)}</td>
                      <td className="p-3.5 text-left font-black text-slate-900">{formatMoney(row.totalSalesAchieved)}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 min-w-[36px]">{row.salesAchievementRate.toFixed(0)}%</span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.salesAchievementRate >= 100
                                  ? 'bg-emerald-500'
                                  : row.salesAchievementRate >= 70
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(row.salesAchievementRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-left font-bold text-emerald-600">{formatMoney(row.totalCollected)}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-700">{row.collectionRate.toFixed(0)}%</span>
                      </td>
                      <td className="p-3.5 text-left font-black text-blue-600">{formatMoney(row.commissionEarned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'crm_pipeline_funnel' && (
        <div className="space-y-4">
          {/* Pipeline Snapshot Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">إجمالي قيمة مسار المبيعات</span>
              <span className="text-2xl font-black text-slate-900">{formatMoney(pipelineFunnelData.totalValue)}</span>
              <span className="text-xs text-slate-400 block mt-1">{pipelineFunnelData.totalLeads} فرصة بيعية نشطة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">صفقات مغلقة بنجاح (Won)</span>
              <span className="text-2xl font-black text-emerald-600">{formatMoney(pipelineFunnelData.wonValue)}</span>
              <span className="text-xs text-emerald-600 font-bold block mt-1">{pipelineFunnelData.wonCount} صفقة فائزة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">نسبة الفوز والإغلاق (Win Rate)</span>
              <span className="text-2xl font-black text-blue-600">{pipelineFunnelData.conversionRate.toFixed(1)}%</span>
              <span className="text-xs text-blue-600 font-bold block mt-1">معدل تحويل الفرص</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">متوسط حجم الصفقة (Avg Deal)</span>
              <span className="text-2xl font-black text-slate-900">
                {pipelineFunnelData.totalLeads > 0
                  ? formatMoney(pipelineFunnelData.totalValue / pipelineFunnelData.totalLeads)
                  : formatMoney(0)}
              </span>
              <span className="text-xs text-slate-400 block mt-1">لكل فرصة بيعية</span>
            </div>
          </div>

          {/* Funnel Stage Progress */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm">مراحل مسار المبيعات والفرص البيعية (Sales Pipeline Funnel)</h3>
            <div className="space-y-3">
              {pipelineFunnelData.stageBreakdown.map((stage) => {
                const percent = pipelineFunnelData.totalValue > 0 ? (stage.value / pipelineFunnelData.totalValue) * 100 : 0;
                return (
                  <div key={stage.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${stage.color}`}>
                          {stage.label}
                        </span>
                        <span className="text-slate-400 font-normal">({stage.count} فرصة)</span>
                      </span>
                      <span className="font-black text-slate-900">
                        {formatMoney(stage.value)} <span className="text-slate-400 text-[11px] font-normal">({percent.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'crm_touchpoints_activity' && (
        <div className="space-y-4">
          {/* Touchpoints Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">المكالمات الهاتفية</span>
              <span className="text-2xl font-black text-blue-600">{touchpointActivityData.callsCount}</span>
              <span className="text-[11px] text-slate-400 block mt-1">مكالمة متابعة مسجلة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">الزيارات الميدانية</span>
              <span className="text-2xl font-black text-emerald-600">{touchpointActivityData.visitsCount}</span>
              <span className="text-[11px] text-slate-400 block mt-1">زيارة مباشرة للعملاء</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">الاجتماعات والمراسلات</span>
              <span className="text-2xl font-black text-purple-600">
                {touchpointActivityData.meetingsCount + touchpointActivityData.emailsCount}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">تواصل رسمي</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <span className="text-xs text-rose-700 font-bold block mb-1">العملاء المهملون (&gt;30 يوم)</span>
              <span className="text-2xl font-black text-rose-600">
                {touchpointActivityData.neglectedCustomers.length}
              </span>
              <span className="text-[11px] text-rose-600 font-bold block mt-1">بحاجة لمتابعة فورية</span>
            </div>
          </div>

          {/* Neglected Customers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">سجل العملاء المنقطعين والمهملين دون متابعة حديثة</h3>
                <p className="text-xs text-slate-500 mt-0.5">عملاء لم يتم تسجيل أي نشاط أو اتصال معهم منذ أكثر من 30 يوماً</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">المندوب المسؤول</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5">المدينة / المحافظة</th>
                    <th className="p-3.5 text-center">أيام الانقطاع</th>
                    <th className="p-3.5">آخر نشاط مسجل</th>
                    <th className="p-3.5 text-left">الرصيد القائم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {touchpointActivityData.neglectedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        رائع! تم التواصل مع كافة العملاء خلال الـ 30 يوماً الماضية
                      </td>
                    </tr>
                  ) : (
                    touchpointActivityData.neglectedCustomers.map((n) => (
                      <tr key={n.customer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{n.customer.name}</div>
                          <div className="text-[11px] text-slate-400">{n.customer.code}</div>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">{n.customer.salesRepName || '-'}</td>
                        <td className="p-3.5 text-slate-700 dir-ltr text-right">{n.customer.phone}</td>
                        <td className="p-3.5 text-slate-600">{n.customer.governorate || '-'}</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            {n.daysSinceLastContact === 999 ? 'لم يُتواصل معه' : `منذ ${n.daysSinceLastContact} يوم`}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{n.lastInteraction?.title || 'لا يوجد سجل سابق'}</td>
                        <td className="p-3.5 text-left font-bold text-slate-900">
                          {formatMoney(n.customer.currentBalance || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'crm_support_sla' && (
        <div className="space-y-4">
          {/* SLA Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">نسبة إغلاق التذاكر (SLA)</span>
              <span className="text-2xl font-black text-emerald-600">{supportSlaData.resolutionRate.toFixed(1)}%</span>
              <span className="text-xs text-emerald-600 font-bold block mt-1">{supportSlaData.resolved} تذكرة محلولة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">التذاكر المفتوحة حالياً</span>
              <span className="text-2xl font-black text-amber-600">{supportSlaData.open}</span>
              <span className="text-xs text-slate-400 block mt-1">تنتظر اتخاذ إجراء</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">تذاكر قيد المعالجة</span>
              <span className="text-2xl font-black text-blue-600">{supportSlaData.inProgress}</span>
              <span className="text-xs text-slate-400 block mt-1">يتم متابعتها من الفريق</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">تذاكر طارئة وعاجلة</span>
              <span className="text-2xl font-black text-rose-600">{supportSlaData.urgentCount}</span>
              <span className="text-xs text-rose-600 font-bold block mt-1">أولوية قصوى غير مغلقة</span>
            </div>
          </div>

          {/* Tickets SLA Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">سجل تذاكر الدعم والشكاوى ومتابعة مستوى الخدمة</h3>
                <p className="text-xs text-slate-500 mt-0.5">متابعة زمن الإغلاق وتصنيف الأسباب لتعزيز رضا العملاء</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">موضوع التذكرة</th>
                    <th className="p-3.5">التصنيف</th>
                    <th className="p-3.5">الأولوية</th>
                    <th className="p-3.5">الموظف المسؤول</th>
                    <th className="p-3.5 text-center">الحالة</th>
                    <th className="p-3.5">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supportSlaData.tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        لا توجد تذاكر دعم مسجلة حتى الآن
                      </td>
                    </tr>
                  ) : (
                    supportSlaData.tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{t.customerName}</td>
                        <td className="p-3.5 font-bold text-slate-800 max-w-xs truncate">{t.subject}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {t.category === 'billing'
                              ? 'فواتير وحسابات'
                              : t.category === 'product'
                              ? 'جودة منتج'
                              : t.category === 'delivery'
                              ? 'شحن وتوصيل'
                              : 'عام'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              t.priority === 'urgent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : t.priority === 'high'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.priority === 'urgent'
                              ? 'عاجل جداً'
                              : t.priority === 'high'
                              ? 'مرتفع'
                              : t.priority === 'medium'
                              ? 'متوسط'
                              : 'منخفض'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{t.assignedTo || 'غير محدد'}</td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              t.status === 'resolved' || t.status === 'closed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : t.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {t.status === 'resolved'
                              ? 'تم الحل'
                              : t.status === 'closed'
                              ? 'مغلقة'
                              : t.status === 'in_progress'
                              ? 'قيد المعالجة'
                              : 'مفتوحة'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">{t.createdAt || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintModal && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={`طباعة ${currentMeta.title}`}
          defaultOrientation="landscape"
        >
          <div className="space-y-6 text-right">
            <PrintHeader
              docTitle={currentMeta.title}
              docSubtitle={currentMeta.subtitle}
              date={new Date().toLocaleDateString('ar-EG')}
              orientation="landscape"
            />

            {/* Print specific table based on report */}
            {selectedReport === 'crm_customer_statement' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between text-xs">
                  <div>
                    <span className="font-bold">العميل:</span> {selectedCustomer?.name} ({selectedCustomer?.code})
                  </div>
                  <div>
                    <span className="font-bold">الرصيد القائم:</span> {formatMoney(customerStatementSummary.balance)}
                  </div>
                </div>
                <table className="w-full text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="border p-2">التاريخ</th>
                      <th className="border p-2">نوع الحركة</th>
                      <th className="border p-2">المرجع</th>
                      <th className="border p-2">البيان</th>
                      <th className="border p-2">مدين</th>
                      <th className="border p-2">دائن</th>
                      <th className="border p-2">الرصيد التراكمي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerLedger.map((r) => (
                      <tr key={r.id}>
                        <td className="border p-2">{r.date}</td>
                        <td className="border p-2">{r.type}</td>
                        <td className="border p-2 font-bold">{r.reference}</td>
                        <td className="border p-2">{r.notes}</td>
                        <td className="border p-2 text-left">{r.debit > 0 ? formatMoney(r.debit) : '-'}</td>
                        <td className="border p-2 text-left">{r.credit > 0 ? formatMoney(r.credit) : '-'}</td>
                        <td className="border p-2 text-left font-bold">{formatMoney(r.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReport === 'crm_collection_efficiency' && (
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="border p-2">العميل</th>
                    <th className="border p-2">المندوب</th>
                    <th className="border p-2">الفواتير</th>
                    <th className="border p-2">المحصل</th>
                    <th className="border p-2">المتبقي</th>
                    <th className="border p-2">المتأخر</th>
                    <th className="border p-2">نسبة التحصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionEfficiencyData.customerStats.map((s) => (
                    <tr key={s.customer.id}>
                      <td className="border p-2 font-bold">{s.customer.name}</td>
                      <td className="border p-2">{s.customer.salesRepName || '-'}</td>
                      <td className="border p-2 text-left">{formatMoney(s.billed)}</td>
                      <td className="border p-2 text-left">{formatMoney(s.collected)}</td>
                      <td className="border p-2 text-left">{formatMoney(s.remaining)}</td>
                      <td className="border p-2 text-left">{formatMoney(s.overdue)}</td>
                      <td className="border p-2 text-center font-bold">{s.efficiencyRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'crm_rfm_segmentation' && (
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="border p-2">العميل</th>
                    <th className="border p-2">التصنيف</th>
                    <th className="border p-2">آخر شراء (أيام)</th>
                    <th className="border p-2">مرات الشراء</th>
                    <th className="border p-2">إجمالي المنفق</th>
                    <th className="border p-2">شريحة العميل</th>
                  </tr>
                </thead>
                <tbody>
                  {rfmData.items.map((i) => (
                    <tr key={i.customer.id}>
                      <td className="border p-2 font-bold">{i.customer.name}</td>
                      <td className="border p-2">{i.customer.customerCategory || '-'}</td>
                      <td className="border p-2 text-center">{i.recencyDays === 999 ? '-' : i.recencyDays}</td>
                      <td className="border p-2 text-center">{i.frequency}</td>
                      <td className="border p-2 text-left">{formatMoney(i.monetary)}</td>
                      <td className="border p-2 font-bold">{i.segmentLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'crm_credit_risk' && (
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="border p-2">العميل</th>
                    <th className="border p-2">السقف الائتماني</th>
                    <th className="border p-2">إجمالي الدين</th>
                    <th className="border p-2">0-30 يوم</th>
                    <th className="border p-2">31-60 يوم</th>
                    <th className="border p-2">61-90 يوم</th>
                    <th className="border p-2">+90 يوم</th>
                    <th className="border p-2">المخاطر</th>
                  </tr>
                </thead>
                <tbody>
                  {creditRiskData.items.map((i) => (
                    <tr key={i.customer.id}>
                      <td className="border p-2 font-bold">{i.customer.name}</td>
                      <td className="border p-2 text-left">{formatMoney(i.creditLimit)}</td>
                      <td className="border p-2 text-left font-bold">{formatMoney(i.totalDue)}</td>
                      <td className="border p-2 text-left">{formatMoney(i.d0_30)}</td>
                      <td className="border p-2 text-left">{formatMoney(i.d31_60)}</td>
                      <td className="border p-2 text-left">{formatMoney(i.d61_90)}</td>
                      <td className="border p-2 text-left font-bold text-rose-600">{formatMoney(i.d90_plus)}</td>
                      <td className="border p-2 text-center">{i.riskLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'crm_rep_productivity' && (
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="border p-2">المندوب</th>
                    <th className="border p-2">العملاء</th>
                    <th className="border p-2">الفواتير</th>
                    <th className="border p-2">المستهدف</th>
                    <th className="border p-2">المبيعات المحققة</th>
                    <th className="border p-2">نسبة التحقيق</th>
                    <th className="border p-2">التحصيل الفعلي</th>
                    <th className="border p-2">العمولة</th>
                  </tr>
                </thead>
                <tbody>
                  {repProductivityData.map((r) => (
                    <tr key={r.rep.id}>
                      <td className="border p-2 font-bold">{r.rep.name}</td>
                      <td className="border p-2 text-center">{r.customersCount}</td>
                      <td className="border p-2 text-center">{r.invoicesCount}</td>
                      <td className="border p-2 text-left">{formatMoney(r.target)}</td>
                      <td className="border p-2 text-left font-bold">{formatMoney(r.totalSalesAchieved)}</td>
                      <td className="border p-2 text-center">{r.salesAchievementRate.toFixed(0)}%</td>
                      <td className="border p-2 text-left">{formatMoney(r.totalCollected)}</td>
                      <td className="border p-2 text-left">{formatMoney(r.commissionEarned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
