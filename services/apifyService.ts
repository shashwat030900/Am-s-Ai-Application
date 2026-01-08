// import { ApifyClient } from 'apify-client'; // incompatible with browser
// Using fetch instead for browser compatibility

export interface ScrapedData {
    url: string;
    title?: string;
    description?: string;
    content?: string;
    socialLinks?: string[];
    headings?: string[];
}

/**
 * Scrapes a website using Apify's Website Content Crawler via REST API.
 */
export const scrapeCompetitorWebsite = async (url: string): Promise<ScrapedData> => {
    // Basic url validation
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    const apiToken = import.meta.env.VITE_APIFY_API_TOKEN;
    console.log("Apify Scrape: Starting crawl for:", url, { hasToken: !!apiToken });

    // Mock Data Fallback
    if (!apiToken) {
        console.warn("VITE_APIFY_API_TOKEN is not set. Using mock data.");
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    url,
                    title: "Mock Competitor - FutureTech Solutions",
                    description: "Leading provider of AI-driven analytics for enterprise.",
                    content: "FutureTech Solutions provides cutting-edge AI tools... Pricing: $49/mo... Services: Cloud Analytics, Data Mining... Blog: Top 10 AI Trends...",
                    socialLinks: ["https://twitter.com/futuretech", "https://linkedin.com/company/futuretech"],
                    headings: ["Smart Analytics", "Enterprise Solutions", "Pricing"]
                });
            }, 2000);
        });
    }

    try {
        // 1. Start the Actor (Website Content Crawler: apify/website-content-crawler)
        // API Docs: https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
        const actorId = 'apify/website-content-crawler';
        const runUrl = `/api/apify/v2/acts/${actorId.replace('/', '~')}/runs?token=${apiToken}`;


        const runResponse = await fetch(runUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                startUrls: [{ url }],
                maxCrawlPages: 1,
                saveHtml: false,
                saveMarkdown: true,
            }),
        });

        if (!runResponse.ok) {
            const errText = await runResponse.text();
            throw new Error(`Failed to start Apify actor: ${runResponse.status} ${errText}`);
        }

        const runData = await runResponse.json();
        const defaultDatasetId = runData.data.defaultDatasetId;
        const runId = runData.data.id;

        // 2. Poll for completion
        // We'll poll the specific run endpoint
        await waitForRunToFinish(runId, apiToken);

        // 3. Fetch Results
        const itemsUrl = `/api/apify/v2/datasets/${defaultDatasetId}/items?token=${apiToken}`;
        const itemsResponse = await fetch(itemsUrl);

        if (!itemsResponse.ok) {
            throw new Error("Failed to fetch dataset items from Apify");
        }

        const items = await itemsResponse.json();

        if (items.length === 0) {
            // It's possible the crawler failed or found nothing.
            // Let's return a basic object anyway to avoid breaking the app logic completely
            return {
                url,
                title: "No Title Found",
                content: "Could not scrape content. The website might be blocking bots.",
            };
        }

        const item = items[0] as any;

        return {
            url,
            title: item.title,
            description: item.description,
            content: item.markdown || item.text,
            socialLinks: item.metadata?.socialLinks || [],
            headings: [],
        };

    } catch (error: any) {
        console.error("Apify Scraping Error:", error);
        throw new Error(`Failed to scrape website: ${error.message}`);
    }
};

