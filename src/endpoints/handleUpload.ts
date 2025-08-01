import { Env } from "../index";

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key || !key.trim()) {
    return new Response(JSON.stringify({ message: "Missing or invalid 'key' query param." }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const contentType = request.headers.get("Content-Type");
  if (!contentType || !contentType.startsWith("image/")) {
    return new Response(JSON.stringify({ message: "Only image uploads are allowed." }), {
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
      throw new Error("Empty file");
    }
  } catch (err) {
    return new Response(JSON.stringify({ message: "Invalid file upload." }), {
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
    return new Response(JSON.stringify({ message: "Erro ao fazer upload para o R2." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
