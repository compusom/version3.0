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
logs and attempt to delete the same data on the remote server.
