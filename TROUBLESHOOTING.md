# 🔧 Troubleshooting - Problemas e Soluções

## 1. Erros de Compilação

### Erro: "Cannot find module '@supabase/supabase-js'"

```
error TS2307: Cannot find module '@supabase/supabase-js'
```

**Causa**: Package não instalado

**Solução**:

```bash
npm install @supabase/supabase-js
```

---

### Erro: "Cannot find module '../lib/supabase'"

```
error TS2307: Cannot find module '../../lib/supabase'
```

**Causa**: Ficheiro `src/lib/supabase.ts` não existe

**Solução**:

1. Verificar se ficheiro existe:

```bash
ls src/lib/supabase.ts  # Mac/Linux
dir src\lib\supabase.ts # Windows
```

2. Se não existir, criar manualmente:

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 2. Erros de Runtime

### "Missing Supabase environment variables"

```
Error: Missing Supabase environment variables.
Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

**Causa**: `.env.local` não preenchido ou não detectado

**Solução**:

1. Criar/Verificar `.env.local`:

```bash
# Criar se não existir
cp .env.example .env.local

# Verificar conteúdo
cat .env.local  # Mac/Linux
type .env.local # Windows
```

2. Preencher valores corretos (sem quotes):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **IMPORTANTE**: Ficheiro deve estar na raiz do projeto:

```
GestaoFaturas/
├── .env.local ← AQUI
├── src/
├── package.json
└── ...
```

4. Reiniciar dev server:

```bash
npm run dev
```

---

### "Invalid JWT token"

```
Error: Invalid JWT token
```

**Causa**: ANON_KEY incorreto ou expirado

**Solução**:

1. Copiar novo valor do Supabase:
   - Dashboard > Settings > API > `anon public`
2. Atualizar `.env.local`
3. Reiniciar servidor

---

### "Supabase URL is invalid"

```
Error: Supabase URL is invalid
```

**Causa**: URL mal formatado

**Verificar**:

```env
✅ Correto:   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
❌ Errado:    VITE_SUPABASE_URL=xxxxxxxxxxxxx.supabase.co
❌ Errado:    VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co/
```

**Solução**: Remover `https://` no início e `/` no final se existirem

---

## 3. Problemas de Autenticação

### "User account not provisioned"

Ao fazer login:

```
Erro: Conta não provisionada
```

**Causa**: Utilizador existe em Auth mas não em tabela `users`

**Solução**:

1. Supabase Console > SQL Editor > New Query
2. Executar:

```sql
-- Encontrar ID do utilizador
SELECT id, email FROM auth.users;

-- Copiar o ID e executar:
INSERT INTO public.users (id, email, name, role, active)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- ID copiado acima
  'seu@email.com',
  'Seu Nome',
  'staff',
  true
);
```

---

### "Utilizador não consegue fazer login"

Botão de login não faz nada

**Causas possíveis**:

#### 1. Auth.users não tem email

**Solução**: Criar utilizador via Supabase Console (não com INSERT direto)

#### 2. Palavra-passe incorreta

**Verificar**:

- Mínimo 6 caracteres
- Email correto

#### 3. Utilizador não ativo

**Verificar** em tabela `users`:

```sql
SELECT email, active FROM public.users WHERE email = 'seu@email.com';
```

Se `active = false`, atualizar:

```sql
UPDATE public.users SET active = true
WHERE email = 'seu@email.com';
```

---

## 4. Problemas de Database

### "Error: relation 'public.invoices' does not exist"

```
PostgresError: Relation "public.invoices" does not exist
```

**Causa**: Schema SQL não foi executado

**Solução**:

