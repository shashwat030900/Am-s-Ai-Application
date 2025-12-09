# Deployment Instructions

## Environment Variables for Production

When deploying to Vercel, Netlify, or other hosting platforms, you need to set the following environment variables:

### Required Variables

1. **VITE_GEMINI_API_KEY** (or GEMINI_API_KEY)
   - Your Google Gemini API key
   - Get it from: https://aistudio.google.com/app/apikey
   - **Important**: Use the `VITE_` prefix for production builds

2. **VITE_EMAILJS_SERVICE_ID**
   - Your EmailJS Service ID
   - Get from: https://dashboard.emailjs.com/

3. **VITE_EMAILJS_TEMPLATE_ID**
   - Your EmailJS Template ID
   - Get from: https://dashboard.emailjs.com/

4. **VITE_EMAILJS_PUBLIC_KEY**
   - Your EmailJS Public Key
   - Get from: https://dashboard.emailjs.com/

### Vercel Deployment

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each variable listed above
4. Select **All Environments** (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your application

### Important Notes

- The app supports both `VITE_GEMINI_API_KEY` and `GEMINI_API_KEY` (or `API_KEY`)
- For production, always use the `VITE_` prefix
- After adding environment variables, you MUST redeploy
- Variables are injected at build time, not runtime

## Local Development

For local development, create a `.env.local` file (copy from `.env.template`):

```bash
cp .env.template .env.local
```

Then fill in your actual values. You can use either naming convention locally:
- `VITE_GEMINI_API_KEY` (recommended)
- `API_KEY` or `GEMINI_API_KEY` (legacy, still works)

## Hostinger / Shared Hosting Deployment

Since this is a client-side React application (Single Page Application - SPA), you can host it on any shared hosting like Hostinger.

### 1. Build the Application
Run the build command on your local machine:
```bash
npm run build
```
This will create a `dist` folder in your project directory containing the production-ready files.

### 2. Upload Files
1.  Log in to your Hostinger Control Panel (hPanel).
2.  Go to **File Manager**.
3.  Navigate to `public_html`.
4.  **Upload the CONTENTS of the `dist` folder** (index.html, assets folder, etc.) directly into `public_html`.
    *   *Do NOT upload the `dist` folder itself, just the files inside it.*

### 3. Setup Client-Side Routing (.htaccess)
To make navigation work (so refreshing a page like `/dashboard` doesn't give a 404 error), you must create an `.htaccess` file.

1.  In **File Manager** (inside `public_html`), create a new file named `.htaccess`.
2.  Paste the following configuration:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

3.  Save the file.

### 4. Environment Variables
On shared hosting, you cannot set environment variables in a dashboard like Vercel. You must embed them during the build process.
Make sure your `.env.local` file has the correct `VITE_` prefixed variables **BEFORE** you run `npm run build`. The build process will replace the variables with their actual values in the generated JavaScript files.

