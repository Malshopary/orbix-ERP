import React, { useState } from 'react';
import { ActiveTab } from './Sidebar';
import { useErp } from '../context/ErpContext';
import {
  Layers,
  CheckCircle2,
  Database,
  ShieldCheck,
  Code2,
  BookOpenCheck,
  Package,
  Receipt,
  ShoppingCart,
  Users2,
  BadgeDollarSign,
  PieChart,
  Lightbulb,
  Cpu,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Server,
  FileCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface ErpBlueprintViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const ErpBlueprintView: React.FC<ErpBlueprintViewProps> = ({ setActiveTab }) => {
  const { companyProfile } = useErp();
  const [selectedSection, setSelectedSection] = useState<'architecture' | 'modules' | 'database' | 'accounting_rules' | 'roadmap'>('architecture');

  const coreModules = [
    {
      id: 'accounts' as ActiveTab,
      title: '1. المالية وشجرة الحسابات (General Ledger & COA)',
      tag: 'العمود الفقري',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: BookOpenCheck,
      desc: 'قيد اليومية المزدوج الآلي (Double-Entry Engine)، شجرة حسابات مرنة (أصول، خصوم، حقوق ملكية، إيرادات، مصروفات)، مراكز التكلفة، وإقفال الفترات المالية.',
      requirements: [
        'محرك قيد محاسبي مزدوج (Debit = Credit) إلزامي مع كل حركة مالية أو مخزنية.',
        'شجرة حسابات هرمية متعددة المستويات (1-الأصول، 2-الخصوم، 3-حقوق الملكية، 4-الإيرادات، 5-المصروفات).',
        'مراكز تكلفة (Cost Centers) لتوزيع المصاريف على المشاريع أو الفروع.',
        'نظام إقفال شهري وسنوي وترحيل الأرصدة إلى الأرباح المبقاة.',
      ],
    },
    {
      id: 'inventory' as ActiveTab,
      title: '2. المخازن وإدارة المخزون (Inventory Management)',
      tag: 'إدارة السلع والتكلفة',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Package,
      desc: 'تتبع الأصناف بالأرقام التسلسلية والباركود، تقييم المخزون (FIFO / المتوسط المرجح WAC)، تنبيهات حد الطلب، ومحاضر الجرد والتسوية الآلية.',
      requirements: [
        'حساب تكلفة البضاعة المباعة COGS آلياً مع كل فاتورة بيع.',
        'تعدد المستودعات مع أذونات التحويل الداخلي بين المخازن.',
        'تتبع تواريخ الصلاحية وأرقام الشحنات (Batches / Serial Numbers).',
        'ربط الجرد الدوري والمستمر مباشرة بحساب الأصول المخزنية في دليل الحسابات.',
      ],
    },
    {
      id: 'sales' as ActiveTab,
      title: '3. المبيعات والفوترة الإلكترونية (Sales & E-Invoicing)',
      tag: 'ZATCA & الضرائب',
      tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Receipt,
      desc: 'عروض أسعار، أوامر بيع، فواتير ضريبية مبسطة وأساسية متوافقة مع متطلبات ZATCA وتضمين رمز الاستجابة السريع QR المشفّر والتكامل مع بوابات الدفع.',
      requirements: [
        'توليد الفاتورة الضريبية وفق اشتراطات هيئة الزكاة والضريبة والجمارك (ZATCA Phase 1 & 2).',
        `احتساب ضريبة القيمة المضافة (VAT ${companyProfile.defaultVatRate}%) آلياً وتوزيعها بحساب الأمانات الضريبية.`,
        'تحويل عرض السعر إلى أمر بيع ثم فاتورة بضغطة زر واحدة دون إعادة إدخال.',
        'تحديث المخزون ورصيد العميل وإنشاء القيد المحاسبي تلقائياً لحظة حفظ الفاتورة.',
      ],
    },
    {
      id: 'purchases' as ActiveTab,
      title: '4. المشتريات والموردين (Purchasing & AP)',
      tag: 'سلاسل الإمداد',
      tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: ShoppingCart,
      desc: 'طلبات الشراء، أوامر الشراء، فواتير الموردين، سندات الاستلام المخزني GRN، ومطابقة الفاتورة الثلاثية (3-Way Matching).',
      requirements: [
        'مطابقة أمر الشراء + إذن استلام المخزن + فاتورة المورد لمنع الازدواجية.',
        'تسجيل التكاليف الإضافية (الشحن، الجمارك، التخليص) وتوزيعها على تكلفة السلع (Landed Costs).',
        'جدولة دفعات الموردين ومتابعة فترات الائتمان وسندات الصرف.',
      ],
    },
    {
      id: 'crm_collections' as ActiveTab,
      title: '5. CRM وأعمار الديون والتحصيل (Collections & Credit Control)',
      tag: 'حماية السيولة',
      tagColor: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: Users2,
      desc: 'تتبع العملاء، الحدود الائتمانية، تقارير أعمار الديون (0-30، 31-60، 61-90، +90 يوم)، وسندات القبض والتذكير الآلي بالتحصيل.',
      requirements: [
        'تحديد حد ائتماني ومدة سماح لكل عميل مع حظر إصدار فواتير آجلة عند تجاوز الحد.',
        'مصفوفة أعمار الديون اللحظية لكشف الديون المعدومة والراكدة وتوليد مخصص ديون مشكوك فيها.',
        'إصدار سندات القبض وربطها المباشر بالفواتير المفتوحة لتصفيتها.',
        'تذكيرات آلية عبر البريد والرسائل قبل استحقاق الفواتير.',
      ],
    },
    {
      id: 'hr_payroll' as ActiveTab,
      title: '6. الموارد البشرية ومسير الرواتب (HR & Payroll WPS)',
      tag: 'حماية الأجور والتأمينات',
      tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      icon: BadgeDollarSign,
      desc: 'سجلات الموظفين، هيكل الرواتب والبدلات، التأمينات الاجتماعية (GOSI)، مسيرات الرواتب الشهرية، وملفات حماية الأجور WPS، ومستحقات نهاية الخدمة.',
      requirements: [
        'احتساب تلقائي للبدلات (سكن، نقل) والخصومات (تأمينات اجتماعية، غيابات، سلف).',
        'توليد ملف حماية الأجور (WPS SIF File) المتوافق مع البنوك المركزية ووزارة الموارد البشرية.',
        'ترحيل مسير الرواتب إلى قيود محاسبية آلية (مصروف رواتب، مستحقات رواتب، أمانات تأمينات).',
        'حاسبة مخصص مكافأة نهاية الخدمة وفق قانون العمل المعمول به.',
      ],
    },
    {
      id: 'financial_reports' as ActiveTab,
      title: '7. التقارير والقوائم المالية (Financial Statements & BI)',
      tag: 'القرارات الاستراتيجية',
      tagColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      icon: PieChart,
      desc: 'قائمة الدخل (P&L)، الميزانية العمومية (Balance Sheet)، ميزان المراجعة، كشوف الحسابات التفصيلية، وتحليل التدفقات النقدية ومعدل دوران المخزون.',
      requirements: [
        'استخراج القوائم المالية وفق معايير المحاسبة الدولية IFRS.',
        'ميزان مراجعة فوري ومتوازن على مستوى كل مستوى من شجرة الحسابات.',
        'إمكانية الحفر لأسفل (Drill-Down) من أي رقم في التقرير إلى القيد وأصل الفاتورة.',
        'تصدير التقارير بصيغ PDF وExcel وطباعة معتمدة للتدقيق المالي.',
      ],
    },
  ];

  const dbTables = [
    {
      name: 'accounts',
      title: 'جدول دليل الحسابات',
      fields: 'id, code, name, type (asset/liability/equity/revenue/expense), parent_code, balance, is_header',
    },
    {
      name: 'journal_entries & lines',
      title: 'جدول قيود اليومية والأسطر',
      fields: 'id, entry_number, date, reference, description, lines: [account_id, debit, credit, description]',
    },
    {
      name: 'products & inventory_ledger',
      title: 'جدول المنتجات وحركات المخزون',
      fields: 'id, sku, name, category, cost_price, selling_price, stock_quantity, min_alert, warehouse_id',
    },
    {
      name: 'sales_invoices & items',
      title: 'جدول فواتير المبيعات وبنودها',
      fields: 'id, invoice_number, customer_id, date, due_date, subtotal, vat_total, total, paid, status',
    },
    {
      name: 'customers & debt_aging',
      title: 'جدول العملاء وأعمار الديون',
      fields: 'id, name, company, credit_limit, payment_terms_days, current_balance, overdue_balance',
    },
    {
      name: 'purchase_invoices & vendors',
      title: 'جدول المشتريات والموردين',
      fields: 'id, vendor_id, bill_number, date, total_amount, paid_amount, remaining_amount, status',
    },
    {
      name: 'employees & payroll_runs',
      title: 'جدول الموظفين ومسيرات الرواتب',
      fields: 'id, employee_id, basic_salary, allowances, deductions, net_salary, gosi_share, status',
    },
    {
      name: 'payment_receipts',
      title: 'جدول سندات القبض والصرف',
      fields: 'id, voucher_number, type (in/out), party_id, amount, account_id, payment_method, notes',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Blueprint Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              الدليل المعماري والهندسي الشامل
            </span>
            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full border border-slate-700">
              ERP Enterprise Architecture
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            ما الذي يلزم لبناء نظام محاسبي وإداري متكامل (ERP)؟
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
            بناء نظام ERP متكامل يتطلب ربط <span className="text-emerald-400 font-bold">7 وحدات محورية مترابطة</span> بنواة محاسبية مزدوجة تضمن عدم ضياع أي حركة مالية، مع تكامل الفوترة الإلكترونية، وإدارة سلاسل الإمداد، وتتبع أعمار الديون والتحصيل، ومسيرات الرواتب المتوافقة مع القوانين.
          </p>

          {/* Quick Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800">
            <button
              onClick={() => setSelectedSection('architecture')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                selectedSection === 'architecture'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <Cpu className="w-4 h-4" />
              1. المعمارية والمبادئ الأساسية
            </button>
            <button
              onClick={() => setSelectedSection('modules')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                selectedSection === 'modules'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              2. تفصيل الوحدات السبع (7 Modules)
            </button>
            <button
              onClick={() => setSelectedSection('database')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                selectedSection === 'database'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <Database className="w-4 h-4" />
              3. هيكل قاعدة البيانات والعلاقات
            </button>
            <button
              onClick={() => setSelectedSection('accounting_rules')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                selectedSection === 'accounting_rules'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              4. القواعد المحاسبية الصارمة
            </button>
            <button
              onClick={() => setSelectedSection('roadmap')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                selectedSection === 'roadmap'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <Code2 className="w-4 h-4" />
              5. خطة التنفيذ والتقنيات المقترحة
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: ARCHITECTURE & CORE PRINCIPLES */}
      {selectedSection === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">
                النواة المحاسبية المركزية (GL Engine)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                كل حركة في النظام (بيع، شراء، صرف، قبض، رواتب، إتلاف مخزون) يجب أن تُترجم لحظياً إلى قيد محاسبي مزدوج متزن دون تدخل يدوي.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">
                منع تضارب وتكرار البيانات (Single Source of Truth)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                العميل، المورد، الصنف، والموظف يتم تسجيلهم مرة واحدة في قاعدة البيانات وتتشارك جميع الوحدات سجلاتهم لمنع الازدواجية والتناقض.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">
                الامتثال القانوني والضريبي (ZATCA & WPS)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تطبيق معايير الفوترة الإلكترونية مع توليد رموز الاستجابة السريعة المشفرة، وملفات حماية الأجور للبنوك، وضريبة القيمة المضافة {companyProfile.defaultVatRate}%.
              </p>
            </div>
          </div>

          {/* Interactive Flow Diagram */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              مخطط تدفق العمليات المحاسبية المؤتمتة (Automated ERP Flow)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              كيف تتكامل العمليات التشغيلية وتتحول تلقائياً إلى تقارير ختامية وقوائم مالية لحظية:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">عملية بيع جديدة (Sales Invoice)</h4>
                    <p className="text-xs text-slate-500">إصدار فاتورة ضريبية إلكترونية لعميل بقيمة 5,000 ريال مثلاً</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  ينشئ قيد: من ح/ المدينون (العميل) إلى ح/ إيراد المبيعات وح/ ضريبة المخرجات المستحقة
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">تأثير المخزون الفوري (Inventory COGS)</h4>
                    <p className="text-xs text-slate-500">خصم الكميات المباعة من المستودع تلقائياً</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  ينشئ قيد: من ح/ تكلفة البضاعة المباعة (COGS) إلى ح/ المخزون السلعي (أصول)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">تحديث مصفوفة أعمار الديون (CRM Aging)</h4>
                    <p className="text-xs text-slate-500">مراقبة سداد الفاتورة وفترة الاستحقاق (0-30، 31-60، إلخ)</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  تحديث الرصيد اللحظي للعميل وإرسال تنبيه بالتحصيل عند اقتراب موعد السداد
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">التقارير الختامية الفورية (Financial Reports)</h4>
                    <p className="text-xs text-slate-500">انعكاس الإيراد والتكلفة في قائمة الدخل والميزانية</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                  تحديث مباشر لقائمة الدخل (الأرباح) والميزانية العمومية وميزان المراجعة
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: THE 7 CORE MODULES DETAIL */}
      {selectedSection === 'modules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {coreModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-base">{mod.title}</h3>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${mod.tagColor}`}>
                        {mod.tag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-3">{mod.desc}</p>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-800 mb-2">المتطلبات التقنية والمحاسبية الإلزامية:</p>
                      <ul className="space-y-1.5">
                        {mod.requirements.map((req, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActiveTab(mod.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>استكشف هذه الوحدة في التطبيق الحقيقي</span>
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: DATABASE SCHEMA */}
      {selectedSection === 'database' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              هيكل الجداول وقواعد البيانات العلائقية (Relational Database Schema)
            </h3>
            <p className="text-xs text-slate-500">
              الجداول الأساسية المطلوبة في PostgreSQL أو MySQL مع الحقول الجوهرية لضمان الربط السليم:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbTables.map((tbl, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {tbl.name}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{tbl.title}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed break-words">
                  {tbl.fields}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: STRICT ACCOUNTING RULES */}
      {selectedSection === 'accounting_rules' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              القواعد والضوابط المحاسبية الصارمة (Strict Accounting Invariants)
            </h3>
            <p className="text-xs text-slate-500">
              ضوابط برمجية يجب حظر تجاوزها لمنع أي خلل في القوائم المالية:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
              <h4 className="font-bold text-rose-900 text-sm mb-1">1. توازن القيد المزدوج الإجباري</h4>
              <p className="text-xs text-rose-700 leading-relaxed">
                ممنوع حفظ أي قيد يومية إذا كان مجموع المدين لا يساوي مجموع الدائن (Debit === Credit). يتم التحقق على مستوى الواجهة والخلفية (Backend Constraints).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <h4 className="font-bold text-amber-900 text-sm mb-1">2. عدم حذف القيود المرحلة (Immutability)</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                بمجرد ترحيل الفاتورة أو القيد، لا يتم حذفه من قاعدة البيانات نهائياً. التعديل يتم عبر إصدار "قيد عكسي / إشعار دائن أو مدين" لضمان مسار التدقيق (Audit Trail).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <h4 className="font-bold text-emerald-900 text-sm mb-1">3. معادلة الميزانية العمومية الصفرية</h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                الأصول = الخصوم + حقوق الملكية + (صافي أرباح الفترة الحالية). أي عدم توازن يشير إلى وجود قيد غير متزن أو حساب غير مرتبط بالشجرة.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
              <h4 className="font-bold text-blue-900 text-sm mb-1">4. رقابة الائتمان والتحصيل الصارمة</h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                حظر إصدار فواتير بيع آجلة للعملاء الذين تجاوزوا الحد الائتماني المسموح به أو لديهم فواتير متعثرة تجاوزت 90 يوماً إلا بموافقة المدير المالي.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: ROADMAP & TECH STACK */}
      {selectedSection === 'roadmap' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-600" />
              مراحل التنفيذ والتقنيات الموصى بها (Implementation Roadmap)
            </h3>
            <p className="text-xs text-slate-500">
              خطة عمل زمنية لبناء وتشغيل نظام ERP متكامل بنجاح:
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                فاز 1
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">تأسيس النواة المحاسبية وشجرة الحسابات</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  بناء محرك القيود المزدوجة، شجرة الحسابات المعيارية، جدول مراكز التكلفة، وميزان المراجعة الآلي.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                فاز 2
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">المستودعات وسلاسل الإمداد والمشتريات</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  نظام الأرقام التسلسلية، تقييم تكلفة المخزون بالمتوسط المرجح، فواتير المشتريات ومطابقة سندات الاستلام.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                فاز 3
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">المبيعات، الفوترة الإلكترونية ZATCA، وCRM</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  إصدار الفواتير الضريبية وتوليد QR Code المشفر، تتبع العملاء، إدارة أعمار الديون، وسندات القبض.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                فاز 4
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">الموارد البشرية والرواتب WPS والتقارير الختامية</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  مسيرات الرواتب الشهرية، ملفات حماية الأجور، قسائم الرواتب، وتوليد قائمة الدخل والميزانية العمومية والتدفقات النقدية.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
