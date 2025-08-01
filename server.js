import express from 'express';
import { Client } from 'pg';
import https from 'https';
import { Client as FtpClient } from 'basic-ftp';

const app = express();
app.use(express.json({ limit: '50mb' }));

let dbClient = null;
let connectionError = null;

let ftpClient = null;
let ftpError = null;

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

async function connectToFtp(config) {
  const client = new FtpClient();
  try {
    await client.access({
      host: config.host,
      port: Number(config.port) || 21,
      user: config.user,
      password: config.password,
      secure: false
    });
    ftpClient = client;
    ftpError = null;
    console.log('Connected to FTP');
  } catch (err) {
    ftpClient = null;
    ftpError = err.message;
    console.error('FTP connection failed:', err.message);
  }
}

await connectToDb({
  host: process.env.DB_HOST || 'Pulseweb.com.ar',
  database: process.env.DB_NAME || 'dbzonjl9ktp0wu',
  user: process.env.DB_USER || 'uizkbuhryctw3',
  password: process.env.DB_PASS || 'Cataclismoss'
});

await connectToFtp({
  host: process.env.FTP_HOST || 'localhost',
  port: process.env.FTP_PORT || '21',
  user: process.env.FTP_USER || 'anonymous',
  password: process.env.FTP_PASS || 'anonymous'
});

app.get('/api/status', (req, res) => {
  res.json({ connected: !!dbClient, error: connectionError });
});

app.get('/api/ftp-status', (req, res) => {
  res.json({ connected: !!ftpClient, error: ftpError });
});

app.post('/api/set-ftp-credentials', async (req, res) => {
  const { host, port, user, password } = req.body;
  await connectToFtp({ host, port, user, password });
  if (ftpClient) res.json({ success: true });
  else res.status(500).json({ success: false, error: ftpError });
});

app.post('/api/set-credentials', async (req, res) => {
  const { host, database, user, password } = req.body;
  await connectToDb({ host, database, user, password });
  if (dbClient) res.json({ success: true });
  else res.status(500).json({ success: false, error: connectionError });
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

app.post('/api/upload', async (req, res) => {
  if (!ftpClient) return res.status(500).json({ error: 'FTP not connected' });
  const { fileName, dataUrl } = req.body;
  if (!fileName || !dataUrl) return res.status(400).json({ error: 'Invalid payload' });
  const base64 = dataUrl.split(',')[1] || dataUrl;
  const buffer = Buffer.from(base64, 'base64');
  try {
    await ftpClient.uploadFrom(buffer, fileName);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
