# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
   and configure the following variables for database and FTP access:

   ```
   DB_HOST=Pulseweb.com.ar
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASS=your_db_password

   FTP_HOST=ftp.pulseweb.com.ar
   FTP_PORT=21
   FTP_USER=your_ftp_user
   FTP_PASS=your_ftp_password
   ```

3. Run the app:
   `npm run dev`
