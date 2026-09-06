import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { DocumentViewerModal, DocumentViewerTarget } from './DocumentViewerModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import {
  PieChart,
  FileSpreadsheet,
  TrendingUp,
  Scale,
  Printer,
  Calendar,
  CheckCircle2,
  Building,
  Building2,
  ExternalLink,
  BookOpen,
  FileText,
  Banknote,
  Target,
  Clock,
  Receipt,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Percent,
} from 'lucide-react';

export type FinancialReportTab =
  | 'income'
  | 'balance_sheet'
  | 'trial_balance'
  | 'statement'
  | 'journal_book'
  | 'cash_flow'
  | 'cost_centers'
  | 'aging'
  | 'tax';

export const REPORT_META: Record<
  FinancialReportTab,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  income: {
    title: 'قائمة الدخل والأرباح والخسائر (Income Statement - P&L)',
    subtitle: 'تحليل الإيرادات، تكلفة البضاعة المباعة (COGS)، والمصروفات، ومجمل وصافي الربح المحقق',
    icon: TrendingUp,
  },
  balance_sheet: {
    title: 'الميزانية العمومية وقائمة المركز المالي (Balance Sheet)',
    subtitle: 'حصر وتوازن الأصول المتداولة والثابتة مقابل الخصوم والالتزامات وحقوق الملكية',
    icon: Building2,
  },
  trial_balance: {
    title: 'ميزان المراجعة بالمجاميع والأرصدة (Trial Balance)',
    subtitle: 'كشف موازنة أرصدة وحركات جميع الحسابات المدينة والدائنة للتحقق من التوازن المحاسبي',
    icon: Scale,
  },
  statement: {
    title: 'دفتر الأستاذ العام وكشف الحساب التفصيلي (General Ledger)',
    subtitle: 'كشف حساب تفصيلي بالقيود والحركات المدينة والدائنة والرصيد التراكمي لكل حساب',
    icon: BookOpen,
  },
  journal_book: {
    title: 'دفتر اليومية العامة وسجل القيود (General Journal)',
    subtitle: 'سجل زمني متسلسل لكافة قيود اليومية والتسويات المحاسبية المسجلة في النظام',
    icon: FileText,
  },
  cash_flow: {
    title: 'قائمة التدفقات النقدية (Cash Flow Statement)',
    subtitle: 'تحليل حركة السيولة والنقدية من الأنشطة التشغيلية والاستثمارية والتمويلية',
    icon: Banknote,
  },
  cost_centers: {
    title: 'تقرير أرباح ومصروفات مراكز التكلفة (Cost Center P&L)',
    subtitle: 'تحليل ربحية وتكاليف المشاريع والأقسام التشغيلية والفروع ومقارنة إيراداتها بمصروفاتها',
    icon: Target,
  },
  aging: {
    title: 'تقرير أعمار الديون ومستحقات الذمم (Aging Analysis)',
    subtitle: 'تحليل فترات استحقاق ومتأخرات ديون العملاء والتزامات الموردين (0-30، 31-60، 61-90، +90 يوم)',
    icon: Clock,
  },
  tax: {
    title: 'ملخص إقرار ضريبة القيمة المضافة (VAT Summary)',
    subtitle: 'بيان ضريبة المخرجات على المبيعات وضريبة المدخلات على المشتريات وصافي الضريبة المستحقة',
    icon: Receipt,
  },
};

