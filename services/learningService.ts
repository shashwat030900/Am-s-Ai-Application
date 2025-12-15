import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!process.env.API_KEY && !process.env.GEMINI_API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: (process.env.API_KEY || process.env.GEMINI_API_KEY) as string });
    }
    return ai;
};

export interface CourseRecommendation {
    title: string;
    url: string;
    platform: string;
    author: string; // Instructor or Channel Name
    estimated_time: string;
    why_watch: string;
}

export interface LearningResponse {
    day: string;
    theme: string;
    courses: CourseRecommendation[];
}

export const getDailyLearningResource = async (): Promise<LearningResponse> => {
    const client = getAiClient();

    // Determine day of the week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const currentDay = days[today.getDay()];

    const prompt = `
    ### ROLE
    You are "AI for Learning & Upskilling," an expert AI curator responsible for the daily upskilling of Account Managers (AMs) at a digital marketing agency.

    ### GOAL
    Find **2 to 3 distinct, high-quality learning resources** (courses, modules, or verified video guides) for the AMs to choose from based on today's theme.

    ### DATE CONTEXT
    Today is ${currentDay}.

    ### WEEKLY CURRICULUM SCHEDULE
    Focus your search on these specific themes:
    - **Monday (Client Success & Soft Skills):** Negotiation, emotional intelligence, handling difficult clients, or email etiquette.
    - **Tuesday (Data & Strategy):** Google Analytics 4 tips, reading performance reports, data storytelling, or Excel/Sheets hacks.
    - **Wednesday (Creative & Trends):** New viral trends, AI tools for marketing (GenAI), or ad creative breakdowns.
    - **Thursday (Productivity & Operations):** Time management, project management tools (Asana/Jira tips), or "Deep Work" concepts.
    - **Friday (Mental Models & Leadership):** Decision making, strategic thinking, or industry news (Meta/Google updates).
    - **Weekend:** If triggered on a weekend, find a "Motivation" or "Tech Documentary" style video.

    ### SEARCH INSTRUCTIONS
    1. **Execute Search:** Use your Search Tool to find high-quality content.
    2. **Sources:** Prioritize **Coursera, Udemy, LinkedIn Learning, EdX, Khan Academy**.
    3. **PUBLIC ACCESS ONLY:** You must verify that the course is **PUBLICLY AVAILABLE** for individuals to buy/enroll.
       - **EXCLUDE** "Udemy Business" or "Coursera for Enterprise" only links.
       - **EXCLUDE** "Private" or "Invitation Only" courses.
    4. **Freshness:** Prefer content updated in the last 18 months.
    5. **Time Commitment:** Short courses or specific modules (15-60 mins) are preferred.

    ### CRITICAL: URL & SOURCE VERIFICATION
    1. **NO URL CONSTRUCTION:** You are strictly FORBIDDEN from guessing or constructing URLs.
    2. **EXACT MATCH ONLY:** You must ONLY return a URL that is explicitly provided in the Google Search tool's output snippets.
    3. **VERIFICATION:** Before selecting a URL, look at it. Does it look like a public course landing page? (e.g., \`udemy.com/course/...\` is good, \`business.udemy.com/...\` is BAD).
    4. **FALLBACK:** If you cannot find 2-3 valid public course links, fill the remaining slots with **high-quality YouTube videos** from reputable channels (TED, HBR, Google).

    ### INSTRUCTION FOR AI
    1. **SEARCH:** Use the Google Search tool.
    2. **FILTER:** Select 2-3 best options. Ensure at least one is a direct course link if possible.
    3. **OUTPUT:** Return the final answer in a valid JSON block inside a markdown code block.

    ### OUTPUT FORMAT
    \`\`\`json
    {
        "day": "${currentDay}",
        "theme": "The theme chosen",
        "courses": [
            {
                "title": "Course/Video Title",
                "url": "Verified URL",
                "platform": "Udemy / Coursera / YouTube",
                "author": "Instructor / Channel Name",
                "estimated_time": "e.g. 45 mins",
                "why_watch": "Pitch to the AM."
            }
        ]
    }
    \`\`\`
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        if (response.text) {
            const text = response.text;
            console.log("Raw AI Response:", text);

            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);

            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1]) as LearningResponse;
            }

            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                const jsonStr = text.substring(firstBrace, lastBrace + 1);
                return JSON.parse(jsonStr) as LearningResponse;
            }
        }
        throw new Error("Failed to parse valid JSON from AI response");

    } catch (error) {
        console.error("Error fetching daily learning resource:", error);
        throw error;
    }
};
