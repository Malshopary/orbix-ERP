import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Search,
  Filter,
  Building2,
  FolderKanban,
  Briefcase,
  Layers,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FileText,
  Calendar,
  User,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { CostCenter, CostCenterCategory } from '../types';

export const CostCentersSection: React.FC = () => {
  const {
    costCenters = [],
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
    journalEntries = [],
    currency = 'ر.س',
    formatMoney,
    formatCurrency: formatCurrencyFromContext,
    showAlert,
  } = useErp();

  const formatCurrency = (amount: number): string => {
    if (typeof formatCurrencyFromContext === 'function') {
      return formatCurrencyFromContext(amount);
    }
    if (typeof formatMoney === 'function') {
      return formatMoney(amount);
    }
    return `${Number(amount || 0).toLocaleString()} ${currency}`;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [selectedCenterForMovements, setSelectedCenterForMovements] = useState<CostCenter | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'project' as CostCenterCategory,
    manager: '',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
    isActive: true,
  });

  // Calculate actual expenses and revenues allocated to each cost center from journal entries
  const costCenterFinancials = useMemo(() => {
    const map: Record<string, { expenses: number; revenues: number; entriesCount: number }> = {};

    (costCenters || []).forEach((cc) => {
      if (cc && cc.id) {
        map[cc.id] = { expenses: 0, revenues: 0, entriesCount: 0 };
      }
    });

    (journalEntries || []).forEach((je) => {
      if (!je || !Array.isArray(je.lines)) return;
      je.lines.forEach((line) => {
        if (!line || (!line.costCenterId && !line.costCenterName)) return;

        // Find matched cost center by ID or Code or Name
        const matchedCenter = (costCenters || []).find(
          (c) =>
            c &&
            (c.id === line.costCenterId ||
              c.code === line.costCenterId ||
              c.name === line.costCenterName ||
              (line.costCenterId && c.id.toLowerCase() === line.costCenterId.toLowerCase()))
        );

        if (matchedCenter && map[matchedCenter.id]) {
          map[matchedCenter.id].entriesCount += 1;
          if (line.debit > 0) {
            // Debit usually represents expense or asset cost
            map[matchedCenter.id].expenses += line.debit;
          }
          if (line.credit > 0) {
            // Credit usually represents revenue or recovery
            map[matchedCenter.id].revenues += line.credit;
          }
        }
      });
    });

    return map;
  }, [costCenters, journalEntries]);

  // Key metrics calculation
  const totalBudget = useMemo(() => {
    return costCenters.reduce((sum, cc) => sum + (cc.budget || 0), 0);
  }, [costCenters]);

  const totalActualExpenses = useMemo(() => {
    return (Object.values(costCenterFinancials) as Array<{ expenses: number; revenues: number }>).reduce(
      (sum, fin) => sum + fin.expenses,
      0
    );
  }, [costCenterFinancials]);

  const totalRevenues = useMemo(() => {
    return (Object.values(costCenterFinancials) as Array<{ expenses: number; revenues: number }>).reduce(
      (sum, fin) => sum + fin.revenues,
      0
    );
  }, [costCenterFinancials]);

  // Filtered cost centers
  const filteredCenters = useMemo(() => {
    return costCenters.filter((cc) => {
      const matchesSearch =
        cc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cc.manager && cc.manager.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = categoryFilter === 'all' || cc.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? cc.isActive : !cc.isActive);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [costCenters, searchQuery, categoryFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingCenter(null);
    setFormData({
      code: `CC-${String(costCenters.length + 101)}`,
      name: '',
      category: 'project',
      manager: '',
      budget: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: '',
      isActive: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cc: CostCenter) => {
    setEditingCenter(cc);
    setFormData({
      code: cc.code,
      name: cc.name,
      category: cc.category,
      manager: cc.manager || '',
      budget: cc.budget ? String(cc.budget) : '',
      startDate: cc.startDate || '',
      endDate: cc.endDate || '',
      notes: cc.notes || '',
      isActive: cc.isActive,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى إدخال اسم مركز التكلفة أو المشروع.',
        type: 'warning',
      });
      return;
    }

    if (editingCenter) {
      updateCostCenter(editingCenter.id, {
        code: formData.code.trim(),
        name: formData.name.trim(),
        category: formData.category,
        manager: formData.manager.trim() || undefined,
        budget: formData.budget ? Number(formData.budget) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        notes: formData.notes.trim() || undefined,
        isActive: formData.isActive,
      });
      showAlert({
        title: 'تم تحديث مركز التكلفة',
        message: `تم حفظ تعديلات مركز التكلفة (${formData.name}) بنجاح.`,
        type: 'success',
      });
    } else {
      addCostCenter({
        code: formData.code.trim(),
        name: formData.name.trim(),
        category: formData.category,
        manager: formData.manager.trim() || undefined,
        budget: formData.budget ? Number(formData.budget) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        notes: formData.notes.trim() || undefined,
        isActive: formData.isActive,
      });
      showAlert({
        title: 'تمت إضافة مركز التكلفة',
        message: `تم إنشاء مركز التكلفة (${formData.name}) بنجاح.`,
        type: 'success',
      });
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (cc: CostCenter) => {
    const financials = costCenterFinancials[cc.id];
    if (financials && financials.entriesCount > 0) {
      showAlert({
        title: 'لا يمكن حذف مركز التكلفة',
        message: `هذا المركز مرتبط بعدد (${financials.entriesCount}) حركة مالية وقيد محاسبي. يمكنك إيقاف تفعيله بدلاً من حذفه.`,
        type: 'error',
      });
      return;
    }

    showAlert({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف مركز التكلفة "${cc.name}"؟`,
      type: 'warning',
      confirmText: 'نعم، حذف',
      cancelText: 'إلغاء',
      onConfirm: () => {
        deleteCostCenter(cc.id);
        showAlert({
          title: 'تم الحذف',
          message: 'تم حذف مركز التكلفة بنجاح.',
          type: 'success',
        });
      },
    });
  };

  // Get lines for movements modal
  const movementsForSelectedCenter = useMemo(() => {
    if (!selectedCenterForMovements) return [];
    const lines: Array<{
      journalId: string;
      entryNumber: string;
      date: string;
      description: string;
      debit: number;
      credit: number;
      accountName: string;
      accountCode: string;
    }> = [];

    (journalEntries || []).forEach((je) => {
      if (!je || !Array.isArray(je.lines)) return;
      je.lines.forEach((l) => {
        if (!l) return;
        const isMatched =
          l.costCenterId === selectedCenterForMovements.id ||
          l.costCenterId === selectedCenterForMovements.code ||
          l.costCenterName === selectedCenterForMovements.name;

        if (isMatched) {
          lines.push({
            journalId: je.id,
            entryNumber: je.entryNumber,
            date: je.date,
            description: l.description || je.description,
            debit: l.debit,
            credit: l.credit,
            accountName: l.accountName,
            accountCode: l.accountCode,
          });
        }
      });
    });

    return lines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCenterForMovements, journalEntries]);

  const getCategoryBadge = (cat: CostCenterCategory) => {
    switch (cat) {
      case 'project':
        return { label: 'مشروع', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FolderKanban };
      case 'branch':
        return { label: 'فرع', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Building2 };
      case 'department':
        return { label: 'قسم إداري', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Briefcase };
      case 'activity':
        return { label: 'نشاط / أسطول', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Layers };
      default:
        return { label: 'عام', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: Target };
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card with Summary Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Target className="w-5 h-5" />
              </span>
              <span>مراكز التكلفة والمشاريع (Cost Centers)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              توزيع المصروفات والإيرادات على المشاريع والفروع والأقسام مع مراقبة الموازنات التقديرية بدقة.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مركز تكلفة جديد</span>
          </button>
        </div>

        {/* 4 Financial Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">إجمالي مراكز التكلفة</span>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-black text-slate-900">
              {costCenters.length} <span className="text-xs font-normal text-slate-500">مركز</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-1 font-medium">
              {costCenters.filter((c) => c.isActive).length} مركز نشط
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">إجمالي الموازنات المعتمدة</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-lg font-black text-blue-700">
              {formatCurrency(totalBudget)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium">
              تقديري لجميع المشاريع
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">المصروفات الفعلية المحملة</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-lg font-black text-rose-700">
              {formatCurrency(totalActualExpenses)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium">
              من واقع قيود اليومية المحاسبية
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">الإيرادات المحققة</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-lg font-black text-emerald-700">
              {formatCurrency(totalRevenues)}
            </div>
            <div className="text-[10px] text-emerald-600 mt-1 font-medium">
              عائد المشاريع المباشر
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالكود، الاسم، أو المدير المسؤول..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-medium">التصنيف:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">الكل</option>
              <option value="project">المشاريع</option>
              <option value="branch">الفروع</option>
              <option value="department">الأقسام الإدارية</option>
              <option value="activity">الأنشطة والأسطول</option>
              <option value="general">عام</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[11px] text-slate-500 font-medium">الحالة:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">الكل</option>
              <option value="active">النشطة فقط</option>
              <option value="inactive">الموقوفة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cost Centers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                <th className="py-3 px-4">كود المركز</th>
                <th className="py-3 px-4">اسم مركز التكلفة / المشروع</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">المدير المسؤول</th>
                <th className="py-3 px-4 text-center">الموازنة التقديرية</th>
                <th className="py-3 px-4 text-center">المصروف الفعلي</th>
                <th className="py-3 px-4 text-center">استهلاك الموازنة</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCenters.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Target className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-60" />
                    <p className="font-semibold text-sm">لا توجد مراكز تكلفة مطابقة للبحث</p>
                    <p className="text-xs mt-1 text-slate-400">
                      يمكنك الضغط على زر "إضافة مركز تكلفة جديد" بالأعلى لإنشاء أول مركز.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCenters.map((cc) => {
                  const fin = costCenterFinancials[cc.id] || { expenses: 0, revenues: 0, entriesCount: 0 };
                  const catInfo = getCategoryBadge(cc.category);
                  const Icon = catInfo.icon;
                  const budgetVal = cc.budget || 0;
                  const percentUsed = budgetVal > 0 ? (fin.expenses / budgetVal) * 100 : 0;
                  const isOverBudget = percentUsed > 100;

                  return (
                    <tr key={cc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {cc.code}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cc.name}</div>
                        {cc.notes && <div className="text-[11px] text-slate-400 line-clamp-1">{cc.notes}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.bg}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{catInfo.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {cc.manager ? (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cc.manager}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {budgetVal > 0 ? formatCurrency(budgetVal) : <span className="text-slate-400 font-normal">غير محدد</span>}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-rose-600">
                        {formatCurrency(fin.expenses)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {budgetVal > 0 ? (
                          <div className="w-28 mx-auto space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className={isOverBudget ? 'text-rose-600' : 'text-slate-600'}>
                                {percentUsed.toFixed(0)}%
                              </span>
                              {isOverBudget && (
                                <span className="text-rose-600 flex items-center gap-0.5" title="تجاوز الموازنة">
                                  <AlertTriangle className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOverBudget
                                    ? 'bg-rose-500'
                                    : percentUsed > 80
                                    ? 'bg-amber-500'
                                    : 'bg-indigo-600'
                                }`}
                                style={{ width: `${Math.min(100, percentUsed)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            cc.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={cc.isActive ? 'نشط' : 'موقف'}
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCenterForMovements(cc)}
                            title="عرض كشف الحركات والقيود"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cc)}
                            title="تعديل المركز"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cc)}
                            title="حذف المركز"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingCenter ? 'تعديل بيانات مركز التكلفة' : 'إضافة مركز تكلفة أو مشروع جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    كود المركز <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    placeholder="e.g. CC-105"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    التصنيف <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CostCenterCategory })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="project">مشروع (Project)</option>
                    <option value="branch">فرع (Branch)</option>
                    <option value="department">قسم إداري (Department)</option>
                    <option value="activity">نشاط / أسطول (Activity/Fleet)</option>
                    <option value="general">عام (General)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم مركز التكلفة / المشروع <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  placeholder="e.g. مشروع إنشاء وتشطيب فرع التجمع"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    المدير المسؤول
                  </label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    placeholder="اسم المهندس أو المدير المسؤول"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الموازنة التقديرية ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    تاريخ الانتهاء المتوقع
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ملاحظات وتفاصيل
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  placeholder="تفاصيل إضافية عن نطاق المشروع أو مركز التكلفة..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="centerIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="centerIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  مركز التكلفة نشط ومتاح لتحميل القيود والمصروفات عليه
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingCenter ? 'حفظ التعديلات' : 'إضافة المركز'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENTS MODAL FOR SELECTED COST CENTER */}
      {selectedCenterForMovements && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>كشف حساب وحركات مركز التكلفة:</span>
                  <span className="text-indigo-600 font-mono">({selectedCenterForMovements.code})</span>
                  <span>{selectedCenterForMovements.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  جميع البنود والقيود المحاسبية المحملة على هذا المركز
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCenterForMovements(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {movementsForSelectedCenter.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-60" />
                  <p className="font-semibold text-sm">لا توجد حركات أو قيود مسجلة على هذا المركز حتى الآن</p>
                  <p className="text-xs text-slate-400 mt-1">
                    عند إدخال قيود محاسبية أو سندات صرف واختيار مركز التكلفة ستظهر هنا تلقائياً.
                  </p>
                </div>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 bg-slate-50/70">
                      <th className="py-2.5 px-3">التاريخ</th>
                      <th className="py-2.5 px-3">رقم القيد</th>
                      <th className="py-2.5 px-3">الحساب المحاسبي</th>
                      <th className="py-2.5 px-3">البيان والشرح</th>
                      <th className="py-2.5 px-3 text-center">مدين</th>
                      <th className="py-2.5 px-3 text-center">دائن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {movementsForSelectedCenter.map((m, idx) => (
                      <tr key={`${m.journalId}-${idx}`} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{m.date}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{m.entryNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">{m.accountName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">({m.accountCode})</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{m.description}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-600 font-mono">
                          {m.debit > 0 ? formatCurrency(m.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-600 font-mono">
                          {m.credit > 0 ? formatCurrency(m.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/80 font-bold text-xs border-t border-slate-200">
                      <td colSpan={4} className="py-2.5 px-3 text-slate-800">
                        الإجمالي المحمل على المركز:
                      </td>
                      <td className="py-2.5 px-3 text-center text-rose-700 font-mono">
                        {formatCurrency(movementsForSelectedCenter.reduce((s, m) => s + m.debit, 0))}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-700 font-mono">
                        {formatCurrency(movementsForSelectedCenter.reduce((s, m) => s + m.credit, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCenterForMovements(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
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
