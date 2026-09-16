import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  Clock,
  Award,
  CreditCard,
  Printer,
  PieChart,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { PrintHeader } from '../PrintHeader';
import { PrintFooter } from '../PrintFooter';

export const HrReportsTab: React.FC = () => {
  const {
    employees,
    payrollRuns,
    attendances,
    leaveRequests,
    employeeLoans,
    employeeAdjustments,
    employeeCustodies,
    formatMoney,
    companyProfile,
  } = useErp();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [showPrintReport, setShowPrintReport] = useState<boolean>(false);

  // Unique departments list
  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  // Filtered employees by department
  const filteredEmployees = useMemo(() => {
    if (selectedDept === 'all') return employees;
    return employees.filter((e) => e.department === selectedDept);
  }, [employees, selectedDept]);

  // Department payroll breakdown
  const departmentStats = useMemo(() => {
    const map: Record<
      string,
      { count: number; basic: number; allowances: number; gross: number }
    > = {};

    filteredEmployees.forEach((emp) => {
      const dept = emp.department || 'عام / غير محدد';
      if (!map[dept]) {
        map[dept] = { count: 0, basic: 0, allowances: 0, gross: 0 };
      }
      map[dept].count += 1;
      map[dept].basic += emp.basicSalary;
      const allw = emp.housingAllowance + emp.transportAllowance + emp.otherAllowances;
      map[dept].allowances += allw;
      map[dept].gross += emp.basicSalary + allw;
    });

    return Object.entries(map).map(([dept, data]) => ({
      dept,
      ...data,
    }));
  }, [filteredEmployees]);

  // Overall Company Payroll Total
  const totalMonthlyGross = useMemo(() => {
    return filteredEmployees.reduce(
      (acc, e) =>
        acc + e.basicSalary + e.housingAllowance + e.transportAllowance + e.otherAllowances,
      0
    );
  }, [filteredEmployees]);

  // Attendance metrics
  const attendanceKPI = useMemo(() => {
    const totalRecords = attendances.length || 1;
    const presentCount = attendances.filter((a) => a.status === 'present').length;
    const lateCount = attendances.filter((a) => a.status === 'late').length;
    const absentCount = attendances.filter((a) => a.status === 'absent').length;

    const presentRate = Math.round((presentCount / totalRecords) * 100);
    const lateRate = Math.round((lateCount / totalRecords) * 100);
    const absentRate = Math.round((absentCount / totalRecords) * 100);

    const totalOvertimeHours = attendances.reduce((acc, a) => acc + (a.overtimeHours || 0), 0);

    return {
      totalRecords: attendances.length,
      presentCount,
      presentRate,
      lateCount,
      lateRate,
      absentCount,
      absentRate,
      totalOvertimeHours,
    };
  }, [attendances]);

  // Financial summary of loans and adjustments
  const financialMetrics = useMemo(() => {
    const totalLoansGranted = employeeLoans.reduce((acc, l) => acc + l.totalAmount, 0);
    const totalLoansPaid = employeeLoans.reduce((acc, l) => acc + (l.paidAmount || 0), 0);
    const totalLoansRemaining = employeeLoans.reduce(
      (acc, l) => (l.status === 'active' ? acc + (l.remainingAmount || 0) : acc),
      0
    );

    const totalBonuses = employeeAdjustments
      .filter((a) => a.type === 'bonus' || a.type === 'reward')
      .reduce((acc, a) => acc + a.amount, 0);

    const totalPenalties = employeeAdjustments
      .filter((a) => a.type === 'penalty' || a.type === 'deduction')
      .reduce((acc, a) => acc + a.amount, 0);

    return {
      totalLoansGranted,
      totalLoansPaid,
      totalLoansRemaining,
      totalBonuses,
      totalPenalties,
    };
  }, [employeeLoans, employeeAdjustments]);

  return (
    <div className="space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">تقارير وتحليلات الموارد البشرية (HR Analytics)</h3>
            <p className="text-xs text-slate-500">
              مؤشرات الأداء الرئيسية، تكلفة الرواتب الشهرية حسب الأقسام ونسب الانضباط والالتزام
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">القسم:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 font-sans"
            >
              <option value="all">كافة الأقسام ({departments.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowPrintReport(true)}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة التقرير الشامل
          </button>
        </div>
      </div>

      {/* Top KPIs Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>إجمالي الكادر البشري</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {filteredEmployees.length} موظف
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">في {departments.length} أقسام وإدارات</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>الكتلة الشهرية للرواتب</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 privacy-blur">
            {formatMoney(totalMonthlyGross)}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">أساسي + بدلات شهرية</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>معدل الانضباط والالتزام</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600 mt-1 font-mono">
            {attendanceKPI.totalRecords > 0 ? `${attendanceKPI.presentRate}%` : '100%'}
          </div>
          <div className="text-[10px] text-teal-700/80 mt-0.5">نسبة الحضور في الموعد</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>السلف القائمة للتحصيل</span>
            <CreditCard className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1 privacy-blur">
            {formatMoney(financialMetrics.totalLoansRemaining)}
          </div>
          <div className="text-[10px] text-purple-700/80 mt-0.5">متبقي بذمة الموظفين</div>
        </div>
      </div>

      {/* Grid: Department Distribution + Attendance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Distribution Table & Bars */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              توزيع تكلفة الرواتب حسب الأقسام
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              إجمالي {departmentStats.length} قسم
            </span>
          </div>

          <div className="space-y-3">
            {departmentStats.map((item) => {
              const sharePercent = totalMonthlyGross > 0
                ? Math.round((item.gross / totalMonthlyGross) * 100)
                : 0;

              return (
                <div key={item.dept} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {item.dept} ({item.count} موظف)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 privacy-blur">
                        {formatMoney(item.gross)}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">({sharePercent}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-indigo-600 to-blue-500 rounded-full"
                      style={{ width: `${sharePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attendance & Punctuality KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              مؤشرات الحضور والانضباط وساعات العمل
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              {attendances.length} سجل حركة
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <span className="text-emerald-800 font-bold block">حضور نظامي</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                {attendanceKPI.presentCount}
              </span>
              <span className="text-[10px] text-emerald-700 font-mono">
                {attendanceKPI.presentRate}% من الإجمالي
              </span>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
              <span className="text-amber-800 font-bold block">تأخيرات</span>
              <span className="text-xl font-black text-amber-700 mt-1 block">
                {attendanceKPI.lateCount}
              </span>
              <span className="text-[10px] text-amber-700 font-mono">
                {attendanceKPI.lateRate}% من الإجمالي
              </span>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
              <span className="text-rose-800 font-bold block">غياب</span>
              <span className="text-xl font-black text-rose-700 mt-1 block">
                {attendanceKPI.absentCount}
              </span>
              <span className="text-[10px] text-rose-700 font-mono">
                {attendanceKPI.absentRate}% من الإجمالي
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">إجمالي ساعات العمل الإضافي المعتمدة:</span>
            <span className="font-mono font-black text-blue-700 text-sm">
              +{attendanceKPI.totalOvertimeHours.toFixed(1)} ساعة عمل
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">إجمالي العهد المسلمة في ذمة الموظفين:</span>
            <span className="font-mono font-bold text-slate-800">
              {employeeCustodies.filter((c) => c.status === 'delivered').length} عهدة قائمة
            </span>
          </div>
        </div>
      </div>

      {/* Printable Report Modal */}
      {showPrintReport && (
        <PrintPreviewModal
          isOpen={showPrintReport}
          onClose={() => setShowPrintReport(false)}
          title="التقرير التنفيذي الشامل للموارد البشرية والرواتب"
        >
          <div className="p-8 bg-white text-slate-900 space-y-6 print:p-0">
            <PrintHeader title="التقرير التنفيذي الشامل للموارد البشرية والرواتب" />

            <div className="grid grid-cols-4 gap-4 border border-slate-200 rounded-xl p-4 text-xs bg-slate-50/50">
              <div>
                <span className="text-slate-500 block">إجمالي الموظفين:</span>
                <span className="font-bold text-slate-900 text-sm">{filteredEmployees.length}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الكتلة الشهرية للرواتب:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatMoney(totalMonthlyGross)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">نسبة الالتزام والانضباط:</span>
                <span className="font-bold text-teal-700 text-sm">{attendanceKPI.presentRate}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">تاريخ إصدار التقرير:</span>
                <span className="font-mono text-slate-700">
                  {new Date().toISOString().split('T')[0]}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs text-slate-800 mb-2">
                بيان تفصيلي برواتب وأجور الأقسام الإدارية:
              </h4>
              <table className="w-full text-right text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">القسم / الإدارة</th>
                    <th className="py-2.5 px-3">عدد الموظفين</th>
                    <th className="py-2.5 px-3">الرواتب الأساسية</th>
                    <th className="py-2.5 px-3">إجمالي البدلات والمزايا</th>
                    <th className="py-2.5 px-3">إجمالي الراتب (Gross)</th>
                    <th className="py-2.5 px-3">النسبة من إجمالي الشركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentStats.map((item) => {
                    const share = totalMonthlyGross > 0
                      ? Math.round((item.gross / totalMonthlyGross) * 100)
                      : 0;

                    return (
                      <tr key={item.dept}>
                        <td className="py-2 px-3 font-bold">{item.dept}</td>
                        <td className="py-2 px-3 font-mono">{item.count}</td>
                        <td className="py-2 px-3 font-mono">{formatMoney(item.basic)}</td>
                        <td className="py-2 px-3 font-mono">{formatMoney(item.allowances)}</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                          {formatMoney(item.gross)}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold">{share}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 mb-1">موقف السلف والقروض المالية:</div>
                <div className="flex justify-between">
                  <span>إجمالي السلف الممنوحة:</span>
                  <span className="font-bold">{formatMoney(financialMetrics.totalLoansGranted)}</span>
                </div>
                <div className="flex justify-between">
                  <span>المسدد والمستقطع حتى تاريخه:</span>
                  <span className="font-bold text-emerald-700">
                    {formatMoney(financialMetrics.totalLoansPaid)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span>الرصيد المتبقي بذمة الموظفين:</span>
                  <span className="font-bold text-amber-700">
                    {formatMoney(financialMetrics.totalLoansRemaining)}
                  </span>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 mb-1">موقف المكافآت والجزاءات السنوية:</div>
                <div className="flex justify-between">
                  <span>إجمالي المكافآت والإضافي (+):</span>
                  <span className="font-bold text-emerald-700">
                    +{formatMoney(financialMetrics.totalBonuses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي الجزاءات والخصومات (-):</span>
                  <span className="font-bold text-rose-700">
                    -{formatMoney(financialMetrics.totalPenalties)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span>صافي أثر التعديلات:</span>
                  <span className="font-bold text-slate-900">
                    {formatMoney(financialMetrics.totalBonuses - financialMetrics.totalPenalties)}
                  </span>
                </div>
              </div>
            </div>

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
