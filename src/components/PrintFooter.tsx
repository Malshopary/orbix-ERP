import React from 'react';
import { useErp } from '../context/ErpContext';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export interface PrintFooterProps {
  notes?: string;
  terms?: string;
  showSignatures?: boolean;
  preparedByTitle?: string;
  approvedByTitle?: string;
  receivedByTitle?: string;
  compact?: boolean;
  className?: string;
}

export const PrintFooter: React.FC<PrintFooterProps> = ({
  notes,
  terms,
  showSignatures = true,
  preparedByTitle = 'إعداد الموظف المختص',
  approvedByTitle = 'الاعتماد المحاسبي والمالي',
  receivedByTitle = 'توقيع المستلم / العميل',
  compact = false,
  className = '',
}) => {
  const { companyProfile, currentUser } = useErp();
  const printTimestamp = new Date().toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className={`w-full space-y-4 pt-4 border-t border-slate-300 text-xs select-none ${className}`}>
      {/* Terms & Notes Section if present */}
      {(notes || terms || companyProfile.invoiceFooterNotes) && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
          {notes && (
            <div>
              <span className="font-bold text-slate-800">ملاحظات: </span>
              <span>{notes}</span>
            </div>
          )}
          {terms && (
            <div>
              <span className="font-bold text-slate-800">الشروط والأحكام: </span>
              <span>{terms}</span>
            </div>
          )}
          {companyProfile.invoiceFooterNotes && !notes && !terms && (
            <div>
              <span className="font-bold text-slate-800">تنويه: </span>
              <span>{companyProfile.invoiceFooterNotes}</span>
            </div>
          )}
        </div>
      )}

      {/* Official Signatures Grid */}
      {showSignatures && (
        <div
          className={`grid grid-cols-3 gap-4 text-center text-slate-700 pt-2 ${
            compact ? 'space-y-0' : 'space-y-1'
          }`}
        >
          {/* Prepared By */}
          <div className="flex flex-col items-center justify-between min-h-[70px]">
            <span className="font-bold text-[11px] text-slate-800">{preparedByTitle}</span>
            <div className="w-28 border-b-2 border-dotted border-slate-400 my-2"></div>
            <span className="text-[10px] text-slate-400 font-mono">
              {currentUser?.name || 'المستخدم'}
            </span>
          </div>

          {/* Approved By */}
          <div className="flex flex-col items-center justify-between min-h-[70px]">
            <span className="font-bold text-[11px] text-slate-800">{approvedByTitle}</span>
            <div className="w-28 border-b-2 border-dotted border-slate-400 my-2"></div>
            <span className="text-[10px] text-slate-400">الإدارة المالية</span>
          </div>

          {/* Received By */}
          <div className="flex flex-col items-center justify-between min-h-[70px]">
            <span className="font-bold text-[11px] text-slate-800">{receivedByTitle}</span>
            <div className="w-28 border-b-2 border-dotted border-slate-400 my-2"></div>
            <span className="text-[10px] text-slate-400">التوقيع / الختم</span>
          </div>
        </div>
      )}

      {/* Bottom Cert & Timestamp Bar */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span className="font-sans font-medium text-slate-500">
            مستند مالي معتمد صادِر آلياً من نظام {companyProfile.nameAr || 'أوربكس ERP'}
          </span>
        </div>
        <div>
          <span>تاريخ ووقت الطباعة: </span>
          <span className="font-bold text-slate-600">{printTimestamp}</span>
        </div>
      </div>
    </div>
  );
};
