import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export interface ResearchSource {
    uri: string;
    title: string;
}

export interface ResearchResult {
    summary: string;
    contentIdeas: string[];
    sources: ResearchSource[];
}

export const researchTopic = async (topic: string): Promise<ResearchResult> => {
    const prompt = `
Research the topic: "${topic}"

Provide a comprehensive response in the following format:

## Summary
Write a concise 2-3 paragraph summary of the most important and recent information about this topic.

## Content Ideas
List 5-7 specific content ideas that would be valuable for a digital marketing campaign targeting this topic. Each idea should be actionable and unique.

Use real-time web data to ensure the information is current and authoritative.
`;

    try {
        const localAi = getAiClient();
        const response = await localAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            tools: [{
                googleSearch: {}
            }]
        } as any);

        const text = response.text;

        // Extract sources from grounding metadata
        const sources: ResearchSource[] = [];
        const metadata = (response as any).groundingMetadata; // Type assertion for grounding metadata

        if (metadata?.searchEntryPoint?.renderedContent) {
            // Parse grounding metadata if available
            if (metadata.groundingChunks) {
                metadata.groundingChunks.forEach((chunk: any) => {
                    if (chunk.web) {
                        sources.push({
                            uri: chunk.web.uri || '',
                            title: chunk.web.title || 'Untitled'
                        });
                    }
                });
            }
        }

        // Parse the response text to extract summary and content ideas
        const summaryMatch = text.match(/##\s*Summary\s*([\s\S]*?)(?=##|$)/i);
        const ideasMatch = text.match(/##\s*Content Ideas\s*([\s\S]*?)(?=##|$)/i);

        const summary = summaryMatch ? summaryMatch[1].trim() : text;

        // Extract bullet points from content ideas section
        const contentIdeas: string[] = [];
        if (ideasMatch) {
            const ideasText = ideasMatch[1];
            const bullets = ideasText.match(/[-*]\s*(.+)/g);
            if (bullets) {
                bullets.forEach(bullet => {
                    const cleaned = bullet.replace(/^[-*]\s*/, '').trim();
                    if (cleaned) contentIdeas.push(cleaned);
                });
            }
        }

        return {
            summary,
            contentIdeas: contentIdeas.length > 0 ? contentIdeas : ['No specific content ideas extracted. See summary for insights.'],
            sources
        };
    } catch (error) {
        console.error("Error calling Gemini API for research:", error);
        if (error instanceof Error) {
            // Provide more specific error messages
            if (error.message.includes('quota') || error.message.includes('429')) {
                throw new Error('API quota exceeded. Please try using a different API key or wait before trying again.');
            } else if (error.message.includes('API_KEY')) {
                throw new Error('API key is invalid or not configured properly.');
            }
            throw new Error(`Research failed: ${error.message}`);
        }
        throw new Error("Research failed. Please try again later.");
    }
};
