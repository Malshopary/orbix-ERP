import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Play,
  Search,
  Filter,
  Layers,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingDown,
  Calendar,
  Clock,
  History,
  Tag,
  ArrowUpRight,
  ShieldCheck,
  PackageCheck,
  Flame,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { FixedAsset, AssetDepreciationRun } from '../types';

export const FixedAssetsSection: React.FC = () => {
  const {
    fixedAssets = [],
    assetDepreciationRuns = [],
    accounts = [],
    costCenters = [],
    addFixedAsset,
    updateFixedAsset,
    deleteFixedAsset,
    runAssetDepreciation,
    disposeFixedAsset,
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

  const [activeSubTab, setActiveSubTab] = useState<'assets' | 'runs'>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [isDepreciationModalOpen, setIsDepreciationModalOpen] = useState(false);
  const [depreciationPeriod, setDepreciationPeriod] = useState(
    new Date().toISOString().slice(0, 7) // e.g. "2026-09"
  );
  const [depreciationNotes, setDepreciationNotes] = useState('');

  // Asset Disposal Modal State
  const [disposingAsset, setDisposingAsset] = useState<FixedAsset | null>(null);
  const [disposalReason, setDisposalReason] = useState<'sold' | 'scrapped'>('sold');
  const [saleAmount, setSaleAmount] = useState('');
  const [receivingAccountId, setReceivingAccountId] = useState('');
  const [disposalNotes, setDisposalNotes] = useState('');

  // Form states for Add/Edit Asset
  const [formData, setFormData] = useState({
    assetCode: '',
    name: '',
    category: 'أجهزة ومعدات تقنية',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    salvageValue: '0',
    usefulLifeMonths: '60',
    depreciationMethod: 'straight_line' as const,
    assetAccountId: '',
    accumulatedDepreciationAccountId: '',
    depreciationExpenseAccountId: '',
    costCenterId: '',
    location: '',
    status: 'active' as const,
    notes: '',
  });

  // Calculate high-level KPIs
  const totalHistoricalCost = useMemo(() => {
    return fixedAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  }, [fixedAssets]);

  const totalAccumulatedDepreciation = useMemo(() => {
    return fixedAssets.reduce((sum, a) => sum + (a.currentDepreciation || 0), 0);
  }, [fixedAssets]);

  const totalBookValue = useMemo(() => {
    return fixedAssets.reduce((sum, a) => sum + (a.bookValue || 0), 0);
  }, [fixedAssets]);

  const totalMonthlyDepreciation = useMemo(() => {
    return fixedAssets
      .filter((a) => a.status === 'active' && a.bookValue > (a.salvageValue || 0))
      .reduce((sum, a) => sum + (a.monthlyDepreciation || 0), 0);
  }, [fixedAssets]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return fixedAssets.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.costCenterName && a.costCenterName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [fixedAssets, searchQuery, categoryFilter, statusFilter]);

  // Unique categories list
  const assetCategories = useMemo(() => {
    const set = new Set(fixedAssets.map((a) => a.category));
    return Array.from(set);
  }, [fixedAssets]);

  const handleOpenAdd = () => {
    setEditingAsset(null);
    const assetAcc = accounts.find((a) => a.code.startsWith('12')) || accounts[0];
    const accumAcc = accounts.find((a) => a.code === '1240') || accounts[0];
    const expAcc = accounts.find((a) => a.code === '5800') || accounts[0];

    setFormData({
      assetCode: `AST-${String(fixedAssets.length + 1).padStart(3, '0')}`,
      name: '',
      category: 'أجهزة ومعدات تقنية',
      serialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: '',
      salvageValue: '0',
      usefulLifeMonths: '60',
      depreciationMethod: 'straight_line',
      assetAccountId: assetAcc?.id || '',
      accumulatedDepreciationAccountId: accumAcc?.id || '',
      depreciationExpenseAccountId: expAcc?.id || '',
      costCenterId: costCenters[0]?.id || '',
      location: 'المقر الرئيسي',
      status: 'active',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (ast: FixedAsset) => {
    setEditingAsset(ast);
    setFormData({
      assetCode: ast.assetCode,
      name: ast.name,
      category: ast.category,
      serialNumber: ast.serialNumber || '',
      purchaseDate: ast.purchaseDate,
      purchaseCost: String(ast.purchaseCost),
      salvageValue: String(ast.salvageValue || 0),
      usefulLifeMonths: String(ast.usefulLifeMonths),
      depreciationMethod: ast.depreciationMethod,
      assetAccountId: ast.assetAccountId,
      accumulatedDepreciationAccountId: ast.accumulatedDepreciationAccountId,
      depreciationExpenseAccountId: ast.depreciationExpenseAccountId,
      costCenterId: ast.costCenterId || '',
      location: ast.location || '',
      status: ast.status,
      notes: ast.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = Number(formData.purchaseCost);
    if (!formData.name.trim() || isNaN(cost) || cost <= 0) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى إدخال اسم الأصل وتكلفة شراء صحيحة أكبر من الصفر.',
        type: 'warning',
      });
      return;
    }

    const selectedCC = costCenters.find((c) => c.id === formData.costCenterId);
    const selectedAssetAcc = accounts.find((a) => a.id === formData.assetAccountId);

    if (editingAsset) {
      updateFixedAsset(editingAsset.id, {
        assetCode: formData.assetCode.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        serialNumber: formData.serialNumber.trim() || undefined,
        purchaseDate: formData.purchaseDate,
        purchaseCost: cost,
        salvageValue: Number(formData.salvageValue) || 0,
        usefulLifeMonths: Number(formData.usefulLifeMonths) || 60,
        depreciationMethod: formData.depreciationMethod,
        assetAccountId: formData.assetAccountId,
        assetAccountCode: selectedAssetAcc?.code,
        accumulatedDepreciationAccountId: formData.accumulatedDepreciationAccountId,
        depreciationExpenseAccountId: formData.depreciationExpenseAccountId,
        costCenterId: formData.costCenterId || undefined,
        costCenterName: selectedCC?.name || undefined,
        location: formData.location.trim() || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      });
      showAlert({
        title: 'تم تحديث بيانات الأصل',
        message: `تم حفظ بيانات الأصل الثابت (${formData.name}) بنجاح.`,
        type: 'success',
      });
    } else {
      addFixedAsset({
        assetCode: formData.assetCode.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        serialNumber: formData.serialNumber.trim() || undefined,
        purchaseDate: formData.purchaseDate,
        purchaseCost: cost,
        salvageValue: Number(formData.salvageValue) || 0,
        usefulLifeMonths: Number(formData.usefulLifeMonths) || 60,
        depreciationMethod: formData.depreciationMethod,
        assetAccountId: formData.assetAccountId,
        assetAccountCode: selectedAssetAcc?.code,
        accumulatedDepreciationAccountId: formData.accumulatedDepreciationAccountId,
        depreciationExpenseAccountId: formData.depreciationExpenseAccountId,
        costCenterId: formData.costCenterId || undefined,
        costCenterName: selectedCC?.name || undefined,
        location: formData.location.trim() || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      });
      showAlert({
        title: 'تم تسجيل الأصل الثابت',
        message: `تم إدراج الأصل (${formData.name}) واحتساب قسط الإهلاك الشهري له بنجاح.`,
        type: 'success',
      });
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (ast: FixedAsset) => {
    if (ast.currentDepreciation > 0) {
      showAlert({
        title: 'لا يمكن حذف الأصل',
        message: `تم تسجيل إهلاك تراكمي لهذا الأصل بقيمة ${formatCurrency(ast.currentDepreciation)}. يمكنك استبعاده أو تخريده بدلاً من الحذف للحفاظ على دقة القوائم المالية.`,
        type: 'error',
      });
      return;
    }

    showAlert({
      title: 'تأكيد حذف الأصل',
      message: `هل أنت متأكد من حذف بطاقة الأصل "${ast.name}"؟`,
      type: 'warning',
      confirmText: 'نعم، حذف',
      cancelText: 'إلغاء',
      onConfirm: () => {
        deleteFixedAsset(ast.id);
        showAlert({
          title: 'تم الحذف',
          message: 'تم حذف بطاقة الأصل الثابت بنجاح.',
          type: 'success',
        });
      },
    });
  };

  const handleExecuteDepreciationRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depreciationPeriod) return;

    // Check if a run already exists for this period
    const existingRun = assetDepreciationRuns.find((r) => r.periodMonth === depreciationPeriod);
    if (existingRun) {
      showAlert({
        title: 'تحذير تكرار دورة الإهلاك',
        message: `تم تشغيل دورة الإهلاك لشهر (${depreciationPeriod}) مسبقاً بالقيد رقم (${existingRun.journalEntryNumber}). هل ترغب في إعادة التشغيل؟`,
        type: 'warning',
        confirmText: 'نعم، تشغيل مجدداً',
        cancelText: 'إلغاء',
        onConfirm: () => {
          const run = runAssetDepreciation(depreciationPeriod, depreciationNotes);
          setIsDepreciationModalOpen(false);
          if (run) {
            showAlert({
              title: 'تم تشغيل دورة الإهلاك الآلي',
              message: `تم بنجاح احتساب إهلاك ${run.assetsCount} أصل ثابت بمبلغ إجمالي ${formatCurrency(run.totalDepreciationAmount)} وقيدها بالدفاتر بالقيد ${run.journalEntryNumber}.`,
              type: 'success',
            });
          }
        },
      });
      return;
    }

    const run = runAssetDepreciation(depreciationPeriod, depreciationNotes);
    setIsDepreciationModalOpen(false);
    if (run) {
      showAlert({
        title: 'تم تشغيل دورة الإهلاك الآلي',
        message: `تم بنجاح احتساب إهلاك ${run.assetsCount} أصل ثابت بمبلغ إجمالي ${formatCurrency(run.totalDepreciationAmount)} وقيدها بالدفاتر بالقيد ${run.journalEntryNumber}.`,
        type: 'success',
      });
    }
  };

  const handleOpenDisposal = (ast: FixedAsset) => {
    setDisposingAsset(ast);
    setDisposalReason('sold');
    setSaleAmount(String(ast.bookValue));
    const cashAcc = accounts.find((a) => a.code === '1110') || accounts[0];
    setReceivingAccountId(cashAcc?.id || '');
    setDisposalNotes('');
  };

  const handleExecuteDisposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposingAsset) return;

    const amount = disposalReason === 'sold' ? Number(saleAmount) || 0 : 0;
    disposeFixedAsset(
      disposingAsset.id,
      disposalReason,
      amount,
      disposalReason === 'sold' ? receivingAccountId : undefined,
      disposalNotes
    );

    setDisposingAsset(null);
    showAlert({
      title: 'تم استبعاد الأصل الثابت',
      message: `تم بنجاح تسجيل ${disposalReason === 'sold' ? `بيع الأصل بمبلغ ${formatCurrency(amount)}` : 'تخريد الأصل'} وتوليد القيد المحاسبي بالدفاتر.`,
      type: 'success',
    });
  };

  const getStatusBadge = (status: FixedAsset['status']) => {
    switch (status) {
      case 'active':
        return { label: 'نشط ويعمل', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'fully_depreciated':
        return { label: 'مهلك دفترياً', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'sold':
        return { label: 'تم البيع', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'scrapped':
        return { label: 'مخرد / مستبعد', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'تحت الصيانة', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card with Summary Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Building className="w-5 h-5" />
              </span>
              <span>الأصول الثابتة والإهلاك الآلي (Fixed Assets)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              إدارة سجل الأصول، احتساب أقساط الإهلاك شهرياً وتوليد قيود التسوية آلياً، ومعالجة البيع والتخريد.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsDepreciationModalOpen(true)}
              className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-purple-700" />
              <span>تشغيل دورة الإهلاك الآلي</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أصل ثابت</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">التكلفة التاريخية للأصول</span>
              <Building className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-black text-slate-900">
              {formatCurrency(totalHistoricalCost)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium">
              إجمالي {fixedAssets.length} أصل مسجل
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">مجمع الإهلاك التراكمي</span>
              <TrendingDown className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-black text-amber-700">
              {formatCurrency(totalAccumulatedDepreciation)}
            </div>
            <div className="text-[10px] text-amber-600 mt-1 font-medium">
              حساب (1240) مجمع الإهلاك
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">صافي القيمة الدفترية</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-lg font-black text-emerald-700">
              {formatCurrency(totalBookValue)}
            </div>
            <div className="text-[10px] text-emerald-600 mt-1 font-medium">
              قيمة الأصول الحالية بالميزانية
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">قسط الإهلاك الشهري التقديري</span>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-lg font-black text-purple-700">
              {formatCurrency(totalMonthlyDepreciation)}
            </div>
            <div className="text-[10px] text-purple-600 mt-1 font-medium">
              يُحمل شهرياً على الأرباح والخسائر
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Asset Register vs Depreciation Runs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('assets')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'assets'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>سجل الأصول الثابتة ({fixedAssets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('runs')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'runs'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل دورات الإهلاك المحاسبي ({assetDepreciationRuns.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'assets' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الأصل، الكود، السيريال، أو المركز..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500 font-medium">الفئة:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="all">الكل</option>
                  {assetCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
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
                  <option value="active">نشط</option>
                  <option value="fully_depreciated">مهلك دفترياً</option>
                  <option value="sold">تم البيع</option>
                  <option value="scrapped">مخرد</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assets Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                    <th className="py-3 px-4">كود الأصل</th>
                    <th className="py-3 px-4">بيان الأصل وتصنيفه</th>
                    <th className="py-3 px-4">مركز التكلفة / الموقع</th>
                    <th className="py-3 px-4 text-center">تكلفة الشراء</th>
                    <th className="py-3 px-4 text-center">مجمع الإهلاك</th>
                    <th className="py-3 px-4 text-center">القيمة الدفترية</th>
                    <th className="py-3 px-4 text-center">الإهلاك الشهري</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Building className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-semibold text-sm">لا توجد أصول مطابقة للبحث</p>
                        <p className="text-xs mt-1 text-slate-400">
                          اضغط على "إضافة أصل ثابت" لتسجيل المعدات والآلات والسيارات.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((ast) => {
                      const statusInfo = getStatusBadge(ast.status);
                      const percentDep =
                        ast.purchaseCost > 0 ? (ast.currentDepreciation / ast.purchaseCost) * 100 : 0;

                      return (
                        <tr key={ast.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              {ast.assetCode}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{ast.name}</div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-sm border border-purple-100 font-semibold">
                                {ast.category}
                              </span>
                              {ast.serialNumber && <span>S/N: {ast.serialNumber}</span>}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            <div className="font-medium text-slate-800">
                              {ast.costCenterName || <span className="text-slate-400 text-[11px]">عام</span>}
                            </div>
                            {ast.location && (
                              <div className="text-[10px] text-slate-400">{ast.location}</div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono">
                            {formatCurrency(ast.purchaseCost)}
                          </td>

                          <td className="py-3 px-4 text-center font-mono">
                            <div className="font-bold text-amber-700">
                              {formatCurrency(ast.currentDepreciation)}
                            </div>
                            <div className="text-[10px] text-slate-400">{percentDep.toFixed(0)}% مهلك</div>
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-emerald-700 font-mono">
                            {formatCurrency(ast.bookValue)}
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {ast.status === 'active' && ast.bookValue > (ast.salvageValue || 0) ? (
                              formatCurrency(ast.monthlyDepreciation)
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {ast.status === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDisposal(ast)}
                                  title="استبعاد أو بيع الأصل"
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(ast)}
                                title="تعديل بيانات الأصل"
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(ast)}
                                title="حذف الأصل"
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
        </div>
      )}

      {activeSubTab === 'runs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                    <th className="py-3 px-4">تاريخ المعالجة</th>
                    <th className="py-3 px-4">شهر / فترة الإهلاك</th>
                    <th className="py-3 px-4 text-center">عدد الأصول المعالجة</th>
                    <th className="py-3 px-4 text-center">إجمالي مبلغ الإهلاك</th>
                    <th className="py-3 px-4 text-center">رقم القيد الآلي</th>
                    <th className="py-3 px-4">الموظف المسؤول</th>
                    <th className="py-3 px-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {assetDepreciationRuns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <History className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-semibold text-sm">لم يتم تشغيل دورات إهلاك حتى الآن</p>
                        <p className="text-xs text-slate-400 mt-1">
                          اضغط على زر "تشغيل دورة الإهلاك الآلي" بالأعلى لاحتساب إهلاك الشهر الحالي وتوليد القيد.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    assetDepreciationRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {run.runDate ? run.runDate.split('T')[0] : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs border border-purple-100 font-mono">
                            {run.periodMonth}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {run.assetsCount} أصل
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-rose-600">
                          {formatCurrency(run.totalDepreciationAmount)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600">
                          {run.journalEntryNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{run.processedBy}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                          {run.notes || '-'}
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

      {/* ADD / EDIT ASSET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingAsset ? 'تعديل بيانات الأصل الثابت' : 'تسجيل وإدراج أصل ثابت جديد'}
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

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    كود الأصل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.assetCode}
                    onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    placeholder="AST-001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    تصنيف الأصل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    placeholder="e.g. سيارات ومركبات، أجهزة حاسوب..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم ووصف الأصل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  placeholder="e.g. خادم مركزي Dell PowerEdge R750"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    تكلفة الشراء ({currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-mono"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    قيمة الخردة / النفاية ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.salvageValue}
                    onChange={(e) => setFormData({ ...formData, salvageValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-mono"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    العمر الإنتاجي (بالأشهر)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usefulLifeMonths}
                    onChange={(e) => setFormData({ ...formData, usefulLifeMonths: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-mono"
                    placeholder="60 (5 سنوات)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    تاريخ الشراء والبدء
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الرقم التسلسلي (Serial No)
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    placeholder="SN-XXXX-YYYY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    مركز التكلفة المرتبط
                  </label>
                  <select
                    value={formData.costCenterId}
                    onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">-- بدون مركز تكلفة (عام) --</option>
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.code} - {cc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الموقع أو الفرع
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    placeholder="e.g. غرفة السيرفرات - الدور الأرضي"
                  />
                </div>
              </div>

              {/* Accounts linkage */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>الربط بالحسابات في شجرة الحسابات (دليل الحسابات)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      حساب الأصل (أصول)
                    </label>
                    <select
                      value={formData.assetAccountId}
                      onChange={(e) => setFormData({ ...formData, assetAccountId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-800 focus:outline-hidden"
                    >
                      {accounts
                        .filter((a) => a.type === 'asset')
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      حساب مجمع الإهلاك
                    </label>
                    <select
                      value={formData.accumulatedDepreciationAccountId}
                      onChange={(e) =>
                        setFormData({ ...formData, accumulatedDepreciationAccountId: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-800 focus:outline-hidden"
                    >
                      {accounts
                        .filter((a) => a.type === 'asset' || a.code.startsWith('12'))
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      حساب مصروف الإهلاك
                    </label>
                    <select
                      value={formData.depreciationExpenseAccountId}
                      onChange={(e) =>
                        setFormData({ ...formData, depreciationExpenseAccountId: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-800 focus:outline-hidden"
                    >
                      {accounts
                        .filter((a) => a.type === 'expense')
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  placeholder="ملاحظات الصيانة أو الضمان..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
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
                  {editingAsset ? 'حفظ التعديلات' : 'تسجيل الأصل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RUN AUTOMATED DEPRECIATION MODAL */}
      {isDepreciationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">تشغيل دورة الإهلاك الآلي</h3>
                  <p className="text-[11px] text-slate-500">احتساب الإهلاك وتوليد القيد المحاسبي آلياً</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDepreciationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteDepreciationRun} className="p-5 space-y-4">
              <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>آلية المعالجة المحاسبية التلقائية:</span>
                </div>
                <p className="text-[11px] text-purple-700 leading-relaxed">
                  سيتم احتساب القسط الشهري لجميع الأصول النشطة المستحقة، وترحيل قيد اليومية:
                  <br />
                  <strong>من حـ/ مصروف إهلاك الأصول الثابتة (5800)</strong>
                  <br />
                  <strong>إلى حـ/ مجمع إهلاك الأصول الثابتة (1240)</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  فترة / شهر الإهلاك <span className="text-rose-500">*</span>
                </label>
                <input
                  type="month"
                  required
                  value={depreciationPeriod}
                  onChange={(e) => setDepreciationPeriod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات وبيان الدورة</label>
                <input
                  type="text"
                  value={depreciationNotes}
                  onChange={(e) => setDepreciationNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-purple-500"
                  placeholder={`دورة الإهلاك الشهري لشهر ${depreciationPeriod}`}
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                <span className="text-slate-600">إجمالي الإهلاك المتوقع:</span>
                <span className="font-black text-purple-700 text-sm font-mono">
                  {formatCurrency(totalMonthlyDepreciation)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDepreciationModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>تأكيد وتشغيل القيد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPOSAL / SALE MODAL */}
      {disposingAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">استبعاد أو بيع أصل ثابت</h3>
                  <p className="text-[11px] text-slate-500">{disposingAsset.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisposingAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteDisposal} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDisposalReason('sold')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    disposalReason === 'sold'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  بيع الأصل (متحصلات نقدية)
                </button>
                <button
                  type="button"
                  onClick={() => setDisposalReason('scrapped')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    disposalReason === 'scrapped'
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  تخريد واستبعاد (دون بيع)
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">التكلفة التاريخية للأصل:</span>
                  <span className="font-mono font-bold">{formatCurrency(disposingAsset.purchaseCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مجمع الإهلاك المسجل:</span>
                  <span className="font-mono font-bold text-amber-600">
                    {formatCurrency(disposingAsset.currentDepreciation)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="font-semibold text-slate-700">صافي القيمة الدفترية:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatCurrency(disposingAsset.bookValue)}
                  </span>
                </div>
              </div>

              {disposalReason === 'sold' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      سعر البيع المحصل ({currency}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={saleAmount}
                      onChange={(e) => setSaleAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      الحساب المستلم للمتحصلات (الخزينة أو البنك)
                    </label>
                    <select
                      value={receivingAccountId}
                      onChange={(e) => setReceivingAccountId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    >
                      {accounts
                        .filter((a) => a.code.startsWith('111') || a.code.startsWith('112') || a.type === 'asset')
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات وسبب الاستبعاد</label>
                <input
                  type="text"
                  value={disposalNotes}
                  onChange={(e) => setDisposalNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  placeholder="سبب الاستبعاد أو بيانات المشتري..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDisposingAsset(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  تأكيد وترحيل القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
