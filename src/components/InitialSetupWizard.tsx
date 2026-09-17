import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  UserCheck,
  CheckCircle2,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Calculator,
  Lock,
  Layers,
  Coins,
  Receipt,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  BadgePercent,
  Check,
  Eye,
  EyeOff,
  FolderTree,
  DollarSign,
  Upload,
  Database,
  RefreshCw,
  Server,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { AppUser, CompanyProfile } from '../types';

export const InitialSetupWizard: React.FC = () => {
  const {
    companyProfile,
    currencies,
    accounts,
    completeInitialSetup,
    restoreBackupJSON,
    showAlert,
  } = useErp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showDbPassword, setShowDbPassword] = useState<boolean>(false);

  // Step 1: Company Profile State - Clean and empty for the new user
  const isOldDemo =
    companyProfile.nameAr === 'شركة أوربكس للحلول المتكاملة والتجارة' ||
    companyProfile.nameAr === 'شركة التجارة والحلول المتكاملة' ||
    companyProfile.taxNumber === '30045678900003';

  const [companyForm, setCompanyForm] = useState({
    nameAr: isOldDemo ? '' : (companyProfile.nameAr || ''),
    nameEn: isOldDemo ? '' : (companyProfile.nameEn || ''),
    taxNumber: isOldDemo ? '' : (companyProfile.taxNumber || ''),
    commercialRegister: isOldDemo ? '' : (companyProfile.commercialRegister || ''),
    city: isOldDemo ? '' : (companyProfile.city || ''),
    address: isOldDemo ? '' : (companyProfile.address || ''),
    phone: isOldDemo ? '' : (companyProfile.phone || ''),
    mobile: isOldDemo ? '' : (companyProfile.mobile || ''),
    email: isOldDemo ? '' : (companyProfile.email || ''),
    defaultCurrency: companyProfile.defaultCurrency || 'EGP',
    defaultVatRate: companyProfile.defaultVatRate ?? 14,
  });

  // Step 2: Super Admin Account State
  const [adminForm, setAdminForm] = useState({
    name: '',
    username: 'admin',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pin: '',
  });

  // Step 4: PostgreSQL Database Configuration State
  const [dbForm, setDbForm] = useState({
    host: 'localhost',
    port: '5432',
    database: 'orbix_erp',
    user: 'postgres',
    password: '123',
    ssl: false,
  });

  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);
  const [dbTestResult, setDbTestResult] = useState<{
    ok: boolean;
    latency?: number;
    database?: string;
    version?: string;
    tablesCount?: number;
    message?: string;
    error?: string;
  } | null>(null);

  // Load current DB configuration from server environment on mount
  useEffect(() => {
    fetch('/api/setup/db-config')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.config) {
          setDbForm({
            host: data.config.host || 'localhost',
            port: String(data.config.port || '5432'),
            database: data.config.database || 'orbix_erp',
            user: data.config.user || 'postgres',
            password: data.config.password || '123',
            ssl: Boolean(data.config.ssl),
          });
        }
      })
      .catch(() => {});
  }, []);

  // Real-time Database Input Sanitizer and Security Shield
  const sanitizeDbInput = (field: 'host' | 'port' | 'database' | 'user', value: string) => {
    // Check for dangerous SQL keywords or injection patterns
    const dangerousPattern = /(union|select|insert|drop|truncate|delete|update|exec|xp_|--|\/\*|\*\/|;|<|>|"|')/i;
    if (dangerousPattern.test(value)) {
      setSecurityWarning('درع الأمان الوقائي: تم رصد محاولة إدخال غير آمنة أو رموز ضارة وتم حظرها فوراً.');
    } else if (/[^\x00-\x7F]/.test(value)) {
      setSecurityWarning('تنبيه: حقول خادم وقاعدة البيانات تقبل حصراً الأحرف والأرقام والرموز الإنجليزية القياسية.');
    } else {
      setSecurityWarning(null);
    }

    let cleaned = value;
    if (field === 'port') {
      cleaned = value.replace(/\D/g, '').slice(0, 5);
    } else if (field === 'host') {
      cleaned = value.replace(/[^a-zA-Z0-9.\-_]/g, '');
    } else if (field === 'database' || field === 'user') {
      cleaned = value.replace(/[^a-zA-Z0-9_]/g, '');
    }

    setDbForm((prev) => ({ ...prev, [field]: cleaned }));
  };

  const handleDbPasswordChange = (value: string) => {
    if (value.includes('\0')) {
      setSecurityWarning('غير مسموح بوجود أحرف Null Byte في كلمة المرور.');
      return;
    }
    setDbForm((prev) => ({ ...prev, password: value }));
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(false);
  const [isRestoringFile, setIsRestoringFile] = useState<boolean>(false);

  // Restore backup JSON file directly from setup wizard
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoringFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = restoreBackupJSON(content);
        if (res.success) {
          showAlert('success', 'تم استرجاع البيانات بنجاح', res.message);
        } else {
          showAlert('error', 'فشل استرجاع النسخة', res.message);
        }
      } catch (err: any) {
        showAlert('error', 'خطأ في معالجة الملف', err?.message || 'الملف المختار غير صالح');
      } finally {
        setIsRestoringFile(false);
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      showAlert('error', 'فشل قراءة الملف', 'تعذر قراءة ملف النسخة الاحتياطية.');
      setIsRestoringFile(false);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Sync existing state from central PostgreSQL DB
  const handleSyncFromDb = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/sync/state');
      if (!res.ok) throw new Error('تعذر الاتصال بخادم قاعدة البيانات');
      const data = await res.json();
      if (data?.success && data?.state && Array.isArray(data.state.users) && data.state.users.length > 0) {
        const stateStr = JSON.stringify(data.state);
        const restoreRes = restoreBackupJSON(stateStr);
        if (restoreRes.success) {
          showAlert('success', 'تم جلب البيانات بنجاح!', 'تم العثور على قاعدة بيانات المنشأة السابقة واستيرادها بالكامل بنجاح.');
          return;
        }
      }
      showAlert(
        'info',
        'لم يتم العثور على بيانات سابقة',
        'خادم قاعدة البيانات متصل ولكنه لا يحتوي على بيانات منشأة مسجلة مسبقاً. يرجى إكمال المعالج لتأسيس شركتك الأولى، أو استرجاع ملف نسخة احتياطية (.json).'
      );
    } catch (err: any) {
      showAlert('error', 'خطأ في الاتصال بقاعدة البيانات', err?.message || 'تعذر جلب البيانات من الخادم.');
    } finally {
      setIsCheckingDb(false);
    }
  };

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!companyForm.nameAr.trim()) {
      errors.nameAr = 'يرجى إدخال اسم المنشأة / الشركة بالعربية';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!adminForm.name.trim()) {
      errors.name = 'يرجى إدخال اسم المدير بالكامل';
    }
    if (!adminForm.username.trim()) {
      errors.username = 'يرجى إدخال اسم مستخدم الدخول';
    }
    if (!adminForm.password || adminForm.password.length < 3) {
      errors.password = 'كلمة المرور يجب أن لا تقل عن 3 أحرف';
    }
    if (adminForm.password !== adminForm.confirmPassword) {
      errors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }
    if (!adminForm.pin || adminForm.pin.length !== 4) {
      errors.pin = 'رمز الـ PIN السريع يجب أن يتكون من 4 أرقام';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 4 (PostgreSQL Database Credentials)
  const validateStep4 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!dbForm.host.trim()) {
      errors.dbHost = 'يرجى إدخال عنوان المضيف (Host) مثل: localhost أو 127.0.0.1';
    }
    const portNum = parseInt(dbForm.port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errors.dbPort = 'منفذ الاتصال يجب أن يكون رقماً صحيحاً بين 1 و 65535';
    }
    if (!dbForm.database.trim()) {
      errors.dbDatabase = 'يرجى إدخال اسم قاعدة البيانات (مثال: orbix_erp)';
    }
    if (!dbForm.user.trim()) {
      errors.dbUser = 'يرجى إدخال اسم مستخدم قاعدة البيانات (مثال: postgres)';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Test Database Connection
  const handleTestDbConnection = async () => {
    if (!validateStep4()) return;
    setIsTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/setup/test-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbForm),
      });
      const data = await res.json();
      setDbTestResult(data);
      if (data.ok) {
        showAlert(
          'success',
          'نجح الاتصال بقاعدة البيانات!',
          `زمن الاستجابة: ${data.latency}ms • إصدار: ${data.version || 'PostgreSQL'}`
        );
      } else {
        showAlert(
          'error',
          'فشل الاتصال بقاعدة البيانات',
          data.error || 'يرجى التأكد من تشغيل خادم PostgreSQL وصحة البيانات.'
        );
      }
    } catch (err: any) {
      setDbTestResult({ ok: false, error: err.message || 'تعذر التواصل مع خادم النظام.' });
      showAlert('error', 'خطأ في الاتصال', 'تعذر إرسال طلب فحص الاتصال بالخادم.');
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setFormErrors({});
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
    if (currentStep === 4) setCurrentStep(3);
  };

  const handleFinishSetup = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep4()) return;

    setIsSubmitting(true);

    // 1. Save database configuration to .env and auto-provision core tables
    try {
      const dbRes = await fetch('/api/setup/save-db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbForm),
      });
      const dbData = await dbRes.json();
      if (!dbData.ok) {
        showAlert('error', 'فشل حفظ إعدادات قاعدة البيانات', dbData.error || 'يرجى مراجعة إعدادات السيرفر.');
        setIsSubmitting(false);
        return;
      }
    } catch (err: any) {
      console.warn('Could not contact server to save .env, proceeding with local ERP state:', err);
    }

    // 2. Prepare company profile
    const updatedProfile: Partial<CompanyProfile> = {
      nameAr: companyForm.nameAr.trim(),
      nameEn: companyForm.nameEn.trim(),
      taxNumber: companyForm.taxNumber.trim(),
      commercialRegister: companyForm.commercialRegister.trim(),
      city: companyForm.city.trim(),
      address: companyForm.address.trim(),
      phone: companyForm.phone.trim(),
      mobile: companyForm.mobile.trim(),
      email: companyForm.email.trim(),
      defaultCurrency: companyForm.defaultCurrency as any,
      defaultVatRate: Number(companyForm.defaultVatRate),
    };

    // 3. Prepare Super Admin user
    const newAdminUser: AppUser = {
      id: 'usr-admin-primary',
      name: adminForm.name.trim(),
      username: adminForm.username.trim(),
      password: adminForm.password,
      pin: adminForm.pin.trim(),
      role: 'admin',
      permissions: [
        'dashboard',
        'quick_pos',
        'accounts',
        'inventory',
        'sales',
        'purchases',
        'crm_collections',
        'hr_payroll',
        'financial_reports',
        'settings',
        'erp_blueprint',
      ],
      isActive: true,
      avatarUrl: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    setTimeout(() => {
      completeInitialSetup(updatedProfile, newAdminUser);
      setIsSubmitting(false);
    }, 600);
  };

  // Group accounts by main category for step 3 preview
  const assetAccounts = accounts.filter((a) => a.type === 'asset');
  const liabilityAccounts = accounts.filter((a) => a.type === 'liability');
  const equityAccounts = accounts.filter((a) => a.type === 'equity');
  const revenueAccounts = accounts.filter((a) => a.type === 'revenue');
  const expenseAccounts = accounts.filter((a) => a.type === 'expense');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md text-white font-bold text-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                تهيئة وإعداد النظام لأول مرة
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  ترحيب بشركتك الجديدة
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                معالج البدء الفوري وتسجيل المدير العام وضبط الحسابات القياسية
              </p>
            </div>
          </div>

          {/* Step Badges */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Step 1 */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 1
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : currentStep > 1
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. بيانات المنشأة</span>
              {currentStep > 1 && <Check className="w-3.5 h-3.5" />}
            </div>

            <div className="w-3 h-0.5 bg-slate-800" />

            {/* Step 2 */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 2
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : currentStep > 2
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>2. حساب المدير العام</span>
              {currentStep > 2 && <Check className="w-3.5 h-3.5" />}
            </div>

            <div className="w-3 h-0.5 bg-slate-800" />

            {/* Step 3 */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 3
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : currentStep > 3
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>3. شجرة الحسابات</span>
              {currentStep > 3 && <Check className="w-3.5 h-3.5" />}
            </div>

            <div className="w-3 h-0.5 bg-slate-800" />

            {/* Step 4 */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 4
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>4. قاعدة البيانات والجاهزية</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* STEP 1: COMPANY IDENTITY & FINANCIAL CONFIG */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  الخطوة الأولى: الهوية والبيانات المالية الأساسية
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  معلومات الشركة والمنشأة
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  أدخل البيانات الرسمية للمؤسسة لطباعتها تلقائياً على الفواتير، عروض الأسعار، وسندات القبض والصرف.
                </p>
              </div>

              {/* Quick Restore from Backup or Existing DB Banner */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        لديك بيانات سابقة أو قمت بتثبيت النظام من جديد؟
                        <span className="text-[10px] bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                          دخول فوري
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        لست بحاجة لتسجيل بياناتك من الصفر مجدداً! يمكنك استرجاع ملف نسختك الاحتياطية السابقة، أو سحب بياناتك فوراً من خادم PostgreSQL.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
                    <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-98">
                      <Upload className={`w-4 h-4 ${isRestoringFile ? 'animate-bounce' : ''}`} />
                      <span>{isRestoringFile ? 'جاري الاسترجاع...' : 'استرجاع نسخة احتياطية (.json)'}</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestoreFile}
                        disabled={isRestoringFile}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleSyncFromDb}
                      disabled={isCheckingDb}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                      title="فحص قاعدة بيانات PostgreSQL وجلب بيانات الشركة السابقة"
                    >
                      <RefreshCw className={`w-4 h-4 text-emerald-400 ${isCheckingDb ? 'animate-spin' : ''}`} />
                      <span>{isCheckingDb ? 'جاري الفحص...' : 'فحص قاعدة البيانات (Sync)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Arabic Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم الشركة / المنشأة (بالعربية) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyForm.nameAr}
                    onChange={(e) => setCompanyForm({ ...companyForm, nameAr: e.target.value })}
                    placeholder="مثال: شركة النصر للتجارة والتوريدات"
                    className={`w-full bg-slate-950 border ${
                      formErrors.nameAr ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.nameAr && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.nameAr}</p>
                  )}
                </div>

                {/* English Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم الشركة (بالإنجليزية)
                  </label>
                  <input
                    type="text"
                    value={companyForm.nameEn}
                    onChange={(e) => setCompanyForm({ ...companyForm, nameEn: e.target.value })}
                    placeholder="e.g. Al-Nasr Trading & Supplies Co."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Tax Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>الرقم الضريبي / السجل الضريبي</span>
                    <span className="text-[10px] text-slate-400">للفاتورة الإلكترونية</span>
                  </label>
                  <input
                    type="text"
                    value={companyForm.taxNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxNumber: e.target.value })}
                    placeholder="مثال: 300-123-456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Commercial Register */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رقم السجل التجاري
                  </label>
                  <input
                    type="text"
                    value={companyForm.commercialRegister}
                    onChange={(e) => setCompanyForm({ ...companyForm, commercialRegister: e.target.value })}
                    placeholder="مثال: 104523 - القاهرة"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Base Currency */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    العملة الأساسية للنظام والحسابات
                  </label>
                  <select
                    value={companyForm.defaultCurrency}
                    onChange={(e) => setCompanyForm({ ...companyForm, defaultCurrency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default VAT Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <BadgePercent className="w-3.5 h-3.5 text-emerald-400" />
                    نسبة ضريبة القيمة المضافة الافتراضية (%)
                  </label>
                  <select
                    value={companyForm.defaultVatRate}
                    onChange={(e) => setCompanyForm({ ...companyForm, defaultVatRate: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  >
                    <option value={14}>14% (ضريبة القيمة المضافة - مصر)</option>
                    <option value={15}>15% (ضريبة القيمة المضافة - السعودية)</option>
                    <option value={5}>5% (ضريبة القيمة المضافة - الإمارات)</option>
                    <option value={0}>0% (معفى من الضريبة / لا توجد ضريبة)</option>
                  </select>
                </div>

                {/* City & Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    المدينة والدولة
                  </label>
                  <input
                    type="text"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    placeholder="مثال: القاهرة، الرياض، دبي..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Detailed Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    العنوان التفصيلي
                  </label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    placeholder="مثال: التجمع الخامس - شارع التسعين"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Phone & Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    هاتف الشركة أو الجوال
                  </label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    placeholder="مثال: 01012345678"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    البريد الإلكتروني الرسمي
                  </label>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    placeholder="info@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SUPER ADMIN ACCOUNT REGISTRATION */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  الخطوة الثانية: تسجيل حساب المدير العام المسؤول
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  إنشاء حساب الإدارة العليا (Super Admin)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  سيكون لهذا الحساب كامل الصلاحيات الإدارية والمالية وإدارة المستخدمين وإعدادات النظام.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Admin Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الاسم الكامل للمدير <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    placeholder="مثال: م. أحمد محمد عبد الرحمن"
                    className={`w-full bg-slate-950 border ${
                      formErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم المستخدم للدخول (Username) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminForm.username}
                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="مثال: admin"
                    className={`w-full bg-slate-950 border ${
                      formErrors.username ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.username && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.username}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>كلمة المرور <span className="text-rose-400">*</span></span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPassword ? 'إخفاء' : 'إظهار'}
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      placeholder="••••••"
                      className={`w-full bg-slate-950 border ${
                        formErrors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                      } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                    />
                  </div>
                  {formErrors.password && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    تأكيد كلمة المرور <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminForm.confirmPassword}
                    onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                    placeholder="••••••"
                    className={`w-full bg-slate-950 border ${
                      formErrors.confirmPassword ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>

                {/* PIN Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      رمز الـ PIN السريع (4 أرقام) <span className="text-rose-400">*</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-normal">
                      للدخول السريع وشاشات الكاشير POS
                    </span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={adminForm.pin}
                    onChange={(e) => setAdminForm({ ...adminForm, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234"
                    className={`w-full bg-slate-950 border ${
                      formErrors.pin ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-center tracking-widest text-lg font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.pin && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.pin}</p>
                  )}
                </div>

                {/* Admin Role Badge & Permission Overview */}
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    مستوى الصلاحية الممنوح: مدير عام شامل (Super Admin)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    يشمل إدارة دليل الحسابات، قيود اليومية، فواتير المبيعات ونقاط البيع، المشتريات والموردين، المخزون، الرواتب، وإعدادات الشركة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STANDARD CHART OF ACCOUNTS & CONFIRMATION */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 mb-2">
                  <FolderTree className="w-3.5 h-3.5" />
                  الخطوة الثالثة: اعتماد الدليل المحاسبي والجاهزية
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  شجرة الحسابات المحاسبية المعتمدة للشركة
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  تم تضمين شجرة الحسابات القياسية للشركات المحاسبية (الأصول، الخصوم، حقوق الملكية، الإيرادات، المصروفات) بـ 0.00 رصيد افتتاحي جاهزة لعملياتك.
                </p>
              </div>

              {/* Summary of 5 Chart of Accounts Roots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Assets */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      1. الأصول (Assets)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      {assetAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• الخزينة الرئيسية والبنوك والمحافظ</li>
                    <li>• العملاء والمدينون ومخزون البضائع</li>
                    <li>• الأصول الثابتة ونقاط البيع POS</li>
                  </ul>
                </div>

                {/* 2. Liabilities */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-rose-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      2. الخصوم والالتزامات (Liabilities)
                    </span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                      {liabilityAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• الموردون والدائنون وأوراق الدفع</li>
                    <li>• ضريبة القيمة المضافة مخرجات</li>
                    <li>• مخصص الرواتب والأجور المستحقة</li>
                  </ul>
                </div>

                {/* 3. Equity */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      3. حقوق الملكية (Equity)
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                      {equityAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• رأس المال المدفوع التأسيسي</li>
                    <li>• الأرباح المدورة والمحتجزة</li>
                    <li>• جاري الشركاء والاحتياطيات</li>
                  </ul>
                </div>

                {/* 4. Revenue */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      4. الإيرادات والمبيعات (Revenue)
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                      {revenueAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• إيرادات مبيعات المنتجات وPOS</li>
                    <li>• إيرادات الخدمات والصيانة</li>
                    <li>• الخصومات والعوائد الأخرى</li>
                  </ul>
                </div>

                {/* 5. Expenses */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-amber-500/30 sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      5. المصروفات والتكاليف (Expenses)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                      {expenseAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• تكلفة البضاعة المباعة (COGS) ومصروفات الرواتب والأجور</li>
                    <li>• الإيجار والمرافق والتسويق والشحن والصيانة ورسوم البنوك والإهلاك</li>
                  </ul>
                </div>
              </div>

              {/* System State Notice */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-0.5">جاهزية النظام النظيف:</strong>
                  تم تجهيز قاعدة البيانات بحالة فارغة 100% (بدون فواتير تجريبية أو قيود وهمية سابقة)، لتتمكن من إدخال منتجاتك وعملائك ومورديك وفواتيرك الحقيقية من اليوم الأول.
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DATABASE CONNECTION & SECURITY SHIELD */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 mb-2">
                  <Database className="w-3.5 h-3.5" />
                  الخطوة الرابعة: إعداد وتأمين قاعدة بيانات PostgreSQL
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  ربط خادم قاعدة البيانات وموقع حفظ السجلات
                  <span className="text-xs font-mono font-normal bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    PostgreSQL Engine
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  قم بضبط بيانات الاتصال بخادم قاعدة البيانات المحلي أو السحابي الخاص بشركتك، مع درع الحماية اللحظي من استعلامات الحقن وحظر الرموز الضارة.
                </p>
              </div>

              {/* Security Shield Banner */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      درع الحماية الأمنية الحي (SQL Injection & Encoding Shield)
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      يتم فحص وتطهير كافة المدخلات لحظياً وحصرها في الأحرف والأرقام الإنجليزية المعتمدة، مع حظر الرموز والأكواد التخريبية.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono shrink-0">
                  ASCII Safe Input Only
                </div>
              </div>

              {/* Warning Banner if suspicious pattern caught */}
              {securityWarning && (
                <div className="bg-rose-950/60 border border-rose-500/50 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-200">
                    <strong className="block font-bold text-rose-100 mb-0.5">تنبيه أمني فوري:</strong>
                    {securityWarning}
                  </div>
                </div>
              )}

              {/* Form Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Host */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-emerald-400" />
                      عنوان خادم قاعدة البيانات (Host / IP / Domain) <span className="text-rose-400">*</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">English letters, digits, dots, hyphens</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={dbForm.host}
                    onChange={(e) => sanitizeDbInput('host', e.target.value)}
                    placeholder="localhost or 127.0.0.1 or db.cloud.internal"
                    className={`w-full bg-slate-950 border ${
                      formErrors.dbHost ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>أمثلة: <code className="text-slate-300 bg-slate-800 px-1 rounded">localhost</code> أو <code className="text-slate-300 bg-slate-800 px-1 rounded">127.0.0.1</code> أو سيرفر LAN</span>
                    {formErrors.dbHost && <span className="text-rose-400 font-semibold">{formErrors.dbHost}</span>}
                  </div>
                </div>

                {/* 2. Port */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>منفذ الاتصال (Port) <span className="text-rose-400">*</span></span>
                    <span className="text-[10px] text-emerald-400 font-mono">1 - 65535</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={5}
                    value={dbForm.port}
                    onChange={(e) => sanitizeDbInput('port', e.target.value)}
                    placeholder="5432"
                    className={`w-full bg-slate-950 border ${
                      formErrors.dbPort ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>الافتراضي لـ PostgreSQL هو <code className="text-slate-300 bg-slate-800 px-1 rounded">5432</code></span>
                    {formErrors.dbPort && <span className="text-rose-400 font-semibold">{formErrors.dbPort}</span>}
                  </div>
                </div>

                {/* 3. Database Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>اسم قاعدة البيانات (DB Name) <span className="text-rose-400">*</span></span>
                    <span className="text-[10px] text-emerald-400 font-mono">a-z, 0-9, _</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={dbForm.database}
                    onChange={(e) => sanitizeDbInput('database', e.target.value)}
                    placeholder="orbix_erp"
                    className={`w-full bg-slate-950 border ${
                      formErrors.dbDatabase ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>مثال: <code className="text-slate-300 bg-slate-800 px-1 rounded">orbix_erp</code> أو <code className="text-slate-300 bg-slate-800 px-1 rounded">my_company_db</code></span>
                    {formErrors.dbDatabase && <span className="text-rose-400 font-semibold">{formErrors.dbDatabase}</span>}
                  </div>
                </div>

                {/* 4. Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>اسم المستخدم (Database User) <span className="text-rose-400">*</span></span>
                    <span className="text-[10px] text-emerald-400 font-mono">a-z, 0-9, _</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={dbForm.user}
                    onChange={(e) => sanitizeDbInput('user', e.target.value)}
                    placeholder="postgres"
                    className={`w-full bg-slate-950 border ${
                      formErrors.dbUser ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>الافتراضي لمستخدم PostgreSQL هو <code className="text-slate-300 bg-slate-800 px-1 rounded">postgres</code></span>
                    {formErrors.dbUser && <span className="text-rose-400 font-semibold">{formErrors.dbUser}</span>}
                  </div>
                </div>

                {/* 5. Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>كلمة مرور قاعدة البيانات (Password)</span>
                    <button
                      type="button"
                      onClick={() => setShowDbPassword(!showDbPassword)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {showDbPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showDbPassword ? 'إخفاء' : 'إظهار'}
                    </button>
                  </label>
                  <input
                    type={showDbPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={dbForm.password}
                    onChange={(e) => handleDbPasswordChange(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    كلمة المرور المشفرة للاتصال بخادم PostgreSQL
                  </p>
                </div>
              </div>

              {/* SSL Encryption Toggle & Test Connection Bar */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* SSL Switch */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dbForm.ssl}
                      onChange={(e) => setDbForm({ ...dbForm, ssl: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      تشفير الاتصال الآمن (SSL / TLS)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {dbForm.ssl
                        ? 'مفعّل (مطلوب عند الربط مع السحابة مثل Supabase أو AWS أو Neon)'
                        : 'معطل (موصى به للاتصال المحلي Localhost وسيرفرات الشبكة الداخلية LAN)'}
                    </span>
                  </div>
                </div>

                {/* Ping Button */}
                <button
                  type="button"
                  onClick={handleTestDbConnection}
                  disabled={isTestingDb}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold px-5 py-2.5 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'جاري اختبار الاتصال...' : 'اختبار الاتصال بقاعدة البيانات (Ping)'}</span>
                </button>
              </div>

              {/* Live Test Result Box */}
              {dbTestResult && (
                <div
                  className={`rounded-2xl p-4 border animate-in fade-in duration-200 ${
                    dbTestResult.ok
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {dbTestResult.ok ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-xs leading-relaxed">
                      {dbTestResult.ok ? (
                        <div>
                          <strong className="text-white block font-bold text-sm mb-1">
                            ✓ تم الاتصال بخادم قاعدة البيانات بنجاح تام!
                          </strong>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 font-mono text-[11px] text-emerald-300">
                            <div className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/20">
                              <span className="text-slate-400 block text-[10px]">زمن الاستجابة:</span>
                              <strong>{dbTestResult.latency} ms</strong>
                            </div>
                            <div className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/20">
                              <span className="text-slate-400 block text-[10px]">اسم القاعدة:</span>
                              <strong className="truncate block">{dbTestResult.database || dbForm.database}</strong>
                            </div>
                            <div className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/20 col-span-2 sm:col-span-1">
                              <span className="text-slate-400 block text-[10px]">الجداول الموجودة:</span>
                              <strong>{typeof dbTestResult.tablesCount === 'number' ? `${dbTestResult.tablesCount} جداول` : 'جداول مهيأة'}</strong>
                            </div>
                          </div>
                          {dbTestResult.version && (
                            <p className="text-[10px] text-slate-400 font-mono mt-2 truncate">
                              المحرك: {dbTestResult.version}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <strong className="text-white block font-bold text-sm mb-1">
                            ✕ تعذر الاتصال بخادم قاعدة البيانات
                          </strong>
                          <p className="text-rose-300 mt-1">{dbTestResult.error}</p>
                          <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-300 font-bold block mb-1">نصائح وإرشادات سريعة للحل:</span>
                            <ul className="list-disc list-inside space-y-0.5">
                              <li>تأكد من تشغيل خدمة PostgreSQL (من خلال Services أو الأمر: <code>net start postgresql-x64-18</code>).</li>
                              <li>تأكد من صحة اسم المستخدم (<code className="text-white">postgres</code>) وكلمة المرور.</li>
                              <li>إذا كانت قاعدة البيانات غير منشأة، سيقوم النظام بمحاولة تهيئتها أو يمكنك استخدام اسم قاعدة موجودة.</li>
                              <li>إذا كنت تستخدم سيرفر سحابي، تأكد من تفعيل خيار تشفير SSL وقائمة الـ IP المسموحة.</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* System Ready Launch Note */}
              <div className="bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-0.5">الجاهزية التلقائية والتهيئة الفورية:</strong>
                  عند الضغط على الزر أدناه، سيقوم النظام بحفظ إعداداتك تلقائياً في ملف التهيئة البيئية (<code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">.env</code>)، وإنشاء وتأكيد جداول المنظومة الرسمية في قاعدة البيانات، ثم إطلاق المنظومة مباشرة بحساب المدير العام.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="border-t border-slate-800 pt-6 mt-8 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                السابق
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <span>متابعة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSetup}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold px-8 py-3 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{isSubmitting ? 'جاري حفظ الإعدادات وتشغيل النظام...' : 'حفظ الإعدادات وتشغيل النظام فوراً'}</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        منظومة تخطيط الموارد ERP والمحاسبة المالية الذكية • الإصدار الموحد
      </footer>
    </div>
  );
};
