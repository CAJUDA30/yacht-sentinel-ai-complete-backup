
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Supa = ReturnType<typeof createClient>;

export type LogSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogEvent {
  event_type: string;
  event_message: string;
  module: string;
  severity?: LogSeverity;
  metadata?: any;
  user_id?: string | null;
}

export async function logAnalyticsEvent(
  supabase: Supa,
  evt: LogEvent
): Promise<void> {
  const payload = {
    event_type: evt.event_type,
    event_message: evt.event_message,
    module: evt.module,
    severity: evt.severity ?? 'info',
    metadata: evt.metadata ?? {},
    user_id: evt.user_id ?? null,
  };
  const { error } = await supabase.from('analytics_events').insert(payload);
  if (error) {
    // Last-chance console logging to aid debugging if DB insert fails
    console.error('analytics_events insert failed:', error, payload);
  }
}
