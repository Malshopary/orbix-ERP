import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Wifi, 
  Copy, 
  Check, 
  Smartphone, 
  Laptop, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  X,
  Share2
} from 'lucide-react';

interface NetworkInfoResponse {
  success: boolean;
  port: number;
  hostname: string;
  hostIps: { iface: string; ip: string; url: string }[];
  localUrl: string;
  primaryLanUrl: string;
}

interface LanShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanShareModal: React.FC<LanShareModalProps> = ({ isOpen, onClose }) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string>('');

  const fetchNetworkInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/network/info');
      if (!res.ok) throw new Error('فشل جلب تفاصيل الشبكة من الخادم');
      const data: NetworkInfoResponse = await res.json();
      setNetworkInfo(data);
      
      const targetUrl = data.primaryLanUrl || data.localUrl;
      setSelectedUrl(targetUrl);
      
      // Generate QR Code
      const qrUrl = await QRCode.toDataURL(targetUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(qrUrl);
    } catch (err: any) {
      setError(err.message || 'تعذر اكتشاف عناوين الشبكة المحلية');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNetworkInfo();
    }
  }, [isOpen]);

  const handleSelectUrl = async (url: string) => {
    setSelectedUrl(url);
    try {
      const qrUrl = await QRCode.toDataURL(url, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(qrUrl);
    } catch {
      // fallback
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => {
      setCopiedUrl(null);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                مشاركة النظام على الشبكة المحلية (LAN)
              </h2>
              <p className="text-xs text-slate-300">
                افتح المنظومة من أي هاتف، تابلت، أو كمبيوتر على نفس شبكة الواي فاي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-bold">جاري فحص كروت الشبكة وعناوين الـ IP...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">{error}</p>
                <button
                  onClick={fetchNetworkInfo}
                  className="mt-2 text-xs text-rose-800 underline font-bold cursor-pointer"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* QR Code & Direct Scan Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 shrink-0 flex flex-col items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="LAN Access QR Code"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-slate-100 rounded-lg text-xs text-slate-400">
                      جاري التوليد...
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    امسح بالكاميرا للدخول الفوري
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-3 text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    السيرفر نشط على المنفذ {networkInfo?.port || 3000}
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900">
                    رابط الدخول المباشر للموظفين:
                  </h3>

                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-2 shadow-2xs">
                    <input
                      type="text"
                      readOnly
                      value={selectedUrl}
                      className="flex-1 font-mono text-xs font-bold text-slate-800 bg-transparent outline-hidden px-2 text-left"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedUrl)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        copiedUrl === selectedUrl
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {copiedUrl === selectedUrl ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الرابط</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    أرسل هذا الرابط للموظفين أو افتحه في متصفح الهواتف أو أجهزة الكاشير المتصلة بنفس شبكة الواي فاي.
                  </p>
                </div>
              </div>

              {/* Network Adapters List */}
              {networkInfo && networkInfo.hostIps.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    عناوين الشبكة المكتشفة على هذا الجهاز ({networkInfo.hostIps.length}):
                  </span>
                  <div className="space-y-2">
                    {networkInfo.hostIps.map((net, idx) => {
                      const isCurr = selectedUrl === net.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectUrl(net.url)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isCurr
                              ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isCurr ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{net.iface}</span>
                                {isCurr && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded-md font-bold">
                                    الرئيسي
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-600" dir="ltr">
                                {net.url}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(net.url);
                              }}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                              title="نسخ"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={net.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                              title="فتح في تبويب جديد"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Instructions & Troubleshooting Card */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2 text-amber-900">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>إرشادات الاتصال الناجح عبر الشبكة المحلية:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 leading-relaxed pr-1">
                  <li>تأكد أن هاتف أو جهاز الموظف متصل بنفس شبكة الواي فاي أو الراوتر الذي يتصل به هذا الكمبيوتر.</li>
                  <li>عند فتح الرابط لأول مرة على جهاز الموظف، ستظهر له صفحة تسجيل الدخول فوراً بكافة بيانات المنشأة.</li>
                  <li>إذا لم يفتح الرابط، تأكد من تشغيل ملف <strong>Setup-LAN-Firewall.bat</strong> كمسؤول للسماح للمنفذ 3000 في جدار حماية ويندوز.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>اسم الجهاز: <strong className="font-mono text-slate-700">{networkInfo?.hostname || 'Host'}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

