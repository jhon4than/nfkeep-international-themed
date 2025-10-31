-- Garantir que todas as colunas necessárias existam na tabela users_public
-- Esta migração é idempotente e pode ser executada múltiplas vezes

DO $$
BEGIN
    -- Verificar e adicionar coluna notifications_enabled se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users_public' 
        AND column_name = 'notifications_enabled'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users_public ADD COLUMN notifications_enabled BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_users_public_notifications ON public.users_public(notifications_enabled);
    END IF;

    -- Verificar e adicionar coluna first_visit se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users_public' 
        AND column_name = 'first_visit'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users_public ADD COLUMN first_visit BOOLEAN DEFAULT true;
        CREATE INDEX IF NOT EXISTS idx_users_public_first_visit ON public.users_public(first_visit);
    END IF;

    -- Verificar e adicionar coluna phone se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users_public' 
        AND column_name = 'phone'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users_public ADD COLUMN phone TEXT;
        CREATE INDEX IF NOT EXISTS idx_users_public_phone ON public.users_public(phone);
        COMMENT ON COLUMN public.users_public.phone IS 'Número de telefone do usuário para notificações';
    END IF;
END
$$;

-- Atualizar usuários existentes que não têm os valores padrão
UPDATE public.users_public 
SET 
    notifications_enabled = COALESCE(notifications_enabled, false),
    first_visit = COALESCE(first_visit, true)
WHERE 
    notifications_enabled IS NULL 
    OR first_visit IS NULL;

-- Recriar a função handle_new_user com todos os campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_public (id, full_name, phone, notifications_enabled, first_visit)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone',
    false,
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log do erro para debug
    RAISE LOG 'Erro ao inserir usuário: %', SQLERRM;
    -- Tentar inserir com campos mínimos
    INSERT INTO public.users_public (id, full_name, notifications_enabled, first_visit)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      false,
      true
    );
    RETURN NEW;
END;
$$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();