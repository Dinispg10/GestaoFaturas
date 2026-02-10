# 🚀 GUIA SETUP SUPABASE (5 MINUTOS)

## 1️⃣ Crie Conta Supabase

```
1. Aceda a https://supabase.com
2. Clique "Start your project"
3. Sign up com GitHub ou email
4. Confirme email
```

## 2️⃣ Crie Projeto

```
1. Dashboard > New Project
2. Nome: "gestao-faturas"
3. Database Password: (anote!)
4. Region: "eu-west-1" (Europe - Portugal/Ireland)
5. Aguarde ~2 min (cria PostgreSQL)
```

## 3️⃣ Copie Credenciais

Menu > Settings > API:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxx...
```

## 4️⃣ Enable Supabase Auth

Menu > Authentication > Providers:

```
✅ Enable Email auth
✅ Confirm email: OFF (para testes rápidos)
```

## 5️⃣ SQL Schema (Copiar-Colar)

Editor SQL > New Query > Copie isto:

```sql
-- Users (estendido com role)
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  email text not null unique,
  role text check (role in ('staff', 'manager')) default 'staff',
  active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Suppliers
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nif text not null unique,
  email text not null,
  phone text not null,
  active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers on delete cascade,
  supplier_name_snapshot text not null,
  invoice_number text not null,
  invoice_date date not null,
  due_date date not null,
  total_net decimal(10,2) not null,
  total_vat decimal(10,2) not null,
  total_gross decimal(10,2) not null,
  status text check (status in ('draft', 'submitted', 'approved', 'rejected', 'paid')) default 'draft',
  attachment_url text,
  notes text,
  created_by uuid not null references public.users on delete set null,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  approval_decided_by uuid,
  approval_decided_at timestamp,
  approval_reject_reason text,
  payment_paid_by uuid,
  payment_paid_at timestamp,
  payment_method text,
  payment_amount_paid decimal(10,2),
  unique(supplier_id, invoice_number)
);

-- Invoice Events (audit)
create table public.invoice_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices on delete cascade,
  type text check (type in ('CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'UPDATED')),
  by_user_id uuid not null references public.users on delete set null,
  created_at timestamp default now(),
  details jsonb default '{}'::jsonb
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.suppliers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_events enable row level security;

-- Políticas de Acesso
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can view all suppliers"
  on public.suppliers for select
  using (true);

create policy "Staff can insert suppliers"
  on public.suppliers for insert
  with check (true);

create policy "Managers can update suppliers"
  on public.suppliers for update
  using ((select role from public.users where id = auth.uid()) = 'manager');

create policy "Users can view all invoices"
  on public.invoices for select
  using (true);

create policy "Users can create invoices"
  on public.invoices for insert
  with check (created_by = auth.uid());

create policy "Managers can update any invoice"
  on public.invoices for update
  using ((select role from public.users where id = auth.uid()) = 'manager');

create policy "Users can view events"
  on public.invoice_events for select
  using (true);

create policy "System can insert events"
  on public.invoice_events for insert
  with check (true);
```

Execute > ✅ Done!

## 6️⃣ Enable Storage

Menu > Storage > Create Bucket:

```
Name: "invoices"
Public: OFF (private)
File size limit: 20MB
```

Click > Create > Policies > Add policy:

```sql
-- Qualquer um autenticado consegue upload
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'invoices'
    and auth.role() = 'authenticated'
  );

-- Consegue ler ficheiros seus
create policy "Users can read own files"
  on storage.objects for select
  using (
    bucket_id = 'invoices'
    and auth.role() = 'authenticated'
  );
```

## 7️⃣ Crie Utilizador Teste

Menu > Authentication > Users > Add user:

```
Email: staff@test.com
Password: password123
Email confirmed: ✅ (tick)
```

Depois na tabela users (SQL):

```sql
insert into public.users (id, name, email, role, active)
select id, 'Staff User', email, 'staff', true
from auth.users
where email = 'staff@test.com';
```

---

## 📋 Estratégia de Armazenamento (IMPORTANTE!)

### Dados vs Ficheiros

```
✅ Dados da Fatura (Permanentes):
   - invoice_number, invoice_date, due_date
   - Totais (net, vat, gross)
   - Status, approval, payment
   - Estes NUNCA são apagados
   - Ficam para sempre na tabela invoices

❌ Ficheiros (Temporários - 6 meses):
   - Attachments (PDFs, imagens)
   - Guardados em Storage
   - Apagados após 6 meses (economia)
   - attachment_url fica NULL, mas fatura completa permanece
```

### Limpeza Automática (Opcional)

Para apagar ficheiros com > 6 meses, criar function em Supabase:

```sql
-- Function: Limpar attachments antigos
CREATE OR REPLACE FUNCTION cleanup_old_attachments()
RETURNS void AS $$
BEGIN
  -- Apagar ficheiros de faturas com > 6 meses
  DELETE FROM storage.objects
  WHERE bucket_id = 'invoices'
    AND created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Schedulador: Executar 1x por mês (1º dia)
-- Ir a Database > Webhooks > New webhook
-- ou usar pg_cron extension se disponível
```

---

## ✅ Pronto!

Tem:

- ✅ PostgreSQL database
- ✅ Auth (Email/Password)
- ✅ Storage para ficheiros (5MB max, 6 meses retenção)
- ✅ RLS policies (segurança)
- ✅ Utilizador teste
- ✅ Estratégia de arquivo: Dados eternos + Ficheiros temporários

Copie credenciais para `.env.local` e estamos prontos! 🚀

---

**PRÓXIMO PASSO**: Executar `npm run dev`
