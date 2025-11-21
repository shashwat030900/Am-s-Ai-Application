import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testKey() {
    console.log("Reading .env.local...");
    const envPath = path.join(__dirname, '.env.local');

    if (!fs.existsSync(envPath)) {
        console.error("❌ .env.local file not found!");
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    let apiKey = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('API_KEY=') || trimmed.startsWith('GEMINI_API_KEY=')) {
            const parts = trimmed.split('=');
            if (parts.length >= 2) {
                // Remove quotes if present
                apiKey = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                break;
            }
        }
    }

    if (!apiKey) {
        console.error("❌ API_KEY or GEMINI_API_KEY not found in .env.local");
        return;
    }

    console.log(`Found API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)} (Length: ${apiKey.length})`);

    try {
        console.log("Testing key with GoogleGenAI...");
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Say hello',
        });
        console.log("✅ Success! API Key is valid.");
        console.log("Response:", response.text);
    } catch (error) {
        console.error("❌ API Call Failed!");
        console.error("Error message:", error.message);
        if (error.message.includes("API key not valid")) {
            console.error("👉 CONCLUSION: The key in .env.local is definitely invalid/revoked or not enabled for this API.");
        }
    }
}

testKey();
