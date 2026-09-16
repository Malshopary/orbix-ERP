import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, isMandatory = false }) => {
  const { users, currentUser, login, companyProfile } = useErp();
  const [usernameOrPin, setUsernameOrPin] = useState('');
  const [password, setPassword] = useState('');
  const [activeMode, setActiveMode] = useState<'password' | 'pin'>('pin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  if (!isOpen) return null;

  const handleSelectUser = (user: (typeof users)[0]) => {
    setSelectedUserId(user.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUsernameOrPin('');
    setPassword('');
    if (activeMode === 'password') {
      setUsernameOrPin(user.username);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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
          setErrorMsg(`رمز الـ PIN غير صحيح للحساب: ${selectedUser.name}`);
          return;
        }
        const success = login(trimmed);
        if (success) {
          setSuccessMsg('تم تسجيل الدخول بنجاح!');
          setTimeout(() => {
            if (onClose) onClose();
          }, 400);
        } else {
          setErrorMsg('فشل تسجيل الدخول أو أن الحساب معطل.');
        }
      } else {
        const success = login(trimmed);
        if (success) {
          setSuccessMsg('تم تسجيل الدخول بنجاح!');
          setTimeout(() => {
            if (onClose) onClose();
          }, 400);
        } else {
          setErrorMsg('رمز الـ PIN غير صحيح، يرجى المحاولة مرة أخرى.');
        }
      }
    } else {
      const success = login(trimmed, password);
      if (success) {
        setSuccessMsg('تم تسجيل الدخول بنجاح!');
        setTimeout(() => {
          if (onClose) onClose();
        }, 400);
      } else {
        setErrorMsg('اسم المستخدم أو كلمة المرور غير صحيحة.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Company Logo / Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 p-2 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
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
          <h2 className="text-xl font-bold text-white tracking-tight">
            {companyProfile.nameAr}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            تسجيل الدخول وبوابة الصلاحيات المؤمنة (RBAC Security Portal)
          </p>

          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 text-slate-400 hover:text-white text-sm bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveMode('pin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'pin'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              الدخول السريع برمز الـ PIN
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('password');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'password'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              اسم المستخدم وكلمة المرور
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {activeMode === 'pin' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {selectedUser ? (
                    <span className="flex items-center gap-1.5">
                      <span>أدخل رمز المرور السري (PIN) للحساب:</span>
                      <strong className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {selectedUser.name}
                      </strong>
                    </span>
                  ) : (
                    'رمز المرور السريع (PIN Code):'
                  )}
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="أدخل رمز الـ PIN (مثال: 1234)"
                    value={usernameOrPin}
                    onChange={(e) => setUsernameOrPin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-11 pl-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    اسم المستخدم:
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      placeholder="admin أو cashier..."
                      value={usernameOrPin}
                      onChange={(e) => setUsernameOrPin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    كلمة المرور:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>دخول النظام</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </form>

          {/* Employee Accounts List - Secure Selection */}
          {users.length > 0 ? (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2">
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
                      onClick={() => handleSelectUser(user)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-right transition-all cursor-pointer ${
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
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        </div>
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
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border-t border-slate-200 pt-4 text-center">
              <p className="text-xs text-slate-500">
                لم يتم تسجيل أي مستخدم بعد.
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-3 text-center border-t border-slate-200 text-[11px] text-slate-500">
          منظومة Orbix ERP • قاعدة بيانات مشفرة ومحمية محلياً وسحابياً
        </div>
      </div>
    </div>
  );
};
