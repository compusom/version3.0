import React, { useEffect, useState } from 'react';
import { FtpCredentialsModal } from './FtpCredentialsModal';

export const FtpConnectionView: React.FC = () => {
    const [ftpConnected, setFtpConnected] = useState<boolean | null>(null);
    const [ftpError, setFtpError] = useState('');
    const [showCreds, setShowCreds] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        setTesting(true);
        try {
            const res = await fetch('/api/ftp-status');
            const data = await res.json();
            setFtpConnected(data.connected);
            setFtpError(data.error || '');
        } catch (e) {
            setFtpConnected(false);
            setFtpError('No se pudo conectar con la API.');
        }
        setTesting(false);
    };

    const updateCreds = async (c: { host: string; port: string; user: string; password: string }) => {
        try {
            const res = await fetch('/api/set-ftp-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(c)
            });
            const data = await res.json();
            if (data.success) {
                setFtpConnected(true);
                setFtpError('');
            } else {
                setFtpConnected(false);
                setFtpError(data.error || 'Error');
            }
        } catch (e) {
            setFtpConnected(false);
            setFtpError('No se pudo conectar con la API.');
        } finally {
            setShowCreds(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-brand-surface rounded-lg p-8 shadow-lg animate-fade-in">
            <FtpCredentialsModal isOpen={showCreds} onClose={() => setShowCreds(false)} onSave={updateCreds} />
            <h2 className="text-2xl font-bold text-brand-text mb-4">Conexión FTP</h2>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Estado:</span>
                    {ftpConnected === null && <span>...</span>}
                    {ftpConnected && <span className="text-green-400">Conectado</span>}
                    {ftpConnected === false && <span className="text-red-400">Desconectado</span>}
                </div>
                {ftpConnected === false && <p className="text-xs text-red-400">{ftpError}</p>}
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
            </div>
        </div>
    );
};