async function waitForRunToFinish(runId: string, token: string) {
    const statusUrl = `/api/apify/v2/acts/apify~website-content-crawler/runs/${runId}?token=${token}`;

    // Poll every 2 seconds, timeout after 60 seconds
    const maxRetries = 30;

    for (let i = 0; i < maxRetries; i++) {
        const response = await fetch(statusUrl);
        const data = await response.json();
        const status = data.data.status;

        if (status === 'SUCCEEDED') return;
        if (status === 'FAILED' || status === 'ABORTED') {
            throw new Error(`Actor run ended with status: ${status}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error("Apify run timed out.");
}

/**
 * Searches for competitors using Apify's Google Search Scraper.
 */
export const searchCompetitors = async (query: string): Promise<string[]> => {
    const apiToken = import.meta.env.VITE_APIFY_API_TOKEN;
    const allKeys = Object.keys(import.meta.env);
    console.log("Apify Search: Querying...", {
        hasToken: !!apiToken,
        availableViteKeys: allKeys.filter(k => k.startsWith('VITE_'))
    });

    if (!apiToken) {
        console.warn("VITE_APIFY_API_TOKEN is not set. Using mock search results.");
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    "https://www.openai.com",
                    "https://www.anthropic.com",
                    "https://www.google.com/ai",
                    "https://www.mistral.ai"
                ]);
            }, 2000);
        });
    }

    try {
        const actorId = 'apify/google-search-scraper';
        const runUrl = `/api/apify/v2/acts/${actorId.replace('/', '~')}/runs?token=${apiToken}`;

        const runResponse = await fetch(runUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                queries: query,
                maxPagesPerQuery: 1,
                resultsPerPage: 5,
                mobileResults: false,
                includeAds: false,
                includeReviews: false,
            }),
        });

        if (!runResponse.ok) {
            const errText = await runResponse.text();
            throw new Error(`Failed to start Google Search run: ${runResponse.status} ${errText}`);
        }

        const runData = await runResponse.json();
        const runId = runData.data.id;
        const defaultDatasetId = runData.data.defaultDatasetId;

        // Poll for completion (Google search is usually fast)
        await waitForActorRun(actorId, runId, apiToken);

        const itemsUrl = `/api/apify/v2/datasets/${defaultDatasetId}/items?token=${apiToken}`;
        const itemsResponse = await fetch(itemsUrl);
        const items = await itemsResponse.json();

        // The scraper returns results in organicResults array
        if (items.length > 0 && items[0].organicResults) {
            return items[0].organicResults
                .map((r: any) => r.url)
                .filter((url: string) => url && !url.includes('google.com')); // Filter out google links
        }

        return [];
    } catch (error: any) {
        console.error("Discovery Error:", error);
        throw new Error(`Failed to discover competitors: ${error.message}`);
    }
};

async function waitForActorRun(actorId: string, runId: string, token: string) {
    // Use local proxy path
    const statusUrl = `/api/apify/v2/acts/${actorId.replace('/', '~')}/runs/${runId}?token=${token}`;
    const maxRetries = 30;

    for (let i = 0; i < maxRetries; i++) {
        const response = await fetch(statusUrl);
        const data = await response.json();
        const status = data.data.status;

        if (status === 'SUCCEEDED') return;
        if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
            throw new Error(`Actor run ${runId} ended with status: ${status}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error("Actor run timed out.");
}


/**
 * Lightweight scraper for social profiles to get follower counts/descriptions.
 * Uses the same content crawler but targeted at social URLs.
 */
export const scrapeSocialProfiles = async (links: string[]): Promise<{ platform: string, followers: string, engagement: string }[]> => {
    if (!links || links.length === 0) return [];

    console.log("Deep Research: Analyzing social profiles...", links);

    // For now, we will just return the platform names derived from the URL as a placeholder
    // Real social scraping often requires specialized actors due to login walls (Instagram/LinkedIn).
    // optimizing this to just identify valid platforms for the report.

    return links.map(link => {
        const url = new URL(link);
        let platform = "Website";
        if (url.hostname.includes('facebook')) platform = "Facebook";
        if (url.hostname.includes('twitter') || url.hostname.includes('x.com')) platform = "Twitter/X";
        if (url.hostname.includes('instagram')) platform = "Instagram";
        if (url.hostname.includes('linkedin')) platform = "LinkedIn";
        if (url.hostname.includes('youtube')) platform = "YouTube";
        if (url.hostname.includes('tiktok')) platform = "TikTok";

        return {
            platform,
            followers: "High Presence", // Placeholder - real extraction requires specific actors
            engagement: "Active"
        };
    });
};
