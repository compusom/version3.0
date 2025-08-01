# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and update the values. At a minimum you
   should provide your `GEMINI_API_KEY` and the PostgreSQL connection settings
   (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).

3. Run the app (the dev script uses `vite --host` so the app is accessible across your LAN):
   `npm run dev`
   If the PostgreSQL server is unreachable, the app falls back to local storage automatically.

4. The app automatically signs in with the first user (default `Admin`/`Admin`).
5. If the SQL connection fails you can update the credentials from the **Conexión a SQL** screen located in the **Control Panel**.

## Reset Data

If you need to wipe all stored data and logs, open the **Control Panel** screen
and use the **Factory Reset** button. This will clear all local tables, remove

logs and attempt to delete the same data on the remote server. To allow
re-importing files that were previously uploaded, use the **Reiniciar Cache**
button found in the same section.


## Versioning

Cada vez que se realice un cambio en el código se debe incrementar el número **build** en [`version.ts`](version.ts). Una vez que las funcionalidades estén confirmadas se actualizará el número de versión siguiendo indicaciones del responsable.
