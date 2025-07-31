
import React, { useState, useEffect } from 'react';
import { DbCredentialsModal } from './DbCredentialsModal';
import { APP_VERSION, APP_BUILD } from '../version';

interface LoginViewProps {
    onLogin: (user: string, pass: string) => boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [publicIp, setPublicIp] = useState('');
    const [dbConnected, setDbConnected] = useState<boolean | null>(null);
    const [dbError, setDbError] = useState('');
    const [showCreds, setShowCreds] = useState(false);

    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then(r => r.json())
            .then(d => setPublicIp(d.ip))
            .catch(() => setPublicIp('Desconocida'));

        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            setDbConnected(data.connected);
            setDbError(data.error || '');
        } catch (e) {
            setDbConnected(false);
            setDbError('No se pudo conectar con la API.');
        }
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (onLogin(username, password)) {
            // Success, parent will handle view change
        } else {
            setError('Usuario o contraseña incorrectos.');
            setAttempts(a => a + 1);
            if (attempts + 1 >= 3) {
                if (confirm('¿Deseas usar las credenciales locales Admin/Admin?')) {
                    setUsername('Admin');
                    setPassword('Admin');
                }
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <DbCredentialsModal isOpen={showCreds} onClose={() => setShowCreds(false)} onSave={updateCreds} />
            <div className="w-full max-w-sm mx-auto bg-brand-surface rounded-lg p-8 shadow-2xl animate-fade-in">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-brand-text">Bienvenido</h1>
                    <p className="text-brand-text-secondary mt-2">Inicia sesión para continuar</p>
                    {publicIp && (
                        <p className="text-xs text-brand-text-secondary mt-2">IP Pública: {publicIp}</p>
                    )}
                    {dbConnected === false && (
                        <div className="text-red-400 text-xs mt-2">
                            Error DB: {dbError}
                            <div className="mt-1 flex gap-2 justify-center">
                                <button type="button" onClick={checkStatus} className="underline">Reintentar</button>
                                <button type="button" onClick={() => setShowCreds(true)} className="underline">Editar credenciales</button>
                            </div>
                        </div>
                    )}
                    {dbConnected && <p className="text-xs text-green-500 mt-2">DB conectada</p>}
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-brand-text-secondary mb-1">Usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-md p-3 focus:ring-brand-primary focus:border-brand-primary transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-md p-3 focus:ring-brand-primary focus:border-brand-primary"
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}
                    <div>
                        <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50">
                            Iniciar Sesión
                        </button>
                    </div>
                </form>
                <p className="mt-4 text-xs text-brand-text-secondary text-center">v{APP_VERSION} build {APP_BUILD}</p>
            </div>
        </div>
    );
};