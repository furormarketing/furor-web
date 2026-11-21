// Envía notificaciones push a los dispositivos de los integrantes indicados.
// La llama solo la base de datos (con un secreto compartido guardado en push_config).
// Desplegada en Supabase como Edge Function "notificar" (verify_jwt = false).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
let cfg: Record<string, string> | null = null;

async function config() {
  if (cfg) return cfg;
  const { data, error } = await sb.from("push_config").select("clave, valor");
  if (error) throw error;
  cfg = Object.fromEntries((data ?? []).map((r: { clave: string; valor: string }) => [r.clave, r.valor]));
  webpush.setVapidDetails(cfg.vapid_subject, cfg.vapid_public, cfg.vapid_private);
  return cfg;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  try {
    const c = await config();
    if (req.headers.get("x-furor-secret") !== c.secreto) return new Response("No autorizado", { status: 401 });
    const { miembros, titulo, cuerpo, url } = await req.json();
    if (!Array.isArray(miembros) || !miembros.length) return Response.json({ enviados: 0 });
    const { data: subs, error } = await sb.from("push_subs").select("id, endpoint, p256dh, auth").in("miembro_id", miembros);
    if (error) throw error;
    const payload = JSON.stringify({ titulo, cuerpo, url: url || "#inicio" });
    let enviados = 0;
    const vencidas: string[] = [];
    await Promise.all((subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24, urgency: "high" });
        enviados++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) vencidas.push(s.id);
        else console.error("push error", code, (e as Error).message);
      }
    }));
    if (vencidas.length) await sb.from("push_subs").delete().in("id", vencidas);
    return Response.json({ enviados, eliminadas: vencidas.length });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), { status: 500 });
  }
});
