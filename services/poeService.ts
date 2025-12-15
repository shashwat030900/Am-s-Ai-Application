import { saveHistory } from './historyService';

// Poe API configuration
// NOTE: This URL is likely a placeholder or requires a specific reverse-proxy. 
// Standard Poe API usage is via the Poe platform's official bot creation tools usually.
const POE_API_URL = "https://api.poe.com/v1/chat/completions";
const MODEL_NAME = "claude-sonnet-4.5"; // As per Poe documentation/screenshot

const getApiKey = () => {
    // Check various environment variable possibilities
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY ||
        process.env.CLAUDE_API_KEY ||
        import.meta.env.VITE_POE_API_KEY ||
        process.env.POE_API_KEY;

    if (!apiKey) {
        console.error("Missing API Key. Checked VITE_CLAUDE_API_KEY and VITE_POE_API_KEY.");
        throw new Error("Poe/Claude API Key is missing. Please add VITE_CLAUDE_API_KEY to your .env.local file. Note: Poe App credits do NOT automatically enable API access.");
    }
    return apiKey;
};

// Generic content generation function with retry logic
export const generateContent = async (prompt: string): Promise<string> => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    console.log("Generating content with Poe Service...");

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const apiKey = getApiKey();

            console.log(`Sending request to ${POE_API_URL} (Attempt ${attempt + 1})`);

            const response = await fetch(POE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Poe API Error Response:", errorData);
                throw new Error(`Poe API returned ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // OpenAI-compatible format
            const textContent = data.choices?.[0]?.message?.content;

            if (textContent) {
                return textContent;
            }

            throw new Error("No text content in response");
        } catch (error: any) {
            console.error(`Error calling Poe API (attempt ${attempt + 1}/${maxRetries}):`, error);

            // Check if it's a retryable error (network issues, 5xx server errors, rate limits)
            const isRetryableError =
                error?.message?.includes('429') ||
                error?.message?.includes('50') ||
                error?.message?.includes('Failed to fetch');

            // If it's the last attempt or not a retryable error, throw
            if (attempt === maxRetries - 1 || !isRetryableError) {
                if (error instanceof Error) {
                    throw new Error(`AI generation failed: ${error.message}`);
                }
                throw new Error("The AI model failed to respond. Please check your API key and try again.");
            }

            // Wait before retrying (exponential backoff)
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error("Failed after multiple retries. Please try again later.");
};
