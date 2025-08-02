import { Env } from "../index";

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key || !key.trim()) {
    return new Response(JSON.stringify({ message: "Parâmetros da requisição malformados." }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const contentType = request.headers.get("Content-Type");
  if (!contentType || !contentType.startsWith("image/")) {
    return new Response(JSON.stringify({ message: "Formato não suportado." }), {
      status: 415,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  let file: ArrayBuffer;
  try {
    file = await request.arrayBuffer();
    if (file.byteLength === 0) {
      throw new Error("Arquivo vazio.");
    }
  } catch (err) {
    return new Response(JSON.stringify({ message: "Upload de arquivo inválido." }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    await env.R2.put(key, file, {
      httpMetadata: { contentType },
    });

    const publicUrl = `https://${env.DNS}/file/${key}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Erro no upload:", err);
    return new Response(JSON.stringify({ message: "Erro inesperado no servidor." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
