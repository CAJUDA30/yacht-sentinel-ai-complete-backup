            info             
-----------------------------
 -- ENCRYPTION SYSTEM BACKUP
(1 row)

                    info                    
--------------------------------------------
 -- Generated: 2025-10-12 13:30:32.20688+00
(1 row)

 ?column? 
----------
 
(1 row)

                                               function_definition                                               
-----------------------------------------------------------------------------------------------------------------
 CREATE OR REPLACE FUNCTION public.auto_encrypt_ai_provider_keys()                                              +
  RETURNS trigger                                                                                               +
  LANGUAGE plpgsql                                                                                              +
  SECURITY DEFINER                                                                                              +
 AS $function$                                                                                                  +
 BEGIN                                                                                                          +
     -- Encrypt API key from various possible sources                                                           +
     -- Priority: api_key_encrypted > config.api_key > api_secret_name                                          +
                                                                                                                +
     -- 1. If api_key_encrypted is being set directly                                                           +
     IF NEW.api_key_encrypted IS NOT NULL AND NEW.api_key_encrypted != '' THEN                                  +
         NEW.api_key_encrypted := public.encrypt_api_key(NEW.api_key_encrypted);                                +
     -- 2. Check if API key is in config.api_key                                                                +
     ELSIF NEW.config IS NOT NULL AND NEW.config ? 'api_key' THEN                                               +
         NEW.api_key_encrypted := public.encrypt_api_key(NEW.config->>'api_key');                               +
         -- Remove plain text key from config after encryption                                                  +
         NEW.config := NEW.config - 'api_key';                                                                  +
     -- 3. Check if API key is in api_secret_name (legacy)                                                      +
     ELSIF NEW.api_secret_name IS NOT NULL AND NEW.api_secret_name != '' THEN                                   +
         NEW.api_key_encrypted := public.encrypt_api_key(NEW.api_secret_name);                                  +
         NEW.api_secret_name := NULL; -- Clear after encryption                                                 +
     END IF;                                                                                                    +
                                                                                                                +
     RETURN NEW;                                                                                                +
 END;                                                                                                           +
 $function$                                                                                                     +
                                                                                                                +
                                                                                                                +
 
 CREATE OR REPLACE FUNCTION public.auto_encrypt_document_ai_credentials()                                       +
  RETURNS trigger                                                                                               +
  LANGUAGE plpgsql                                                                                              +
  SECURITY DEFINER                                                                                              +
 AS $function$                                                                                                  +
 BEGIN                                                                                                          +
     -- Encrypt GCP service account credentials                                                                 +
     IF NEW.gcp_service_account_encrypted IS NOT NULL AND NEW.gcp_service_account_encrypted != '' THEN          +
         NEW.gcp_service_account_encrypted := public.encrypt_api_key(NEW.gcp_service_account_encrypted);        +
     -- Check if credentials are in configuration.gcp_service_account                                           +
     ELSIF NEW.configuration IS NOT NULL AND NEW.configuration ? 'gcp_service_account' THEN                     +
         NEW.gcp_service_account_encrypted := public.encrypt_api_key(NEW.configuration->>'gcp_service_account');+
         -- Remove plain text from config after encryption                                                      +
         NEW.configuration := NEW.configuration - 'gcp_service_account';                                        +
     END IF;                                                                                                    +
                                                                                                                +
     -- Encrypt generic GCP credentials                                                                         +
     IF NEW.gcp_credentials_encrypted IS NOT NULL AND NEW.gcp_credentials_encrypted != '' THEN                  +
         NEW.gcp_credentials_encrypted := public.encrypt_api_key(NEW.gcp_credentials_encrypted);                +
     -- Check if credentials are in configuration.gcp_credentials                                               +
     ELSIF NEW.configuration IS NOT NULL AND NEW.configuration ? 'gcp_credentials' THEN                         +
         NEW.gcp_credentials_encrypted := public.encrypt_api_key(NEW.configuration->>'gcp_credentials');        +
         -- Remove plain text from config after encryption                                                      +
         NEW.configuration := NEW.configuration - 'gcp_credentials';                                            +
     END IF;                                                                                                    +
                                                                                                                +
     RETURN NEW;                                                                                                +
 END;                                                                                                           +
 $function$                                                                                                     +
                                                                                                                +
                                                                                                                +
 
 CREATE OR REPLACE FUNCTION public.encrypt_api_key(plain_key text)                                              +
  RETURNS text                                                                                                  +
  LANGUAGE plpgsql                                                                                              +
  SECURITY DEFINER                                                                                              +
 AS $function$                                                                                                  +
 DECLARE                                                                                                        +
     encryption_key TEXT;                                                                                       +
 BEGIN                                                                                                          +
     -- Return NULL for empty input                                                                             +
     IF plain_key IS NULL OR plain_key = '' THEN                                                                +
         RETURN NULL;                                                                                           +
     END IF;                                                                                                    +
                                                                                                                +
     -- If already encrypted, return as-is                                                                      +
     IF public.is_encrypted(plain_key) THEN                                                                     +
         RETURN plain_key;                                                                                      +
     END IF;                                                                                                    +
                                                                                                                +
     -- Remove PLAIN: prefix if present                                                                         +
     IF plain_key LIKE 'PLAIN:%' THEN                                                                           +
         plain_key := substring(plain_key from 7);                                                              +
     END IF;                                                                                                    +
                                                                                                                +
     -- Get or generate encryption key                                                                          +
     -- In production, this should come from environment variables                                              +
     -- For now, use a consistent key stored in a secure table                                                  +
     SELECT COALESCE(                                                                                           +
         current_setting('app.encryption_key', true),                                                           +
         'yacht-sentinel-encryption-key-2024'  -- Default fallback                                              +
     ) INTO encryption_key;                                                                                     +
                                                                                                                +
     -- Encrypt using pgcrypto (AES-256)                                                                        +
     -- Returns base64 encoded encrypted data                                                                   +
     BEGIN                                                                                                      +
         RETURN encode(                                                                                         +
             encrypt(                                                                                           +
                 plain_key::bytea,                                                                              +
                 encryption_key::bytea,                                                                         +
                 'aes'                                                                                          +
             ),                                                                                                 +
             'base64'                                                                                           +
         );                                                                                                     +
     EXCEPTION WHEN OTHERS THEN                                                                                 +
         -- If encryption fails, return with PLAIN: prefix for identification                                   +
         RAISE WARNING 'Encryption failed for API key, storing as PLAIN: %', SQLERRM;                           +
         RETURN 'PLAIN:' || plain_key;                                                                          +
     END;                                                                                                       +
 END;                                                                                                           +
 $function$                                                                                                     +
                                                                                                                +
                                                                                                                +
 
 CREATE OR REPLACE FUNCTION public.is_encrypted(value text)                                                     +
  RETURNS boolean                                                                                               +
  LANGUAGE plpgsql                                                                                              +
  IMMUTABLE                                                                                                     +
 AS $function$                                                                                                  +
 BEGIN                                                                                                          +
     -- Empty values are not encrypted                                                                          +
     IF value IS NULL OR value = '' THEN                                                                        +
         RETURN FALSE;                                                                                          +
     END IF;                                                                                                    +
                                                                                                                +
     -- Check for known plain text API key prefixes                                                             +
     -- These indicate the key is NOT encrypted                                                                 +
     IF value ~ '^(sk-|xai-|claude-|glpat-|AIza|PLAIN:)' THEN                                                   +
         RETURN FALSE;                                                                                          +
     END IF;                                                                                                    +
                                                                                                                +
     -- Check if it looks like base64 encoded data (encrypted)                                                  +
     -- Base64 should only contain A-Z, a-z, 0-9, +, /, and = for padding                                       +
     -- and should be reasonably long (at least 32 characters for encrypted data)                               +
     IF value ~ '^[A-Za-z0-9+/]+={0,2}$' AND length(value) >= 32 THEN                                           +
         RETURN TRUE;                                                                                           +
     END IF;                                                                                                    +
                                                                                                                +
     -- Default: treat as plain text                                                                            +
     RETURN FALSE;                                                                                              +
 END;                                                                                                           +
 $function$                                                                                                     +
                                                                                                                +
                                                                                                                +
 
(4 rows)

