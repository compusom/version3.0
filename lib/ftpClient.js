import { Client } from 'basic-ftp';

let credentials = null;

export function setFtpCredentials(creds) {
    credentials = creds;
}

export async function checkFtpConnection() {
    if (!credentials) throw new Error('FTP credentials not configured');
    const client = new Client();
    try {
        await client.access({
            host: credentials.host,
            port: credentials.port,
            user: credentials.user,
            password: credentials.password,
        });
    } finally {
        client.close();
    }
}

export async function uploadFile(localPath, remotePath) {
    if (!credentials) throw new Error('FTP credentials not configured');

    const client = new Client();
    try {
        await client.access({
            host: credentials.host,
            port: credentials.port,
            user: credentials.user,
            password: credentials.password,
        });
        await client.uploadFrom(localPath, remotePath);
    } finally {
        client.close();
    }
}
