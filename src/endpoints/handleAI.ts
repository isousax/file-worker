import { Env } from "../index";

const DEFAULT_PROMPT =
  "Nosso relacionamento cheio de pequenos momentos especiais e muito carinho.";

export async function handleAI(request: Request, env: Env): Promise<Response> {
  let systemContent = `Você é um assistente criativo e sensível especializado em criar títulos e descrições curtas, emocionais e românticas para dedicatórias e mensagens pessoais.
Gere exatamente duas linhas: a primeira linha deve ser o título (curto e impactante, sem aspas), e a segunda linha deve ser a descrição (mais detalhada e poética, sem aspas).
Use emojis para dar mais vida ao texto.
Não inclua aspas, nem nenhum outro caractere extra.`;

  let userMessage = DEFAULT_PROMPT;

  try {
    const bodyRequest = await request.json<{
      prompt?: string;
      title?: string;
      description?: string;
    }>();

    if (bodyRequest) {
      if (bodyRequest.title && bodyRequest.description) {
        systemContent = `Você é um assistente criativo e sensível especializado em aprimorar títulos e descrições curtas, emocionais e românticas para dedicatórias e mensagens pessoais.
Melhore o título e a descrição a seguir para que fiquem mais impactantes, poéticos, íntimos e com emojis sutis. Retorne exatamente duas linhas: primeira o título, segunda a descrição, sem aspas nem caracteres extras.`;

        userMessage = `Título atual: ${bodyRequest.title.trim()}
Descrição atual: ${bodyRequest.description.trim()}`;
      } else if (bodyRequest.prompt && bodyRequest.prompt.trim().length > 0) {
        userMessage = bodyRequest.prompt.trim();
      }
    }
  } catch (err) {
    console.warn("Erro ao ler o JSON do request, usando prompt padrão:", err);
  }

  try {
    const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userMessage },
      ],
    });

    const content = (aiResponse as any).response as string;
    if (!content || typeof content !== "string") {
      return jsonResponse({ error: "Resposta inválida da IA." }, 500);
    }

    const lines = content
      .split("\n")
      .map((line) => line.trim().replace(/^["']|["']$/g, ""))
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
