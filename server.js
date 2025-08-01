import express from 'express';
import { Client } from 'pg';
import https from 'https';
import multer from 'multer';
import fs from 'fs';
import { setFtpCredentials, uploadFile, checkFtpConnection } from './lib/ftpClient.ts';

const app = express();
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

let ftpConfig = {
  host: process.env.FTP_HOST || null,
  port: process.env.FTP_PORT ? parseInt(process.env.FTP_PORT) : 21,
  user: process.env.FTP_USER || null,
  password: process.env.FTP_PASS || null
};

if (ftpConfig.host && ftpConfig.user && ftpConfig.password) {
  setFtpCredentials(ftpConfig);
}

let dbClient = null;
let connectionError = null;

function fetchPublicIp() {
  return new Promise((resolve, reject) => {
    https
      .get('https://api.ipify.org?format=json', res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const ip = JSON.parse(data).ip;
            resolve(ip);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', err => reject(err));
  });
}

let serverIp = null;
fetchPublicIp()
  .then(ip => {
    serverIp = ip;
    console.log('Public IP:', ip);
  })
  .catch(err => {
    console.error('Error fetching IP:', err);
  });

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
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || ''
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

app.post('/api/set-ftp-credentials', (req, res) => {
  const { host, port, user, password } = req.body;
  ftpConfig = { host, port: port ? parseInt(port) : 21, user, password };
  setFtpCredentials(ftpConfig);
  res.json({ success: true });
});

app.get('/api/get-ftp-credentials', (req, res) => {
  if (!ftpConfig.host) return res.json({});
  const { password, ...safe } = ftpConfig;
  res.json(safe);
});

app.get('/api/test-ftp', async (req, res) => {
  try {
    await checkFtpConnection();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/server-ip', async (req, res) => {
  try {
    if (!serverIp) {
      serverIp = await fetchPublicIp();
    }
    res.json({ ip: serverIp });
  } catch (e) {
    res.status(500).json({ error: 'Error fetching IP' });
  }
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

app.post('/api/factory-reset', async (req, res) => {
  if (!dbClient) return res.status(500).json({ error: 'DB not connected' });
  try {
    await dbClient.query('DELETE FROM kv_store');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const localPath = req.file.path;
  try {
    await uploadFile(localPath, req.file.originalname);
    fs.unlink(localPath, () => {});
    res.json({ success: true });
  } catch (err) {
    fs.unlink(localPath, () => {});
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
