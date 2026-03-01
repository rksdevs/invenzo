# Multi-Tenant POS - Architecture Document

## 1. Tech Stack

### Backend
- Node.js (NestJS recommended)
- PostgreSQL
- Prisma or TypeORM
- Redis (optional caching)

### Frontend
- Next.js
- React
- Tailwind CSS

### Storage
- S3 Compatible Storage (AWS S3 / DigitalOcean Spaces)

---

## 2. Multi-Tenant Strategy

### Approach: Shared DB, Shared Tables, tenant_id column

All core tables include:
- tenant_id (UUID)

JWT contains:
- user_id
- tenant_id
- role

---

## 3. Core Tables (Schema Pointers)

### tenants
- id
- business_name
- gstin
- subscription_plan

### users
- id
- tenant_id
- name
- email
- password_hash
- role

### products
- id
- tenant_id
- name
- hsn
- unit
- selling_price
- gst_rate

### suppliers
- id
- tenant_id
- name
- gstin

### purchase_invoices
- id
- tenant_id
- supplier_id
- invoice_number
- invoice_date
- total_amount

### purchase_items
- id
- tenant_id
- purchase_invoice_id
- product_id
- quantity
- rate
- gst_rate

### sales_invoices
- id
- tenant_id
- customer_id
- invoice_number
- total_amount

### sales_items
- id
- tenant_id
- sales_invoice_id
- product_id
- quantity
- rate

### stock_movements
- id
- tenant_id
- product_id
- type
- quantity
- reference_type
- reference_id

---

## 4. Stock Calculation Strategy

Current stock = SUM(quantity) GROUP BY product_id

Never directly mutate stock.

---

## 5. Row Level Security (RLS)

PostgreSQL RLS policy:

CREATE POLICY tenant_isolation ON products
USING (tenant_id = current_setting('app.current_tenant')::uuid);

Tenant ID set per request.

---

## 6. Security

- Password hashing (bcrypt)
- JWT authentication
- Role-based authorization
- File upload validation
- Audit logs
- Encrypted backups

---

## 7. Deployment

- Dockerized services
- Nginx reverse proxy
- CI/CD pipeline
- Daily DB backup

---

## 8. Scalability

- Horizontal scaling via stateless backend
- Read replicas for reporting
- Background jobs for OCR

---

## 9. Future Extensions

- Payment gateway integration
- SaaS subscription billing
- Mobile POS app

---

Architecture supports secure multi-tenant SaaS growth.

