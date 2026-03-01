import { computeInvoiceLine, computeInvoiceTotals } from '../src/common/utils/tax';

describe('tax utility', () => {
  it('computes line and totals with cgst/sgst split', () => {
    const line = computeInvoiceLine({ quantity: 2, rate: 980, gstRate: 12 });
    expect(line.taxableValue).toBe(1960);
    expect(line.cgstAmount).toBe(117.6);
    expect(line.sgstAmount).toBe(117.6);

    const totals = computeInvoiceTotals([line], 0, 0);
    expect(totals.totalTaxAmount).toBe(235.2);
    expect(totals.totalAmount).toBe(2195.2);
  });
});
