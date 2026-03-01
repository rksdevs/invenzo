export type Role = 'OWNER' | 'CASHIER' | 'ACCOUNTANT' | 'PLATFORM_ADMIN';

export type StockMovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'CREDIT_NOTE';

export interface TaxBreakup {
  gstRate: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  totalTaxAmount: number;
}

export interface InvoiceTotals {
  taxableValue: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalTaxAmount: number;
  roundOff: number;
  totalAmount: number;
}

export interface PaymentSplit {
  mode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
  amount: number;
  reference?: string;
}
