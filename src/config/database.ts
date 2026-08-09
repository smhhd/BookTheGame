import { Pool, PoolClient, QueryResult, QueryResultRow, types } from "pg";
import { env } from "./env";

// The phase schemas use timestamp without time zone with UTC as the storage convention.
// node-postgres otherwise interprets these values in the API host's local timezone.
export function parseUtcTimestamp(value: string): Date {
  return new Date(`${value.replace(" ", "T")}Z`);
}

types.setTypeParser(1114, parseUtcTimestamp);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  options: "-c search_path=book_the_game,public -c timezone=UTC"
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", { message: error.message });
});

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: readonly unknown[] = []
): Promise<QueryResult<T>> {
  return pool.query<T>(text, [...values]);
}

export async function transaction<T>(
  work: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
