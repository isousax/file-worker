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
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

export async function uploadToR2Handler(
  request: Request,
  env: Env
): Promise<Response> {
  console.info("[uploadToR2Handler] solicitação de upload recebida");

  if (request.method !== "POST") {
    return jsonResponse({
      error: "Método não permitido",
    }, 405);
  }

  if (!env.R2) {
    console.error("[uploadToR2Handler] R2 não configurado");

    return jsonResponse({
      error: "Serviço de armazenamento não disponível",
    }, 500);
  }

  try {
    const formData = await request.formData();

    const file = formData.get("file") as File;

    if (!file) {
      console.warn("[uploadToR2Handler] arquivo não fornecido");

      return jsonResponse({
        error: "Arquivo é obrigatório",
      }, 400);
    }

    const allowedExtensions = [".zip", ".7z", ".rar"];

    const isValid = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValid) {
      return jsonResponse({
        error: "Formato inválido",
      }, 400);
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      console.warn(
        "[uploadToR2Handler] arquivo muito grande:",
        file.size
      );

      return jsonResponse({
        error: "Arquivo muito grande. Máximo 100MB",
      }, 400);
    }

    const timestamp = Date.now();

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const fileKey = `uploadsZIP/${timestamp}-${sanitizedFileName}`;

    console.info(
      "[uploadToR2Handler] iniciando upload:",
      fileKey
    );

    // STREAMING DIRETO PRO R2
    await env.R2.put(fileKey, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
        contentDisposition: `attachment; filename="${sanitizedFileName}"`,
      },

      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size.toString(),
      },
    });

    console.info(
      "[uploadToR2Handler] upload concluído:",
      fileKey
    );

    const response: UploadResponse = {
      success: true,
      message: "Arquivo enviado com sucesso",
      fileKey,
      uploadedAt: new Date().toISOString(),
    };

    return jsonResponse(response, 200);

  } catch (err: any) {
    const msg =
      (err && (err.message || String(err))) ||
      "erro desconhecido";

    console.error("[uploadToR2Handler] erro:", {
      error: msg,
      stack: err?.stack,
    });

    return jsonResponse({
      error: "Erro interno do servidor",
      details: msg,
    }, 500);
  }
}
