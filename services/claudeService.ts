import Anthropic from "@anthropic-ai/sdk";

let anthropic: Anthropic | null = null;

const getAnthropicClient = () => {
    if (!process.env.CLAUDE_API_KEY) {
        throw new Error("CLAUDE_API_KEY environment variable is not set. Please configure it in your deployment settings.");
    }
    if (!anthropic) {
        anthropic = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY,
            dangerouslyAllowBrowser: true
        });
    }
    return anthropic;
};

// Generic content generation function with retry logic
export const generateContent = async (prompt: string): Promise<string> => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const client = getAnthropicClient();

            const response = await client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 8000,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            // Extract text from response
            const textContent = response.content.find(block => block.type === 'text');
            if (textContent && 'text' in textContent) {
                return textContent.text;
            }

            throw new Error("No text content in response");
        } catch (error: any) {
            console.error(`Error calling Claude API (attempt ${attempt + 1}/${maxRetries}):`, error);

            // Check if it's an overload error or rate limit
            const isRetryableError = error?.status === 529 ||
                error?.status === 503 ||
                error?.error?.type === 'overloaded_error';

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
