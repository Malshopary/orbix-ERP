/**
 * Smart sequence incrementer for accounting codes, invoices, products, customers, and employees.
 * Examples:
 * - '0001' -> '0002'
 * - '00101' -> '00102'
 * - 'INV-2026-0005' -> 'INV-2026-0006'
 * - 'PRD-099' -> 'PRD-100'
 * - '101' -> '102'
 */
export function incrementSequenceCode(previousCode: string, step = 1): string {
  if (!previousCode || typeof previousCode !== 'string') {
    return '0001';
  }

  const trimmed = previousCode.trim();

  // Match trailing sequence of digits
  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (!match) {
    // If no digits at all, append '0001'
    return `${trimmed}-0001`;
  }

  const prefix = match[1];
  const numberStr = match[2];
  const paddingLength = numberStr.length;
  const nextNum = parseInt(numberStr, 10) + step;

  // Preserve leading zeros
  const nextNumberStr = nextNum.toString().padStart(paddingLength, '0');

  return `${prefix}${nextNumberStr}`;
}

export interface SequenceConfig {
  autoGenerateCodes: boolean;
  invoicePrefix: string;
  invoiceNextNumber: number;
  invoicePadding: number;
  returnPrefix: string;
  returnNextNumber: number;
  returnPadding: number;
  quotationPrefix?: string;
  quotationNextNumber?: number;
  quotationPadding?: number;
  orderPrefix?: string;
  orderNextNumber?: number;
  orderPadding?: number;
  productPrefix: string;
  productNextNumber: number;
  productPadding: number;
  customerPrefix: string;
  customerNextNumber: number;
  customerPadding: number;
  vendorPrefix: string;
  vendorNextNumber: number;
  vendorPadding: number;
  employeePrefix: string;
  employeeNextNumber: number;
  employeePadding: number;
  accountAutoIncrement: boolean;
}

export const DEFAULT_SEQUENCE_CONFIG: SequenceConfig = {
  autoGenerateCodes: true,
  invoicePrefix: 'INV-2026-',
  invoiceNextNumber: 1001,
  invoicePadding: 4,
  returnPrefix: 'RET-2026-',
  returnNextNumber: 101,
  returnPadding: 3,
  quotationPrefix: 'QUO-2026-',
  quotationNextNumber: 1001,
  quotationPadding: 4,
  orderPrefix: 'SO-2026-',
  orderNextNumber: 1001,
  orderPadding: 4,
  productPrefix: 'PRD-',
  productNextNumber: 101,
  productPadding: 3,
  customerPrefix: 'CUST-',
  customerNextNumber: 101,
  customerPadding: 3,
  vendorPrefix: 'VEND-',
  vendorNextNumber: 101,
  vendorPadding: 3,
  employeePrefix: 'EMP-',
  employeeNextNumber: 101,
  employeePadding: 3,
  accountAutoIncrement: true,
};

export function formatSequenceCode(prefix: string, nextNumber: number, padding: number): string {
  return `${prefix}${nextNumber.toString().padStart(padding, '0')}`;
}
