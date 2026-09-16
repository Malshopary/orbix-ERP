/**
 * ORBIX ERP - Excel & CSV Bulk Importer/Exporter Utility
 * Supports Arabic encoding with UTF-8 BOM for full Microsoft Excel compatibility
 */

export type ImportType = 'products' | 'customers' | 'vendors' | 'accounts';

export interface ParsedImportRow {
  rowNumber: number;
  raw: Record<string, string>;
  mapped: Record<string, any>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface ImportPreviewResult {
  type: ImportType;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  rows: ParsedImportRow[];
}

/**
 * Downloads a pre-formatted CSV template file with Arabic headers and example rows.
 * Adds UTF-8 Byte Order Mark (\uFEFF) so Microsoft Excel opens it with correct Arabic glyphs.
 */
export function downloadCsvTemplate(type: ImportType): void {
  let headers: string[] = [];
  let sampleRows: string[][] = [];
  let filename = `orbix_template_${type}.csv`;

  switch (type) {
    case 'products':
      headers = [
        'اسم الصنف*',
        'كود الصنف (SKU)',
        'الباركود الدولي',
        'فئة الصنف',
        'وحدة القياس الأساسية',
        'سعر الشراء / التكلفة*',
        'سعر البيع قطاعي*',
        'سعر بيع الجملة',
        'الرصيد الافتتاحي بالمخزن',
        'حد إعادة الطلب',
        'الماركة / العلامة التجارية',
        'بلد المنشأ',
        'مكان الرف / القطاع',
        'الوحدة الإضافية (كرتونة/علبة)',
        'معامل تحويل الوحدة الإضافية',
        'باركود الوحدة الإضافية',
        'سعر بيع الوحدة الإضافية',
        'ملاحظات / وصف الصنف'
      ];
      sampleRows = [
        [
          'شاي العروسة عبوة 250 جم',
          'SKU-TEA-250',
          '622100123001',
          'مواد غذائية ومشروبات',
          'قطعة',
          '38.50',
          '45.00',
          '42.00',
          '200',
          '25',
          'العروسة',
          'مصر',
          'A-01',
          'كرتونة',
          '24',
          '622100123099',
          '1000.00',
          'شاي أسود ناعم درجة أولى'
        ],
        [
          'زيت عافية ذرة 1.6 لتر',
          'SKU-OIL-1600',
          '622100124002',
          'زيوت وسمن',
          'زجاجة',
          '95.00',
          '110.00',
          '104.00',
          '80',
          '15',
          'عافية',
          'مصر',
          'B-04',
          'كرتونة',
          '6',
          '622100124099',
          '620.00',
          'زيت ذرة نقي 100%'
        ]
      ];
      break;

    case 'customers':
      headers = [
        'اسم العميل*',
        'اسم المؤسسة أو الشركة',
        'رقم الهاتف أو الموبايل*',
        'الرقم الضريبي',
        'السجل التجاري',
        'المحافظة',
        'العنوان التفصيلي',
        'الرصيد الافتتاحي',
        'الحد الائتماني',
        'فترة السداد بالأيام',
        'البريد الإلكتروني',
        'الشخص المسؤول',
        'ملاحظات'
      ];
      sampleRows = [
        [
          'شركة النور للتجارة الحديثة',
          'مؤسسة النور للتوزيع ش.م.م',
          '01012345678',
          '123456789',
          '54321',
          'القاهرة',
          'شارع النصر، المعادي الجديدة',
          '0',
          '50000',
          '30',
          'info@alnoortrading.com',
          'أ/ سامح إبراهيم',
          'عميل تجاري معتمد وائتمان منتظم'
        ],
        [
          'سوبرماركت البركة',
          'محلات البركة للمواد الغذائية',
          '01123456789',
          '',
          '',
          'الجيزة',
          'شارع فيصل الرئيسي، محطة العشرين',
          '0',
          '20000',
          '15',
          '',
          'أ/ محمود البركة',
          'عميل تجزئة'
        ]
      ];
      break;

    case 'vendors':
      headers = [
        'اسم المورد*',
        'اسم الشركة أو المؤسسة',
        'رقم الهاتف أو الموبايل*',
        'الرقم الضريبي',
        'السجل التجاري',
        'المحافظة',
        'العنوان التفصيلي',
        'الرصيد الافتتاحي الدائن',
        'فترة السداد بالأيام',
        'البريد الإلكتروني',
        'اسم مندوب المورد',
        'هاتف المندوب',
        'ملاحظات'
      ];
      sampleRows = [
        [
          'شركة الأهرام للصناعات الغذائية',
          'مجموعة الأهرام للتوريدات العمومية',
          '01234567890',
          '987654321',
          '12345',
          'الجيزة',
          'المنطقة الصناعية الثالثة، مدينة 6 أكتوبر',
          '0',
          '45',
          'sales@alahram-group.com',
          'أ/ شريف حسني',
          '01099887766',
          'مورد رئيسي للسلع الأساسية والمشروبات'
        ]
      ];
      break;

    case 'accounts':
      headers = [
        'كود الحساب المحاسبي*',
        'اسم الحساب بالعربية*',
        'نوع الحساب (asset / liability / equity / revenue / expense)*',
        'كود الحساب الأب (Parent Code)',
        'الرصيد الافتتاحي',
        'حساب رئيسي تجميعي؟ (نعم / لا)',
        'الوصف والبيان'
      ];
      sampleRows = [
        [
          '1114',
          'خزينة الفرع الثاني (مصر الجديدة)',
          'asset',
          '1110',
          '10000',
          'لا',
          'خزينة نقدية تابعة للأصول المتداولة - فرع مصر الجديدة'
        ],
        [
          '2130',
          'أمانات وتأمينات العملاء المستردة',
          'liability',
          '2100',
          '0',
          'لا',
          'التزامات متداولة - أمانات محصلة من العملاء'
        ]
      ];
      break;
  }

  // Build CSV content with UTF-8 BOM
  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCsvCell).join(','));
  sampleRows.forEach((row) => {
    csvRows.push(row.map(escapeCsvCell).join(','));
  });

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerBrowserDownload(blob, filename);
}

