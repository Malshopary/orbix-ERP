import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { ChequeItem, ChequeType, ChequeStatus } from '../types';
import {
  CreditCard,
  PlusCircle,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Printer,
  Building,
  Calendar,
  DollarSign,
  Landmark,
  Clock,
  AlertTriangle,
  FileText,
  RotateCcw,
  CheckCircle2,
  Coins,
  Send,
  Ban,
  Filter,
} from 'lucide-react';

export const ChequesPortfolioSection: React.FC = () => {
  const {
    cheques,
    addCheque,
    updateCheque,
    depositCheque,
    collectCheque,
    bounceCheque,
    cancelCheque,
    deleteCheque,
    accounts,
    customers,
    vendors,
    currency,
    formatMoney,
    showAlert,
    showConfirm,
  } = useErp();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ChequeType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ChequeStatus>('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'due_soon' | 'overdue'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositModalCheque, setDepositModalCheque] = useState<ChequeItem | null>(null);
  const [depositBankId, setDepositBankId] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);

  const [bounceModalCheque, setBounceModalCheque] = useState<ChequeItem | null>(null);
  const [bounceReason, setBounceReason] = useState('عدم كفاية الرصيد لدى الساحب');
  const [bounceDate, setBounceDate] = useState(new Date().toISOString().split('T')[0]);

  const [printCheque, setPrintCheque] = useState<ChequeItem | null>(null);

  // Form State for Adding Cheque
  const [formType, setFormType] = useState<ChequeType>('received');
  const [formChequeNumber, setFormChequeNumber] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formIssueDate, setFormIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formPartyType, setFormPartyType] = useState<'customer' | 'vendor' | 'other'>('customer');
  const [formPartyId, setFormPartyId] = useState('');
  const [formPartyName, setFormPartyName] = useState('');
  const [formBankName, setFormBankName] = useState('البنك التجاري الدولي (CIB)');
  const [formBranchName, setFormBranchName] = useState('الفرع الرئيسي');
  const [formNotes, setFormNotes] = useState('');

  // Bank Accounts (asset accounts under 1100 or code 1120)
  const bankAccounts = useMemo(() => {
    return accounts.filter(
      (a) =>
        !a.isHeader &&
        (a.code.startsWith('112') || a.name.includes('بنك') || a.name.toLowerCase().includes('bank'))
    );
  }, [accounts]);

  // Set default deposit bank
  React.useEffect(() => {
    if (bankAccounts.length > 0 && !depositBankId) {
      setDepositBankId(bankAccounts[0].id);
    }
  }, [bankAccounts, depositBankId]);

  // Stats calculation
  const todayStr = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const received = cheques.filter((c) => c.type === 'received');
    const issued = cheques.filter((c) => c.type === 'issued');

    const totalReceivedAmount = received.reduce((sum, c) => sum + c.amount, 0);
    const underCollection = received.filter((c) => c.status === 'under_collection');
    const underCollectionAmount = underCollection.reduce((sum, c) => sum + c.amount, 0);

    const collected = received.filter((c) => c.status === 'collected');
    const collectedAmount = collected.reduce((sum, c) => sum + c.amount, 0);

    const inPortfolio = received.filter((c) => c.status === 'in_portfolio');
    const inPortfolioAmount = inPortfolio.reduce((sum, c) => sum + c.amount, 0);

    const bounced = cheques.filter((c) => c.status === 'bounced');
    const bouncedAmount = bounced.reduce((sum, c) => sum + c.amount, 0);

    const totalIssuedAmount = issued.reduce((sum, c) => sum + c.amount, 0);
    const pendingIssued = issued.filter((c) => c.status !== 'collected' && c.status !== 'cancelled');
    const pendingIssuedAmount = pendingIssued.reduce((sum, c) => sum + c.amount, 0);

    // Overdue or due soon (within 7 days)
    const overdueCount = cheques.filter((c) => {
      if (c.status === 'collected' || c.status === 'cancelled') return false;
      return c.dueDate < todayStr;
    }).length;

    return {
      totalReceivedAmount,
      underCollectionCount: underCollection.length,
      underCollectionAmount,
      collectedCount: collected.length,
      collectedAmount,
      inPortfolioCount: inPortfolio.length,
      inPortfolioAmount,
      bouncedCount: bounced.length,
      bouncedAmount,
      totalIssuedAmount,
      pendingIssuedCount: pendingIssued.length,
      pendingIssuedAmount,
      overdueCount,
    };
  }, [cheques, todayStr]);

  // Filtered Cheques
  const filteredCheques = useMemo(() => {
    return cheques.filter((c) => {
      // Type
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;

      // Status
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Due filter
      if (dueFilter === 'overdue') {
        if (c.status === 'collected' || c.status === 'cancelled') return false;
        if (c.dueDate >= todayStr) return false;
      } else if (dueFilter === 'due_soon') {
        if (c.status === 'collected' || c.status === 'cancelled') return false;
        const diffDays = (new Date(c.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = c.chequeNumber.toLowerCase().includes(q);
        const matchParty = c.partyName.toLowerCase().includes(q);
        const matchBank = c.bankName.toLowerCase().includes(q);
        const matchNotes = (c.notes || '').toLowerCase().includes(q);
        if (!matchNum && !matchParty && !matchBank && !matchNotes) return false;
      }

      return true;
    });
  }, [cheques, typeFilter, statusFilter, dueFilter, searchQuery, todayStr]);

  // Handle party select
  const handlePartyChange = (id: string) => {
    setFormPartyId(id);
    if (formPartyType === 'customer') {
      const found = customers.find((c) => c.id === id);
      if (found) setFormPartyName(found.name);
    } else if (formPartyType === 'vendor') {
      const found = vendors.find((v) => v.id === id);
      if (found) setFormPartyName(found.name);
    }
  };

  // Submit Add Cheque Form
  const handleSubmitAddCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChequeNumber.trim() || !formAmount || Number(formAmount) <= 0) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى إدخال رقم الشيك ومبلغ صحيح أكبر من الصفر.',
        type: 'warning',
      });
      return;
    }

    if (!formPartyName.trim()) {
      showAlert({
        title: 'اسم الطرف مفقود',
        message: 'يرجى إدخال اسم العميل أو المورد صاحب الشيك.',
        type: 'warning',
      });
      return;
    }

    addCheque({
      chequeNumber: formChequeNumber.trim(),
      type: formType,
      amount: Number(formAmount),
      issueDate: formIssueDate,
      dueDate: formDueDate,
      partyType: formPartyType,
      partyId: formPartyId || undefined,
      partyName: formPartyName.trim(),
      bankName: formBankName.trim() || 'بنك تجاري',
      branchName: formBranchName.trim() || 'الفرع الرئيسي',
      status: 'in_portfolio',
      notes: formNotes.trim(),
    });

    showAlert({
      title: 'تم تسجيل الشيك بنجاح',
      message: `تمت إضافة الشيك رقم ${formChequeNumber} إلى حافظة الأوراق المالية (${formType === 'received' ? 'ورقة قبض' : 'ورقة دفع'}).`,
      type: 'success',
    });

    setShowAddModal(false);
    setFormChequeNumber('');
    setFormAmount('');
    setFormPartyName('');
    setFormNotes('');
  };

  // Confirm Deposit Cheque
  const handleConfirmDeposit = () => {
    if (!depositModalCheque) return;
    const selectedBank = bankAccounts.find((b) => b.id === depositBankId) || bankAccounts[0];
    depositCheque(
      depositModalCheque.id,
      selectedBank ? selectedBank.id : '1120',
      selectedBank ? selectedBank.name : 'الحساب البنكي الجاري الرئيسي',
      depositDate
    );

    showAlert({
      title: 'تم إيداع الشيك برسم التحصيل',
      message: `تم تحويل الشيك رقم ${depositModalCheque.chequeNumber} إلى حالة "برسم التحصيل" بحساب ${selectedBank ? selectedBank.name : 'البنك'}.`,
      type: 'success',
    });

    setDepositModalCheque(null);
  };

  // Confirm Bounce Cheque
  const handleConfirmBounce = () => {
    if (!bounceModalCheque) return;
    if (!bounceReason.trim()) {
      showAlert({
        title: 'سبب الارتداد مطلوب',
        message: 'يرجى تحديد سبب ارتداد الشيك من البنك.',
        type: 'warning',
      });
      return;
    }

    bounceCheque(bounceModalCheque.id, bounceReason.trim(), bounceDate);

    showAlert({
      title: 'تم قيد ارتداد الشيك',
      message: `تم تسجيل ارتداد الشيك رقم ${bounceModalCheque.chequeNumber} وإعادة قيد مديونية العميل وإنشاء قيد اليومية العكسي.`,
      type: 'error',
    });

    setBounceModalCheque(null);
  };

  // Status Badge Helper
  const getStatusBadge = (status: ChequeStatus) => {
    switch (status) {
      case 'in_portfolio':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            بالخزينة (حافظة)
          </span>
        );
      case 'under_collection':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Landmark className="w-3 h-3" />
            برسم التحصيل بالبنك
          </span>
        );
      case 'collected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            تم التحصيل والصرف
          </span>
        );
      case 'bounced':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            شيك مرتد (مرفوض)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Ban className="w-3 h-3" />
            ملغى
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  حافظة الشيكات وأوراق القبض والدفع (PDC Portfolio)
                </h1>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  إدارة الأوراق المالية
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                متابعة دورة حياة الشيكات المؤجلة: الاستلام، الإيداع بالبنك برسم التحصيل، التحصيل الفعلي، معالجة الارتداد، والقيود المحاسبية التلقائية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-add-cheque"
              onClick={() => {
                setFormType('received');
                setFormPartyType('customer');
                setShowAddModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة شيك وارد (ورقة قبض)
            </button>
            <button
              type="button"
              id="btn-add-issued-cheque"
              onClick={() => {
                setFormType('issued');
                setFormPartyType('vendor');
                setShowAddModal(true);
              }}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              إصدار شيك لمورد (ورقة دفع)
            </button>
          </div>
        </div>

        {/* Statistical Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">أوراق قبض بالخزينة</span>
            <span className="text-lg font-black text-amber-600">{formatMoney(stats.inPortfolioAmount)}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">{stats.inPortfolioCount} شيكات مؤجلة</span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">برسم التحصيل بالبنوك</span>
            <span className="text-lg font-black text-blue-600">{formatMoney(stats.underCollectionAmount)}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">{stats.underCollectionCount} قيد المقاصة</span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">تم تحصيلها بنجاح</span>
            <span className="text-lg font-black text-emerald-600">{formatMoney(stats.collectedAmount)}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">{stats.collectedCount} شيكات مقبوضة</span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">شيكات مرتدة (مرفوضة)</span>
            <span className="text-lg font-black text-rose-600">{formatMoney(stats.bouncedAmount)}</span>
            <span className="text-[11px] text-rose-500 font-bold block mt-0.5">{stats.bouncedCount} بحاجة لمتابعة</span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 col-span-2 md:col-span-1">
            <span className="text-slate-400 text-xs font-semibold block mb-1">أوراق دفع مستحقة للموردين</span>
            <span className="text-lg font-black text-purple-600">{formatMoney(stats.pendingIssuedAmount)}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">{stats.pendingIssuedCount} شيكات صادرة</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الشيك، العميل، المورد، البنك..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('received')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'received' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              أوراق قبض (وارد)
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('issued')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'issued' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              أوراق دفع (صادر)
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value="in_portfolio">بالخزينة (حافظة)</option>
            <option value="under_collection">برسم التحصيل بالبنك</option>
            <option value="collected">تم التحصيل / الصرف</option>
            <option value="bounced">مرتد (مرفوض)</option>
            <option value="cancelled">ملغى</option>
          </select>

          {/* Due Status Filter */}
          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">كل تواريخ الاستحقاق</option>
            <option value="due_soon">مستحق خلال 7 أيام</option>
            <option value="overdue">متأخر عن موعد الاستحقاق</option>
          </select>
        </div>
      </div>

      {/* Cheques Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-4">رقم الشيك</th>
                <th className="p-4">النوع والاتجاه</th>
                <th className="p-4">الطرف (الساحب / المستفيد)</th>
                <th className="p-4">البنك المسحوب عليه</th>
                <th className="p-4">تاريخ التحرير</th>
                <th className="p-4">تاريخ الاستحقاق</th>
                <th className="p-4">حساب الإيداع بالبنك</th>
                <th className="p-4">حالة الشيك</th>
                <th className="p-4 text-left">المبلغ</th>
                <th className="p-4 text-center">الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredCheques.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
                    <p className="font-bold text-sm text-slate-600">لا توجد شيكات مطابقة لمعايير البحث الحالية</p>
                    <p className="text-xs text-slate-400 mt-1">
                      قم بإضافة شيكات واردة من العملاء أو شيكات صادرة للموردين لبدء إدارة حافظة الشيكات.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCheques.map((chq) => {
                  const isOverdue =
                    chq.dueDate < todayStr && chq.status !== 'collected' && chq.status !== 'cancelled';
                  return (
                    <tr key={chq.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Cheque Number */}
                      <td className="p-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{chq.chequeNumber}</span>
                          {isOverdue && (
                            <span
                              title="تاريخ الاستحقاق قد انقضى"
                              className="text-rose-500"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-4">
                        {chq.type === 'received' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3" />
                            ورقة قبض (وارد)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ArrowUpRight className="w-3 h-3" />
                            ورقة دفع (صادر)
                          </span>
                        )}
                      </td>

                      {/* Party */}
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{chq.partyName}</span>
                        {chq.notes && (
                          <span className="text-[11px] text-slate-400 truncate max-w-xs block mt-0.5">
                            {chq.notes}
                          </span>
                        )}
                      </td>

                      {/* Bank */}
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{chq.bankName}</span>
                        </div>
                        {chq.branchName && (
                          <span className="text-[11px] text-slate-400 block pr-5">
                            {chq.branchName}
                          </span>
                        )}
                      </td>

                      {/* Issue Date */}
                      <td className="p-4 text-slate-500 whitespace-nowrap">{chq.issueDate}</td>

                      {/* Due Date */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {chq.dueDate}
                        </span>
                      </td>

                      {/* Deposit Account */}
                      <td className="p-4 text-slate-600 max-w-[160px] truncate">
                        {chq.depositBankAccountName ? (
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {chq.depositBankAccountName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">غير محدد</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {getStatusBadge(chq.status)}
                        {chq.statusDate && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            بتاريخ: {chq.statusDate}
                          </span>
                        )}
                        {chq.status === 'bounced' && chq.bounceReason && (
                          <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">
                            سبب: {chq.bounceReason}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="p-4 text-left font-black text-sm text-slate-900 whitespace-nowrap">
                        {formatMoney(chq.amount)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Deposit for Collection Button (for received cheques in portfolio) */}
                          {chq.type === 'received' && chq.status === 'in_portfolio' && (
                            <button
                              type="button"
                              onClick={() => {
                                setDepositModalCheque(chq);
                                setDepositDate(todayStr);
                              }}
                              title="إيداع الشيك برسم التحصيل بالبنك"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border border-blue-200"
                            >
                              <Landmark className="w-4 h-4" />
                            </button>
                          )}

                          {/* Collect Button (cash collected / debited) */}
                          {chq.status !== 'collected' && chq.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                showConfirm(
                                  `هل تريد تأكيد تحصيل وقيد الشيك رقم (${chq.chequeNumber}) بقيمة ${formatMoney(chq.amount)} بالبنك؟ سيتم إنشاء قيد يومية آلي فوري.`,
                                  () => collectCheque(chq.id),
                                  'تأكيد تحصيل الشيك',
                                  'تأكيد التحصيل'
                                );
                              }}
                              title="تأكيد تحصيل الشيك وإضافته لحساب البنك"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors border border-emerald-200"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Bounce Button */}
                          {chq.status === 'under_collection' && (
                            <button
                              type="button"
                              onClick={() => {
                                setBounceModalCheque(chq);
                                setBounceDate(todayStr);
                              }}
                              title="تسجيل ارتداد الشيك من البنك"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-rose-200"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print Button */}
                          <button
                            type="button"
                            onClick={() => setPrintCheque(chq)}
                            title="طباعة إشعار الشيك"
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              showConfirm(
                                `هل أنت متأكد من حذف الشيك رقم "${chq.chequeNumber}" من الحافظة؟`,
                                () => deleteCheque(chq.id),
                                'حذف شيك',
                                'حذف'
                              );
                            }}
                            title="حذف الشيك"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* MODAL 1: ADD CHEQUE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {formType === 'received' ? 'إضافة شيك وارد (ورقة قبض)' : 'إصدار شيك لمورد (ورقة دفع)'}
                  </h3>
                  <p className="text-xs text-slate-500">تسجيل بيانات الشيك بدقة لمتابعة التحصيل والاستحقاق</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddCheque} className="space-y-4 mt-4">
              {/* Cheque Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('received');
                    setFormPartyType('customer');
                  }}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === 'received'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  شيك وارد من عميل (ورقة قبض)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('issued');
                    setFormPartyType('vendor');
                  }}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === 'issued'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  شيك صادر لمورد (ورقة دفع)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cheque Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الشيك *</label>
                  <input
                    type="text"
                    required
                    value={formChequeNumber}
                    onChange={(e) => setFormChequeNumber(e.target.value)}
                    placeholder="مثال: CHQ-992810"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المبلغ ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التحرير / الإصدار *</label>
                  <input
                    type="date"
                    required
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الاستحقاق والصرف *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Party Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {formType === 'received' ? 'العميل الساحب *' : 'المورد المستفيد *'}
                </label>
                {formType === 'received' ? (
                  <select
                    value={formPartyId}
                    onChange={(e) => handlePartyChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- اختر من قائمة العملاء المسجلين --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={formPartyId}
                    onChange={(e) => handlePartyChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- اختر من قائمة الموردين المسجلين --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.phone ? `(${v.phone})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  required
                  value={formPartyName}
                  onChange={(e) => setFormPartyName(e.target.value)}
                  placeholder="أو اكتب اسم الطرف مباشرة..."
                  className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Bank & Branch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البنك المسحوب عليه</label>
                  <input
                    type="text"
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    placeholder="مثال: البنك الأهلي المصري، CIB..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفرع</label>
                  <input
                    type="text"
                    value={formBranchName}
                    onChange={(e) => setFormBranchName(e.target.value)}
                    placeholder="مثال: فرع التجمع الخامس"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات ورقم الفاتورة المرتبطة</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="سداد دفعة عن فاتورة مبيعات / مشتريات أو رقم مرجع..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ الشيك بالحافظة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DEPOSIT CHEQUE FOR COLLECTION */}
      {depositModalCheque && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">إيداع الشيك برسم التحصيل</h3>
                  <p className="text-xs text-slate-500">رقم: {depositModalCheque.chequeNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDepositModalCheque(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">المبلغ:</span>
                  <span className="font-black text-slate-900">{formatMoney(depositModalCheque.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الساحب:</span>
                  <span className="font-bold text-slate-800">{depositModalCheque.partyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاريخ الاستحقاق:</span>
                  <span className="font-bold text-slate-800">{depositModalCheque.dueDate}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اختر الحساب البنكي للإيداع والتحصيل *
                </label>
                <select
                  value={depositBankId}
                  onChange={(e) => setDepositBankId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ إيداع الشيك بالبنك *</label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDepositModalCheque(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDeposit}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs"
              >
                تأكيد الإيداع بالبنك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BOUNCE CHEQUE MODAL */}
      {bounceModalCheque && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">تسجيل ارتداد الشيك (مرفوض)</h3>
                  <p className="text-xs text-slate-500">رقم: {bounceModalCheque.chequeNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBounceModalCheque(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4">
              <div className="bg-rose-50/50 rounded-2xl p-3 border border-rose-100 text-xs text-rose-800 space-y-1">
                <p className="font-bold">تنبيه محاسبي مهم:</p>
                <p>
                  سيؤدي تسجيل الارتداد إلى إعادة إثبات مديونية العميل بقيمة {formatMoney(bounceModalCheque.amount)} تلقائياً في دفتر الأستاذ، وإصدار قيد يومية عكسي.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب الارتداد البنكي *</label>
                <select
                  value={bounceReason}
                  onChange={(e) => setBounceReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-rose-500 cursor-pointer"
                >
                  <option value="عدم كفاية الرصيد لدى الساحب">عدم كفاية الرصيد لدى الساحب (No Sufficient Funds)</option>
                  <option value="اختلاف توقيع الساحب عن النموذج المعتمد">اختلاف توقيع الساحب عن النموذج المعتمد</option>
                  <option value="تجميد أو إغلاق حساب الساحب">تجميد أو إغلاق حساب الساحب</option>
                  <option value="اعتراض الساحب على الصرف رسمياً">اعتراض الساحب على الصرف رسمياً</option>
                  <option value="خطأ أو شطب في كتابة المبلغ أو التاريخ">خطأ أو شطب في كتابة المبلغ أو التاريخ</option>
                  <option value="تقادم تاريخ الشيك (انقضاء المدة القانونية)">تقادم تاريخ الشيك (انقضاء المدة القانونية)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ إشعار الارتداد *</label>
                <input
                  type="date"
                  value={bounceDate}
                  onChange={(e) => setBounceDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBounceModalCheque(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmBounce}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs"
              >
                تأكيد قيد الارتداد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINT CHEQUE SLIP MODAL */}
      {printCheque && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  إشعار شيك مالي / ورقة تجارية
                </h3>
                <p className="text-xs text-slate-500">حافظة الشيكات وأوراق القبض والدفع</p>
              </div>
              <button
                type="button"
                onClick={() => setPrintCheque(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip Content */}
            <div className="my-6 p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3.5 text-xs font-medium">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">رقم الشيك:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{printCheque.chequeNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">نوع الورقة:</span>
                <span className="font-bold">
                  {printCheque.type === 'received' ? 'ورقة قبض (واردة من عميل)' : 'ورقة دفع (صادرة لمورد)'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">اسم الطرف:</span>
                <span className="font-bold text-slate-900">{printCheque.partyName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">البنك والفرع:</span>
                <span>{printCheque.bankName} - {printCheque.branchName || 'الرئيسي'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">تاريخ التحرير:</span>
                <span>{printCheque.issueDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">تاريخ الاستحقاق:</span>
                <span className="font-bold text-indigo-700">{printCheque.dueDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">الحالة الحالية:</span>
                <span>{getStatusBadge(printCheque.status)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-600 font-black text-sm">المبلغ الإجمالي:</span>
                <span className="font-black text-slate-900 text-base">{formatMoney(printCheque.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                طباعة الإشعار
              </button>
              <button
                type="button"
                onClick={() => setPrintCheque(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
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
