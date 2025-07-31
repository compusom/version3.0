import express from 'express';
import { Client } from 'pg';

const app = express();
app.use(express.json());

let dbClient = null;
let connectionError = null;

async function connectToDb(config) {
  const client = new Client({
    host: config.host,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    await client.query('CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value JSONB)');
    dbClient = client;
    connectionError = null;
    console.log('Connected to PostgreSQL');
  } catch (err) {
    connectionError = err.message;
    dbClient = null;
    console.error('DB connection failed:', err.message);
  }
}

await connectToDb({
  host: process.env.DB_HOST || 'Pulseweb.com.ar',
  database: process.env.DB_NAME || 'dbzonjl9ktp0wu',
  user: process.env.DB_USER || 'uizkbuhryctw3',
  password: process.env.DB_PASS || 'Cataclismoss'
});

app.get('/api/status', (req, res) => {
  res.json({ connected: !!dbClient, error: connectionError });
});

app.post('/api/set-credentials', async (req, res) => {
  const { host, database, user, password } = req.body;
  await connectToDb({ host, database, user, password });
  if (dbClient) res.json({ success: true });
  else res.status(500).json({ success: false, error: connectionError });
});

app.get('/api/kv/:key', async (req, res) => {
  if (!dbClient) return res.status(500).json({ error: 'DB not connected' });
  const { key } = req.params;
  try {
    const result = await dbClient.query('SELECT value FROM kv_store WHERE key=$1', [key]);
    if (result.rows.length === 0) return res.json({ value: null });
    res.json({ value: result.rows[0].value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kv/:key', async (req, res) => {
  if (!dbClient) return res.status(500).json({ error: 'DB not connected' });
  const { key } = req.params;
  try {
    await dbClient.query(
      'INSERT INTO kv_store(key, value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value',
      [key, req.body]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/kv/:key', async (req, res) => {
  if (!dbClient) return res.status(500).json({ error: 'DB not connected' });
  const { key } = req.params;
  try {
    await dbClient.query('DELETE FROM kv_store WHERE key=$1', [key]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
