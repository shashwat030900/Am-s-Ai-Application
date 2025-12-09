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
    concept: string;
    actionable: string;
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
Provide 5-7 content ideas. Format each idea exactly as follows:

### Idea 1
**Concept:** [Description of the content concept]
**Actionable:** [Specific actionable step to implement this]

### Idea 2
**Concept:** [Description]
**Actionable:** [Actionable Step]

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

        // Extract content ideas - structured format
        const contentIdeas: ContentIdea[] = [];
        const ideasMatch = text.match(/##\s*Content Ideas\s*([\s\S]*?)(?=##|$)/i);

        if (ideasMatch) {
            const ideasText = ideasMatch[1];
            // Match blocks starting with ### Idea X
            const ideaBlocks = ideasText.split(/###\s*Idea\s*\d+/i).slice(1);

            ideaBlocks.forEach(block => {
                const conceptMatch = block.match(/\*\*Concept:\*\*\s*([\s\S]*?)(?=\*\*Actionable:|$)/i);
                const actionableMatch = block.match(/\*\*Actionable:\*\*\s*([\s\S]*?)(?=$)/i);

                if (conceptMatch && actionableMatch) {
                    contentIdeas.push({
                        concept: conceptMatch[1].trim(),
                        actionable: actionableMatch[1].trim()
                    });
                }
            });
        }

        return {
            summary,
            contentIdeas: contentIdeas.length > 0 ? contentIdeas : [{
                concept: 'No ideas extracted',
                actionable: 'Please review the summary for insights.'
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
