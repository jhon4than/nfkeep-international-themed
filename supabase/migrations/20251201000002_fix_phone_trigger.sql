-- Verificar se a coluna phone existe e recriar o trigger se necessário

DO $$
BEGIN
    -- Verificar se a coluna phone existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users_public' 
        AND column_name = 'phone'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar coluna phone se não existir
        ALTER TABLE public.users_public ADD COLUMN phone TEXT;
        
        -- Criar índice para o campo phone
        CREATE INDEX IF NOT EXISTS idx_users_public_phone ON public.users_public(phone);
        
        -- Comentário para documentação
        COMMENT ON COLUMN public.users_public.phone IS 'Número de telefone do usuário para notificações';
    END IF;
END
$$;

-- Recriar a função handle_new_user para garantir que funcione corretamente
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
    -- Inserir sem o campo phone se houver erro
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