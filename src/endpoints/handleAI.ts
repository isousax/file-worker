import { Env } from "../index";

const DEFAULT_PROMPT = "Nosso relacionamento cheio de pequenos momentos especiais e muito carinho.";

export async function handleAI(request: Request, env: Env): Promise<Response> {
  let promptToUse = DEFAULT_PROMPT;

  try {
    const bodyRequest = await request.json<{ prompt: string }>();
    if (bodyRequest.prompt && bodyRequest.prompt.trim().length > 0) {
      promptToUse = bodyRequest.prompt.trim();
    }
  } catch (err) {
    console.warn("Erro ao ler o JSON do request, usando prompt padrão:", err);
  }

  try {
    const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente criativo e sensível especializado em criar títulos e descrições curtas, emocionais e românticas para dedicatórias e mensagens pessoais. Seu texto deve ser íntimo, positivo, cheio de afeto, e transmitir conexão e carinho de forma simples, porém poética. Use emojis sutis para dar mais vida ao texto.",
        },
        { role: "user", content: promptToUse },
      ],
    });

    const content = (aiResponse as any).response as string;
    if (!content || typeof content !== "string") {
      return jsonResponse({ error: "Resposta inválida da IA." }, 500);
    }

    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const result = {
      title: lines[0] || "",
      description: lines.slice(1).join(" ") || "",
    };

    return jsonResponse(result, 200);
  } catch (err) {
    console.error("Erro na IA:", err);
    return jsonResponse({ error: "Falha ao processar IA." }, 500);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}