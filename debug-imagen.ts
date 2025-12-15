import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

const loadEnvLocal = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            const envVars: Record<string, string> = {};
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, '');
                    envVars[key] = value;
                }
            });
            return envVars;
        }
    } catch (e) {
        console.error("Error reading .env.local", e);
    }
    return {};
};

const main = async () => {
    const envLocal = loadEnvLocal();
    const apiKey = process.env.API_KEY ||
        envLocal.API_KEY ||
        envLocal.VITE_GEMINI_API_KEY ||
        envLocal.GEMINI_API_KEY ||
        envLocal.VITE_GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("CRITICAL: No API Key found");
        process.exit(1);
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = "A photorealistic image of a futuristic city";

    console.log(`\n--- Config ---`);
    console.log(`API Key: ${apiKey.substring(0, 5)}...`);
    console.log(`Prompt: ${prompt}`);

    console.log(`\n--- Testing image generation ---`);

    // List of models to try
    const models = [
        'imagen-3.0-generate-001',
        'gemini-2.0-flash-exp'
    ];

    for (const model of models) {
        console.log(`\nTrying model: ${model}`);
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: model.includes('imagen') ? prompt : `Generate an image: ${prompt}`,
            });

            console.log(`SUCCESS with ${model}`);

            if (response.candidates && response.candidates[0]?.content?.parts) {
                const parts = response.candidates[0].content.parts;
                const imagePart = parts.find((p: any) => p.inlineData && p.inlineData.mimeType.startsWith('image/'));

                if (imagePart) {
                    console.log(`Image generated! MimeType: ${imagePart.inlineData.mimeType}, Data Length: ${imagePart.inlineData.data.length}`);
                } else {
                    console.log("Response received but NO image part found.");
                    console.log("Parts:", JSON.stringify(parts, null, 2));
                }
            } else {
                console.log("No candidates/content in response.");
            }

        } catch (error: any) {
            console.error(`FAILED with ${model}`);
            console.error(`Error Message: ${error.message}`);
            if (error.response) {
                console.error(`Full Error Response:`, JSON.stringify(error.response, null, 2));
            }
        }
    }
};

main();
