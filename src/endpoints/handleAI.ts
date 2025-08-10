import { Env } from "../index";

export async function handleAI(request: Request, env: Env): Promise<Response> {
	try {
		const { prompt } = await request.json<{ prompt: string }>();

		if (!prompt || prompt.trim().length === 0) {
			return jsonResponse({ error: "Prompt vazio." }, 400);
		}

		const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
			messages: [
				{ role: "system", content: "Você é um assistente útil e criativo." },
				{ role: "user", content: prompt }
			]
		});

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
			"Access-Control-Allow-Methods": "PUT, OPTIONS, GET, POST",
			"Access-Control-Allow-Headers": "Content-Type"
		}
	});
}