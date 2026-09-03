import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { Product } from '../../types';
import {
  Barcode,
  Printer,
  Sparkles,
  Search,
  Check,
  Tag,
  Sliders,
  RefreshCw,
  Layers,
  Settings,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { renderBarcodeSvg, generateBarcodeSvgString } from '../../utils/barcodeGenerator';

interface BarcodePrintItem {
  product: Product;
  copies: number;
}

export const BarcodePrintTab: React.FC = () => {
  const { products, companyProfile, formatMoney, currency } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<BarcodePrintItem[]>([]);

  // Label configuration
  const [labelSize, setLabelSize] = useState<'38x25' | '50x30' | '70x40' | 'a4_sheet'>('50x30');
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showBarcodeText, setShowBarcodeText] = useState(true);
  const [barcodeFormat, setBarcodeFormat] = useState<'CODE128' | 'EAN13'>('CODE128');

  // Preview product
  const [previewProduct, setPreviewProduct] = useState<Product | null>(products[0] || null);

  const previewSvgRef = useRef<SVGSVGElement>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  // Render barcode in preview when product or settings change
  useEffect(() => {
    if (!previewProduct || !previewSvgRef.current) return;
    try {
      const code = previewProduct.barcode || previewProduct.sku || '12345678';
      renderBarcodeSvg(previewSvgRef.current, code, {
        width: 1.6,
        height: 45,
        displayValue: showBarcodeText,
        fontSize: 12,
        margin: 4,
      });
    } catch (e) {
      console.warn('Barcode render error:', e);
    }
  }, [previewProduct, showBarcodeText, barcodeFormat]);

  const handleToggleProduct = (product: Product) => {
    const existingIndex = selectedItems.findIndex((i) => i.product.id === product.id);
    if (existingIndex >= 0) {
      setSelectedItems((prev) => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      setSelectedItems((prev) => [...prev, { product, copies: 1 }]);
    }
  };

  const handleUpdateCopies = (productId: string, copies: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, copies: Math.max(1, copies) } : item
      )
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredProducts.map((p) => ({ product: p, copies: 1 })));
    }
  };

  const handlePrintBarcodes = () => {
    const itemsToPrint = selectedItems.length > 0 ? selectedItems : previewProduct ? [{ product: previewProduct, copies: 1 }] : [];
    if (itemsToPrint.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build sticker HTML with direct inline SVG
    const stickersHtml = itemsToPrint
      .flatMap((item) => {
        const stickers = [];
        for (let i = 0; i < item.copies; i++) {
          const code = item.product.barcode || item.product.sku || '12345678';
          const barcodeSvgHtml = generateBarcodeSvgString(code, {
            width: 1.4,
            height: 32,
            displayValue: showBarcodeText,
            fontSize: 10,
            margin: 2,
          });

          stickers.push(`
            <div class="barcode-sticker size-${labelSize}">
              ${showCompanyName ? `<div class="company-name">${companyProfile.nameAr || 'ORBIX ERP'}</div>` : ''}
              <div class="product-name">${item.product.name}</div>
              <div class="barcode-svg-container">${barcodeSvgHtml}</div>
              <div class="footer-info">
                ${showSku ? `<span class="sku">كود: ${item.product.sku}</span>` : ''}
                ${showPrice ? `<span class="price">${item.product.sellingPrice} ${currency}</span>` : ''}
              </div>
            </div>
          `);
        }
        return stickers;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>طباعة ملصقات الباركود</title>
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0;
            padding: 8px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            background: #fff;
          }
          .stickers-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: flex-start;
          }
          .barcode-sticker {
            border: 1px dashed #ccc;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 4px;
            page-break-inside: avoid;
            background: #fff;
          }
          .size-38x25 { width: 38mm; height: 25mm; max-height: 25mm; }
          .size-50x30 { width: 50mm; height: 30mm; max-height: 30mm; }
          .size-70x40 { width: 70mm; height: 40mm; max-height: 40mm; }
          .size-a4_sheet { width: 63.5mm; height: 38.1mm; border: 1px solid #e2e8f0; border-radius: 4px; }
          
          .company-name {
            font-size: 8px;
            font-weight: bold;
            color: #334155;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 95%;
          }
          .product-name {
            font-size: 9px;
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 95%;
            margin: 1px 0;
          }
          .barcode-svg-container {
            max-width: 95%;
            display: flex;
            justify-content: center;
          }
          .barcode-svg-container svg {
            max-width: 100%;
            height: auto;
          }
          .footer-info {
            width: 95%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8px;
            font-weight: bold;
            margin-top: 1px;
          }
          .sku { font-family: monospace; color: #475569; }
          .price { color: #047857; font-weight: 900; font-size: 9px; }
          @media print {
            .barcode-sticker { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="stickers-container">
          ${stickersHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Barcode className="w-5 h-5 text-emerald-600" />
            استوديو توليد وطباعة ملصقات الباركود (Barcode Studio)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            توليد باركود تلقائي للأصناف، تخصيص مقاس الملصقات، والطباعة المباشرة لطابعات الباركود الحرارية وورق A4
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrintBarcodes}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4" />
          طباعة الملصقات ({selectedItems.reduce((acc, i) => acc + i.copies, 0) || 1} ملصق)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Middle Column: Product Picker */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                اختر الأصناف المراد طباعة باركود لها:
              </h3>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                {selectedItems.length === filteredProducts.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الصنف أو الكود أو الباركود..."
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Products List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredProducts.map((p) => {
                const isSelected = selectedItems.some((i) => i.product.id === p.id);
                const selectedItem = selectedItems.find((i) => i.product.id === p.id);

                return (
                  <div
                    key={p.id}
                    className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 flex-1 cursor-pointer"
                      onClick={() => {
                        setPreviewProduct(p);
                        handleToggleProduct(p);
                      }}
                    >
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono">كود: {p.sku}</span>
                          <span>|</span>
                          <span className="text-emerald-700 font-bold font-mono">
                            {formatMoney(p.sellingPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-slate-500 font-bold">عدد النسخ:</span>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={selectedItem?.copies || 1}
                          onChange={(e) => handleUpdateCopies(p.id, Number(e.target.value))}
                          className="w-14 p-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-center"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          {/* Settings Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              إعدادات ومقاس ملصق الباركود:
            </h3>

            <div>
              <label className="block text-slate-700 font-bold mb-1">مقاس الملصق / نوع الورق</label>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="38x25">طابعة حرارية (38mm × 25mm) - صغير</option>
                <option value="50x30">طابعة حرارية (50mm × 30mm) - قياسي</option>
                <option value="70x40">طابعة حرارية (70mm × 40mm) - كبير</option>
                <option value="a4_sheet">ورق استيكر A4 مقسم (24 ملصق بالصفحة)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">صيغة تشفير الباركود</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBarcodeFormat('CODE128')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                    barcodeFormat === 'CODE128'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Code 128 (شامل نصوص وأرقام)
                </button>
                <button
                  type="button"
                  onClick={() => setBarcodeFormat('EAN13')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                    barcodeFormat === 'EAN13'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  EAN-13 (معياري دولي)
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="block text-slate-500 font-bold text-[11px]">البيانات الظاهرة على الملصق:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompanyName}
                  onChange={(e) => setShowCompanyName(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>اسم المنشأة / الشركة</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>سعر البيع والعملة</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>كود الصنف (SKU)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBarcodeText}
                  onChange={(e) => setShowBarcodeText(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>أرقام الباركود المقروءة أسفل الخطوط</span>
              </label>
            </div>
          </div>

          {/* Live Preview Sticker Box */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                معاينة شكل الملصق المطبوع:
              </h4>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {labelSize}
              </span>
            </div>

            {/* Sticker physical simulation */}
            <div className="flex justify-center p-4 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="bg-white text-slate-900 p-3 rounded-lg shadow-lg border border-slate-300 flex flex-col items-center justify-center text-center max-w-[240px] w-full min-h-[130px]">
                {showCompanyName && (
                  <div className="text-[10px] font-bold text-slate-500 truncate max-w-full">
                    {companyProfile.nameAr || 'ORBIX ERP'}
                  </div>
                )}
                <div className="text-xs font-black text-slate-900 truncate max-w-full my-0.5">
                  {previewProduct?.name || 'اسم الصنف التجريبي'}
                </div>

                {/* Rendered SVG Barcode */}
                <div className="my-1 flex justify-center w-full overflow-hidden">
                  <svg ref={previewSvgRef} className="max-w-full h-auto" />
                </div>

                <div className="w-full flex items-center justify-between text-[10px] font-bold mt-1 px-1 border-t border-slate-100 pt-1">
                  {showSku && (
                    <span className="font-mono text-slate-600">
                      {previewProduct?.sku || 'SKU-1001'}
                    </span>
                  )}
                  {showPrice && (
                    <span className="font-extrabold text-emerald-700">
                      {previewProduct ? formatMoney(previewProduct.sellingPrice) : `100 ${currency}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
