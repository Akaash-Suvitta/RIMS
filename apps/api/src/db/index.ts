export { pool, query } from './client.js';
export * from './repositories/index.js';
// migrate is a standalone script — not re-exported here to avoid
// accidental import in application code.
