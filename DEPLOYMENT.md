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
