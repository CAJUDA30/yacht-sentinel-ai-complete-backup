
export type JsonValue = Record<string, any> | any[] | string | number | boolean | null;

export function jsonOk(
  data: JsonValue,
  corsHeaders: Record<string, string>,
  meta?: Record<string, any>
): Response {
  const body = { data, error: null as any, ...(meta ? { meta } : {}) };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function jsonBadRequest(
  message: string,
  corsHeaders: Record<string, string>,
  code = 'BAD_REQUEST',
  details?: any
): Response {
  return jsonError(400, message, corsHeaders, code, details);
}

export function jsonError(
  status: number,
  message: string,
  corsHeaders: Record<string, string>,
  code = 'INTERNAL_ERROR',
  details?: any
): Response {
  const body = { error: { message, code, ...(details ? { details } : {}) } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
