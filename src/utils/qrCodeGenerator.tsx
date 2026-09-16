import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export interface TaxInvoiceQrData {
  sellerName: string;
  taxNumber: string;
  timestamp: string;
  totalWithVat: number | string;
  vatAmount: number | string;
  invoiceNumber?: string;
}

/**
 * Standard TLV (Tag-Length-Value) Base64 encoder for Electronic Tax Invoicing
 * (ZATCA / ETA Standard Compliant)
 */
function encodeTLV(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  const tagBytes = new Uint8Array([tag, valueBytes.length]);
  const combined = new Uint8Array(tagBytes.length + valueBytes.length);
  combined.set(tagBytes, 0);
  combined.set(valueBytes, tagBytes.length);
  return combined;
}

export function generateZatcaTlvBase64(params: TaxInvoiceQrData): string {
  try {
    const tlv1 = encodeTLV(1, params.sellerName || 'Orbix Enterprise');
    const tlv2 = encodeTLV(2, params.taxNumber || '300000000000003');
    const tlv3 = encodeTLV(3, params.timestamp || new Date().toISOString());
    const tlv4 = encodeTLV(4, Number(params.totalWithVat || 0).toFixed(2));
    const tlv5 = encodeTLV(5, Number(params.vatAmount || 0).toFixed(2));

    const totalLength = tlv1.length + tlv2.length + tlv3.length + tlv4.length + tlv5.length;
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const tlv of [tlv1, tlv2, tlv3, tlv4, tlv5]) {
      buffer.set(tlv, offset);
      offset += tlv.length;
    }

    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('Error generating TLV Base64:', err);
    return `${params.sellerName} | ${params.taxNumber} | ${params.totalWithVat}`;
  }
}

/**
 * Generate a high-resolution QR Code Data URL from text or TLV payload
 */
export async function generateQrDataUrl(text: string, size = 200): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}

/**
 * Reusable React Component to display a verified Tax Invoicing QR Code
 */
export const InvoiceQrCode: React.FC<{
  data: TaxInvoiceQrData | string;
  size?: number;
  className?: string;
  showCaption?: boolean;
}> = ({ data, size = 110, className = '', showCaption = false }) => {
  const [qrSrc, setQrSrc] = useState<string>('');

  useEffect(() => {
    let rawText = '';
    if (typeof data === 'string') {
      rawText = data;
    } else {
      rawText = generateZatcaTlvBase64(data);
    }

    generateQrDataUrl(rawText, size * 2).then((src) => {
      setQrSrc(src);
    });
  }, [data, size]);

  if (!qrSrc) {
    return (
      <div
        className={`bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[10px]">جاري التوليد...</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img
        src={qrSrc}
        alt="رمز التحقق الضريبي والفوترة الإلكترونية QR"
        width={size}
        height={size}
        className="rounded shadow-xs border border-slate-200 bg-white p-1"
      />
      {showCaption && (
        <span className="text-[9px] text-slate-500 mt-1 font-mono tracking-wider">
          رمز الفاتورة الإلكترونية
        </span>
      )}
    </div>
  );
};
