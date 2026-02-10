-- ============================================================================
-- MIGRATION SUPABASE - Simplificar Invoices (Remover Aprovações)
-- ============================================================================
-- Execute os comandos abaixo no SQL Editor do Supabase

-- 1. Remover colunas de aprovação da tabela invoices
ALTER TABLE invoices 
DROP COLUMN IF EXISTS approval_decided_by,
DROP COLUMN IF EXISTS approval_decided_at,
DROP COLUMN IF EXISTS approval_reject_reason;

-- 2. Remover coluna de arquivo (vamos guardar apenas a URL na coluna attachment_url)
-- A coluna attachment_url já está lá, podemos remover se houver arquivo completo
ALTER TABLE invoices 
DROP COLUMN IF EXISTS attachment_file;

-- 3. Atualizar status constraint - remover 'approved' e 'rejected'
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'submitted', 'paid'));

-- 4. Remover coluna payment_paid_by (não precisamos de rastrear quem marcou como pago)
ALTER TABLE invoices 
DROP COLUMN IF EXISTS payment_paid_by;

-- 5. Verificar e exibir estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;

-- ============================================================================
-- RESUMO DAS ALTERAÇÕES:
-- ✓ Removido: approval_decided_by, approval_decided_at, approval_reject_reason
-- ✓ Mantido: payment_paid_at, payment_method, payment_amount_paid
-- ✓ Mantido: attachment_url (para guardar apenas o URL)
-- ✓ Atualizado: status constraint (draft, submitted, paid apenas)
-- ✓ Status simplificados: 'draft', 'submitted', 'paid' (sem approved/rejected)
-- ============================================================================
