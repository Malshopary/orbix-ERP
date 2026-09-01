import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { Customer, CRMLead, CRMInteraction, CRMTicket, SalesRep } from '../types';
import { CustomerStatementModal } from './CustomerStatementModal';
import { CrmSalesRepDashboard } from './CrmSalesRepDashboard';
import {
  Users2,
  PlusCircle,
  PhoneCall,
  Mail,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Send,
  X,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
  TrendingUp,
  Target,
  LifeBuoy,
  MessageSquare,
  Building2,
  Tag,
  Award,
  DollarSign,
  UserCheck,
  Filter,
  CheckSquare,
  AlertCircle,
  HelpCircle,
  Compass,
} from 'lucide-react';

export const CrmCollectionsView: React.FC = () => {
  const {
    customers,
    salesReps,
    priceLists,
    accounts,
    crmLeads,
    crmInteractions,
    crmTickets,
    formatMoney,
    canDeleteEntity,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCrmLead,
    updateCrmLead,
    deleteCrmLead,
    addCrmInteraction,
    updateCrmInteraction,
    deleteCrmInteraction,
    addCrmTicket,
    updateCrmTicket,
    deleteCrmTicket,
    hasPermission,
    activeSubTab,
    setActiveSubTab,
    showAlert,
    showConfirm,
  } = useErp();

  // Active CRM Tab
  const [activeTab, setActiveTabLocal] = useState<'customers' | 'pipeline' | 'interactions' | 'tickets' | 'sales_reps'>('customers');

  React.useEffect(() => {
    if (activeSubTab && ['customers', 'pipeline', 'interactions', 'tickets', 'sales_reps'].includes(activeSubTab)) {
      setActiveTabLocal(activeSubTab as any);
    }
  }, [activeSubTab]);

  const setActiveTab = (tab: 'customers' | 'pipeline' | 'interactions' | 'tickets' | 'sales_reps') => {
    setActiveTabLocal(tab);
    setActiveSubTab(tab);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [repFilter, setRepFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddInteractionModal, setShowAddInteractionModal] = useState(false);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [statementCustomerId, setStatementCustomerId] = useState<string | null>(null);

  // Customer Form State
  const [custName, setCustName] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custTax, setCustTax] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState(30000);
  const [custTerms, setCustTerms] = useState(30);
  const [custSalesRepId, setCustSalesRepId] = useState('');
  const [custPriceListId, setCustPriceListId] = useState('');

  // Edit Customer Form State
  const [editCustId, setEditCustId] = useState('');
  const [editCustName, setEditCustName] = useState('');
  const [editCustCompany, setEditCustCompany] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustTax, setEditCustTax] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCustCreditLimit, setEditCustCreditLimit] = useState(30000);
  const [editCustTerms, setEditCustTerms] = useState(30);
  const [editCustSalesRepId, setEditCustSalesRepId] = useState('');
  const [editCustPriceListId, setEditCustPriceListId] = useState('');

  // Lead Form State
  const [leadTitle, setLeadTitle] = useState('');
  const [leadCustomerName, setLeadCustomerName] = useState('');
  const [leadContactPerson, setLeadContactPerson] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadValue, setLeadValue] = useState(10000);
  const [leadStage, setLeadStage] = useState<CRMLead['stage']>('new');
  const [leadProbability, setLeadProbability] = useState(50);
  const [leadRepId, setLeadRepId] = useState('');
  const [leadExpectedClose, setLeadExpectedClose] = useState(new Date().toISOString().split('T')[0]);
  const [leadNotes, setLeadNotes] = useState('');

  // Interaction Form State
  const [intCustomerId, setIntCustomerId] = useState('');
  const [intType, setIntType] = useState<CRMInteraction['type']>('call');
  const [intTitle, setIntTitle] = useState('');
  const [intDate, setIntDate] = useState(new Date().toISOString().split('T')[0]);
  const [intRepId, setIntRepId] = useState('');
  const [intNotes, setIntNotes] = useState('');
  const [intNextFollowUp, setIntNextFollowUp] = useState('');

  // Ticket Form State
  const [tktCustomerId, setTktCustomerId] = useState('');
  const [tktSubject, setTktSubject] = useState('');
  const [tktDesc, setTktDesc] = useState('');
  const [tktPriority, setTktPriority] = useState<CRMTicket['priority']>('medium');
  const [tktCategory, setTktCategory] = useState<CRMTicket['category']>('technical');
  const [tktRepId, setTktRepId] = useState('');

  const canEditCust = hasPermission('edit_customers');
  const canDeleteCust = hasPermission('delete_customers');

  // Customer Management Handlers
  const handleOpenEditCust = (c: Customer) => {
    if (!canEditCust) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لتعديل بيانات العملاء. يرجى مراجعة المسؤول.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setEditCustId(c.id);
    setEditCustName(c.name);
    setEditCustCompany(c.companyName || '');
    setEditCustPhone(c.phone || '');
    setEditCustEmail(c.email || '');
    setEditCustTax(c.taxNumber || '');
    setEditCustAddress(c.address || '');
    setEditCustCreditLimit(c.creditLimit);
    setEditCustTerms(c.paymentTermsDays);
    setEditCustSalesRepId(c.salesRepId || '');
    setEditCustPriceListId(c.priceListId || '');
    setShowEditCustomerModal(true);
  };

  const handleSaveNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى إدخال اسم العميل أولاً.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    const rep = salesReps.find((r) => r.id === custSalesRepId);

    addCustomer({
      name: custName.trim(),
      companyName: custCompany.trim() || undefined,
      phone: custPhone.trim() || undefined,
      email: custEmail.trim() || undefined,
      taxNumber: custTax.trim() || undefined,
      address: custAddress.trim() || undefined,
      creditLimit: Number(custCreditLimit) || 0,
      paymentTermsDays: Number(custTerms) || 30,
      salesRepId: custSalesRepId || undefined,
      salesRepName: rep?.name || undefined,
      priceListId: custPriceListId || undefined,
      status: 'active',
      loyaltyPoints: 0,
    });

    // Reset Form
    setCustName('');
    setCustCompany('');
    setCustPhone('');
    setCustEmail('');
    setCustTax('');
    setCustAddress('');
    setCustCreditLimit(30000);
    setCustTerms(30);
    setCustSalesRepId('');
    setCustPriceListId('');
    setShowAddCustomerModal(false);
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustName.trim()) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى إدخال اسم العميل',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    const rep = salesReps.find((r) => r.id === editCustSalesRepId);

    updateCustomer(editCustId, {
      name: editCustName.trim(),
      companyName: editCustCompany.trim() || undefined,
      phone: editCustPhone.trim() || undefined,
      email: editCustEmail.trim() || undefined,
      taxNumber: editCustTax.trim() || undefined,
      address: editCustAddress.trim() || undefined,
      creditLimit: Number(editCustCreditLimit) || 0,
      paymentTermsDays: Number(editCustTerms) || 30,
      salesRepId: editCustSalesRepId || undefined,
      salesRepName: rep?.name || undefined,
      priceListId: editCustPriceListId || undefined,
    });

    setShowEditCustomerModal(false);
  };

  const handleDeleteCust = (c: Customer) => {
    if (!canDeleteCust) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لحذف العملاء.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const check = canDeleteEntity('customer', c.id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف العميل (${c.name})`,
        message: 'لا يمكن حذف ملف العميل للأسباب التالية:',
        details: check.reason,
        note: 'لحماية السجلات المحاسبية والضريبية وتقارير الأرباح من التلف، لا يمكن حذف أي عميل مسجل عليه حركات أو فواتير.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    showConfirm(
      `هل أنت متأكد من حذف العميل "${c.name}" نهائياً من النظام؟`,
      () => {
        deleteCustomer(c.id);
      },
      `تأكيد حذف العميل (${c.name})`,
      'حذف العميل'
    );
  };

  // Lead Handler
  const handleSaveNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadTitle.trim() || !leadCustomerName.trim()) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى إدخال عنوان الفرصة واسم العميل أو الشركة.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    const rep = salesReps.find((r) => r.id === leadRepId);

    addCrmLead({
      title: leadTitle.trim(),
      customerName: leadCustomerName.trim(),
      contactPerson: leadContactPerson.trim() || undefined,
      phone: leadPhone.trim() || undefined,
      email: leadEmail.trim() || undefined,
      estimatedValue: Number(leadValue) || 0,
      stage: leadStage,
      probability: Number(leadProbability) || 50,
      salesRepId: leadRepId || undefined,
      salesRepName: rep?.name || undefined,
      expectedCloseDate: leadExpectedClose,
      notes: leadNotes.trim() || undefined,
    });

    setLeadTitle('');
    setLeadCustomerName('');
    setLeadContactPerson('');
    setLeadPhone('');
    setLeadEmail('');
    setLeadValue(10000);
    setLeadStage('new');
    setLeadProbability(50);
    setLeadRepId('');
    setLeadNotes('');
    setShowAddLeadModal(false);
  };

  // Interaction Handler
  const handleSaveInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intTitle.trim() || !intCustomerId) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى اختيار العميل وإدخال عنوان المتابعة.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    const cust = customers.find((c) => c.id === intCustomerId);
    const rep = salesReps.find((r) => r.id === intRepId);

    addCrmInteraction({
      customerId: intCustomerId,
      customerName: cust?.name || '',
      type: intType,
      title: intTitle.trim(),
      date: intDate,
      salesRepId: intRepId || undefined,
      salesRepName: rep?.name || undefined,
      notes: intNotes.trim() || undefined,
      status: 'completed',
      nextFollowUpDate: intNextFollowUp || undefined,
    });

    setIntTitle('');
    setIntCustomerId('');
    setIntNotes('');
    setIntNextFollowUp('');
    setShowAddInteractionModal(false);
  };

  // Ticket Handler
  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktSubject.trim() || !tktCustomerId) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى اختيار العميل وإدخال موضوع التذكرة.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    const cust = customers.find((c) => c.id === tktCustomerId);
    const rep = salesReps.find((r) => r.id === tktRepId);

    addCrmTicket({
      customerId: tktCustomerId,
      customerName: cust?.name || '',
      subject: tktSubject.trim(),
      description: tktDesc.trim(),
      priority: tktPriority,
      status: 'open',
      category: tktCategory,
      assignedTo: rep?.name || undefined,
    });

    setTktSubject('');
    setTktDesc('');
    setTktCustomerId('');
    setShowAddTicketModal(false);
  };

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchRep = repFilter === 'all' || c.salesRepId === repFilter;
      return matchSearch && matchRep;
    });
  }, [customers, searchQuery, repFilter]);

  const filteredLeads = useMemo(() => {
    return crmLeads.filter((l) => {
      const matchSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStage = statusFilter === 'all' || l.stage === statusFilter;
      const matchRep = repFilter === 'all' || l.salesRepId === repFilter;
      return matchSearch && matchStage && matchRep;
    });
  }, [crmLeads, searchQuery, statusFilter, repFilter]);

  const filteredInteractions = useMemo(() => {
    return crmInteractions.filter((it) => {
      const matchSearch =
        it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.notes && it.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchRep = repFilter === 'all' || it.salesRepId === repFilter;
      return matchSearch && matchRep;
    });
  }, [crmInteractions, searchQuery, repFilter]);

  const filteredTickets = useMemo(() => {
    return crmTickets.filter((t) => {
      const matchSearch =
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [crmTickets, searchQuery, statusFilter]);

  // Stage labels & colors
  const STAGE_CONFIG: Record<CRMLead['stage'], { label: string; color: string; bg: string }> = {
    lead: { label: 'عميل محتمل', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
    new: { label: 'فرصة جديدة', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    contacted: { label: 'تم التواصل', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    proposal: { label: 'عرض سعر', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    proposal_sent: { label: 'عرض سعر مرسل', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    negotiation: { label: 'مفاوضات متقدمة', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
    won: { label: 'تم الفوز (إغلاق ناجح)', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    lost: { label: 'فرصة ملغاة / خاسرة', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  };

  const PRIORITY_CONFIG: Record<CRMTicket['priority'], { label: string; color: string }> = {
    low: { label: 'منخفضة', color: 'text-slate-600 bg-slate-100' },
    medium: { label: 'متوسطة', color: 'text-blue-700 bg-blue-100' },
    high: { label: 'مرتفعة', color: 'text-amber-700 bg-amber-100' },
    urgent: { label: 'عاجلة وفورية', color: 'text-rose-700 bg-rose-100' },
  };

  const totalPipelineValue = crmLeads.reduce((s, l) => s + (l.stage !== 'lost' ? l.estimatedValue : 0), 0);
  const wonPipelineValue = crmLeads.filter((l) => l.stage === 'won').reduce((s, l) => s + l.estimatedValue, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Users2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  إدارة علاقات العملاء والمتابعات (CRM 360)
                </h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  مفصول بالكامل عن التحصيلات
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                إدارة ملفات العملاء، الفرص البيعية، ربط المناديب، متابعة المكالمات والاجتماعات، وخدمة العملاء.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'customers' && (
              <button
                type="button"
                id="btn-add-new-customer"
                onClick={() => setShowAddCustomerModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                إضافة عميل جديد
              </button>
            )}
            {activeTab === 'pipeline' && (
              <button
                type="button"
                id="btn-add-new-lead"
                onClick={() => setShowAddLeadModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                إنشاء فرصة بيعية
              </button>
            )}
            {activeTab === 'interactions' && (
              <button
                type="button"
                id="btn-add-interaction"
                onClick={() => setShowAddInteractionModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                تسجيل نشاط / متابعة
              </button>
            )}
            {activeTab === 'tickets' && (
              <button
                type="button"
                id="btn-add-ticket"
                onClick={() => setShowAddTicketModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                فتح تذكرة دعم
              </button>
            )}
          </div>
        </div>

        {/* CRM Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي العملاء المسجلين</span>
            <span className="text-xl font-black text-slate-800">{customers.length} عميل</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">قيمة مسار المبيعات (Pipeline)</span>
            <span className="text-xl font-black text-emerald-600">{formatMoney(totalPipelineValue)}</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">مبيعات مغلقة بنجاح (Won)</span>
            <span className="text-xl font-black text-blue-600">{formatMoney(wonPipelineValue)}</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-slate-400 text-xs font-semibold block mb-1">تذاكر الدعم المفتوحة</span>
            <span className="text-xl font-black text-amber-600">{crmTickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length} تذكرة</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الجوال، الكود، الموضوع..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Sales Rep Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>المندوب:</span>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">كل المناديب</option>
              {salesReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stage / Status Filter */}
          {activeTab === 'pipeline' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>المرحلة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">كل المراحل</option>
                <option value="new">فرصة جديدة</option>
                <option value="contacted">تم التواصل</option>
                <option value="proposal_sent">عرض سعر مرسل</option>
                <option value="negotiation">مفاوضات</option>
                <option value="won">تم الفوز</option>
                <option value="lost">خاسرة / ملغاة</option>
              </select>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>الحالة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">كل التذاكر</option>
                <option value="open">مفتوحة</option>
                <option value="in_progress">قيد المعالجة</option>
                <option value="resolved">تم الحل</option>
                <option value="closed">مغلقة</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: CUSTOMERS DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 text-sm">دليل العملاء وسجلات الحساب 360</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                كل عميل مربوط بمندوب مبيعات، قائمة أسعار، نقاط ولاء، وحساب مالي فرعي تلقائي بالشجرة.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              {filteredCustomers.length} عميل
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4">كود العميل</th>
                  <th className="p-4">العميل / الشركة</th>
                  <th className="p-4">المندوب المسؤول</th>
                  <th className="p-4">قائمة الأسعار</th>
                  <th className="p-4">نقاط الولاء</th>
                  <th className="p-4">الحساب بالشجرة</th>
                  <th className="p-4">الحد الائتماني</th>
                  <th className="p-4">الرصيد المالي</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const assignedRep = salesReps.find((r) => r.id === cust.salesRepId);
                  const assignedPriceList = priceLists.find((pl) => pl.id === cust.priceListId);
                  const linkedAccount = accounts.find((a) => a.id === cust.accountId || a.code === cust.accountId);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {cust.code || 'CUST-000'}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        {cust.companyName && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {cust.companyName}
                          </div>
                        )}
                        {cust.phone && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {cust.phone}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {assignedRep ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                            <UserCheck className="w-3 h-3" />
                            {assignedRep.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">غير محدد</span>
                        )}
                      </td>
                      <td className="p-4">
                        {assignedPriceList ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                            <Tag className="w-3 h-3" />
                            {assignedPriceList.name}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">السعر الافتراضي</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-black text-xs">
                          <Award className="w-3 h-3 text-purple-600" />
                          {cust.loyaltyPoints || 0} نقطة
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        {linkedAccount ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            {linkedAccount.code}
                          </span>
                        ) : (
                          <span className="text-slate-400">1130</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">
                        {formatMoney(cust.creditLimit)}
                        <span className="block text-[10px] text-slate-400">{cust.paymentTermsDays} يوم سداد</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-black ${
                            cust.currentBalance > 0
                              ? 'text-rose-600'
                              : cust.currentBalance < 0
                              ? 'text-emerald-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {formatMoney(cust.currentBalance)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setStatementCustomerId(cust.id)}
                            title="كشف حساب العميل"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2 rounded-xl border border-emerald-200 cursor-pointer transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCust(cust)}
                            title="تعديل بيانات العميل"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCust(cust)}
                            title="حذف العميل"
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لا يوجد عملاء يطابقون معايير البحث الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SALES LEADS & PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(['new', 'contacted', 'proposal_sent', 'negotiation', 'won', 'lost'] as CRMLead['stage'][]).map((stg) => {
              const stageLeads = filteredLeads.filter((l) => l.stage === stg);
              const stageSum = stageLeads.reduce((s, l) => s + l.estimatedValue, 0);
              const conf = STAGE_CONFIG[stg];

              return (
                <div key={stg} className={`rounded-2xl p-3 border ${conf.bg} flex flex-col min-h-[320px]`}>
                  <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-200/60">
                    <span className={`font-bold text-xs ${conf.color}`}>{conf.label}</span>
                    <span className="text-[11px] font-black bg-white px-2 py-0.5 rounded-full shadow-2xs text-slate-700">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 mb-2">
                    إجمالي: {formatMoney(stageSum)}
                  </div>

                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[500px]">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-slate-900 text-xs">{lead.title}</h4>
                          <button
                            type="button"
                            onClick={() => deleteCrmLead(lead.id)}
                            className="text-slate-300 hover:text-rose-500 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 font-semibold">
                          {lead.customerName}
                        </div>
                        {lead.contactPerson && (
                          <div className="text-[10px] text-slate-400">{lead.contactPerson}</div>
                        )}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                          <span className="font-black text-emerald-700 text-xs">
                            {formatMoney(lead.estimatedValue)}
                          </span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {lead.probability}%
                          </span>
                        </div>

                        {lead.salesRepName && (
                          <div className="mt-1.5 text-[10px] text-indigo-600 flex items-center gap-1 font-medium">
                            <UserCheck className="w-3 h-3" />
                            {lead.salesRepName}
                          </div>
                        )}

                        {/* Quick Stage Mover */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <select
                            value={lead.stage}
                            onChange={(e) => updateCrmLead(lead.id, { stage: e.target.value as any })}
                            className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-1 font-bold text-slate-700 cursor-pointer"
                          >
                            <option value="new">فرصة جديدة</option>
                            <option value="contacted">تم التواصل</option>
                            <option value="proposal_sent">عرض سعر</option>
                            <option value="negotiation">مفاوضات</option>
                            <option value="won">تم الفوز ✅</option>
                            <option value="lost">خاسرة / ملغاة ❌</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="p-4 text-center text-slate-400 text-[11px] italic">
                        لا توجد فرص
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CRM INTERACTIONS & MEETINGS */}
      {activeTab === 'interactions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 text-sm">سجل الأنشطة والاتصالات والمتابعات اليومية</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                سجل كافة المكالمات الهاتفية، الاجتماعات، رسائل البريد والواتساب مع مواعيد المتابعة القادمة.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddInteractionModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              تسجيل متابعة
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredInteractions.map((it) => (
              <div key={it.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    {it.type === 'call' && <PhoneCall className="w-4 h-4 text-blue-600" />}
                    {it.type === 'meeting' && <Calendar className="w-4 h-4 text-purple-600" />}
                    {it.type === 'email' && <Mail className="w-4 h-4 text-amber-600" />}
                    {it.type === 'whatsapp' && <MessageSquare className="w-4 h-4 text-emerald-600" />}
                    {it.type === 'task' && <CheckSquare className="w-4 h-4 text-slate-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">{it.title}</h4>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {it.type === 'call' && 'اتصال هاتفي'}
                        {it.type === 'meeting' && 'اجتماع عمل'}
                        {it.type === 'email' && 'بريد إلكتروني'}
                        {it.type === 'whatsapp' && 'محادثة واتساب'}
                        {it.type === 'task' && 'مهمة عمل'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-semibold mt-1">
                      العميل: <span className="text-emerald-700 font-bold">{it.customerName}</span>
                      {it.salesRepName && (
                        <span className="mr-3 text-slate-500 font-normal">
                          المندوب: <strong className="text-slate-700">{it.salesRepName}</strong>
                        </span>
                      )}
                    </div>
                    {it.notes && (
                      <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-2xl">
                        {it.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 mr-auto md:mr-0">
                  <div className="text-left text-xs">
                    <span className="text-slate-400 block text-[10px]">تاريخ النشاط</span>
                    <span className="font-bold text-slate-700 font-mono">{it.date}</span>
                    {it.nextFollowUpDate && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded block mt-0.5">
                        متابعة: {it.nextFollowUpDate}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteCrmInteraction(it.id)}
                    className="text-slate-300 hover:text-rose-600 p-2 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {filteredInteractions.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد متابعات مسجلة. انقر على &quot;تسجيل نشاط / متابعة&quot; لإضافة أول نشاط.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SUPPORT TICKETS */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 text-sm">تذاكر الدعم الفني وخدمة العملاء</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة استفسارات وشكاوى العملاء، تعيينها للموظفين، وتتبع زمن الحل والإغلاق.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddTicketModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              فتح تذكرة جديدة
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const pri = PRIORITY_CONFIG[ticket.priority];

              return (
                <div key={ticket.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                      <LifeBuoy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-500">{ticket.ticketNumber}</span>
                        <h4 className="font-bold text-slate-900 text-xs">{ticket.subject}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pri.color}`}>
                          {pri.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-semibold mt-1">
                        العميل: <strong className="text-slate-800">{ticket.customerName}</strong>
                        {ticket.assignedTo && (
                          <span className="mr-3 text-slate-500 font-normal">
                            المسؤول: <strong className="text-slate-700">{ticket.assignedTo}</strong>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl">{ticket.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 mr-auto md:mr-0">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateCrmTicket(ticket.id, { status: e.target.value as any })}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer ${
                        ticket.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ticket.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="open">مفتوحة</option>
                      <option value="in_progress">قيد المعالجة</option>
                      <option value="resolved">تم الحل ✅</option>
                      <option value="closed">مغلقة 🔒</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => deleteCrmTicket(ticket.id)}
                      className="text-slate-300 hover:text-rose-600 p-2 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد تذاكر دعم مطابقة.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SALES REPS & TARGETS DASHBOARD */}
      {activeTab === 'sales_reps' && (
        <CrmSalesRepDashboard
          onOpenCustomerStatement={(customerId) => setStatementCustomerId(customerId)}
        />
      )}

      {/* MODAL: ADD CUSTOMER */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">إضافة عميل جديد للنظام</h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCustomer} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 leading-relaxed">
                ✨ <strong>ملاحظة محاسبية:</strong> سيتم إنشاء حساب فرعي تلقائياً للعميل في شجرة الحسابات تحت كود (1130 العملاء والمدينون).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم العميل / المسؤول *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله أو شركة الأمل"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المنشأة / الشركة</label>
                  <input
                    type="text"
                    value={custCompany}
                    onChange={(e) => setCustCompany(e.target.value)}
                    placeholder="مثال: مؤسسة الأمل للمقاولات"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهاتف / الجوال</label>
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Sales Rep Selector */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-indigo-700">
                    مندوب المبيعات المسؤول (لحساب العمولات)
                  </label>
                  <select
                    value={custSalesRepId}
                    onChange={(e) => setCustSalesRepId(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-indigo-200 text-indigo-900 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden font-bold"
                  >
                    <option value="">-- بدون مندوب مبيعات --</option>
                    {salesReps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (عمولة {r.commissionRate}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price List Selector */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-amber-800">
                    قائمة أسعار المنتجات المخصصة للعميل
                  </label>
                  <select
                    value={custPriceListId}
                    onChange={(e) => setCustPriceListId(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-200 text-amber-900 rounded-xl p-2.5 focus:border-amber-500 focus:outline-hidden font-bold"
                  >
                    <option value="">-- قائمة الأسعار القياسية --</option>
                    {priceLists.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} {pl.discountPercent ? `(خصم ${pl.discountPercent}%)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الرقم الضريبي (إن وجد)</label>
                  <input
                    type="text"
                    value={custTax}
                    onChange={(e) => setCustTax(e.target.value)}
                    placeholder="300XXXXXXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الحد الائتماني المسموح</label>
                  <input
                    type="number"
                    value={custCreditLimit}
                    onChange={(e) => setCustCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">العنوان والموقع</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="المدينة، الحي، اسم الشارع"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ العميل وإنشاء الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CUSTOMER */}
      {showEditCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">تعديل بيانات العميل والمندوب</h3>
              <button
                type="button"
                onClick={() => setShowEditCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    required
                    value={editCustName}
                    onChange={(e) => setEditCustName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المنشأة / الشركة</label>
                  <input
                    type="text"
                    value={editCustCompany}
                    onChange={(e) => setEditCustCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={editCustPhone}
                    onChange={(e) => setEditCustPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editCustEmail}
                    onChange={(e) => setEditCustEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Assigned Sales Rep */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-indigo-700">
                    مندوب المبيعات المسؤول
                  </label>
                  <select
                    value={editCustSalesRepId}
                    onChange={(e) => setEditCustSalesRepId(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-indigo-200 text-indigo-900 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden font-bold"
                  >
                    <option value="">-- بدون مندوب مبيعات --</option>
                    {salesReps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (عمولة {r.commissionRate}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Price List */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-amber-800">
                    قائمة أسعار المنتجات
                  </label>
                  <select
                    value={editCustPriceListId}
                    onChange={(e) => setEditCustPriceListId(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-200 text-amber-900 rounded-xl p-2.5 focus:border-amber-500 focus:outline-hidden font-bold"
                  >
                    <option value="">-- قائمة الأسعار الافتراضية --</option>
                    {priceLists.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} {pl.discountPercent ? `(خصم ${pl.discountPercent}%)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الحد الائتماني</label>
                  <input
                    type="number"
                    value={editCustCreditLimit}
                    onChange={(e) => setEditCustCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">فترة السداد (أيام)</label>
                  <input
                    type="number"
                    value={editCustTerms}
                    onChange={(e) => setEditCustTerms(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">العنوان</label>
                <input
                  type="text"
                  value={editCustAddress}
                  onChange={(e) => setEditCustAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LEAD */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">إنشاء فرصة بيعية جديدة</h3>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewLead} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">عنوان الفرصة البيعية *</label>
                <input
                  type="text"
                  required
                  value={leadTitle}
                  onChange={(e) => setLeadTitle(e.target.value)}
                  placeholder="مثال: توريد شاشات وأجهزة لمقر الشركة"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم العميل / الشركة *</label>
                  <input
                    type="text"
                    required
                    value={leadCustomerName}
                    onChange={(e) => setLeadCustomerName(e.target.value)}
                    placeholder="اسم العميل المحتمل"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الشخص المسؤول</label>
                  <input
                    type="text"
                    value={leadContactPerson}
                    onChange={(e) => setLeadContactPerson(e.target.value)}
                    placeholder="اسم مسؤول التواصل"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">القيمة التقديرية للفرصة</label>
                  <input
                    type="number"
                    value={leadValue}
                    onChange={(e) => setLeadValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-black text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">احتمالية الإغلاق (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={leadProbability}
                    onChange={(e) => setLeadProbability(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المندوب المسؤول</label>
                  <select
                    value={leadRepId}
                    onChange={(e) => setLeadRepId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                  >
                    <option value="">-- تعيين مندوب --</option>
                    {salesReps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المرحلة الحالية</label>
                  <select
                    value={leadStage}
                    onChange={(e) => setLeadStage(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                  >
                    <option value="new">فرصة جديدة</option>
                    <option value="contacted">تم التواصل</option>
                    <option value="proposal_sent">عرض سعر مرسل</option>
                    <option value="negotiation">مفاوضات</option>
                    <option value="won">تم الفوز</option>
                    <option value="lost">خاسرة / ملغاة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات الفرصة</label>
                <textarea
                  rows={2}
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="تفاصيل المتطلبات والعروض..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ الفرصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INTERACTION */}
      {showAddInteractionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">تسجيل متابعة / نشاط عميل</h3>
              <button
                type="button"
                onClick={() => setShowAddInteractionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInteraction} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">العميل *</label>
                <select
                  required
                  value={intCustomerId}
                  onChange={(e) => setIntCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                >
                  <option value="">-- اختر العميل --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع النشاط</label>
                  <select
                    value={intType}
                    onChange={(e) => setIntType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                  >
                    <option value="call">اتصال هاتفي 📞</option>
                    <option value="meeting">اجتماع عمل 🤝</option>
                    <option value="email">بريد إلكتروني ✉️</option>
                    <option value="whatsapp">محادثة واتساب 💬</option>
                    <option value="task">مهمة متابعة 📋</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المندوب القائم بالنشاط</label>
                  <select
                    value={intRepId}
                    onChange={(e) => setIntRepId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                  >
                    <option value="">-- اختياري --</option>
                    {salesReps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">عنوان النشاط / ملخص الموضوع *</label>
                <input
                  type="text"
                  required
                  value={intTitle}
                  onChange={(e) => setIntTitle(e.target.value)}
                  placeholder="مثال: متابعة عرض الأسعار ومناقشة الدفعة الأولى"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تفاصيل ومخرجات المحادثة</label>
                <textarea
                  rows={2}
                  value={intNotes}
                  onChange={(e) => setIntNotes(e.target.value)}
                  placeholder="ما تم الاتفاق عليه..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ النشاط</label>
                  <input
                    type="date"
                    value={intDate}
                    onChange={(e) => setIntDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">موعد المتابعة القادمة</label>
                  <input
                    type="date"
                    value={intNextFollowUp}
                    onChange={(e) => setIntNextFollowUp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddInteractionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  تسجيل النشاط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TICKET */}
      {showAddTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">فتح تذكرة دعم فني / خدمة عملاء</h3>
              <button
                type="button"
                onClick={() => setShowAddTicketModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicket} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">العميل صاحب التذكرة *</label>
                <select
                  required
                  value={tktCustomerId}
                  onChange={(e) => setTktCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                >
                  <option value="">-- اختر العميل --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">موضوع التذكرة / المشكلة *</label>
                <input
                  type="text"
                  required
                  value={tktSubject}
                  onChange={(e) => setTktSubject(e.target.value)}
                  placeholder="مثال: استفسار بخصوص استبدال بضاعة أو فحص جهاز"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الأولوية</label>
                  <select
                    value={tktPriority}
                    onChange={(e) => setTktPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">مرتفعة</option>
                    <option value="urgent">عاجلة وفورية ⚠️</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">التصنيف</label>
                  <select
                    value={tktCategory}
                    onChange={(e) => setTktCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-bold"
                  >
                    <option value="technical">دعم فني</option>
                    <option value="billing">فواتير وحسابات</option>
                    <option value="complaint">شكوى</option>
                    <option value="inquiry">استفسار عام</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">شرح المشكلة بالتفصيل</label>
                <textarea
                  rows={3}
                  required
                  value={tktDesc}
                  onChange={(e) => setTktDesc(e.target.value)}
                  placeholder="وصف الحالة بالتفصيل..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTicketModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  فتح التذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER STATEMENT MODAL */}
      {statementCustomerId && (
        <CustomerStatementModal
          customerId={statementCustomerId}
          onClose={() => setStatementCustomerId(null)}
        />
      )}
    </div>
  );
};
