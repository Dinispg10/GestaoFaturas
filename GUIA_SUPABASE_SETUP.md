# 🚀 Guia: Como Começar com Supabase

## Fase 1: Criar Conta Supabase (5 min)

### 1.1 Registar

1. Ir para https://supabase.com/auth/sign_up
2. Registar com email
3. Confirmar email

### 1.2 Criar Projeto

1. Dashboard > New Project
2. **Database Password**: Guardar num local seguro!
3. **Region**: Escolher mais perto (ex: Europe - Frankfurt)
4. Criar projeto (demora 2-3 min)

---

## Fase 2: Executar Schema SQL (5 min)

### 2.1 Abrir SQL Editor

1. Supabase Dashboard > SQL Editor
2. New Query

### 2.2 Copiar Schema

- Abrir [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- Copiar TODO o conteúdo SQL (de `-- Create users table` até final)
- Colar no SQL Editor

### 2.3 Executar

1. Clicar `Run` (Ctrl+Enter)
2. Esperar conclusão (deve dar verde)

**Resultado esperado**: 4 tabelas criadas (users, suppliers, invoices, invoice_events)

---

## Fase 3: Configurar Variáveis de Ambiente (3 min)

### 3.1 Obter Credenciais

1. Dashboard > Settings > API
2. Copiar:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 3.2 Criar .env.local

No projeto, copiar `.env.example` para `.env.local`:

```bash
# Windows
copy .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

### 3.3 Preencher Credenciais

Abrir `.env.local` e adicionar:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**: `.env.local` não commit no git! (já está em `.gitignore`)

---

## Fase 4: Criar Utilizador Teste (2 min)

### 4.1 Via Supabase Console

1. Dashboard > Authentication > Users
2. Add User
3. **Email**: `staff@test.com`
4. **Password**: `password123` (mínimo 6 caracteres)
5. Create User

### 4.2 Criar Registo do Utilizador (IMPORTANTE!)

O utilizador de Auth precisa ter registo na tabela `users`:

1. Dashboard > SQL Editor > New Query
2. Executar:

```sql
INSERT INTO public.users (id, email, name, role, active)
VALUES (
  'AUTH_USER_ID_AQUI',  -- SUBSTITUIR com ID real
  'staff@test.com',
  'Staff Test',
  'staff',
  true
);
```

**Como obter AUTH_USER_ID?**

1. Authentication > Users
2. Clicar no utilizador
3. Copiar `User ID`

---

## Fase 5: Testar Localmente (5 min)

### 5.1 Instalar Dependências

```bash
cd c:\Users\Utilizador\Desktop\projetos\GestaoFaturas
npm install
```

### 5.2 Dev Server

```bash
npm run dev
```

Abrir http://localhost:5173

### 5.3 Login

1. Email: `staff@test.com`
2. Senha: `password123`
3. Clicar Login

**Se funcionar**: Parabéns! ✅ Supabase está integrado!

---

## Fase 6: Testar Funcionalidades (10 min)

### 6.1 Criar Fornecedor

1. Menu > Fornecedores
2. - Novo Fornecedor
3. Preencher dados
4. Guardar

### 6.2 Criar Fatura

1. Menu > Faturas
2. - Nova Fatura
3. Selecionar fornecedor
4. Preencher dados
5. **Adicionar Documento** ← FileUpload com Supabase Storage
6. Submeter

### 6.3 Verificar Upload

1. Supabase Dashboard > Storage
2. Bucket "invoices"
3. Deve ver pasta com ficheiro!

---

## 📱 Testar Desktop (Tauri)

### 7.1 Build Desktop

```bash
npm run tauri dev
```

Abre aplicação desktop com Supabase integrado!

### 7.2 Build Production

```bash
npm run tauri build
```

Gera executável em `src-tauri/target/release/`

---

## ⚠️ Problemas Comuns

### "Cannot find module '../lib/supabase'"

**Solução**: Certificar que `.env.local` tem variáveis corretas

```bash
# Verificar
cat .env.local
```

### "Invalid JWT token"

**Solução**: Regenerar ANON_KEY do Supabase Console

### "User account not provisioned"

**Solução**: Criar registo em tabela `users` (Fase 4.2)

### "Storage bucket not found"

**Solução**: Supabase cria automaticamente, mas verificar em Storage > Buckets

---

## 🔐 Segurança em Produção

### Antes de Deploy:

1. ✅ Senhas fortes (não `password123`)
2. ✅ RLS policies ativas (já configuradas)
3. ✅ `.env.local` em `.gitignore` (não fazer push)
4. ✅ Usar VITE_SUPABASE_ANON_KEY (não Admin Key!)
5. ✅ SSL/HTTPS ativo

### Deploy:

1. Adicionar `VITE_SUPABASE_URL` em variáveis de ambiente do host
2. Adicionar `VITE_SUPABASE_ANON_KEY` em variáveis de ambiente do host
3. Build e deploy como normal

---

## 📞 Suporte

### Documentação

- Supabase Docs: https://supabase.com/docs
- JWT Auth: https://supabase.com/docs/guides/auth/auth-jwt
- Storage: https://supabase.com/docs/guides/storage

### Issues Comuns

- https://github.com/supabase/supabase/discussions

---

## ✅ Checklist

- [ ] Conta Supabase criada
- [ ] Schema SQL executado
- [ ] `.env.local` preenchido
- [ ] Utilizador teste criado
- [ ] Teste local com `npm run dev` funcionando
- [ ] Criar fornecedor funcionando
- [ ] Criar fatura com upload funcionando
- [ ] Storage bucket com ficheiros visíveis

**Se todos os checkboxes estão marcados**: Pronto para produção! 🚀

---

_Tempo estimado total: 30 minutos_
