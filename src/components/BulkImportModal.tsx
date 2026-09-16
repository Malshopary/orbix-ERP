import React, { useState, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Users,
  Building2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import {
  ImportType,
  downloadCsvTemplate,
  parseRawCsvText,
  analyzeImportData,
  ImportPreviewResult,
  ParsedImportRow,
} from '../utils/excelImportExport';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ImportType;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'products',
}) => {
  const {
    addProduct,
    addCustomer,
    addVendor,
    addAccount,
    warehouses,
    setNotification,
    showAlert,
  } = useErp();

  const [activeType, setActiveType] = useState<ImportType>(defaultType);
  const [fileName, setFileName] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTabChange = (type: ImportType) => {
    setActiveType(type);
    setFileName('');
    setPreviewResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const matrix = parseRawCsvText(content);
      const analysis = analyzeImportData(activeType, matrix);
      setPreviewResult(analysis);
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleExecuteImport = () => {
    if (!previewResult || previewResult.validCount === 0) {
      showAlert({
        title: 'لا توجد بيانات صالحة',
        message: 'لا توجد أسطر صالحة للاستيراد في الملف المحدد.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const validRows = previewResult.rows.filter((r) => r.isValid);
      const defaultWhId = warehouses[0]?.id || 'wh-1';

      if (activeType === 'products') {
        validRows.forEach((row) => {
          const m = row.mapped;
          addProduct({
            sku: m.sku || '',
            name: m.name,
            category: m.category || 'عام',
            brand: m.brand,
            originCountry: m.originCountry,
            unit: m.unit || 'قطعة',
            costPrice: m.costPrice || 0,
            sellingPrice: m.sellingPrice || 0,
            wholesalePrice: m.wholesalePrice,
            stockQuantity: m.stockQuantity || 0,
            minStockAlert: m.minStockAlert || 5,
            warehouseId: defaultWhId,
            shelfLocation: m.shelfLocation,
            barcode: m.barcode || undefined,
            description: m.description,
            units: m.units,
          });
        });
      } else if (activeType === 'customers') {
        validRows.forEach((row) => {
          const m = row.mapped;
          addCustomer({
            name: m.name,
            companyName: m.companyName || m.name,
            phone: m.phone,
            email: m.email || '',
            address: m.address || '',
            governorate: m.governorate,
            taxNumber: m.taxNumber,
            commercialRegister: m.commercialRegister,
            creditLimit: m.creditLimit || 50000,
            paymentTermsDays: m.paymentTermsDays || 30,
            notes: m.notes,
          });
        });
      } else if (activeType === 'vendors') {
        validRows.forEach((row) => {
          const m = row.mapped;
          addVendor({
            name: m.name,
            companyName: m.companyName || m.name,
            phone: m.phone,
            email: m.email || '',
            address: m.address || '',
            governorate: m.governorate,
            taxNumber: m.taxNumber,
            commercialRegister: m.commercialRegister,
            paymentTermsDays: m.paymentTermsDays || 30,
            notes: m.notes,
          });
        });
      } else if (activeType === 'accounts') {
        validRows.forEach((row) => {
          const m = row.mapped;
          addAccount({
            code: m.code,
            name: m.name,
            type: m.type,
            parentCode: m.parentCode,
            balance: m.balance || 0,
            isHeader: m.isHeader || false,
            description: m.description,
          });
        });
      }

      setNotification({
        message: `تم بنجاح استيراد ${validRows.length} سجل في النظام!`,
        type: 'success',
      });

      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      showAlert({
        title: 'حدث خطأ أثناء الاستيراد',
        message: `تعذر إكمال عملية الاستيراد: ${err?.message || 'خطأ غير متوقع'}`,
        type: 'error',
        confirmText: 'إغلاق',
      });
    }
  };

  const getTypeName = (type: ImportType) => {
    switch (type) {
      case 'products':
        return 'الأصناف والمخزون';
      case 'customers':
        return 'دليل العملاء';
      case 'vendors':
        return 'دليل الموردين';
      case 'accounts':
        return 'شجرة الحسابات';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">
                استيراد البيانات الجماعي من إكسيل (Bulk Import)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تعبئة الأصناف والعملاء والموردين وشجرة الحسابات دفعة واحدة من ملفات Excel و CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl my-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabChange('products')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeType === 'products'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>الأصناف والمخزون</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('customers')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeType === 'customers'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>العملاء</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('vendors')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeType === 'vendors'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>الموردين</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('accounts')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeType === 'accounts'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>شجرة الحسابات</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Step 1: Download Template */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Download className="w-4 h-4 text-emerald-600" />
                الخطوة 1: تحميل نموذج إكسيل المعتمد لـ ({getTypeName(activeType)})
              </span>
              <p className="text-xs text-emerald-700">
                حمّل النموذج بصيغة CSV المتوافقة تماماً مع Excel باللغة العربية، وأضف بياناتك ثم ارفعه هنا.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadCsvTemplate(activeType)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>تحميل النموذج الآن</span>
            </button>
          </div>

          {/* Step 2: Upload CSV File */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-400 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
              id="bulk-import-file-input"
            />
            <label
              htmlFor="bulk-import-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                الخطوة 2: انقر لاختيار ملف الـ CSV المحفوظ من إكسيل
              </span>
              <span className="text-[11px] text-slate-500">
                الملفات المدعومة: CSV (مفصول بفاصلة أو فاصلة منقوطة) بترميز UTF-8
              </span>
            </label>
            {fileName && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>الملف المختار: {fileName}</span>
              </div>
            )}
          </div>

          {/* Step 3: Analysis & Preview Table */}
          {previewResult && (
            <div className="space-y-3">
              {/* Summary Stats Bar */}
              <div className="flex items-center justify-between bg-slate-100/80 p-3 rounded-xl text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-800">
                    إجمالي السجلات بالملف: {previewResult.totalRows}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    جاهز للاستيراد: {previewResult.validCount}
                  </span>
                  {previewResult.invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      سجلات بها أخطاء: {previewResult.invalidCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60 overflow-y-auto text-xs">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5">الاسم / البيان</th>
                      <th className="p-2.5">الكود / المرجع</th>
                      {activeType === 'products' && (
                        <>
                          <th className="p-2.5">سعر التكلفة</th>
                          <th className="p-2.5">سعر البيع</th>
                          <th className="p-2.5">الرصيد</th>
                          <th className="p-2.5">الوحدة الإضافية</th>
                        </>
                      )}
                      {activeType === 'customers' && (
                        <>
                          <th className="p-2.5">رقم الهاتف</th>
                          <th className="p-2.5">المحافظة</th>
                          <th className="p-2.5">الحد الائتماني</th>
                        </>
                      )}
                      {activeType === 'vendors' && (
                        <>
                          <th className="p-2.5">رقم الهاتف</th>
                          <th className="p-2.5">الرقم الضريبي</th>
                          <th className="p-2.5">فترة السداد</th>
                        </>
                      )}
                      {activeType === 'accounts' && (
                        <>
                          <th className="p-2.5">النوع</th>
                          <th className="p-2.5">الحساب الأب</th>
                          <th className="p-2.5">الرصيد الافتتاحي</th>
                        </>
                      )}
                      <th className="p-2.5 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewResult.rows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}
                      >
                        <td className="p-2 text-center text-slate-400 font-mono">
                          {row.rowNumber}
                        </td>
                        <td className="p-2 font-bold text-slate-800">
                          {row.mapped.name || <span className="text-rose-500">مفقود</span>}
                        </td>
                        <td className="p-2 font-mono text-slate-600">
                          {row.mapped.sku || row.mapped.code || '-'}
                        </td>

                        {activeType === 'products' && (
                          <>
                            <td className="p-2">{row.mapped.costPrice || 0}</td>
                            <td className="p-2 font-bold text-emerald-600">{row.mapped.sellingPrice || 0}</td>
                            <td className="p-2">{row.mapped.stockQuantity || 0} {row.mapped.unit || 'قطعة'}</td>
                            <td className="p-2">
                              {row.mapped.units && row.mapped.units.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                  {row.mapped.units[0].name} (معامل {row.mapped.units[0].factor})
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </>
                        )}

                        {activeType === 'customers' && (
                          <>
                            <td className="p-2 font-mono">{row.mapped.phone || '-'}</td>
                            <td className="p-2">{row.mapped.governorate || '-'}</td>
                            <td className="p-2">{row.mapped.creditLimit || 0}</td>
                          </>
                        )}

                        {activeType === 'vendors' && (
                          <>
                            <td className="p-2 font-mono">{row.mapped.phone || '-'}</td>
                            <td className="p-2 font-mono">{row.mapped.taxNumber || '-'}</td>
                            <td className="p-2">{row.mapped.paymentTermsDays || 30} يوم</td>
                          </>
                        )}

                        {activeType === 'accounts' && (
                          <>
                            <td className="p-2">{row.mapped.type}</td>
                            <td className="p-2 font-mono">{row.mapped.parentCode || '-'}</td>
                            <td className="p-2">{row.mapped.balance || 0}</td>
                          </>
                        )}

                        <td className="p-2 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              صالح
                            </span>
                          ) : (
                            <span
                              title={row.errors.join(' | ')}
                              className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-bold cursor-help"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {row.errors[0] || 'خطأ'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={!previewResult || previewResult.validCount === 0 || isProcessing}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'جاري الاستيراد والمعالجة...'
                : previewResult
                ? `استيراد وتأكيد (${previewResult.validCount}) سجل الآن`
                : 'حدد ملفاً لبدء الاستيراد'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

