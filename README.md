# Qalin Sara Invoice Generator - React + Supabase

A modern invoice generation system with role-based access control for carpet selling business.

## Features

### Employee Features
- Create invoices with customer details and line items
- Calculate totals automatically (Fläche × €/m²)
- Generate PDF invoices
- Submit invoices (locked after submission)
- Auto-save drafts

### Admin Features
- View all invoices from all employees
- Edit any invoice (including submitted ones)
- Delete invoices
- Dashboard with statistics
- Manage company settings (tax ID, bank details)

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **PDF**: pdfmake
- **Routing**: React Router v6

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account ([supabase.com](https://supabase.com))

### 2. Clone and Install

```bash
cd Qalin-Sara-Invoice-Generator
npm install
```

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings → API

### 4. Configure Environment

Create `.env` file:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run Database Migrations

In Supabase Dashboard:
1. Go to SQL Editor
2. Copy content from `supabase/migrations/001_initial_schema.sql`
3. Run the migration

This creates:
- `profiles` table (user roles)
- `settings` table (company settings)
- `invoices` table (invoice data)
- `invoice_counters` table (auto-numbering)
- RLS policies
- Triggers for auto-profile creation

### 6. Create Admin User

After migration:
1. Sign up via the app (creates employee by default)
2. In Supabase Dashboard → Table Editor → `profiles`
3. Find your user and change `role` from `employee` to `admin`

### 7. Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── ProtectedRoute.jsx
│   └── AdminRoute.jsx
├── contexts/          # React contexts
│   └── AuthContext.jsx
├── hooks/             # Custom hooks
│   ├── useInvoiceForm.js
│   ├── usePdfExport.js
│   └── useSettings.js
├── layouts/           # Layout components
│   ├── EmployeeLayout.jsx
│   └── AdminLayout.jsx
├── lib/               # Third-party setup
│   └── supabase.js
├── pages/             # Page components
│   ├── LoginPage.jsx
│   ├── InvoicePage.jsx
│   ├── DashboardPage.jsx
│   ├── InvoicesListPage.jsx
│   ├── InvoiceEditPage.jsx
│   └── SettingsPage.jsx
├── utils/             # Utilities
│   └── invoiceNumber.js
├── App.jsx            # Main app with routing
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## User Roles

| Role | Access |
|------|--------|
| **Employee** | Invoice form only; submit invoices; cannot edit after submit |
| **Admin** | Full dashboard; view/edit/delete all invoices; manage settings |

## Invoice Workflow

### Employee
1. Log in → redirected to invoice form
2. Fill customer details and items
3. Generate PDF for customer
4. Submit invoice → status changes to "submitted"
5. Cannot edit or delete after submit

### Admin
1. Log in → redirected to dashboard
2. View stats and recent invoices
3. Browse all invoices (filter by status)
4. Edit any invoice (draft or submitted)
5. Delete invoices
6. Manage company settings

## Database Schema

### profiles
- `id` (uuid, FK to auth.users)
- `email` (text)
- `role` (admin | employee)

### settings
- `id` (uuid)
- `tax_id` (text)
- `bank_owner`, `bank_name`, `bank_iban`, `bank_bic` (text)

### invoices
- `id` (uuid)
- `created_by` (uuid, FK to auth.users)
- `invoice_number` (text)
- `issue_date`, `service_date` (date)
- `customer_name`, `customer_address`, `customer_phone` (text)
- `payment_method` (Bar | Überweisung)
- `anzahlung` (numeric)
- `items` (jsonb array)
- `status` (draft | submitted)

### invoice_counters
- `month_key` (YYYY-MM, PK)
- `counter` (int)

## Invoice Numbering

Format: `YYYY-MM-XXX`
- Auto-increments per month
- Global counter (not per-user)
- Example: `2025-02-001`, `2025-02-002`, etc.

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel/Netlify

1. Connect your Git repository
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build command: `npm run build`
4. Output directory: `dist`

## Security

- Row Level Security (RLS) enforced on all tables
- Employees can only access their own invoices
- Employees cannot edit submitted invoices
- Only admins can edit/delete any invoice
- Only admins can manage settings

## Troubleshooting

### "Supabase credentials not found"
- Ensure `.env` file exists with correct credentials
- Restart dev server after creating `.env`

### "Could not read profile"
- Run the migration script
- Ensure trigger `on_auth_user_created` is active

### "User is not admin"
- Update `role` in `profiles` table to `admin` via Supabase Dashboard

### Invoice numbering not working
- Ensure `next_invoice_number` function is created
- Check `invoice_counters` table exists

## License

Proprietary - Qalin Sara

## Support

For issues or questions, contact the development team.
