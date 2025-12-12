import { saveHistory } from './historyService';

// Poe API configuration
const POE_API_URL = "https://api.poe.com/v1/chat/completions";
const MODEL_NAME = "claude-sonnet-4.5"; // As per Poe documentation/screenshot

const getApiKey = () => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Please ensure VITE_CLAUDE_API_KEY is set in .env.local");
    }
    return apiKey;
};

// Generic content generation function with retry logic
export const generateContent = async (prompt: string): Promise<string> => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const apiKey = getApiKey();

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
