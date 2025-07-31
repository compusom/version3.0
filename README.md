# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. (Optional) Configure PostgreSQL connection by setting `DB_HOST`, `DB_NAME`, `DB_USER` and `DB_PASS` in the environment. Defaults are provided.
3. Start the API server to enable remote storage:
   `npm run server`
4. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
5. Run the app:
   `npm run dev`
