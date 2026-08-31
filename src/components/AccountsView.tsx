import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import {
  Account,
  AccountType,
  JournalEntry,
  JournalLine,
  PaymentReceipt,
  Customer,
  PriceList,
  SalesRep,
  CommissionPayment,
  CommissionTier,
  LoyaltyTransaction,
} from '../types';
import { CustomerStatementModal } from './CustomerStatementModal';
import {
  BookOpenCheck,
  PlusCircle,
  FolderTree,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  Trash2,
  Receipt,
  CreditCard,
  Percent,
  Award,
  Tag,
  DollarSign,
  Send,
  Printer,
  Copy,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Users2,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    journalEntries,
    customers,
    salesInvoices,
    receipts,
    salesReps,
    priceLists,
    products,
    commissionPayments,
    commissionTiers,
    loyaltyTransactions,
    debtAging,
    currency,
    formatMoney,
    canDeleteEntity,
    addAccount,
    editAccount,
    deleteAccount,
    addJournalEntry,
    editJournalEntry,
    deleteJournalEntry,
    addReceiptVoucher,
    deletePaymentReceipt,
    addPriceList,
    updatePriceList,
    deletePriceList,
    updateProduct,
    addCommissionPayment,
    deleteCommissionPayment,
    addCommissionTier,
    updateCommissionTier,
    deleteCommissionTier,
    adjustLoyaltyPoints,
    updateCustomer,
    hasPermission,
    activeSubTab,
    setActiveSubTab,
    showAlert,
    showConfirm,
  } = useErp();

  // Primary Accounts Subtab
  const [activeTab, setActiveTabLocal] = useState<
    'chart' | 'journal' | 'collections' | 'commissions' | 'loyalty' | 'pricelists'
  >('chart');

  // Sync with activeSubTab from sidebar
  React.useEffect(() => {
    if (
      activeSubTab &&
      ['chart', 'journal', 'collections', 'commissions', 'loyalty', 'pricelists'].includes(activeSubTab)
    ) {
      setActiveTabLocal(activeSubTab as any);
    }
  }, [activeSubTab]);

  const setActiveTab = (tab: 'chart' | 'journal' | 'collections' | 'commissions' | 'loyalty' | 'pricelists') => {
    setActiveTabLocal(tab);
    setActiveSubTab(tab);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all');

  // Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showEditJournalModal, setShowEditJournalModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCommissionPayoutModal, setShowCommissionPayoutModal] = useState(false);
  const [showPriceListModal, setShowPriceListModal] = useState(false);
  const [showLoyaltyAdjustModal, setShowLoyaltyAdjustModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [statementCustomerId, setStatementCustomerId] = useState<string | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<PaymentReceipt | null>(null);

  // New Account Form state
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('asset');
  const [newAccParent, setNewAccParent] = useState('');
  const [newAccDesc, setNewAccDesc] = useState('');

  // Edit Account Form state
  const [editAccId, setEditAccId] = useState('');
  const [editAccCode, setEditAccCode] = useState('');
  const [editAccName, setEditAccName] = useState('');
  const [editAccType, setEditAccType] = useState<AccountType>('asset');
  const [editAccParent, setEditAccParent] = useState('');
  const [editAccDesc, setEditAccDesc] = useState('');

  // New Journal Entry Form state
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryRef, setEntryRef] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [journalLines, setJournalLines] = useState<JournalLine[]>([
    {
      accountId: accounts[2]?.id || '',
      accountCode: accounts[2]?.code || '',
      accountName: accounts[2]?.name || '',
      debit: 0,
      credit: 0,
      description: '',
    },
    {
      accountId: accounts[3]?.id || '',
      accountCode: accounts[3]?.code || '',
      accountName: accounts[3]?.name || '',
      debit: 0,
      credit: 0,
      description: '',
    },
  ]);

  // Edit Journal Entry Form state
  const [editJeId, setEditJeId] = useState('');
  const [editJeNumber, setEditJeNumber] = useState('');
  const [editJeDate, setEditJeDate] = useState('');
  const [editJeRef, setEditJeRef] = useState('');
  const [editJeDesc, setEditJeDesc] = useState('');
  const [editJeLines, setEditJeLines] = useState<JournalLine[]>([]);

  // Receipt / Collection Form State
  const [recCustomerId, setRecCustomerId] = useState('');
  const [recInvoiceId, setRecInvoiceId] = useState('');
  const [recAmount, setRecAmount] = useState<number>(1000);
  const [recAccountId, setRecAccountId] = useState(accounts[2]?.id || 'acc-cash');
  const [recMethod, setRecMethod] = useState<PaymentReceipt['paymentMethod']>('cash');
  const [recDate, setRecDate] = useState(new Date().toISOString().split('T')[0]);
  const [recNotes, setRecNotes] = useState('');

  // Commission Payout Form State
  const [commRepId, setCommRepId] = useState('');
  const [commAmount, setCommAmount] = useState<number>(500);
  const [commAccountId, setCommAccountId] = useState(accounts[2]?.id || 'acc-cash');
  const [commMethod, setCommMethod] = useState<PaymentReceipt['paymentMethod']>('cash');
  const [commDate, setCommDate] = useState(new Date().toISOString().split('T')[0]);
  const [commPeriod, setCommPeriod] = useState(`شهر ${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}`);
  const [commNotes, setCommNotes] = useState('');

  // Price List Form State
  const [plName, setPlName] = useState('');
  const [plDesc, setPlDesc] = useState('');
  const [plAdjType, setPlAdjType] = useState<'discount' | 'markup'>('discount');
  const [plAdjValType, setPlAdjValType] = useState<'percentage' | 'fixed'>('percentage');
  const [plAdjValue, setPlAdjValue] = useState<number>(5);
  const [plIsDefault, setPlIsDefault] = useState(false);

  // Price Matrix Inline Editing State (Double click to edit)
  const [editingCell, setEditingCell] = useState<{ productId: string; colKey: string } | null>(null);
  const [editingVal, setEditingVal] = useState<string>('');
  const [savedCellFlash, setSavedCellFlash] = useState<string | null>(null);

  const startEditingPrice = (productId: string, colKey: string, initialPrice: number) => {
    setEditingCell({ productId, colKey });
    setEditingVal(String(initialPrice));
  };

  const commitEditingPrice = () => {
    if (!editingCell) return;
    const { productId, colKey } = editingCell;
    const newPrice = parseFloat(editingVal);

    if (isNaN(newPrice) || newPrice < 0) {
      setEditingCell(null);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      setEditingCell(null);
      return;
    }

    if (colKey === 'standard') {
      // Direct update of product selling price -> synchronizes across products & warehouse inventory
      updateProduct(productId, { sellingPrice: newPrice });
      setSavedCellFlash(`${productId}-standard`);
      setTimeout(() => setSavedCellFlash(null), 1500);
    } else {
      const targetPl = priceLists.find((pl) => pl.id === colKey);
      if (targetPl) {
        if (targetPl.isDefault) {
          updateProduct(productId, { sellingPrice: newPrice });
        }

        const existingItems = targetPl.items ? [...targetPl.items] : [];
        const existingIdx = existingItems.findIndex((it) => it.productId === productId);
        if (existingIdx >= 0) {
          existingItems[existingIdx] = {
            ...existingItems[existingIdx],
            price: newPrice,
            customPrice: newPrice,
          };
        } else {
          existingItems.push({
            productId: productId,
            price: newPrice,
            customPrice: newPrice,
          });
        }

        updatePriceList(targetPl.id, { items: existingItems });
        setSavedCellFlash(`${productId}-${colKey}`);
        setTimeout(() => setSavedCellFlash(null), 1500);
      }
    }

    setEditingCell(null);
  };

  // Loyalty Adjustment Form State
  const [loyaltyPartyType, setLoyaltyPartyType] = useState<'customer' | 'sales_rep'>('customer');
  const [loyaltyPartyId, setLoyaltyPartyId] = useState('');
  const [loyaltyDelta, setLoyaltyDelta] = useState<number>(50);
  const [loyaltyReason, setLoyaltyReason] = useState('مكافأة ولاء وحافز مبيعات تشجيعي');

  // Reminder message target
  const [reminderTarget, setReminderTarget] = useState<{ customer: Customer; overdueAmount: number } | null>(null);

  // Debit/Credit math for manual journal
  const totalDebit = journalLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = journalLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const editTotalDebit = editJeLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const editTotalCredit = editJeLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isEditBalanced = Math.abs(editTotalDebit - editTotalCredit) < 0.001 && editTotalDebit > 0;

  // Hierarchical Accounts Generator (Parents followed immediately by their sub-accounts)
  const hierarchicalAccounts = useMemo(() => {
    const codeToAcc = new Map<string, Account>();
    const idToAcc = new Map<string, Account>();

    accounts.forEach((acc) => {
      codeToAcc.set(acc.code, acc);
      idToAcc.set(acc.id, acc);
    });

    const getParentCode = (acc: Account): string | undefined => {
      if (acc.parentCode && (codeToAcc.has(acc.parentCode) || idToAcc.has(acc.parentCode))) {
        if (codeToAcc.has(acc.parentCode)) return acc.parentCode;
        const byId = idToAcc.get(acc.parentCode);
        if (byId) return byId.code;
      }
      if (acc.code.includes('-')) {
        const prefix = acc.code.split('-')[0];
        if (codeToAcc.has(prefix)) return prefix;
      }
      return undefined;
    };

    const childrenMap = new Map<string, Account[]>();
    const isChild = new Set<string>();

    accounts.forEach((acc) => {
      const parentCode = getParentCode(acc);
      if (parentCode && parentCode !== acc.code) {
        const list = childrenMap.get(parentCode) || [];
        list.push(acc);
        childrenMap.set(parentCode, list);
        isChild.add(acc.id);
      }
    });

    const compareCodes = (a: Account, b: Account) => {
      return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
    };

    const roots = accounts.filter((acc) => !isChild.has(acc.id));
    roots.sort(compareCodes);

    const result: (Account & { treeLevel: number; hasChildren: boolean; parentAccountName?: string })[] = [];
    const visited = new Set<string>();

    const traverse = (node: Account, level: number) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);

      const children = childrenMap.get(node.code) || [];
      children.sort(compareCodes);

      const parentCode = getParentCode(node);
      const parentAcc = parentCode ? codeToAcc.get(parentCode) : undefined;

      result.push({
        ...node,
        treeLevel: level,
        hasChildren: children.length > 0,
        parentAccountName: parentAcc ? `${parentAcc.code} - ${parentAcc.name}` : undefined,
      });

      children.forEach((child) => {
        traverse(child, level + 1);
      });
    };

    roots.forEach((root) => traverse(root, 0));

    // Handle any unvisited disconnected accounts
    accounts.forEach((acc) => {
      if (!visited.has(acc.id)) {
        result.push({
          ...acc,
          treeLevel: 0,
          hasChildren: false,
        });
      }
    });

    return result;
  }, [accounts]);

  // Filtered accounts based on search query and type filter while strictly preserving tree hierarchy
  const filteredAccounts = useMemo(() => {
    return hierarchicalAccounts.filter((acc) => {
      const matchSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.code.includes(searchQuery) ||
        (acc.description && acc.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === 'all' || acc.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [hierarchicalAccounts, searchQuery, typeFilter]);

  // Account Handlers
  const handleOpenEditAccount = (acc: Account) => {
    setEditAccId(acc.id);
    setEditAccCode(acc.code);
    setEditAccName(acc.name);
    setEditAccType(acc.type);
    setEditAccParent(acc.parentCode || '');
    setEditAccDesc(acc.description || '');
    setShowEditAccountModal(true);
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccCode || !editAccName) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى تعبئة رمز الحساب واسم الحساب.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    editAccount(editAccId, {
      code: editAccCode,
      name: editAccName,
      type: editAccType,
      parentCode: editAccParent || undefined,
      description: editAccDesc,
    });
    setShowEditAccountModal(false);
  };

  const handleDeleteAccount = (acc: Account) => {
    const check = canDeleteEntity('account', acc.id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف الحساب (${acc.name} - ${acc.code})`,
        message: 'لا يمكن حذف الحساب من شجرة الحسابات:',
        details: check.reason,
        note: 'لحماية سلامة وتوازن الدفاتر المحاسبية، لا يمكن حذف حساب مسجل عليه حركات أو متفرع منه حسابات.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    showConfirm(
      `هل أنت متأكد من حذف الحساب "${acc.name}" (${acc.code}) من دليل الحسابات؟`,
      () => {
        deleteAccount(acc.id);
      },
      `تأكيد حذف الحساب (${acc.code})`,
      'حذف نهائي'
    );
  };

  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccCode || !newAccName) {
      showAlert({
        title: 'بيانات ناقصة',
        message: 'يرجى إدخال رمز الحساب واسم الحساب لاستكمال الإضافة.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    addAccount({
      code: newAccCode.trim(),
      name: newAccName.trim(),
      type: newAccType,
      parentCode: newAccParent ? newAccParent.trim() : undefined,
      balance: 0,
      description: newAccDesc.trim() || undefined,
    });
    setNewAccCode('');
    setNewAccName('');
    setNewAccDesc('');
    setShowAddAccountModal(false);
  };

  // Journal Handlers
  const handleAddLine = () => {
    setJournalLines((prev) => [
      ...prev,
      {
        accountId: accounts[0]?.id || '',
        accountCode: accounts[0]?.code || '',
        accountName: accounts[0]?.name || '',
        debit: 0,
        credit: 0,
        description: '',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (journalLines.length <= 2) {
      showAlert({
        title: 'تنبيه محاسبي',
        message: 'يجب أن يحتوي القيد على سطرين على الأقل (مدين ودائن) لتحقيق التوازن المحاسبي المزدوج.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    setJournalLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index: number, field: keyof JournalLine, value: any) => {
    setJournalLines((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'accountId') {
        const found = accounts.find((a) => a.id === value);
        if (found) {
          target.accountId = found.id;
          target.accountCode = found.code;
          target.accountName = found.name;
        }
      } else {
        (target as any)[field] = value;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleSaveJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      showAlert({
        title: 'القيد غير متوازن',
        message: 'يجب أن يتساوى إجمالي المدين مع إجمالي الدائن قبل ترحيل القيد لدفتر الأستاذ.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const success = addJournalEntry({
      entryNumber: `JV-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: entryDate,
      reference: entryRef || 'قيد يدوي',
      description: entryDesc || 'قيد تسوية يدوي',
      lines: journalLines.map((l) => ({
        ...l,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      })),
      isPosted: true,
      isAutomatic: false,
    });

    if (success) {
      setShowJournalModal(false);
      setEntryDesc('');
      setEntryRef('');
    }
  };

  // Receipt / Collection Handler
  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recCustomerId || !recAmount || recAmount <= 0) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى اختيار العميل وتحديد مبلغ التحصيل بشكل صحيح.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    const cust = customers.find((c) => c.id === recCustomerId);
    if (!cust) return;

    addReceiptVoucher({
      type: 'collection',
      partyId: cust.id,
      partyName: cust.name,
      amount: Number(recAmount),
      date: recDate,
      paymentMethod: recMethod,
      accountId: recAccountId,
      invoiceId: recInvoiceId || undefined,
      notes: recNotes.trim() || `سند تحصيل وقبض نقدي/بنكي من العميل ${cust.name}`,
    });

    setShowReceiptModal(false);
    setRecNotes('');
    setRecInvoiceId('');
  };

  // Commission Payout Handler
  const handleSaveCommissionPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commRepId || !commAmount || commAmount <= 0) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى اختيار مندوب المبيعات وتحديد مبلغ العمولة المنصرفة.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    const rep = salesReps.find((r) => r.id === commRepId);
    if (!rep) return;

    addCommissionPayment({
      salesRepId: rep.id,
      salesRepName: rep.name,
      amount: Number(commAmount),
      date: commDate,
      period: commPeriod,
      paymentMethod: commMethod,
      accountId: commAccountId,
      notes: commNotes.trim() || undefined,
    });

    setShowCommissionPayoutModal(false);
    setCommNotes('');
  };

  // Price List Handler
  const handleSavePriceList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plName.trim()) {
      showAlert({
        title: 'حقل إلزامي',
        message: 'يرجى إدخال اسم قائمة الأسعار.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    const valNum = Number(plAdjValue) || 0;
    addPriceList({
      name: plName.trim(),
      description: plDesc.trim() || undefined,
      adjustmentType: plAdjType,
      adjustmentValueType: plAdjValType,
      adjustmentValue: valNum,
      discountPercent: plAdjType === 'discount' && plAdjValType === 'percentage' ? valNum : 0,
      discountPercentage: plAdjType === 'discount' && plAdjValType === 'percentage' ? valNum : 0,
      isDefault: plIsDefault,
      items: [],
    });
    setPlName('');
    setPlDesc('');
    setPlAdjType('discount');
    setPlAdjValType('percentage');
    setPlAdjValue(5);
    setPlIsDefault(false);
    setShowPriceListModal(false);
  };

  // Loyalty Adjustment Handler
  const handleSaveLoyaltyAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltyPartyId || !loyaltyDelta) {
      showAlert({
        title: 'بيانات ناقصة',
        message: 'يرجى اختيار المستفيد وتحديد عدد النقاط المراد تسويتها.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    adjustLoyaltyPoints(
      loyaltyPartyType,
      loyaltyPartyId,
      Number(loyaltyDelta),
      loyaltyReason.trim() || 'تسوية رصيد نقاط',
      'سند تسوية نقاط'
    );
    setShowLoyaltyAdjustModal(false);
    setLoyaltyReason('مكافأة ولاء وحافز مبيعات تشجيعي');
  };

  // Collections metrics
  const totalReceivables = customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  const totalCollectionsMonth = receipts
    .filter((r) => r.type === 'collection')
    .reduce((sum, r) => sum + r.amount, 0);

  // Commission metrics
  const totalCommissionsEarned = salesReps.reduce((sum, r) => sum + (r.totalCommissionEarned || 0), 0);
  const totalCommissionsPaid = salesReps.reduce((sum, r) => sum + (r.paidCommissions || 0), 0);
  const pendingCommissions = Math.max(0, totalCommissionsEarned - totalCommissionsPaid);

  // Loyalty metrics
  const totalCustomerPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Primary Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  الحسابات المالية والتحصيلات والعمولات
                </h1>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  نظام مالي موحد
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                شجرة الحسابات، قيود اليومية، سندات القبض والتحصيل، عمولات المناديب، نقاط الولاء، وقوائم أسعار المنتجات.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons Depending on Active Subtab */}
          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'chart' && (
              <button
                type="button"
                id="btn-add-account"
                onClick={() => setShowAddAccountModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                إضافة حساب جديد
              </button>
            )}
            {activeTab === 'journal' && (
              <button
                type="button"
                id="btn-add-journal"
                onClick={() => setShowJournalModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                إنشاء قيد يومية جديد
              </button>
            )}
            {activeTab === 'collections' && (
              <button
                type="button"
                id="btn-add-receipt"
                onClick={() => setShowReceiptModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Receipt className="w-4 h-4" />
                إصدار سند قبض وتحصيل
              </button>
            )}
            {activeTab === 'commissions' && (
              <button
                type="button"
                id="btn-payout-commission"
                onClick={() => setShowCommissionPayoutModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <CreditCard className="w-4 h-4" />
                سند صرف عمولة مندوب
              </button>
            )}
            {activeTab === 'loyalty' && (
              <button
                type="button"
                id="btn-adjust-loyalty"
                onClick={() => setShowLoyaltyAdjustModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Award className="w-4 h-4" />
                تسوية / منح نقاط ولاء
              </button>
            )}
            {activeTab === 'pricelists' && (
              <button
                type="button"
                id="btn-add-pricelist"
                onClick={() => setShowPriceListModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Tag className="w-4 h-4" />
                إضافة قائمة أسعار جديدة
              </button>
            )}
          </div>
        </div>

        {/* Global Financial Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي ذمم العملاء (مدين)</span>
            <span className="text-lg font-black text-rose-600">{formatMoney(totalReceivables)}</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">تحصيلات الشهر الحالية</span>
            <span className="text-lg font-black text-emerald-600">{formatMoney(totalCollectionsMonth)}</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">عمولات مناديب مستحقة</span>
            <span className="text-lg font-black text-indigo-600">{formatMoney(pendingCommissions)}</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">نقاط الولاء النشطة</span>
            <span className="text-lg font-black text-purple-600">{totalCustomerPoints} نقطة</span>
          </div>
        </div>

        {/* Subtabs Bar */}
        <div className="flex flex-wrap gap-2 mt-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'chart'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            شجرة ودليل الحسابات ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'journal'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            سجل قيود اليومية ({journalEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'collections'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Receipt className="w-4 h-4" />
            التحصيلات وسندات القبض وأعمار الديون
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'commissions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            عمولات المناديب وسندات الصرف
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'loyalty'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Award className="w-4 h-4" />
            نقاط الولاء والمكافآت
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricelists')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'pricelists'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Tag className="w-4 h-4" />
            قوائم الأسعار وتسعير العملاء ({priceLists.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CHART OF ACCOUNTS */}
      {activeTab === 'chart' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برمز الحساب أو الاسم..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {(['all', 'asset', 'liability', 'equity', 'revenue', 'expense'] as const).map((t) => {
                const labels: Record<string, string> = {
                  all: 'الكل',
                  asset: 'الأصول (1)',
                  liability: 'الخصوم (2)',
                  equity: 'حقوق الملكية (3)',
                  revenue: 'الإيرادات (4)',
                  expense: 'المصروفات (5)',
                };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      typeFilter === t
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-4">رمز الحساب</th>
                    <th className="p-4">اسم الحساب المالي</th>
                    <th className="p-4">نوع الحساب</th>
                    <th className="p-4">الحساب الرئيسي</th>
                    <th className="p-4">الوصف / الغرض</th>
                    <th className="p-4 text-left">الرصيد الحالي</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.map((acc) => {
                    const isAutoCreatedCust = acc.code.startsWith('1130-');
                    const isAutoCreatedVend = acc.code.startsWith('2110-');
                    const isAutoCreatedEmp = acc.code.startsWith('2130-');
                    const isRoot = acc.treeLevel === 0;
                    const isLevel1 = acc.treeLevel === 1;
                    const isSubAccount = acc.treeLevel >= 2;

                    return (
                      <tr
                        key={acc.id}
                        className={`transition-colors ${
                          isRoot
                            ? 'bg-slate-100/75 hover:bg-slate-100 font-bold border-t border-slate-200'
                            : isLevel1
                            ? 'bg-slate-50/50 hover:bg-slate-50 font-semibold'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="p-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            {acc.code}
                          </div>
                        </td>
                        <td className="p-4">
                          <div
                            className={`flex items-center gap-2 ${
                              isRoot
                                ? 'font-black text-slate-900 text-sm'
                                : isLevel1
                                ? 'font-bold text-slate-800'
                                : 'font-medium text-slate-700'
                            }`}
                            style={{ paddingRight: `${Math.min(acc.treeLevel * 20, 60)}px` }}
                          >
                            {acc.treeLevel > 0 && (
                              <span className="text-slate-400 font-mono text-sm select-none shrink-0">
                                ↳
                              </span>
                            )}
                            <span>{acc.name}</span>
                            {isRoot && (
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                رئيسي جذر
                              </span>
                            )}
                            {acc.hasChildren && !isRoot && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                رئيسي فرعي
                              </span>
                            )}
                            {isAutoCreatedCust && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                                عميل
                              </span>
                            )}
                            {isAutoCreatedVend && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                                مورد
                              </span>
                            )}
                            {isAutoCreatedEmp && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200">
                                موظف
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              acc.type === 'asset'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : acc.type === 'liability'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : acc.type === 'equity'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : acc.type === 'revenue'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {acc.type === 'asset' && 'أصول'}
                            {acc.type === 'liability' && 'خصوم'}
                            {acc.type === 'equity' && 'حقوق ملكية'}
                            {acc.type === 'revenue' && 'إيرادات'}
                            {acc.type === 'expense' && 'مصروفات'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-600">
                          {isRoot ? (
                            <span className="text-slate-400 text-xs italic">حساب رئيسي جذر</span>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-400">↳</span>
                              <span className="font-medium text-slate-800">
                                {acc.parentAccountName || acc.parentCode}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 max-w-xs truncate">
                          {acc.description || '—'}
                        </td>
                        <td className="p-4 text-left font-mono font-bold text-slate-900">
                          {formatMoney(acc.balance)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAccount(acc)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="تعديل الحساب"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="حذف الحساب"
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
          </div>
        </div>
      )}

      {/* SUBTAB 2: JOURNAL ENTRIES */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 text-sm">سجل قيود اليومية العامة (General Journal)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                كافة القيود الآلية الصادرة من المبيعات، المشتريات، التحصيلات، والقيود اليدوية المتوازنة.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowJournalModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة قيد تسوية
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {journalEntries.map((je) => (
              <div key={je.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                      {je.entryNumber}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{je.description}</h4>
                    {je.isAutomatic && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                        توليد آلي ({je.sourceModule || 'نظام'})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>التاريخ: {je.date}</span>
                    <span>المرجع: {je.reference || '—'}</span>
                    <button
                      type="button"
                      onClick={() => deleteJournalEntry(je.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                      title="حذف القيد"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="text-slate-400 text-[11px] font-semibold border-b border-slate-200 pb-1">
                        <th className="pb-1.5">كود الحساب</th>
                        <th className="pb-1.5">اسم الحساب</th>
                        <th className="pb-1.5">البيان</th>
                        <th className="pb-1.5 text-left text-emerald-700">مدين (Debit)</th>
                        <th className="pb-1.5 text-left text-blue-700">دائن (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 font-mono text-[11px]">
                      {je.lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-white/60">
                          <td className="py-1.5 font-bold text-slate-700">{line.accountCode}</td>
                          <td className="py-1.5 font-sans font-semibold text-slate-800">{line.accountName}</td>
                          <td className="py-1.5 font-sans text-slate-500">{line.description || '—'}</td>
                          <td className="py-1.5 text-left text-emerald-700 font-bold">
                            {line.debit > 0 ? formatMoney(line.debit) : '—'}
                          </td>
                          <td className="py-1.5 text-left text-blue-700 font-bold">
                            {line.credit > 0 ? formatMoney(line.credit) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: COLLECTIONS, VOUCHERS & DEBT AGING */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          {/* Debt Aging Brackets */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm">تقرير أعمار الديون والمطالبات المتأخرة</h3>
                <p className="text-xs text-slate-500 mt-0.5">تصنيف مبالغ الديون المستحقة حسب فترات التأخير الزمني</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Receipt className="w-4 h-4" />
                تحصيل دفعة
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {debtAging.map((bucket, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-4 border ${
                    i === 0
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : i === 1
                      ? 'bg-blue-50/50 border-blue-200 text-blue-950'
                      : i === 2
                      ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                      : 'bg-rose-50/50 border-rose-200 text-rose-950'
                  }`}
                >
                  <span className="text-xs font-bold block mb-1 text-slate-600">{bucket.range}</span>
                  <div className="text-lg font-black">{formatMoney(bucket.totalAmount)}</div>
                  <span className="text-[11px] text-slate-500 font-semibold block mt-1">
                    {bucket.customerCount} عميل مستحق
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customers Outstanding Balances Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-sm">متابعة أرصدة العملاء وسندات القبض</h3>
              <span className="text-xs text-slate-500 font-bold">
                إجمالي الديون: {formatMoney(totalReceivables)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-4">كود العميل</th>
                    <th className="p-4">اسم العميل / الشركة</th>
                    <th className="p-4">المندوب المسؤول</th>
                    <th className="p-4">الحد الائتماني</th>
                    <th className="p-4">الرصيد المستحق</th>
                    <th className="p-4 text-center">إجراءات التحصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers
                    .filter((c) => c.currentBalance > 0)
                    .map((cust) => {
                      const rep = salesReps.find((r) => r.id === cust.salesRepId);
                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-700">{cust.code}</td>
                          <td className="p-4 font-bold text-slate-900">{cust.name}</td>
                          <td className="p-4">
                            {rep ? (
                              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold">
                                <UserCheck className="w-3 h-3" />
                                {rep.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">بدون مندوب</span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-slate-600">{formatMoney(cust.creditLimit)}</td>
                          <td className="p-4 font-black text-rose-600 font-mono text-sm">
                            {formatMoney(cust.currentBalance)}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setRecCustomerId(cust.id);
                                  setRecInvoiceId('');
                                  setRecAmount(cust.currentBalance);
                                  setShowReceiptModal(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-xs text-xs flex items-center gap-1"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                سند قبض
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatementCustomerId(cust.id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl cursor-pointer text-xs"
                              >
                                كشف حساب
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {customers.filter((c) => c.currentBalance > 0).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-emerald-600 font-bold">
                        🎉 لا توجد ديون مستحقة متأخرة على العملاء حالياً!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Receipts History Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-sm">سجل سندات القبض والتحصيلات المسجلة</h3>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                {receipts.filter((r) => r.type === 'collection').length} سند قبض
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-4">رقم السند</th>
                    <th className="p-4">العميل</th>
                    <th className="p-4">المبلغ المحصل</th>
                    <th className="p-4">طريقة الدفع</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">البيان والملاحظات</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts
                    .filter((r) => r.type === 'collection')
                    .map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">{rec.receiptNumber}</td>
                        <td className="p-4 font-bold text-slate-800">{rec.partyName}</td>
                        <td className="p-4 font-black text-emerald-700 font-mono text-sm">
                          {formatMoney(rec.amount)}
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {rec.paymentMethod === 'cash' && 'نقدي'}
                            {rec.paymentMethod === 'bank_transfer' && 'تحويل بنكي'}
                            {rec.paymentMethod === 'card' && 'بطاقة / مدى'}
                            {rec.paymentMethod === 'cheque' && 'شيك'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-600">{rec.date}</td>
                        <td className="p-4 text-slate-500 max-w-xs truncate">{rec.notes || '—'}</td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => deletePaymentReceipt(rec.id)}
                            className="text-slate-300 hover:text-rose-600 p-1.5 cursor-pointer"
                            title="حذف السند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: COMMISSIONS & PAYOUTS */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          {/* Top Reps Commission Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي العمولات المستحقة</span>
              <div className="text-2xl font-black text-indigo-700">{formatMoney(totalCommissionsEarned)}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">محسوبة تلقائياً من الفواتير الضريبية</span>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي ما تم صرفه وسداده</span>
              <div className="text-2xl font-black text-emerald-600">{formatMoney(totalCommissionsPaid)}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">عبر سندات الصرف والقيود المحاسبية</span>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">المتبقي للصرف (صافي مستحق)</span>
              <div className="text-2xl font-black text-amber-600">{formatMoney(pendingCommissions)}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">جاهز للإصدار والصرف البنكي/النقدي</span>
            </div>
          </div>

          {/* Sales Reps Commissions Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 text-sm">أرصدة عمولات مناديب المبيعات</h3>
                <p className="text-xs text-slate-500 mt-0.5">تتبع المبيعات المحققة، نسبة العمولة، والمبالغ المستحقة والمسددة لكل مندوب.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCommissionPayoutModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                سند صرف عمولة
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-4">مندوب المبيعات</th>
                    <th className="p-4">نسبة العمولة</th>
                    <th className="p-4">المبيعات المحققة</th>
                    <th className="p-4">إجمالي العمولة المكتسبة</th>
                    <th className="p-4">المسدد والمنصرف</th>
                    <th className="p-4">صافي المستحق للصرف</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesReps.map((rep) => {
                    const earned = rep.totalCommissionEarned || 0;
                    const paid = rep.paidCommissions || 0;
                    const net = Math.max(0, earned - paid);

                    return (
                      <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{rep.name}</div>
                          <span className="text-[11px] text-slate-400 font-mono">{rep.phone || '—'}</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2 py-0.5 rounded text-[11px]">
                            {rep.commissionRate}%
                          </span>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-800">
                          {formatMoney(rep.totalSalesAchieved || 0)}
                        </td>
                        <td className="p-4 font-mono font-bold text-indigo-700">{formatMoney(earned)}</td>
                        <td className="p-4 font-mono font-bold text-emerald-600">{formatMoney(paid)}</td>
                        <td className="p-4 font-mono font-black text-amber-700 text-sm">
                          {formatMoney(net)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setCommRepId(rep.id);
                              setCommAmount(net > 0 ? net : 500);
                              setShowCommissionPayoutModal(true);
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl cursor-pointer border border-indigo-200 text-xs"
                          >
                            صرف عمولة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commission Payouts History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-sm">سجل سندات صرف العمولات الصادرة</h3>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                {commissionPayments.length} سند صرف
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-4">رقم السند</th>
                    <th className="p-4">المندوب</th>
                    <th className="p-4">المبلغ المنصرف</th>
                    <th className="p-4">الفترة المحاسبية</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">البيان</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissionPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="p-4 font-bold text-slate-800">{p.salesRepName}</td>
                      <td className="p-4 font-black text-indigo-700 font-mono text-sm">{formatMoney(p.amount)}</td>
                      <td className="p-4 text-slate-600 font-medium">{p.period}</td>
                      <td className="p-4 font-mono text-slate-600">{p.date}</td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{p.notes || 'سند صرف عمولة مبيعات'}</td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => deleteCommissionPayment(p.id)}
                          className="text-slate-300 hover:text-rose-600 p-1.5 cursor-pointer"
                          title="حذف السند"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {commissionPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد سندات صرف عمولات مسجلة بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: LOYALTY & REWARDS PROGRAM */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي نقاط ولاء العملاء</span>
              <div className="text-2xl font-black text-purple-700">{totalCustomerPoints} نقطة</div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                القيمة التقديرية للخصومات: {formatMoney(Math.floor(totalCustomerPoints / 10))}
              </span>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">معدل الاكتساب التلقائي</span>
              <div className="text-xl font-bold text-slate-800">1 نقطة لكل 10 {currency}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">تضاف تلقائياً مع إصدار الفواتير والكاشير</span>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">معدل الاستبدال والخصم</span>
              <div className="text-xl font-bold text-slate-800">10 نقاط = 1 {currency} خصم</div>
              <span className="text-[11px] text-slate-500 mt-1 block">يمكن استخدامها عند إصدار الفاتورة أو نقاط البيع</span>
            </div>
          </div>

          {/* Customers Loyalty Balances */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-sm">أرصدة نقاط ولاء ومكافآت العملاء</h3>
              <button
                type="button"
                onClick={() => {
                  setLoyaltyPartyType('customer');
                  setShowLoyaltyAdjustModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Award className="w-4 h-4" />
                منح نقاط ولاء
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-4">كود العميل</th>
                    <th className="p-4">العميل</th>
                    <th className="p-4">رقم الجوال</th>
                    <th className="p-4">رصيد النقاط</th>
                    <th className="p-4">قيمة الخصم المتاح</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-700">{c.code}</td>
                      <td className="p-4 font-bold text-slate-900">{c.name}</td>
                      <td className="p-4 font-mono text-slate-500">{c.phone || '—'}</td>
                      <td className="p-4">
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 font-black px-2.5 py-1 rounded-lg">
                          {c.loyaltyPoints || 0} نقطة
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-700">
                        {formatMoney(Math.floor((c.loyaltyPoints || 0) / 10))}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setLoyaltyPartyType('customer');
                            setLoyaltyPartyId(c.id);
                            setShowLoyaltyAdjustModal(true);
                          }}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-xl border border-purple-200 text-xs cursor-pointer"
                        >
                          تعديل / منح نقاط
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Loyalty Transactions History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-sm">سجل حركات ونقاط الولاء والمكافآت</h3>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                {loyaltyTransactions.length} حركة مسجلة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-4">الطرف المستفيد</th>
                    <th className="p-4">نوع الحركة</th>
                    <th className="p-4">النقاط</th>
                    <th className="p-4">الرصيد بعد الحركة</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">البيان والسبب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loyaltyTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{tx.partyName}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            tx.type === 'earn'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.type === 'redeem'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {tx.type === 'earn' && 'اكتساب من فاتورة'}
                          {tx.type === 'redeem' && 'استبدال وخصم'}
                          {tx.type === 'bonus' && 'منح ومكافأة يدوية'}
                          {tx.type === 'expire' && 'انتهاء صلاحية'}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-black">
                        {tx.type === 'redeem' ? (
                          <span className="text-rose-600">-{tx.points}</span>
                        ) : (
                          <span className="text-emerald-600">+{tx.points}</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-slate-700">{tx.balanceAfter} نقطة</td>
                      <td className="p-4 font-mono text-slate-600">{tx.date}</td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{tx.notes || '—'}</td>
                    </tr>
                  ))}
                  {loyaltyTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        لا توجد حركات نقاط ولاء مسجلة بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: PRICE LISTS & PRODUCT PRICING */}
      {activeTab === 'pricelists' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {priceLists.map((pl) => {
              const assignedCustomers = customers.filter((c) => c.priceListId === pl.id);
              const isDiscount = (pl.adjustmentType || 'discount') === 'discount';
              const isPercent = (pl.adjustmentValueType || 'percentage') === 'percentage';
              const val = pl.adjustmentValue !== undefined ? pl.adjustmentValue : (pl.discountPercent || pl.discountPercentage || 0);

              return (
                <div key={pl.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{pl.name}</h4>
                          {pl.isDefault && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              افتراضية
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{pl.description || 'بدون وصف'}</p>
                      </div>
                      {val > 0 ? (
                        <span
                          className={`text-xs font-black border px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                            isDiscount
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isDiscount ? 'خصم -' : 'إضافة +'}
                          {val}
                          {isPercent ? '%' : ` ${currency}`}
                        </span>
                      ) : (
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-xl">
                          السعر القياسي
                        </span>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500 font-semibold block mb-1">العملاء المرتبطين بهذه القائمة:</span>
                      <div className="flex flex-wrap gap-1">
                        {assignedCustomers.slice(0, 4).map((c) => (
                          <span key={c.id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                            {c.name}
                          </span>
                        ))}
                        {assignedCustomers.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{assignedCustomers.length - 4} عملاء آخرين
                          </span>
                        )}
                        {assignedCustomers.length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">لا يوجد عملاء مرتبطين حالياً</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">{assignedCustomers.length} عميل</span>
                    {!pl.isDefault && (
                      <button
                        type="button"
                        onClick={() => deletePriceList(pl.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="حذف القائمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Policy Matrix with Inline Double-Click Editing */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm">مصفوفة أسعار المنتجات حسب قوائم الأسعار</h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    تعديل سريع بالنقر المزدوج (Double Click)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  انقر مرتين (Double Click) على أي سعر لتعديله فوراً، وعند الضغط خارج الخلية أو Enter يتم الحفظ وتحديث بيانات المنتج وقوائم الأصناف بالمخازن تلقائياً.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPriceListModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                قائمة أسعار جديدة
              </button>
            </div>

            {/* Quick Hint Bar */}
            <div className="bg-amber-50/70 border-b border-amber-100 px-5 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span>
                <strong>طريقة التعديل المباشر:</strong> انقر مرتين <span className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">Double Click</span> على خانة السعر المطلوب ← ادخل القيمة الجديدة ← اضغط <span className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">Enter</span> أو انقر في أي مكان آخر للحفظ الفوري.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-4">كود الصنف SKU</th>
                    <th className="p-4">اسم المنتج</th>
                    <th className="p-4 text-slate-800">
                      السعر القياسي (Standard)
                      <span className="block text-[10px] text-slate-400 font-normal">سعر البيع الأساسي بالمخزن</span>
                    </th>
                    {priceLists.map((pl) => {
                      const isDiscount = (pl.adjustmentType || 'discount') === 'discount';
                      const isPercent = (pl.adjustmentValueType || 'percentage') === 'percentage';
                      const val = pl.adjustmentValue !== undefined ? pl.adjustmentValue : (pl.discountPercent || pl.discountPercentage || 0);

                      return (
                        <th key={pl.id} className="p-4 text-amber-900">
                          <div className="flex items-center gap-1">
                            <span>{pl.name}</span>
                            {val > 0 && (
                              <span className="text-[10px] text-amber-600 font-bold font-mono">
                                ({isDiscount ? '-' : '+'}{val}{isPercent ? '%' : ` ${currency}`})
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {pl.isDefault ? 'القائمة الافتراضية' : 'قائمة مخصصة'}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {products.map((prod) => {
                    const isStandardEditing = editingCell?.productId === prod.id && editingCell?.colKey === 'standard';
                    const isStandardFlashed = savedCellFlash === `${prod.id}-standard`;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-4 font-bold text-slate-700 font-mono">{prod.sku}</td>
                        <td className="p-4 font-sans font-bold text-slate-900">{prod.name}</td>

                        {/* Standard Selling Price Cell (Double Clickable) */}
                        <td
                          className={`p-3 transition-colors ${
                            isStandardFlashed
                              ? 'bg-emerald-100/80 ring-2 ring-emerald-400 rounded-lg'
                              : 'hover:bg-amber-50/60 cursor-pointer'
                          }`}
                          onDoubleClick={() => startEditingPrice(prod.id, 'standard', prod.sellingPrice)}
                          title="انقر مرتين (Double Click) لتعديل السعر القياسي فوراً"
                        >
                          {isStandardEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                autoFocus
                                value={editingVal}
                                onChange={(e) => setEditingVal(e.target.value)}
                                onBlur={commitEditingPrice}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitEditingPrice();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                onFocus={(e) => e.target.select()}
                                className="w-28 bg-white border-2 border-amber-500 rounded-lg px-2 py-1 font-bold text-slate-900 text-xs shadow-xs focus:outline-hidden font-mono"
                              />
                              <span className="text-[10px] text-slate-400 font-sans font-normal">{currency}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group/cell">
                              <span className="font-bold text-slate-800">
                                {formatMoney(prod.sellingPrice)}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded font-sans flex items-center gap-0.5">
                                  <Edit3 className="w-2.5 h-2.5" />
                                  تعديل
                                </span>
                              </div>
                            </div>
                          )}
                          {isStandardFlashed && (
                            <span className="text-[10px] text-emerald-700 font-sans font-bold block mt-0.5">
                              تم التحديث وحفظ السعر للمخزن ✓
                            </span>
                          )}
                        </td>

                        {/* Price List Columns (Double Clickable) */}
                        {priceLists.map((pl) => {
                          const isPlEditing = editingCell?.productId === prod.id && editingCell?.colKey === pl.id;
                          const isPlFlashed = savedCellFlash === `${prod.id}-${pl.id}`;

                          const customItem = pl.items?.find((it) => it.productId === prod.id);
                          const customVal = customItem?.customPrice ?? customItem?.price;
                          const hasCustomOverride = customVal !== undefined && customVal !== null;

                          // Compute list price
                          let computedPrice = prod.sellingPrice;
                          if (hasCustomOverride) {
                            computedPrice = customVal;
                          } else {
                            const adjType = pl.adjustmentType || 'discount';
                            const adjValType = pl.adjustmentValueType || 'percentage';
                            const adjVal =
                              pl.adjustmentValue !== undefined
                                ? pl.adjustmentValue
                                : (pl.discountPercent ?? pl.discountPercentage ?? 0);

                            if (adjVal && adjVal > 0) {
                              if (adjType === 'discount') {
                                if (adjValType === 'percentage') {
                                  computedPrice = Math.max(0, prod.sellingPrice * (1 - adjVal / 100));
                                } else {
                                  computedPrice = Math.max(0, prod.sellingPrice - adjVal);
                                }
                              } else {
                                if (adjValType === 'percentage') {
                                  computedPrice = prod.sellingPrice * (1 + adjVal / 100);
                                } else {
                                  computedPrice = prod.sellingPrice + adjVal;
                                }
                              }
                            }
                          }
                          computedPrice = Math.round(computedPrice * 100) / 100;

                          return (
                            <td
                              key={pl.id}
                              className={`p-3 transition-colors ${
                                isPlFlashed
                                  ? 'bg-emerald-100/80 ring-2 ring-emerald-400 rounded-lg'
                                  : 'hover:bg-amber-50/60 cursor-pointer'
                              }`}
                              onDoubleClick={() => startEditingPrice(prod.id, pl.id, computedPrice)}
                              title="انقر مرتين (Double Click) لتعديل السعر في هذه القائمة"
                            >
                              {isPlEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    autoFocus
                                    value={editingVal}
                                    onChange={(e) => setEditingVal(e.target.value)}
                                    onBlur={commitEditingPrice}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitEditingPrice();
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    onFocus={(e) => e.target.select()}
                                    className="w-28 bg-white border-2 border-amber-500 rounded-lg px-2 py-1 font-bold text-amber-900 text-xs shadow-xs focus:outline-hidden font-mono"
                                  />
                                  <span className="text-[10px] text-slate-400 font-sans font-normal">{currency}</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between group/cell">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-amber-900">
                                      {formatMoney(computedPrice)}
                                    </span>
                                    {hasCustomOverride && (
                                      <span className="text-[9px] font-sans font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded">
                                        مخصص
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded font-sans flex items-center gap-0.5">
                                      <Edit3 className="w-2.5 h-2.5" />
                                      تعديل
                                    </span>
                                  </div>
                                </div>
                              )}
                              {isPlFlashed && (
                                <span className="text-[10px] text-emerald-700 font-sans font-bold block mt-0.5">
                                  تم حفظ السعر للقائمة ✓
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCOUNT */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">إضافة حساب مالي جديد بالشجرة</h3>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAccount} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع الحساب *</label>
                <select
                  value={newAccType}
                  onChange={(e) => {
                    const t = e.target.value as AccountType;
                    setNewAccType(t);
                    const prefixes: Record<AccountType, string> = {
                      asset: '1',
                      liability: '2',
                      equity: '3',
                      revenue: '4',
                      expense: '5',
                    };
                    if (!newAccCode) setNewAccCode(prefixes[t]);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                >
                  <option value="asset">1 - الأصول (Assets)</option>
                  <option value="liability">2 - الخصوم والالتزامات (Liabilities)</option>
                  <option value="equity">3 - حقوق الملكية (Equity)</option>
                  <option value="revenue">4 - الإيرادات والمبيعات (Revenues)</option>
                  <option value="expense">5 - المصروفات والتكاليف (Expenses)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رمز الحساب (Code) *</label>
                <input
                  type="text"
                  required
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  placeholder="مثال: 1140 أو 5210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:border-emerald-500 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الحساب المالي *</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="مثال: بنك الرياض - الحساب الجاري"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الحساب الرئيسي التابع له</label>
                <select
                  value={newAccParent}
                  onChange={(e) => setNewAccParent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                >
                  <option value="">-- حساب رئيسي مستقل --</option>
                  {hierarchicalAccounts.map((a) => (
                    <option key={a.id} value={a.code}>
                      {a.treeLevel > 0 ? `${'— '.repeat(a.treeLevel)} ` : ''}{a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الوصف والغرض</label>
                <textarea
                  rows={2}
                  value={newAccDesc}
                  onChange={(e) => setNewAccDesc(e.target.value)}
                  placeholder="ملاحظات توضيحية..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ الحساب بالشجرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ACCOUNT */}
      {showEditAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">تعديل بيانات الحساب المالي</h3>
              <button
                type="button"
                onClick={() => setShowEditAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAccount} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع الحساب *</label>
                <select
                  value={editAccType}
                  onChange={(e) => setEditAccType(e.target.value as AccountType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden font-bold"
                >
                  <option value="asset">1 - الأصول (Assets)</option>
                  <option value="liability">2 - الخصوم والالتزامات (Liabilities)</option>
                  <option value="equity">3 - حقوق الملكية (Equity)</option>
                  <option value="revenue">4 - الإيرادات والمبيعات (Revenues)</option>
                  <option value="expense">5 - المصروفات والتكاليف (Expenses)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رمز الحساب (Code) *</label>
                <input
                  type="text"
                  required
                  value={editAccCode}
                  onChange={(e) => setEditAccCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:border-indigo-500 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الحساب المالي *</label>
                <input
                  type="text"
                  required
                  value={editAccName}
                  onChange={(e) => setEditAccName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الحساب الرئيسي التابع له</label>
                <select
                  value={editAccParent}
                  onChange={(e) => setEditAccParent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden font-bold"
                >
                  <option value="">-- حساب رئيسي مستقل --</option>
                  {hierarchicalAccounts
                    .filter((a) => a.id !== editAccId)
                    .map((a) => (
                      <option key={a.id} value={a.code}>
                        {a.treeLevel > 0 ? `${'— '.repeat(a.treeLevel)} ` : ''}{a.code} - {a.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الوصف والغرض</label>
                <textarea
                  rows={2}
                  value={editAccDesc}
                  onChange={(e) => setEditAccDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditAccountModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  تحديث الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL JOURNAL ENTRY */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">إنشاء قيد يومية عامة يدوي</h3>
              <button
                type="button"
                onClick={() => setShowJournalModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJournalEntry} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ القيد</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم المرجع / السند</label>
                  <input
                    type="text"
                    value={entryRef}
                    onChange={(e) => setEntryRef(e.target.value)}
                    placeholder="مثال: REF-9902"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">شرح وبيان القيد</label>
                  <input
                    type="text"
                    required
                    value={entryDesc}
                    onChange={(e) => setEntryDesc(e.target.value)}
                    placeholder="مثال: إثبات إيجار المقر الشهري"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              {/* Journal Lines Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">أسطر القيد المحاسبي:</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-emerald-700 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    إضافة سطر
                  </button>
                </div>

                <div className="space-y-2">
                  {journalLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={line.accountId}
                          onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
                        >
                          {hierarchicalAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.treeLevel > 0 ? `${'— '.repeat(a.treeLevel)} ` : ''}{a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="مدين"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(idx, 'debit', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono font-bold text-emerald-700 text-left"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="دائن"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(idx, 'credit', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono font-bold text-blue-700 text-left"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Balanced Checker Bar */}
                <div className={`p-3 rounded-xl flex justify-between items-center text-xs font-bold border ${
                  isBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div>
                    {isBalanced ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        القيد متوازن وجاهز للترحيل
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        القيد غير متوازن! الفارق: {formatMoney(Math.abs(totalDebit - totalCredit))}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 font-mono">
                    <span>مدين: {formatMoney(totalDebit)}</span>
                    <span>دائن: {formatMoney(totalCredit)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className={`px-5 py-2 font-bold rounded-xl shadow-xs transition-all ${
                    isBalanced
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  ترحيل وحفظ القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECEIPT VOUCHER */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">إصدار سند قبض وتحصيل مالي</h3>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">العميل المسدد *</label>
                <select
                  required
                  value={recCustomerId}
                  onChange={(e) => {
                    const custId = e.target.value;
                    setRecCustomerId(custId);
                    setRecInvoiceId('');
                    const found = customers.find((c) => c.id === custId);
                    if (found && found.currentBalance > 0) {
                      setRecAmount(found.currentBalance);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                >
                  <option value="">-- اختر العميل --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (رصيد مستحق: {formatMoney(c.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Unpaid Invoice Selector */}
              {recCustomerId && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تخصيص السداد لفاتورة محددة (اختياري)</label>
                  <select
                    value={recInvoiceId}
                    onChange={(e) => {
                      const invId = e.target.value;
                      setRecInvoiceId(invId);
                      if (invId) {
                        const targetInv = salesInvoices.find((i) => i.id === invId);
                        if (targetInv) {
                          setRecAmount(targetInv.remainingAmount);
                          setRecNotes(`سداد وتحصيل الفاتورة ${targetInv.invoiceNumber}`);
                        }
                      } else {
                        const foundCust = customers.find((c) => c.id === recCustomerId);
                        if (foundCust && foundCust.currentBalance > 0) {
                          setRecAmount(foundCust.currentBalance);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                  >
                    <option value="">-- تسوية تلقائية لكافة الفواتير غير المسددة (الأقدم فالأحدث) --</option>
                    {salesInvoices
                      .filter((i) => i.customerId === recCustomerId && i.remainingAmount > 0 && i.status !== 'paid')
                      .map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          فاتورة {inv.invoiceNumber} | متبقي: {formatMoney(inv.remainingAmount)} (الإجمالي: {formatMoney(inv.grandTotal)})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ المحصل *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={recAmount}
                    onChange={(e) => setRecAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-emerald-700 text-sm focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">طريقة الدفع</label>
                  <select
                    value={recMethod}
                    onChange={(e) => setRecMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden font-bold"
                  >
                    <option value="cash">نقداً (خزينة)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="card">بطاقة بنكية / مدى</option>
                    <option value="cheque">شيك مصرفي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">حساب الإيداع المالي (الخزينة/البنك) *</label>
                <select
                  value={recAccountId}
                  onChange={(e) => setRecAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden font-bold"
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
                <label className="block text-slate-700 font-bold mb-1">البيان والملاحظات</label>
                <input
                  type="text"
                  value={recNotes}
                  onChange={(e) => setRecNotes(e.target.value)}
                  placeholder="دفعة سداد حساب / تصفية فاتورة"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ السند والترحيل المالي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMMISSION PAYOUT */}
      {showCommissionPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">سند صرف عمولة مندوب مبيعات</h3>
              <button
                type="button"
                onClick={() => setShowCommissionPayoutModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommissionPayout} className="space-y-3.5 mt-4 text-xs">
              <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-200 text-xs">
                ✨ <strong>التأثير المحاسبي:</strong> سيتم توليد قيد يومية تلقائي: مدين (مصروف عمولات 5230) / دائن (حساب الخزينة أو البنك).
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">مندوب المبيعات المستفيد *</label>
                <select
                  required
                  value={commRepId}
                  onChange={(e) => {
                    setCommRepId(e.target.value);
                    const found = salesReps.find((r) => r.id === e.target.value);
                    if (found) {
                      const net = Math.max(0, (found.totalCommissionEarned || 0) - (found.paidCommissions || 0));
                      setCommAmount(net > 0 ? net : 500);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden font-bold"
                >
                  <option value="">-- اختر المندوب --</option>
                  {salesReps.map((r) => {
                    const net = Math.max(0, (r.totalCommissionEarned || 0) - (r.paidCommissions || 0));
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} (صافي مستحق: {formatMoney(net)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ المنصرف *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={commAmount}
                    onChange={(e) => setCommAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-indigo-700 text-sm focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">عن الفترة المحاسبية</label>
                  <input
                    type="text"
                    value={commPeriod}
                    onChange={(e) => setCommPeriod(e.target.value)}
                    placeholder="مثال: شهر أغسطس 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">حساب الصرف المالي (الخزينة/البنك) *</label>
                <select
                  value={commAccountId}
                  onChange={(e) => setCommAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden font-bold"
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
                <label className="block text-slate-700 font-bold mb-1">البيان والملاحظات</label>
                <input
                  type="text"
                  value={commNotes}
                  onChange={(e) => setCommNotes(e.target.value)}
                  placeholder="صرف عمولة مبيعات عن المستهدف المحقق"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCommissionPayoutModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ وترحيل سند الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRICE LIST */}
      {showPriceListModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">إضافة قائمة أسعار جديدة</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPriceListModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePriceList} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم قائمة الأسعار *</label>
                <input
                  type="text"
                  required
                  value={plName}
                  onChange={(e) => setPlName(e.target.value)}
                  placeholder="مثال: قائمة أسعار الموزعين المعتمدين / كبار العملاء"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-hidden font-bold"
                />
              </div>

              {/* 1. Toggle: خصم (Discount) أو إضافة (Markup) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">نوع العملية / التأثير السعري *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPlAdjType('discount')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      plAdjType === 'discount'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>خصم (تخفيض من السعر)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlAdjType('markup')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      plAdjType === 'markup'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>إضافة (زيادة على السعر)</span>
                  </button>
                </div>
              </div>

              {/* 2. Toggle: نسبة مئوية % أو قيمة ثابتة */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">طريقة الحساب والتطبيق *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPlAdjValType('percentage')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      plAdjValType === 'percentage'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>نسبة مئوية (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlAdjValType('fixed')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      plAdjValType === 'fixed'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>مبلغ / قيمة ثابتة ({currency})</span>
                  </button>
                </div>
              </div>

              {/* 3. Input Value Field */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {plAdjType === 'discount' ? 'قيمة الخصم' : 'قيمة الإضافة'} {plAdjValType === 'percentage' ? '(%)' : `(${currency})`} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={plAdjValType === 'percentage' ? '0.1' : '1'}
                    max={plAdjValType === 'percentage' && plAdjType === 'discount' ? 100 : undefined}
                    required
                    value={plAdjValue}
                    onChange={(e) => setPlAdjValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-10 focus:border-amber-500 focus:outline-hidden font-bold font-mono text-sm"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">
                    {plAdjValType === 'percentage' ? '%' : currency}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {plAdjType === 'discount'
                    ? plAdjValType === 'percentage'
                      ? `سيتم خصم ${plAdjValue || 0}% من السعر القياسي لجميع الأصناف في هذه القائمة.`
                      : `سيتم خصم مبلغ ${plAdjValue || 0} ${currency} من السعر القياسي لجميع الأصناف.`
                    : plAdjValType === 'percentage'
                      ? `سيتم زيادة ${plAdjValue || 0}% على السعر القياسي لجميع الأصناف في هذه القائمة.`
                      : `سيتم زيادة مبلغ ${plAdjValue || 0} ${currency} على السعر القياسي لجميع الأصناف.`
                  }
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الوصف والغرض</label>
                <textarea
                  rows={2}
                  value={plDesc}
                  onChange={(e) => setPlDesc(e.target.value)}
                  placeholder="تطبق على العملاء الذين يتجاوز حجم طلباتهم 50,000 ريال..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-default-pl"
                  checked={plIsDefault}
                  onChange={(e) => setPlIsDefault(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="chk-default-pl" className="text-slate-700 font-bold cursor-pointer">
                  تعيين كقائمة أسعار افتراضية للعملاء الجدد
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPriceListModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ قائمة الأسعار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST LOYALTY POINTS */}
      {showLoyaltyAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">تسوية / منح نقاط ولاء ومكافآت</h3>
              <button
                type="button"
                onClick={() => setShowLoyaltyAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoyaltyAdjust} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoyaltyPartyType('customer');
                    setLoyaltyPartyId('');
                  }}
                  className={`p-2.5 rounded-xl font-bold border text-xs cursor-pointer ${
                    loyaltyPartyType === 'customer'
                      ? 'bg-purple-50 border-purple-300 text-purple-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  عميل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoyaltyPartyType('sales_rep');
                    setLoyaltyPartyId('');
                  }}
                  className={`p-2.5 rounded-xl font-bold border text-xs cursor-pointer ${
                    loyaltyPartyType === 'sales_rep'
                      ? 'bg-purple-50 border-purple-300 text-purple-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  مندوب مبيعات
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">المستفيد *</label>
                <select
                  required
                  value={loyaltyPartyId}
                  onChange={(e) => setLoyaltyPartyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-purple-500 focus:outline-hidden font-bold"
                >
                  <option value="">-- اختر الطرف --</option>
                  {loyaltyPartyType === 'customer'
                    ? customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (الرصيد الحالي: {c.loyaltyPoints || 0} نقطة)
                        </option>
                      ))
                    : salesReps.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (الرصيد الحالي: {r.loyaltyPoints || 0} نقطة)
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  النقاط المراد إضافتها (أو خصمها بقيمة سالبة) *
                </label>
                <input
                  type="number"
                  required
                  value={loyaltyDelta}
                  onChange={(e) => setLoyaltyDelta(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-purple-700 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">السبب والملاحظات</label>
                <input
                  type="text"
                  value={loyaltyReason}
                  onChange={(e) => setLoyaltyReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLoyaltyAdjustModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  تأكيد وحفظ النقاط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATEMENT MODAL */}
      {statementCustomerId && (
        <CustomerStatementModal
          customerId={statementCustomerId}
          onClose={() => setStatementCustomerId(null)}
        />
      )}
    </div>
  );
};
