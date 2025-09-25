import type { Env } from "../index";

interface UploadResponse {
  success: boolean;
  message: string;
  fileKey?: string;
  uploadedAt?: string;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export async function uploadToR2Handler(
  request: Request,
  env: Env
): Promise<Response> {
  console.info("[uploadToR2Handler] solicitação de upload recebida");

  // Verificar se o método é POST
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  // Verificar se R2 está disponível
  if (!env.R2) {
    console.error("[uploadToR2Handler] R2 não configurado no ambiente");
    return jsonResponse({ error: "Serviço de armazenamento não disponível" }, 500);
  }

  try {
    // Obter o arquivo do FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.warn("[uploadToR2Handler] arquivo não fornecido");
      return jsonResponse({ error: "Arquivo é obrigatório" }, 400);
    }

    // Verificar se é um arquivo .zip
    if (!file.name.toLowerCase().endsWith('.zip')) {
      console.warn("[uploadToR2Handler] tipo de arquivo inválido:", file.name);
      return jsonResponse({ error: "Apenas arquivos .zip são aceitos" }, 400);
    }

    // Verificar tamanho do arquivo (limite de 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      console.warn("[uploadToR2Handler] arquivo muito grande:", file.size);
      return jsonResponse({ error: "Arquivo muito grande. Máximo 100MB" }, 400);
    }

    // Gerar chave única para o arquivo
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const fileKey = `uploads/${timestamp}-${randomId}-${file.name}`;

    console.info("[uploadToR2Handler] fazendo upload do arquivo:", fileKey);

    // Converter arquivo para ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Upload para R2
    await env.R2.put(fileKey, fileBuffer, {
      httpMetadata: {
        contentType: 'application/zip',
        contentDisposition: `attachment; filename="${file.name}"`,
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size.toString(),
      },
    });

    console.info("[uploadToR2Handler] upload concluído com sucesso:", fileKey);

    const response: UploadResponse = {
      success: true,
      message: "Arquivo enviado com sucesso",
      fileKey,
      uploadedAt: new Date().toISOString(),
    };

    return jsonResponse(response, 200);

  } catch (err: any) {
    const msg = (err && (err.message || String(err))) || "erro desconhecido";
    console.error("[uploadToR2Handler] erro inesperado:", {
      error: msg,
      stack: err?.stack,
    });
    return jsonResponse({ error: "Erro interno do servidor" }, 500);
  }
}
