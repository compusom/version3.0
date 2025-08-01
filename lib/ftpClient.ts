import { Client } from 'basic-ftp';

export interface FtpCredentials {
    host: string;
    port?: number;
    user: string;
    password: string;
}

let credentials: FtpCredentials | null = null;

export function setFtpCredentials(creds: FtpCredentials) {
    credentials = creds;
}

export async function uploadFile(localPath: string, remotePath: string): Promise<void> {
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
