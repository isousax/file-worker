import { Env } from "../index";

export async function handlePublicFile(key: string, env: Env): Promise<Response> {
  const jsonHeader = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (!key || key.includes("..") || key.startsWith("/")) {
    return new Response(JSON.stringify({ error: "Chave de arquivo inválida." }), {
      status: 400,
      headers: jsonHeader,
    });
  }

  try {
    const object = await env.R2.get(key);
    if (!object || !object.body) {
      return new Response(JSON.stringify({ error: "Arquivo não encontrado." }), {
        status: 404,
        headers: jsonHeader,
      });
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=1728000"); // 20 dias
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET");
    headers.set("Access-Control-Allow-Headers", "Content-Type");

    return new Response(object.body, { headers });
  } catch (err) {
    console.error("Erro ao buscar arquivo:", err);
    return new Response(JSON.stringify({ error: "Erro ao acessar o arquivo." }), {
      status: 500,
      headers: jsonHeader,
    });
  }
}
