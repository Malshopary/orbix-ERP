import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { EmployeeLoan, LoanInstallment } from '../../types';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Coins,
  Calendar,
  Eye,
  Filter,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const HrLoansTab: React.FC = () => {
  const {
    employees,
    employeeLoans,
    addEmployeeLoan,
    deleteEmployeeLoan,
    recordLoanInstallmentPayment,
    formatMoney,
    showAlert,
    showConfirm,
  } = useErp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEmpId, setFilterEmpId] = useState<string>('all');

  // Modal State for New Loan
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [formEmpId, setFormEmpId] = useState<string>('');
  const [formAmount, setFormAmount] = useState<number>(5000);
  const [formInstallmentsCount, setFormInstallmentsCount] = useState<number>(5);
  const [formMonthlyDeduction, setFormMonthlyDeduction] = useState<number>(1000);
  const [formStartDate, setFormStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formReason, setFormReason] = useState<string>('');

  // Modal State for viewing Loan Details & Installments Schedule
  const [viewingLoan, setViewingLoan] = useState<EmployeeLoan | null>(null);

  // Auto-calculate monthly deduction when amount or count changes
  const handleAmountChange = (val: number) => {
    setFormAmount(val);
    if (formInstallmentsCount > 0) {
      setFormMonthlyDeduction(Math.round(val / formInstallmentsCount));
    }
  };

  const handleCountChange = (val: number) => {
    setFormInstallmentsCount(val);
    if (val > 0) {
      setFormMonthlyDeduction(Math.round(formAmount / val));
    }
  };

  // Filtered loans list
  const filteredList = useMemo(() => {
    return employeeLoans.filter((loan) => {
      if (filterStatus !== 'all' && loan.status !== filterStatus) return false;
      if (filterEmpId !== 'all' && loan.employeeId !== filterEmpId) return false;
      return true;
    });
  }, [employeeLoans, filterStatus, filterEmpId]);

  // Overall stats
  const stats = useMemo(() => {
    const totalGranted = employeeLoans.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalPaid = employeeLoans.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    const totalRemaining = employeeLoans.reduce(
      (acc, curr) => (curr.status === 'active' ? acc + (curr.remainingAmount || 0) : acc),
      0
    );
    const activeCount = employeeLoans.filter((l) => l.status === 'active').length;

    return {
      totalGranted,
      totalPaid,
      totalRemaining,
      activeCount,
    };
  }, [employeeLoans]);

  const handleOpenAdd = () => {
    setFormEmpId(employees[0]?.id || '');
    setFormAmount(5000);
    setFormInstallmentsCount(5);
    setFormMonthlyDeduction(1000);
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormReason('سلفة شخصية طارئة');
    setIsNewModalOpen(true);
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) {
      showAlert({
        title: 'تنبيه',
        message: 'يرجى اختيار الموظف أولاً.',
        type: 'warning',
        confirmText: 'حسناً',
      });
      return;
    }

    if (formAmount <= 0 || formInstallmentsCount <= 0 || formMonthlyDeduction <= 0) {
      showAlert({
        title: 'قيمة غير صالحة',
        message: 'يرجى إدخال مبالغ وأقساط موجبة أكبر من الصفر.',
        type: 'error',
        confirmText: 'تصحيح',
      });
      return;
    }

    addEmployeeLoan({
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.name,
      totalAmount: Number(formAmount),
      monthlyInstallment: Number(formMonthlyDeduction),
      termMonths: Number(formInstallmentsCount),
      startDate: formStartDate,
      reason: formReason,
      status: 'active',
    });

    showAlert({
      title: 'تم إصدار وجدولة السلفة',
      message: `تم اعتماد سلفة الموظف ${emp.name} بمبلغ ${formatMoney(formAmount)} مجدولة على ${formInstallmentsCount} أقساط شهرية، وسيتم استقطاعها تلقائياً من مسير الرواتب.`,
      type: 'success',
      confirmText: 'حسناً',
    });

    setIsNewModalOpen(false);
  };

  const handlePayInstallmentManually = (loanId: string, instNum: number) => {
    showConfirm(
      `هل تريد بالتأكيد تسجيل سداد القسط رقم (${instNum}) يدوياً خارج مسير الرواتب؟`,
      () => {
        recordLoanInstallmentPayment(loanId, instNum);
        showAlert({
          title: 'تم سداد القسط',
          message: 'تم تسجيل سداد القسط بنجاح وتحديث رصيد السلفة.',
          type: 'success',
          confirmText: 'حسناً',
        });
        // Update viewing modal state if open
        const updated = employeeLoans.find((l) => l.id === loanId);
        if (updated) setViewingLoan(updated);
      },
      'تأكيد سداد القسط',
      { confirmText: 'تسجيل السداد', type: 'info' }
    );
  };

  const handleDeleteLoan = (loan: EmployeeLoan) => {
    showConfirm(
      `هل أنت متأكد من حذف سلفة الموظف "${loan.employeeName}" برقم (${loan.loanNumber})؟`,
      () => {
        deleteEmployeeLoan(loan.id);
        if (viewingLoan?.id === loan.id) setViewingLoan(null);
      },
      'تأكيد حذف السلفة',
      { confirmText: 'حذف نهائياً', type: 'error' }
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">إدارة السلف والقروض وجدولة الأقساط</h3>
            <p className="text-xs text-slate-500">
              صرف السلف الشخصية للموظفين، وجدولتها وخصم أقساطها الشهرية تلقائياً من مسير الرواتب
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          صرف سلفة / قرض جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>إجمالي السلف المصروفة</span>
            <Coins className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 privacy-blur">
            {formatMoney(stats.totalGranted)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">القيمة الإجمالية الأصلية</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>إجمالي الأقساط المحصلة</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1 privacy-blur">
            {formatMoney(stats.totalPaid)}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">تم استقطاعها وسدادها</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>الرصيد المتبقي للتحصيل</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1 privacy-blur">
            {formatMoney(stats.totalRemaining)}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">متبقي قيد الاستقطاع الشهري</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>السلف النشطة الحالية</span>
            <CreditCard className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats.activeCount}</div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">سلف قيد السداد</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">حالة السلفة:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">كافة الحالات</option>
            <option value="active">نشطة (قيد السداد)</option>
            <option value="completed">مسددة بالكامل</option>
            <option value="cancelled">ملغاة</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">الموظف:</span>
          <select
            value={filterEmpId}
            onChange={(e) => setFilterEmpId(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">جميع الموظفين</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>

        {(filterStatus !== 'all' || filterEmpId !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setFilterStatus('all');
              setFilterEmpId('all');
            }}
            className="text-slate-500 hover:text-slate-800 underline mr-auto"
          >
            إعادة تعيين الفلاتر
          </button>
        )}
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">لا توجد سلف أو قروض مسجلة</h4>
            <p className="text-xs text-slate-400">
              يمكنك إنشاء سلفة جديدة وجدولتها عبر الزر بالأعلى.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">رقم السلفة</th>
                  <th className="py-3 px-4">الموظف</th>
                  <th className="py-3 px-4">قيمة السلفة</th>
                  <th className="py-3 px-4">القسط الشهري</th>
                  <th className="py-3 px-4">مدة السلفة</th>
                  <th className="py-3 px-4">المدفوع</th>
                  <th className="py-3 px-4">المتبقي</th>
                  <th className="py-3 px-4">نسبة السداد</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((loan) => {
                  const percentPaid = Math.min(
                    100,
                    Math.round(((loan.paidAmount || 0) / (loan.totalAmount || 1)) * 100)
                  );

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-700">
                        {loan.loanNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{loan.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{loan.employeeCode}</div>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 privacy-blur">
                        {formatMoney(loan.totalAmount)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 privacy-blur">
                        {formatMoney(loan.monthlyInstallment)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {loan.termMonths} شهر
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700 privacy-blur">
                        {formatMoney(loan.paidAmount)}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700 privacy-blur">
                        {formatMoney(loan.remainingAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                            <span>{percentPaid}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {loan.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            قيد السداد
                          </span>
                        ) : loan.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            مسددة بالكامل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                            ملغاة
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingLoan(loan)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 text-[11px] inline-flex items-center gap-1"
                            title="جدول الأقساط"
                          >
                            <Eye className="w-3 h-3" />
                            الأقساط
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLoan(loan)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Loan Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                صرف سلفة جديدة وجدولتها
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLoan} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">الموظف *</label>
                  <select
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode} - راتب: {formatMoney(emp.basicSalary)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">مبلغ السلفة الإجمالي *</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={formAmount}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">عدد الأقساط الشهرية *</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formInstallmentsCount}
                    onChange={(e) => handleCountChange(Number(e.target.value))}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">قيمة القسط الشهري المستقطع</label>
                  <input
                    type="number"
                    value={formMonthlyDeduction}
                    onChange={(e) => setFormMonthlyDeduction(Number(e.target.value))}
                    required
                    className="w-full p-2 rounded-xl border border-purple-200 bg-purple-50 font-mono font-extrabold text-purple-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ بداية السداد *</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">سبب ومبرر السلفة</label>
                  <input
                    type="text"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="سلفة طارئة، ظروف عائلية..."
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span>إجمالي القيمة:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatMoney(formAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>الاستقطاع الشهري التلقائي:</span>
                  <span className="font-bold text-purple-700 font-mono">{formatMoney(formMonthlyDeduction)} / شهر</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-xs"
                >
                  صرف وجدولة السلفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Installments Schedule Modal */}
      {viewingLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  جدول أقساط سلفة: {viewingLoan.loanNumber} ({viewingLoan.employeeName})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  الإجمالي: {formatMoney(viewingLoan.totalAmount)} | المسدد: {formatMoney(viewingLoan.paidAmount)} | المتبقي: {formatMoney(viewingLoan.remainingAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingLoan(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[65vh] overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">رقم القسط</th>
                    <th className="py-2.5 px-3">استحقاق الشهر</th>
                    <th className="py-2.5 px-3">مبلغ القسط</th>
                    <th className="py-2.5 px-3">حالة القسط</th>
                    <th className="py-2.5 px-3">تاريخ السداد</th>
                    <th className="py-2.5 px-3 text-center">إجراء سداد يدوي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingLoan.installments?.map((inst) => (
                    <tr key={inst.installmentNumber} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        #{inst.installmentNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold">
                        شهر {inst.month} / {inst.year}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-mono privacy-blur">
                        {formatMoney(inst.amount)}
                      </td>
                      <td className="py-2.5 px-3">
                        {inst.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            تم السداد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            مستحق
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                        {inst.paidDate ? inst.paidDate.split('T')[0] : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {!inst.isPaid ? (
                          <button
                            type="button"
                            onClick={() =>
                              handlePayInstallmentManually(viewingLoan.id, inst.installmentNumber)
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 text-[10px]"
                          >
                            سداد القسط الآن
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">تم الاستقطاع ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingLoan(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

