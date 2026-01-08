import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Terminal log for debugging (only presence, not values)
  console.log('--- Vite Config Env Debug ---');
  console.log('Mode:', mode);
  console.log('CWD:', process.cwd());
  console.log('Keys found in .env:', Object.keys(env).filter(k => k.includes('API') || k.includes('KEY') || k.includes('VITE')));
  console.log('-----------------------------');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/agent': {
          target: 'http://localhost:3001',
          changeOrigin: true
        },
        '/api/apify': {
          target: 'https://api.apify.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/apify/, '')
        }
      }
    },
    plugins: [react()],
    define: {
      // Support both VITE_GEMINI_API_KEY (production) and API_KEY/GEMINI_API_KEY (legacy)
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY || env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY),
      'process.env.CLAUDE_API_KEY': JSON.stringify(env.VITE_CLAUDE_API_KEY || env.CLAUDE_API_KEY),
      'import.meta.env.VITE_APIFY_API_TOKEN': JSON.stringify(env.VITE_APIFY_API_TOKEN),
      'import.meta.env.VITE_GOOGLE_API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY || env.API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'import.meta.env.VITE_EMAILJS_SERVICE_ID': JSON.stringify(env.VITE_EMAILJS_SERVICE_ID),
      'import.meta.env.VITE_EMAILJS_TEMPLATE_ID': JSON.stringify(env.VITE_EMAILJS_TEMPLATE_ID),
      'import.meta.env.VITE_EMAILJS_PUBLIC_KEY': JSON.stringify(env.VITE_EMAILJS_PUBLIC_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
