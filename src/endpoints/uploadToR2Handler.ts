export async function uploadToR2Handler(
  request: Request,
  env: Env
): Promise<Response> {
  console.info("[uploadToR2Handler] solicitação recebida");

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405 }
    );
  }

  if (!env.R2) {
    return new Response(
      JSON.stringify({ error: "R2 não configurado" }),
      { status: 500 }
    );
  }

  try {
    const data = await request.json();

    if (!data?.file || typeof data.file !== "string") {
      return new Response(
        JSON.stringify({
          error: "Campo 'file' não informado ou inválido",
        }),
        { status: 400 }
      );
    }

    const fileName =
      request.headers.get("x-filename") || `${Date.now()}.txt`;

    const sanitizedFileName = fileName.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const fileKey = `uploadsTXT/${Date.now()}-${sanitizedFileName}`;

    console.info("[uploadToR2Handler] salvando:", fileKey);

    await env.R2.put(fileKey, data.file, {
      httpMetadata: {
        contentType: "text/plain; charset=utf-8",
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
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("[uploadToR2Handler] erro:", err);

    return new Response(
      JSON.stringify({
        error: "Erro interno",
        details: err?.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
