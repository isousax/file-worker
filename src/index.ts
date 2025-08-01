import type { R2Bucket } from "@cloudflare/workers-types";
import { handleUpload } from "./endpoints/handleUpload";
import { handlePublicFile } from "./endpoints/handlePublicFile";

export interface Env {
	R2: R2Bucket;
	DNS: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const { pathname } = url;

		if (request.method === "PUT" && pathname === "/upload") {
			return await handleUpload(request, env);
		}

		if (request.method === "GET" && pathname.startsWith("/file/")) {
			const key = pathname.replace("/file/", "");
			return await handlePublicFile(key, env);
		}

		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "PUT, OPTIONS, GET",
					"Access-Control-Allow-Headers": "Content-Type"
				}
			});
		}

		return new Response(
			JSON.stringify({ error: "Rota não encontrada." }),
			{ status: 404, headers: { "Content-Type": "application/json" } }
		);
	},
};
