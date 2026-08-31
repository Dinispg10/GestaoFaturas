-- Normaliza os métodos de pagamento gravados antes da lista única
-- (src/utils/paymentMethods.ts). Correr no SQL Editor do Supabase.
--
-- Antes: a página de detalhe gravava 'Dinheiro' e o modal de pagamento
-- em massa gravava 'Numerário' para o mesmo método. A lista única passou
-- a usar 'Dinheiro'.

-- 1) Ver o que existe hoje, antes de alterar seja o que for.
SELECT payment_method, COUNT(*) AS total
FROM invoices
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY total DESC;

-- 2) Confirmadas as contagens acima, correr o UPDATE.
UPDATE invoices
SET payment_method = 'Dinheiro'
WHERE payment_method = 'Numerário';

-- 3) Confirmar que já não sobra nenhum termo fora da lista única.
SELECT payment_method, COUNT(*) AS total
FROM invoices
WHERE payment_method IS NOT NULL
  AND payment_method NOT IN (
    'Transferência Bancária',
    'Cheque',
    'Dinheiro',
    'Cartão',
    'Débito Direto',
    'Outro'
  )
GROUP BY payment_method;
