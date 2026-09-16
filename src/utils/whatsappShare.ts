/**
 * Utility to format and share ERP documents via WhatsApp
 */

export function sanitizePhoneNumber(phone: string, defaultCountryCode = '20'): string {
  if (!phone) return '';
  // Remove all non-numeric characters
  let clean = phone.replace(/\D/g, '');
  
  // If starts with 00, replace with nothing
  if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }
  
  // If starts with local 0 (e.g., 010 in Egypt or 05 in Saudi Arabia)
  if (clean.startsWith('0')) {
    clean = defaultCountryCode + clean.substring(1);
  }
  
  return clean;
}

export interface ShareInvoiceParams {
  companyName: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  total: number | string;
  taxTotal?: number | string;
  balanceDue?: number | string;
  currency?: string;
  notes?: string;
}

export function generateInvoiceWhatsAppUrl(params: ShareInvoiceParams): string {
  const currencyStr = params.currency || 'ج.م';
  const cleanPhone = params.customerPhone ? sanitizePhoneNumber(params.customerPhone) : '';

  const message = `السلام عليكم ورحمة الله وبركاته،
تحية طيبة من *${params.companyName}* 🌹

تفاصيل الفاتورة الضريبية:
📄 *رقم الفاتورة:* ${params.invoiceNumber}
📅 *التاريخ:* ${params.date}
👤 *العميل:* ${params.customerName}
💰 *الإجمالي المستحق:* ${Number(params.total).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
${params.balanceDue && Number(params.balanceDue) > 0 ? `⚠️ *المتبقي:* ${Number(params.balanceDue).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}\n` : '✅ *حالة السداد:* مسددة بالكامل\n'}
${params.notes ? `📝 *ملاحظات:* ${params.notes}\n` : ''}
شكراً لتعاملكم واختياركم لنا!
*${params.companyName}*`;

  const encodedText = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
}

export function openWhatsAppShare(params: ShareInvoiceParams): void {
  const url = generateInvoiceWhatsAppUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export interface ShareReceiptParams {
  companyName: string;
  receiptNumber: string;
  date: string;
  partyName: string;
  partyPhone?: string;
  amount: number | string;
  type: 'collection' | 'payment';
  currency?: string;
  notes?: string;
}

export function openReceiptWhatsAppShare(params: ShareReceiptParams): void {
  const currencyStr = params.currency || 'ج.م';
  const cleanPhone = params.partyPhone ? sanitizePhoneNumber(params.partyPhone) : '';
  const typeText = params.type === 'collection' ? 'سند قبض نقدية/شيك' : 'سند صرف';

  const message = `السلام عليكم ورحمة الله وبركاته،
إشعار مالي من *${params.companyName}* 🧾

📋 *نوع المستند:* ${typeText}
🔢 *رقم السند:* ${params.receiptNumber}
📅 *التاريخ:* ${params.date}
👤 *المستفيد/المسدد:* ${params.partyName}
💵 *المبلغ:* ${Number(params.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
${params.notes ? `📝 *البيان:* ${params.notes}\n` : ''}
تم تسجيل العملية بنجاح في النظام المحاسبي.
شكراً لتعاملكم معنا.`;

  const encodedText = encodeURIComponent(message);
  const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export interface ShareZReportParams {
  companyName: string;
  shiftNumber: string;
  cashierName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalSales: number | string;
  totalCash: number | string;
  totalCard: number | string;
  totalEWallet: number | string;
  totalCredit: number | string;
  totalReturns: number | string;
  totalDiscounts: number | string;
  totalTax: number | string;
  invoiceCount: number;
  initialCash: number | string;
  expectedCash: number | string;
  actualCash: number | string;
  difference: number | string;
  managerPhone?: string;
  currency?: string;
  notes?: string;
}

export function generateZReportWhatsAppUrl(params: ShareZReportParams): string {
  const currencyStr = params.currency || 'ج.م';
  const cleanPhone = params.managerPhone ? sanitizePhoneNumber(params.managerPhone) : '';
  const diffNum = Number(params.difference) || 0;
  const diffStatus = diffNum === 0 ? 'مطابق تماماً (0)' : diffNum > 0 ? `زيادة (+${diffNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr})` : `عجز (${diffNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr})`;

  const message = `📋 *تقرير إغلاق وردية كاشير (Z-Report)* 📋
🏢 *المنشأة:* ${params.companyName}
👤 *الكاشير:* ${params.cashierName}
🔢 *رقم الوردية:* ${params.shiftNumber}
📅 *التاريخ:* ${params.date}
⏰ *الفترة:* من ${params.startTime} إلى ${params.endTime}
═════════════════════
📊 *إحصائيات المبيعات:*
🧾 عدد الفواتير: ${params.invoiceCount}
💰 إجمالي المبيعات: ${Number(params.totalSales).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
🏷️ إجمالي الخصومات: ${Number(params.totalDiscounts).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
🏛️ ضريبة القيمة المضافة: ${Number(params.totalTax).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
🔄 المرتجعات: ${Number(params.totalReturns).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
═════════════════════
💳 *تفصيل طرق التحصيل:*
💵 كاش (نقداً): ${Number(params.totalCash).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
💳 شبكة وفيزا: ${Number(params.totalCard).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
📱 إنستاباي ومحافظ: ${Number(params.totalEWallet).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
📝 آجل على الحساب: ${Number(params.totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
═════════════════════
📥 *حركة النقدية بالدرج:*
🪙 رصيد بداية الدرج: ${Number(params.initialCash).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
➕ نقدية المبيعات المستلمة: ${Number(params.totalCash).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
🎯 النقدية المتوقعة بالدرج: ${Number(params.expectedCash).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
💵 النقدية الفعلية بعد الجرد: ${Number(params.actualCash).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencyStr}
⚖️ *الفارق:* ${diffStatus}
═════════════════════
${params.notes ? `📝 *ملاحظات الكاشير:* ${params.notes}\n═════════════════════\n` : ''}تم الإغلاق والاعتماد بنجاح - نظام ORBIX ERP`;

  const encodedText = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
}

export function openZReportWhatsAppShare(params: ShareZReportParams): void {
  const url = generateZReportWhatsAppUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}

