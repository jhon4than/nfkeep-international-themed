-- Adicionar campo phone à tabela users_public
ALTER TABLE users_public 
ADD COLUMN phone TEXT;

-- Criar índice para o campo phone (opcional, para consultas rápidas)
CREATE INDEX IF NOT EXISTS idx_users_public_phone ON users_public(phone);

-- Comentário para documentação
COMMENT ON COLUMN users_public.phone IS 'Número de telefone do usuário para notificações';