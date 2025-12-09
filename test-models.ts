import { GoogleGenAI } from "@google/genai";

const main = async () => {
    if (!process.env.API_KEY) {
        console.error("API_KEY not set");
        return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        console.log("Listing models...");
        // Note: The SDK might not have a direct listModels method exposed easily in all versions, 
        // but let's try to infer or just test a few likely names.

        // Test "nano-banana"
        try {
            console.log("Testing 'nano-banana'...");
            await ai.models.generateContent({
                model: 'nano-banana',
                contents: 'test',
            });
            console.log("SUCCESS: 'nano-banana' exists!");
        } catch (e: any) {
            console.log(`'nano-banana' failed: ${e.message}`);
        }

        // Test "imagen-3.0-generate-001"
        try {
            console.log("Testing 'imagen-3.0-generate-001'...");
            // Imagen usually uses a different method or endpoint, but let's try generateContent first 
            // or check if there's a specific image generation method in the SDK.
            // The @google/genai SDK is new. Let's check its capabilities.
            await ai.models.generateContent({
                model: 'imagen-3.0-generate-001',
                contents: 'test',
            });
            console.log("SUCCESS: 'imagen-3.0-generate-001' exists!");
        } catch (e: any) {
            console.log(`'imagen-3.0-generate-001' failed: ${e.message}`);
        }

    } catch (error) {
        console.error("Error:", error);
    }
};

main();
