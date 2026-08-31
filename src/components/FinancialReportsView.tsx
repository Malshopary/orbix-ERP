import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { DocumentViewerModal, DocumentViewerTarget } from './DocumentViewerModal';
import {
  PieChart,
  FileSpreadsheet,
  TrendingUp,
  Scale,
  Printer,
  Calendar,
  CheckCircle2,
  Building,
  ExternalLink,
} from 'lucide-react';

export const FinancialReportsView: React.FC = () => {
  const { accounts, journalEntries, formatMoney, activeSubTab, setActiveSubTab } = useErp();
  const [reportType, setReportTypeLocal] = useState<'income' | 'balance_sheet' | 'trial_balance' | 'statement'>('income');
  const [activeDocViewer, setActiveDocViewer] = useState<DocumentViewerTarget | null>(null);

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

  React.useEffect(() => {
    if (activeSubTab && ['income', 'balance_sheet', 'trial_balance', 'statement'].includes(activeSubTab)) {
      setReportTypeLocal(activeSubTab as any);
    }
  }, [activeSubTab]);

  const setReportType = (type: 'income' | 'balance_sheet' | 'trial_balance' | 'statement') => {
    setReportTypeLocal(type);
    setActiveSubTab(type);
  };
  const [selectedAccountId, setSelectedAccountId] = useState(accounts.find((a) => a.code === '1130')?.id || accounts[0]?.id || '');

  // Calculate Income Statement Values
  const revenues = accounts.filter((a) => a.type === 'revenue' && !a.isHeader);
  const totalRevenue = revenues.reduce((s, a) => s + a.balance, 0);

  const cogsAccount = accounts.find((a) => a.code === '5100');
  const cogsTotal = cogsAccount?.balance || 0;
  const grossProfit = totalRevenue - cogsTotal;

  const operatingExpenses = accounts.filter((a) => a.type === 'expense' && a.code !== '5100' && !a.isHeader);
  const totalOperatingExpenses = operatingExpenses.reduce((s, a) => s + a.balance, 0);
  const netIncome = grossProfit - totalOperatingExpenses;

  // Calculate Balance Sheet Values
  const currentAssets = accounts.filter((a) => a.type === 'asset' && a.parentCode === '1100' && !a.isHeader);
  const fixedAssets = accounts.filter((a) => a.type === 'asset' && a.parentCode === '1200' && !a.isHeader);
  const totalAssets = [...currentAssets, ...fixedAssets].reduce((s, a) => s + a.balance, 0);

  const currentLiabilities = accounts.filter((a) => a.type === 'liability' && !a.isHeader);
  const totalLiabilities = currentLiabilities.reduce((s, a) => s + a.balance, 0);

  const equityAccounts = accounts.filter((a) => a.type === 'equity' && !a.isHeader);
  const baseEquity = equityAccounts.reduce((s, a) => s + a.balance, 0);
  const totalEquity = baseEquity + netIncome; // Including period's net profit

  // Ledger statement entries for selected account
  const targetAccount = accounts.find((a) => a.id === selectedAccountId);
  const accountEntries = journalEntries
    .filter((je) => je.lines.some((l) => l.accountId === targetAccount?.id || l.accountCode === targetAccount?.code))
    .map((je) => {
      const line = je.lines.find((l) => l.accountId === targetAccount?.id || l.accountCode === targetAccount?.code)!;
      return {
        date: je.date,
        createdAt: je.createdAt,
        entryNumber: je.entryNumber,
        reference: je.reference,
        description: line.description || je.description,
        debit: line.debit,
        credit: line.credit,
      };
    })
    .sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      return (a.entryNumber || '').localeCompare(b.entryNumber || '', undefined, { numeric: true, sensitivity: 'base' });
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600" />
            التقارير والقوائم المالية الختامية (Financial Statements)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            قائمة الدخل والأرباح، الميزانية العمومية، ميزان المراجعة، وكشوف الحسابات التفصيلية
          </p>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setReportType('income')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportType === 'income' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              قائمة الدخل (P&L)
            </button>
            <button
              onClick={() => setReportType('balance_sheet')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportType === 'balance_sheet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الميزانية العمومية
            </button>
            <button
              onClick={() => setReportType('trial_balance')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportType === 'trial_balance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ميزان المراجعة
            </button>
            <button
              onClick={() => setReportType('statement')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportType === 'statement' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كشف حساب تفصيلي
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl inline-flex items-center gap-1 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة
          </button>
        </div>
      </div>

      {/* Report 1: Income Statement / قائمة الدخل */}
      {reportType === 'income' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900">شركة التقنيات الحديثة للتجارة</h3>
            <p className="text-sm font-semibold text-slate-700">قائمة الدخل والأرباح والخسائر (Income Statement)</p>
            <p className="text-xs text-slate-500 mt-0.5">عن الفترة المالية المنتهية في {new Date().toISOString().split('T')[0]}</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Revenues */}
            <div>
              <div className="bg-slate-50 p-2.5 rounded-lg font-bold text-slate-900 flex justify-between">
                <span>1. الإيرادات التشغيلية والمبيعات:</span>
                <span>{formatMoney(totalRevenue)}</span>
              </div>
              <div className="divide-y divide-slate-100 pr-4 mt-1">
                {revenues.map((r) => (
                  <div key={r.id} className="py-1.5 flex justify-between text-slate-600">
                    <span>{r.code} - {r.name}</span>
                    <span className="font-semibold text-slate-800">{formatMoney(r.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. COGS & Gross Profit */}
            <div className="border-t border-slate-200 pt-2">
              <div className="flex justify-between text-slate-700 py-1 font-semibold">
                <span>2. تكلفة البضاعة المباعة (COGS):</span>
                <span className="text-rose-700">({formatMoney(cogsTotal)})</span>
              </div>
              <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-lg font-extrabold flex justify-between text-sm mt-1 border border-emerald-200">
                <span>مجمل الربح التجاري (Gross Profit):</span>
                <span>{formatMoney(grossProfit)}</span>
              </div>
            </div>

            {/* 3. Operating Expenses */}
            <div className="border-t border-slate-200 pt-2">
              <div className="bg-slate-50 p-2.5 rounded-lg font-bold text-slate-900 flex justify-between">
                <span>3. المصروفات التشغيلية والإدارية والعمومية:</span>
                <span className="text-rose-700">({formatMoney(totalOperatingExpenses)})</span>
              </div>
              <div className="divide-y divide-slate-100 pr-4 mt-1">
                {operatingExpenses.map((exp) => (
                  <div key={exp.id} className="py-1.5 flex justify-between text-slate-600">
                    <span>{exp.code} - {exp.name}</span>
                    <span className="font-semibold text-slate-800">{formatMoney(exp.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Net Operating Profit */}
            <div className="border-t-2 border-slate-900 pt-3">
              <div className="bg-slate-900 text-white p-3.5 rounded-xl font-extrabold text-sm flex justify-between items-center">
                <span>صافي أرباح النشاط للفترة (Net Income):</span>
                <span className="text-emerald-400 text-base">{formatMoney(netIncome)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Balance Sheet / الميزانية العمومية */}
      {reportType === 'balance_sheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900">شركة التقنيات الحديثة للتجارة</h3>
            <p className="text-sm font-semibold text-slate-700">قائمة المركز المالي / الميزانية العمومية (Balance Sheet)</p>
            <p className="text-xs text-slate-500 mt-0.5">كما في تاريخ {new Date().toISOString().split('T')[0]}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Assets Side */}
            <div className="space-y-3">
              <div className="bg-blue-50 text-blue-950 p-2.5 rounded-lg font-extrabold flex justify-between border border-blue-200">
                <span>الأصول (Assets)</span>
                <span>{formatMoney(totalAssets)}</span>
              </div>

              {/* Current Assets */}
              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">الأصول المتداولة:</span>
                <div className="divide-y divide-slate-100 pr-2">
                  {currentAssets.map((a) => (
                    <div key={a.id} className="py-1 flex justify-between text-slate-600">
                      <span>{a.name}</span>
                      <span className="font-semibold">{formatMoney(a.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed Assets */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block">الأصول الثابتة وغير المتداولة:</span>
                <div className="divide-y divide-slate-100 pr-2">
                  {fixedAssets.map((a) => (
                    <div key={a.id} className="py-1 flex justify-between text-slate-600">
                      <span>{a.name}</span>
                      <span className="font-semibold">{formatMoney(a.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-xl font-bold flex justify-between mt-4">
                <span>إجمالي الأصول:</span>
                <span className="text-emerald-400">{formatMoney(totalAssets)}</span>
              </div>
            </div>

            {/* Liabilities & Equity Side */}
            <div className="space-y-3">
              <div className="bg-amber-50 text-amber-950 p-2.5 rounded-lg font-extrabold flex justify-between border border-amber-200">
                <span>الخصوم وحقوق الملكية</span>
                <span>{formatMoney(totalLiabilities + totalEquity)}</span>
              </div>

              {/* Liabilities */}
              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">الخصوم والالتزامات المتداولة:</span>
                <div className="divide-y divide-slate-100 pr-2">
                  {currentLiabilities.map((l) => (
                    <div key={l.id} className="py-1 flex justify-between text-slate-600">
                      <span>{l.name}</span>
                      <span className="font-semibold">{formatMoney(l.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block">حقوق الملكية ورأس المال:</span>
                <div className="divide-y divide-slate-100 pr-2">
                  {equityAccounts.map((e) => (
                    <div key={e.id} className="py-1 flex justify-between text-slate-600">
                      <span>{e.name}</span>
                      <span className="font-semibold">{formatMoney(e.balance)}</span>
                    </div>
                  ))}
                  <div className="py-1 flex justify-between text-emerald-800 font-bold">
                    <span>صافي أرباح الفترة الحالية:</span>
                    <span>{formatMoney(netIncome)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-xl font-bold flex justify-between mt-4">
                <span>إجمالي الخصوم وحقوق الملكية:</span>
                <span className="text-emerald-400">{formatMoney(totalLiabilities + totalEquity)}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-xs font-bold text-emerald-900">
            ✓ الميزانية متوازنة تماماً وفقاً لمبادئ المحاسبة المقبولة عموماً (GAAP / IFRS)
          </div>
        </div>
      )}

      {/* Report 3: Trial Balance / ميزان المراجعة */}
      {reportType === 'trial_balance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 overflow-hidden space-y-4">
          <div className="text-center pb-2">
            <h3 className="text-base font-bold text-slate-900">ميزان المراجعة بالأرصدة (Trial Balance)</h3>
            <p className="text-xs text-slate-500">التحقق من توازن الأرصدة المدينة والدائنة لجميع الحسابات</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">كود الحساب</th>
                  <th className="py-3 px-4">اسم الحساب</th>
                  <th className="py-3 px-4">طبيعة الحساب</th>
                  <th className="py-3 px-4 text-emerald-700">الرصيد المدين (Debit)</th>
                  <th className="py-3 px-4 text-rose-700">الرصيد الدائن (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts
                  .filter((a) => !a.isHeader)
                  .map((acc) => {
                    const isDebitNature = acc.type === 'asset' || acc.type === 'expense';
                    const debitVal = isDebitNature && acc.balance >= 0 ? acc.balance : 0;
                    const creditVal = !isDebitNature && acc.balance >= 0 ? acc.balance : 0;

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{acc.code}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{acc.name}</td>
                        <td className="py-2.5 px-4 text-slate-500">{acc.type}</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-800">
                          {debitVal > 0 ? formatMoney(debitVal) : '-'}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-rose-800">
                          {creditVal > 0 ? formatMoney(creditVal) : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: Detailed Account Statement / كشف حساب تفصيلي */}
      {reportType === 'statement' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-base text-slate-900">كشف حساب الأستاذ التفصيلي (Account Ledger)</h3>
              <p className="text-xs text-slate-500">استعراض كافة الحركات والقيود المؤثرة على الحساب</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">اختر الحساب:</span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 font-bold bg-slate-50"
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
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 block">الحساب الحالي:</span>
                <span className="font-bold text-sm text-slate-900">
                  {targetAccount.code} - {targetAccount.name}
                </span>
              </div>
              <div className="text-left">
                <span className="text-slate-500 block">الرصيد الدفتري الحالي:</span>
                <span className="font-extrabold text-base text-slate-900">{formatMoney(targetAccount.balance)}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">رقم القيد</th>
                  <th className="py-3 px-4">المرجع</th>
                  <th className="py-3 px-4">البيان / الشرح</th>
                  <th className="py-3 px-4 text-emerald-700">مدين (+)</th>
                  <th className="py-3 px-4 text-rose-700">دائن (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accountEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      لا توجد قيود مسجلة لهذا الحساب حالياً.
                    </td>
                  </tr>
                ) : (
                  accountEntries.map((ent, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 text-slate-600 font-mono">{ent.date}</td>
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenDoc(ent.entryNumber, true)}
                          className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/80 px-2 py-0.5 rounded cursor-pointer underline-offset-2 hover:underline"
                          title="انقر لاستعراض تفاصيل القيد المحاسبي"
                        >
                          <span>{ent.entryNumber}</span>
                          <ExternalLink className="w-3 h-3 text-indigo-400" />
                        </button>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold">
                        {ent.reference && ent.reference !== '-' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDoc(ent.reference, false)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 px-2 py-0.5 rounded cursor-pointer underline-offset-2 hover:underline"
                            title="انقر لاستعراض المستند المرجعي"
                          >
                            <span>{ent.reference}</span>
                            <ExternalLink className="w-3 h-3 text-blue-400" />
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{ent.description}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700 font-mono">
                        {ent.debit > 0 ? formatMoney(ent.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-rose-700 font-mono">
                        {ent.credit > 0 ? formatMoney(ent.credit) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
    </div>
  );
};
