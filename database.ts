import { Client, User, PerformanceRecord, AllLookerData, BitacoraReport, UploadedVideo, ImportBatch, MetaApiConfig, ProcessedHashes } from './types';

// Database helper that can work with either the new backend API
// (which persists data in PostgreSQL) or fall back to localStorage
// when no connection is available.

const ARTIFICIAL_DELAY_MS = 400;
const API_BASE = '/api';

type DbConnectionStatus = {
    connected: boolean;
};

// This state is controlled by the App component
export const dbConnectionStatus: DbConnectionStatus = {
    connected: false,
};

const checkConnection = (): boolean => {
    if (!dbConnectionStatus.connected) {
        console.warn('[DB] Remote database not connected, using localStorage');
        return false;
    }
    return true;
};

const simulateQuery = <T>(action: () => T): Promise<T> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Connection is checked inside the action to allow config to be read before connection.
                const result = action();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, ARTIFICIAL_DELAY_MS);
    });
};

const CLEAR_ALL_KEYS = [
    'db_clients',
    'db_users',
    'db_performance_data',
    'db_looker_data',
    'db_bitacora_reports',
    'db_uploaded_videos',
    'db_import_history',
    'db_processed_files_hashes',
    'current_client_id',
    'logged_in_user'
];

const db = {
    async select<T>(table: string, defaultValue: T): Promise<T> {
        // Allow reading config before connection is established
        const useRemote = table !== 'config' && checkConnection();
        console.log(`[DB] Executing: SELECT * FROM ${table};`);


        if (dbConnectionStatus.connected) {

            try {
                const res = await fetch(`${API_BASE}/kv/${table}`);
                if (res.ok) {
                    const json = await res.json();
                    return json.value ?? defaultValue;
                }
                throw new Error(`HTTP ${res.status}`);
            } catch (e) {
                console.error(`[DB] Remote select failed for ${table}:`, e);
                dbConnectionStatus.connected = false;
            }
        }

        return simulateQuery(() => {
            try {
                const data = localStorage.getItem(`db_${table}`);
                return data ? JSON.parse(data) : defaultValue;
            } catch (e) {
                console.error(`[DB] Error parsing table ${table}:`, e);
                return defaultValue;
            }
        });
    },

    async update(table: string, data: any): Promise<void> {
        // Allow writing config before connection is established
        const useRemote = table !== 'config' && checkConnection();
        console.log(`[DB] Executing: UPDATE ${table} with new data...`);


        if (dbConnectionStatus.connected) {

            try {
                const res = await fetch(`${API_BASE}/kv/${table}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return;
            } catch (e) {
                console.error(`[DB] Remote update failed for ${table}:`, e);
                dbConnectionStatus.connected = false;
            }
        }

        return simulateQuery(() => {
            try {
                localStorage.setItem(`db_${table}`, JSON.stringify(data));
            } catch (e) {
                console.error(`[DB] Error writing to table ${table}:`, e);
                if (e instanceof DOMException && (e.name === 'QuotaExceededError' || (e as any).code === 22)) {
                    alert(`Error: El almacenamiento est\xE1 lleno. No se pudieron guardar los datos en la tabla \"${table}\". Libere espacio desde el Panel de Control.`);
                }
            }
        });
    },

    async clearTable(table: string): Promise<void> {
        const useRemote = checkConnection();
        console.log(`[DB] Executing: DELETE FROM ${table};`);


        if (dbConnectionStatus.connected) {

            try {
                const res = await fetch(`${API_BASE}/kv/${table}`, { method: 'DELETE' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return;
            } catch (e) {
                console.error(`[DB] Remote clear failed for ${table}:`, e);
                dbConnectionStatus.connected = false;
            }
        }

        return simulateQuery(() => {
            localStorage.removeItem(`db_${table}`);
        });
    },

    async clearAllData(): Promise<void> {
        checkConnection();
        console.log(`[DB] Executing: CLEAR ALL USER DATA;`);

        for (const key of CLEAR_ALL_KEYS) {
            try {
                await fetch(`${API_BASE}/kv/${key}`, { method: 'DELETE' });
            } catch (e) {
                console.warn(`[DB] Failed clearing ${key} remotely`, e);
            }
        }

        return simulateQuery(() => {
            CLEAR_ALL_KEYS.forEach(key => localStorage.removeItem(key));

            // Clear all analysis cache keys
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('metaAdCreativeAnalysis_')) {
                    localStorage.removeItem(key);
                }
            });
        });
    },
    
    async factoryReset(): Promise<void> {
        // No connection check needed for a full reset
        console.log(`[DB] Executing: FACTORY RESET;`);

        if (dbConnectionStatus.connected) {
            try {
                await fetch(`${API_BASE}/factory-reset`, { method: 'POST' });
            } catch {}
        }

        return simulateQuery(() => {
            localStorage.clear();
        });
    }
};

export default db;

// Type-safe wrappers for convenience
export const dbTyped = {
    getUsers: () => db.select<User[]>('users', []),
    saveUsers: (users: User[]) => db.update('users', users),
    
    getClients: () => db.select<Client[]>('clients', []),
    saveClients: (clients: Client[]) => db.update('clients', clients),

    getPerformanceData: () => db.select<{[key: string]: PerformanceRecord[]}>('performance_data', {}),
    savePerformanceData: (data: {[key:string]: PerformanceRecord[]}) => db.update('performance_data', data),

    getLookerData: () => db.select<AllLookerData>('looker_data', {}),
    saveLookerData: (data: AllLookerData) => db.update('looker_data', data),
    
    getBitacoraReports: () => db.select<BitacoraReport[]>('bitacora_reports', []),
    saveBitacoraReports: (reports: BitacoraReport[]) => db.update('bitacora_reports', reports),
    
    getUploadedVideos: () => db.select<UploadedVideo[]>('uploaded_videos', []),
    saveUploadedVideos: (videos: UploadedVideo[]) => db.update('uploaded_videos', videos),

    getImportHistory: () => db.select<ImportBatch[]>('import_history', []),
    saveImportHistory: (history: ImportBatch[]) => db.update('import_history', history),

    getLoggedInUser: () => db.select<User | null>('logged_in_user', null),
    saveLoggedInUser: (user: User | null) => db.update('logged_in_user', user),

    getMetaApiConfig: () => db.select<MetaApiConfig | null>('config', null),
    saveMetaApiConfig: (config: MetaApiConfig | null) => db.update('config', config),

    getProcessedHashes: () => db.select<ProcessedHashes>('processed_files_hashes', {}),
    saveProcessedHashes: (hashes: ProcessedHashes) => db.update('processed_files_hashes', hashes),
};
