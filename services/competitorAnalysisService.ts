import { generateContent } from './geminiService';
import { scrapeCompetitorWebsite, searchCompetitors, scrapeSocialProfiles } from './apifyService';

export interface CompetitorDetail {
    name: string;
    url: string;
    valueProposition: string;
    swot: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
    creativeAnalysis: {
        adTypes: string[];
        activePlatforms: string[];
        creativeThemes: string[];
        adCopyInsights: string;
    };
    socialStats: {
        platform: string;
        followers: string;
        engagement: string;
        detailedAnalysis: string;
    }[];
    matchScore: number;
}

export interface CompetitorAnalysisReport {
    clientName: string;
    clientUrl: string;
    clientSwot: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
    competitorOverview: string;
    competitors: CompetitorDetail[];
    playbook: {
        whatWeAreDoingWrong: string[];
        whatWeCanDoBetter: string[];
        actionPlan: string[];
    };
}

// Helper to identify specific competitors using AI reasoning
export const identifyCompetitors = async (clientName: string, industry: string, clientContent: string): Promise<string[]> => {
    const prompt = `
    Context:
    Client: ${clientName}
    Industry: ${industry}
    About: ${clientContent.substring(0, 500)}

    Task:
    Identify the top 5 direct business competitors for this specific brand.
    Focus on real, operating companies in the same niche.
    Ignore generic aggregators (like G2, Capterra) or Wikipedia.

    Output a simple JSON string array of just the brand names.
    Example: ["Competitor A", "Competitor B", "Competitor C"]
    `;

    try {
        const response = await generateContent(prompt);
        const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const names = JSON.parse(cleanJson);
        return Array.isArray(names) ? names.slice(0, 5) : [];
    } catch (e) {
        console.error("AI Competitor ID Failed", e);
        return [];
    }
}

export const findOfficialDomain = async (brandName: string): Promise<string | null> => {
    try {
        // Targeted search for official presence
        // Filter out common noise
        const query = `${brandName} official website -site:wikipedia.org -site:facebook.com -site:linkedin.com -site:g2.com -site:capterra.com -site:youtube.com`;
        const urls = await searchCompetitors(query);
        // Return the first non-google result provided by the scraper service
        return urls.length > 0 ? urls[0] : null;
    } catch (e) {
        return null;
    }
}

export const analyzeClientContext = async (clientUrl: string): Promise<{ query: string, name: string, industry: string, content: string }> => {
    try {
        if (!clientUrl) return { query: "", name: "", industry: "", content: "" };
        const scrapedData = await scrapeCompetitorWebsite(clientUrl);
        const content = scrapedData.content?.substring(0, 3000) || "";
        const title = scrapedData.title || "";

        const prompt = `
        Analyze the following verified website content for a business:
        Title: ${title}
        ---
        ${content}
        ---

        1. Identify the Brand Name (if not clear from title).
        2. Identify the specific industry, niche, and core offering.
        
        Output JSON only:
        {
            "brandName": "Name",
            "industry": "Industry description"
        }
        `;

        const response = await generateContent(prompt);
        const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        const name = data.brandName || title || "Your Brand";

        return {
            name,
            industry: data.industry || "General",
            content,
            query: `competitors for ${name}`
        };
    } catch (err) {
        console.error("Context Analysis Error:", err);
        return { query: `competitors for ${clientUrl}`, name: "Your Brand", industry: "", content: "" };
    }
};

export const analyzeCompetitors = async (urls: string[], clientName: string, clientUrl: string = ""): Promise<CompetitorAnalysisReport> => {
    // 1. Scrape all URLs
    const scrapePromises = urls.map(url => scrapeCompetitorWebsite(url));
    const scrapeResults = await Promise.all(scrapePromises);
    const validResults = scrapeResults.filter(r => r.content && r.content.length > 100);

    // 2. Scrape Client URL if provided
    let clientScrape = null;
    if (clientUrl) {
        clientScrape = await scrapeCompetitorWebsite(clientUrl);
    }

    // 3. Social Presence Discovery
    const socialStatsMap: Record<string, any> = {};
    for (const res of validResults) {
        if (res.socialLinks && res.socialLinks.length > 0) {
            socialStatsMap[res.url] = await scrapeSocialProfiles(res.socialLinks);
        }
    }

    const prompt = `
    You are a Strategic Market Analyst. 
    Analyze the following market research data for a client named "${clientName}".
    
    ${clientScrape ? `**Client Data (from ${clientUrl}):**\n${clientScrape.content?.substring(0, 2000)}` : 'No specific client website provided.'}

    **Competitor Data:**
    ${validResults.map((r, i) => `
    Competitor ${i + 1}: ${r.url}
    Title: ${r.title}
    Social Platforms Detected: ${socialStatsMap[r.url]?.map((s: any) => s.platform).join(', ') || 'None'}
    Content: ${r.content?.substring(0, 2500)}
    `).join('\n---\n')}

    **Task:**
    Generate a competitor-centric strategic report.
    For EACH competitor, provide a deep dive.
    Then, provide a unified playbook for the client.

    **Output JSON Structure (MUST BE VALID JSON):**
    {
        "clientName": "${clientName}",
        "clientUrl": "${clientUrl}",
        "clientSwot": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] },
        "competitorOverview": "2-3 sentences summarizing the landscape.",
        "competitors": [
            {
                "name": "Competitor Name",
                "url": "URL",
                "valueProposition": "Core selling point",
                "matchScore": 85,
                "swot": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] },
                "creativeAnalysis": {
                    "adTypes": ["Video", "Static"],
                    "activePlatforms": ["Instagram", "LinkedIn"],
                    "creativeThemes": ["Themes"],
                    "adCopyInsights": "Hooks analysis"
                },
                "socialStats": [
                    { "platform": "LinkedIn", "followers": "High/Tier", "engagement": "Level", "detailedAnalysis": "Strategy reasoning" }
                ]
            }
        ],
        "playbook": {
            "whatWeAreDoingWrong": ["Specific gaps found by comparing vs competitors"],
            "whatWeCanDoBetter": ["Specific improvements"],
            "actionPlan": ["Step 1", "Step 2"]
        }
    }
    `;

    // Use gemini-1.5-pro for deep reasoning
    const jsonResponse = await generateContent(prompt, 'gemini-3-pro-preview');

    try {
        const cleanJson = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Analysis Parse Error:", e);
        throw new Error("Failed to parse analysis results.");
    }
};
