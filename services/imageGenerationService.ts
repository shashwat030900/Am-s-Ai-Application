import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
    // Check various possible environment variable names
    const apiKey = process.env.API_KEY ||
        import.meta.env.VITE_GEMINI_API_KEY ||
        import.meta.env.VITE_GOOGLE_API_KEY ||
        import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("CRITICAL ERROR: No API Key found in environment variables (checked API_KEY, VITE_GEMINI_API_KEY, etc)");
        throw new Error("API_KEY environment variable is not set. Please configure it in your deployment settings.");
    }

    if (!ai) {
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export interface SceneImagePrompt {
    sceneIndex: number;
    sceneName: string;
    visualDescription: string;
    onScreenText: string;
}

export interface GeneratedSceneImage {
    sceneIndex: number;
    sceneName: string;
    imageUrl: string;
    prompt: string;
}

/**
 * Download a scene image as PNG file
 */
export const downloadSceneImage = (sceneImage: GeneratedSceneImage) => {
    const link = document.createElement('a');
    link.download = `scene-${sceneImage.sceneIndex + 1}-${sceneImage.sceneName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    link.href = sceneImage.imageUrl;
    link.click();
};

/**
 * Generate an image for a scene using Google Gemini's Imagen model
 */
export const generateSceneImage = async (
    scenePrompt: SceneImagePrompt
): Promise<GeneratedSceneImage> => {
    // Create a detailed image generation prompt
    // Create a detailed image generation prompt focused on the visual description
    const imagePrompt = `Generate a photorealistic image based on this specific visual description: "${scenePrompt.visualDescription}"

    Context: Scene type is ${scenePrompt.sceneName}.
    
    Style: Award-winning documentary photography. 8k resolution. Hyper-realistic. Cinematic lighting. Authentic real-life texture. Depth of field. No text overlay on the image itself. 16:9 aspect ratio. Looks like a real photo taken by a professional photographer.`;

    // Use 'nano banana' (Imagen 3) as requested
    const modelNames = [
        'gemini-2.5-flash-image'
    ];

    console.log(`[ImageGen] Starting generation for scene: ${scenePrompt.sceneName}`);

    for (const modelName of modelNames) {
        try {
            console.log(`[ImageGen] Attempting with model (Nano Banana): ${modelName}`);
            const localAi = getAiClient();

            // Explicitly request image generation
            const finalPrompt = imagePrompt;

            const response = await localAi.models.generateContent({
                model: modelName,
                contents: finalPrompt,
            });

            console.log(`[ImageGen] Response received from ${modelName}`, response);

            // Check for image data in response
            if (response.candidates && response.candidates[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        console.log(`[ImageGen] Success! Image found.`);
                        return {
                            sceneIndex: scenePrompt.sceneIndex,
                            sceneName: scenePrompt.sceneName,
                            imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                            prompt: imagePrompt
                        };
                    }
                }
            }

            console.warn(`[ImageGen] Model ${modelName} returned data but NO image found within it.`);

        } catch (error: any) {
            console.error(`[ImageGen] Failed to generate image with ${modelName}:`, error);
            // Log full error object if possible
            if (error.response) console.error('[ImageGen] Error Response:', JSON.stringify(error.response, null, 2));
        }
    }

    // Fallback to placeholder if Nano Banana fails
    console.log("[ImageGen] Nano Banana (Imagen 3) failed. Falling back to placeholder.");

    // We strictly removed Pollinations AI as requested.

    try {
        const placeholderImage = createPlaceholderImage(scenePrompt);
        return {
            sceneIndex: scenePrompt.sceneIndex,
            sceneName: scenePrompt.sceneName,
            imageUrl: placeholderImage,
            prompt: imagePrompt
        };
    } catch (error) {
        console.error('Error generating fallback image:', error);
        // Last resort fallback
        const placeholderImage = createPlaceholderImage(scenePrompt);
        return {
            sceneIndex: scenePrompt.sceneIndex,
            sceneName: scenePrompt.sceneName,
            imageUrl: placeholderImage,
            prompt: imagePrompt
        };
    }
};

/**
 * Create a styled placeholder image with scene information
 */
const createPlaceholderImage = (scenePrompt: SceneImagePrompt): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return createErrorPlaceholder(scenePrompt.sceneName);
    }

    // Gradient background based on scene type
    const gradients: Record<string, [string, string]> = {
        'ATTENTION': ['#8b5cf6', '#06b6d4'],
        'INTEREST': ['#06b6d4', '#10b981'],
        'DESIRE': ['#10b981', '#f59e0b'],
        'CONVICTION': ['#f59e0b', '#ef4444'],
        'ACTION': ['#ef4444', '#8b5cf6']
    };

    // Draw a subtle pattern or gradient - NO TEXT
    const sceneType = scenePrompt.sceneName.split(':')[0].trim();
    const [color1, color2] = gradients[sceneType] || ['#8b5cf6', '#06b6d4'];

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add a simple camera icon in the center to indicate it's a visual placeholder
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    // Simple camera outline
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const w = 200;
    const h = 140;
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();

    // NO TEXT DRAWING AT ALL
    // The user explicitly requested NO TEXT in the visuals.

    return canvas.toDataURL('image/png');

    // Add decorative elements
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

    return canvas.toDataURL('image/png');
};

/**
 * Create an error placeholder image
 */
const createErrorPlaceholder = (sceneName: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw an error icon (Exclamation mark in circle) - NO TEXT
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 15;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Circle
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Exclamation point
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(cx - 10, cy - 40, 20, 80, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + 60, 12, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL('image/png');
};

/**
 * Extract scene information from a full script
 */
export const extractScenesFromScript = (fullScript: string): SceneImagePrompt[] => {
    const scenes: SceneImagePrompt[] = [];

    // Split the script into potential sections
    const rawSections = fullScript.split(/📍\s*SECTION\s+\d+:/i);

    // Skip the first chunk (intro text)
    rawSections.slice(1).forEach((sectionText, idx) => {
        // Extract scene name (first line usually)
        const nameMatch = sectionText.match(/^([^\n]+)/);
        const rawName = nameMatch ? nameMatch[1].trim() : `Scene ${idx + 1}`;

        // Clean up name (remove timing info if present)
        const cleanName = rawName.split('(')[0].trim();

        // Extract visual description - support both "Visual Scene:" and "Visual:"
        const visualMatch = sectionText.match(/Visual(?: Scene)?:\s*([^\n]+)/i);
        const visualDescription = visualMatch ? visualMatch[1].trim() : '';

        // Extract on-screen text
        const textMatch = sectionText.match(/On-Screen Text:\s*([^\n]+)/i);
        const onScreenText = textMatch ? textMatch[1].trim() : '';

        if (visualDescription) {
            scenes.push({
                sceneIndex: idx,
                sceneName: cleanName,
                visualDescription,
                onScreenText
            });
        }
    });

    console.log(`[ImageGen] Extracted ${scenes.length} scenes from script.`);
    return scenes;
};

/**
 * Generate images for all scenes in a script
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate images for all scenes in a script
 * Using sequential processing and retries to handle rate limits
 */
export const generateAllSceneImages = async (
    fullScript: string,
    onProgress?: (current: number, total: number) => void
): Promise<GeneratedSceneImage[]> => {
    const scenePrompts = extractScenesFromScript(fullScript);
    const images: GeneratedSceneImage[] = [];

    // Helper to generate with retries
    const generateWithRetry = async (prompt: SceneImagePrompt, attempt = 1, maxAttempts = 3): Promise<GeneratedSceneImage> => {
        try {
            return await generateSceneImage(prompt);
        } catch (error: any) {
            // Check for rate limit (429) or overload (503)
            const isRateLimit = error?.message?.includes('429') || error?.status === 429;
            const isOverloaded = error?.message?.includes('503') || error?.status === 503;

            if ((isRateLimit || isOverloaded) && attempt < maxAttempts) {
                // Exponential backoff: 5s, 10s, 20s
                const delay = 5000 * Math.pow(2, attempt - 1);
                console.warn(`[ImageGen] Rate limited. Retrying scene ${prompt.sceneIndex} in ${delay}ms... (Attempt ${attempt}/${maxAttempts})`);
                await wait(delay);
                return generateWithRetry(prompt, attempt + 1, maxAttempts);
            }
            throw error;
        }
    };

    console.log(`[ImageGen] Starting sequential generation for ${scenePrompts.length} scenes...`);

    for (let i = 0; i < scenePrompts.length; i++) {
        if (onProgress) {
            onProgress(i, scenePrompts.length);
        }

        try {
            // Generate ONE by ONE to avoid hitting rate limits
            const image = await generateWithRetry(scenePrompts[i]);
            images.push(image);

            // Add a small delay between successful requests too, just to be safe
            if (i < scenePrompts.length - 1) {
                await wait(2000);
            }

        } catch (error) {
            console.error(`Failed to generate image for scene ${i}:`, error);
            // If it fails after retries, we push a fallback (which is now text-free)
            // But we should try/catch inside generateSceneImage to ensure it returns a fallback object
            // Use the fallback from the service if generateSceneImage threw
            try {
                const fallback = {
                    sceneIndex: scenePrompts[i].sceneIndex,
                    sceneName: scenePrompts[i].sceneName,
                    imageUrl: createErrorPlaceholder(scenePrompts[i].sceneName),
                    prompt: scenePrompts[i].visualDescription
                };
                images.push(fallback);
            } catch (e) {
                console.error("Critical error creating fallback", e);
            }
        }
    }

    if (onProgress) {
        onProgress(scenePrompts.length, scenePrompts.length);
    }

    return images;
};
