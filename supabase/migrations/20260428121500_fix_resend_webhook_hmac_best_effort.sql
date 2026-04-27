BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.invoke_resend_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
DECLARE
  request_id bigint;
  webhook_secret text := 'CHANGE_ME_TO_RESEND_WEBHOOK_SECRET';
  webhook_timestamp text := extract(epoch from now())::bigint::text;
  webhook_body text;
  webhook_signature text;
BEGIN
  webhook_body := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)
  )::text;

  webhook_signature := 'v1=' || encode(
    hmac(
      convert_to(webhook_timestamp || '.' || webhook_body, 'UTF8'),
      convert_to(webhook_secret, 'UTF8'),
      'sha256'::text
    ),
    'hex'
  );

  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/resend-webhook',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-webhook-timestamp', webhook_timestamp,
      'x-webhook-signature', webhook_signature
    ),
    body := webhook_body::jsonb
  )
  INTO request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'invoke_resend_webhook skipped: %', SQLERRM;
    RETURN NEW;
END;
$$;

COMMIT;
