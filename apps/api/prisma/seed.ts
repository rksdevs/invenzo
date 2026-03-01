import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function main() {
  const passwordHash = await bcrypt.hash('Owner@123', 10);

  const tenant = await prisma.tenant.upsert({
    where: { gstin: '21AHUPS4406K1Z0' },
    update: {
      businessName: 'Muna Runa Cycle Store',
      address: 'Talcher, Angul, Odisha',
    },
    create: {
      businessName: 'Muna Runa Cycle Store',
      gstin: '21AHUPS4406K1Z0',
      address: 'Talcher, Angul, Odisha',
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'owner@demo.in',
      },
    },
    update: {
      name: 'Store Owner',
      passwordHash,
      role: 'OWNER',
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
    create: {
      tenantId: tenant.id,
      name: 'Store Owner',
      email: 'owner@demo.in',
      passwordHash,
      role: 'OWNER',
      isEmailVerified: true,
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { id: '8c8b3aa0-b4ec-49c7-a010-fb6bbd327001' },
    update: {
      tenantId: tenant.id,
      name: 'SEN CYCLE STORE',
      gstin: '21AHUPS4406K1Z0',
      address: 'Kanchan Bazar, Dhenkanal, Odisha',
      phone: '9437050000',
    },
    create: {
      id: '8c8b3aa0-b4ec-49c7-a010-fb6bbd327001',
      tenantId: tenant.id,
      name: 'SEN CYCLE STORE',
      gstin: '21AHUPS4406K1Z0',
      address: 'Kanchan Bazar, Dhenkanal, Odisha',
      phone: '9437050000',
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: '78f3d2d3-a2f1-47a4-bf5f-f98c3c48a001' },
    update: {
      tenantId: tenant.id,
      name: 'Walk-in Customer',
      phone: '9999999999',
    },
    create: {
      id: '78f3d2d3-a2f1-47a4-bf5f-f98c3c48a001',
      tenantId: tenant.id,
      name: 'Walk-in Customer',
      phone: '9999999999',
    },
  });

  const productSeeds = [
    { id: '27f1c5a1-cfcb-4245-b29d-21a8e4ef1001', name: 'HERO POPULAR DTS DID BICYCLE', hsnSac: '87120010', unit: 'NOS', price: 4580, gst: 12, threshold: 2 },
    { id: '27f1c5a1-cfcb-4245-b29d-21a8e4ef1002', name: 'BSA DIYA 20 CYCLE NYLO', hsnSac: '87120010', unit: 'NOS', price: 4213, gst: 12, threshold: 2 },
    { id: '27f1c5a1-cfcb-4245-b29d-21a8e4ef1003', name: 'V.V RIM SUPER 28x1.5', hsnSac: '87149210', unit: 'PCS', price: 130, gst: 12, threshold: 20 },
    { id: '27f1c5a1-cfcb-4245-b29d-21a8e4ef1004', name: 'PRG BRAKE CHIP H/T ZINC', hsnSac: '87149400', unit: 'UNIT', price: 450, gst: 12, threshold: 10 },
    { id: '27f1c5a1-cfcb-4245-b29d-21a8e4ef1005', name: 'ATSON CHANCOVER GRN', hsnSac: '87149190', unit: 'PCS', price: 34.25, gst: 12, threshold: 30 },
  ];

  for (const seed of productSeeds) {
    await prisma.product.upsert({
      where: { id: seed.id },
      update: {
        tenantId: tenant.id,
        name: seed.name,
        hsnSac: seed.hsnSac,
        unit: seed.unit,
        sellingPrice: seed.price,
        gstRate: seed.gst,
        lowStockThreshold: seed.threshold,
      },
      create: {
        id: seed.id,
        tenantId: tenant.id,
        name: seed.name,
        hsnSac: seed.hsnSac,
        unit: seed.unit,
        sellingPrice: seed.price,
        gstRate: seed.gst,
        lowStockThreshold: seed.threshold,
      },
    });
  }

  await prisma.stockMovement.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.purchaseItem.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.purchaseInvoice.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.salesItem.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.invoicePayment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.salesInvoice.deleteMany({ where: { tenantId: tenant.id } });

  const purchaseLines = [
    { productId: productSeeds[0].id, description: productSeeds[0].name, hsnSac: productSeeds[0].hsnSac, quantity: 4, rate: 3580, gstRate: 12 },
    { productId: productSeeds[1].id, description: productSeeds[1].name, hsnSac: productSeeds[1].hsnSac, quantity: 2, rate: 4213, gstRate: 12 },
    { productId: productSeeds[2].id, description: productSeeds[2].name, hsnSac: productSeeds[2].hsnSac, quantity: 20, rate: 130, gstRate: 12 },
    { productId: productSeeds[3].id, description: productSeeds[3].name, hsnSac: productSeeds[3].hsnSac, quantity: 2, rate: 450, gstRate: 12 },
    { productId: productSeeds[4].id, description: productSeeds[4].name, hsnSac: productSeeds[4].hsnSac, quantity: 36, rate: 34.25, gstRate: 12 },
  ];

  const computed = purchaseLines.map((line) => {
    const taxableValue = round2(line.quantity * line.rate);
    const cgstAmount = round2((taxableValue * line.gstRate) / 200);
    const sgstAmount = round2((taxableValue * line.gstRate) / 200);
    return {
      ...line,
      taxableValue,
      cgstAmount,
      sgstAmount,
      totalAmount: round2(taxableValue + cgstAmount + sgstAmount),
    };
  });

  const taxableValue = round2(computed.reduce((sum, item) => sum + item.taxableValue, 0));
  const cgstAmount = round2(computed.reduce((sum, item) => sum + item.cgstAmount, 0));
  const sgstAmount = round2(computed.reduce((sum, item) => sum + item.sgstAmount, 0));
  const totalTaxAmount = round2(cgstAmount + sgstAmount);
  const totalAmount = round2(taxableValue + totalTaxAmount - 0.07);

  const purchase = await prisma.purchaseInvoice.create({
    data: {
      tenantId: tenant.id,
      supplierId: supplier.id,
      invoiceNumber: 'SCS/0322/2023-24',
      invoiceDate: new Date('2023-10-28'),
      eWayBillNo: '891355427896',
      taxableValue,
      cgstAmount,
      sgstAmount,
      totalTaxAmount,
      roundOff: -0.07,
      totalAmount,
      amountInWords: 'INR Thirteen Thousand Five Hundred Eighty Four and Forty Eight paise Only',
      items: {
        create: computed.map((line) => ({
          tenantId: tenant.id,
          productId: line.productId,
          description: line.description,
          hsnSac: line.hsnSac,
          quantity: line.quantity,
          rate: line.rate,
          taxableValue: line.taxableValue,
          gstRate: line.gstRate,
          cgstAmount: line.cgstAmount,
          sgstAmount: line.sgstAmount,
          totalAmount: line.totalAmount,
        })),
      },
    },
  });

  await prisma.stockMovement.createMany({
    data: computed.map((line) => ({
      tenantId: tenant.id,
      productId: line.productId,
      type: 'PURCHASE',
      quantity: line.quantity,
      referenceType: 'purchase_invoice',
      referenceId: purchase.id,
    })),
  });

  const saleLine = {
    productId: productSeeds[2].id,
    quantity: 2,
    rate: 190,
    gstRate: 12,
  };
  const saleTaxable = round2(saleLine.quantity * saleLine.rate);
  const saleCgst = round2((saleTaxable * saleLine.gstRate) / 200);
  const saleSgst = round2((saleTaxable * saleLine.gstRate) / 200);
  const saleTotal = round2(saleTaxable + saleCgst + saleSgst);

  const sale = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      invoiceNumber: 'INV-1001',
      invoiceDate: new Date('2026-03-01T10:00:00.000Z'),
      taxableValue: saleTaxable,
      discountAmount: 0,
      cgstAmount: saleCgst,
      sgstAmount: saleSgst,
      totalTaxAmount: round2(saleCgst + saleSgst),
      roundOff: 0,
      totalAmount: saleTotal,
      isCredit: false,
      items: {
        create: {
          tenantId: tenant.id,
          productId: saleLine.productId,
          description: productSeeds[2].name,
          hsnSac: productSeeds[2].hsnSac,
          quantity: saleLine.quantity,
          rate: saleLine.rate,
          taxableValue: saleTaxable,
          gstRate: saleLine.gstRate,
          cgstAmount: saleCgst,
          sgstAmount: saleSgst,
          totalAmount: saleTotal,
        },
      },
      payments: {
        create: {
          tenantId: tenant.id,
          mode: 'UPI',
          amount: saleTotal,
          reference: 'UPI-REF-1001',
        },
      },
    },
  });

  await prisma.stockMovement.create({
    data: {
      tenantId: tenant.id,
      productId: saleLine.productId,
      type: 'SALE',
      quantity: -saleLine.quantity,
      referenceType: 'sales_invoice',
      referenceId: sale.id,
    },
  });

  console.log('Seed complete.');
  console.log('Admin login => owner@demo.in / Owner@123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
