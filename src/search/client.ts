import { env } from "../config/env";

export class ElasticsearchRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number | undefined,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ElasticsearchRequestError";
  }
}

function authorization(): string | undefined {
  if (!env.ELASTICSEARCH_USERNAME || !env.ELASTICSEARCH_PASSWORD) return undefined;
  return `Basic ${Buffer.from(`${env.ELASTICSEARCH_USERNAME}:${env.ELASTICSEARCH_PASSWORD}`).toString("base64")}`;
}

export async function elasticRequest<T>(
  path: string,
  options: RequestInit & { rawBody?: string } = {}
): Promise<T> {
  const { rawBody, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  const auth = authorization();
  if (auth) headers.set("authorization", auth);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  try {
    const response = await fetch(new URL(path, `${env.ELASTICSEARCH_NODE}/`), {
      ...requestOptions,
      body: rawBody ?? options.body,
      headers,
      signal: AbortSignal.timeout(env.ELASTICSEARCH_REQUEST_TIMEOUT_MS)
    });
    const text = await response.text();
    let parsed: unknown = undefined;
    if (text) {
      try { parsed = JSON.parse(text); } catch { parsed = text; }
    }
    if (!response.ok) {
      throw new ElasticsearchRequestError(
        `Elasticsearch request failed with status ${response.status}`,
        response.status,
        parsed
      );
    }
    return parsed as T;
  } catch (error) {
    if (error instanceof ElasticsearchRequestError) throw error;
    throw new ElasticsearchRequestError(
      error instanceof Error ? error.message : "Elasticsearch request failed",
      undefined,
      error
    );
  }
}

export async function elasticsearchHealth() {
  const startedAt = Date.now();
  try {
    const data = await elasticRequest<{ status: string; cluster_name: string }>("_cluster/health");
    return { available: true, status: data.status, clusterName: data.cluster_name, tookMs: Date.now() - startedAt };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : "Elasticsearch unavailable",
      tookMs: Date.now() - startedAt
    };
  }
}
