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

export interface ContentIdea {
    title: string;
    description: string;
}

export interface ResearchResult {
    summary: string;
    contentIdeas: ContentIdea[];
    sources: ResearchSource[];
}

export const researchTopic = async (topic: string): Promise<ResearchResult> => {
    const prompt = `You are a digital marketing expert. Research the topic: "${topic}"

Provide your response in this EXACT format:

## Summary
[Write 2-3 paragraphs summarizing the most important and current information about this topic]

## Content Ideas
[List exactly 7 actionable content ideas. For each idea, write it as a numbered item with a bold title followed by a description]

1. **[Compelling Title]**: [2-3 sentences describing the specific content idea and how to implement it. Include concrete details like platforms, formats, timing, etc.]

2. **[Compelling Title]**: [2-3 sentences with specific implementation details]

3. **[Compelling Title]**: [2-3 sentences with specific implementation details]

Continue through idea 7.

IMPORTANT: Make each idea specific and actionable with real examples. Don't be vague.`;

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

        // Extract sources
        const sources: ResearchSource[] = [];
        const metadata = (response as any).groundingMetadata;
        if (metadata?.groundingChunks) {
            metadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({
                        uri: chunk.web.uri || '',
                        title: chunk.web.title || 'Untitled'
                    });
                }
            });
        }

        // Extract summary
        const summaryMatch = text.match(/##\s*Summary\s*([\s\S]*?)(?=##|$)/i);
        const summary = summaryMatch ? summaryMatch[1].trim() : text;

        // Extract content ideas - simple numbered list with bold titles
        const contentIdeas: ContentIdea[] = [];
        const ideasMatch = text.match(/##\s*Content Ideas\s*([\s\S]*?)(?=##|$)/i);

        if (ideasMatch) {
            const ideasText = ideasMatch[1];
            // Match numbered items: 1. **Title**: Description
            const items = ideasText.match(/\d+\.\s*\*\*([^*]+)\*\*:\s*([^\n]+(?:\n(?!\d+\.)[^\n]+)*)/g);

            if (items) {
                items.forEach(item => {
                    const match = item.match(/\d+\.\s*\*\*([^*]+)\*\*:\s*([\s\S]+)/);
                    if (match) {
                        contentIdeas.push({
                            title: match[1].trim(),
                            description: match[2].trim()
                        });
                    }
                });
            }
        }

        return {
            summary,
            contentIdeas: contentIdeas.length > 0 ? contentIdeas : [{
                title: 'No ideas extracted',
                description: 'Please review the summary for insights.'
            }],
            sources
        };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Research failed: ${error.message}`);
        }
        throw new Error("Research failed. Please try again.");
    }
};
