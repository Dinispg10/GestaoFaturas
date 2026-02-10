# Farmácia Pinto – Registo de Faturas de Compra

Aplicação desktop (Windows) para gestão de faturas de compra, construída com Tauri, React, TypeScript e Firebase.

## Características

- 🔐 **Autenticação**: Email/password via Firebase Authentication
- 📋 **Gestão de Faturas**: Criar, editar, submeter e aprovar faturas de compra
- 👥 **Gestão de Fornecedores**: CRUD de fornecedores
- ✅ **Fluxo de Aprovação**: Staff submete, Manager aprova/rejeita
- 💳 **Rastreamento de Pagamentos**: Marcar faturas como pagas
- 📊 **Auditoria**: Histórico completo de eventos para cada fatura
- 🔒 **Controlo de Acesso**: Baseado em roles (staff/manager)
- 📁 **Upload de Ficheiros**: Anexos em PDF/Imagens no Firebase Storage

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Tauri 2
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: CSS puro (sem frameworks pesados)
- **Roteamento**: React Router v6

## Pré-Requisitos

- Node.js 18+
- npm ou yarn
- Git
- Windows 10+ (para build de desktop)
- Conta Firebase com projeto criado

## Setup Inicial

### 1. Clonar o Repositório

```bash
git clone <repository-url>
cd GestaoFaturas
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Firebase

1. **Copiar arquivo de exemplo**:

   ```bash
   cp .env.example .env.local
   ```

2. **Preencher credenciais Firebase**:

   Abrir `.env.local` e adicionar as suas credenciais do Firebase:

   ```env
   VITE_FIREBASE_API_KEY=sua_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   ```

   Para obter estas credenciais:
   - Ir a [Firebase Console](https://console.firebase.google.com)
   - Selecionar seu projeto
   - Ir a "Project Settings" > "General"
   - Scroll para "Your apps"
   - Copiar as credenciais da configuração web

### 4. Configurar Firebase (Console)

#### Autenticação

- Ir para "Authentication" > "Sign-in method"
- Ativar "Email/Password"

#### Firestore

- Ir para "Firestore Database"
- Criar database em modo "production"
- Depois de criado, selecionar "Rules" e copiar conteúdo de `firestore.rules` (ver secção "Regras de Segurança")

#### Storage

- Ir para "Storage"
- Criar novo bucket
- Ir a "Rules" e copiar conteúdo de `storage.rules`

#### Criar Utilizadores de Teste

Via Firebase Console ou programaticamente:

1. Authentication > Users
2. Add user
3. Email: test@example.com, Password: password123

Depois, em Firestore, criar documento:

- Coleção: `users`
- Documento ID: `<uid do utilizador criado>`
- Conteúdo:
  ```json
  {
    "name": "João Silva",
    "role": "manager",
    "active": true
  }
  ```

Para staff:

```json
{
  "name": "Maria Santos",
  "role": "staff",
  "active": true
}
```

## Desenvolvimento

### Executar em Desenvolvimento

```bash
npm run tauri dev
```

Isto:

- Inicia servidor Vite em http://localhost:5173
- Abre janela Tauri desktop
- Ativa hot reload

### Build para Produção

```bash
npm run tauri build
```

Isto cria:

- Instalador Windows (.msi)
- Executável portável (.exe)
- Em `src-tauri/target/release/`

### Build Frontend Apenas

```bash
npm run build
```

## Funcionalidades MVP

### 1. Login

- Email/password
- Validação contra Firebase Auth
- Carregamento de perfil do Firestore
- Mensagens de erro claras

### 2. Página de Faturas

- Tabela com: Fornecedor, Nº Fatura, Data, Vencimento, Total, Estado, Criado por, Atualizado em
- Filtros: Estado, Pesquisa (Nº/Fornecedor)
- Marcar vencidas automaticamente
- Botão "Nova Fatura"

### 3. Formulário de Fatura

- Seleção de fornecedor
- Nº, Data, Vencimento
- Totais: Líquido, IVA, Bruto
- Upload de anexo (PDF/Imagem, max 20MB)
- Notas
- Botões: "Guardar como Rascunho" e "Submeter"
- Validação de duplicados
- Edição apenas se draft/submitted

### 4. Detalhe de Fatura

- Visualização de todos os campos
- Link para abrir documento
- Histórico de eventos (auditoria)
- Ações (staff: editar; manager: aprovar/rejeitar/pagar)
- Modal de rejeição com motivo obrigatório
- Modal de pagamento com método e valor

### 5. Fornecedores

- CRUD simples
- Listar, criar, editar
- Status ativo/inativo
- Validação de NIF duplicado

### 6. Admin (Placeholder)

- Menu disponível apenas para managers
- Base para funcionalidades futuras (gestão de utilizadores, etc.)

## Permissões por Role

### Staff

- ✅ Ver todas as faturas
- ✅ Criar nova fatura (status: draft)
- ✅ Submeter fatura (status: submitted)
- ✅ Editar fatura enquanto draft/submitted
- ❌ Aprovar/rejeitar
- ❌ Marcar como paga
- ❌ Alterar status manualmente

### Manager

- ✅ Ver todas as faturas
- ✅ Criar/editar qualquer fatura
- ✅ Aprovar fatura (status: approved)
- ✅ Rejeitar fatura (status: rejected + motivo)
- ✅ Marcar como paga (status: paid)
- ✅ Acesso a Admin

## Modelo de Dados Firestore

### `users/{uid}`

```typescript
{
  name: string;
  email: string;
  role: "staff" | "manager";
  active: boolean;
}
```

### `suppliers/{supplierId}`

```typescript
{
  name: string;
  nif: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: Timestamp;
}
```

### `invoices/{invoiceId}`

```typescript
{
  supplierId: string;
  supplierNameSnapshot: string;
  invoiceNumber: string;
  invoiceDate: Timestamp;
  dueDate: Timestamp;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  attachment: {
    storagePath: string;
    url: string;
    contentType: string;
    fileName: string;
    size: number;
  };
  notes: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approval?: {
    decidedBy: string;
    decidedAt: Timestamp;
    rejectReason?: string;
  };
  payment?: {
    paidBy: string;
    paidAt: Timestamp;
    method: string;
    amountPaid: number;
    proof?: Attachment | null;
  };
}
```

### `invoice_events/{eventId}`

```typescript
{
  invoiceId: string;
  type: "CREATED" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID" | "UPDATED";
  by: string;
  at: Timestamp;
  details: Record<string, any>;
}
```

## Regras de Segurança

### Firestore (`firestore.rules`)

- Utilizadores: Leitura/escrita apenas do seu próprio doc
- Fornecedores: Leitura pública (auth required), escrita apenas managers
- Faturas: Leitura pública (auth required)
  - Staff: Criar/editar apenas draft/submitted do próprio
  - Manager: Criar/editar qualquer uma
- Events: Leitura pública (auth required), criar apenas servidor

### Storage (`storage.rules`)

- Anexos: Leitura/escrita autenticada, max 20MB
- Comprovativo: Leitura/escrita autenticada, max 20MB

## Estrutura de Pastas

```
src/
├── components/
│   ├── Button.tsx              # Componente botão reutilizável
│   ├── DataTable.tsx           # Tabela de dados
│   ├── FileUpload.tsx          # Upload de ficheiros
│   ├── FilterBar.tsx           # Barra de filtros
│   ├── Layout.tsx              # Layout principal
│   ├── Modal.tsx               # Modal genérico
│   ├── RequireAuth.tsx         # Guard de autenticação
│   ├── Router.tsx              # Configuração de rotas
│   └── styles.css
├── context/
│   └── AuthContext.tsx         # Contexto de autenticação
├── features/
│   ├── invoices/
│   │   └── invoiceService.ts   # Operações de faturas
│   └── suppliers/
│       └── supplierService.ts  # Operações de fornecedores
├── hooks/
│   └── useUser.ts              # Hooks customizados
├── lib/
│   └── firebase.ts             # Configuração Firebase
├── pages/
│   ├── AdminPage.tsx
│   ├── InvoiceDetailPage.tsx
│   ├── InvoiceFormPage.tsx
│   ├── InvoicesPage.tsx
│   ├── LoginPage.tsx
│   ├── NotFoundPage.tsx
│   └── SuppliersPage.tsx
├── styles/
│   └── global.css              # Estilos globais
├── types/
│   └── index.ts                # Tipos TypeScript
├── utils/
│   └── fileUploadService.ts    # Upload de ficheiros
├── App.tsx                      # Componente raiz
└── main.tsx                     # Entry point
```

## Troubleshooting

### "Conta não provisionada"

- Verificar que o documento `users/{uid}` existe no Firestore
- Verificar que tem campos `name`, `role`, `active`

### Firebase credentials inválidas

- Verificar `.env.local` tem todos os campos preenchidos
- Reconfirmar credenciais em Firebase Console
- Reiniciar servidor Tauri após alterar `.env.local`

### Ficheiro muito grande

- Limite: 20MB
- Converter imagens para PNG/WebP antes de upload

### Erro de acesso negado no Firestore

- Verificar regras de segurança estão corretas
- Se em production, usar `firestore.rules` e `storage.rules` fornecidos
- Se em test mode, usar apenas para desenvolvimento local

## Desenvolvimento Futuro

- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Gestão de utilizadores na interface
- [ ] Dashboard com estatísticas
- [ ] Notificações em tempo real
- [ ] Sincronização offline
- [ ] Backup automático
- [ ] Logs detalhados
- [ ] Temas (light/dark)

## Suporte

Para problemas ou sugestões, contactar:

- Email: dev@farmaciapinto.pt
- Docs: [Tauri Docs](https://tauri.app) | [Firebase Docs](https://firebase.google.com/docs)

## Licença

Proprietary © 2026 Farmácia Pinto
