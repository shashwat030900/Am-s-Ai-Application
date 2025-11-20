
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

interface AvatarInput {
    businessType: string;
    problem: string;
    solution: string;
}

const constructPrompt = ({ businessType, problem, solution }: AvatarInput): string => {
    return `
You are an expert marketing strategist specializing in creating detailed customer avatars for the Indian market.

**Business Type:** ${businessType}
**Problem They Solve:** ${problem}
**Their Solution:** ${solution}

Based on the information above, generate a comprehensive customer avatar deep dive. The output MUST be in Markdown format and include all the following sections, tailored specifically to the Indian context:

## 1. Demographics & Psychographics (Indian Context)
Provide a detailed breakdown of the typical customer's age, gender, location (specific Indian cities/regions), income level (in INR), education, family status, values, interests, and lifestyle.

## 2. Customer Avatar Creation
Create a specific persona with a common Indian name, age, a profession relevant to the business type, and a tier-1 or tier-2 Indian city. Write a "day in the life" narrative for this persona, highlighting their struggles related to the problem.

## 3. Dan Kennedy’s 10 Smart Market Diagnosis Questions
Answer all 10 questions in a "Q: [Question]\nAnswer: [Your Answer]" format. The answers should be deeply empathetic and reflect the avatar's inner world.
1. What keeps them awake at night, indigestion boiling up their stomach, tossing and turning?
2. What are they afraid of?
3. What are they angry about? Who are they angry at?
4. What are their top three daily frustrations?
5. What trends are occurring and will occur in their business or lives?
6. What do they secretly, ardently desire most?
7. Is there a built-in bias in the way they make decisions? (e.g., engineers = analytical, artists = emotional)
8. Do they have their own language or jargon?
9. Who else is selling something similar to them, and how?
10. Who else has tried to sell them something similar, and how has that attempt failed?

## 4. Getting Into Their Shoes
Provide a list of 25 specific items, 5 for each category, from the avatar's perspective, using "I..." statements where appropriate.
*   **Seeing (5 items):** (e.g., Crowded local trains, WhatsApp notifications from family groups, etc.)
*   **Saying (5 items):** (e.g., "This traffic is unbearable," "Is there a better way to do this?", etc.)
*   **Hearing (5 items):** (e.g., Advice from elders, Bollywood music on the radio, etc.)
*   **Feeling (5 items):** (e.g., Anxious about the future, proud of their family, etc.)
*   **Thinking (5 items):** (e.g., "I need to save more money for my children's education," etc.)

## 5. Emotional Triggers
Present this as a Markdown table with the following columns: Visual Triggers, Its Kinaesthetic, Auditory Triggers, Its Kinaesthetic. Provide detailed, culturally relevant examples.

| Visual Triggers | Its Kinaesthetic | Auditory Triggers | Its Kinaesthetic |
|---|---|---|---|
| Seeing a luxury car | A feeling of desire and inadequacy | The sound of a wedding procession | A feeling of social pressure and comparison |
| An advertisement for a family vacation | A pang of guilt or longing | A baby crying | A feeling of responsibility or stress |
| A cluttered workspace | A sense of being overwhelmed | A boss shouting | A feeling of fear and resentment |
| A parent's happy face | A wave of warmth and love | Praise from a colleague | A surge of confidence |

## 6. Beliefs
List 5 detailed beliefs the avatar holds. These can be limiting beliefs about their problem, optimistic beliefs about potential solutions, or core beliefs about themselves and the world in the Indian context.

## 7. Objects & People
Describe 2 key objects (e.g., their smartphone, a religious idol) and 2 key people (e.g., their spouse, a mentor) in the avatar's life that significantly influence their decisions related to the problem.

## 8. Cost
Detail the cost of NOT solving the problem. Go beyond financial costs to include emotional (stress, anxiety), physical (health issues), social (damaged relationships), and temporal (wasted time) costs.

## 9. Consequences
Describe the future consequences if the problem remains unsolved. Paint a picture of what their life looks like in 1 year, 5 years, and 10 years without the solution.
`;
};

export const generateAvatarProfile = async (input: AvatarInput): Promise<string> => {
    const prompt = constructPrompt(input);

    try {
        const localAi = getAiClient();
        const response = await localAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`The AI model failed to respond: ${error.message}`);
        }
        throw new Error("The AI model failed to respond. Please try again later.");
    }
};

export const generateMasterPrompt = async (draftPrompt: string): Promise<string> => {
    const systemInstruction = `
Your mission: diagnose weaknesses in a draft prompt, then deliver a clearly improved version that stays true to the author's original intent and audience.

Phase 1 - Rapid Diagnosis
Summarise the draft prompt's goal and structure in one short paragraph. Then assess each of the following criteria using: Pass, Caution, or Fail. Add a one-line note explaining each rating.
Criteria:
1. Task fidelity
2. Clarity and Specificity
3. Context Utilisation
4. Accuracy and Verifiability
5. Error Handling
6. Resource Efficiency (tokens / latency)

High-Priority Triggers (mark any that apply):
• Context Preservation
• Intent Refinement
• Error Prevention

Phase 2 - Precision Rewrite
1. Apply improvements only where Caution or Fail was noted.
2. Preserve purpose, scope, and persona.
3. Use or introduce a numbered-step structure.
4. Optimise for brevity and clarity.
5. If any trigger was marked, explicitly show how you addressed it (e.g. added context, clarified intent, inserted fallback logic).

Deliverables
• Before/After micro-example (2 lines or less) showing a key improvement. If not applicable, give a one-sentence rationale.
• The revised prompt, enclosed in triple backticks for easy copy/paste.

Validation Checklist:
• Purpose and audience intact
• Tone and style consistent
• Clarity, logic, and structure improved
• Trigger issues resolved
`;

    const prompt = `
${systemInstruction}

Draft Prompt:
${draftPrompt}
`;

    try {
        const localAi = getAiClient();
        const response = await localAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`The AI model failed to respond: ${error.message}`);
        }
        throw new Error("The AI model failed to respond. Please try again later.");
    }
};
