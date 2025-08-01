# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Reset Data

If you need to wipe all stored data and logs, open the **Control Panel** screen
and use the **Factory Reset** button. This will clear all local tables, remove

logs and attempt to delete the same data on the remote server. To allow
re-importing files that were previously uploaded, use the **Reiniciar Cache**
button found in the same section.


## Versioning

Cada vez que se realice un cambio en el código se debe incrementar el número **build** en [`version.ts`](version.ts). Una vez que las funcionalidades estén confirmadas se actualizará el número de versión siguiendo indicaciones del responsable.
