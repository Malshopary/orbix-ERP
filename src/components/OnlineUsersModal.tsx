import React from 'react';
import { useErp } from '../context/ErpContext';
import { AppUser } from '../types';
import { 
  Users, 
  X, 
  Circle, 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  Laptop, 
  KeyRound,
  CheckCircle2,
  Lock,
  Activity
} from 'lucide-react';

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLoginModal: () => void;
}

export const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({
  isOpen,
  onClose,
  onOpenLoginModal,
}) => {
  const { users, currentUser, switchUser } = useErp();

  if (!isOpen) return null;

  const roleNameMap: Record<string, { label: string; badge: string }> = {
    admin: { label: 'مدير عام / أدمن', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    accountant: { label: 'محاسب مالي', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    sales_cashier: { label: 'كاشير مبيعات POS', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    warehouse_keeper: { label: 'أمين مخزن', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    hr_manager: { label: 'مدير موارد بشرية', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
    auditor: { label: 'مراجع حسابات', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
  };

  // Determine active/online status
  // If user is currently logged in, they are online now. Other active users are listed with their status.
  const onlineUsers = users.filter((u) => u.isActive !== false);
  const activeCount = onlineUsers.length > 0 ? (currentUser ? onlineUsers.length : 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">المستخدمون المتصلون بالسيستم</h3>
                <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentUser ? onlineUsers.length : 0} متصل
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة الجلسات المفتوحة وصلاحيات المستخدمين في الوقت الفعلي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Online Users List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 space-y-2">
              <Lock className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <p className="text-sm font-bold">لا يوجد مستخدمون مسجلون حالياً</p>
              <p className="text-xs text-slate-400">سجل الدخول بحساب الأدمن لإدارة النظام</p>
            </div>
          ) : (
            onlineUsers.map((user) => {
              const isMe = currentUser?.id === user.id;
              const roleInfo = roleNameMap[user.role] || { label: user.role, badge: 'bg-slate-100 text-slate-700 border-slate-200' };

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-emerald-50/60 border-emerald-200 shadow-xs'
                      : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* User Avatar with Green Pulse Badge */}
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-xs shrink-0 flex items-center justify-center">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-sm text-slate-700">{user.name.charAt(0)}</span>
                        )}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isMe ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                        title="متصل الآن (Online)"
                      />
                    </div>

                    {/* Name & Role */}
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{user.name}</span>
                        {isMe && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            أنت (الجلسة الحالية)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.badge}`}>
                          {roleInfo.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">@{user.username}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex items-center gap-2">
                    {isMe ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-xl">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        نشط الآن
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          switchUser(user.id);
                          onClose();
                        }}
                        className="text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                        title="التبديل إلى هذا الحساب"
                      >
                        تبديل للحساب
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLoginModal();
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>تسجيل الدخول بمستخدم آخر / رمز PIN</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
