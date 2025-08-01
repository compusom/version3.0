import React, { useState, useEffect } from 'react';
import { DbCredentialsModal } from './DbCredentialsModal';
import { FtpCredentialsModal } from './FtpCredentialsModal';

export const DbConnectionView: React.FC = () => {
    const [publicIp, setPublicIp] = useState('');
    const [dbConnected, setDbConnected] = useState<boolean | null>(null);
    const [dbError, setDbError] = useState('');
    const [showCreds, setShowCreds] = useState(false);
    const [showFtpCreds, setShowFtpCreds] = useState(false);
    const [testing, setTesting] = useState(false);
    const [ftpConnected, setFtpConnected] = useState<boolean | null>(null);
    const [ftpError, setFtpError] = useState('');
    const [dbCreds, setDbCreds] = useState<{ host: string; database: string; user: string } | null>(null);
    const [ftpCreds, setFtpCredsState] = useState<{ host: string; port: number; user: string } | null>(null);

    useEffect(() => {
        fetch('/api/server-ip')
            .then(r => r.json())
            .then(d => setPublicIp(d.ip))
            .catch(() => setPublicIp('Desconocida'));
        checkStatus();
        fetch('/api/get-credentials')
            .then(r => r.json())
            .then(c => {
                if (c.host) setDbCreds(c);
            })
            .catch(() => {});
        fetch('/api/get-ftp-credentials')
            .then(r => r.json())
            .then(c => {
                if (c.host) setFtpCredsState({ host: c.host, port: c.port, user: c.user });
            })
            .catch(() => {});
    }, []);

    const checkStatus = async () => {
        setTesting(true);
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            setDbConnected(data.connected);
            setDbError(data.error || '');
        } catch (e) {
            setDbConnected(false);
            setDbError('No se pudo conectar con la API.');
        }
        try {
            const r = await fetch('/api/test-ftp');
            if (r.ok) {
                setFtpConnected(true);
                setFtpError('');
            } else {
                const d = await r.json();
                setFtpConnected(false);
                setFtpError(d.error || 'Error');
            }
        } catch (e) {
            setFtpConnected(false);
            setFtpError('No se pudo conectar al FTP.');
        }
        setTesting(false);
    };

    const updateCreds = async (c: { host: string; database: string; user: string; password: string }) => {
        try {
            const res = await fetch('/api/set-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(c)
            });
            const data = await res.json();
            if (data.success) {
                setDbConnected(true);
                setDbError('');
                setDbCreds({ host: c.host, database: c.database, user: c.user });
            } else {
                setDbConnected(false);
                setDbError(data.error || 'Error');
            }
        } catch (e) {
            setDbConnected(false);
            setDbError('No se pudo conectar con la API.');
        } finally {
            setShowCreds(false);
        }
    };

    const updateFtpCreds = async (c: { host: string; port: string; user: string; password: string }) => {
        try {
            await fetch('/api/set-ftp-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(c)
            });

            const r = await fetch('/api/test-ftp');
            if (r.ok) {
                setFtpConnected(true);
                setFtpError('');
                setFtpCredsState({ host: c.host, port: parseInt(c.port), user: c.user });
            } else {
                const d = await r.json();
                setFtpConnected(false);
                setFtpError(d.error || 'Error');
            }

        } finally {
            setShowFtpCreds(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-brand-surface rounded-lg p-8 shadow-lg animate-fade-in">
            <DbCredentialsModal isOpen={showCreds} onClose={() => setShowCreds(false)} onSave={updateCreds} />
            <FtpCredentialsModal isOpen={showFtpCreds} onClose={() => setShowFtpCreds(false)} onSave={updateFtpCreds} />
            <h2 className="text-2xl font-bold text-brand-text mb-4">Conexión a SQL</h2>
            <p className="text-sm text-brand-text-secondary mb-4">IP del servidor: {publicIp}</p>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Estado:</span>
                    {dbConnected === null && <span>...</span>}
                    {dbConnected && <span className="text-green-400">Conectado</span>}
                    {dbConnected === false && <span className="text-red-400">Desconectado</span>}
                </div>
                {dbConnected === false && <p className="text-xs text-red-400">{dbError}</p>}
                {ftpConnected === false && <p className="text-xs text-red-400">FTP: {ftpError}</p>}
                {ftpConnected && <p className="text-xs text-green-500">FTP conectado</p>}
                {dbCreds && (
                    <p className="text-xs text-brand-text-secondary">DB: {dbCreds.host} / {dbCreds.database} ({dbCreds.user})</p>
                )}
                {ftpCreds && (
                    <p className="text-xs text-brand-text-secondary">FTP: {ftpCreds.host}:{ftpCreds.port} ({ftpCreds.user})</p>
                )}
            </div>
            <div className="mt-6 flex gap-4">
                <button
                    onClick={checkStatus}
                    disabled={testing}
                    className="bg-brand-border hover:bg-brand-border/70 text-brand-text font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50"
                >
                    {testing ? 'Probando...' : 'Probar Conexión'}
                </button>
                <button
                    onClick={() => setShowCreds(true)}
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg shadow-md"
                >
                    Editar Credenciales
                </button>
                <button
                    onClick={() => setShowFtpCreds(true)}
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg shadow-md"
                >
                    Configurar FTP
                </button>
            </div>
        </div>
    );
};
