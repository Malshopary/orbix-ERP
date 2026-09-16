import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { EmployeeDocument, EndOfServiceCalculation } from '../../types';
import {
  FileText,
  Calculator,
  AlertTriangle,
  Calendar,
  Plus,
  Trash2,
  FileCheck,
  ShieldAlert,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const HrContractsTab: React.FC = () => {
  const {
    employees,
    employeeDocuments,
    addEmployeeDocument,
    deleteEmployeeDocument,
    calculateEndOfService,
    formatMoney,
    showAlert,
    showConfirm,
  } = useErp();

  // Active Sub-view toggle: 'calculator' vs 'documents'
  const [subView, setSubView] = useState<'calculator' | 'documents'>('calculator');

  // Calculator State
  const [calcEmpId, setCalcEmpId] = useState<string>(employees[0]?.id || '');
  const [calcTerminationDate, setCalcTerminationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [calcReason, setCalcReason] = useState<
    'resignation' | 'contract_end' | 'termination' | 'retirement' | 'death'
  >('contract_end');

  // Document Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [formDocEmpId, setFormDocEmpId] = useState<string>('');
  const [formDocCategory, setFormDocCategory] = useState<EmployeeDocument['category']>('contract');
  const [formDocTitle, setFormDocTitle] = useState<string>('');
  const [formDocNumber, setFormDocNumber] = useState<string>('');
  const [formExpiryDate, setFormExpiryDate] = useState<string>('');
  const [formDocNotes, setFormDocNotes] = useState<string>('');

  // Auto-calculated End-of-Service Gratuity
  const eosResult = useMemo(() => {
    if (!calcEmpId) return null;
    return calculateEndOfService(calcEmpId, calcTerminationDate, calcReason);
  }, [calcEmpId, calcTerminationDate, calcReason, calculateEndOfService]);

  const selectedCalcEmp = employees.find((e) => e.id === calcEmpId);

  // Document Expiry Alerts (within 60 days or already expired)
  const expiringDocs = useMemo(() => {
    const today = new Date();
    const alertLimit = new Date();
    alertLimit.setDate(today.getDate() + 60);

    return employeeDocuments.filter((doc) => {
      if (!doc.expiryDate) return false;
      const expDate = new Date(doc.expiryDate);
      return expDate <= alertLimit;
    });
  }, [employeeDocuments]);

  const handleOpenAddDoc = () => {
    setFormDocEmpId(employees[0]?.id || '');
    setFormDocCategory('contract');
    setFormDocTitle('عقد عمل محدد المدة');
    setFormDocNumber('');
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormExpiryDate(nextYear.toISOString().split('T')[0]);
    setFormDocNotes('');
    setIsDocModalOpen(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formDocEmpId);
    if (!emp) {
      showAlert({
        title: 'تنبيه',
        message: 'يرجى اختيار الموظف أولاً.',
        type: 'warning',
        confirmText: 'حسناً',
      });
      return;
    }

    if (!formDocTitle.trim()) {
      showAlert({
        title: 'عنوان الوثيقة مطلوب',
        message: 'يرجى إدخال عنوان أو مسمى الوثيقة/العقد.',
        type: 'warning',
        confirmText: 'حسناً',
      });
      return;
    }

    addEmployeeDocument({
      employeeId: emp.id,
      category: formDocCategory,
      title: formDocTitle.trim(),
      documentNumber: formDocNumber.trim(),
      expiryDate: formExpiryDate,
      notes: formDocNotes,
    });

    showAlert({
      title: 'تم أرشفة الوثيقة بنجاح',
      message: `تمت أرشفة وثيقة (${formDocTitle}) في ملف الموظف ${emp.name} بنجاح.`,
      type: 'success',
      confirmText: 'حسناً',
    });

    setIsDocModalOpen(false);
  };

  const handleDeleteDoc = (doc: EmployeeDocument) => {
    const empName = employees.find((e) => e.id === doc.employeeId)?.name || 'الموظف';
    showConfirm(
      `هل أنت متأكد من حذف وثيقة "${doc.title}" للموظف ${empName}؟`,
      () => {
        deleteEmployeeDocument(doc.id);
      },
      'تأكيد الحذف',
      { confirmText: 'حذف', type: 'error' }
    );
  };

  const getDocCategoryLabel = (category: EmployeeDocument['category']) => {
    switch (category) {
      case 'contract':
        return 'عقد عمل وظيفي';
      case 'national_id':
        return 'بطاقة هوية / إقامة';
      case 'certificate':
        return 'شهادة خبرة / مؤهل';
      case 'medical':
        return 'تقرير / فحص طبي';
      case 'military':
        return 'شهادة خدمة عسكرية';
      default:
        return 'وثيقة ومستند';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">العقود والوثائق ومكافأة نهاية الخدمة</h3>
            <p className="text-xs text-slate-500">
              حاسبة مكافأة نهاية الخدمة المعتمدة قانونياً وأرشفة العقود ومتابعة تواريخ انتهاء الإقامات
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSubView('calculator')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              subView === 'calculator'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            حاسبة مكافأة نهاية الخدمة
          </button>
          <button
            type="button"
            onClick={() => setSubView('documents')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              subView === 'documents'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            أرشيف العقود والوثائق ({employeeDocuments.length})
            {expiringDocs.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {expiringDocs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expiry Alerts Banner if any */}
      {expiringDocs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold">
              تنبيهات العقود والإقامات: يوجد عدد ({expiringDocs.length}) وثيقة أو عقد شارف على الانتهاء أو منتهي الصلاحية!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSubView('documents')}
            className="text-amber-800 underline font-bold hover:text-amber-950"
          >
            عرض الوثائق والتجديد
          </button>
        </div>
      )}

      {/* SUB-VIEW 1: END OF SERVICE CALCULATOR */}
      {subView === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Inputs Column */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calculator className="w-4 h-4 text-teal-600" />
              بيانات احتساب مكافأة نهاية الخدمة
            </h4>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الموظف *</label>
              <select
                value={calcEmpId}
                onChange={(e) => setCalcEmpId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-sans"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode} - تعيين: {emp.hireDate})
                  </option>
                ))}
              </select>
            </div>

            {selectedCalcEmp && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">تاريخ التعيين والالتحاق:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedCalcEmp.hireDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">الراتب الأساسي:</span>
                  <span className="font-mono font-bold text-slate-800 privacy-blur">
                    {formatMoney(selectedCalcEmp.basicSalary)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">إجمالي البدلات:</span>
                  <span className="font-mono font-bold text-slate-800 privacy-blur">
                    {formatMoney(
                      selectedCalcEmp.housingAllowance +
                        selectedCalcEmp.transportAllowance +
                        selectedCalcEmp.otherAllowances
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700">الراتب الإجمالي للتقييم:</span>
                  <span className="font-mono font-extrabold text-teal-700 privacy-blur">
                    {formatMoney(
                      selectedCalcEmp.basicSalary +
                        selectedCalcEmp.housingAllowance +
                        selectedCalcEmp.transportAllowance +
                        selectedCalcEmp.otherAllowances
                    )}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">تاريخ انتهاء الخدمة / العمل *</label>
              <input
                type="date"
                value={calcTerminationDate}
                onChange={(e) => setCalcTerminationDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">سبب انتهاء العلاقة التعاقدية *</label>
              <select
                value={calcReason}
                onChange={(e) => setCalcReason(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-sans font-bold"
              >
                <option value="contract_end">انتهاء مدة العقد المحدد / اتفاق الطرفين (مكافأة كاملة)</option>
                <option value="termination">إنهاء العقد من طرف صاحب العمل (مكافأة كاملة)</option>
                <option value="retirement">بلوغ سن التقاعد النظامي (مكافأة كاملة)</option>
                <option value="death">وفاة أو عجز الموظف (مكافأة كاملة)</option>
                <option value="resignation">استقالة الموظف بمحض إرادته (تخضع لنسبة سنوات الخدمة)</option>
              </select>
            </div>

            {calcReason === 'resignation' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-800">
                  <HelpCircle className="w-3.5 h-3.5" />
                  قواعد استحقاق مكافأة الاستقالة بنظام العمل:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-800">
                  <li>أقل من سنتين خدمة: لا يستحق أي مكافأة (0%).</li>
                  <li>من سنتين إلى 5 سنوات: يستحق ثلث المكافأة (33.33%).</li>
                  <li>من 5 إلى 10 سنوات: يستحق ثلثي المكافأة (66.67%).</li>
                  <li>10 سنوات فما فوق: يستحق المكافأة كاملة (100%).</li>
                </ul>
              </div>
            )}
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-teal-600" />
              التقرير التفصيلي لاحتساب مستحقات نهاية الخدمة
            </h4>

            {!eosResult ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                يرجى اختيار الموظف وتحديد تاريخ انتهاء الخدمة.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Duration & Highlights Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-teal-50 p-3.5 rounded-xl border border-teal-100">
                    <span className="text-[11px] font-medium text-teal-800 block">مدة الخدمة الإجمالية</span>
                    <span className="text-base font-extrabold text-teal-900 mt-1 block">
                      {eosResult.yearsOfService} سنة و {eosResult.monthsOfService} شهر و {eosResult.daysOfService} يوم
                    </span>
                    <span className="text-[10px] text-teal-700/80">
                      من {eosResult.hireDate} إلى {eosResult.terminationDate}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-medium text-slate-500 block">راتب احتساب المكافأة</span>
                    <span className="text-base font-extrabold text-slate-900 mt-1 block privacy-blur">
                      {formatMoney(eosResult.lastGrossSalary)}
                    </span>
                    <span className="text-[10px] text-slate-400">شامل الأساسي والبدلات</span>
                  </div>

                  <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-100">
                    <span className="text-[11px] font-medium text-purple-800 block">مكافأة نهاية الخدمة</span>
                    <span className="text-base font-extrabold text-purple-900 mt-1 block font-mono privacy-blur">
                      {formatMoney(eosResult.gratuityAmount)}
                    </span>
                    <span className="text-[10px] text-purple-700/80">المستحقة نظاماً</span>
                  </div>
                </div>

                {/* Calculation Breakdown Step-by-Step */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 mb-2">تفصيل خطوات الحساب والتسوية المالية:</div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>
                      • مكافأة نهاية الخدمة المستحقة عن مدة الخدمة:
                    </span>
                    <span className="font-bold text-slate-800 font-mono privacy-blur">
                      {formatMoney(eosResult.gratuityAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>
                      • تعويض رصيد الإجازات المتبقية (رصيد إجازات مستحق +):
                    </span>
                    <span className="font-bold font-mono privacy-blur">
                      +{formatMoney(eosResult.leaveEncashmentAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-rose-700">
                    <span>
                      • خصم السلف والقروض القائمة بذمة الموظف (-):
                    </span>
                    <span className="font-bold font-mono privacy-blur">
                      -{formatMoney(eosResult.pendingLoanBalance)}
                    </span>
                  </div>
                </div>

                {/* Final Net Settlement Box */}
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-teal-100 text-xs block">
                      صافي المستحقات النهائية الشاملة واجبة الصرف (Net Settlement):
                    </span>
                    <div className="text-2xl font-black mt-1 font-mono privacy-blur">
                      {formatMoney(eosResult.finalSettlementNet)}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
                      <CheckCircle2 className="w-4 h-4" />
                      معتمدة ومطابقة لنظام العمل
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DOCUMENTS ARCHIVE */}
      {subView === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleOpenAddDoc}
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              أرشفة وثيقة / عقد جديد
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {employeeDocuments.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">لا توجد وثائق أو عقود مؤرشفة</h4>
                <p className="text-xs text-slate-400">
                  قم بأرشفة عقود الموظفين والهويات وتواريخ التجديد عبر الزر بالأعلى.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">الموظف</th>
                      <th className="py-3 px-4">تصنيف الوثيقة</th>
                      <th className="py-3 px-4">مسمى الوثيقة</th>
                      <th className="py-3 px-4">رقم الوثيقة</th>
                      <th className="py-3 px-4">تاريخ الانتهاء</th>
                      <th className="py-3 px-4">حالة الصلاحية والتجديد</th>
                      <th className="py-3 px-4">ملاحظات</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeeDocuments.map((doc) => {
                      const emp = employees.find((e) => e.id === doc.employeeId);
                      const empName = emp?.name || 'موظف';
                      const empCode = emp?.employeeCode || '';

                      const today = new Date();
                      const exp = doc.expiryDate ? new Date(doc.expiryDate) : null;
                      const isExpired = exp ? exp < today : false;
                      const diffDays = exp
                        ? Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      const isNearExpiry = diffDays !== null && diffDays >= 0 && diffDays <= 60;

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{empName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{empCode}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {getDocCategoryLabel(doc.category)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">{doc.title}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{doc.documentNumber || '-'}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                            {doc.expiryDate || 'سارية بدون تاريخ'}
                          </td>
                          <td className="py-3 px-4">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                                <AlertTriangle className="w-3 h-3" />
                                منتهية الصلاحية
                              </span>
                            ) : isNearExpiry ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3" />
                                تنتهي خلال {diffDays} يوم
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                سارية الصلاحية
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{doc.notes || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="حذف الوثيقة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                أرشفة وثيقة أو عقد للموظف
              </h3>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">الموظف *</label>
                  <select
                    value={formDocEmpId}
                    onChange={(e) => setFormDocEmpId(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode} - {emp.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع وتصنيف الوثيقة *</label>
                  <select
                    value={formDocCategory}
                    onChange={(e) => setFormDocCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans font-bold"
                  >
                    <option value="contract">عقد عمل وظيفي</option>
                    <option value="national_id">بطاقة هوية وطنية / إقامة</option>
                    <option value="certificate">شهادة تخرج / مؤهل / تدريب</option>
                    <option value="medical">تقرير طبي / كشف لياقة</option>
                    <option value="military">شهادة أداء الخدمة العسكرية</option>
                    <option value="other">وثيقة ومستند آخر</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">عنوان ومسمى الوثيقة *</label>
                  <input
                    type="text"
                    value={formDocTitle}
                    onChange={(e) => setFormDocTitle(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الوثيقة / العقد</label>
                  <input
                    type="text"
                    value={formDocNumber}
                    onChange={(e) => setFormDocNumber(e.target.value)}
                    placeholder="رقم الإقامة / رقم العقد..."
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ انتهاء الصلاحية / التجديد</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">ملاحظات</label>
                  <input
                    type="text"
                    value={formDocNotes}
                    onChange={(e) => setFormDocNotes(e.target.value)}
                    placeholder="ملاحظات وشروط التجديد..."
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-xs"
                >
                  حفظ وأرشفة الوثيقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

