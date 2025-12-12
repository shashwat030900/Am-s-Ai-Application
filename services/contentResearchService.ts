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

Provide your response in this EXACT format (follow it precisely):

## Summary
[Write 2-3 paragraphs summarizing the most important and current information about this topic]

## Content Ideas

### Idea 1
**Concept:** [Description of the content concept]
**Actionable:** [Specific actionable step to implement this]

### Idea 2
**Concept:** [Description]
**Actionable:** [Actionable Step]

### Idea 3
**Concept:** [Description]
**Actionable:** [Actionable Step]

### Idea 4
**Concept:** [Description]
**Actionable:** [Actionable Step]

### Idea 5
**Concept:** [Description]
**Actionable:** [Actionable Step]

CRITICAL RULES:
1. You MUST provide exactly 5 content ideas
2. Each idea MUST have both "**Concept:**" and "**Actionable:**" sections
3. Make each idea specific and actionable with real examples
4. Do NOT skip any ideas or use placeholder text`;

    try {
        const localAi = getAiClient();
        const response = await localAi.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            tools: [{
                googleSearch: {}
            }]
        } as any);

        const text = response.text;
        console.log('[ContentResearch] Raw response:', text); // Debug log

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

        // Extract content ideas - improved parsing
        const contentIdeas: ContentIdea[] = [];

        // Try to find the Content Ideas section with more flexible matching
        // IMPORTANT: Use negative lookahead that won't match ### (subsections)
        const ideasMatch = text.match(/##\s*Content\s+Ideas\s*\n([\s\S]*?)(?=\n##\s+[A-Z]|$)/i);

        console.log('[ContentResearch] Ideas match found:', !!ideasMatch);
        console.log('[ContentResearch] Ideas match groups:', ideasMatch?.length);

        if (ideasMatch && ideasMatch[1]) {
            const ideasText = ideasMatch[1].trim();
            console.log('[ContentResearch] Ideas section:', ideasText.substring(0, 200)); // Show first 200 chars

            // Try multiple parsing strategies
            console.log('[ContentResearch] Raw ideas text length:', ideasText.length);

            // Strategy 1: Split by ### and filter for ideas
            const allSections = ideasText.split('###').filter(s => s.trim());
            console.log('[ContentResearch] All ### sections found:', allSections.length);

            // Filter sections that look like ideas (contain Concept and Actionable)
            const ideaSections = allSections.filter(section => {
                const hasIdea = /idea\s*\d+/i.test(section) || /^\s*\d+\s*\n/i.test(section);
                const hasConcept = /concept:/i.test(section);
                const hasActionable = /actionable:/i.test(section);
                return (hasIdea || hasConcept) && hasActionable;
            });

            console.log('[ContentResearch] Filtered idea sections:', ideaSections.length);

            ideaSections.forEach((section, idx) => {
                console.log(`[ContentResearch] Processing section ${idx + 1}:`, section.substring(0, 100));

                // Try to extract concept and actionable with multiple patterns
                let conceptMatch = section.match(/\*\*Concept:\*\*\s*([\s\S]*?)(?=\*\*Actionable:|$)/i);
                let actionableMatch = section.match(/\*\*Actionable:\*\*\s*([\s\S]*?)$/i);

                // Alternative pattern without bold markers
                if (!conceptMatch) {
                    conceptMatch = section.match(/Concept:\s*([\s\S]*?)(?=Actionable:|$)/i);
                }
                if (!actionableMatch) {
                    actionableMatch = section.match(/Actionable:\s*([\s\S]*?)$/i);
                }

                console.log(`[ContentResearch] Idea ${idx + 1} extraction:`, {
                    foundConcept: !!conceptMatch,
                    foundActionable: !!actionableMatch,
                    conceptPreview: conceptMatch?.[1]?.trim()?.substring(0, 50),
                    actionablePreview: actionableMatch?.[1]?.trim()?.substring(0, 50)
                });

                if (conceptMatch && actionableMatch) {
                    contentIdeas.push({
                        concept: conceptMatch[1].trim(),
                        actionable: actionableMatch[1].trim()
                    });
                }
            });
        }

        console.log('[ContentResearch] Final content ideas count:', contentIdeas.length); // Debug log

        return {
            summary,
            contentIdeas: contentIdeas.length > 0 ? contentIdeas : [{
                concept: 'Unable to extract structured ideas from the response.',
                actionable: 'Please review the summary above for insights. The AI may have provided ideas in a different format.'
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
