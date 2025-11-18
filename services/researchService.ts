
import { GoogleGenAI } from "@google/genai";

// Lazily initialize the AI client to avoid a hard crash on startup if the API key is missing.
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set. Please configure it in your deployment settings.");
    }
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export interface ResearchResult {
    text: string;
    sources: { web: { uri: string; title: string } }[];
}

const constructPrompt = (topic: string): string => {
  return `
You are a highly skilled AI Research Assistant. Your task is to conduct thorough, unbiased, and comprehensive research on the given topic using Google Search.

**Research Topic:** "${topic}"

Please provide a detailed summary of your findings. The summary should be well-structured, easy to understand, and cover the key aspects of the topic. Use Markdown for formatting (headings, lists, bold text, etc.).

At the end of your summary, you MUST cite all the web sources you used.
`;
};

export const conductResearch = async (topic: string): Promise<ResearchResult> => {
    const prompt = constructPrompt(topic);

    try {
        const localAi = getAiClient();
        const response = await localAi.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        // Filter for web sources and ensure they are unique
        const webSources: { web: { uri: string; title: string } }[] = [];
        const seenUris = new Set<string>();

        for (const chunk of groundingChunks) {
            if (chunk.web && chunk.web.uri && !seenUris.has(chunk.web.uri)) {
                webSources.push(chunk as { web: { uri: string; title: string } });
                seenUris.add(chunk.web.uri);
            }
        }

        return {
            text: response.text,
            sources: webSources
        };
    } catch (error) {
        console.error("Error calling Gemini API for research:", error);
        if (error instanceof Error) {
            throw new Error(`The AI model failed to respond: ${error.message}`);
        }
        throw new Error("The AI model failed to respond. Please try again later.");
    }
};
