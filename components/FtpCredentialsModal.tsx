import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface FtpCreds {
    host: string;
    port: string;
    user: string;
    password: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (c: FtpCreds) => void;
}

export const FtpCredentialsModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
    const [host, setHost] = useState('');
    const [port, setPort] = useState('21');
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            fetch('/api/get-ftp-credentials')
                .then(r => r.json())
                .then(c => {
                    if (c.host) {
                        setHost(c.host);
                        setPort(String(c.port || '21'));
                        setUser(c.user || '');
                    }
                })
                .catch(() => setError('No se pudieron cargar las credenciales actuales'));
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ host, port, user, password });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-brand-surface rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Credenciales FTP</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}
                    <input type="text" placeholder="Host" value={host} onChange={e => setHost(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md p-2" required />
                    <input type="text" placeholder="Puerto" value={port} onChange={e => setPort(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md p-2" required />
                    <input type="text" placeholder="Usuario" value={user} onChange={e => setUser(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md p-2" required />
                    <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md p-2" required />
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="bg-brand-border text-brand-text px-4 py-2 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2 rounded-lg">Guardar</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
