/**
 * Generic batch database utilities - no service-specific logic
 */
import { Pool, PoolClient } from 'pg';
import format from 'pg-format';

export interface BatchInsertOptions {
  batchSize?: number;
  onBatchComplete?: (count: number) => void;
}

export async function batchInsert<T extends Record<string, any>>(
  client: Pool | PoolClient,
  tableName: string,
  columns: string[],
  records: T[],
  options: BatchInsertOptions = {}
): Promise<number> {
  const { batchSize = 1000, onBatchComplete } = options;
  if (records.length === 0) return 0;

  let totalInserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const values = batch.map((record) => columns.map((col) => record[col]));
    const query = format('INSERT INTO %I (%I) VALUES %L', tableName, columns, values);
    await client.query(query);
    totalInserted += batch.length;
    onBatchComplete?.(batch.length);
  }
  return totalInserted;
}

export async function batchUpdate<T extends Record<string, any>>(
  client: Pool | PoolClient,
  tableName: string,
  updates: T[],
  idColumn: string,
  updateColumns: string[]
): Promise<number> {
  if (updates.length === 0) return 0;
  const tempTableName = `temp_${tableName}_${Date.now()}`;

  try {
    await client.query(format('CREATE TEMP TABLE %I (LIKE %I INCLUDING DEFAULTS)', tempTableName, tableName));
    const columns = [idColumn, ...updateColumns];
    const values = updates.map((record) => columns.map((col) => record[col]));
    await client.query(format('INSERT INTO %I (%I) VALUES %L', tempTableName, columns, values));

    const setClause = updateColumns.map((col) => format('%I = %I.%I', col, tempTableName, col)).join(', ');
    const updateQuery = format(
      `UPDATE %I SET ${setClause} FROM %I WHERE %I.%I = %I.%I`,
      tableName, tempTableName, tableName, idColumn, tempTableName, idColumn
    );
    const result = await client.query(updateQuery);
    return result.rowCount || 0;
  } finally {
    await client.query(format('DROP TABLE IF EXISTS %I', tempTableName));
  }
}

export async function batchUpsert<T extends Record<string, any>>(
  client: Pool | PoolClient,
  tableName: string,
  records: T[],
  conflictColumns: string[],
  updateColumns: string[],
  options: BatchInsertOptions = {}
): Promise<number> {
  const { batchSize = 1000 } = options;
  if (records.length === 0) return 0;

  let totalUpserted = 0;
  const allColumns = Object.keys(records[0]);

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const values = batch.map((record) => allColumns.map((col) => record[col]));
    const updateSet = updateColumns.map((col) => format('%I = EXCLUDED.%I', col, col)).join(', ');
    const query = format(
      `INSERT INTO %I (%I) VALUES %L ON CONFLICT (%I) DO UPDATE SET ${updateSet}`,
      tableName, allColumns, values, conflictColumns
    );
    const result = await client.query(query);
    totalUpserted += result.rowCount || 0;
  }
  return totalUpserted;
}
