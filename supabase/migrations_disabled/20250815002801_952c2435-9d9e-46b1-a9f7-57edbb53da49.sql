-- Fix missing action column in unified_ai_logs table
DO $$ 
BEGIN
    -- Check if unified_ai_logs table exists and add missing action column
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'unified_ai_logs') THEN
        -- Add action column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'unified_ai_logs' AND column_name = 'action') THEN
            ALTER TABLE unified_ai_logs ADD COLUMN action TEXT;
        END IF;
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE unified_ai_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id UUID REFERENCES auth.users(id),
            action TEXT,
            model_name TEXT,
            request_data JSONB,
            response_data JSONB,
            processing_time_ms INTEGER,
            success BOOLEAN DEFAULT TRUE,
            error_message TEXT,
            metadata JSONB DEFAULT '{}'::jsonb
        );

        -- Enable RLS
        ALTER TABLE unified_ai_logs ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own AI logs" ON unified_ai_logs
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own AI logs" ON unified_ai_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        -- Create updated_at trigger
        CREATE TRIGGER update_unified_ai_logs_updated_at
            BEFORE UPDATE ON unified_ai_logs
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Fix functions with mutable search paths for security
    -- Update log_security_event function
    CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, event_description text, user_id uuid DEFAULT auth.uid(), metadata jsonb DEFAULT '{}'::jsonb)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $function$
    BEGIN
        INSERT INTO public.analytics_events (
            event_type,
            event_message,
            user_id,
            module,
            severity,
            metadata
        ) VALUES (
            event_type,
            event_description,
            user_id,
            'security',
            'warn',
            metadata
        );
    END;
    $function$;

    -- Update audit_sensitive_access function
    CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $function$
    BEGIN
        -- Log access to sensitive tables
        PERFORM public.log_security_event(
            TG_OP || '_' || TG_TABLE_NAME,
            'Access to sensitive table: ' || TG_TABLE_NAME,
            auth.uid(),
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP,
                'record_id', COALESCE(NEW.id, OLD.id)
            )
        );
        
        RETURN COALESCE(NEW, OLD);
    END;
    $function$;

    -- Update log_sensitive_table_access function
    CREATE OR REPLACE FUNCTION public.log_sensitive_table_access()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $function$
    BEGIN
      INSERT INTO public.security_audit_logs (
        event_type,
        table_name,
        record_id,
        user_id,
        action_attempted,
        access_granted,
        risk_level,
        details
      ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        auth.uid(),
        TG_OP || ' on ' || TG_TABLE_NAME,
        true,
        CASE 
          WHEN TG_TABLE_NAME IN ('financial_transactions', 'guest_charters', 'crew_members') THEN 'high'
          WHEN TG_TABLE_NAME LIKE 'ai_%' THEN 'medium'
          ELSE 'low'
        END,
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'operation', TG_OP,
          'timestamp', now()
        )
      );
      
      RETURN COALESCE(NEW, OLD);
    END;
    $function$;

    -- Update track_sensitive_access function
    CREATE OR REPLACE FUNCTION public.track_sensitive_access()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = 'public'
    AS $function$
    BEGIN
      NEW.accessed_at = now();
      NEW.accessed_by = auth.uid();
      RETURN NEW;
    END;
    $function$;

    -- Update update_warranty_expiration function
    CREATE OR REPLACE FUNCTION public.update_warranty_expiration()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = 'public'
    AS $function$
    BEGIN
      IF NEW.warranty_start_date IS NOT NULL AND NEW.warranty_duration_months IS NOT NULL THEN
        NEW.warranty_expires_at := NEW.warranty_start_date + (NEW.warranty_duration_months || ' months')::interval;
      END IF;
      RETURN NEW;
    END;
    $function$;

END $$;