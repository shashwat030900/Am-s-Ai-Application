import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

// Manual .env.local parser since dotenv doesn't default to it
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
                    const value = match[2].trim().replace(/^["']|["']$/g, ''); // remove quotes
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

    // Check all possible key names
    const apiKey = process.env.API_KEY ||
        envLocal.API_KEY ||
        envLocal.VITE_GEMINI_API_KEY ||
        envLocal.GEMINI_API_KEY ||
        envLocal.VITE_GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("CRITICAL: No API Key found in .env.local or process.env");
        console.log("Keys found in .env.local:", Object.keys(envLocal));
        process.exit(1);
    }

    console.log(`Found API Key: ${apiKey.substring(0, 5)}...`);

    const ai = new GoogleGenAI({ apiKey });

    console.log("Testing image generation with Nano Banana (Imagen 3)...");

    const prompt = "A futuristic city with flying cars, cinematic lighting, photorealistic";

    // Test Imagen 3 ONLY
    /*
    try {
        console.log("\n--- Testing imagen-3.0-generate-001 ---");
        const response = await ai.models.generateContent({
            model: 'imagen-3.0-generate-001',
            contents: prompt,
        });

        console.log("Response received!");
        // console.log(JSON.stringify(response, null, 2));

        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    console.log("SUCCESS: Image data found in response!");
                    return;
                }
            }
        }
        console.error("FAILURE: Response received but no image data found.");
        if (response.candidates && response.candidates.length > 0) {
            console.log("Candidate content parts:", JSON.stringify(response.candidates[0].content?.parts, null, 2));
        }

    } catch (error: any) {
        console.error("Imagen 3 Error:", error.message);
    }
    */

    // Test Gemini 2.0 Flash (Multimodal)
    try {
        console.log("\n--- Testing gemini-2.0-flash-exp ---");
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: `Generate an image of: ${prompt}`,
        });

        console.log("Response received from Gemini 2.0!");

        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    console.log("SUCCESS: Image data found in Gemini 2.0 response!");
                    return;
                }
            }
        }
        console.error("FAILURE: Gemini 2.0 response received but no image data found.");

    } catch (error: any) {
        console.error("Gemini 2.0 Flash Error:", error.message);
    }
};

main();