1. Ir a [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
2. Copiar TODO o SQL
3. Supabase Console > SQL Editor > New Query
4. Colar e executar (Ctrl+Enter)

---

### "RLS policy violation"

```
Error: new row violates row-level security policy
```

**Causa**: RLS policies restringindo acesso

**Debug**:

1. Supabase Console > Database > Policies
2. Verificar se policies estão corretas
3. Para dev/test, desabilitar RLS (CUIDADO!):

```sql
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
```

**Re-ativar em produção:**

```sql
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
```

---

## 5. Problemas de Storage

### "Storage bucket not found"

Ao fazer upload:

```
Error: Storage bucket not found
```

**Solução**:

1. Supabase Console > Storage
2. Create Bucket
3. Nome: `invoices`
4. Deixar como Public (se quiser URLs públicas)

---

### "File upload failed"

Ficheiro > 20MB ou tipo não permitido

**Causa possível**:

```
❌ MP4, ZIP, DOC (tipo não permitido)
✅ PDF, JPG, PNG, WebP (permitido)
```

**Verificar tamanho**:

```bash
# Mac/Linux
ls -lh documento.pdf

# Windows
dir documento.pdf
```

---

### "Cannot access uploaded file"

Ficheiro enviado mas link 404

**Causa**: Bucket privado ou URL incorreta

**Solução**:

1. Verificar bucket é público:
   - Supabase > Storage > Selecionar bucket > Edit
   - Marcar "Public bucket"
2. Ou gerar URL com token:

```typescript
const { data } = supabase.storage.from("invoices").createSignedUrl(path, 3600); // 1 hora validade
```

---

## 6. Problemas de Upload/FileUpload

### "FileUpload component não aparece"

Componente não renderiza no formulário

**Verificar**:

1. Import correto:

```typescript
import { FileUpload } from "../components/FileUpload";
```

2. Componente usado corretamente:

```tsx
<FileUpload
  onFileSelected={(file) => setInvoice({ ...invoice, attachment: file })}
  onError={(error) => setErrors([...errors, error])}
/>
```

---

### "validateFile() retorna error object, não string"

```typescript
// ❌ Errado
const error = supabaseUploadService.validateFile(file);
if (error) { ... } // error é object, não string!

// ✅ Correto
const result = supabaseUploadService.validateFile(file);
if (!result.valid) {
  const errorMsg = result.error || 'Ficheiro inválido';
  onError?.(errorMsg);
}
```

---

## 7. Problemas de Performance

### "Aplicação lenta ao listar faturas"

getAllInvoices() demora muito tempo

**Soluções**:

1. Verificar índices criados:

```sql
-- Listar índices
SELECT * FROM pg_stat_user_indexes;
```

2. Se faltam, criar:

```sql
CREATE INDEX idx_invoices_created_by ON invoices(created_by);
CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

3. Usar paginação:

```typescript
const { data } = await supabase.from("invoices").select("*").range(0, 49); // Primeiros 50
```

---

## 8. Problemas de Tipos

### "Property 'attachment' does not exist"

```
error TS2551: Property 'attachment' does not exist on type 'Invoice'
```

**Causa**: Type não atualizado em `types/index.ts`

**Solução**: Verificar `types/index.ts`:

```typescript
export interface Invoice {
  // ...
  attachment?: FileAttachment; // Deve existir
}

export interface FileAttachment {
  url: string;
  fileName: string;
  size: number;
  storagePath: string;
}
```

---

### "Cannot assign type FileAttachment to Partial<Invoice>"

Ao adicionar ficheiro ao invoice

**Solução**:

```typescript
// ✅ Correto
setInvoice({
  ...invoice,
  attachment: file, // file é FileAttachment
});
```

---

## 9. Problemas de CORS

### "Access to fetch blocked by CORS policy"

```
Access to XMLHttpRequest blocked by CORS policy
```

**Causa**: Storage bucket privado

**Solução**:

1. Supabase > Storage > Bucket > Edit
2. Marcar "Public bucket"

---

## 10. Debug Mode

### Ver queries SQL reais

```typescript
// No AuthContext ou serviço
const { data, error } = await supabase.from("invoices").select("*");

console.log("SQL Query:", data); // Dados retornados
console.log("SQL Error:", error); // Erro se houver
```

---

### Ver requests Supabase

1. Browser DevTools > Network
2. Procurar requests para `supabase.co`
3. Response tab mostra dados JSON

---

## 11. Clean Install

Se nada funciona, tentar clean install:

```bash
# 1. Remover node_modules e lock
rm -rf node_modules package-lock.json

# 2. Limpar cache
npm cache clean --force

# 3. Reinstalar
npm install

# 4. Build test
npm run build

# 5. Dev test
npm run dev
```

---

## ✅ Checklist Debug

Quando algo não funciona:

1. [ ] npm install executado?
2. [ ] .env.local existe e preenchido?
3. [ ] Schema SQL executado em Supabase?
4. [ ] Utilizador teste criado em Auth + users table?
5. [ ] Browser DevTools > Console mostra erros?
6. [ ] Verificar Network tab para requests?
7. [ ] Supabase dashboard mostra dados criados?
8. [ ] Compilação (npm run build) sucede sem erros?

---

## 📞 Mais Ajuda

### Ver Logs Supabase

1. Dashboard > Logs > API
2. Procurar requests recentes
3. Ver status code e mensagem

### Testar Manualmente com cURL

```bash
# Auth test
curl -X GET https://xxxxxxxxxxxxx.supabase.co/auth/v1/user \
  -H "Authorization: Bearer SEU_TOKEN"

# Database test
curl -X GET https://xxxxxxxxxxxxx.supabase.co/rest/v1/users \
  -H "Authorization: Bearer ANON_KEY"
```

### Comunidade

- Supabase GitHub Discussions
- StackOverflow tag `supabase`
- Discord Supabase

---

_Última atualização: Guia completo para troubleshooting_
