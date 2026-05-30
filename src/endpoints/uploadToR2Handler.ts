export async function uploadToR2Handler(request: Request, env: Env): Promise<Response> {
  console.info("[uploadToR2Handler] solicitação recebida");

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
    });
  }

  if (!env.R2) {
    return new Response(JSON.stringify({ error: "R2 não configurado" }), {
      status: 500,
    });
  }

  try {
    // 🚨 AGORA É BINÁRIO DIRETO
    const body = request.body;

    if (!body) {
      return new Response(JSON.stringify({ error: "Body vazio" }), {
        status: 400,
      });
    }

    const fileName =
      request.headers.get("x-filename") || `${Date.now()}.zip`;

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    const fileKey = `uploadsZIP/${Date.now()}-${sanitizedFileName}`;

    console.info("[uploadToR2Handler] salvando:", fileKey);

    await env.R2.put(fileKey, body, {
      httpMetadata: {
        contentType:
          request.headers.get("content-type") ||
          "application/octet-stream",
        contentDisposition: `attachment; filename="${sanitizedFileName}"`,
      },
      customMetadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        fileKey,
        uploadedAt: new Date().toISOString(),
      }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Erro interno",
        details: err?.message,
      }),
      { status: 500 }
    );
  }
}