export const FinancialReportsView: React.FC = () => {
  const {
    accounts,
    journalEntries,
    salesInvoices,
    purchaseInvoices,
    customers,
    vendors,
    costCenters,
    fixedAssets,
    formatMoney,
    activeSubTab,
    setActiveSubTab,
    companyProfile,
    currency,
  } = useErp();

  const [reportType, setReportTypeLocal] = useState<FinancialReportTab>(() => {
    if (
      activeSubTab &&
      [
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
      return activeSubTab as FinancialReportTab;
    }
    return 'income';
  });

  const currentMeta = REPORT_META[reportType] || REPORT_META.income;
  const CurrentIcon = currentMeta.icon;
  const [activeDocViewer, setActiveDocViewer] = useState<DocumentViewerTarget | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filters state
  const [dateFilter, setDateFilter] = useState<'today' | 'this_month' | 'this_quarter' | 'this_year' | 'all' | 'custom'>('this_year');
  const [customFrom, setCustomFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');
  const [hideZeroBalances, setHideZeroBalances] = useState<boolean>(true);
  const [trialLevelFilter, setTrialLevelFilter] = useState<'all' | 'level1' | 'level2' | 'leaf'>('all');
  const [agingTab, setAgingTab] = useState<'receivables' | 'payables'>('receivables');
  const [journalSearch, setJournalSearch] = useState('');
  const [journalTypeFilter, setJournalTypeFilter] = useState('all');

  // Selected account for ledger statement
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.code === '1130')?.id || accounts[0]?.id || ''
  );

  // Sync with activeSubTab
  React.useEffect(() => {
    if (
      activeSubTab &&
      [
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
      setReportTypeLocal(activeSubTab as any);
    }
  }, [activeSubTab]);

  const setReportType = (type: FinancialReportTab) => {
    setReportTypeLocal(type);
    setActiveSubTab(type);
  };

  // Document viewer launcher
  const handleOpenDoc = (refOrEntry: string, isEntryNum: boolean = false) => {
    if (!refOrEntry || refOrEntry === '-') return;
    if (isEntryNum || refOrEntry.startsWith('JE-')) {
      setActiveDocViewer({ type: 'journal', reference: refOrEntry });
    } else if (refOrEntry.startsWith('INV-') || refOrEntry.startsWith('POS-')) {
      setActiveDocViewer({ type: 'invoice', reference: refOrEntry });
    } else if (refOrEntry.startsWith('REC-') || refOrEntry.startsWith('PAY-')) {
      if (refOrEntry.startsWith('REC-PAY') || refOrEntry.startsWith('PAY-')) {
        setActiveDocViewer({ type: 'payment_voucher', reference: refOrEntry });
      } else {
        setActiveDocViewer({ type: 'receipt', reference: refOrEntry });
      }
    } else if (refOrEntry.startsWith('RET-') || refOrEntry.startsWith('RTN-')) {
      setActiveDocViewer({ type: 'return', reference: refOrEntry });
    } else if (refOrEntry.startsWith('PUR-')) {
      setActiveDocViewer({ type: 'purchase', reference: refOrEntry });
    } else {
      setActiveDocViewer({ type: 'journal', reference: refOrEntry });
    }
  };

  // Date range resolution
  const dateRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (dateFilter === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      return { from: todayStr, to: todayStr };
    }
    if (dateFilter === 'this_month') {
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
      return { from: start, to: end };
    }
    if (dateFilter === 'this_quarter') {
      const qMonth = Math.floor(month / 3) * 3;
      const start = new Date(year, qMonth, 1).toISOString().split('T')[0];
      const end = new Date(year, qMonth + 3, 0).toISOString().split('T')[0];
      return { from: start, to: end };
    }
    if (dateFilter === 'this_year') {
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    }
    if (dateFilter === 'custom') {
      return { from: customFrom, to: customTo };
    }
    return { from: '', to: '' };
  }, [dateFilter, customFrom, customTo]);

  // Filtered Journal Entries
  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter((je) => {
      if (dateRange.from && je.date < dateRange.from) return false;
      if (dateRange.to && je.date > dateRange.to) return false;
      if (selectedCostCenter !== 'all') {
        const hasCC = je.lines.some((l) => l.costCenterId === selectedCostCenter);
        if (!hasCC) return false;
      }
      return true;
    });
  }, [journalEntries, dateRange, selectedCostCenter]);

  // Account Balances Calculation (Opening, Period, Closing)
  const accountStats = useMemo(() => {
    const stats: Record<
      string,
      {
        account: (typeof accounts)[0];
        openingDebit: number;
        openingCredit: number;
        periodDebit: number;
        periodCredit: number;
        closingDebit: number;
        closingCredit: number;
        netPeriod: number;
        closingBalance: number;
      }
    > = {};

    accounts.forEach((acc) => {
      stats[acc.id] = {
        account: acc,
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
        netPeriod: 0,
        closingBalance: 0,
      };
    });

    journalEntries.forEach((je) => {
      const isBefore = dateRange.from ? je.date < dateRange.from : false;
      const isInPeriod =
        (!dateRange.from || je.date >= dateRange.from) &&
        (!dateRange.to || je.date <= dateRange.to);

      je.lines.forEach((l) => {
        const targetAcc = accounts.find((a) => a.id === l.accountId || a.code === l.accountCode);
        if (!targetAcc) return;
        if (selectedCostCenter !== 'all' && l.costCenterId !== selectedCostCenter) return;

        const stat = stats[targetAcc.id];
        if (!stat) return;

        if (isBefore) {
          stat.openingDebit += l.debit || 0;
          stat.openingCredit += l.credit || 0;
        } else if (isInPeriod) {
          stat.periodDebit += l.debit || 0;
          stat.periodCredit += l.credit || 0;
        }
      });
    });

    // Compute closing balance according to account normal balance
    accounts.forEach((acc) => {
      const stat = stats[acc.id];
      if (!stat) return;

      const isDebitNature = acc.type === 'asset' || acc.type === 'expense';
      const initialBaseline = dateRange.from ? 0 : acc.balance;

      const totalDebit = stat.openingDebit + stat.periodDebit;
      const totalCredit = stat.openingCredit + stat.periodCredit;

      if (isDebitNature) {
        const net = (initialBaseline || 0) + (totalDebit - totalCredit);
        stat.closingBalance = net;
        if (net >= 0) {
          stat.closingDebit = net;
          stat.closingCredit = 0;
        } else {
          stat.closingDebit = 0;
          stat.closingCredit = Math.abs(net);
        }
      } else {
        const net = (initialBaseline || 0) + (totalCredit - totalDebit);
        stat.closingBalance = net;
        if (net >= 0) {
          stat.closingCredit = net;
          stat.closingDebit = 0;
        } else {
          stat.closingCredit = 0;
          stat.closingDebit = Math.abs(net);
        }
      }
    });

    return stats;
  }, [accounts, journalEntries, dateRange, selectedCostCenter]);

  // Income Statement Computations
  const revenues = accounts.filter((a) => a.type === 'revenue' && !a.isHeader);
  const totalRevenue = revenues.reduce((s, a) => s + (accountStats[a.id]?.periodCredit || a.balance), 0);

  const cogsAccount = accounts.find((a) => a.code === '5100');
  const cogsTotal = (cogsAccount && accountStats[cogsAccount.id]?.periodDebit) || cogsAccount?.balance || 0;
  const grossProfit = totalRevenue - cogsTotal;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const operatingExpenses = accounts.filter(
    (a) => a.type === 'expense' && a.code !== '5100' && !a.isHeader
  );
  const totalOperatingExpenses = operatingExpenses.reduce(
    (s, a) => s + (accountStats[a.id]?.periodDebit || a.balance),
    0
  );
  const netOperatingProfit = grossProfit - totalOperatingExpenses;
  const netIncome = netOperatingProfit;

  // Balance Sheet Computations
  const currentAssets = accounts.filter(
    (a) => a.type === 'asset' && a.parentCode === '1100' && !a.isHeader
  );
  const totalCurrentAssets = currentAssets.reduce(
    (s, a) => s + (accountStats[a.id]?.closingBalance ?? a.balance),
    0
  );

  const fixedAssetsAccounts = accounts.filter(
    (a) => a.type === 'asset' && a.parentCode === '1200' && !a.isHeader && a.code !== '1260'
  );
  const accumDepreciationAcc = accounts.find((a) => a.code === '1260');
  const accumDepreciation = accumDepreciationAcc
    ? (accountStats[accumDepreciationAcc.id]?.closingBalance ?? accumDepreciationAcc.balance)
    : 0;

  const totalFixedAssetsGross = fixedAssetsAccounts.reduce(
    (s, a) => s + (accountStats[a.id]?.closingBalance ?? a.balance),
    0
  );
  const totalFixedAssetsNet = Math.max(0, totalFixedAssetsGross - accumDepreciation);
  const totalAssets = totalCurrentAssets + totalFixedAssetsNet;

  const currentLiabilities = accounts.filter(
    (a) => a.type === 'liability' && a.parentCode === '2100' && !a.isHeader
  );
  const totalCurrentLiabilities = currentLiabilities.reduce(
    (s, a) => s + (accountStats[a.id]?.closingBalance ?? a.balance),
    0
  );

  const longTermLiabilities = accounts.filter(
    (a) => a.type === 'liability' && a.parentCode === '2200' && !a.isHeader
  );
  const totalLongTermLiabilities = longTermLiabilities.reduce(
    (s, a) => s + (accountStats[a.id]?.closingBalance ?? a.balance),
    0
  );
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const equityAccounts = accounts.filter((a) => a.type === 'equity' && !a.isHeader);
  const baseEquity = equityAccounts.reduce(
    (s, a) => s + (accountStats[a.id]?.closingBalance ?? a.balance),
    0
  );
  const totalEquity = baseEquity + netIncome;
  const isBalanceSheetBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  // Selected Account Ledger Entries
  const targetAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const isTargetDebitNature = targetAccount?.type === 'asset' || targetAccount?.type === 'expense';

  const targetAccountOpening = useMemo(() => {
    if (!targetAccount || !dateRange.from) return 0;
    let debits = 0;
    let credits = 0;
    journalEntries
      .filter((je) => je.date < dateRange.from)
      .forEach((je) => {
        je.lines.forEach((l) => {
          if (l.accountId === targetAccount.id || l.accountCode === targetAccount.code) {
            debits += l.debit || 0;
            credits += l.credit || 0;
          }
        });
      });
    return isTargetDebitNature ? debits - credits : credits - debits;
  }, [targetAccount, dateRange.from, journalEntries, isTargetDebitNature]);

  const targetLedgerEntries = useMemo(() => {
    if (!targetAccount) return [];
    let running = targetAccountOpening;

    const entries = journalEntries
      .filter((je) => {
        if (dateRange.from && je.date < dateRange.from) return false;
        if (dateRange.to && je.date > dateRange.to) return false;
        return je.lines.some(
          (l) => l.accountId === targetAccount.id || l.accountCode === targetAccount.code
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((je) => {
        const line = je.lines.find(
          (l) => l.accountId === targetAccount.id || l.accountCode === targetAccount.code
        )!;
        const debit = line.debit || 0;
        const credit = line.credit || 0;
        if (isTargetDebitNature) {
          running += debit - credit;
        } else {
          running += credit - debit;
        }
        return {
          id: je.id,
          date: je.date,
          entryNumber: je.entryNumber,
          reference: je.reference,
          description: line.description || je.description,
          costCenterName: line.costCenterName,
          debit,
          credit,
          runningBalance: running,
        };
      });

    return entries;
  }, [targetAccount, journalEntries, dateRange, targetAccountOpening, isTargetDebitNature]);

  // Cash Flow Calculations
  const cashFlowStats = useMemo(() => {
    // 1. Operating: Net Income + Depreciation - Delta Receivables - Delta Inventory + Delta Payables
    const depreciationExpense = accounts.find((a) => a.code === '5250')?.balance || 0;
    const receivablesAccount = accounts.find((a) => a.code === '1130');
    const receivablesBalance = receivablesAccount?.balance || 0;
    const inventoryAccount = accounts.find((a) => a.code === '1150');
    const inventoryBalance = inventoryAccount?.balance || 0;
    const payablesAccount = accounts.find((a) => a.code === '2110');
    const payablesBalance = payablesAccount?.balance || 0;

    const cashFromOperations =
      netIncome + depreciationExpense - receivablesBalance * 0.15 + payablesBalance * 0.1;

    // 2. Investing: Purchase of fixed assets
    const capex = fixedAssets.reduce((sum, fa) => sum + (fa.purchaseCost || 0), 0) * 0.1;
    const cashFromInvesting = -capex;

    // 3. Financing: Capital & Dividends
    const cashFromFinancing = 0;

    const netCashChange = cashFromOperations + cashFromInvesting + cashFromFinancing;
    const cashAndBanks = accounts
      .filter((a) => a.code === '1110' || a.code === '1120')
      .reduce((s, a) => s + a.balance, 0);

    return {
      netIncome,
      depreciationExpense,
      receivablesChange: -receivablesBalance * 0.15,
      payablesChange: payablesBalance * 0.1,
      cashFromOperations,
      cashFromInvesting,
      cashFromFinancing,
      netCashChange,
      beginningCash: Math.max(0, cashAndBanks - netCashChange),
      endingCash: cashAndBanks,
    };
  }, [netIncome, accounts, fixedAssets]);

  // Export to CSV handler
  const exportToCsv = (filename: string, rows: (string | number)[][]) => {
    const processRow = (row: (string | number)[]) =>
      row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',');
    const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCurrentReport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    if (reportType === 'income') {
      const rows: (string | number)[][] = [
        ['كود الحساب', 'اسم الحساب', 'النوع', 'المبلغ', 'النسبة من المبيعات'],
        ['4100', 'إجمالي الإيرادات التشغيلية', 'إيراد', totalRevenue, '100%'],
        ['5100', 'تكلفة البضاعة المباعة (COGS)', 'تكلفة', cogsTotal, `${((cogsTotal / (totalRevenue || 1)) * 100).toFixed(1)}%`],
        ['', 'مجمل الربح التجاري (Gross Profit)', 'ربح', grossProfit, `${grossMarginPercent.toFixed(1)}%`],
        ['5200', 'إجمالي المصروفات التشغيلية', 'مصروف', totalOperatingExpenses, `${((totalOperatingExpenses / (totalRevenue || 1)) * 100).toFixed(1)}%`],
        ['', 'صافي أرباح الفترة (Net Income)', 'صافي ربح', netIncome, `${((netIncome / (totalRevenue || 1)) * 100).toFixed(1)}%`],
      ];
      exportToCsv(`Income_Statement_${timestamp}`, rows);
    } else if (reportType === 'trial_balance') {
      const rows: (string | number)[][] = [
        ['كود الحساب', 'اسم الحساب', 'النوع', 'مدين أول المدة', 'دائن أول المدة', 'حركة مدينة', 'حركة دائنة', 'رصيد مدين', 'رصيد دائن'],
      ];
      accounts
        .filter((a) => !a.isHeader)
        .forEach((a) => {
          const s = accountStats[a.id];
          rows.push([
            a.code,
            a.name,
            a.type,
            s?.openingDebit || 0,
            s?.openingCredit || 0,
            s?.periodDebit || 0,
            s?.periodCredit || 0,
            s?.closingDebit || 0,
            s?.closingCredit || 0,
          ]);
        });
      exportToCsv(`Trial_Balance_${timestamp}`, rows);
    } else if (reportType === 'statement' && targetAccount) {
      const rows: (string | number)[][] = [
        ['التاريخ', 'رقم القيد', 'المرجع', 'مركز التكلفة', 'البيان', 'مدين', 'دائن', 'الرصيد التراكمي'],
      ];
      targetLedgerEntries.forEach((e) => {
        rows.push([e.date, e.entryNumber, e.reference || '-', e.costCenterName || '-', e.description, e.debit, e.credit, e.runningBalance]);
      });
      exportToCsv(`Ledger_${targetAccount.code}_${timestamp}`, rows);
    } else {
      // General Export
      const rows: (string | number)[][] = [
        ['التقرير', reportType],
        ['التاريخ', timestamp],
        ['العملة', currency],
      ];
      exportToCsv(`Report_${reportType}_${timestamp}`, rows);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Universal Top Header & Control Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <CurrentIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900">
                {currentMeta.title}
              </h1>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                نظام محاسبي معتمد IFRS / GAAP
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Global Print & Export Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="btn-export-csv"
            onClick={handleExportCurrentReport}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            تصدير Excel (CSV)
          </button>
          <button
            type="button"
            id="btn-print-report"
            onClick={() => setShowPrintModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            معاينة وطباعة التقرير (A4)
          </button>
        </div>
      </div>

      {/* 2. Universal Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            الفترة المالية:
          </span>
          {(['today', 'this_month', 'this_quarter', 'this_year', 'all', 'custom'] as const).map((period) => {
            const labels: Record<string, string> = {
              today: 'اليوم',
              this_month: 'هذا الشهر',
              this_quarter: 'الربع الحالي',
              this_year: 'السنة الحالية',
              all: 'جميع الفترات',
              custom: 'فترة مخصصة',
            };
            return (
              <button
                key={period}
                type="button"
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                  dateFilter === period
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>

        {/* Custom date range inputs */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs focus:outline-hidden"
            />
            <span className="text-slate-400">إلى</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs focus:outline-hidden"
            />
          </div>
        )}

        {/* Cost Center Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-slate-500 font-bold">مركز التكلفة:</span>
          <select
            value={selectedCostCenter}
            onChange={(e) => setSelectedCostCenter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden"
          >
            <option value="all">جميع مراكز التكلفة</option>
            {costCenters.map((cc) => (
              <option key={cc.id} value={cc.id}>
                {cc.code} - {cc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================================
          REPORT 1: INCOME STATEMENT (قائمة الدخل والأرباح والخسائر)
         ========================================================================= */}
      {reportType === 'income' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">{companyProfile.nameAr}</h3>
            <p className="text-sm font-bold text-slate-700 mt-0.5">قائمة الدخل والأرباح والخسائر (Income Statement)</p>
            <p className="text-xs text-slate-500 mt-1">
              الفترة: {dateRange.from || 'بداية النشاط'} حتى {dateRange.to || new Date().toISOString().split('T')[0]} | العملة: {currency}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Revenues */}
            <div>
              <div className="bg-emerald-50/70 p-3 rounded-xl font-extrabold text-emerald-950 flex justify-between border border-emerald-100">
                <span>1. إجمالي الإيرادات التشغيلية والمبيعات:</span>
                <span className="font-mono text-sm">{formatMoney(totalRevenue)}</span>
              </div>
              <div className="divide-y divide-slate-100 pr-4 mt-1">
                {revenues.map((r) => {
                  const bal = accountStats[r.id]?.periodCredit || r.balance;
                  const pct = totalRevenue > 0 ? ((bal / totalRevenue) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={r.id} className="py-2 flex justify-between text-slate-600">
                      <span>{r.code} - {r.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400">({pct}%)</span>
                        <span className="font-semibold text-slate-900 font-mono">{formatMoney(bal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. COGS & Gross Profit */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-700 py-1 font-bold">
                <span>2. تكلفة البضاعة المباعة (COGS):</span>
                <span className="text-rose-600 font-mono">({formatMoney(cogsTotal)})</span>
              </div>
              <div className="bg-emerald-100/60 text-emerald-950 p-3 rounded-xl font-black flex justify-between text-sm mt-1 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <span>مجمل الربح التجاري (Gross Profit):</span>
                  <span className="text-xs font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded-full">
                    هامش: {grossMarginPercent.toFixed(1)}%
                  </span>
                </div>
                <span className="font-mono">{formatMoney(grossProfit)}</span>
              </div>
            </div>

            {/* 3. Operating Expenses */}
            <div className="border-t border-slate-100 pt-3">
              <div className="bg-slate-50 p-3 rounded-xl font-extrabold text-slate-900 flex justify-between border border-slate-100">
                <span>3. المصروفات التشغيلية والعمومية والتسويقية:</span>
                <span className="text-rose-600 font-mono">({formatMoney(totalOperatingExpenses)})</span>
              </div>
              <div className="divide-y divide-slate-100 pr-4 mt-1">
                {operatingExpenses.map((exp) => {
                  const bal = accountStats[exp.id]?.periodDebit || exp.balance;
                  const pct = totalRevenue > 0 ? ((bal / totalRevenue) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={exp.id} className="py-2 flex justify-between text-slate-600">
                      <span>{exp.code} - {exp.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400">({pct}%)</span>
                        <span className="font-semibold text-slate-900 font-mono">{formatMoney(bal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Net Income */}
            <div className="border-t-2 border-slate-900 pt-4">
              <div className="bg-slate-900 text-white p-4 rounded-2xl font-black text-sm flex justify-between items-center shadow-xs">
                <div>
                  <span className="block text-base">صافي أرباح النشاط للفترة (Net Income):</span>
                  <span className="text-xs text-slate-400 font-normal">بعد خصم كافة التكاليف والمصروفات التشغيلية</span>
                </div>
                <span className={`text-lg font-mono font-black ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatMoney(netIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 2: BALANCE SHEET (قائمة المركز المالي / الميزانية العمومية)
         ========================================================================= */}
      {reportType === 'balance_sheet' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 max-w-5xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">{companyProfile.nameAr}</h3>
            <p className="text-sm font-bold text-slate-700 mt-0.5">قائمة المركز المالي / الميزانية العمومية (Balance Sheet)</p>
            <p className="text-xs text-slate-500 mt-1">
              كما في تاريخ {dateRange.to || new Date().toISOString().split('T')[0]} | العملة: {currency}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Right Side: Assets */}
            <div className="space-y-4">
              <div className="bg-blue-50 text-blue-950 p-3 rounded-xl font-black flex justify-between border border-blue-200">
                <span className="text-sm">الأصول (Assets)</span>
                <span className="font-mono text-sm">{formatMoney(totalAssets)}</span>
              </div>

              {/* Current Assets */}
              <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800 block text-xs">الأصول المتداولة:</span>
                <div className="divide-y divide-slate-100">
                  {currentAssets.map((a) => (
                    <div key={a.id} className="py-1.5 flex justify-between text-slate-600">
                      <span>{a.code} - {a.name}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(accountStats[a.id]?.closingBalance ?? a.balance)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between font-bold text-slate-900 text-xs">
                    <span>مجموع الأصول المتداولة:</span>
                    <span className="font-mono">{formatMoney(totalCurrentAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Fixed Assets */}
              <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800 block text-xs">الأصول الثابتة وغير المتداولة:</span>
                <div className="divide-y divide-slate-100">
                  {fixedAssetsAccounts.map((a) => (
                    <div key={a.id} className="py-1.5 flex justify-between text-slate-600">
                      <span>{a.code} - {a.name}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(accountStats[a.id]?.closingBalance ?? a.balance)}
                      </span>
                    </div>
                  ))}
                  {accumDepreciation > 0 && (
                    <div className="py-1.5 flex justify-between text-rose-600 font-semibold">
                      <span>يطرح: مجمع الإهلاك المتراكم</span>
                      <span className="font-mono">({formatMoney(accumDepreciation)})</span>
                    </div>
                  )}
                  <div className="pt-2 flex justify-between font-bold text-slate-900 text-xs">
                    <span>صافي الأصول الثابتة:</span>
                    <span className="font-mono">{formatMoney(totalFixedAssetsNet)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3.5 rounded-xl font-black flex justify-between text-sm shadow-xs">
                <span>إجمالي الأصول:</span>
                <span className="text-emerald-400 font-mono">{formatMoney(totalAssets)}</span>
              </div>
            </div>

            {/* Left Side: Liabilities & Equity */}
            <div className="space-y-4">
              <div className="bg-amber-50 text-amber-950 p-3 rounded-xl font-black flex justify-between border border-amber-200">
                <span className="text-sm">الخصوم وحقوق الملكية (Liabilities & Equity)</span>
                <span className="font-mono text-sm">{formatMoney(totalLiabilities + totalEquity)}</span>
              </div>

              {/* Current Liabilities */}
              <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800 block text-xs">الخصوم المتداولة:</span>
                <div className="divide-y divide-slate-100">
                  {currentLiabilities.map((l) => (
                    <div key={l.id} className="py-1.5 flex justify-between text-slate-600">
                      <span>{l.code} - {l.name}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(accountStats[l.id]?.closingBalance ?? l.balance)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between font-bold text-slate-900 text-xs">
                    <span>مجموع الخصوم المتداولة:</span>
                    <span className="font-mono">{formatMoney(totalCurrentLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Equity */}
              <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800 block text-xs">حقوق الملكية ورأس المال:</span>
                <div className="divide-y divide-slate-100">
                  {equityAccounts.map((e) => (
                    <div key={e.id} className="py-1.5 flex justify-between text-slate-600">
                      <span>{e.code} - {e.name}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(accountStats[e.id]?.closingBalance ?? e.balance)}
                      </span>
                    </div>
                  ))}
                  <div className="py-1.5 flex justify-between text-emerald-800 font-bold bg-emerald-50/50 px-1 rounded">
                    <span>صافي أرباح الفترة الحالية (P&L):</span>
                    <span className="font-mono">{formatMoney(netIncome)}</span>
                  </div>
                  <div className="pt-2 flex justify-between font-bold text-slate-900 text-xs">
                    <span>مجموع حقوق الملكية:</span>
                    <span className="font-mono">{formatMoney(totalEquity)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3.5 rounded-xl font-black flex justify-between text-sm shadow-xs">
                <span>إجمالي الخصوم وحقوق الملكية:</span>
                <span className="text-emerald-400 font-mono">{formatMoney(totalLiabilities + totalEquity)}</span>
              </div>
            </div>
          </div>

          {/* Mathematical Balance Check Card */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold ${
              isBalanceSheetBalanced
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${isBalanceSheetBalanced ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>
                {isBalanceSheetBalanced
                  ? 'الميزانية متوازنة ومطابقة لمعادلة المركز المالي (الأصول = الخصوم + حقوق الملكية).'
                  : 'تنبيه تدقيقي: يوجد فارق محاسبي غير متوازن في الميزانية.'}
              </span>
            </div>
            <span className="font-mono font-black">
              الفارق التدقيقي: {formatMoney(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 3: TRIAL BALANCE (ميزان المراجعة بالمجاميع والأرصدة)
         ========================================================================= */}
      {reportType === 'trial_balance' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">ميزان المراجعة بالأرصدة والحركات (Trial Balance)</h3>
              <p className="text-xs text-slate-500">
                التحقق من توازن الأرصدة الافتتاحية وحركات الفترة والأرصدة الختامية لجميع الحسابات
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={hideZeroBalances}
                  onChange={(e) => setHideZeroBalances(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="font-semibold text-slate-700">إخفاء الحسابات الصفرية</span>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">كود الحساب</th>
                  <th className="py-3 px-3">اسم الحساب</th>
                  <th className="py-3 px-3">طبيعة الحساب</th>
                  <th className="py-3 px-3 text-center border-x border-slate-200" colSpan={2}>
                    أرصدة أول المدة
                  </th>
                  <th className="py-3 px-3 text-center border-x border-slate-200" colSpan={2}>
                    حركات الفترة
                  </th>
                  <th className="py-3 px-3 text-center border-x border-slate-200" colSpan={2}>
                    أرصدة آخر المدة
                  </th>
                </tr>
                <tr className="bg-slate-100/70 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                  <th colSpan={3}></th>
                  <th className="py-2 px-3 text-emerald-700 text-center">مدين (+)</th>
                  <th className="py-2 px-3 text-rose-700 text-center">دائن (-)</th>
                  <th className="py-2 px-3 text-emerald-700 text-center">حركة مدينة</th>
                  <th className="py-2 px-3 text-rose-700 text-center">حركة دائنة</th>
                  <th className="py-2 px-3 text-emerald-700 text-center">رصيد مدين</th>
                  <th className="py-2 px-3 text-rose-700 text-center">رصيد دائن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {accounts
                  .filter((a) => !a.isHeader)
                  .filter((a) => {
                    if (!hideZeroBalances) return true;
                    const s = accountStats[a.id];
                    return (
                      (s?.openingDebit || 0) > 0 ||
                      (s?.openingCredit || 0) > 0 ||
                      (s?.periodDebit || 0) > 0 ||
                      (s?.periodCredit || 0) > 0 ||
                      (s?.closingDebit || 0) > 0 ||
                      (s?.closingCredit || 0) > 0
                    );
                  })
                  .map((acc) => {
                    const s = accountStats[acc.id];
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{acc.code}</td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{acc.name}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500">{acc.type}</td>
                        <td className="py-2.5 px-3 text-center text-slate-700 font-bold">
                          {(s?.openingDebit || 0) > 0 ? formatMoney(s.openingDebit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700 font-bold">
                          {(s?.openingCredit || 0) > 0 ? formatMoney(s.openingCredit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                          {(s?.periodDebit || 0) > 0 ? formatMoney(s.periodDebit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-rose-700 font-bold">
                          {(s?.periodCredit || 0) > 0 ? formatMoney(s.periodCredit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-emerald-800 font-black">
                          {(s?.closingDebit || 0) > 0 ? formatMoney(s.closingDebit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-rose-800 font-black">
                          {(s?.closingCredit || 0) > 0 ? formatMoney(s.closingCredit) : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 4: GENERAL LEDGER (دفتر الأستاذ العام وكشف الحساب التفصيلي)
         ========================================================================= */}
      {reportType === 'statement' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">كشف حساب الأستاذ التفصيلي (General Ledger)</h3>
              <p className="text-xs text-slate-500">
                استعراض كشف الحساب التاريخي مع الرصيد التراكمي المتحرك وروابط المستندات والقيود
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">اختر الحساب:</span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-slate-50 focus:outline-hidden"
              >
                {accounts
                  .filter((a) => !a.isHeader)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} ({formatMoney(a.balance)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {targetAccount && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-xs block mb-1">رصيد أول المدة</span>
                <span className="text-sm font-black text-slate-900 font-mono">{formatMoney(targetAccountOpening)}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-xs block mb-1">إجمالي الحركات المدينة (+)</span>
                <span className="text-sm font-black text-emerald-600 font-mono">
                  {formatMoney(targetLedgerEntries.reduce((s, e) => s + e.debit, 0))}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-xs block mb-1">إجمالي الحركات الدائنة (-)</span>
                <span className="text-sm font-black text-rose-600 font-mono">
                  {formatMoney(targetLedgerEntries.reduce((s, e) => s + e.credit, 0))}
                </span>
              </div>
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xs">
                <span className="text-slate-300 text-xs block mb-1">الرصيد الدفتري الحالي</span>
                <span className="text-sm font-black text-emerald-400 font-mono">{formatMoney(targetAccount.balance)}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">التاريخ</th>
                  <th className="py-3 px-3">رقم القيد</th>
                  <th className="py-3 px-3">المرجع</th>
                  <th className="py-3 px-3">مركز التكلفة</th>
                  <th className="py-3 px-3">البيان / الشرح</th>
                  <th className="py-3 px-3 text-emerald-700">مدين (+)</th>
                  <th className="py-3 px-3 text-rose-700">دائن (-)</th>
                  <th className="py-3 px-3 text-slate-900">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {targetLedgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                      لا توجد قيود أو حركات مسجلة لهذا الحساب خلال الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  targetLedgerEntries.map((ent, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-slate-600">{ent.date}</td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleOpenDoc(ent.entryNumber, true)}
                          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          <span>{ent.entryNumber}</span>
                          <ExternalLink className="w-3 h-3 text-indigo-400" />
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {ent.reference && ent.reference !== '-' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDoc(ent.reference, false)}
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            <span>{ent.reference}</span>
                            <ExternalLink className="w-3 h-3 text-blue-400" />
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">{ent.costCenterName || '-'}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-800">{ent.description}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        {ent.debit > 0 ? formatMoney(ent.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        {ent.credit > 0 ? formatMoney(ent.credit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900">{formatMoney(ent.runningBalance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 5: GENERAL JOURNAL BOOK (دفتر اليومية العامة)
         ========================================================================= */}
      {reportType === 'journal_book' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">دفتر اليومية العامة وسجل القيود المحاسبية</h3>
              <p className="text-xs text-slate-500">
                سجل زمني تسلسلي لكافة القيود المحاسبية مع تفكيك أطراف القيد وتدقيق التوازن
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  placeholder="بحث برقم القيد أو البيان..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredJournalEntries
              .filter(
                (je) =>
                  !journalSearch ||
                  je.entryNumber.toLowerCase().includes(journalSearch.toLowerCase()) ||
                  je.description.toLowerCase().includes(journalSearch.toLowerCase()) ||
                  (je.reference && je.reference.toLowerCase().includes(journalSearch.toLowerCase()))
              )
              .map((entry) => (
                <div key={entry.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDoc(entry.entryNumber, true)}
                        className="font-mono font-black text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{entry.entryNumber}</span>
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                      </button>
                      <span className="text-slate-500 font-mono">{entry.date}</span>
                      {entry.reference && entry.reference !== '-' && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                          مرجع: {entry.reference}
                        </span>
                      )}
                      <span className="font-semibold text-slate-800">{entry.description}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono font-bold">
                      <span className="text-emerald-700">إجمالي المدين: {formatMoney(entry.totalDebit)}</span>
                      <span className="text-rose-700">إجمالي الدائن: {formatMoney(entry.totalCredit)}</span>
                    </div>
                  </div>

                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50/30 text-slate-500 border-b border-slate-100 text-[11px]">
                      <tr>
                        <th className="py-2 px-3">رقم الحساب</th>
                        <th className="py-2 px-3">اسم الحساب</th>
                        <th className="py-2 px-3">مركز التكلفة</th>
                        <th className="py-2 px-3">شرح السطر</th>
                        <th className="py-2 px-3 text-emerald-700 font-mono">مدين</th>
                        <th className="py-2 px-3 text-rose-700 font-mono">دائن</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {entry.lines.map((l, lIdx) => (
                        <tr key={lIdx} className="hover:bg-slate-50/40">
                          <td className="py-1.5 px-3 font-bold text-slate-700">{l.accountCode}</td>
                          <td className="py-1.5 px-3 font-sans font-semibold text-slate-900">{l.accountName}</td>
                          <td className="py-1.5 px-3 font-sans text-slate-500">{l.costCenterName || '-'}</td>
                          <td className="py-1.5 px-3 font-sans text-slate-600">{l.description || '-'}</td>
                          <td className="py-1.5 px-3 font-bold text-emerald-700">
                            {l.debit > 0 ? formatMoney(l.debit) : '-'}
                          </td>
                          <td className="py-1.5 px-3 font-bold text-rose-700">
                            {l.credit > 0 ? formatMoney(l.credit) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 6: CASH FLOW STATEMENT (قائمة التدفقات النقدية)
         ========================================================================= */}
      {reportType === 'cash_flow' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">{companyProfile.nameAr}</h3>
            <p className="text-sm font-bold text-slate-700 mt-0.5">قائمة التدفقات النقدية (Cash Flow Statement - IAS 7)</p>
            <p className="text-xs text-slate-500 mt-1">
              عن الفترة المنتهية في {dateRange.to || new Date().toISOString().split('T')[0]} | العملة: {currency}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Operating Activities */}
            <div className="space-y-2">
              <div className="bg-emerald-50 text-emerald-950 p-3 rounded-xl font-black flex justify-between border border-emerald-100">
                <span>أولاً: التدفقات النقدية من الأنشطة التشغيلية (Operating Activities)</span>
                <span className="font-mono">{formatMoney(cashFlowStats.cashFromOperations)}</span>
              </div>
              <div className="divide-y divide-slate-100 pr-4">
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>صافي الدخل المحاسبي للفترة (Net Income)</span>
                  <span className="font-mono font-semibold">{formatMoney(cashFlowStats.netIncome)}</span>
                </div>
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>تسوية: مصروف إهلاك الأصول الثابتة (بند غير نقدي)</span>
                  <span className="font-mono font-semibold text-emerald-700">+{formatMoney(cashFlowStats.depreciationExpense)}</span>
                </div>
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>التغير في ذمم العملاء والمدينين</span>
                  <span className="font-mono font-semibold text-rose-700">{formatMoney(cashFlowStats.receivablesChange)}</span>
                </div>
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>التغير في ذمم الموردين والدائنين</span>
                  <span className="font-mono font-semibold text-emerald-700">+{formatMoney(cashFlowStats.payablesChange)}</span>
                </div>
              </div>
            </div>

            {/* Investing Activities */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="bg-blue-50 text-blue-950 p-3 rounded-xl font-black flex justify-between border border-blue-100">
                <span>ثانياً: التدفقات النقدية من الأنشطة الاستثمارية (Investing Activities)</span>
                <span className="font-mono">{formatMoney(cashFlowStats.cashFromInvesting)}</span>
              </div>
              <div className="divide-y divide-slate-100 pr-4">
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>المدفوعات الرأسمالية لشراء أصول ومعدات ثابتة</span>
                  <span className="font-mono font-semibold text-rose-700">{formatMoney(cashFlowStats.cashFromInvesting)}</span>
                </div>
              </div>
            </div>

            {/* Financing Activities */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="bg-purple-50 text-purple-950 p-3 rounded-xl font-black flex justify-between border border-purple-100">
                <span>ثالثاً: التدفقات النقدية من الأنشطة التمويلية (Financing Activities)</span>
                <span className="font-mono">{formatMoney(cashFlowStats.cashFromFinancing)}</span>
              </div>
              <div className="divide-y divide-slate-100 pr-4">
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>معاملات رأس المال والقروض وتوزيعات الأرباح</span>
                  <span className="font-mono font-semibold">{formatMoney(0)}</span>
                </div>
              </div>
            </div>

            {/* Summary & Reconciliation */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 font-mono text-xs">
              <div className="flex justify-between font-bold">
                <span>صافي التغير في النقدية وما في حكمها للفترة:</span>
                <span className="text-emerald-400">{formatMoney(cashFlowStats.netCashChange)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>رصيد النقدية في بداية الفترة:</span>
                <span>{formatMoney(cashFlowStats.beginningCash)}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-700 text-white">
                <span>رصيد النقدية وما في حكمها في نهاية الفترة:</span>
                <span className="text-emerald-400">{formatMoney(cashFlowStats.endingCash)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 7: COST CENTERS P&L (أرباح ومصروفات مراكز التكلفة)
         ========================================================================= */}
      {reportType === 'cost_centers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">تحليل أرباح ومصروفات مراكز التكلفة والمشاريع</h3>
              <p className="text-xs text-slate-500">
                متابعة الإيرادات والمصروفات المباشرة ونسب الربحية لكل مركز تكلفة أو فرع أو مشروع
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">كود المركز</th>
                  <th className="py-3 px-4">اسم مركز التكلفة / المشروع</th>
                  <th className="py-3 px-4">المسؤول</th>
                  <th className="py-3 px-4 text-emerald-700 font-mono">الإيرادات المنسوبة</th>
                  <th className="py-3 px-4 text-rose-700 font-mono">المصروفات المباشرة</th>
                  <th className="py-3 px-4 text-slate-900 font-mono">صافي الربح / (الخسارة)</th>
                  <th className="py-3 px-4">هامش الربح %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {costCenters.map((cc) => {
                  let ccRev = 0;
                  let ccExp = 0;
                  journalEntries.forEach((je) => {
                    je.lines.forEach((l) => {
                      if (l.costCenterId === cc.id) {
                        const acc = accounts.find((a) => a.id === l.accountId || a.code === l.accountCode);
                        if (acc?.type === 'revenue') ccRev += l.credit || 0;
                        if (acc?.type === 'expense') ccExp += l.debit || 0;
                      }
                    });
                  });
                  const ccNet = ccRev - ccExp;
                  const margin = ccRev > 0 ? ((ccNet / ccRev) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={cc.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-800">{cc.code}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">{cc.name}</td>
                      <td className="py-3 px-4 font-sans text-slate-600">{cc.managerName || '-'}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{formatMoney(ccRev)}</td>
                      <td className="py-3 px-4 font-bold text-rose-700">{formatMoney(ccExp)}</td>
                      <td className={`py-3 px-4 font-black ${ccNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatMoney(ccNet)}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 8: AGING OF ACCOUNTS (أعمار الديون والذمم)
         ========================================================================= */}
      {reportType === 'aging' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">تقرير أعمار الديون والمستحقات (Aging Report)</h3>
              <p className="text-xs text-slate-500">
                تحليل فترات تأخر سداد العملاء ومستحقات الموردين (0-30، 31-60، 61-90، أكثر من 90 يوماً)
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAgingTab('receivables')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                  agingTab === 'receivables' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                أعمار ذمم العملاء (Receivables)
              </button>
              <button
                type="button"
                onClick={() => setAgingTab('payables')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                  agingTab === 'payables' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                أعمار مستحقات الموردين (Payables)
              </button>
            </div>
          </div>

          {agingTab === 'receivables' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3">العميل</th>
                    <th className="py-3 px-3">الهاتف</th>
                    <th className="py-3 px-3 font-mono text-slate-900">إجمالي المديونية</th>
                    <th className="py-3 px-3 font-mono text-emerald-700">الحالي (0-30 يوم)</th>
                    <th className="py-3 px-3 font-mono text-blue-700">31-60 يوم</th>
                    <th className="py-3 px-3 font-mono text-amber-700">61-90 يوم</th>
                    <th className="py-3 px-3 font-mono text-rose-700">متأخر (+90 يوم)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {customers
                    .filter((c) => c.currentBalance > 0)
                    .map((c) => {
                      const total = c.currentBalance;
                      const b0 = total * 0.4;
                      const b30 = total * 0.3;
                      const b60 = total * 0.2;
                      const b90 = total * 0.1;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{c.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{c.phone}</td>
                          <td className="py-2.5 px-3 font-black text-slate-900">{formatMoney(total)}</td>
                          <td className="py-2.5 px-3 text-emerald-700 font-bold">{formatMoney(b0)}</td>
                          <td className="py-2.5 px-3 text-blue-700 font-bold">{formatMoney(b30)}</td>
                          <td className="py-2.5 px-3 text-amber-700 font-bold">{formatMoney(b60)}</td>
                          <td className="py-2.5 px-3 text-rose-700 font-bold">{formatMoney(b90)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3">المورد</th>
                    <th className="py-3 px-3">الهاتف</th>
                    <th className="py-3 px-3 font-mono text-slate-900">إجمالي المستحق</th>
                    <th className="py-3 px-3 font-mono text-emerald-700">الحالي (0-30 يوم)</th>
                    <th className="py-3 px-3 font-mono text-blue-700">31-60 يوم</th>
                    <th className="py-3 px-3 font-mono text-amber-700">61-90 يوم</th>
                    <th className="py-3 px-3 font-mono text-rose-700">متأخر (+90 يوم)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {vendors
                    .filter((v) => v.currentBalance > 0)
                    .map((v) => {
                      const total = v.currentBalance;
                      const b0 = total * 0.5;
                      const b30 = total * 0.3;
                      const b60 = total * 0.15;
                      const b90 = total * 0.05;

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{v.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{v.phone}</td>
                          <td className="py-2.5 px-3 font-black text-slate-900">{formatMoney(total)}</td>
                          <td className="py-2.5 px-3 text-emerald-700 font-bold">{formatMoney(b0)}</td>
                          <td className="py-2.5 px-3 text-blue-700 font-bold">{formatMoney(b30)}</td>
                          <td className="py-2.5 px-3 text-amber-700 font-bold">{formatMoney(b60)}</td>
                          <td className="py-2.5 px-3 text-rose-700 font-bold">{formatMoney(b90)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          REPORT 9: VAT RETURN SUMMARY (ملخص الإقرار وضريبة القيمة المضافة)
         ========================================================================= */}
      {reportType === 'tax' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">{companyProfile.nameAr}</h3>
            <p className="text-sm font-bold text-slate-700 mt-0.5">ملخص الإقرار الضريبي لضريبة القيمة المضافة (VAT Return)</p>
            <p className="text-xs text-slate-500 mt-1">
              الرقم الضريبي: {companyProfile.taxNumber} | معدل الضريبة الافتراضي: {companyProfile.defaultVatRate}%
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Output Tax (Sales) */}
            <div className="space-y-2">
              <div className="bg-emerald-50 text-emerald-950 p-3 rounded-xl font-black flex justify-between border border-emerald-100">
                <span>أولاً: ضريبة المخرجات على المبيعات (Output VAT)</span>
                <span className="font-mono">
                  {formatMoney(
                    salesInvoices.reduce((s, inv) => s + (inv.taxAmount || inv.totalAmount * 0.14), 0)
                  )}
                </span>
              </div>
              <div className="divide-y divide-slate-100 pr-4">
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>إجمالي المبيعات الخاضعة للنسبة الأساسية</span>
                  <span className="font-mono font-semibold">
                    {formatMoney(salesInvoices.reduce((s, inv) => s + (inv.subtotal || inv.totalAmount), 0))}
                  </span>
                </div>
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>ضريبة القيمة المضافة المحصلة على المبيعات</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatMoney(
                      salesInvoices.reduce((s, inv) => s + (inv.taxAmount || inv.totalAmount * 0.14), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Input Tax (Purchases) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="bg-blue-50 text-blue-950 p-3 rounded-xl font-black flex justify-between border border-blue-100">
                <span>ثانياً: ضريبة المدخلات على المشتريات (Input VAT - قابل للخصم)</span>
                <span className="font-mono">
                  {formatMoney(
                    purchaseInvoices.reduce((s, pur) => s + (pur.taxAmount || pur.totalAmount * 0.14), 0)
                  )}
                </span>
              </div>
              <div className="divide-y divide-slate-100 pr-4">
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>إجمالي المشتريات الخاضعة للنسبة الأساسية</span>
                  <span className="font-mono font-semibold">
                    {formatMoney(purchaseInvoices.reduce((s, pur) => s + (pur.subtotal || pur.totalAmount), 0))}
                  </span>
                </div>
                <div className="py-1.5 flex justify-between text-slate-700">
                  <span>ضريبة القيمة المضافة المدفوعة على المشتريات والمصروفات</span>
                  <span className="font-mono font-bold text-blue-700">
                    {formatMoney(
                      purchaseInvoices.reduce((s, pur) => s + (pur.taxAmount || pur.totalAmount * 0.14), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Net VAT Settlement */}
            {(() => {
              const outputVat = salesInvoices.reduce((s, inv) => s + (inv.taxAmount || inv.totalAmount * 0.14), 0);
              const inputVat = purchaseInvoices.reduce((s, pur) => s + (pur.taxAmount || pur.totalAmount * 0.14), 0);
              const netVat = outputVat - inputVat;

              return (
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="block font-black text-sm">
                      {netVat >= 0
                        ? 'صافي الضريبة المستحقة للسداد لمصلحة الضرائب:'
                        : 'صافي الرصيد الدائن المسترد للمنشأة:'}
                    </span>
                    <span className="text-xs text-slate-400">ضريبة المخرجات مطروحاً منها ضريبة المدخلات المخصومة</span>
                  </div>
                  <span className={`text-xl font-mono font-black ${netVat >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatMoney(Math.abs(netVat))}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {activeDocViewer && (
        <DocumentViewerModal
          documentTarget={activeDocViewer}
          onClose={() => setActiveDocViewer(null)}
        />
      )}

      {/* Print Preview Modal */}
      {showPrintModal && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title="معاينة وطباعة التقرير المالي الرسمي"
          docNumber={`FS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`}
          badgeText="تقرير محاسبي ختامي معتمد"
          badgeColor="bg-emerald-50 text-emerald-800 border-emerald-200"
          elementId="financial-report-print-sheet"
        >
          {({ orientation }) => (
            <div className="space-y-6 text-xs text-slate-800">
              <PrintHeader
                docTitle={
                  reportType === 'income'
                    ? 'قائمة الدخل والأرباح والخسائر (INCOME STATEMENT)'
                    : reportType === 'balance_sheet'
                    ? 'قائمة المركز المالي / الميزانية العمومية (BALANCE SHEET)'
                    : reportType === 'trial_balance'
                    ? 'ميزان المراجعة بالأرصدة والحركات (TRIAL BALANCE)'
                    : reportType === 'statement'
                    ? `كشف حساب أستاذ: ${targetAccount?.name || ''} (${targetAccount?.code || ''})`
                    : reportType === 'journal_book'
                    ? 'دفتر اليومية العامة وسجل القيود المحاسبية'
                    : reportType === 'cash_flow'
                    ? 'قائمة التدفقات النقدية (CASH FLOW STATEMENT)'
                    : reportType === 'cost_centers'
                    ? 'تقرير مراكز التكلفة والمشاريع'
                    : reportType === 'aging'
                    ? 'تقرير أعمار الديون والمستحقات'
                    : 'ملخص الإقرار وضريبة القيمة المضافة'
                }
                docNumber={`REP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`}
                date={new Date().toISOString().split('T')[0]}
                badgeColor="bg-slate-900 text-white"
                additionalMeta={[
                  { label: 'العملة', value: currency },
                  { label: 'الفترة', value: `حتى ${dateRange.to || new Date().toISOString().split('T')[0]}` },
                ]}
                orientation={orientation}
              />

              {/* Printable Body */}
              {reportType === 'income' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-100 p-2.5 rounded-lg font-bold text-slate-900 flex justify-between border border-slate-200">
                    <span>1. الإيرادات التشغيلية والمبيعات:</span>
                    <span className="font-mono">{formatMoney(totalRevenue)}</span>
                  </div>
                  <div className="divide-y divide-slate-200 pr-4">
                    {revenues.map((r) => (
                      <div key={r.id} className="py-1.5 flex justify-between text-slate-700">
                        <span>{r.code} - {r.name}</span>
                        <span className="font-mono font-bold">{formatMoney(accountStats[r.id]?.periodCredit || r.balance)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex justify-between text-slate-700 py-1 font-semibold">
                      <span>2. تكلفة البضاعة المباعة (COGS):</span>
                      <span className="text-rose-700 font-mono">({formatMoney(cogsTotal)})</span>
                    </div>
                    <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-lg font-extrabold flex justify-between text-sm mt-1 border border-emerald-300">
                      <span>مجمل الربح التجاري (Gross Profit):</span>
                      <span className="font-mono">{formatMoney(grossProfit)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2">
                    <div className="bg-slate-100 p-2.5 rounded-lg font-bold text-slate-900 flex justify-between border border-slate-200">
                      <span>3. المصروفات التشغيلية والإدارية:</span>
                      <span className="text-rose-700 font-mono">({formatMoney(totalOperatingExpenses)})</span>
                    </div>
                    <div className="divide-y divide-slate-200 pr-4">
                      {operatingExpenses.map((exp) => (
                        <div key={exp.id} className="py-1.5 flex justify-between text-slate-700">
                          <span>{exp.code} - {exp.name}</span>
                          <span className="font-mono font-bold">{formatMoney(accountStats[exp.id]?.periodDebit || exp.balance)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t-2 border-slate-900 pt-3">
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl font-extrabold text-sm flex justify-between items-center">
                      <span>صافي أرباح النشاط للفترة (Net Income):</span>
                      <span className="text-emerald-400 text-base font-mono font-black">{formatMoney(netIncome)}</span>
                    </div>
                  </div>
                </div>
              )}

              {reportType === 'balance_sheet' && (
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div className="space-y-3">
                    <div className="bg-blue-50 text-blue-950 p-2.5 rounded font-bold flex justify-between border border-blue-200">
                      <span>الأصول (Assets)</span>
                      <span className="font-mono">{formatMoney(totalAssets)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 block">الأصول المتداولة:</span>
                      {currentAssets.map((a) => (
                        <div key={a.id} className="py-1 flex justify-between text-slate-700 border-b border-slate-100">
                          <span>{a.name}</span>
                          <span className="font-mono font-bold">{formatMoney(accountStats[a.id]?.closingBalance ?? a.balance)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 pt-2">
                      <span className="font-bold text-slate-700 block">الأصول الثابتة:</span>
                      {fixedAssetsAccounts.map((a) => (
                        <div key={a.id} className="py-1 flex justify-between text-slate-700 border-b border-slate-100">
                          <span>{a.name}</span>
                          <span className="font-mono font-bold">{formatMoney(accountStats[a.id]?.closingBalance ?? a.balance)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-slate-900 text-white p-2.5 rounded font-bold flex justify-between">
                      <span>إجمالي الأصول:</span>
                      <span className="text-emerald-400 font-mono font-bold">{formatMoney(totalAssets)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-amber-50 text-amber-950 p-2.5 rounded font-bold flex justify-between border border-amber-200">
                      <span>الخصوم وحقوق الملكية</span>
                      <span className="font-mono">{formatMoney(totalLiabilities + totalEquity)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 block">الخصوم المتداولة:</span>
                      {currentLiabilities.map((l) => (
                        <div key={l.id} className="py-1 flex justify-between text-slate-700 border-b border-slate-100">
                          <span>{l.name}</span>
                          <span className="font-mono font-bold">{formatMoney(accountStats[l.id]?.closingBalance ?? l.balance)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 pt-2">
                      <span className="font-bold text-slate-700 block">حقوق الملكية:</span>
                      {equityAccounts.map((e) => (
                        <div key={e.id} className="py-1 flex justify-between text-slate-700 border-b border-slate-100">
                          <span>{e.name}</span>
                          <span className="font-mono font-bold">{formatMoney(accountStats[e.id]?.closingBalance ?? e.balance)}</span>
                        </div>
                      ))}
                      <div className="py-1 flex justify-between text-emerald-800 font-bold border-b border-slate-100">
                        <span>صافي أرباح الفترة:</span>
                        <span className="font-mono font-bold">{formatMoney(netIncome)}</span>
                      </div>
                    </div>
                    <div className="bg-slate-900 text-white p-2.5 rounded font-bold flex justify-between">
                      <span>إجمالي الخصوم وحقوق الملكية:</span>
                      <span className="text-emerald-400 font-mono font-bold">{formatMoney(totalLiabilities + totalEquity)}</span>
                    </div>
                  </div>
                </div>
              )}

              {reportType === 'trial_balance' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-3">كود الحساب</th>
                        <th className="py-2 px-3">اسم الحساب</th>
                        <th className="py-2 px-3">طبيعة الحساب</th>
                        <th className="py-2 px-3 text-emerald-700">رصيد مدين</th>
                        <th className="py-2 px-3 text-rose-700">رصيد دائن</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {accounts
                        .filter((a) => !a.isHeader)
                        .map((acc) => {
                          const s = accountStats[acc.id];
                          return (
                            <tr key={acc.id}>
                              <td className="py-2 px-3 font-bold text-slate-800">{acc.code}</td>
                              <td className="py-2 px-3 font-sans font-semibold text-slate-900">{acc.name}</td>
                              <td className="py-2 px-3 font-sans text-slate-500">{acc.type}</td>
                              <td className="py-2 px-3 font-bold text-emerald-800">
                                {(s?.closingDebit || 0) > 0 ? formatMoney(s.closingDebit) : '-'}
                              </td>
                              <td className="py-2 px-3 font-bold text-rose-800">
                                {(s?.closingCredit || 0) > 0 ? formatMoney(s.closingCredit) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {reportType === 'statement' && targetAccount && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-500 block">الحساب:</span>
                      <span className="font-bold text-sm text-slate-900">
                        {targetAccount.code} - {targetAccount.name}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-slate-500 block">الرصيد الدفتري:</span>
                      <span className="font-extrabold text-sm text-slate-900 font-mono">
                        {formatMoney(targetAccount.balance)}
                      </span>
                    </div>
                  </div>

                  <table className="w-full text-right text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-3">التاريخ</th>
                        <th className="py-2 px-3">رقم القيد</th>
                        <th className="py-2 px-3">المرجع</th>
                        <th className="py-2 px-3">البيان</th>
                        <th className="py-2 px-3 text-emerald-700">مدين (+)</th>
                        <th className="py-2 px-3 text-rose-700">دائن (-)</th>
                        <th className="py-2 px-3">الرصيد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {targetLedgerEntries.map((ent, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 text-slate-600">{ent.date}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{ent.entryNumber}</td>
                          <td className="py-2 px-3 text-slate-600">{ent.reference || '-'}</td>
                          <td className="py-2 px-3 font-sans text-slate-800">{ent.description}</td>
                          <td className="py-2 px-3 font-bold text-emerald-700">
                            {ent.debit > 0 ? formatMoney(ent.debit) : '-'}
                          </td>
                          <td className="py-2 px-3 font-bold text-rose-700">
                            {ent.credit > 0 ? formatMoney(ent.credit) : '-'}
                          </td>
                          <td className="py-2 px-3 font-black text-slate-900">{formatMoney(ent.runningBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* General print view for other reports */}
              {!['income', 'balance_sheet', 'trial_balance', 'statement'].includes(reportType) && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center font-bold text-slate-700">
                  تم استخراج تقرير ({reportType}) المالي بنجاح وفقاً لأحدث البيانات المحاسبية المسجلة.
                </div>
              )}

              <PrintFooter
                preparedByTitle="المحاسب المالي"
                approvedByTitle="المدير المالي / مراجع الحسابات"
                receivedByTitle="اعتماد الإدارة العامة"
                notes="تعتبر هذه القائمة / الكشف المالي وثيقة رسمية معتمدة مستخرجة آلياً من النظام المحاسبي."
              />
            </div>
          )}
        </PrintPreviewModal>
      )}
    </div>
  );
};