/**
 * Escapes a single CSV cell value properly
 */
function escapeCsvCell(cell: any): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Native helper to trigger file download in browser
 */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports any table data to CSV with UTF-8 BOM
 */
export function exportTableToCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]): void {
  const csvLines: string[] = [];
  csvLines.push(headers.map(escapeCsvCell).join(','));
  rows.forEach((row) => {
    csvLines.push(row.map(escapeCsvCell).join(','));
  });
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerBrowserDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Parses raw CSV/TSV text into an array of lines and cells
 */
export function parseRawCsvText(text: string): string[][] {
  // Strip BOM if present
  let clean = text.replace(/^\uFEFF/, '');

  // Detect delimiter: check first line for tabs, commas, or semicolons
  const firstLine = clean.split(/\r\n|\n|\r/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip CRLF
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Normalizes Arabic column headers for fuzzy matching
 */
function normalizeHeaderKey(header: string): string {
  return header
    .toLowerCase()
    .replace(/[*()_—\-\[\]]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Analyzes and validates parsed lines according to target ImportType
 */
export function analyzeImportData(type: ImportType, matrix: string[][]): ImportPreviewResult {
  if (!matrix || matrix.length < 2) {
    return {
      type,
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      rows: [],
    };
  }

  const rawHeaders = matrix[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeaderKey);
  const dataRows = matrix.slice(1);

  const parsedRows: ParsedImportRow[] = [];

  dataRows.forEach((rowCells, idx) => {
    // Skip completely empty rows
    if (rowCells.every((c) => !c || c.trim() === '')) return;

    const rowNum = idx + 2; // 1-based index (header is line 1)
    const rawObj: Record<string, string> = {};
    rawHeaders.forEach((header, i) => {
      rawObj[header] = rowCells[i] || '';
    });

    const getVal = (possibleKeys: string[]): string => {
      for (const key of possibleKeys) {
        const norm = normalizeHeaderKey(key);
        const colIdx = normalizedHeaders.findIndex((h) => h.includes(norm) || norm.includes(h));
        if (colIdx !== -1 && rowCells[colIdx] !== undefined) {
          return rowCells[colIdx].trim();
        }
      }
      return '';
    };

    const errors: string[] = [];
    const warnings: string[] = [];
    const mapped: Record<string, any> = {};

    if (type === 'products') {
      const name = getVal(['اسم الصنف', 'الصنف', 'اسم المنتج', 'الاسم', 'product_name', 'name']);
      const sku = getVal(['كود الصنف', 'sku', 'الكود', 'رمز الصنف']);
      const barcode = getVal(['الباركود', 'باركود', 'barcode']);
      const category = getVal(['فئة الصنف', 'الفئة', 'القسم', 'التصنيف', 'category']) || 'عام';
      const unit = getVal(['وحدة القياس الأساسية', 'الوحدة', 'وحدة القياس', 'unit']) || 'قطعة';
      const costPriceStr = getVal(['سعر الشراء', 'التكلفة', 'سعر التكلفة', 'cost_price', 'cost']);
      const sellPriceStr = getVal(['سعر البيع', 'سعر القطاعي', 'سعر البيع قطاعي', 'selling_price', 'price']);
      const wholesaleStr = getVal(['سعر الجملة', 'سعر بيع الجملة', 'wholesale_price']);
      const stockStr = getVal(['الرصيد الافتتاحي', 'الرصيد', 'كمية المخزون', 'الكمية', 'stock']);
      const minAlertStr = getVal(['حد إعادة الطلب', 'الحد الأدنى', 'تنبيه النواقص', 'min_stock']);
      const brand = getVal(['الماركة', 'العلامة التجارية', 'brand']);
      const origin = getVal(['بلد المنشأ', 'المنشأ', 'origin']);
      const shelf = getVal(['مكان الرف', 'الرف', 'shelf_location', 'shelf']);
      const notes = getVal(['ملاحظات', 'الوصف', 'وصف الصنف', 'notes', 'description']);

      // Packaging unit columns
      const extraUnitName = getVal(['الوحدة الإضافية', 'اسم الوحدة الإضافية', 'الكرتونة', 'unit2_name']);
      const extraFactorStr = getVal(['معامل تحويل الوحدة', 'معامل التحويل', 'عدد القطع', 'unit2_factor']);
      const extraBarcode = getVal(['باركود الوحدة الإضافية', 'باركود الكرتونة', 'unit2_barcode']);
      const extraPriceStr = getVal(['سعر بيع الوحدة الإضافية', 'سعر الكرتونة', 'unit2_price']);

      if (!name) {
        errors.push('اسم الصنف حقل إلزامي.');
      }

      const costPrice = parseFloat(costPriceStr.replace(/,/g, '')) || 0;
      const sellingPrice = parseFloat(sellPriceStr.replace(/,/g, '')) || 0;
      const wholesalePrice = wholesaleStr ? parseFloat(wholesaleStr.replace(/,/g, '')) : undefined;
      const stockQuantity = parseFloat(stockStr.replace(/,/g, '')) || 0;
      const minStockAlert = parseFloat(minAlertStr.replace(/,/g, '')) || 5;

      if (sellingPrice < 0) errors.push('سعر البيع لا يمكن أن يكون سالباً.');
      if (costPrice < 0) errors.push('سعر التكلفة لا يمكن أن يكون سالباً.');
      if (sellingPrice > 0 && costPrice > sellingPrice) {
        warnings.push('سعر التكلفة أعلى من سعر البيع (قد يتسبب في خسارة).');
      }

      // Process extra unit
      let units: any[] | undefined = undefined;
      if (extraUnitName && extraFactorStr) {
        const factor = parseFloat(extraFactorStr) || 1;
        if (factor > 1) {
          units = [
            {
              id: `unit-${Date.now()}-${idx}`,
              name: extraUnitName,
              factor,
              barcode: extraBarcode || undefined,
              sellingPrice: extraPriceStr ? parseFloat(extraPriceStr) : sellingPrice * factor,
              isDefaultSale: false,
            }
          ];
        }
      }

      mapped.name = name;
      mapped.sku = sku;
      mapped.barcode = barcode;
      mapped.category = category;
      mapped.unit = unit;
      mapped.costPrice = costPrice;
      mapped.sellingPrice = sellingPrice;
      mapped.wholesalePrice = wholesalePrice;
      mapped.stockQuantity = stockQuantity;
      mapped.minStockAlert = minStockAlert;
      mapped.brand = brand;
      mapped.originCountry = origin;
      mapped.shelfLocation = shelf;
      mapped.description = notes;
      mapped.units = units;

    } else if (type === 'customers') {
      const name = getVal(['اسم العميل', 'العميل', 'الاسم', 'customer_name', 'name']);
      const company = getVal(['اسم المؤسسة', 'الشركة', 'اسم الشركة', 'company']);
      const phone = getVal(['رقم الهاتف', 'الهاتف', 'الموبايل', 'phone', 'mobile']);
      const taxNumber = getVal(['الرقم الضريبي', 'البطاقة الضريبية', 'tax_number']);
      const cr = getVal(['السجل التجاري', 'commercial_register']);
      const gov = getVal(['المحافظة', 'governorate']) || 'القاهرة';
      const address = getVal(['العنوان التفصيلي', 'العنوان', 'address']);
      const balanceStr = getVal(['الرصيد الافتتاحي', 'الرصيد', 'balance']);
      const limitStr = getVal(['الحد الائتماني', 'credit_limit']);
      const termsStr = getVal(['فترة السداد', 'أيام السداد', 'payment_terms']);
      const email = getVal(['البريد الإلكتروني', 'الإيميل', 'email']);
      const contactPerson = getVal(['الشخص المسؤول', 'اسم المسؤول', 'contact_person']);
      const notes = getVal(['ملاحظات', 'notes']);

      if (!name) errors.push('اسم العميل حقل إلزامي.');
      if (!phone) warnings.push('يفضل إدخال رقم الهاتف للتواصل عبر واتساب.');

      mapped.name = name;
      mapped.companyName = company || name;
      mapped.phone = phone || '01000000000';
      mapped.taxNumber = taxNumber;
      mapped.commercialRegister = cr;
      mapped.governorate = gov;
      mapped.address = address;
      mapped.currentBalance = parseFloat(balanceStr.replace(/,/g, '')) || 0;
      mapped.creditLimit = parseFloat(limitStr.replace(/,/g, '')) || 50000;
      mapped.paymentTermsDays = parseInt(termsStr.replace(/,/g, ''), 10) || 30;
      mapped.email = email;
      mapped.contactPerson = contactPerson;
      mapped.notes = notes;

    } else if (type === 'vendors') {
      const name = getVal(['اسم المورد', 'المورد', 'الاسم', 'vendor_name', 'name']);
      const company = getVal(['اسم المؤسسة', 'الشركة', 'اسم الشركة', 'company']);
      const phone = getVal(['رقم الهاتف', 'الهاتف', 'الموبايل', 'phone', 'mobile']);
      const taxNumber = getVal(['الرقم الضريبي', 'البطاقة الضريبية', 'tax_number']);
      const cr = getVal(['السجل التجاري', 'commercial_register']);
      const gov = getVal(['المحافظة', 'governorate']) || 'القاهرة';
      const address = getVal(['العنوان التفصيلي', 'العنوان', 'address']);
      const balanceStr = getVal(['الرصيد الافتتاحي', 'الرصيد', 'balance']);
      const termsStr = getVal(['فترة السداد', 'أيام السداد', 'payment_terms']);
      const email = getVal(['البريد الإلكتروني', 'الإيميل', 'email']);
      const repName = getVal(['اسم مندوب المورد', 'المندوب', 'sales_rep']);
      const repPhone = getVal(['هاتف المندوب', 'موبايل المندوب', 'rep_phone']);
      const notes = getVal(['ملاحظات', 'notes']);

      if (!name) errors.push('اسم المورد حقل إلزامي.');
      if (!phone) warnings.push('يفضل إدخال رقم هاتف المورد.');

      mapped.name = name;
      mapped.companyName = company || name;
      mapped.phone = phone || '01000000000';
      mapped.taxNumber = taxNumber;
      mapped.commercialRegister = cr;
      mapped.governorate = gov;
      mapped.address = address;
      mapped.currentBalance = parseFloat(balanceStr.replace(/,/g, '')) || 0;
      mapped.paymentTermsDays = parseInt(termsStr.replace(/,/g, ''), 10) || 30;
      mapped.email = email;
      mapped.salesRepName = repName;
      mapped.salesRepPhone = repPhone;
      mapped.notes = notes;

    } else if (type === 'accounts') {
      const code = getVal(['كود الحساب', 'الكود', 'رقم الحساب', 'code', 'account_code']);
      const name = getVal(['اسم الحساب', 'الحساب', 'الاسم', 'account_name', 'name']);
      const typeStr = getVal(['نوع الحساب', 'النوع', 'account_type', 'type']).toLowerCase();
      const parentCode = getVal(['كود الحساب الأب', 'الحساب الرئيسي', 'parent_code']);
      const balanceStr = getVal(['الرصيد الافتتاحي', 'الرصيد', 'balance']);
      const isHeaderStr = getVal(['حساب رئيسي', 'تجميعي', 'is_header']);
      const desc = getVal(['الوصف', 'البيان', 'description']);

      if (!code) errors.push('كود الحساب حقل إلزامي.');
      if (!name) errors.push('اسم الحساب حقل إلزامي.');

      let mappedType: any = 'asset';
      if (typeStr.includes('خصم') || typeStr.includes('التزام') || typeStr.includes('liabilit')) {
        mappedType = 'liability';
      } else if (typeStr.includes('ملكي') || typeStr.includes('حقوق') || typeStr.includes('equity')) {
        mappedType = 'equity';
      } else if (typeStr.includes('ايراد') || typeStr.includes('revenue') || typeStr.includes('income')) {
        mappedType = 'revenue';
      } else if (typeStr.includes('مصروف') || typeStr.includes('تكلف') || typeStr.includes('expense')) {
        mappedType = 'expense';
      }

      mapped.code = code;
      mapped.name = name;
      mapped.type = mappedType;
      mapped.parentCode = parentCode || undefined;
      mapped.balance = parseFloat(balanceStr.replace(/,/g, '')) || 0;
      mapped.isHeader = isHeaderStr.includes('نعم') || isHeaderStr.includes('true') || isHeaderStr.includes('1');
      mapped.description = desc;
    }

    parsedRows.push({
      rowNumber: rowNum,
      raw: rawObj,
      mapped,
      errors,
      warnings,
      isValid: errors.length === 0,
    });
  });

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return {
    type,
    totalRows: parsedRows.length,
    validCount,
    invalidCount,
    rows: parsedRows,
  };
}

