-- Enable tenant setting and RLS policies.
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalesInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalesItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryAdjustment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoicePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerLedgerEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FileAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT unnest(ARRAY[
      'Product', 'Supplier', 'Customer', 'PurchaseInvoice', 'PurchaseItem', 'SalesInvoice',
      'SalesItem', 'StockMovement', 'InventoryAdjustment', 'InvoicePayment',
      'CustomerLedgerEntry', 'FileAttachment', 'AuditLog', 'Session', 'User'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON "%s"', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON "%s" USING ("tenantId" = current_setting(''app.current_tenant'', true)::uuid)',
      table_name
    );
  END LOOP;
END $$;
