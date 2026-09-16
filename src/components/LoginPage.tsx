import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  KeyRound,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Wifi,
  QrCode,
  Laptop,
  Check
} from 'lucide-react';
import { LanShareModal } from './LanShareModal';

export const LoginPage: React.FC = () => {
  const { users, login, companyProfile } = useErp();
  const [usernameOrPin, setUsernameOrPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeMode, setActiveMode] = useState<'pin' | 'password'>('pin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLanModalOpen, setIsLanModalOpen] = useState(false);
  const [lanUrl, setLanUrl] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Load LAN information for helper footer
  useEffect(() => {
    fetch('/api/network/info')
      .then((r) => r.json())
      .then((data) => {
        if (data?.primaryLanUrl) {
          setLanUrl(data.primaryLanUrl);
        }
      })
      .catch(() => {});
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  const handleCardSelect = (user: (typeof users)[0]) => {
    setSelectedUserId(user.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUsernameOrPin('');
    setPassword('');
    if (activeMode === 'password') {
      setUsernameOrPin(user.username);
    }
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = usernameOrPin.trim();
    if (!trimmed) {
      setErrorMsg(activeMode === 'pin' ? 'يرجى إدخال رمز المرور السري (PIN)' : 'يرجى إدخال اسم المستخدم');
      return;
    }

    if (activeMode === 'pin') {
      if (selectedUser) {
        if ((selectedUser.pin || '1234') !== trimmed) {
          setErrorMsg(`رمز المرور (PIN) غير صحيح للحساب: ${selectedUser.name}`);
          return;
        }
        const success = login(trimmed);
        if (success) {
          setSuccessMsg('تم التحقق بنجاح، جاري الدخول للنظام...');
        } else {
          setErrorMsg('فشل تسجيل الدخول أو أن الحساب معطل.');
        }
      } else {
        const success = login(trimmed);
        if (success) {
          setSuccessMsg('تم التحقق بنجاح، جاري الدخول للنظام...');
        } else {
          setErrorMsg('رمز المرور (PIN) غير صحيح.');
        }
      }
    } else {
      const success = login(trimmed, password);
      if (success) {
        setSuccessMsg('تم التحقق بنجاح، جاري الدخول للنظام...');
      } else {
        setErrorMsg('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    }
  };

  const handleKeypadPress = (val: string) => {
    setErrorMsg(null);
    if (val === 'CLEAR') {
      setUsernameOrPin('');
    } else if (val === 'BACKSPACE') {
      setUsernameOrPin((prev) => prev.slice(0, -1));
    } else {
      if (usernameOrPin.length < 6) {
        const next = usernameOrPin + val;
        setUsernameOrPin(next);
        // Only attempt auto-login if a user card is selected and entered PIN matches their PIN
        if (selectedUser && next.length >= 4) {
          if ((selectedUser.pin || '1234') === next) {
            login(next);
            setSuccessMsg('تم التحقق بنجاح، جاري الدخول للنظام...');
          }
        }
      }
    }
  };

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: { label: 'مدير عام / أدمن', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    accountant: { label: 'محاسب مالي', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    sales_cashier: { label: 'كاشير مبيعات POS', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    warehouse_keeper: { label: 'أمين مخزن', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    hr_manager: { label: 'مدير موارد بشرية', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    auditor: { label: 'مراجع حسابات', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-between text-slate-100 font-sans antialiased select-none" dir="rtl">
      {/* Top Navbar Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-inner">
            {companyProfile.logoBase64 ? (
              <img src={companyProfile.logoBase64} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white">
              {companyProfile.nameAr || 'منظومة أوربكس لإدارة المؤسسات'}
            </h1>
            <p className="text-[11px] text-slate-400">
              Orbix ERP Enterprise • بوابة تسجيل الدخول والأمان
            </p>
          </div>
        </div>

        {/* Server & LAN Badge */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLanModalOpen(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-sm"
            title="مشاركة الرابط والـ QR Code مع الهواتف والأجهزة على الشبكة"
          >
            <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">مشاركة الشبكة المحلية</span>
            <QrCode className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Card Top Brand Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 text-white text-center relative border-b border-slate-800">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 p-2 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
              {companyProfile.logoBase64 ? (
                <img
                  src={companyProfile.logoBase64}
                  alt="Company Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <Building2 className="w-8 h-8 text-emerald-400" />
              )}
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {companyProfile.nameAr || 'منظومة أوربكس ERP'}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                متصل بالسيرفر المحلي (LAN)
              </span>
              {companyProfile.commercialRegister && (
                <span className="text-[11px] text-slate-400 font-mono hidden xs:inline">
                  س.ت: {companyProfile.commercialRegister}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('pin');
                  setErrorMsg(null);
                  setUsernameOrPin('');
                  setPassword('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeMode === 'pin'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                الدخول السريع برمز الـ PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('password');
                  setErrorMsg(null);
                  setUsernameOrPin('');
                  setPassword('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeMode === 'password'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                اسم المستخدم وكلمة المرور
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {activeMode === 'pin' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                      {selectedUser ? (
                        <span className="inline-flex items-center justify-center gap-1.5 flex-wrap">
                          <span>أدخل رمز المرور السري (PIN) للموظف:</span>
                          <strong className="text-slate-900 font-extrabold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            {selectedUser.name}
                          </strong>
                        </span>
                      ) : (
                        'أدخل رمز المرور السريع للموظف (PIN):'
                      )}
                    </label>
                    <div className="relative max-w-xs mx-auto">
                      <KeyRound className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="••••"
                        value={usernameOrPin}
                        onChange={(e) => setUsernameOrPin(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl pr-11 pl-4 py-3 text-center text-2xl font-mono font-black tracking-widest text-slate-900 focus:outline-hidden focus:border-slate-900 focus:bg-white transition-all shadow-inner"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* On-Screen Touch Keypad (Ideal for POS & Mobile) */}
                  <div className="max-w-xs mx-auto grid grid-cols-3 gap-2 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleKeypadPress(num)}
                        className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-lg font-bold font-mono text-slate-800 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('CLEAR')}
                      className="h-12 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                    >
                      مسح
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-lg font-bold font-mono text-slate-800 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('BACKSPACE')}
                      className="h-12 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-base font-bold text-amber-800 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      اسم المستخدم:
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                      <input
                        type="text"
                        placeholder="admin أو cashier..."
                        value={usernameOrPin}
                        onChange={(e) => setUsernameOrPin(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      كلمة المرور:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-10 py-2.5 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error & Success Alerts */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>تسجيل الدخول إلى النظام</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </form>

            {/* Employee Accounts List - Secure Selection */}
            {users.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    الموظفون والمستخدمون المصرح لهم:
                  </span>
                  <span className="text-[11px] text-slate-400">اختر حسابك ثم أدخل الرمز السري</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {users.map((user) => {
                    const roleBadge = roleLabels[user.role] || { label: user.role, color: 'bg-slate-100 text-slate-700' };
                    const isSelected = selectedUserId === user.id;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleCardSelect(user)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-400 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600">
                              {user.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md border font-medium ${roleBadge.color}`}>
                              {roleBadge.label}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Card LAN Helper */}
          {lanUrl && (
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>رابط الدخول من جهاز آخر على الشبكة:</span>
                <code className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono font-bold text-slate-800 text-[11px]" dir="ltr">
                  {lanUrl}
                </code>
              </div>
              <button
                type="button"
                onClick={() => setIsLanModalOpen(true)}
                className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3 h-3" />
                عرض الـ QR
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Page Footer */}
      <footer className="w-full px-6 py-3 text-center text-xs text-slate-400 border-t border-white/5">
        <span>منظومة Orbix ERP Enterprise • قاعدة بيانات PostgreSQL المركزية • متوافق مع الشبكة المحلية والسحابية</span>
      </footer>

      {/* LAN Sharing Modal with QR Code */}
      <LanShareModal
        isOpen={isLanModalOpen}
        onClose={() => setIsLanModalOpen(false)}
      />
    </div>
  );
};

