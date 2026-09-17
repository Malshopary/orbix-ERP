import React, { useState, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { Employee, PayrollRun, Payslip } from '../types';
import { CreatableCombobox } from './CreatableCombobox';
import { PrintPreviewModal } from './PrintPreviewModal';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { QuickAddModal } from './QuickAddModal';
import {
  BadgeDollarSign,
  PlusCircle,
  Users,
  FileCheck,
  Printer,
  Calendar,
  DollarSign,
  Building,
  CheckCircle,
  X,
  CreditCard,
  Edit3,
  Trash2,
  Camera,
  Upload,
  User,
  Briefcase,
  Layers,
  Sparkles,
  Banknote,
  Building2,
  Landmark,
  Wallet,
} from 'lucide-react';
import { HrAttendanceTab } from './hr/HrAttendanceTab';
import { HrLeavesTab } from './hr/HrLeavesTab';
import { HrLoansTab } from './hr/HrLoansTab';
import { HrAdjustmentsTab } from './hr/HrAdjustmentsTab';
import { HrCustodiesTab } from './hr/HrCustodiesTab';
import { HrContractsTab } from './hr/HrContractsTab';
import { HrReportsTab } from './hr/HrReportsTab';

export type HrSubTab =
  | 'payroll'
  | 'employees'
  | 'attendance'
  | 'leaves'
  | 'loans'
  | 'adjustments'
  | 'custodies'
  | 'contracts_docs'
  | 'hr_reports';

export const HrPayrollView: React.FC = () => {
  const {
    employees,
    attendances,
    leaveRequests,
    employeeLoans,
    employeeAdjustments,
    employeeCustodies,
    employeeDocuments,
    salesReps,
    payrollRuns,
    jobTitles,
    departments,
    accounts,
    addJobTitle,
    addDepartment,
    formatMoney,
    canDeleteEntity,
    addEmployee,
    editEmployee,
    deleteEmployee,
    generateMonthlyPayroll,
    approvePayrollRun,
    deletePayrollRun,
    updatePayslip,
    updatePayslipPaymentMethod,
    hasPermission,
    activeSubTab,
    setActiveSubTab,
    showAlert,
    showConfirm,
    companyProfile,
    currency,
  } = useErp();

  const [activeTab, setActiveTabLocal] = useState<HrSubTab>('payroll');

  React.useEffect(() => {
    if (
      activeSubTab &&
      [
        'payroll',
        'employees',
        'attendance',
        'leaves',
        'loans',
        'adjustments',
        'custodies',
        'contracts_docs',
        'hr_reports',
      ].includes(activeSubTab)
    ) {
      setActiveTabLocal(activeSubTab as HrSubTab);
    }
  }, [activeSubTab]);

  const setActiveTab = (tab: HrSubTab) => {
    setActiveTabLocal(tab);
    setActiveSubTab(tab);
  };
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modals
  const [showQuickAddEmployee, setShowQuickAddEmployee] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showEditPayslipModal, setShowEditPayslipModal] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null);

  // Edit Payslip Form State
  const [slipBasicSalary, setSlipBasicSalary] = useState(0);
  const [slipHousingAllowance, setSlipHousingAllowance] = useState(0);
  const [slipTransportAllowance, setSlipTransportAllowance] = useState(0);
  const [slipOtherAllowances, setSlipOtherAllowances] = useState(0);
  const [slipBonus, setSlipBonus] = useState(0);
  const [slipOvertimeAmount, setSlipOvertimeAmount] = useState(0);
  const [slipSocialInsurance, setSlipSocialInsurance] = useState(0);
  const [slipTaxDeduction, setSlipTaxDeduction] = useState(0);
  const [slipOtherDeductions, setSlipOtherDeductions] = useState(0);

  // Edit Employee Form State
  const [editEmpId, setEditEmpId] = useState('');
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpJobTitle, setEditEmpJobTitle] = useState('');
  const [editEmpDepartment, setEditEmpDepartment] = useState('');
  const [editEmpHireDate, setEditEmpHireDate] = useState('');
  const [editEmpPhone, setEditEmpPhone] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpNationalId, setEditEmpNationalId] = useState('');
  const [editEmpBankName, setEditEmpBankName] = useState('');
  const [editEmpBankIban, setEditEmpBankIban] = useState('');
  const [editEmpSalaryPaymentMethod, setEditEmpSalaryPaymentMethod] = useState<'bank_transfer' | 'cash'>('bank_transfer');
  const [editEmpDisbursementAccountId, setEditEmpDisbursementAccountId] = useState('1120');
  const [editEmpBasicSalary, setEditEmpBasicSalary] = useState(0);
  const [editEmpHousingAllowance, setEditEmpHousingAllowance] = useState(0);
  const [editEmpTransportAllowance, setEditEmpTransportAllowance] = useState(0);
  const [editEmpOtherAllowances, setEditEmpOtherAllowances] = useState(0);
  const [editEmpSocialInsuranceRate, setEditEmpSocialInsuranceRate] = useState(9);
  const [editEmpTaxRate, setEditEmpTaxRate] = useState(0);
  const [editCommissionRate, setEditCommissionRate] = useState(3.0);
  const [editMonthlySalesTarget, setEditMonthlySalesTarget] = useState(100000);
  const [editPhotoBase64, setEditPhotoBase64] = useState<string | undefined>(undefined);

  const empFileInputRef = useRef<HTMLInputElement>(null);
  const editEmpFileInputRef = useRef<HTMLInputElement>(null);

  const canEditEmp = hasPermission('edit_employees');
  const canDeleteEmp = hasPermission('delete_employees');

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert({
        title: 'حجم الملف كبير',
        message: 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميغابايت.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setEditPhotoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDirectEmployeePhotoChange = (empId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert({
        title: 'حجم الملف كبير',
        message: 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميغابايت.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      editEmployee(empId, { photoBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditEmp = (emp: Employee) => {
    if (!canEditEmp) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لتعديل بيانات الموظفين. يرجى مراجعة مسؤول النظام.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setEditEmpId(emp.id);
    setEditEmpName(emp.name);
    setEditEmpJobTitle(emp.jobTitle);
    setEditEmpDepartment(emp.department);
    setEditEmpHireDate(emp.hireDate);
    setEditEmpPhone(emp.phone || '');
    setEditEmpEmail(emp.email || '');
    setEditEmpNationalId(emp.nationalId || '');
    setEditEmpBankName(emp.bankName || '');
    setEditEmpBankIban(emp.bankIban || '');
    setEditEmpSalaryPaymentMethod(emp.salaryPaymentMethod || 'bank_transfer');
    setEditEmpDisbursementAccountId(emp.salaryDisbursementAccountId || (emp.salaryPaymentMethod === 'cash' ? '1110' : '1120'));
    setEditEmpBasicSalary(emp.basicSalary);
    setEditEmpHousingAllowance(emp.housingAllowance);
    setEditEmpTransportAllowance(emp.transportAllowance);
    setEditEmpOtherAllowances(emp.otherAllowances);
    setEditEmpSocialInsuranceRate(emp.socialInsuranceEmployeeRate);
    setEditEmpTaxRate(emp.taxDeductionRate);
    setEditCommissionRate(emp.commissionRate !== undefined ? emp.commissionRate : 3.0);
    setEditMonthlySalesTarget(emp.monthlySalesTarget || emp.salesTarget || 100000);
    setEditPhotoBase64(emp.photoBase64);
    setShowEditEmployeeModal(true);
  };

  const handleDeleteEmp = (emp: Employee) => {
    if (!canDeleteEmp) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لحذف الموظفين.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const check = canDeleteEntity('employee', emp.id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف الموظف (${emp.name})`,
        message: 'لا يمكن حذف ملف الموظف للأسباب التالية:',
        details: check.reason,
        note: 'لحفظ السجلات القانونية ومسيرات الرواتب والتقارير المالية، لا يمكن حذف سجلات الموظفين التي عليها حركة.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    showConfirm(
      `هل أنت متأكد من حذف ملف الموظف "${emp.name}" نهائياً من سجلات الموارد البشرية؟`,
      () => {
        deleteEmployee(emp.id);
      },
      `تأكيد حذف الموظف (${emp.name})`,
      'حذف الموظف'
    );
  };

  // Current active payroll run
  const currentRun =
    payrollRuns.find((r) => r.month === selectedMonth && r.year === selectedYear) || null;

  const handleGeneratePayroll = () => {
    generateMonthlyPayroll(selectedMonth, selectedYear, true);
    showAlert({
      title: 'تم احتساب مسير الرواتب',
      message: `تم احتساب وتحديث مسير شهر ${selectedMonth}/${selectedYear} بنجاح وفقاً لأحدث بيانات الموظفين والبدلات والاستقطاعات.`,
      type: 'success',
    });
  };

  const handleDeletePayrollRun = (runId: string) => {
    showConfirm(
      `هل تريد بالتأكيد حذف مسودة مسير رواتب شهر ${selectedMonth}/${selectedYear}؟\nسيتم إلغاء المسودة بالكامل وإتاحة إعادة توليدها في أي وقت.`,
      () => {
        deletePayrollRun(runId);
        showAlert({
          title: 'تم حذف المسير بنجاح',
          message: `تم حذف مسودة مسير رواتب شهر ${selectedMonth}/${selectedYear}.`,
          type: 'success',
        });
      },
      'تأكيد حذف مسير الرواتب',
      'حذف المسودة'
    );
  };

  const handleOpenEditPayslip = (slip: Payslip) => {
    setEditingPayslip(slip);
    setSlipBasicSalary(slip.basicSalary);
    setSlipHousingAllowance(slip.housingAllowance);
    setSlipTransportAllowance(slip.transportAllowance);
    setSlipOtherAllowances(slip.otherAllowances);
    setSlipBonus(slip.bonus || 0);
    setSlipOvertimeAmount(slip.overtimeAmount || 0);
    setSlipSocialInsurance(slip.socialInsuranceDeduction || 0);
    setSlipTaxDeduction(slip.taxDeduction || 0);
    setSlipOtherDeductions(slip.deductions || 0);
    setShowEditPayslipModal(true);
  };

  const handleSavePayslip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRun || !editingPayslip) return;
    updatePayslip(currentRun.id, editingPayslip.id, {
      basicSalary: Number(slipBasicSalary) || 0,
      housingAllowance: Number(slipHousingAllowance) || 0,
      transportAllowance: Number(slipTransportAllowance) || 0,
      otherAllowances: Number(slipOtherAllowances) || 0,
      bonus: Number(slipBonus) || 0,
      overtimeAmount: Number(slipOvertimeAmount) || 0,
      socialInsuranceDeduction: Number(slipSocialInsurance) || 0,
      taxDeduction: Number(slipTaxDeduction) || 0,
      deductions: Number(slipOtherDeductions) || 0,
    });
    setShowEditPayslipModal(false);
    showAlert({
      title: 'تم تحديث قسيمة الراتب',
      message: `تم تحديث مستحقات واستقطاعات الموظف "${editingPayslip.employeeName}" بنجاح وتحديث إجماليات المسير.`,
      type: 'success',
    });
  };

  const handleZeroOutDeductions = () => {
    setSlipSocialInsurance(0);
    setSlipTaxDeduction(0);
    setSlipOtherDeductions(0);
  };

  const handleApprovePayroll = (runId: string) => {
    const run = payrollRuns.find((r) => r.id === runId);
    if (!run) return;

    const cashTotal = run.payslips
      .filter((p) => p.paymentMethod === 'cash' || p.disbursementAccountId === '1110')
      .reduce((sum, p) => sum + p.netSalary, 0);
    const bankTotal = run.payslips
      .filter((p) => p.paymentMethod !== 'cash' && p.disbursementAccountId !== '1110')
      .reduce((sum, p) => sum + p.netSalary, 0);

    const confirmationMsg =
      `هل تريد بالتأكيد اعتماد وصرف مسير رواتب شهر ${run.month}/${run.year}؟\n\n` +
      `تفاصيل الصرف والخصم المالي من الحسابات:\n` +
      `• إجمالي الصرف عبر البنك: ${formatMoney(bankTotal)}\n` +
      `• إجمالي الصرف نقداً من الخزينة: ${formatMoney(cashTotal)}\n` +
      `• الإجمالي الصافي المطلوب صرفه: ${formatMoney(run.totalNet)}\n\n` +
      `سيتم إنشاء قيود الاستحقاق والصرف آلياً وتخفيض أرصدة الحسابات المعنية (البنك والخزينة) فورياً.`;

    showConfirm(
      confirmationMsg,
      () => {
        approvePayrollRun(runId);
        showAlert({
          title: 'تم اعتماد وصرف المسير بنجاح',
          message: `تم اعتماد وصرف مسير الرواتب وترحيله للحسابات بنجاح!\n• تم خصم ${formatMoney(bankTotal)} من الحساب البنكي.\n• تم خصم ${formatMoney(cashTotal)} من الخزينة النقدية الرئيسية.`,
          type: 'success',
          confirmText: 'فهمت',
        });
      },
      'تأكيد اعتماد وصرف مسير الرواتب',
      'اعتماد وصرف المسير'
    );
  };

  const totalBasic = employees.reduce((s, e) => s + e.basicSalary, 0);
  const totalAllowances = employees.reduce(
    (s, e) => s + e.housingAllowance + e.transportAllowance + e.otherAllowances,
    0
  );
  const totalGrossPayroll = totalBasic + totalAllowances;

  return (
    <div className="space-y-6">
      {/* Header & KPI Cards only for Payroll and Employees */}
      {(activeTab === 'payroll' || activeTab === 'employees') && (
        <>
          {/* Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BadgeDollarSign className="w-5 h-5 text-emerald-600" />
                الموارد البشرية ونظام مسير الرواتب الدقيق (HR & Payroll)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                احتساب الرواتب والبدلات واستقطاعات التأمينات الاجتماعية بدقة، مع توليد القيود المحاسبية التلقائية
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuickAddEmployee(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                title="إضافة موظف أو مندوب مبيعات جديد للنظام"
              >
                <Briefcase className="w-4 h-4" />
                إضافة موظف
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">إجمالي الرواتب الأساسية الشهرية</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1 privacy-blur">{formatMoney(totalBasic)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">لعدد {employees.length} موظفاً</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">إجمالي البدلات والمزايا</div>
              <div className="text-xl font-extrabold text-blue-900 mt-1 privacy-blur">{formatMoney(totalAllowances)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">سكن + انتقال + مزايا أخرى</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">الكتلة الشهرية الإجمالية (Gross Payroll)</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1 privacy-blur">{formatMoney(totalGrossPayroll)}</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">قبل خصم التأمينات والضرائب</div>
            </div>
          </div>
        </>
      )}

      {/* Tab 1: Monthly Payroll Run */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Payroll Selector & Generator Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">شهر:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="text-xs font-bold p-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      شهر {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">سنة:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="text-xs font-bold p-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGeneratePayroll}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                {currentRun ? `إعادة احتساب وتحديث شهر ${selectedMonth}/${selectedYear}` : `توليد مسير شهر ${selectedMonth}/${selectedYear}`}
              </button>

              {currentRun && currentRun.status !== 'posted_to_accounts' && (
                <>
                  <button
                    onClick={() => handleApprovePayroll(currentRun.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    اعتماد المسير وصرف الرواتب
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePayrollRun(currentRun.id)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="حذف مسودة مسير الرواتب بالكامل"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    حذف المسير
                  </button>
                </>
              )}

              {currentRun && currentRun.status === 'posted_to_accounts' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  تم الاعتماد والصرف وترحيل القيد
                </span>
              )}
            </div>
          </div>

          {/* Payslips Table */}
          {!currentRun ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                لم يتم احتساب مسير رواتب شهر {selectedMonth}/{selectedYear} بعد
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                اضغط على زر "توليد مسير الرواتب" لاحتساب استحقاقات جميع الموظفين والبدلات والتأمينات بدقة.
              </p>
              <button
                onClick={handleGeneratePayroll}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
              >
                توليد مسير الرواتب الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Disbursement Channels Breakdown */}
              {(() => {
                const cashNetSum = currentRun.payslips
                  .filter((p) => p.paymentMethod === 'cash' || p.disbursementAccountId === '1110')
                  .reduce((s, p) => s + p.netSalary, 0);
                const bankNetSum = currentRun.payslips
                  .filter((p) => p.paymentMethod !== 'cash' && p.disbursementAccountId !== '1110')
                  .reduce((s, p) => s + p.netSalary, 0);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          صافي التحويلات البنكية
                        </div>
                        <div className="text-lg font-black text-blue-950 mt-1 privacy-blur">
                          {formatMoney(currentRun.totalBankDisbursement ?? bankNetSum)}
                        </div>
                      </div>
                      <span className="text-xs bg-white px-2.5 py-1 rounded-xl font-bold text-blue-700 border border-blue-200 shadow-2xs">
                        {currentRun.payslips.filter((p) => p.paymentMethod !== 'cash' && p.disbursementAccountId !== '1110').length} موظف
                      </span>
                    </div>

                    <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-amber-600" />
                          صافي المنصرف نقداً (الخزينة)
                        </div>
                        <div className="text-lg font-black text-amber-950 mt-1 privacy-blur">
                          {formatMoney(currentRun.totalCashDisbursement ?? cashNetSum)}
                        </div>
                      </div>
                      <span className="text-xs bg-white px-2.5 py-1 rounded-xl font-bold text-amber-700 border border-amber-200 shadow-2xs">
                        {currentRun.payslips.filter((p) => p.paymentMethod === 'cash' || p.disbursementAccountId === '1110').length} موظف
                      </span>
                    </div>

                    <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                          <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
                          إجمالي صافي المسير المنصرف
                        </div>
                        <div className="text-lg font-black text-emerald-950 mt-1 privacy-blur">
                          {formatMoney(currentRun.totalNet)}
                        </div>
                      </div>
                      <span className="text-xs bg-white px-2.5 py-1 rounded-xl font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
                        {currentRun.payslips.length} موظف
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <th className="py-3 px-4">اسم الموظف</th>
                        <th className="py-3 px-4">المسمى الوظيفي</th>
                        <th className="py-3 px-4">الراتب الأساسي</th>
                        <th className="py-3 px-4">إجمالي البدلات</th>
                        <th className="py-3 px-4 font-bold text-slate-800">إجمالي الراتب (Gross)</th>
                        <th className="py-3 px-4 text-rose-700">تأمينات اجتماعية</th>
                        <th className="py-3 px-4 text-rose-700">إجمالي الاستقطاعات</th>
                        <th className="py-3 px-4 font-extrabold text-emerald-700 text-sm">صافي الراتب المستحق (Net)</th>
                        <th className="py-3 px-4">طريقة وحساب الصرف</th>
                        <th className="py-3 px-4 text-center">الإجراءات والقسيمة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentRun.payslips.map((slip) => (
                        <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{slip.employeeName}</td>
                          <td className="py-3 px-4 text-slate-600">{slip.jobTitle}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800 privacy-blur">{formatMoney(slip.basicSalary)}</td>
                          <td className="py-3 px-4 text-slate-600 privacy-blur">
                            {formatMoney(slip.housingAllowance + slip.transportAllowance + slip.otherAllowances)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 privacy-blur">{formatMoney(slip.grossSalary)}</td>
                          <td className="py-3 px-4 text-rose-700 font-semibold privacy-blur">{formatMoney(slip.socialInsuranceDeduction)}</td>
                          <td className="py-3 px-4 text-rose-700 font-bold privacy-blur">{formatMoney(slip.totalDeductions)}</td>
                          <td className="py-3 px-4 font-extrabold text-emerald-700 text-sm privacy-blur">
                            {formatMoney(slip.netSalary)}
                          </td>
                          <td className="py-3 px-4">
                            {currentRun.status !== 'posted_to_accounts' ? (
                              <div className="flex flex-col gap-1 min-w-[170px]">
                                <select
                                  value={`${slip.paymentMethod || 'bank_transfer'}:${slip.disbursementAccountId || (slip.paymentMethod === 'cash' ? '1110' : '1120')}`}
                                  onChange={(e) => {
                                    const [method, accId] = e.target.value.split(':') as ['bank_transfer' | 'cash', string];
                                    const acc = accounts.find((a) => a.id === accId || a.code === accId);
                                    updatePayslipPaymentMethod(currentRun.id, slip.id, method, accId, acc?.name);
                                  }}
                                  className="text-[11px] font-bold p-1.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-2xs"
                                >
                                  <optgroup label="🏦 تحويل بنكي">
                                    {(accounts || [])
                                      .filter((a) => a.type === 'asset' && a.code.startsWith('112'))
                                      .map((acc) => (
                                        <option key={`bank_transfer:${acc.id}`} value={`bank_transfer:${acc.id}`}>
                                          🏦 بنك: {acc.code} - {acc.name}
                                        </option>
                                      ))}
                                    {!accounts?.some((a) => a.code === '1120') && (
                                      <option value="bank_transfer:1120">🏦 1120 - الحساب البنكي الجاري الرئيسي</option>
                                    )}
                                  </optgroup>
                                  <optgroup label="💵 نقداً من الخزينة">
                                    {(accounts || [])
                                      .filter((a) => a.type === 'asset' && a.code.startsWith('111'))
                                      .map((acc) => (
                                        <option key={`cash:${acc.id}`} value={`cash:${acc.id}`}>
                                          💵 خزينة: {acc.code} - {acc.name}
                                        </option>
                                      ))}
                                    {!accounts?.some((a) => a.code === '1110') && (
                                      <option value="cash:1110">💵 1110 - الخزينة النقدية الرئيسية</option>
                                    )}
                                  </optgroup>
                                </select>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  slip.paymentMethod === 'cash'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {slip.paymentMethod === 'cash' ? (
                                  <>
                                    <Wallet className="w-3 h-3 text-amber-600" />
                                    نقداً ({slip.disbursementAccountId === '1110' ? 'الخزينة الرئيسية' : slip.disbursementAccountId})
                                  </>
                                ) : (
                                  <>
                                    <Building2 className="w-3 h-3 text-blue-600" />
                                    بنكي ({slip.disbursementAccountId === '1120' ? 'البنك الجاري' : slip.disbursementAccountId})
                                  </>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              {currentRun.status !== 'posted_to_accounts' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPayslip(slip)}
                                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  title="تعديل مفردات واستقطاعات القسيمة للموظف"
                                >
                                  <Edit3 className="w-3 h-3 text-indigo-600" />
                                  تعديل
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPayslip(slip);
                                  setShowPayslipModal(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Printer className="w-3 h-3 text-slate-600" />
                                قسيمة الراتب
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-bold">
                        <td colSpan={4} className="py-3 px-4">
                          إجمالي مسير الرواتب المستحق للشهر:
                        </td>
                        <td className="py-3 px-4">{formatMoney(currentRun.totalGross)}</td>
                        <td className="py-3 px-4 text-rose-300">-</td>
                        <td className="py-3 px-4 text-rose-300">{formatMoney(currentRun.totalDeductions)}</td>
                        <td className="py-3 px-4 text-emerald-400 font-extrabold text-base">
                          {formatMoney(currentRun.totalNet)}
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-slate-300 text-[11px] font-medium text-left">
                          {currentRun.status === 'posted_to_accounts' ? '✓ تم الترحيل والصرف المالي' : 'مسودة قابلة للتعديل'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Employees Directory */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="relative group/avatar shrink-0">
                    {emp.photoBase64 ? (
                      <img
                        src={emp.photoBase64}
                        alt={emp.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    {canEditEmp && (
                      <label
                        className="absolute inset-0 bg-slate-900/60 rounded-xl flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-[9px] font-bold"
                        title="تغيير صورة الموظف"
                      >
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span>تغيير</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleDirectEmployeePhotoChange(emp.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                        {emp.employeeCode}
                      </span>
                      <h3 className="font-bold text-slate-900">{emp.name}</h3>
                    </div>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">{emp.jobTitle}</p>
                    <p className="text-[11px] text-slate-400">{emp.department}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[11px] text-slate-400 block">إجمالي الراتب التعاقدي:</span>
                  <span className="font-extrabold text-slate-900 text-base privacy-blur">
                    {formatMoney(emp.basicSalary + emp.housingAllowance + emp.transportAllowance + emp.otherAllowances)}
                  </span>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] text-center border border-slate-100 privacy-blur">
                <div>
                  <span className="text-slate-400 block">الأساسي</span>
                  <span className="font-bold text-slate-800">{formatMoney(emp.basicSalary)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">بدل سكن</span>
                  <span className="font-bold text-slate-800">{formatMoney(emp.housingAllowance)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">بدل نقل</span>
                  <span className="font-bold text-slate-800">{formatMoney(emp.transportAllowance)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">أخرى</span>
                  <span className="font-bold text-slate-800">{formatMoney(emp.otherAllowances)}</span>
                </div>
              </div>

              {/* Sales Rep CRM Sync Badge */}
              {salesReps.some((r) => r.id === emp.id || r.employeeId === emp.id || r.code === emp.employeeCode) && (
                <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-2 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="font-bold text-indigo-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    متزامن تلقائياً كمسؤول ومندوب مبيعات في CRM
                  </span>
                  <span className="font-semibold text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border border-indigo-100">
                    عمولة: {emp.commissionRate ?? 3}% | تارجت: {formatMoney(emp.monthlySalesTarget || emp.salesTarget || 100000)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div>الهاتف: {emp.phone || '-'} | البريد: {emp.email || '-'}</div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      emp.salaryPaymentMethod === 'cash'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {emp.salaryPaymentMethod === 'cash' ? (
                      <>
                        <Wallet className="w-3 h-3 text-amber-600" />
                        صرف نقدي من الخزينة
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3 h-3 text-blue-600" />
                        تحويل بنكي
                      </>
                    )}
                  </span>
                </div>
                {emp.salaryPaymentMethod === 'cash' ? (
                  <div className="text-[11px] text-slate-500 font-medium">
                    حساب الصرف: {emp.salaryDisbursementAccountId === '1110' ? '1110 - الخزينة النقدية الرئيسية' : (emp.salaryDisbursementAccountId || '1110')}
                  </div>
                ) : emp.bankIban ? (
                  <div className="font-mono text-[11px] text-slate-500">
                    الحساب البنكي (IBAN): {emp.bankIban} {emp.bankName ? `(${emp.bankName})` : ''}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 font-medium">
                    حساب الصرف: {emp.salaryDisbursementAccountId === '1120' ? '1120 - الحساب البنكي الجاري الرئيسي' : (emp.salaryDisbursementAccountId || '1120')}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEditEmp(emp)}
                  disabled={!canEditEmp}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    canEditEmp
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                      : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title={canEditEmp ? 'تعديل بيانات الموظف والراتب' : 'ليس لديك صلاحية تعديل بيانات الموظفين'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  تعديل
                </button>
                <button
                  onClick={() => handleDeleteEmp(emp)}
                  disabled={!canDeleteEmp}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    canDeleteEmp
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title={canDeleteEmp ? 'حذف الموظف' : 'ليس لديك صلاحية حذف الموظفين'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-Tab 3: Attendance & Shifts */}
      {activeTab === 'attendance' && <HrAttendanceTab />}

      {/* Sub-Tab 4: Leaves & Permissions */}
      {activeTab === 'leaves' && <HrLeavesTab />}

      {/* Sub-Tab 5: Loans & Advances */}
      {activeTab === 'loans' && <HrLoansTab />}

      {/* Sub-Tab 6: Adjustments (Bonuses & Penalties) */}
      {activeTab === 'adjustments' && <HrAdjustmentsTab />}

      {/* Sub-Tab 7: Custodies & Assets */}
      {activeTab === 'custodies' && <HrCustodiesTab />}

      {/* Sub-Tab 8: Contracts & End of Service */}
      {activeTab === 'contracts_docs' && <HrContractsTab />}

      {/* Sub-Tab 9: HR Analytics & Reports */}
      {activeTab === 'hr_reports' && <HrReportsTab />}

      {/* Modal 1: Quick Add Employee */}
      <QuickAddModal
        isOpen={showQuickAddEmployee}
        onClose={() => setShowQuickAddEmployee(false)}
        initialTab="employee"
      />

      {/* Modal 1.5: Edit Employee */}
      {showEditEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                تعديل بيانات الموظف والراتب والبدلات
              </h3>
              <button onClick={() => setShowEditEmployeeModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  editEmployee(editEmpId, {
                    name: editEmpName,
                    jobTitle: editEmpJobTitle,
                    department: editEmpDepartment,
                    hireDate: editEmpHireDate,
                    phone: editEmpPhone,
                    email: editEmpEmail,
                    nationalId: editEmpNationalId,
                    bankName: editEmpBankName,
                    bankIban: editEmpBankIban,
                    salaryPaymentMethod: editEmpSalaryPaymentMethod,
                    salaryDisbursementAccountId: editEmpDisbursementAccountId,
                    basicSalary: editEmpBasicSalary,
                    housingAllowance: editEmpHousingAllowance,
                    transportAllowance: editEmpTransportAllowance,
                    otherAllowances: editEmpOtherAllowances,
                    socialInsuranceEmployeeRate: editEmpSocialInsuranceRate,
                    taxDeductionRate: editEmpTaxRate,
                    commissionRate: Number(editCommissionRate) || 0,
                    monthlySalesTarget: Number(editMonthlySalesTarget) || 0,
                    salesTarget: Number(editMonthlySalesTarget) || 0,
                    photoBase64: editPhotoBase64,
                  });
                  setShowEditEmployeeModal(false);
                  showAlert({
                    title: 'تم حفظ التعديلات',
                    message: `تم تحديث بيانات الموظف "${editEmpName}" بنجاح.`,
                    type: 'success',
                  });
                } catch (err: any) {
                  showAlert({
                    title: 'خطأ أثناء الحفظ',
                    message: err.message || 'حدث خطأ غير متوقع أثناء حفظ تعديلات الموظف',
                    type: 'error',
                  });
                }
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الاسم الرباعي <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editEmpName}
                    onChange={(e) => setEditEmpName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <CreatableCombobox
                    id="edit-emp-job-title"
                    label="المسمى الوظيفي"
                    required
                    placeholder="اختر أو اكتب مسمى جديد..."
                    value={editEmpJobTitle}
                    onChange={setEditEmpJobTitle}
                    options={jobTitles}
                    onAddNew={addJobTitle}
                    icon={<Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CreatableCombobox
                    id="edit-emp-dept"
                    label="القسم / الإدارة"
                    required
                    placeholder="اختر أو اكتب قسم جديد..."
                    value={editEmpDepartment}
                    onChange={setEditEmpDepartment}
                    options={departments}
                    onAddNew={addDepartment}
                    icon={<Layers className="w-3.5 h-3.5 text-indigo-600" />}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ المباشرة</label>
                  <input
                    type="date"
                    value={editEmpHireDate}
                    onChange={(e) => setEditEmpHireDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الراتب الأساسي</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editEmpBasicSalary}
                    onChange={(e) => setEditEmpBasicSalary(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">بدل السكن</label>
                  <input
                    type="number"
                    min="0"
                    value={editEmpHousingAllowance}
                    onChange={(e) => setEditEmpHousingAllowance(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">بدل الانتقال</label>
                  <input
                    type="number"
                    min="0"
                    value={editEmpTransportAllowance}
                    onChange={(e) => setEditEmpTransportAllowance(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">بدلات أخرى</label>
                  <input
                    type="number"
                    min="0"
                    value={editEmpOtherAllowances}
                    onChange={(e) => setEditEmpOtherAllowances(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">
                    تأمينات اجتماعية (%)
                    <span className="text-[10px] text-slate-400 font-normal mr-1">(0% = بدون)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editEmpSocialInsuranceRate}
                    onChange={(e) => setEditEmpSocialInsuranceRate(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-rose-200 text-rose-800 font-bold font-mono"
                    placeholder="0%"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">
                    ضريبة كسب عمل (%)
                    <span className="text-[10px] text-slate-400 font-normal mr-1">(0% = بدون)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editEmpTaxRate}
                    onChange={(e) => setEditEmpTaxRate(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-rose-200 text-rose-800 font-bold font-mono"
                    placeholder="0%"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
                <span className="text-amber-700 font-bold">💡 تنبيه الاستقطاعات:</span>
                <span>إذا كانت نسبة التأمينات أو الضريبة 0%، فلن يقوم النظام بخصم أي مبالغ تلقائياً من راتب الموظف عند توليد المسير الشهري.</span>
              </div>

              {/* Salary Payment Channel & Method */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block font-bold text-slate-800 text-xs">
                  طريقة وحساب صرف الراتب الشهري <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditEmpSalaryPaymentMethod('bank_transfer');
                      setEditEmpDisbursementAccountId('1120');
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      editEmpSalaryPaymentMethod === 'bank_transfer'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>تحويل بنكي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditEmpSalaryPaymentMethod('cash');
                      setEditEmpDisbursementAccountId('1110');
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      editEmpSalaryPaymentMethod === 'cash'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>نقداً من الخزينة</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {editEmpSalaryPaymentMethod === 'cash' ? 'حساب الخزينة المنصرف منها الراتب' : 'الحساب البنكي المنصرف منه الراتب'}
                  </label>
                  <select
                    value={editEmpDisbursementAccountId}
                    onChange={(e) => setEditEmpDisbursementAccountId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    {(accounts || [])
                      .filter((a) => a.type === 'asset' && (a.code.startsWith('111') || a.code.startsWith('112')))
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    {!accounts?.some((a) => a.code === '1120') && (
                      <option value="1120">1120 - الحساب البنكي الجاري الرئيسي (Commercial Bank)</option>
                    )}
                    {!accounts?.some((a) => a.code === '1110') && (
                      <option value="1110">1110 - الخزينة النقدية الرئيسية (Cash in Hand)</option>
                    )}
                  </select>
                </div>

                {editEmpSalaryPaymentMethod === 'bank_transfer' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">اسم بنك الموظف</label>
                      <input
                        type="text"
                        placeholder="مثال: CIB أو الأهلي"
                        value={editEmpBankName}
                        onChange={(e) => setEditEmpBankName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">رقم الآيبان (IBAN)</label>
                      <input
                        type="text"
                        placeholder="EGxxxxxxxxxxxxxx"
                        value={editEmpBankIban}
                        onChange={(e) => setEditEmpBankIban(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sales Rep & Target Integration Section */}
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    إعدادات العمولات ومستهدفات المبيعات (مزامنة فورية مع CRM)
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    مؤتمت
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">نسبة العمولة الافتراضية (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editCommissionRate}
                      onChange={(e) => setEditCommissionRate(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">المستهدف البيعي الشهري (Target)</label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={editMonthlySalesTarget}
                      onChange={(e) => setEditMonthlySalesTarget(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Employee Photo Upload for Edit */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    صورة الموظف الشخصية
                  </span>
                  {editPhotoBase64 && (
                    <button
                      type="button"
                      onClick={() => setEditPhotoBase64(undefined)}
                      className="text-rose-600 hover:text-rose-700 font-bold text-[11px]"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  {editPhotoBase64 ? (
                    <img
                      src={editPhotoBase64}
                      alt="معاينة الموظف"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-200/70 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={editEmpFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editEmpFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer text-xs shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      {editPhotoBase64 ? 'تغيير صورة الموظف' : 'رفع صورة من الجهاز'}
                    </button>
                    <div className="text-[10px] text-slate-400 mt-1">
                      يدعم PNG, JPG, WebP بحجم أقصى 2MB
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditEmployeeModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1.8: Edit Payslip Deductions & Allowances */}
      {showEditPayslipModal && editingPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" />
                  تعديل مستحقات واستقطاعات قسيمة الموظف
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  الموظف: <strong className="text-white">{editingPayslip.employeeName}</strong> ({editingPayslip.jobTitle}) • مسير شهر {editingPayslip.month}/{editingPayslip.year}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPayslipModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSavePayslip} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Quick Action Bar */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="text-xs text-indigo-900">
                  <span className="font-bold block">إجراء سريع للاستقطاعات:</span>
                  <span className="text-[11px] text-indigo-700">تصفير كافة الخصومات والتأمينات بضغطة زر ليحصل الموظف على راتبه كاملاً.</span>
                </div>
                <button
                  type="button"
                  onClick={handleZeroOutDeductions}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer transition-colors inline-flex items-center gap-1"
                >
                  ⚡ تصفير جميع الاستقطاعات (0 ج.م)
                </button>
              </div>

              {/* Section 1: Earnings & Allowances */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  الاستحقاقات والبدلات والمكافآت (Earnings)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">الراتب الأساسي</label>
                    <input
                      type="number"
                      min="0"
                      value={slipBasicSalary}
                      onChange={(e) => setSlipBasicSalary(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 font-bold font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">بدل السكن</label>
                    <input
                      type="number"
                      min="0"
                      value={slipHousingAllowance}
                      onChange={(e) => setSlipHousingAllowance(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">بدل الانتقال</label>
                    <input
                      type="number"
                      min="0"
                      value={slipTransportAllowance}
                      onChange={(e) => setSlipTransportAllowance(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">بدلات أخرى</label>
                    <input
                      type="number"
                      min="0"
                      value={slipOtherAllowances}
                      onChange={(e) => setSlipOtherAllowances(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">مكافآت وحوافز</label>
                    <input
                      type="number"
                      min="0"
                      value={slipBonus}
                      onChange={(e) => setSlipBonus(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">ساعات إضافية (مبلغ)</label>
                    <input
                      type="number"
                      min="0"
                      value={slipOvertimeAmount}
                      onChange={(e) => setSlipOvertimeAmount(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Deductions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <X className="w-4 h-4 text-rose-600" />
                  الاستقطاعات والخصومات (Deductions)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-700 mb-1">تأمينات اجتماعية GOSI</label>
                    <input
                      type="number"
                      min="0"
                      value={slipSocialInsurance}
                      onChange={(e) => setSlipSocialInsurance(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-rose-200 bg-rose-50/50 font-bold font-mono text-rose-800 focus:outline-hidden focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-700 mb-1">ضريبة كسب العمل</label>
                    <input
                      type="number"
                      min="0"
                      value={slipTaxDeduction}
                      onChange={(e) => setSlipTaxDeduction(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-rose-200 bg-rose-50/50 font-bold font-mono text-rose-800 focus:outline-hidden focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-700 mb-1">غيابات / جزاءات / سلف</label>
                    <input
                      type="number"
                      min="0"
                      value={slipOtherDeductions}
                      onChange={(e) => setSlipOtherDeductions(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-rose-200 bg-rose-50/50 font-bold font-mono text-rose-800 focus:outline-hidden focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Calculation Live Summary */}
              {(() => {
                const previewGross =
                  (Number(slipBasicSalary) || 0) +
                  (Number(slipHousingAllowance) || 0) +
                  (Number(slipTransportAllowance) || 0) +
                  (Number(slipOtherAllowances) || 0) +
                  (Number(slipBonus) || 0) +
                  (Number(slipOvertimeAmount) || 0);

                const previewDeductions =
                  (Number(slipSocialInsurance) || 0) +
                  (Number(slipTaxDeduction) || 0) +
                  (Number(slipOtherDeductions) || 0);

                const previewNet = Math.max(0, previewGross - previewDeductions);

                return (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>إجمالي المستحقات (Gross):</span>
                      <span className="font-mono font-bold">{formatMoney(previewGross)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-rose-300">
                      <span>إجمالي الاستقطاعات (Deductions):</span>
                      <span className="font-mono font-bold">-{formatMoney(previewDeductions)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold border-t border-slate-700 pt-2 text-emerald-400">
                      <span>صافي الراتب المستحق للصرف (Net):</span>
                      <span className="font-mono font-black text-base">{formatMoney(previewNet)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditPayslipModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  حفظ التعديلات في المسير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Official Payslip Preview */}
      {showPayslipModal && selectedPayslip && (
        <PrintPreviewModal
          isOpen={showPayslipModal}
          onClose={() => setShowPayslipModal(false)}
          title="معاينة قسيمة الراتب الشهرية (Payslip)"
          docNumber={`PAY-${selectedPayslip.year}-${String(selectedPayslip.month).padStart(2, '0')}-${selectedPayslip.id.slice(0, 4)}`}
          badgeText="مسير رواتب معتمد"
          badgeColor="bg-emerald-50 text-emerald-800 border-emerald-200"
          elementId="payslip-print-sheet"
        >
          {({ orientation }) => (
            <div className="space-y-6 text-xs text-slate-800">
              {/* Standardized Header */}
              <PrintHeader
                docTitle="قسيمة راتب شهري (MONTHLY PAYSLIP)"
                docNumber={`PAY-${selectedPayslip.year}-${String(selectedPayslip.month).padStart(2, '0')}-${selectedPayslip.id.slice(0, 4)}`}
                date={new Date().toISOString().split('T')[0]}
                badgeColor="bg-slate-900 text-white"
                additionalMeta={[
                  { label: 'شهر الاستحقاق', value: `${selectedPayslip.month} / ${selectedPayslip.year}` },
                  { label: 'العملة', value: currency },
                ]}
                orientation={orientation}
              />

              {/* Employee Details Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">اسم الموظف:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedPayslip.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">المسمى الوظيفي:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedPayslip.jobTitle}</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-500 font-semibold block">طريقة وحساب الصرف:</span>
                  <span className="font-bold text-indigo-700 text-xs inline-flex items-center gap-1 mt-0.5">
                    {selectedPayslip.paymentMethod === 'cash' ? (
                      <>
                        <Wallet className="w-3.5 h-3.5 text-amber-600" />
                        نقداً من الخزينة ({selectedPayslip.disbursementAccountId || '1110'})
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        تحويل بنكي ({selectedPayslip.disbursementAccountId || '1120'})
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-white">
                  <div className="font-extrabold text-emerald-800 border-b border-slate-100 pb-1.5 flex justify-between">
                    <span>الاستحقاقات والبدلات:</span>
                    <span>المبلغ</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>الراتب الأساسي:</span>
                    <span className="font-mono font-bold">{formatMoney(selectedPayslip.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>بدل السكن:</span>
                    <span className="font-mono font-bold">{formatMoney(selectedPayslip.housingAllowance)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>بدل الانتقال:</span>
                    <span className="font-mono font-bold">{formatMoney(selectedPayslip.transportAllowance)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold border-t border-slate-200 pt-2 text-slate-900">
                    <span>إجمالي الاستحقاق (Gross):</span>
                    <span className="font-mono text-emerald-700">{formatMoney(selectedPayslip.grossSalary)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-white">
                  <div className="font-extrabold text-rose-800 border-b border-slate-100 pb-1.5 flex justify-between">
                    <span>الاستقطاعات والخصومات:</span>
                    <span>المبلغ</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>تأمينات اجتماعية GOSI:</span>
                    <span className="font-mono font-bold text-rose-700">{formatMoney(selectedPayslip.socialInsuranceDeduction)}</span>
                  </div>
                  {selectedPayslip.taxDeduction > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>ضريبة كسب العمل:</span>
                      <span className="font-mono font-bold text-rose-700">{formatMoney(selectedPayslip.taxDeduction)}</span>
                    </div>
                  )}
                  {selectedPayslip.deductions > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>خصومات وغيابات وسلف:</span>
                      <span className="font-mono font-bold text-rose-700">{formatMoney(selectedPayslip.deductions)}</span>
                    </div>
                  )}
                  {selectedPayslip.socialInsuranceDeduction === 0 && selectedPayslip.taxDeduction === 0 && selectedPayslip.deductions === 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium text-[11px]">
                      <span>لا توجد أي استقطاعات:</span>
                      <span className="font-mono font-bold">0.00 {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold border-t border-slate-200 pt-2 text-rose-800">
                    <span>إجمالي الاستقطاع:</span>
                    <span className="font-mono">-{formatMoney(selectedPayslip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center font-extrabold text-sm">
                <span>صافي الراتب المستحق للصرف:</span>
                <span className="text-emerald-400 font-mono font-black text-lg">{formatMoney(selectedPayslip.netSalary)}</span>
              </div>

              {/* Standardized Footer */}
              <PrintFooter
                preparedByTitle="مسؤول الموارد البشرية / الرواتب"
                approvedByTitle="المدير المالي"
                receivedByTitle="توقيع واستلام الموظف"
                notes={
                  selectedPayslip.paymentMethod === 'cash'
                    ? 'تم صرف المستحقات نقداً من الخزينة النقدية الرئيسية بموجب سند صرف نقدية معتمد.'
                    : 'تم تحويل المستحقات عبر نظام حماية الأجور (WPS) المعتمد في الحساب البنكي للموظف.'
                }
              />
            </div>
          )}
        </PrintPreviewModal>
      )}
    </div>
  );
};
