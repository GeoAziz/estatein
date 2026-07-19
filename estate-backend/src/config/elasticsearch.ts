import { Client } from "@elastic/elasticsearch";

const globalForES = globalThis as unknown as { elasticsearch: Client | null };

function createESClient(): Client | null {
  const node = process.env.ELASTICSEARCH_URL || process.env.OPENSEARCH_URL;
  if (!node) {
    return null;
  }

  return new Client({
    node,
    requestTimeout: 10000,
    maxRetries: 3,
  });
}

export const elasticsearch = globalForES.elasticsearch ?? createESClient();

if (process.env.NODE_ENV !== "production") {
  globalForES.elasticsearch = elasticsearch;
}

export default elasticsearch;
