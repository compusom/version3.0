# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend / PostgreSQL

The accompanying `server.js` process stores data in a PostgreSQL database.
Configure the connection using the `DB_HOST`, `DB_NAME`, `DB_USER` and
`DB_PASS` environment variables or via the **Editar Credenciales** dialog in the
UI. FTP uploads use `FTP_HOST`, `FTP_PORT`, `FTP_USER` and `FTP_PASS`, which can
also be set from the **Configurar FTP** dialog. When deploying on platforms such
as Netlify you must run this Node server separately.

## Reset Data

If you need to wipe all stored data and logs, open the **Control Panel** screen
and use the **Factory Reset** button. This will clear all local tables, remove
logs and attempt to delete the same data on the remote server. To allow
re-importing files that were previously uploaded, use the **Reiniciar Cache**
button found in the same section.

## Versioning

Cada vez que se realice un cambio en el código se debe incrementar el número **build** en [`version.ts`](version.ts). Una vez que las funcionalidades estén confirmadas se actualizará el número de versión siguiendo indicaciones del responsable.
