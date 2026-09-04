import React, { useState, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { AppUser, CompanyProfile, Currency, UserRole } from '../types';
import { ImageCropModal } from './ImageCropModal';
import {
  Building2,
  Users2,
  ShieldCheck,
  FileSpreadsheet,
  MonitorDown,
  Upload,
  Download,
  KeyRound,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Sliders,
  Database,
  Layers,
  History,
  Laptop,
  FileCode,
  HardDrive,
  Cpu,
  Eye,
  SlidersHorizontal,
  Check,
  Coins,
  Printer,
  Edit3,
  ArrowRightLeft,
  DollarSign,
  ShieldAlert,
  FolderLock,
  FileText,
  UserCheck,
  User,
  Camera,
  RotateCcw,
  Search,
  X,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Crop,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    companyProfile,
    updateCompanyProfile,
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    employees,
    currency,
    setCurrency,
    currencies,
    secondaryCurrency,
    setSecondaryCurrency,
    addCurrency,
    updateCurrency,
    deleteCurrency,
    convertAmount,
    formatDualMoney,
    googleSheetConfig,
    updateGoogleSheetConfig,
    syncToGoogleSheets,
    exportDataJSON,
    restoreBackupJSON,
    verifyDatabaseIntegrity,
    auditLogs,
    rollbackAuditLog,
    resetToCleanNewCompany,
    resetToDefaultData,
    formatMoney,
    activeSubTab,
    setActiveSubTab,
    showAlert,
    showConfirm,
  } = useErp();

  const [activeTab, setActiveTabLocal] = useState<
    'company' | 'currencies' | 'users_rbac' | 'database_backup' | 'gsheets' | 'desktop_exe'
  >('company');

  React.useEffect(() => {
    if (
      activeSubTab &&
      ['company', 'currencies', 'users_rbac', 'database_backup', 'gsheets', 'desktop_exe'].includes(activeSubTab)
    ) {
      setActiveTabLocal(activeSubTab as any);
    }
  }, [activeSubTab]);

  const setActiveTab = (tab: 'company' | 'currencies' | 'users_rbac' | 'database_backup' | 'gsheets' | 'desktop_exe') => {
    setActiveTabLocal(tab);
    setActiveSubTab(tab);
  };

  // Company Profile Local State
  const [profileForm, setProfileForm] = useState<CompanyProfile>(companyProfile);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(companyProfile.logoBase64);
  const [logoWidth, setLogoWidth] = useState<number>(companyProfile.logoWidth || 160);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isCroppingLogo, setIsCroppingLogo] = useState<boolean>(false);
  const [showLiveInvoiceHeaderPreview, setShowLiveInvoiceHeaderPreview] = useState<boolean>(true);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Currencies Local State
  const [showAddCurrencyModal, setShowAddCurrencyModal] = useState(false);
  const [newCurrCode, setNewCurrCode] = useState('');
  const [newCurrName, setNewCurrName] = useState('');
  const [newCurrSymbol, setNewCurrSymbol] = useState('');
  const [newCurrRate, setNewCurrRate] = useState<number>(1);
  const [newCurrFlag, setNewCurrFlag] = useState('🌐');
  const [currencySuccessMsg, setCurrencySuccessMsg] = useState<string | null>(null);

  // Currency Converter Widget State
  const [calcAmount, setCalcAmount] = useState<number>(100);
  const [calcFrom, setCalcFrom] = useState<string>(currency);
  const [calcTo, setCalcTo] = useState<string>(secondaryCurrency);

  // Users & RBAC Local State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserPin, setNewUserPin] = useState('1234');
  const [newUserRole, setNewUserRole] = useState<UserRole>('sales_cashier');
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([
    'dashboard',
    'quick_pos',
    'sales',
    'crm_collections',
    'edit_invoices',
  ]);

  // Edit Existing User Permissions & Data Modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserPin, setEditUserPin] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('sales_cashier');
  const [editUserPermissions, setEditUserPermissions] = useState<string[]>([]);
  const [editUserIsActive, setEditUserIsActive] = useState<boolean>(true);

  // Google Sheets Local State
  const [gsheetForm, setGsheetForm] = useState(googleSheetConfig);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Database Backup & Restore
  const [restoreFeedback, setRestoreFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [integrityReport, setIntegrityReport] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audit Logs Search, Filter, Sort & Rollback State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [auditSelectedUser, setAuditSelectedUser] = useState('');
  const [auditSelectedModule, setAuditSelectedModule] = useState('');
  const [auditSelectedAction, setAuditSelectedAction] = useState('');
  const [auditSortField, setAuditSortField] = useState<'timestamp' | 'userName' | 'module' | 'action' | 'details'>('timestamp');
  const [auditSortOrder, setAuditSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract distinct filter lists from auditLogs
  const uniqueAuditUsers = Array.from(new Set(auditLogs.map((l) => l.userName).filter(Boolean)));
  const uniqueAuditModules = Array.from(new Set(auditLogs.map((l) => l.module).filter(Boolean)));
  const uniqueAuditActions = Array.from(new Set(auditLogs.map((l) => l.action).filter(Boolean)));

  const handleSortAudit = (field: 'timestamp' | 'userName' | 'module' | 'action' | 'details') => {
    if (auditSortField === field) {
      setAuditSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setAuditSortField(field);
      setAuditSortOrder(field === 'timestamp' ? 'desc' : 'asc');
    }
  };

  const handleResetAuditFilters = () => {
    setAuditSearch('');
    setAuditStartDate('');
    setAuditEndDate('');
    setAuditSelectedUser('');
    setAuditSelectedModule('');
    setAuditSelectedAction('');
  };

  const hasActiveAuditFilters = Boolean(
    auditSearch || auditStartDate || auditEndDate || auditSelectedUser || auditSelectedModule || auditSelectedAction
  );

  const filteredAndSortedLogs = auditLogs
    .filter((log) => {
      // 1. Search Query
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase().trim();
        const matches =
          (log.userName && log.userName.toLowerCase().includes(q)) ||
          (log.module && log.module.toLowerCase().includes(q)) ||
          (log.action && log.action.toLowerCase().includes(q)) ||
          (log.details && log.details.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // 2. Date Range
      if (auditStartDate) {
        const logDate = log.timestamp.split('T')[0];
        if (logDate < auditStartDate) return false;
      }
      if (auditEndDate) {
        const logDate = log.timestamp.split('T')[0];
        if (logDate > auditEndDate) return false;
      }
      // 3. User Filter
      if (auditSelectedUser && log.userName !== auditSelectedUser) {
        return false;
      }
      // 4. Module Filter
      if (auditSelectedModule && log.module !== auditSelectedModule) {
        return false;
      }
      // 5. Action Filter
      if (auditSelectedAction && log.action !== auditSelectedAction) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (auditSortField === 'timestamp') {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else {
        const valA = (a[auditSortField] || '').toString();
        const valB = (b[auditSortField] || '').toString();
        cmp = valA.localeCompare(valB, 'ar');
      }
      return auditSortOrder === 'asc' ? cmp : -cmp;
    });

  const handleRollbackAction = (log: typeof auditLogs[0]) => {
    showConfirm(
      `هل أنت متأكد من رغبتك في التراجع عن هذه الحركة وإلغاء أثرها في النظام؟\n\n• الإجراء: ${log.action}\n• القسم / الوحدة: ${log.module}\n• المنفذ: ${log.userName}\n• التاريخ والوقت: ${new Date(log.timestamp).toLocaleString('ar-EG')}\n• التفاصيل: ${log.details}`,
      () => {
        const res = rollbackAuditLog(log.id);
        if (res.success) {
          showAlert({
            title: 'تم التراجع عن الحركة',
            message: res.message,
            type: 'success',
            confirmText: 'حسناً',
          });
        } else {
          showAlert({
            title: 'تعذر التراجع',
            message: res.message,
            type: 'error',
            confirmText: 'إغلاق',
          });
        }
      },
      'تأكيد التراجع عن الحركة (Rollback Action)',
      { confirmText: 'نعم، تأكيد التراجع', cancelText: 'إلغاء الأمر', type: 'error' }
    );
  };

  // Logo file upload handler with base64 conversion
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert({
          title: 'حجم الملف كبير',
          message: 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت لضمان سرعة تحميل النظام.',
          type: 'warning',
          confirmText: 'فهمت',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoPreview(base64);
        setProfileForm((prev) => ({ ...prev, logoBase64: base64 }));
        updateCompanyProfile({
          ...profileForm,
          logoBase64: base64,
          logoWidth,
        });
        setSaveSuccessMsg('تم رفع الشعار وحفظه بنجاح.');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  // Immediate Logo Removal & Reset to Orbix Default
  const handleRemoveLogo = () => {
    setLogoPreview(undefined);
    setProfileForm((p) => {
      const next = { ...p };
      delete next.logoBase64;
      return next;
    });
    updateCompanyProfile({
      ...profileForm,
      logoBase64: undefined,
      logoWidth: 160,
    });
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = '';
    }
    setSaveSuccessMsg('تمت إزالة الشعار واستعادة شعار أوربكس الافتراضي للنظام بنجاح.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Immediate Crop Completion
  const handleCropComplete = (croppedBase64: string) => {
    setLogoPreview(croppedBase64);
    setProfileForm((prev) => ({ ...prev, logoBase64: croppedBase64 }));
    updateCompanyProfile({
      ...profileForm,
      logoBase64: croppedBase64,
      logoWidth,
    });
    setSaveSuccessMsg('تم قص وتحديث الشعار بنجاح وحفظه فورياً.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Immediate Logo Width Update & Persistence
  const handleUpdateLogoWidth = (newWidth: number) => {
    const clamped = Math.max(50, Math.min(360, newWidth));
    setLogoWidth(clamped);
    setProfileForm((prev) => ({ ...prev, logoWidth: clamped }));
    updateCompanyProfile({
      ...profileForm,
      logoBase64: logoPreview,
      logoWidth: clamped,
    });
  };

  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyProfile({
      ...profileForm,
      logoBase64: logoPreview,
      logoWidth,
    });
    setSaveSuccessMsg('تم حفظ بيانات المنشأة والشعار بنجاح في قاعدة البيانات.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Assign user from HR employee
  const handleSelectEmployeeForUser = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setNewUserName(emp.name);
      const generatedUsername = emp.name.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 100);
      setNewUserUsername(generatedUsername);
      if (emp.department.includes('مالية') || emp.jobTitle.includes('حسابات')) {
        setNewUserRole('accountant');
        setNewUserPermissions(['dashboard', 'accounts', 'sales', 'purchases', 'financial_reports', 'quick_pos']);
      } else if (emp.department.includes('مبيعات')) {
        setNewUserRole('sales_cashier');
        setNewUserPermissions(['dashboard', 'quick_pos', 'sales', 'crm_collections']);
      } else if (emp.department.includes('مستودع')) {
        setNewUserRole('warehouse_keeper');
        setNewUserPermissions(['dashboard', 'inventory', 'purchases']);
      } else if (emp.department.includes('موارد')) {
        setNewUserRole('hr_manager');
        setNewUserPermissions(['dashboard', 'hr_payroll']);
      }
    }
  };

  const [newUserAvatar, setNewUserAvatar] = useState<string | undefined>(undefined);

  const handleSelectEmployeeForNewUser = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!empId) return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setNewUserName(emp.name);
      if (emp.photoBase64) {
        setNewUserAvatar(emp.photoBase64);
      }
      const codeClean = emp.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '');
      setNewUserUsername(codeClean || `user_${emp.id.slice(0, 4)}`);
      
      const title = emp.jobTitle.toLowerCase();
      if (title.includes('كاشير') || title.includes('مبيعات') || title.includes('cashier') || title.includes('sales')) {
        setNewUserRole('sales_cashier');
        setNewUserPermissions(['dashboard', 'quick_pos', 'sales', 'crm_collections', 'edit_invoices']);
      } else if (title.includes('محاسب') || title.includes('مالي') || title.includes('accountant')) {
        setNewUserRole('accountant');
        setNewUserPermissions([
          'dashboard', 'accounts', 'sales', 'purchases', 'inventory', 'financial_reports', 'crm_collections',
          'edit_invoices', 'delete_invoices', 'edit_accounts', 'edit_customers', 'edit_suppliers', 'edit_expenses'
        ]);
      } else if (title.includes('مستودع') || title.includes('مخزن') || title.includes('warehouse')) {
        setNewUserRole('warehouse_keeper');
        setNewUserPermissions(['dashboard', 'inventory', 'purchases', 'edit_products', 'edit_suppliers']);
      } else if (title.includes('موارد') || title.includes('hr') || title.includes('شؤون')) {
        setNewUserRole('hr_manager');
        setNewUserPermissions(['dashboard', 'hr_payroll', 'edit_employees', 'delete_employees']);
      } else if (title.includes('مدير') || title.includes('admin') || title.includes('إدار')) {
        setNewUserRole('admin');
        setNewUserPermissions(availablePermissions.map((p) => p.key));
      }
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim()) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى إدخال اسم المستخدم واسم الدخول لإتمام إنشاء الحساب.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    addUser({
      name: newUserName.trim(),
      username: newUserUsername.trim(),
      password: newUserPassword || '123456',
      pin: newUserPin || '1234',
      role: newUserRole,
      employeeId: selectedEmployeeId || undefined,
      permissions: newUserPermissions,
      isActive: true,
      avatarUrl: newUserAvatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
    });

    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserUsername('');
    setSelectedEmployeeId('');
    setNewUserAvatar(undefined);
  };

  // Google Sheets Manual Sync
  const handleTriggerGSheetSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    updateGoogleSheetConfig(gsheetForm);
    const res = await syncToGoogleSheets();
    setIsSyncing(false);
    setSyncFeedback(res);
  };

  // Copy Apps Script Code
  const appsScriptCode = `/**
 * Orbix ERP - Google Sheets Integration Webhook
 * يقوم هذا السكريبت باستقبال الفواتير والعمليات من نظام أوربكس ERP وتدوينها تلقائياً
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. ورقة فواتير المبيعات (Sales Invoices Sheet)
    var sheetInvoices = ss.getSheetByName("فواتير_المبيعات") || ss.insertSheet("فواتير_المبيعات");
    if (sheetInvoices.getLastRow() === 0) {
      sheetInvoices.appendRow([
        "رقم الفاتورة", "العميل", "الرقم الضريبي", "التاريخ", "تاريخ الاستحقاق", 
        "قبل الضريبة", "نسبة الضريبة", "قيمة الضريبة", "الإجمالي النهائي", 
        "المسدد", "المتبقي", "الحالة", "العملة", "وقت المزامنة"
      ]);
      sheetInvoices.getRange(1, 1, 1, 14).setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold");
    }
    
    if (data.invoices && data.invoices.length > 0) {
      data.invoices.forEach(function(inv) {
        sheetInvoices.appendRow([
          inv.invoiceNumber,
          inv.customerName,
          inv.customerTaxNumber || "-",
          inv.date,
          inv.dueDate,
          inv.subtotal,
          inv.vatRate,
          inv.vatTotal,
          inv.grandTotal,
          inv.paidAmount,
          inv.remainingAmount,
          inv.status,
          data.currency || "EGP",
          new Date().toLocaleString("ar-EG")
        ]);
      });
    }

    // 2. ورقة ملخص الإحصائيات (Summary Stats)
    var sheetStats = ss.getSheetByName("الملخص_المالي") || ss.insertSheet("الملخص_المالي");
    if (data.stats) {
      sheetStats.clear();
      sheetStats.appendRow(["المؤشر المالي", "القيمة بالـ " + (data.currency || "EGP")]);
      sheetStats.appendRow(["إجمالي المبيعات", data.stats.totalSales]);
      sheetStats.appendRow(["إجمالي المحصل", data.stats.totalCollected]);
      sheetStats.appendRow(["الديون المستحقة", data.stats.totalUncollected]);
      sheetStats.appendRow(["عدد الأصناف النشطة", data.stats.productsCount]);
      sheetStats.appendRow(["عدد العملاء", data.stats.customersCount]);
      sheetStats.appendRow(["آخر مزامنة", new Date().toLocaleString("ar-EG")]);
      sheetStats.getRange(1, 1, 1, 2).setBackground("#047857").setFontColor("#ffffff").setFontWeight("bold");
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "تمت المزامنة بنجاح" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Restore file handler
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const result = restoreBackupJSON(text);
        setRestoreFeedback(result);
      };
      reader.readAsText(file);
    }
  };

  // Check integrity
  const handleRunIntegrityCheck = () => {
    const report = verifyDatabaseIntegrity();
    setIntegrityReport(report);
  };

  // Available System Permissions for RBAC Matrix
  const availablePermissions = [
    // Module Access
    { key: 'dashboard', label: 'لوحة القيادة والملخصات', group: 'modules' },
    { key: 'quick_pos', label: 'نقطة البيع والفاتورة السريعة POS', group: 'modules' },
    { key: 'sales', label: 'المبيعات والفواتير الضريبية', group: 'modules' },
    { key: 'purchases', label: 'المشتريات والموردين', group: 'modules' },
    { key: 'inventory', label: 'المخازن والأصناف والتسعير', group: 'modules' },
    { key: 'accounts', label: 'شجرة الحسابات وقيود اليومية', group: 'modules' },
    { key: 'crm_collections', label: 'العملاء CRM وأعمار الديون والتحصيل', group: 'modules' },
    { key: 'hr_payroll', label: 'الموارد البشرية ومسيرات الرواتب', group: 'modules' },
    { key: 'financial_reports', label: 'القوائم والتقارير المالية والأرباح', group: 'modules' },
    { key: 'settings', label: 'الإعدادات وقاعدة البيانات والمستخدمين', group: 'modules' },

    // Granular CRUD / Edit & Delete
    { key: 'edit_invoices', label: 'تعديل فواتير المبيعات والتاريخ والبنود', group: 'crud' },
    { key: 'delete_invoices', label: 'حذف وإلغاء فواتير المبيعات نهائياً', group: 'crud' },
    { key: 'edit_products', label: 'تعديل بيانات المنتجات وأسعار البيع والتكلفة', group: 'crud' },
    { key: 'delete_products', label: 'حذف الأصناف والمنتجات من المخزن', group: 'crud' },
    { key: 'edit_employees', label: 'تعديل بيانات الموظفين والرواتب والبدلات', group: 'crud' },
    { key: 'delete_employees', label: 'حذف سجلات الموظفين من الموارد البشرية', group: 'crud' },
    { key: 'edit_accounts', label: 'تعديل الحسابات ودليل الحسابات', group: 'crud' },
    { key: 'delete_accounts', label: 'حذف الحسابات المالية وقيود اليومية', group: 'crud' },
    { key: 'edit_customers', label: 'تعديل بيانات العملاء والحدود الائتمانية', group: 'crud' },
    { key: 'delete_customers', label: 'حذف بطاقات العملاء', group: 'crud' },
    { key: 'edit_suppliers', label: 'تعديل بيانات الموردين', group: 'crud' },
    { key: 'delete_suppliers', label: 'حذف بطاقات الموردين', group: 'crud' },
    { key: 'edit_expenses', label: 'تعديل بنود وقيود المصروفات', group: 'crud' },
    { key: 'delete_expenses', label: 'حذف سندات الصرف والمصروفات', group: 'crud' },
  ];

  const handleOpenEditUserModal = (u: AppUser) => {
    setEditingUserId(u.id);
    setEditUserName(u.name);
    setEditUserUsername(u.username);
    setEditUserPassword('');
    setEditUserPin(u.pin || '');
    setEditUserRole(u.role);
    setEditUserPermissions([...u.permissions]);
    setEditUserIsActive(u.isActive);
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    const updates: Partial<AppUser> = {
      name: editUserName,
      username: editUserUsername,
      role: editUserRole,
      permissions: editUserPermissions,
      isActive: editUserIsActive,
    };
    if (editUserPassword.trim()) {
      updates.password = editUserPassword.trim();
    }
    if (editUserPin.trim()) {
      updates.pin = editUserPin.trim();
    }
    updateUser(editingUserId, updates);
    setShowEditUserModal(false);
    setEditingUserId(null);
  };

  const handleCreateCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrCode.trim() || !newCurrName.trim() || newCurrRate <= 0) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى إدخال كود العملة واسمها وتحديد سعر الصرف الصحيح (أكبر من 0).',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    addCurrency({
      code: newCurrCode.trim().toUpperCase(),
      nameAr: newCurrName.trim(),
      symbol: newCurrSymbol.trim() || newCurrCode.trim(),
      rateToBase: Number(newCurrRate),
      flag: newCurrFlag.trim() || '🌐',
      isBase: false,
    });
    setShowAddCurrencyModal(false);
    setCurrencySuccessMsg(`تمت إضافة العملة "${newCurrName}" بسعر صرف ${newCurrRate} بنجاح.`);
    setTimeout(() => setCurrencySuccessMsg(null), 4000);
    setNewCurrCode('');
    setNewCurrName('');
    setNewCurrSymbol('');
    setNewCurrRate(1);
  };

  // Download Desktop .EXE Packaging Kit
  const downloadDesktopPackagingKit = () => {
    const batScript = `@echo off
echo ===================================================
echo     Orbix ERP - Desktop (.EXE) Windows Builder
echo ===================================================
echo 1. جاري فحص بيئة Node.js...
node -v
if %errorlevel% neq 0 (
  echo برجاء تثبيت Node.js من الموقع الرسمي https://nodejs.org
  pause
  exit /b
)
echo 2. جاري تثبيت حزم Electron Builder...
npm install --save-dev electron electron-builder
echo 3. جاري تجميع برنامج Orbix ERP بصيغة EXE لنظام Windows...
npx electron-builder --win nsis:ia32,x64
echo.
echo ===================================================
echo تم إنشاء ملف التثبيت بنجاح داخل مجلد: dist/
echo ملف التشغيل: Orbix-ERP-Setup-v3.5.exe
echo ===================================================
pause
`;
    const blob = new Blob([batScript], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-orbix-erp-windows-exe.bat';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-600" />
            مركز الإعدادات الشامل والأمان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة بروفايل الشركة والشعار، العملات المتعددة وأسعار الصرف، المستخدمين والصلاحيات (RBAC)، النسخ الاحتياطي، الربط مع Google Sheets، وتثبيت التطبيق على الكمبيوتر
          </p>
        </div>
      </div>

      {/* TAB 1: COMPANY PROFILE & LOGO RESIZER */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompanyProfile} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Logo Uploader & Real-Time Resizer */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    شعار المنشأة (Company Logo)
                  </h3>
                  {logoPreview && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      شعار نشط
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ارفع لوجو الشركة، وحدد مقاس العرض بالبكسل، أو استخدم أداة القص (Crop) لضبط الشعار وحذف الحواف الزائدة:
                </p>

                {/* Hidden file input controlled programmatically */}
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="company-logo-input"
                />

                {/* Logo Display Canvas / Drop Area */}
                {logoPreview ? (
                  <div className="space-y-3">
                    {/* Visual Box with subtle checkered pattern */}
                    <div className="p-4 bg-slate-50/80 rounded-2xl border-2 border-slate-200 flex flex-col items-center justify-center min-h-[160px] text-center relative overflow-hidden group">
                      <div className="relative py-2 px-4 max-w-full">
                        <img
                          src={logoPreview}
                          alt="معاينة شعار الشركة"
                          style={{ width: `${logoWidth}px`, maxWidth: '100%' }}
                          className="mx-auto object-contain transition-all drop-shadow-xs max-h-32"
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        العرض المطبق حالياً: {logoWidth} بكسل
                      </div>
                    </div>

                    {/* Action Buttons Bar: Crop, Change, Delete */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Crop Button */}
                      <button
                        type="button"
                        onClick={() => setIsCroppingLogo(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        title="قص وتعديل حواف الشعار"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>قص وتعديل</span>
                      </button>

                      {/* Change Image Button */}
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        title="اختيار صورة أخرى"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>تغيير</span>
                      </button>

                      {/* Remove Logo Button */}
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        title="حذف الشعار نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إزالة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => logoFileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && logoFileInputRef.current) {
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        logoFileInputRef.current.files = dt.files;
                        handleLogoUpload({ target: logoFileInputRef.current } as any);
                      }
                    }}
                    className="p-6 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 flex flex-col items-center justify-center min-h-[160px] text-center cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all shadow-xs mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-700 font-bold group-hover:text-emerald-700">
                      انقر هنا لاختيار الشعار أو اسحب الملف
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      PNG, JPG, SVG, WebP (بحد أقصى 5MB)
                    </span>
                  </div>
                )}

                {/* Live Logo Dimension Slider & Presets */}
                {logoPreview && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                        عرض الشعار بالفاتورة:
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="50"
                          max="360"
                          value={logoWidth}
                          onChange={(e) => handleUpdateLogoWidth(parseInt(e.target.value) || 160)}
                          className="w-16 text-center font-mono font-bold text-emerald-700 bg-white border border-slate-200 rounded-lg py-0.5 px-1 text-xs"
                        />
                        <span className="text-slate-400 text-[11px]">px</span>
                      </div>
                    </div>

                    {/* Range Slider */}
                    <input
                      type="range"
                      min="60"
                      max="340"
                      step="5"
                      value={logoWidth}
                      onChange={(e) => handleUpdateLogoWidth(parseInt(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center justify-between gap-1 pt-1">
                      {[
                        { width: 80, label: 'صغير (80px)' },
                        { width: 140, label: 'متوسط (140px)' },
                        { width: 180, label: 'قياسي (180px)' },
                        { width: 240, label: 'كبير (240px)' },
                        { width: 300, label: 'عريض (300px)' },
                      ].map((preset) => (
                        <button
                          key={preset.width}
                          type="button"
                          onClick={() => handleUpdateLogoWidth(preset.width)}
                          className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            logoWidth === preset.width
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Live Header Simulation Toggle */}
                    <div className="pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setShowLiveInvoiceHeaderPreview(!showLiveInvoiceHeaderPreview)}
                        className="flex items-center justify-between w-full text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          معاينة حية لشكل الشعار في ترويسة الفاتورة
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {showLiveInvoiceHeaderPreview ? 'إخفاء' : 'إظهار'}
                        </span>
                      </button>

                      {showLiveInvoiceHeaderPreview && (
                        <div className="mt-2.5 p-3 bg-white rounded-xl border border-slate-300 text-right space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div className="text-[10px] text-slate-400 font-bold">نموذج ترويسة الفاتورة المطبوعة</div>
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                              مباشر ومحفوظ
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                              <div
                                style={{ maxWidth: `${Math.max(120, logoWidth + 12)}px` }}
                                className="p-1 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0"
                              >
                                <img
                                  src={logoPreview}
                                  alt="Logo"
                                  style={{ width: `${logoWidth}px` }}
                                  className="max-h-12 w-auto object-contain"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-xs text-slate-900">
                                  {profileForm.nameAr || 'شركة أوربكس للتجارة'}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  الرقم الضريبي: {profileForm.taxNumber || '300000000000003'}
                                </div>
                              </div>
                            </div>
                            <div className="text-left text-[9px] font-mono text-slate-400">
                              <div>فاتورة ضريبية</div>
                              <div>INV-2026-001</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Currency Selector Box */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  العملة الافتراضية للنظام
                </h4>
                <select
                  value={profileForm.defaultCurrency}
                  onChange={(e) => {
                    const c = e.target.value as Currency;
                    setProfileForm((p) => ({ ...p, defaultCurrency: c }));
                    setCurrency(c);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  <option value="EGP">جنيه مصري (EGP - ج.م) [الافتراضي]</option>
                  <option value="SAR">ريال سعودي (SAR - ر.س)</option>
                  <option value="AED">درهم إماراتي (AED - د.إ)</option>
                  <option value="USD">دولار أمريكي (USD - $)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  يتم تحديث كافة شاشات نقاط البيع، الفواتير، والقيود تلقائياً بهذه العملة.
                </p>
              </div>
            </div>

            {/* Right: Company Profile Form Fields */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                بيانات المنشأة والترخيص التجاري والضريبي
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اسم المنشأة (بالعربية) *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.nameAr}
                    onChange={(e) => setProfileForm({ ...profileForm, nameAr: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اسم المنشأة (بالإنجليزية)</label>
                  <input
                    type="text"
                    value={profileForm.nameEn}
                    onChange={(e) => setProfileForm({ ...profileForm, nameEn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الرقم الضريبي / البطاقة الضريبية *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.taxNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, taxNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم السجل التجاري (C.R)</label>
                  <input
                    type="text"
                    value={profileForm.commercialRegister}
                    onChange={(e) => setProfileForm({ ...profileForm, commercialRegister: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">العنوان الرئيسي للمقر</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف الأرضي</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم الموبايل / خدمة العملاء</label>
                  <input
                    type="text"
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">البريد الإلكتروني الرسمي</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الموقع الإلكتروني</label>
                  <input
                    type="text"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة ضريبة القيمة المضافة الافتراضية (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={profileForm.defaultVatRate}
                    onChange={(e) => setProfileForm({ ...profileForm, defaultVatRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">ملاحظات وشروط تذييل الفاتورة المطبوعة</label>
                  <textarea
                    rows={3}
                    value={profileForm.invoiceFooterNotes}
                    onChange={(e) => setProfileForm({ ...profileForm, invoiceFooterNotes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    placeholder="شروط الاسترجاع والاستبدال، والضمان..."
                  />
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  حفظ وتحديث بيانات المنشأة
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB: CURRENCIES & EXCHANGE RATES */}
      {activeTab === 'currencies' && (
        <div className="space-y-6">
          {/* Header & Add Currency Button */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                إدارة العملات المتعددة وأسعار الصرف المرنة
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تحديد العملة الأساسية للحسابات، وإضافة عملات أجنبية مع أسعار صرف فورية لإظهار كافة الفواتير والتقارير بعملة مزدوجة
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddCurrencyModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              إضافة عملة جديدة
            </button>
          </div>

          {currencySuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{currencySuccessMsg}</span>
            </div>
          )}

          {/* Currency Configuration Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">العملة الأساسية للنظام (Base Currency)</h4>
                  <p className="text-[11px] text-slate-500">تعتمد عليها شجرة الحسابات والقيود المحاسبية الدفترية</p>
                </div>
              </div>

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.nameAr} ({c.code} - {c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">عملة المقارنة المزدوجة (Secondary Dual Currency)</h4>
                  <p className="text-[11px] text-slate-500">تظهر تلقائياً بجانب العملة الأساسية في الفواتير ولوحة القيادة والتقارير</p>
                </div>
              </div>

              <select
                value={secondaryCurrency}
                onChange={(e) => setSecondaryCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.nameAr} ({c.code} - {c.symbol}) {c.code === currency ? '— (نفس العملة الأساسية)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Currencies Rates Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-700" />
              جدول أسعار الصرف بالنسبة للعملة الأساسية ({currency})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currencies.map((c) => {
                const isBase = c.code === currency;
                return (
                  <div
                    key={c.code}
                    className={`p-4 rounded-2xl border transition-all ${
                      isBase
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400'
                        : c.code === secondaryCurrency
                        ? 'bg-indigo-50/40 border-indigo-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.flag}</span>
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            {c.nameAr}
                            <span className="font-mono text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded font-bold">
                              {c.code}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">الرمز: {c.symbol}</span>
                        </div>
                      </div>

                      {isBase ? (
                        <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-md font-bold">
                          الأساسية
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            showConfirm(
                              `هل أنت متأكد من حذف العملة "${c.nameAr}" (${c.code})؟`,
                              () => {
                                deleteCurrency(c.code);
                              },
                              `تأكيد حذف العملة (${c.nameAr})`,
                              'حذف العملة'
                            );
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="حذف العملة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 text-[11px] font-semibold">سعر الصرف (مقابل {currency}):</span>
                        {isBase ? (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            1.00 (أساسي)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.0001"
                              min="0.0001"
                              defaultValue={c.rateToBase}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val > 0 && val !== c.rateToBase) {
                                  updateCurrency(c.code, { rateToBase: val });
                                  setCurrencySuccessMsg(`تم تحديث سعر صرف ${c.nameAr} إلى ${val}`);
                                  setTimeout(() => setCurrencySuccessMsg(null), 3000);
                                }
                              }}
                              className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 text-center focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-[10px] text-slate-500 font-mono">{currency}</span>
                          </div>
                        )}
                      </div>

                      {!isBase && (
                        <div className="text-[10px] text-slate-500 bg-white/60 p-2 rounded-xl border border-slate-200/60 font-mono text-center">
                          1 {c.code} = {c.rateToBase} {currency}
                          <br />
                          1 {currency} = {(1 / c.rateToBase).toFixed(4)} {c.code}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Currency Live Converter Calculator */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
              آلة حاسبة وتحويل العملات الفوري
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">المبلغ المراد تحويله:</label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">من عملة:</label>
                <select
                  value={calcFrom}
                  onChange={(e) => setCalcFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.nameAr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">إلى عملة:</label>
                <select
                  value={calcTo}
                  onChange={(e) => setCalcTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.nameAr})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-indigo-700 font-bold block">القيمة المحولة:</span>
                <span className="text-sm font-mono font-bold text-indigo-950">
                  {convertAmount(calcAmount, calcFrom, calcTo).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {calcTo}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & RBAC (ASSIGN FROM HR + PASSWORDS + PERMISSIONS) */}
      {activeTab === 'users_rbac' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-indigo-600" />
                  إدارة مستخدمي النظام والصلاحيات (RBAC Access Control)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تعيين موظفي الموارد البشرية كمستخدمين للنظام، تخصيص كلمات المرور ورموز الـ PIN، وتحديد الصلاحيات بدقة وتعديلها للمدير
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                تعيين مستخدم جديد من HR
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="py-3 px-3">المستخدم / الموظف</th>
                    <th className="py-3 px-3">اسم الدخول</th>
                    <th className="py-3 px-3">الدور الوظيفي</th>
                    <th className="py-3 px-3">رمز PIN</th>
                    <th className="py-3 px-3">الصلاحيات المتاحة</th>
                    <th className="py-3 px-3">الحالة</th>
                    <th className="py-3 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const linkedEmp = employees.find((e) => e.id === user.employeeId);
                    const isSelf = currentUser?.id === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-600">
                                  {user.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {user.name}
                                {isSelf && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                                    أنت الآن
                                  </span>
                                )}
                              </div>
                              {linkedEmp && (
                                <span className="text-[10px] text-slate-400 block">
                                  مرتبط بالموظف: {linkedEmp.employeeCode} - {linkedEmp.jobTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          {user.username}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-lg border font-bold text-[10px] ${
                              user.role === 'admin'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : user.role === 'accountant'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : user.role === 'sales_cashier'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {user.role === 'admin'
                              ? 'مدير عام / أدمن'
                              : user.role === 'accountant'
                              ? 'محاسب مالي'
                              : user.role === 'sales_cashier'
                              ? 'كاشير مبيعات POS'
                              : user.role === 'warehouse_keeper'
                              ? 'أمين مستودع'
                              : user.role === 'hr_manager'
                              ? 'مدير موارد بشرية'
                              : 'مراجع حسابات'}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-600">
                          {user.pin ? `PIN: ${user.pin}` : '—'}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.role === 'admin' || user.permissions.includes('*') ? (
                              <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                كافة صلاحيات النظام (Full Access)
                              </span>
                            ) : (
                              user.permissions.slice(0, 3).map((p) => (
                                <span key={p} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                  {availablePermissions.find((ap) => ap.key === p)?.label || p}
                                </span>
                              ))
                            )}
                            {user.permissions.length > 3 && user.role !== 'admin' && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                +{user.permissions.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {user.isActive ? 'نشط ومصرح' : 'معطل'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Open Edit User & Permissions Modal */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditUserModal(user)}
                              className="text-[11px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="تعديل الصلاحيات وبيانات المستخدم"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>تعديل الصلاحيات</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const newPin = prompt(`تغيير رمز PIN للمستخدم ${user.name}:`, user.pin || '1234');
                                if (newPin) updateUser(user.id, { pin: newPin });
                              }}
                              className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg"
                              title="تعديل الـ PIN السريع"
                            >
                              <KeyRound className="w-3 h-3" />
                            </button>

                            {user.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => {
                                  showConfirm(
                                    `هل أنت متأكد من حذف المستخدم "${user.name}" (${user.username})؟`,
                                    () => {
                                      deleteUser(user.id);
                                    },
                                    `تأكيد حذف المستخدم (${user.name})`,
                                    'حذف المستخدم'
                                  );
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* EDIT USER & PERMISSIONS MODAL */}
          {showEditUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-600" />
                    تعديل صلاحيات وبيانات المستخدم: <span className="text-indigo-600">{editUserName}</span>
                  </h3>
                  <button
                    onClick={() => setShowEditUserModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">الاسم الكامل *</label>
                      <input
                        type="text"
                        required
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">اسم تسجيل الدخول (Username) *</label>
                      <input
                        type="text"
                        required
                        value={editUserUsername}
                        onChange={(e) => setEditUserUsername(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">الدور الوظيفي</label>
                      <select
                        value={editUserRole}
                        onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                      >
                        <option value="sales_cashier">كاشير مبيعات POS</option>
                        <option value="accountant">محاسب مالي</option>
                        <option value="warehouse_keeper">أمين مستودع</option>
                        <option value="hr_manager">مدير موارد بشرية</option>
                        <option value="admin">مدير عام / أدمن</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">رمز PIN السريع</label>
                      <input
                        type="password"
                        maxLength={6}
                        value={editUserPin}
                        onChange={(e) => setEditUserPin(e.target.value)}
                        placeholder="1234"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">كلمة المرور الجديدة (اختياري)</label>
                      <input
                        type="password"
                        value={editUserPassword}
                        onChange={(e) => setEditUserPassword(e.target.value)}
                        placeholder="اترك فارغاً لعدم التغيير"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Permissions Templates */}
                  <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-900 block">قوالب الصلاحيات الجاهزة السريعة:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditUserPermissions(['dashboard', 'quick_pos', 'sales', 'crm_collections', 'edit_invoices'])
                        }
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-bold border border-indigo-200 transition-colors"
                      >
                        ⚡ حزمة الكاشير
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditUserPermissions([
                            'dashboard',
                            'accounts',
                            'sales',
                            'purchases',
                            'inventory',
                            'financial_reports',
                            'crm_collections',
                            'edit_invoices',
                            'delete_invoices',
                            'edit_accounts',
                            'edit_expenses',
                          ])
                        }
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-200 transition-colors"
                      >
                        ⚡ حزمة المحاسب المالي
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditUserPermissions([
                            'dashboard',
                            'inventory',
                            'purchases',
                            'edit_products',
                            'delete_products',
                            'edit_suppliers',
                          ])
                        }
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold border border-amber-200 transition-colors"
                      >
                        ⚡ حزمة أمين المستودع
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditUserPermissions(availablePermissions.map((p) => p.key))}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors"
                      >
                        ✓ تحديد كافة الصلاحيات
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditUserPermissions([])}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-200 transition-colors"
                      >
                        ✕ إلغاء الكل
                      </button>
                    </div>
                  </div>

                  {/* Section 1: Module Access Permissions */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FolderLock className="w-4 h-4 text-indigo-600" />
                      1. صلاحيات الوصول للوحدات والشاشات (Module Access):
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      {availablePermissions
                        .filter((p) => p.group === 'modules')
                        .map((perm) => {
                          const isChecked = editUserPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-2 p-1.5 rounded-lg text-[11px] cursor-pointer select-none transition-colors ${
                                isChecked ? 'bg-indigo-50/70 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditUserPermissions([...editUserPermissions, perm.key]);
                                  } else {
                                    setEditUserPermissions(editUserPermissions.filter((k) => k !== perm.key));
                                  }
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{perm.label}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* Section 2: Granular CRUD Data Permissions */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      2. صلاحيات التعديل والحذف المتقدمة للبيانات (Granular Data Edit & Delete):
                    </label>
                    <p className="text-[10px] text-slate-500">
                      حدد ما إذا كان يحق لهذا المستخدم تعديل أو حذف السجلات والفواتير والمنتجات والحسابات
                    </p>
                    <div className="grid grid-cols-2 gap-2 bg-rose-50/30 p-3 rounded-2xl border border-rose-100">
                      {availablePermissions
                        .filter((p) => p.group === 'crud')
                        .map((perm) => {
                          const isChecked = editUserPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-2 p-1.5 rounded-lg text-[11px] cursor-pointer select-none transition-colors ${
                                isChecked ? 'bg-rose-50 text-rose-950 font-bold' : 'text-slate-700 hover:bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditUserPermissions([...editUserPermissions, perm.key]);
                                  } else {
                                    setEditUserPermissions(editUserPermissions.filter((k) => k !== perm.key));
                                  }
                                }}
                                className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                              />
                              <span>{perm.label}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editUserIsActive}
                        onChange={(e) => setEditUserIsActive(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-800">حساب المستخدم نشط ومصرح له بالدخول</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEditUserModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md"
                      >
                        حفظ التعديلات والصلاحيات
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADD USER MODAL */}
          {showAddUserModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">تعيين مستخدم جديد ومنح الصلاحيات</h3>
                      <p className="text-xs text-slate-400">إنشاء حساب مستخدم جديد أو ربطه بموظف من إدارة الموارد البشرية</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                  {/* Select Employee From HR */}
                  <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
                    <label className="block font-bold text-indigo-900">
                      ربط الحساب بموظف من الموارد البشرية (اختياري - يملأ البيانات والصورة تلقائياً):
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => handleSelectEmployeeForNewUser(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-slate-900 font-bold"
                    >
                      <option value="">-- حساب مستقل (بدون ربط بموظف HR) --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeCode} - {emp.name} ({emp.jobTitle} - {emp.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* User Profile Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-3 flex flex-col items-center justify-center bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 border-2 border-indigo-200 mb-2 relative group">
                        {newUserAvatar ? (
                          <img src={newUserAvatar} alt="معاينة" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xl">
                            {newUserName ? newUserName.charAt(0) : <User className="w-8 h-8" />}
                          </div>
                        )}
                        <label
                          className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px] font-bold"
                          title="رفع صورة"
                        >
                          <Camera className="w-4 h-4 text-emerald-400" />
                          <span>تغيير</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setNewUserAvatar(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">صورة المستخدم / الأفاتار</span>
                    </div>

                    <div className="sm:col-span-9 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">الاسم الكامل *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: أحمد عبد الله"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">اسم تسجيل الدخول (Username) *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: ahmad_pos"
                            value={newUserUsername}
                            onChange={(e) => setNewUserUsername(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">الدور الوظيفي</label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                          >
                            <option value="sales_cashier">كاشير مبيعات POS</option>
                            <option value="accountant">محاسب مالي</option>
                            <option value="warehouse_keeper">أمين مستودع</option>
                            <option value="hr_manager">مدير موارد بشرية</option>
                            <option value="admin">مدير عام / أدمن</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">كلمة المرور</label>
                          <input
                            type="password"
                            required
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="123456"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">رمز PIN السريع</label>
                          <input
                            type="password"
                            maxLength={6}
                            value={newUserPin}
                            onChange={(e) => setNewUserPin(e.target.value)}
                            placeholder="1234"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Permissions Templates */}
                  <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-900 block">قوالب الصلاحيات الجاهزة السريعة:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNewUserPermissions(['dashboard', 'quick_pos', 'sales', 'crm_collections', 'edit_invoices'])
                        }
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-bold border border-indigo-200 transition-colors"
                      >
                        ⚡ حزمة الكاشير
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewUserPermissions([
                            'dashboard',
                            'accounts',
                            'sales',
                            'purchases',
                            'inventory',
                            'financial_reports',
                            'crm_collections',
                            'edit_invoices',
                            'delete_invoices',
                            'edit_accounts',
                            'edit_customers',
                            'edit_suppliers',
                            'edit_expenses',
                          ])
                        }
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-bold border border-indigo-200 transition-colors"
                      >
                        📊 حزمة المحاسب
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewUserPermissions(['dashboard', 'inventory', 'purchases', 'edit_products', 'edit_suppliers'])
                        }
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-bold border border-indigo-200 transition-colors"
                      >
                        📦 حزمة أمين المخزن
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewUserPermissions(['dashboard', 'hr_payroll', 'edit_employees', 'delete_employees'])
                        }
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-bold border border-indigo-200 transition-colors"
                      >
                        👥 حزمة الموارد البشرية
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewUserPermissions(availablePermissions.map((p) => p.key))}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors"
                      >
                        🛡️ منح كافة الصلاحيات (أدمن كامل)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewUserPermissions([])}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold"
                      >
                        إلغاء تحديد الكل
                      </button>
                    </div>
                  </div>

                  {/* Section 1: Modules */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1">
                      1. صلاحيات الوصول للشاشات والوحدات الرئيسية (Modules)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availablePermissions
                        .filter((p) => p.group === 'modules')
                        .map((perm) => {
                          const isChecked = newUserPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewUserPermissions([...newUserPermissions, perm.key]);
                                  } else {
                                    setNewUserPermissions(newUserPermissions.filter((k) => k !== perm.key));
                                  }
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-[11px]">{perm.label}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* Section 2: Granular CRUD Actions */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>2. الصلاحيات التفصيلية (التعديل والحذف الحرج Granular CRUD)</span>
                      <span className="text-[10px] text-amber-600 font-normal">تتطلب حذر وتدقيق</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availablePermissions
                        .filter((p) => p.group === 'crud')
                        .map((perm) => {
                          const isChecked = newUserPermissions.includes(perm.key);
                          const isDelete = perm.key.startsWith('delete_');
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? isDelete
                                    ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                                    : 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewUserPermissions([...newUserPermissions, perm.key]);
                                  } else {
                                    setNewUserPermissions(newUserPermissions.filter((k) => k !== perm.key));
                                  }
                                }}
                                className={`rounded border-slate-300 ${
                                  isDelete ? 'text-rose-600 focus:ring-rose-500' : 'text-indigo-600 focus:ring-indigo-500'
                                }`}
                              />
                              <span className="text-[11px]">{perm.label}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة المستخدم واعتماد الصلاحيات
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROTECTED DATABASE, BACKUPS, INTEGRITY & AUDIT LOGS */}
      {activeTab === 'database_backup' && (
        <div className="space-y-6">
          {/* Top Actions: Export, Restore, Integrity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Backup Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">تصدير نسخة احتياطية كاملة</h4>
                <p className="text-xs text-slate-500">
                  تنزيل ملف JSON مشفر يحتوي على كافة الحسابات، الفواتير، المخزون، والرواتب.
                </p>
              </div>

              <button
                type="button"
                onClick={exportDataJSON}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                تصدير وحفظ النسخة الآن
              </button>
            </div>

            {/* Restore Backup Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">استرجاع نسخة سابقة (Restore)</h4>
                <p className="text-xs text-slate-500">
                  رفع ملف نسخة احتياطية سابقة واستعادة كامل بيانات المنشأة فورياً.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4" />
                  اختيار ملف النسخة واسترجاعها
                </button>
              </div>
            </div>

            {/* Diagnostic / Integrity Check */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">فحص توازن وتكامل قاعدة البيانات</h4>
                <p className="text-xs text-slate-500">
                  التحقق من توازن القيد المزدوج (مدين = دائن) وعدم وجود أخطاء ترحيل.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunIntegrityCheck}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                تشغيل فحص السلامة المحاسبية
              </button>
            </div>
          </div>

          {restoreFeedback && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-xs ${
                restoreFeedback.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {restoreFeedback.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{restoreFeedback.message}</span>
            </div>
          )}

          {/* Integrity Report Modal / Box */}
          {integrityReport && (
            <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  تقرير فحص التكامل المحاسبي وقاعدة البيانات
                </h4>
                <span className="text-xs text-slate-400">
                  فحص دقيق للقيود المزدوجة والمخزون
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">إجمالي المدين باليومية:</span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    {formatMoney(integrityReport.totalDebit)}
                  </span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">إجمالي الدائن باليومية:</span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    {formatMoney(integrityReport.totalCredit)}
                  </span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">حالة ميزان المراجعة:</span>
                  <span
                    className={`font-bold text-sm flex items-center gap-1 ${
                      integrityReport.isBalanced ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {integrityReport.isBalanced ? '✓ متوازن تماماً (0 فارق)' : '⚠ غير متوازن!'}
                  </span>
                </div>
              </div>

              {integrityReport.issues.length > 0 ? (
                <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200 space-y-1">
                  <strong className="block font-bold">تنبيهات وملاحظات تم رصدها:</strong>
                  {integrityReport.issues.map((iss: string, idx: number) => (
                    <p key={idx}>• {iss}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-medium">
                  ✓ قاعدة البيانات سليمة 100% ولا توجد أي انحرافات محاسبية أو أخطاء ترحيل.
                </p>
              )}
            </div>
          )}

          {/* Audit Logs (سجل العمليات والرقابة والأمان) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  سجل العمليات والرقابة والأمان (System Audit Log)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  سجل تدقيق كامل لكل العمليات المنفذة في النظام مع إمكانية البحث والفرز والرجوع عن الحركات
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1 rounded-full">
                  عرض {filteredAndSortedLogs.length} من أصل {auditLogs.length} حركة مسجلة
                </span>
                {hasActiveAuditFilters && (
                  <button
                    type="button"
                    onClick={handleResetAuditFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>إلغاء الفلاتر</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                {/* Search Box */}
                <div className="md:col-span-4">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">بحث شامل في السجل</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="ابحث بالنص، المستخدم، رقم الفاتورة أو السند..."
                      className="w-full pl-8 pr-9 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    {auditSearch && (
                      <button
                        type="button"
                        onClick={() => setAuditSearch('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date Range: From & To */}
                <div className="md:col-span-3 grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">من تاريخ</label>
                    <input
                      type="date"
                      value={auditStartDate}
                      onChange={(e) => setAuditStartDate(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">إلى تاريخ</label>
                    <input
                      type="date"
                      value={auditEndDate}
                      onChange={(e) => setAuditEndDate(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                    />
                  </div>
                </div>

                {/* User Dropdown */}
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">المستخدم</label>
                  <select
                    value={auditSelectedUser}
                    onChange={(e) => setAuditSelectedUser(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">كل المستخدمين</option>
                    {uniqueAuditUsers.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module / Department Dropdown */}
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">القسم / الوحدة</label>
                  <select
                    value={auditSelectedModule}
                    onChange={(e) => setAuditSelectedModule(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">كل الأقسام</option>
                    {uniqueAuditModules.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Type Dropdown */}
                <div className="md:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">نوع الإجراء</label>
                  <select
                    value={auditSelectedAction}
                    onChange={(e) => setAuditSelectedAction(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">كل الإجراءات</option>
                    {uniqueAuditActions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 sticky top-0 z-10 select-none">
                    {/* Sortable: Date & Time */}
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSortAudit('timestamp')}
                        className="flex items-center gap-1.5 font-bold hover:text-indigo-700 transition-colors cursor-pointer group"
                      >
                        <span>التاريخ والوقت</span>
                        {auditSortField === 'timestamp' ? (
                          auditSortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>

                    {/* Sortable: User */}
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSortAudit('userName')}
                        className="flex items-center gap-1.5 font-bold hover:text-indigo-700 transition-colors cursor-pointer group"
                      >
                        <span>المستخدم</span>
                        {auditSortField === 'userName' ? (
                          auditSortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>

                    {/* Sortable: Module */}
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSortAudit('module')}
                        className="flex items-center gap-1.5 font-bold hover:text-indigo-700 transition-colors cursor-pointer group"
                      >
                        <span>الوحدة / القسم</span>
                        {auditSortField === 'module' ? (
                          auditSortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>

                    {/* Sortable: Action */}
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSortAudit('action')}
                        className="flex items-center gap-1.5 font-bold hover:text-indigo-700 transition-colors cursor-pointer group"
                      >
                        <span>الإجراء</span>
                        {auditSortField === 'action' ? (
                          auditSortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>

                    {/* Sortable: Details */}
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSortAudit('details')}
                        className="flex items-center gap-1.5 font-bold hover:text-indigo-700 transition-colors cursor-pointer group"
                      >
                        <span>التفاصيل</span>
                        {auditSortField === 'details' ? (
                          auditSortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>

                    {/* Action Column: Rollback */}
                    <th className="py-3 px-3 text-center whitespace-nowrap">الرجوع عن الحركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <History className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-xs text-slate-600">لا توجد حركات مطابقة لمعايير البحث المحددة</p>
                        {hasActiveAuditFilters && (
                          <button
                            type="button"
                            onClick={handleResetAuditFilters}
                            className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 underline font-bold cursor-pointer"
                          >
                            إعادة ضبط كافة الفلاتر والبحث
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('ar-EG')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {log.userName}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 border border-slate-200/60 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-indigo-700 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 min-w-[200px]">
                          {log.details}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRollbackAction(log)}
                            className="text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            title="التراجع عن هذه الحركة وإلغاء أثرها في النظام"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                            <span>تراجع</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clean Company Reset & Setup Wizard */}
          <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                تفريغ النظام وبدء تشغيل شركة جديدة (Fresh Company Setup Wizard)
              </h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                تفريغ كافة الفواتير والسندات والعملاء والموردين لبدء العمل الفعلي، مع الإبقاء على دليل الحسابات القياسي المعتمد (الأصول، الخصوم، حقوق الملكية، الإيرادات، المصروفات) وإعادة فتح معالج تسجيل المدير.
              </p>
            </div>
            <button
              type="button"
              onClick={resetToCleanNewCompany}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              تفريغ وبدء شركة جديدة
            </button>
          </div>

          {/* Reset System Danger Zone */}
          <div className="bg-rose-50/60 p-5 rounded-3xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-xs text-rose-900">منطقة الحذر: إعادة ضبط بيانات النظام إلى الوضع الافتراضي</h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                مسح أي تعديلات محلية واسترجاع البيانات الأولية للمنشأة.
              </p>
            </div>
            <button
              type="button"
              onClick={resetToDefaultData}
              className="bg-white hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-300 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              استعادة البيانات الافتراضية
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE SHEETS & APPS SCRIPT INTEGRATION */}
      {activeTab === 'gsheets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Configuration Box */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  إعدادات الربط المباشر مع Google Sheets
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    رابط الـ Webhook الخاص بـ Google Apps Script Web App *
                  </label>
                  <input
                    type="url"
                    value={gsheetForm.webhookUrl}
                    onChange={(e) => setGsheetForm({ ...gsheetForm, webhookUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfy.../exec"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:bg-white text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    الرابط الذي يتم الحصول عليه بعد نشر كود الـ Apps Script كتطبيق ويب (Web App)
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    اسم ورقة العمل المستهدفة (Target Sheet Name)
                  </label>
                  <input
                    type="text"
                    value={gsheetForm.sheetName}
                    onChange={(e) => setGsheetForm({ ...gsheetForm, sheetName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="font-bold text-slate-800 block">خيارات المزامنة التلقائية:</label>
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gsheetForm.autoSyncInvoices}
                      onChange={(e) => setGsheetForm({ ...gsheetForm, autoSyncInvoices: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>مزامنة فواتير المبيعات ونقاط البيع تلقائياً فور إصدارها</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gsheetForm.autoSyncPayroll}
                      onChange={(e) => setGsheetForm({ ...gsheetForm, autoSyncPayroll: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>مزامنة مسيرات الرواتب المعتمدة شهرياً</span>
                  </label>
                </div>

                {/* Status Indicator */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">حالة الربط:</span>
                    <span className="font-bold text-emerald-700">
                      {gsheetForm.webhookUrl ? 'جاهز للإرسال' : 'بانتظار إدخال الرابط'}
                    </span>
                  </div>
                  {googleSheetConfig.lastSyncTime && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">آخر مزامنة:</span>
                      <span className="font-mono text-slate-800">{googleSheetConfig.lastSyncTime}</span>
                    </div>
                  )}
                </div>

                {syncFeedback && (
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                      syncFeedback.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {syncFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{syncFeedback.message}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => updateGoogleSheetConfig(gsheetForm)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                  >
                    حفظ الإعدادات
                  </button>

                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleTriggerGSheetSync}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة البيانات الآن إلى Google Sheets'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Code.gs and Step-by-Step Instructions */}
            <div className="lg:col-span-6 space-y-4">
              {/* Instructions Guide */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  دليل الإعداد والربط في 4 خطوات سهلة:
                </h3>

                <ol className="space-y-2 text-slate-600 list-decimal list-inside pr-1 leading-relaxed">
                  <li>
                    افتح ملف جديد في <strong>Google Sheets</strong> (جداول بيانات Google).
                  </li>
                  <li>
                    من القائمة العلوية، اختر: <strong>الإضافات (Extensions) ← Apps Script</strong>.
                  </li>
                  <li>
                    احذف أي كود موجود، والصق الكود الجاهز الموضح بالأسفل (انقر زر النسخ).
                  </li>
                  <li>
                    انقر <strong>نشر (Deploy) ← نشر جديد (New deployment)</strong>، اختر نوع <strong>Web App</strong>، واجعل صلاحية الوصول: <strong>"Anyone" (أي شخص)</strong>، ثم انسخ الرابط وضعه في المربع الجانبي!
                  </li>
                </ol>
              </div>

              {/* Ready Code Box */}
              <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-white text-xs font-mono font-bold">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    كود Apps Script الجاهز (Code.gs)
                  </div>

                  <button
                    type="button"
                    onClick={copyScriptToClipboard}
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'تم النسخ!' : 'نسخ الكود'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-slate-950 rounded-2xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DESKTOP APPLICATION & .EXE PACKAGING HUB */}
      {activeTab === 'desktop_exe' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-slate-800 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <Cpu className="w-3.5 h-3.5" />
                  برنامج سطح المكتب لنظام Windows (.EXE)
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  تحويل وتثبيت Orbix ERP كبرنامج حاسوب مستقل
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  يمكنك تثبيت المنظومة مباشرة على أجهزة الكمبيوتر كـ <strong>Progressive Web App (PWA)</strong> بنقرة واحدة، أو تجميع ملف <strong>.EXE لنظام Windows</strong> باستخدام حزمة Electron المدمجة مع دعم العمل بدون إنترنت والطباعة الحرارية المباشرة.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Instant PWA Install Action */}
                <button
                  type="button"
                  onClick={() => {
                    if ('beforeinstallprompt' in window) {
                      showAlert({
                        title: 'تثبيت التطبيق على سطح المكتب',
                        message: 'يمكنك تثبيت التطبيق الآن عبر الضغط على أيقونة التثبيت ⊕ في شريط عنوان المتصفح بالأعلى.',
                        type: 'info',
                        confirmText: 'فهمت',
                      });
                    } else {
                      showAlert({
                        title: 'تثبيت التطبيق كـ PWA',
                        message: 'لتثبيت التطبيق على جهازك: اضغط على زر خيارات المتصفح (⋮) بالأعلى ثم اختر "تثبيت Orbix ERP" أو "Install App / Add to Desktop".',
                        type: 'info',
                        confirmText: 'فهمت',
                      });
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <Laptop className="w-4 h-4" />
                  تثبيت فوري على سطح المكتب (PWA Install)
                </button>

                {/* Download One-Click Windows EXE Builder Script */}
                <button
                  type="button"
                  onClick={downloadDesktopPackagingKit}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-6 py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <MonitorDown className="w-4 h-4 text-emerald-400" />
                  تنزيل سكربت بناء ملف EXE (Windows Builder)
                </button>
              </div>
            </div>

            {/* Desktop Advantages Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-xs text-white">العمل دون اتصال بالإنترنت (Offline)</h4>
                <p className="text-[11px] text-slate-300">
                  حفظ كافة الفواتير، المخزون، والقيود محلياً على الجهاز مع المزامنة التلقائية عند الاتصال.
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-xs text-white">دعم طابعات الباركود والإيصالات الحرارية</h4>
                <p className="text-[11px] text-slate-300">
                  اتصال مباشر بطابعات 80mm عبر USB وNetwork بدون نوافذ متصفح مع طباعة فورية.
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-xs text-white">أمان فائق وعزل كامل</h4>
                <p className="text-[11px] text-slate-300">
                  صلاحيات دخول مؤمنة للموظفين مع تشفير تام لقاعدة البيانات المحلية.
                </p>
              </div>
            </div>
          </div>

          {/* Electron Main Configuration Guide */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-700" />
              ملف إعدادات التجميع الرسمي (`electron-main.js`)
            </h3>
            <p className="text-xs text-slate-500">
              كود تشغيل بيئة Electron الرسمية لتشغيل شاشات الكاشير والمحاسبة بملء الشاشة مع مفاتيح الاختصار:
            </p>

            <pre className="p-4 bg-slate-950 text-slate-200 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
{`const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    title: "Orbix ERP Enterprise",
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load production build
  mainWindow.loadFile('dist/index.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);`}
            </pre>
          </div>
        </div>
      )}
      {/* Image Crop Modal for Company Logo */}
      {logoPreview && (
        <ImageCropModal
          isOpen={isCroppingLogo}
          imageSrc={logoPreview}
          onClose={() => setIsCroppingLogo(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
