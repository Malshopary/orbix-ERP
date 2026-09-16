import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { EmployeeCustody, CustodyCategory, CustodyStatus } from '../../types';
import {
  ShieldCheck,
  Laptop,
  Car,
  Phone,
  Key,
  Coins,
  Package,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Printer,
  FileCheck,
} from 'lucide-react';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { PrintHeader } from '../PrintHeader';
import { PrintFooter } from '../PrintFooter';

export const HrCustodiesTab: React.FC = () => {
  const {
    employees,
    employeeCustodies,
    addEmployeeCustody,
    updateEmployeeCustody,
    deleteEmployeeCustody,
    returnEmployeeCustody,
    formatMoney,
    companyProfile,
    showAlert,
    showConfirm,
  } = useErp();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEmpId, setFilterEmpId] = useState<string>('all');

  // Modal State for New Custody
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [formEmpId, setFormEmpId] = useState<string>('');
  const [formCategory, setFormCategory] = useState<CustodyCategory>('laptop');
  const [formItemName, setFormItemName] = useState<string>('');
  const [formSerial, setFormSerial] = useState<string>('');
  const [formValue, setFormValue] = useState<number>(0);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCondition, setFormCondition] = useState<string>('ممتازة وبكامل الملحقات');
  const [formNotes, setFormNotes] = useState<string>('');

  // Modal State for Returning Custody
  const [returnTargetCustody, setReturnTargetCustody] = useState<EmployeeCustody | null>(null);
  const [returnConditionNote, setReturnConditionNote] = useState<string>('بحالة ممتازة ومطابقة للمواصفات');

  // Clearance Print Modal State
  const [showClearanceModal, setShowClearanceModal] = useState<boolean>(false);
  const [selectedClearanceEmpId, setSelectedClearanceEmpId] = useState<string>('');

  // Filtered List
  const filteredList = useMemo(() => {
    return employeeCustodies.filter((c) => {
      if (filterCategory !== 'all' && c.category !== filterCategory) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterEmpId !== 'all' && c.employeeId !== filterEmpId) return false;
      return true;
    });
  }, [employeeCustodies, filterCategory, filterStatus, filterEmpId]);

  // Statistics
  const stats = useMemo(() => {
    const assignedCount = employeeCustodies.filter((c) => c.status === 'delivered').length;
    const returnedCount = employeeCustodies.filter((c) => c.status === 'returned').length;
    const totalValue = employeeCustodies
      .filter((c) => c.status === 'delivered')
      .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
    const devicesCount = employeeCustodies.filter(
      (c) => c.status === 'delivered' && (c.category === 'laptop' || c.category === 'device')
    ).length;

    return {
      assignedCount,
      returnedCount,
      totalValue,
      devicesCount,
    };
  }, [employeeCustodies]);

  const handleOpenAdd = () => {
    setFormEmpId(employees[0]?.id || '');
    setFormCategory('laptop');
    setFormItemName('');
    setFormSerial('');
    setFormValue(0);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCondition('ممتازة وبكامل الملحقات');
    setFormNotes('');
    setIsNewModalOpen(true);
  };

  const handleSaveCustody = (e: React.FormEvent) => {
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

    if (!formItemName.trim()) {
      showAlert({
        title: 'اسم العهدة مطلوب',
        message: 'يرجى إدخال اسم وبيان العهدة المسلمة للموظف.',
        type: 'warning',
        confirmText: 'حسناً',
      });
      return;
    }

    addEmployeeCustody({
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.name,
      category: formCategory,
      itemName: formItemName.trim(),
      serialNumber: formSerial.trim(),
      estimatedValue: Number(formValue) || 0,
      deliveredDate: formDate,
      condition: formCondition,
      status: 'delivered',
      notes: formNotes,
    });

    showAlert({
      title: 'تم تسليم العهدة بنجاح',
      message: `تم قيد العهدة "${formItemName}" في ذمة الموظف ${emp.name} بنجاح.`,
      type: 'success',
      confirmText: 'حسناً',
    });

    setIsNewModalOpen(false);
  };

  const handleConfirmReturn = () => {
    if (!returnTargetCustody) return;
    returnEmployeeCustody(returnTargetCustody.id, returnConditionNote);
    showAlert({
      title: 'تم استرجاع العهدة',
      message: `تم إخلاء طرف الموظف ${returnTargetCustody.employeeName} من العهدة (${returnTargetCustody.itemName}) بنجاح.`,
      type: 'success',
      confirmText: 'حسناً',
    });
    setReturnTargetCustody(null);
  };

  const handleDelete = (custody: EmployeeCustody) => {
    showConfirm(
      `هل أنت متأكد من حذف سجل العهدة "${custody.itemName}" للموظف ${custody.employeeName}؟`,
      () => {
        deleteEmployeeCustody(custody.id);
      },
      'تأكيد الحذف',
      { confirmText: 'حذف', type: 'error' }
    );
  };

  const getCategoryBadge = (category: CustodyCategory) => {
    switch (category) {
      case 'laptop':
      case 'device':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
            <Laptop className="w-3 h-3 text-blue-600" />
            حاسب / جهاز
          </span>
        );
      case 'vehicle':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            <Car className="w-3 h-3 text-amber-600" />
            سيارة / مركبة
          </span>
        );
      case 'mobile':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            <Phone className="w-3 h-3 text-emerald-600" />
            شريحة / هاتف
          </span>
        );
      case 'keys':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
            <Key className="w-3 h-3 text-indigo-600" />
            مفاتيح مقر/مستودع
          </span>
        );
      case 'cash_advance':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
            <Coins className="w-3 h-3 text-purple-600" />
            عهدة نقدية
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            <Package className="w-3 h-3 text-slate-600" />
            عهدة عينية أخرى
          </span>
        );
    }
  };

  const getStatusBadge = (status: CustodyStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            مسلمة للموظف
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            تم الإخلاء والاسترجاع
          </span>
        );
      case 'damaged':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
            تالفة
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-200 text-rose-900 border border-rose-300">
            مفقودة
          </span>
        );
      default:
        return null;
    }
  };

  // Selected employee custodies for clearance printing
  const selectedEmpClearance = useMemo(() => {
    if (!selectedClearanceEmpId) return null;
    const emp = employees.find((e) => e.id === selectedClearanceEmpId);
    if (!emp) return null;
    const empCustodies = employeeCustodies.filter((c) => c.employeeId === emp.id);
    const activeCustodies = empCustodies.filter((c) => c.status === 'delivered');
    const returnedCustodies = empCustodies.filter((c) => c.status === 'returned');
    return {
      emp,
      all: empCustodies,
      active: activeCustodies,
      returned: returnedCustodies,
      isFullyCleared: activeCustodies.length === 0,
    };
  }, [employees, employeeCustodies, selectedClearanceEmpId]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">إدارة العهد العينية والمالية وإخلاء الطرف</h3>
            <p className="text-xs text-slate-500">
              تسجيل ومطابقة الأجهزة والسيارات والعهد المسلمة للموظفين وطباعة نماذج إخلاء الطرف
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedClearanceEmpId(employees[0]?.id || '');
              setShowClearanceModal(true);
            }}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-slate-300"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            طباعة إخلاء طرف موظف
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            تسليم عهدة جديدة
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>العهد المسلمة حالياً</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats.assignedCount}</div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">عهدة في ذمة الموظفين</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>إجمالي القيمة التقديرية</span>
            <Coins className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-indigo-900 mt-1 privacy-blur">
            {formatMoney(stats.totalValue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">قيمة الأصول المسلمة عهدة</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>أجهزة وحواسيب محمولة</span>
            <Laptop className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats.devicesCount}</div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">لابتوبات وأجهزة نشطة</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>تم استرجاعها وإخلاؤها</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.returnedCount}</div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">تمت إعادتها لمستودع العهد</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">التصنيف:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">كافة العهد</option>
            <option value="laptop">حواسب ولابتوبات</option>
            <option value="mobile">هواتف وشرائح</option>
            <option value="vehicle">سيارات ومركبات</option>
            <option value="cash_advance">عهد نقدية</option>
            <option value="keys">مفاتيح ومستودعات</option>
            <option value="tools">أدوات ومعدات</option>
            <option value="device">أجهزة تقنية</option>
            <option value="other">أخرى</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">الحالة:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">كافة الحالات</option>
            <option value="delivered">مسلمة للموظف</option>
            <option value="returned">تم الإخلاء والاسترجاع</option>
            <option value="damaged">تالفة</option>
            <option value="lost">مفقودة</option>
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

        {(filterCategory !== 'all' || filterStatus !== 'all' || filterEmpId !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setFilterCategory('all');
              setFilterStatus('all');
              setFilterEmpId('all');
            }}
            className="text-slate-500 hover:text-slate-800 underline mr-auto"
          >
            إعادة تعيين الفلاتر
          </button>
        )}
      </div>

      {/* Custodies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">لا توجد عهد مسجلة</h4>
            <p className="text-xs text-slate-400">
              يمكنك قيد وتسليم عهدة جديدة لموظف عبر الزر بالأعلى.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">رقم العهدة</th>
                  <th className="py-3 px-4">الموظف المسؤول</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">اسم وبيان العهدة</th>
                  <th className="py-3 px-4">الرقم التسلسلي (S/N)</th>
                  <th className="py-3 px-4">القيمة التقديرية</th>
                  <th className="py-3 px-4">تاريخ التسليم</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {c.custodyNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.employeeCode}</div>
                    </td>
                    <td className="py-3 px-4">{getCategoryBadge(c.category)}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{c.itemName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.serialNumber || '-'}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 privacy-blur">
                      {c.estimatedValue && c.estimatedValue > 0 ? formatMoney(c.estimatedValue) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.deliveredDate}</td>
                    <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {c.status === 'delivered' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReturnTargetCustody(c);
                              setReturnConditionNote('بحالة ممتازة ومطابقة للمواصفات');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 text-[11px] inline-flex items-center gap-1"
                            title="استرجاع وإخلاء طرف"
                          >
                            <RotateCcw className="w-3 h-3" />
                            استرجاع
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Custody Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                تسليم وقيد عهدة جديدة لموظف
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustody} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">الموظف المستلم *</label>
                  <select
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
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
                  <label className="block font-bold text-slate-700 mb-1">تصنيف العهدة *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans font-bold"
                  >
                    <option value="laptop">حاسب محمول / لابتوب</option>
                    <option value="mobile">هاتف ذكي / شريحة اتصال</option>
                    <option value="vehicle">سيارة / مركبة شركة</option>
                    <option value="cash_advance">عهدة نقدية للمشتريات والنثريات</option>
                    <option value="keys">مفاتيح مقر / مستودع / خزينة</option>
                    <option value="tools">أدوات ومعدات تشغيل</option>
                    <option value="device">جهاز تقني آخر</option>
                    <option value="other">عهدة أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة العهدة عند التسليم</label>
                  <input
                    type="text"
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                    placeholder="جديدة تماماً، جيدة..."
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">اسم ووصف العهدة *</label>
                  <input
                    type="text"
                    value={formItemName}
                    onChange={(e) => setFormItemName(e.target.value)}
                    placeholder="مثال: لابتوب Dell Latitude 5420 i7 / سيارة تويوتا هايلكس 2024..."
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم التسلسلي / اللوحة</label>
                  <input
                    type="text"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    placeholder="S/N أو رقم اللوحة..."
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">القيمة التقديرية</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ التسليم *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ملاحظات تسليم العهدة</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="الملحقات والشاحن والحقيبة..."
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs"
                >
                  تسليم وقيد العهدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Custody Modal */}
      {returnTargetCustody && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                استرجاع العهدة وإخلاء الطرف
              </h3>
              <button
                type="button"
                onClick={() => setReturnTargetCustody(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-sm">{returnTargetCustody.itemName}</div>
                <div className="text-slate-500">
                  الموظف: {returnTargetCustody.employeeName} ({returnTargetCustody.employeeCode})
                </div>
                <div className="text-slate-500 font-mono">
                  S/N: {returnTargetCustody.serialNumber || 'غير محدد'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  حالة العهدة عند الاسترجاع وملاحظات الفحص *
                </label>
                <textarea
                  rows={3}
                  value={returnConditionNote}
                  onChange={(e) => setReturnConditionNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  placeholder="تم الفحص واستلامها كاملة الملحقات وبحالة ممتازة..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturnTargetCustody(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
                >
                  تأكيد الاسترجاع وإخلاء الطرف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Clearance Certificate Modal */}
      {showClearanceModal && (
        <PrintPreviewModal
          isOpen={showClearanceModal}
          onClose={() => setShowClearanceModal(false)}
          title="شهادة إخلاء طرف ومطابقة عهد الموظف"
        >
          <div className="p-8 bg-white text-slate-900 space-y-6 print:p-0">
            {/* Header with Company Logo */}
            <PrintHeader title="شهادة إخلاء طرف ومطابقة العهد الرسمية" />

            {/* Employee Selector for Screen preview only */}
            <div className="print:hidden bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <span className="font-bold text-slate-700 text-xs">اختر الموظف لعرض شهادة إخلاء الطرف:</span>
              <select
                value={selectedClearanceEmpId}
                onChange={(e) => setSelectedClearanceEmpId(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 bg-white text-xs font-bold font-sans"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.employeeCode} - {e.jobTitle})
                  </option>
                ))}
              </select>
            </div>

            {selectedEmpClearance && (
              <div className="space-y-6">
                {/* Employee Details Box */}
                <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 text-xs bg-slate-50/50">
                  <div>
                    <span className="text-slate-500 block">اسم الموظف:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedEmpClearance.emp.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">الرقم الوظيفي:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedEmpClearance.emp.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">المسمى الوظيفي:</span>
                    <span className="font-semibold text-slate-800">{selectedEmpClearance.emp.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">القسم / الإدارة:</span>
                    <span className="font-semibold text-slate-800">{selectedEmpClearance.emp.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">تاريخ التعيين:</span>
                    <span className="font-mono text-slate-700">{selectedEmpClearance.emp.hireDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">تاريخ إصدار الشهادة:</span>
                    <span className="font-mono text-slate-700">{new Date().toISOString().split('T')[0]}</span>
                  </div>
                </div>

                {/* Clearance Status Notice */}
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    selectedEmpClearance.isFullyCleared
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2 text-sm mb-1">
                    {selectedEmpClearance.isFullyCleared ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        تم إخلاء الطرف بالكامل - لا توجد أي عهد معلقة في ذمة الموظف
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-600" />
                        تنبيه: لا يزال في ذمة الموظف عدد ({selectedEmpClearance.active.length}) عهدة معلقة
                        يجب استرجاعها لإتمام إخلاء الطرف
                      </>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90">
                    تشهد إدارة الموارد البشرية وإدارة العهد والمخازن بشركة ({companyProfile.nameAr}) بأن
                    البيانات الموضحة أدناه تمثل كشف الحصر النهائي لكافة العهد والأصول المسلمة للمذكور أعلاه.
                  </p>
                </div>

                {/* Table of Custodies */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-2">بيان تفصيلي بالعهد المسلمة والمسترجعة:</h4>
                  <table className="w-full text-right text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">رقم العهدة</th>
                        <th className="py-2.5 px-3">بيان العهدة</th>
                        <th className="py-2.5 px-3">التصنيف</th>
                        <th className="py-2.5 px-3">الرقم التسلسلي</th>
                        <th className="py-2.5 px-3">تاريخ التسليم</th>
                        <th className="py-2.5 px-3">حالة المطابقة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEmpClearance.all.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            لا توجد أي عهد مسجلة في ذمة هذا الموظف طوال فترة خدمته.
                          </td>
                        </tr>
                      ) : (
                        selectedEmpClearance.all.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 px-3 font-mono font-bold">{item.custodyNumber}</td>
                            <td className="py-2 px-3 font-semibold">{item.itemName}</td>
                            <td className="py-2 px-3">{getCategoryBadge(item.category)}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{item.serialNumber || '-'}</td>
                            <td className="py-2 px-3 font-mono">{item.deliveredDate}</td>
                            <td className="py-2 px-3">
                              {item.status === 'returned' ? (
                                <span className="text-emerald-700 font-bold">تم الاسترجاع والإخلاء ✓</span>
                              ) : (
                                <span className="text-amber-700 font-bold">معلقة في الذمة ⚠</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Formal Signatures */}
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block mb-12">توقيع الموظف المقر بالإخلاء:</span>
                    <div className="border-t border-slate-300 pt-1 text-slate-500 font-sans">
                      {selectedEmpClearance.emp.name}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block mb-12">مسؤول العهد والمستودعات:</span>
                    <div className="border-t border-slate-300 pt-1 text-slate-500">التوقيع والختم</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block mb-12">مدير الموارد البشرية:</span>
                    <div className="border-t border-slate-300 pt-1 text-slate-500">الاعتماد النهائي والختم</div>
                  </div>
                </div>
              </div>
            )}

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};

