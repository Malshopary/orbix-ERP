import React from 'react';
import { useErp } from '../context/ErpContext';
import { OrbixLogo } from './OrbixLogo';
import { Building2, Phone, MapPin, QrCode, FileText, Calendar, Hash } from 'lucide-react';

export interface PrintHeaderProps {
  docTitle?: string;
  docSubtitle?: string;
  docNumber?: string;
  date?: string;
  dueDate?: string;
  badgeColor?: string;
  additionalMeta?: Array<{ label: string; value: string }>;
  showQrCode?: boolean;
  qrPayload?: string;
  compact?: boolean;
  orientation?: 'portrait' | 'landscape';
  className?: string;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  docTitle = 'مستند رسمي',
  docSubtitle,
  docNumber,
  date,
  dueDate,
  badgeColor = 'bg-slate-900 text-white',
  additionalMeta,
  showQrCode = false,
  qrPayload,
  compact = false,
  orientation = 'portrait',
  className = '',
}) => {
  const { companyProfile } = useErp();

  return (
    <div
      className={`w-full border-b-2 border-slate-800 pb-4 select-none ${
        compact ? 'pb-2.5' : 'pb-4'
      } ${className}`}
    >
      <div className="flex justify-between items-start gap-4">
        {/* Right Section: Company Logo & Detailed Business Profile */}
        <div className="flex items-center gap-3.5 max-w-[65%]">
          {/* Company Logo container with soft light background & light border so even white/transparent logos stand out */}
          <div
            style={{ maxWidth: `${Math.max(160, (companyProfile.logoWidth || 160) + 16)}px` }}
            className="shrink-0 bg-slate-100/90 border border-slate-200/90 rounded-xl p-1.5 flex items-center justify-center min-w-[50px] min-h-[50px] shadow-2xs"
          >
            {companyProfile.logoBase64 ? (
              <img
                src={companyProfile.logoBase64}
                alt={companyProfile.nameAr}
                style={{ width: `${companyProfile.logoWidth || 160}px` }}
                className="max-h-20 w-auto object-contain rounded-lg"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <OrbixLogo size="md" variant="icon" />
              </div>
            )}
          </div>

          {/* Company Business Text Information */}
          <div className="space-y-0.5 text-right">
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {companyProfile.nameAr || 'شركة أوربكس للحلول المتكاملة والتجارة'}
            </h1>
            {companyProfile.nameEn && (
              <p className="text-[11px] font-semibold text-slate-600 font-sans leading-none">
                {companyProfile.nameEn}
              </p>
            )}

            {/* Commercial Register & Tax ID */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-slate-600 font-mono mt-1">
              {companyProfile.commercialRegister && (
                <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-800">
                  <span className="font-sans text-slate-500 font-medium">س.ت:</span>
                  <span>{companyProfile.commercialRegister}</span>
                </span>
              )}
              {companyProfile.taxNumber && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold text-emerald-900">
                  <span className="font-sans text-emerald-700 font-medium">الرقم الضريبي:</span>
                  <span>{companyProfile.taxNumber}</span>
                </span>
              )}
            </div>

            {/* Address & Phone */}
            <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500 mt-0.5">
              {companyProfile.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{companyProfile.address}</span>
                </span>
              )}
              {companyProfile.phone && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{companyProfile.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Left Section: Document Meta & Title Badge */}
        <div className="text-left flex flex-col items-end space-y-1.5 shrink-0">
          {/* Document Title Badge */}
          <div
            className={`inline-block text-xs font-black px-3.5 py-1 rounded-lg shadow-2xs ${badgeColor}`}
          >
            {docTitle}
          </div>

          {docSubtitle && (
            <div className="text-[10px] text-slate-500 font-semibold">{docSubtitle}</div>
          )}

          {docNumber && (
            <div className="flex items-center gap-1 font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              <Hash className="w-3 h-3 text-slate-500" />
              <span>{docNumber}</span>
            </div>
          )}

          {/* Dates */}
          <div className="space-y-0.5 text-[10px] sm:text-[11px] text-slate-600 font-mono text-left">
            {date && (
              <div>
                <span className="text-slate-400 font-sans">التاريخ: </span>
                <span className="font-bold text-slate-800">{date}</span>
              </div>
            )}
            {dueDate && (
              <div>
                <span className="text-slate-400 font-sans">الاستحقاق: </span>
                <span className="font-bold text-rose-700">{dueDate}</span>
              </div>
            )}
            {additionalMeta &&
              additionalMeta.map((meta, idx) => (
                <div key={idx}>
                  <span className="text-slate-400 font-sans">{meta.label}: </span>
                  <span className="font-bold text-slate-800">{meta.value}</span>
                </div>
              ))}
          </div>

          {/* Optional Tax QR Code */}
          {showQrCode && (
            <div className="mt-1 flex items-center justify-center p-1 bg-white border border-slate-300 rounded-lg">
              <QrCode className="w-10 h-10 text-slate-900" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
