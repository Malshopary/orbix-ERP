import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { useErp } from '../context/ErpContext';

interface PrivacyPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PrivacyPinModal: React.FC<PrivacyPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, verifyUserPin } = useErp();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!pin.trim()) {
      setErrorMsg('يرجى إدخال رمز الـ PIN أو كلمة المرور للمتابعة.');
      return;
    }

    const isValid = verifyUserPin(pin);
    if (isValid) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg('رمز الـ PIN غير صحيح! الأرقام المالية ستبقى محجوبة ومؤمّنة.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleKeypadPress = (val: string) => {
    setErrorMsg(null);
    if (val === 'clear') {
      setPin('');
      inputRef.current?.focus();
    } else if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
      inputRef.current?.focus();
    } else {
      setPin((prev) => prev + val);
      inputRef.current?.focus();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">إلغاء حجب الأرقام المالية</h3>
              <p className="text-[11px] text-slate-400">التحقق من هوية المستخدم الحالية</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إلغاء وإبقاء الحجب (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* User Info Card */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                {currentUser?.name ? currentUser.name.charAt(0) : 'م'}
              </div>
              <div>
                <span className="block font-bold text-slate-800 text-xs">
                  {currentUser?.name || 'المدير العام'}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {currentUser?.role === 'admin'
                    ? 'مدير النظام (Admin)'
                    : currentUser?.role || 'مستخدم مسجل'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              <span>محجوب</span>
            </span>
          </div>

          {/* Prompt description */}
          <p className="text-xs text-slate-600 leading-relaxed text-center">
            أدخل رمز الـ <strong className="text-slate-900 font-bold font-mono">PIN</strong> الخاص بحسابك لإلغاء تشويش الأرقام الحساسة وإظهارها.
          </p>

          {/* PIN Input */}
          <div className="space-y-1.5">
            <div className="relative">
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="أدخل رمز PIN أو كلمة المرور..."
                className="w-full bg-slate-50 border-2 border-slate-300 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-hidden transition-all shadow-inner"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                title={showPin ? 'إخفاء الرمز' : 'إظهار الرمز'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold p-2 bg-rose-50 rounded-xl border border-rose-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Quick Touch Keypad for PIN */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-base flex items-center justify-center transition-colors active:scale-95 cursor-pointer shadow-2xs"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress('clear')}
              className="h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              title="مسح كامل"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-base flex items-center justify-center transition-colors active:scale-95 cursor-pointer shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('backspace')}
              className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              title="حذف آخر رقم"
            >
              ←
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>تأكيد وإلغاء الحجب</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

