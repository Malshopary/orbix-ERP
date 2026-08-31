import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  X, 
  ShieldCheck, 
  Check
} from 'lucide-react';

export type AlertType = 'warning' | 'error' | 'info' | 'success';

export interface AlertModalData {
  title?: string;
  message: string;
  details?: string;
  note?: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface GlobalAlertModalProps {
  data: AlertModalData | null;
  onClose: () => void;
}

export const GlobalAlertModal: React.FC<GlobalAlertModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  const {
    title,
    message,
    details,
    note,
    type = 'warning',
    confirmText = data.isConfirm ? 'تأكيد' : 'فهمت',
    cancelText = 'إلغاء الأمر',
    isConfirm = false,
    onConfirm,
    onCancel,
  } = data;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  // Color and Icon configs based on type
  const typeConfigs = {
    warning: {
      headerBg: 'bg-amber-500/10 text-amber-600 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: <AlertTriangle className="w-7 h-7 text-amber-600" />,
      titleColor: 'text-amber-900',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
      badge: 'تنبيه نظام',
    },
    error: {
      headerBg: 'bg-rose-500/10 text-rose-600 border-rose-200',
      iconBg: 'bg-rose-100 text-rose-600',
      icon: <ShieldAlert className="w-7 h-7 text-rose-600" />,
      titleColor: 'text-rose-900',
      buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
      badge: 'حماية وتنبيه أمان',
    },
    info: {
      headerBg: 'bg-blue-500/10 text-blue-600 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: <Info className="w-7 h-7 text-blue-600" />,
      titleColor: 'text-blue-900',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
      badge: 'إشعار توضيحي',
    },
    success: {
      headerBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-600" />,
      titleColor: 'text-emerald-900',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      badge: 'تم بنجاح',
    },
  };

  const currentTheme = typeConfigs[type] || typeConfigs.warning;

  // Split lines to detect structured sections if message contains newlines or emojis
  const cleanMessage = message.trim();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col transform transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div className="relative p-5 pb-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${currentTheme.headerBg}`}>
            {currentTheme.icon}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${currentTheme.headerBg}`}>
                {currentTheme.badge}
              </span>
            </div>
            <h3 className={`text-base font-bold truncate mt-1 ${currentTheme.titleColor}`}>
              {title || 'تنبيه من النظام'}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Main Message Block */}
          <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line font-medium">
            {cleanMessage}
          </div>

          {/* Optional Details or explanation */}
          {details && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                تفاصيل إضافية:
              </div>
              <p className="whitespace-pre-line">{details}</p>
            </div>
          )}

          {/* Optional Protection Note / Guidance Banner */}
          {note && (
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5 text-amber-950">حماية وتكامل البيانات المحاسبية</span>
                <span>{note}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {isConfirm ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${currentTheme.buttonBg}`}
                autoFocus
              >
                <Check className="w-4 h-4" />
                {confirmText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              className={`w-full sm:w-auto min-w-[130px] px-7 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${currentTheme.buttonBg}`}
              autoFocus
            >
              <Check className="w-4 h-4" />
              <span>{confirmText}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
