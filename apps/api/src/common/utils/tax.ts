export interface InvoiceLineInput {
  quantity: number;
  rate: number;
  gstRate: number;
}

export interface InvoiceLineComputed extends InvoiceLineInput {
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
}

export interface InvoiceTotals {
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeInvoiceLine(input: InvoiceLineInput): InvoiceLineComputed {
  const taxableValue = round2(input.quantity * input.rate);
  const cgstAmount = round2((taxableValue * input.gstRate) / 200);
  const sgstAmount = round2((taxableValue * input.gstRate) / 200);
  return {
    ...input,
    taxableValue,
    cgstAmount,
    sgstAmount,
    totalAmount: round2(taxableValue + cgstAmount + sgstAmount),
  };
}

export function computeInvoiceTotals(lines: InvoiceLineComputed[], discountAmount = 0, roundOff = 0): InvoiceTotals {
  const taxableValue = round2(lines.reduce((sum, line) => sum + line.taxableValue, 0));
  const cgstAmount = round2(lines.reduce((sum, line) => sum + line.cgstAmount, 0));
  const sgstAmount = round2(lines.reduce((sum, line) => sum + line.sgstAmount, 0));
  const totalTaxAmount = round2(cgstAmount + sgstAmount);
  const discounted = round2(Math.max(0, taxableValue - discountAmount));
  const totalAmount = round2(discounted + totalTaxAmount + roundOff);

  return {
    taxableValue: discounted,
    cgstAmount,
    sgstAmount,
    totalTaxAmount,
    totalAmount,
  };
}
