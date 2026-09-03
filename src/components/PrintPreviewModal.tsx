import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { printDocumentElement } from '../utils/printUtils';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  docNumber?: string;
  badgeText?: string;
  badgeColor?: string;
  elementId?: string;
  defaultOrientation?: 'portrait' | 'landscape';
  children: (props: {
    orientation: 'portrait' | 'landscape';
    zoom: number;
  }) => React.ReactNode;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  docNumber,
  badgeText = 'جاهز للطباعة',
  badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200',
  elementId = 'printable-canvas-sheet',
  defaultOrientation = 'portrait',
  children,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    defaultOrientation
  );
  const [zoom, setZoom] = useState<number>(100);

  if (!isOpen) return null;

  const handlePrint = () => {
    printDocumentElement(elementId, {
      title: `${title} - ${docNumber || ''}`,
      orientation,
    });
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs select-none overflow-y-auto"
      dir="rtl"
    >
      <div
        className={`bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full flex flex-col my-auto max-h-[96vh] overflow-hidden transition-all duration-200 ${
          orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Top Control Bar */}
        <div className="bg-white border-b border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Document Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-slate-900">{title}</h3>
                {docNumber && (
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {docNumber}
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                >
                  {badgeText}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                معاينة الطباعة الرسمية - متوافق مع قياسات ورقة A4
              </p>
            </div>
          </div>

          {/* Action & Configuration Controls */}
          <div className="flex flex-wrap items-center gap-2 mr-auto">
            {/* Orientation Toggle Button */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="طباعة رأسية (طولي)"
              >
                <span>طولي (Portrait)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="طباعة أفقية (عرضي)"
              >
                <span>عرضي (Landscape)</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(70, z - 10))}
                disabled={zoom <= 70}
                className="p-1 hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                title="تصغير المعاينة"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] min-w-[38px] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(120, z + 10))}
                disabled={zoom >= 120}
                className="p-1 hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                title="تكبير المعاينة"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Document Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              title="إرسال إلى الطابعة أو الحفظ كـ PDF"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>طباعة المستند</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer mr-1"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Canvas Viewport Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/70 flex justify-center">
          <div
            id={elementId}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
            }}
            className={`printable-sheet printable-page bg-white shadow-xl border border-slate-300 p-6 sm:p-8 rounded-xl text-slate-900 w-full transition-all ${
              orientation === 'landscape'
                ? 'print-landscape max-w-[297mm] min-h-[210mm]'
                : 'print-portrait max-w-[210mm] min-h-[297mm]'
            }`}
          >
            {children({ orientation, zoom })}
          </div>
        </div>
      </div>
    </div>
  );
};
