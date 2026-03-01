# Multi-Tenant GST POS & Inventory System

## 1. Vision
A multi-tenant SaaS POS and Inventory Management System designed for Indian retail SMBs (starting with bicycle & spare parts stores).

The system digitizes:
- Purchase registers (wholeseller invoices)
- Sales registers (customer billing)
- Inventory stock registers
- GST-compliant billing (CGST/SGST)

Manual registers will be migrated as a one-time setup.

---

## 2. Target Business Model
- Shop owners create account
- Each shop = One Tenant
- Tenant fully isolated from others
- Subscription-ready SaaS architecture

---

## 3. Core Business Modules

### 3.1 Tenant Management
- Business profile
- GSTIN
- Address
- Subscription plan
- User management

### 3.2 User Roles
- Owner
- Cashier
- Accountant
- Admin (Platform level)

---

## 4. Purchase Management (Based on Shared Invoice Screenshots)

### Features:
- Create Purchase Invoice
- Upload Supplier GST Invoice (PDF/Image)
- QR Code decoding (for e-invoice IRN)
- Manual line item editing
- GST auto-calculation
- Store supplier GSTIN
- Maintain purchase register

### Captured Data:
- Invoice Number
- Invoice Date
- Supplier GSTIN
- HSN Code
- Quantity
- Rate
- Amount
- CGST
- SGST
- Total
- Round Off

---

## 5. Sales POS

### Features:
- Fast product search
- Barcode support (future phase)
- GST auto calculation
- Discount support
- Print GST invoice
- Credit sale tracking
- Stock auto deduction

---

## 6. Inventory System

Inventory based on stock movements (not static quantity).

### Stock Movement Types:
- Purchase (+)
- Sale (-)
- Adjustment (+/-)
- Credit Note

### Capabilities:
- Real-time stock
- Low stock alerts
- Unit standardization (PCS/NOS/SET/PRS)
- Supplier traceability (which purchase bill stock came from)

---

## 7. Reports
- Purchase Register
- Sales Register
- GST Summary
- Profit & Margin Report
- Stock Valuation
- Supplier Ledger
- Customer Ledger

---

## 8. One-Time Migration Plan

Manual register migration:
- Enter opening stock
- Enter pending credit balances
- Ignore old history beyond start date

---

## 9. Future Enhancements
- OCR automation
- AI product normalization
- Multi-store support
- Mobile app
- SaaS billing system

---

## 10. SaaS Readiness
- Multi-tenant architecture
- Subscription plans
- Role-based access
- Secure authentication

---

This system can scale from single shop to multi-location SMB chains.

