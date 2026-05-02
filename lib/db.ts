import postgres from 'postgres';

// Single postgres connection pool reused across requests
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
