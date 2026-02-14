-- Create profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null check (role in ('admin', 'employee')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Policies for profiles
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Admins can read all profiles"
  on profiles for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Create settings table
create table settings (
  id uuid primary key default gen_random_uuid(),
  tax_id text,
  bank_owner text,
  bank_name text,
  bank_iban text,
  bank_bic text,
  updated_at timestamptz default now()
);

alter table settings enable row level security;

create policy "Only admins can manage settings"
  on settings for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Create invoices table
create table invoices (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  issue_date date,
  service_date date,
  customer_name text,
  customer_address text,
  customer_phone text,
  payment_method text default 'Bar',
  anzahlung numeric default 0,
  items jsonb default '[]',
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table invoices enable row level security;

-- Policies for invoices
create policy "Employees can insert own invoices"
  on invoices for insert with check (auth.uid() = created_by);

create policy "Employees can select own invoices"
  on invoices for select using (auth.uid() = created_by);

create policy "Employees can update own drafts only"
  on invoices for update using (
    auth.uid() = created_by and status = 'draft'
  );

create policy "Admins can select all invoices"
  on invoices for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admins can update any invoice"
  on invoices for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admins can delete any invoice"
  on invoices for delete using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Create invoice_counters table
create table invoice_counters (
  month_key text primary key,
  counter int not null default 1,
  updated_at timestamptz default now()
);

alter table invoice_counters enable row level security;

create policy "Employees and admins can use counter"
  on invoice_counters for all using (auth.uid() is not null);

-- Create function for next invoice number
create or replace function next_invoice_number(p_issue_date date default current_date)
returns text as $$
declare
  month_key text;
  cnt int;
begin
  month_key := to_char(coalesce(p_issue_date, current_date), 'YYYY-MM');
  insert into invoice_counters (month_key, counter)
  values (month_key, 1)
  on conflict (month_key) do update
  set counter = invoice_counters.counter + 1, updated_at = now()
  returning counter into cnt;
  return month_key || '-' || lpad(cnt::text, 3, '0');
end;
$$ language plpgsql security definer;

-- Create trigger to auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, role)
  values (new.id, new.email, 'employee');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
