import { Env } from "../index";

export async function handlePublicFile(key: string, env: Env): Promise<Response> {
  if (!key || key.includes("..") || key.startsWith("/")) {
    return new Response(JSON.stringify({ error: "Chave de arquivo inválida." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const object = await env.R2.get(key);
    if (!object || !object.body) {
      return new Response(JSON.stringify({ error: "Arquivo não encontrado." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000");

    return new Response(object.body, { headers });
  } catch (err) {
    console.error("Erro ao buscar arquivo:", err);
    return new Response(JSON.stringify({ error: "Erro ao acessar o arquivo." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
