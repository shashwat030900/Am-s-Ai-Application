import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { ApifyClient } from 'apify-client';
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = 3001;

// Initialize Clients
let geminiClient = null;
const getGeminiClient = () => {
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API Key not found in .env.local. Please add VITE_GEMINI_API_KEY or API_KEY.");
    }
    if (!geminiClient) {
        geminiClient = new GoogleGenAI({ apiKey });
    }
    return geminiClient;
};

const getApifyClient = () => {
    const token = process.env.VITE_APIFY_API_TOKEN || process.env.APIFY_API_TOKEN;
    if (!token) {
        throw new Error("Apify API Token not found in .env.local (VITE_APIFY_API_TOKEN)");
    }
    return new ApifyClient({ token });
};

// Helper for Gemini generation - using the correct @google/genai SDK pattern
async function generateGeminiContent(prompt) {
    const ai = getGeminiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Use 2.0 Flash Experimental
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        return response.text;
    } catch (error) {
        console.error('❌ Gemini Generation Error:', error.message);
        throw error;
    }
}

// Health check
app.get('/api/agent/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Root route for easy connectivity check
app.get('/', (req, res) => {
    res.send('✅ Marketing Agent Backend is Running! (Port 3001)');
});

// --- ROUTES ---

// 1. Analyze Domain & Competitors (Enhanced with Apify)
app.post('/api/agent/analyze-domain', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: "Domain is required" });

        // Ensure we have a valid URL
        let url = domain;
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }

        console.log(`Analyzing domain via Apify: ${url}`);
        const apify = getApifyClient();

        // 1. Scrape the home page
        const runInput = {
            startUrls: [{ url: url }],
            maxCrawlDepth: 0, // Only home page for quick analysis
            maxPagesPerCrawl: 1,
            saveHtml: false,
            saveMarkdown: true // We want the text content
        };

        const run = await apify.actor("apify/website-content-crawler").call(runInput);
        const { items } = await apify.dataset(run.defaultDatasetId).listItems();

        let siteContent = "";
        if (items && items.length > 0) {
            // Get markdown content or plain text, truncate to avoid token limits
            siteContent = (items[0].markdown || items[0].text || "").slice(0, 15000);
        }

        if (!siteContent) {
            console.log("Warining: No content scraped, falling back to domain-only analysis");
            siteContent = `Could not scrape content. Domain: ${domain}`;
        }

        // 2. Analyze with Gemini
        const prompt = `
        I have scraped the following content from the website ${domain}:

        """
        ${siteContent}
        """

        Based on this REAL website content, please provide a structured analysis.
        
        **Output Format (Strict Markdown):**
        - Use ## for main section headers.
        - Use - for bullet points.
        - Use **bold** for key terms.
        - Keep paragraphs concise.

        **Analysis Required:**
        ## 1. Business Overview
        Accurately describe what this specific business allows users to do or buy. Do not guess.

        ## 2. Competitive Landscape
        Identify 5 direct, realistic competitors for this specific niche. List them as bullet points.

        ## 3. Brand Positioning
        Explain the business's positioning based on the text provided.
        `;

        const result = await generateGeminiContent(prompt);

        // Return both the AI analysis AND the raw scraped content to preserve context
        res.json({
            result,
            scrapedData: siteContent
        });
    } catch (error) {
        console.error("Error in /analyze-domain:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Create Buyer Persona
app.post('/api/agent/create-persona', async (req, res) => {
    try {
        const { domain, competitors, brandDetails, scrapedContent } = req.body;

        const contextSource = scrapedContent
            ? `Website Content Scraped from ${domain}:\n"""${scrapedContent.slice(0, 10000)}"""`
            : `Client's Brand Details: ${brandDetails}`;

        const prompt = `
        Context: The client's domain is ${domain}.
        Competitor Analysis: ${competitors}
        
        Brand Context Source:
        ${contextSource}
        
        Additional User Notes (Optional): ${brandDetails || "None provided"}

        Task: Create a detailed Buyer Persona for this brand based on the provided context.
        Include: 
        1. Demographics (Age, Gender, Location - focus on India if applicable)
        2. Psychographics (Values, Interests, Lifestyle)
        3. Pain Points & Challenges
        4. Goals & Desires
        5. Objections to buying

        The persona should be highly specific to the actual business offerings found in the context.
        Return the result as clean Markdown.
        `;

        const result = await generateGeminiContent(prompt);
        res.json({ result });
    } catch (error) {
        console.error("Error in /create-persona:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Ad Audit (Apify + AI)
app.post('/api/agent/audit-ads', async (req, res) => {
    try {
        const { adLibraryUrl } = req.body;
        if (!adLibraryUrl) return res.status(400).json({ error: "Ad Library URL is required" });

        const apify = getApifyClient();
        console.log(`Starting Ad Audit for ${adLibraryUrl}...`);

        let targetUrl = adLibraryUrl;
        // Sanitization: If it's a complex URL with view_all_page_id, simplify it
        if (adLibraryUrl.includes('view_all_page_id=')) {
            const match = adLibraryUrl.match(/view_all_page_id=(\d+)/);
            if (match && match[1]) {
                targetUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=IN&view_all_page_id=${match[1]}`;
                console.log(`Sanitized URL to: ${targetUrl}`);
            }
        }

        const runInput = {
            startUrls: [{ url: targetUrl }],
            urls: [{ url: targetUrl }],
            pageUrl: targetUrl,
            // No maxItems - let it scrape what it can find
        };

        console.log('[AdAudit] Calling Apify actor...');
        const run = await apify.actor("curious_coder/facebook-ads-library-scraper").call(runInput, {
            waitForFinish: 120 // Wait up to 2 minutes for completion
        });
        console.log('[AdAudit] Actor finished, fetching dataset...');
        const { items } = await apify.dataset(run.defaultDatasetId).listItems();
        console.log(`[AdAudit] Scraped ${items.length} raw items from ${targetUrl}`);

        // --- SMART DEDUPLICATION ---
        // Scrapers often return many copies of the same ad. Select 10-15 DIVERSE ads.
        const uniqueAds = [];
        const seenTexts = new Set();
        const seenLinks = new Set();

        for (const ad of items) {
            const text = (ad.adCopy || "").slice(0, 200).trim(); // Signature of the ad copy
            const link = ad.landingPageUrl || "";

            // Priority 1: Unseen text + Unseen link
            if (text && !seenTexts.has(text) && (!link || !seenLinks.has(link))) {
                uniqueAds.push(ad);
                seenTexts.add(text);
                if (link) seenLinks.add(link);
            }
            if (uniqueAds.length >= 15) break;
        }

        // If we still need more diversity, catch unique links we missed
        if (uniqueAds.length < 10) {
            for (const ad of items) {
                const link = ad.landingPageUrl || "";
                if (link && !seenLinks.has(link)) {
                    uniqueAds.push(ad);
                    seenLinks.add(link);
                }
                if (uniqueAds.length >= 15) break;
            }
        }

        console.log(`[AdAudit] Filtered to ${uniqueAds.length} unique ads.`);
        if (uniqueAds.length === 0 && items.length > 0) {
            console.log(`[AdAudit] DEBUG: First item text: "${(items[0].adCopy || "").slice(0, 100)}"`);
            console.log(`[AdAudit] DEBUG: First item link: ${items[0].landingPageUrl}`);
        }

        const adsSummary = uniqueAds.length > 0
            ? JSON.stringify(uniqueAds).slice(0, 20000)
            : "NO REAL AD DATA FOUND FOR THIS URL.";

        const prompt = `
        I have scraped a DIVERSE set of ads from the client's Facebook Ad Library.
        RAW DATA (Reduced to Unique Variations):
        ${adsSummary}

        IMPORTANT: If RAW DATA says "NO REAL AD DATA FOUND", do NOT generate any analysis. Instead, return a message saying: "No ads were found for the provided URL. Please ensure you are providing a direct link to a Facebook Page's Ad Library (e.g., including a 'view_all_page_id' parameter)."
        
        TASK: Perform a Comprehensive "Overall Account" Ad Audit on 10-15 DIFFERENT ad variations.
        
        DO NOT GENERATE MOCK DATA OR HYPOTHETICAL COMPANIES. ONLY ANALYZE THE RAW DATA PROVIDED.
        
        1. **Ad Variations & Landing Pages**: 
           - List the main unique ad variations identified.
           - Identify the different Landing Pages (URLs) being used. Analyze if different ads lead to different funnel segments (e.g., webinars, direct sales, lead magnets).
        
        2. **Creative Strategy Diversification**:
           - How varied are the creative formats (Video hooks vs. Static images vs. Carousels)?
           - What are the top 3-5 recurring "Emotional Hooks" or "Value Propositions" used across these different ads?

        3. **Messaging & Branding Consistency**:
           - Is the brand voice consistent across all these variations?
           - Identify any disconnects between the ad promise and the landing page destination.

        4. **Strategic Gaps & Recommendations**:
           - What is missing in the overall account strategy?
           - Suggestions for 3 new creative directions to test based on this competitive set.

        Return a structured, professional report in clean Markdown.
        `;

        const result = await generateGeminiContent(prompt);
        res.json({ result });
    } catch (error) {
        console.error("Error in /audit-ads:", error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Website Audit (Dual Report Types: Data-Based & Screenshot-Based)
app.post('/api/agent/audit-website', async (req, res) => {
    try {
        const { websiteUrl, reportType = 'data' } = req.body;
        if (!websiteUrl) return res.status(400).json({ error: "Website URL is required" });

        console.log(`🚀 Starting Website Audit for ${websiteUrl} (Type: ${reportType})...`);

        if (reportType === 'screenshot') {
            return await runScreenshotBasedAudit(websiteUrl, res);
        } else {
            return await runDataBasedAudit(websiteUrl, res);
        }
    } catch (error) {
        console.error("Error in /audit-website:", error);
        res.status(500).json({ error: error.message });
    }
});

// Data-Based Audit: Analyzes scraped text content for SEO, content quality, structure
async function runDataBasedAudit(websiteUrl, res) {
    const apify = getApifyClient();

    try {
        console.log('📄 Running Data-Based Audit (Content Crawler)...');
        const crawlerInput = {
            startUrls: [{ url: websiteUrl }],
            maxCrawlDepth: 0,
            maxPagesPerCrawl: 1,
            maxConcurrency: 5,
            requestTimeoutSecs: 60,
            saveHtml: false,
            saveMarkdown: true,
            contentType: 'markdown',
        };

        const crawlerRun = await apify.actor("apify/website-content-crawler").call(crawlerInput);
        const { items } = await apify.dataset(crawlerRun.defaultDatasetId).listItems();

        if (!items || items.length === 0) {
            throw new Error("No content could be scraped from the website.");
        }

        const formattedInputData = items.map((item) => {
            return `
PAGE: ${item.url}
TITLE: ${item.metadata?.title || item.title || 'No Title'}
CONTENT:
${(item.markdown || "").slice(0, 30000)}
--------------------------------------------------
`;
        }).join('\n');

        const prompt = `
**Role:** Act as a Senior SEO & Content Strategist.
**Context:** I have crawled the website "${websiteUrl}".

**Website Content (Markdown Structure):**
${formattedInputData}

**Your Task:**
Conduct a **Data-Based Audit** focusing on SEO, content quality, and structure.

**Required Report Structure (Markdown):**

# 📊 Data-Based Website Audit: ${websiteUrl}
**Date:** ${new Date().toLocaleDateString()}

## 1. SEO Analysis
- **Title & Meta Description**: Review the page title and meta description for optimization
- **Heading Structure**: Analyze H1, H2, H3 hierarchy and keyword usage
- **Keyword Optimization**: Identify keyword opportunities

## 2. Content Quality
- **Value Proposition**: Is the messaging clear and compelling?
- **Readability**: Is the content easy to understand?
- **Content Gaps**: What content is missing?

## 3. Technical Structure
- **Navigation**: How clear is the site structure from the content?
- **Internal Linking**: Are there clear content connections?

## 4. Recommendations
- **Quick Wins**: 3 immediate improvements
- **Long-term Strategy**: Strategic content improvements
        `;

        const result = await generateGeminiContent(prompt);

        res.json({
            result,
            reportType: 'data',
            metadata: {
                title: items[0].title || "Website Audit",
                url: websiteUrl,
                pagesAnalyzed: items.length
            }
        });
    } catch (error) {
        console.error("Error in Data-Based Audit:", error);
        throw error;
    }
}

// Screenshot-Based Audit: Captures screenshots using local 'browserless' package in segments
// Screenshot-Based Audit: Captures screenshots using Puppeteer
async function runScreenshotBasedAudit(websiteUrl, res) {
    let browser = null;
    try {
        console.log(`📸 Running Segmented Visual Audit for: ${websiteUrl}`);

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();

        // Optimize for speed and stealth
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1440, height: 1080 });

        console.log(`DEBUG: Navigating to ${websiteUrl}...`);

        // Navigation with robust timeout handling
        try {
            await page.goto(websiteUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            await page.waitForTimeout(2000); // Extra wait for lazy-loaded content
        } catch (navError) {
            console.warn(`Warning: Navigation timeout or partial load: ${navError.message}`);
            // Continue anyway, we might have captured enough
        }

        // Auto-dismiss popups and modals
        console.log('🚫 Attempting to close popups/modals...');
        try {
            // Method 1: Press Escape key
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);

            // Method 2: Click common close button selectors
            const closeSelectors = [
                '[aria-label*="close" i]',
                '[aria-label*="dismiss" i]',
                'button.close',
                'button[class*="close"]',
                '.modal-close',
                '.popup-close',
                '[data-dismiss="modal"]',
                'button:has-text("×")',
                'button:has-text("✕")',
                '.swal2-close' // SweetAlert2
            ];

            for (const selector of closeSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        await element.click();
                        console.log(`✅ Closed popup via selector: ${selector}`);
                        await page.waitForTimeout(500);
                        break;
                    }
                } catch (e) {
                    // Selector not found or not clickable, continue
                }
            }

            // Method 3: Click on modal overlays (if visible)
            await page.evaluate(() => {
                const overlays = document.querySelectorAll('.modal-backdrop, .overlay, [class*="backdrop"], [class*="overlay"]');
                overlays.forEach(overlay => {
                    if (overlay && overlay.style.display !== 'none') {
                        overlay.click();
                    }
                });
            });

            await page.waitForTimeout(1000); // Give time for animations to complete
            console.log('✅ Popup dismissal complete.');
        } catch (popupError) {
            console.warn('⚠️ Could not dismiss popups:', popupError.message);
        }

        // 1. Get page metrics
        const pageMetrics = await page.evaluate(() => ({
            height: document.documentElement.scrollHeight,
            width: document.documentElement.scrollWidth,
            title: document.title
        }));

        console.log(`📏 Page Analysis: "${pageMetrics.title}" | Height: ${pageMetrics.height}px`);

        if (!pageMetrics.height || pageMetrics.height < 100) {
            // Fallback: try to capture body height
            const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
            if (bodyHeight > 100) pageMetrics.height = bodyHeight;
        }


        const headerHeight = 400;  // Dedicated header capture
        const footerHeight = 500;  // Dedicated footer capture
        const middleSegmentHeight = 800;
        const maxMiddleSegments = 4;

        const screenshots = [];
        const imageData = [];

        // Helper function to capture and store a segment
        const captureSegment = async (name, top, height) => {
            console.log(`🖼️ Capturing "${name}" (Top: ${top}px, Height: ${height}px)...`);
            try {
                const buffer = await page.screenshot({
                    clip: { x: 0, y: top, width: 1440, height: height },
                    type: 'jpeg',
                    quality: 80,
                    encoding: 'binary'
                });
                const base64Image = Buffer.from(buffer).toString('base64');
                const mimeType = 'image/jpeg';
                screenshots.push({
                    viewport: name,
                    url: `data:${mimeType};base64,${base64Image}`,
                    width: 1440,
                    height: height
                });
                imageData.push({
                    viewport: name,
                    data: base64Image,
                    mimeType: mimeType
                });
            } catch (err) {
                console.error(`Failed to capture ${name}:`, err.message);
            }
        };

        // 2. Capture Header
        await captureSegment("Header / Navigation", 0, headerHeight);

        // 3. Capture Middle Body Sections
        const middleStart = headerHeight;
        const middleEnd = Math.max(pageMetrics.height - footerHeight, middleStart);
        const middleArea = middleEnd - middleStart;
        const numMiddleSegments = Math.min(Math.ceil(middleArea / middleSegmentHeight), maxMiddleSegments);

        for (let i = 0; i < numMiddleSegments; i++) {
            const top = middleStart + (i * middleSegmentHeight);
            const sectionName = i === 0 ? "Hero / Above-the-Fold" : `Body Section ${i + 1}`;
            await captureSegment(sectionName, top, middleSegmentHeight);
        }

        // 4. Capture Footer
        const footerTop = Math.max(pageMetrics.height - footerHeight, 0);
        await captureSegment("Footer", footerTop, footerHeight);

        if (screenshots.length === 0) {
            throw new Error("Failed to capture any segments. The website might be blocking headless browsers.");
        }

        // 3. Analyze with Gemini Vision
        console.log('🔍 Analyzing segments with AI Vision...');
        const ai = getGeminiClient();

        const visionPrompt = `
**Role:** Senior UX/UI Auditor.
**Task:** Analyze the provided screenshots of the website "${websiteUrl}".
The screenshots show the website from Top (Hero) to Bottom (Footer).
There are ${imageData.length} segment(s).

**Output Format:**
You must return a **VALID JSON ARRAY** of objects. Do not wrap in markdown code blocks.
Each object must correspond to one of the provided screenshots in order.

**JSON Structure:**
[
  {
    "sectionName": "Hero Section", // or "Services Section", "Footer", etc.
    "analysis": "Markdown text analyzing this specific section...",
    "improvements": ["Fix 1", "Fix 2"]
  },
  ...
]

**Analysis Requirements per Section:**
1. What is the key message/content here?
2. Visual design feedback (colors, spacing, hierarchy).
3. Any UX/UI issues specific to this section.
`;

        const parts = [{ text: visionPrompt }];
        for (const img of imageData) {
            parts.push({
                inlineData: {
                    mimeType: img.mimeType,
                    data: img.data
                }
            });
        }

        // Retry logic for rate limits
        let visionResponse;
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🤖 Attempt ${attempt}/${maxRetries}: Calling Gemini Vision API...`);
                visionResponse = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: [{ role: 'user', parts }],
                });
                break; // Success, exit retry loop
            } catch (err) {
                lastError = err;
                const isRateLimit = err.message && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'));

                if (isRateLimit && attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    console.warn(`⚠️ Rate limit hit. Waiting ${waitTime / 1000}s before retry ${attempt + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    throw err; // Non-rate-limit error or final retry failed
                }
            }
        }

        if (!visionResponse) {
            throw lastError || new Error('Failed to get vision response after retries');
        }

        let analysisResult = visionResponse.text;

        // Try to clean and parse the JSON if possible
        try {
            const cleanText = analysisResult.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);

            res.json({
                result: parsed,
                isStructured: true,
                reportType: 'screenshot',
                screenshots: screenshots,
                metadata: {
                    title: "Deep Visual Audit",
                    url: websiteUrl,
                    sectionsAnalyzed: screenshots.length
                }
            });
            return;
        } catch (e) {
            console.log("Could not parse JSON from AI, returning raw text", e);
            // Fallback
        }

        res.json({
            result: analysisResult,
            isStructured: false,
            reportType: 'screenshot',
            screenshots: screenshots,
            metadata: {
                title: "Deep Visual Audit",
                url: websiteUrl,
                sectionsAnalyzed: screenshots.length
            }
        });

    } catch (error) {
        console.error("Error in Segmented Screenshot Audit:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (browser) await browser.close();
    }
}

// 5. Generate Action Plan
app.post('/api/agent/generate-plan', async (req, res) => {
    try {
        const { domain, competitors, buyerPersona, adAudit, websiteAudit } = req.body;
        const prompt = `
        Act as a Chief Marketing Officer.Generate a detailed 3 - Month Action Plan based on all previous data.

        DATA:
        - Domain: ${domain}
        - Competitors: ${competitors}
        - Buyer Persona: ${buyerPersona}
        - Ad Audit Findings: ${adAudit}
        - Website Audit Findings: ${websiteAudit}

        REQUIREMENTS:
        - Divide into Month 1, Month 2, Month 3.
        - Month 1 should focus on fixing the issues found in audits.
        - Month 2 should focus on scaling and testing.
        - Month 3 should focus on optimization and ROI.
        - Format as a professional report(Markdown).
        `;

        const result = await generateGeminiContent(prompt);
        res.json({ result });
    } catch (error) {
        console.error("Error in /generate-plan:", error);
        res.status(500).json({ error: error.message });
    }
});

// 6. Ads Analyzer (New Feature)
app.post('/api/agent/social-media-audit', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });

        const apify = getApifyClient();
        console.log(`🚀 Starting Ads Analyzer for: ${url}`);

        let scrapedAds = [];
        let platform = "";

        // Detect Platform
        if (url.includes('facebook.com') || url.includes('instagram.com')) {
            platform = "Meta (Facebook/Instagram)";
            console.log('Detected Meta Ad Library URL');

            let targetUrl = url;
            // Sanitization for View All Page ID
            if (url.includes('view_all_page_id=')) {
                const match = url.match(/view_all_page_id=(\d+)/);
                if (match && match[1]) {
                    targetUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=IN&view_all_page_id=${match[1]}`;
                    console.log(`Sanitized Meta URL: ${targetUrl}`);
                }
            }

            const runInput = {
                startUrls: [{ url: targetUrl }],
                urls: [{ url: targetUrl }], // Required by this specific actor
                pageUrl: targetUrl,
                resultsLimit: 50, // Fetch enough to cover recent history
            };

            const run = await apify.actor("curious_coder/facebook-ads-library-scraper").call(runInput);
            const { items } = await apify.dataset(run.defaultDatasetId).listItems();
            scrapedAds = items || [];

        } else if (url.includes('adstransparency.google.com')) {
            platform = "Google Ads";
            console.log('Detected Google Ads Transparency Center URL');

            // Using 'apify/google-ads-transparency-scraper'
            const runInput = {
                startUrls: [{ url: url }],
                maxItems: 50,
            };

            try {
                // We use 'apify/google-ads-transparency-scraper' as the actor
                const run = await apify.actor("apify/google-ads-transparency-scraper").call(runInput);
                const { items } = await apify.dataset(run.defaultDatasetId).listItems();
                scrapedAds = items || [];
            } catch (gError) {
                console.error("Google Ads specific scraper failed", gError);
                throw new Error("Failed to scrape Google Ads. Ensure the URL is correct and the server has access: " + gError.message);
            }
        } else {
            return res.status(400).json({ error: "Unsupported URL. Please provide a valid Meta Ad Library or Google Ads Transparency Center link." });
        }

        console.log(`✅ Scraped ${scrapedAds.length} items from ${platform}`);

        if (scrapedAds.length === 0) {
            if (platform === "Google Ads") {
                throw new Error("No ads found. Google Ads Transparency Center scraping can be strict. Try a different advertiser link.");
            }
            throw new Error("No ads found in the last 3 months (or scraper failed). Please verify the link.");
        }

        // Prepare Data for Gemini
        if (scrapedAds.length > 0) {
            console.log("Sample Ad Keys:", Object.keys(scrapedAds[0]));
        }

        // Prepare Data for Gemini - handling nested structure
        const adsSummary = scrapedAds.map(ad => {
            // Facebook Ad Library returns nested structure in "snapshot.cards"
            const snapshot = ad.snapshot || {};
            const cards = snapshot.cards || [];

            // Get data from first card if available
            const firstCard = cards.length > 0 ? cards[0] : {};

            // Helper to get image
            let img = "N/A";
            if (firstCard.video_preview_image_url) {
                img = firstCard.video_preview_image_url;
            } else if (firstCard.original_image_url) {
                img = firstCard.original_image_url;
            } else if (firstCard.resized_image_url) {
                img = firstCard.resized_image_url;
            }

            return {
                text: (firstCard.body || snapshot.body?.text || "").slice(0, 300),
                headline: firstCard.title || snapshot.title || "N/A",
                cta: snapshot.cta_text || firstCard.cta_text || "N/A",
                date: ad.start_date_formatted || ad.start_date || "Unknown",
                format: snapshot.display_format || (firstCard.video_hd_url ? "Video" : "Image") || "Unknown",
                imageUrl: img
            };
        }).slice(0, 30); // Send top 30 to AI

        const prompt = `
        I have scraped the following ad data from ${platform} for a client. 
        The user wants a DETAILED Ads Analyzer Report based on ads active in the last 3 months.
        
        **Raw Ad Data (JSON Sample):**
        ${JSON.stringify(adsSummary, null, 2)}
        
        **Your Task:**
        Act as an Expert Digital Marketing Auditor. Generate a comprehensive, professional report.
        DO NOT be generic. Use the specific data provided (headlines, dates, creative types) to build your insights.
        
        **Required Report Structure (Markdown):**
        
        # 📊 Ads Analyzer Report: ${platform}
        **Date:** ${new Date().toLocaleDateString()}
        
        ## 1. 🎯 Executive Summary
        [High-level overview of the account's activity, diversity, and apparent strategy.]
        
        ## 2. 📈 Key Statistics
        - **Total Ads Analyzed:** ${scrapedAds.length} (approx available in scrape)
        - **Dominant Format:** [Video/Image/Carousel - infer from data]
        - **Primary Call-to-Action:** [e.g., Learn More, Shop Now]
        
        ## 3. 🧠 Creative Analysis
        *Analyze the "Hooks" and "Angles" used in the ad copy and headlines.*
        - **Visual Style:** [Describe based on image/video formats if known, or infer from ad types]
        - **Copywriting Approach:** [Short vs Long form? Emotional vs Logical?]
        - **Top Performing Themes:** [Identify recurring patterns in the top ads]
        
        ## 4. 🔍 detailed Insights & Observations
        - **Ad Frequency & Activity:** [Are they running many variations?]
        - **Funnel Stage:** [Top of funnel (brand awareness) vs Bottom (direct sale)?]
        - **Missing Opportunities:** [What are they NOT doing that they should?]
        
        ## 5. 💡 Strategic Recommendations
        1. **[Creative]:** [Specific idea]
        2. **[Copy]:** [Specific idea]
        3. **[Testing]:** [What simple test could improve performance?]
        
`;

        let result = await generateGeminiContent(prompt);

        // Sanitary clean-up
        result = result.replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '');

        res.json({
            result,
            metadata: {
                title: items[0].title || "Website Audit",
                url: websiteUrl,
                pagesAnalyzed: items.length,
                lighthouse: {
                    performance: getLighthouseScore('performance'),
                    accessibility: getLighthouseScore('accessibility'),
                    seo: getLighthouseScore('seo'),
                    bestPractices: getLighthouseScore('best-practices')
                }
            }
        });
    } catch (error) {
        console.error("Error in /audit-website:", error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Generate Action Plan
app.post('/api/agent/generate-plan', async (req, res) => {
    try {
        const { domain, competitors, buyerPersona, adAudit, websiteAudit } = req.body;
        const prompt = `
        Act as a Chief Marketing Officer.Generate a detailed 3 - Month Action Plan based on all previous data.

        DATA:
        - Domain: ${domain}
        - Competitors: ${competitors}
        - Buyer Persona: ${buyerPersona}
        - Ad Audit Findings: ${adAudit}
        - Website Audit Findings: ${websiteAudit}

        REQUIREMENTS:
        - Divide into Month 1, Month 2, Month 3.
        - Month 1 should focus on fixing the issues found in audits.
        - Month 2 should focus on scaling and testing.
        - Month 3 should focus on optimization and ROI.
        - Format as a professional report(Markdown).
        `;

        const result = await generateGeminiContent(prompt);
        res.json({ result });
    } catch (error) {
        console.error("Error in /generate-plan:", error);
        res.status(500).json({ error: error.message });
    }
});

// 6. Ads Analyzer (New Feature)
app.post('/api/agent/social-media-audit', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });

        const apify = getApifyClient();
        console.log(`🚀 Starting Ads Analyzer for: ${url}`);

        let scrapedAds = [];
        let platform = "";

        // Detect Platform
        if (url.includes('facebook.com') || url.includes('instagram.com')) {
            platform = "Meta (Facebook/Instagram)";
            console.log('Detected Meta Ad Library URL');

            let targetUrl = url;
            // Sanitization for View All Page ID
            if (url.includes('view_all_page_id=')) {
                const match = url.match(/view_all_page_id=(\d+)/);
                if (match && match[1]) {
                    targetUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=IN&view_all_page_id=${match[1]}`;
                    console.log(`Sanitized Meta URL: ${targetUrl}`);
                }
            }

            const runInput = {
                startUrls: [{ url: targetUrl }],
                urls: [{ url: targetUrl }], // Required by this specific actor
                pageUrl: targetUrl,
                resultsLimit: 50, // Fetch enough to cover recent history
            };

            const run = await apify.actor("curious_coder/facebook-ads-library-scraper").call(runInput);
            const { items } = await apify.dataset(run.defaultDatasetId).listItems();
            scrapedAds = items || [];

        } else if (url.includes('adstransparency.google.com')) {
            platform = "Google Ads";
            console.log('Detected Google Ads Transparency Center URL');

            // Using 'apify/google-ads-transparency-scraper'
            const runInput = {
                startUrls: [{ url: url }],
                maxItems: 50,
            };

            try {
                // We use 'apify/google-ads-transparency-scraper' as the actor
                const run = await apify.actor("apify/google-ads-transparency-scraper").call(runInput);
                const { items } = await apify.dataset(run.defaultDatasetId).listItems();
                scrapedAds = items || [];
            } catch (gError) {
                console.error("Google Ads specific scraper failed", gError);
                throw new Error("Failed to scrape Google Ads. Ensure the URL is correct and the server has access: " + gError.message);
            }
        } else {
            return res.status(400).json({ error: "Unsupported URL. Please provide a valid Meta Ad Library or Google Ads Transparency Center link." });
        }

        console.log(`✅ Scraped ${scrapedAds.length} items from ${platform}`);

        if (scrapedAds.length === 0) {
            if (platform === "Google Ads") {
                throw new Error("No ads found. Google Ads Transparency Center scraping can be strict. Try a different advertiser link.");
            }
            throw new Error("No ads found in the last 3 months (or scraper failed). Please verify the link.");
        }

        // Prepare Data for Gemini
        if (scrapedAds.length > 0) {
            console.log("Sample Ad Keys:", Object.keys(scrapedAds[0]));
        }

        // Prepare Data for Gemini - handling nested structure
        const adsSummary = scrapedAds.map(ad => {
            // Facebook Ad Library returns nested structure in "snapshot.cards"
            const snapshot = ad.snapshot || {};
            const cards = snapshot.cards || [];

            // Get data from first card if available
            const firstCard = cards.length > 0 ? cards[0] : {};

            // Helper to get image
            let img = "N/A";
            if (firstCard.video_preview_image_url) {
                img = firstCard.video_preview_image_url;
            } else if (firstCard.original_image_url) {
                img = firstCard.original_image_url;
            } else if (firstCard.resized_image_url) {
                img = firstCard.resized_image_url;
            }

            return {
                text: (firstCard.body || snapshot.body?.text || "").slice(0, 300),
                headline: firstCard.title || snapshot.title || "N/A",
                cta: snapshot.cta_text || firstCard.cta_text || "N/A",
                date: ad.start_date_formatted || ad.start_date || "Unknown",
                format: snapshot.display_format || (firstCard.video_hd_url ? "Video" : "Image") || "Unknown",
                imageUrl: img
            };
        }).slice(0, 30); // Send top 30 to AI

        const prompt = `
        I have scraped the following ad data from ${platform} for a client. 
        The user wants a DETAILED Ads Analyzer Report based on ads active in the last 3 months.
        
        **Raw Ad Data (JSON Sample):**
        ${JSON.stringify(adsSummary, null, 2)}
        
        **Your Task:**
        Act as an Expert Digital Marketing Auditor. Generate a comprehensive, professional report.
        DO NOT be generic. Use the specific data provided (headlines, dates, creative types) to build your insights.
        
        **Required Report Structure (Markdown):**
        
        # 📊 Ads Analyzer Report: ${platform}
        **Date:** ${new Date().toLocaleDateString()}
        
        ## 1. 🎯 Executive Summary
        [High-level overview of the account's activity, diversity, and apparent strategy.]
        
        ## 2. 📈 Key Statistics
        - **Total Ads Analyzed:** ${scrapedAds.length} (approx available in scrape)
        - **Dominant Format:** [Video/Image/Carousel - infer from data]
        - **Primary Call-to-Action:** [e.g., Learn More, Shop Now]
        
        ## 3. 🧠 Creative Analysis
        *Analyze the "Hooks" and "Angles" used in the ad copy and headlines.*
        - **Visual Style:** [Describe based on image/video formats if known, or infer from ad types]
        - **Copywriting Approach:** [Short vs Long form? Emotional vs Logical?]
        - **Top Performing Themes:** [Identify recurring patterns in the top ads]
        
        ## 4. 🔍 detailed Insights & Observations
        - **Ad Frequency & Activity:** [Are they running many variations?]
        - **Funnel Stage:** [Top of funnel (brand awareness) vs Bottom (direct sale)?]
        - **Missing Opportunities:** [What are they NOT doing that they should?]
        
        ## 5. 💡 Strategic Recommendations
        1. **[Creative]:** [Specific idea]
        2. **[Copy]:** [Specific idea]
        3. **[Testing]:** [What simple test could improve performance?]
        
        **Note:** This report is generated by **gemini-3-pro-preview**.
        `;

        // Use the SPECIFIC MODEL requested - the helper function defaults to gemini-3-pro-preview
        try {
            const report = await generateGeminiContent(prompt);
            res.json({ result: report });
        } catch (modelError) {
            console.error('Gemini extraction failed:', modelError.message);
            res.status(500).json({ error: "Failed to generate report with AI: " + modelError.message });
        }

    } catch (error) {
        console.error("Error in /social-media-audit:", error);
        res.status(500).json({ error: error.message });
    }
});

// 7. Simplify Report Language (Convert technical jargon to easy English)
app.post('/api/agent/simplify-report', async (req, res) => {
    try {
        const { reportContent } = req.body;
        if (!reportContent) return res.status(400).json({ error: "Report content is required" });

        console.log('📝 Simplifying report language...');

        const prompt = `
        You are given a technical marketing audit report below. Your task is to rewrite it in SIMPLE, EASY-TO-UNDERSTAND ENGLISH.
        
        **Guidelines:**
        - Replace all marketing jargon with everyday language
        - Explain technical terms in brackets if needed
        - Keep the same structure and formatting (headings, bullet points, emojis)
        - Make it readable for someone with no marketing background
        - Keep all numbers and statistics exactly the same
        - Don't remove any important information, just simplify the language
        
        **Original Report:**
        ${reportContent}
        
        **Your Simplified Version (in Markdown):**
        `;

        const simplifiedReport = await generateGeminiContent(prompt);
        res.json({ result: simplifiedReport });

    } catch (error) {
        console.error("Error in /simplify-report:", error);
        res.status(500).json({ error: error.message });
    }
});

// 8. Social Media Profile Audit (Multi-Platform)
app.post('/api/agent/profile-audit', async (req, res) => {
    try {
        const { urls } = req.body;
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: "Please provide a list of social media profile URLs." });
        }

        const apify = getApifyClient();
        console.log(`🚀 Starting Profile Audit for ${urls.length} URLs`);

        const scrapedData = {};
        const errors = [];

        // Helper to process date filtering (last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        await Promise.all(urls.map(async (url) => {
            try {
                if (url.includes('instagram.com')) {
                    console.log(`📸 Scraping Instagram: ${url}`);
                    // Usage of apify/instagram-scraper
                    // Input: directUrls array
                    const run = await apify.actor("apify/instagram-scraper").call({
                        directUrls: [url],
                        resultsLimit: 12, // Last ~12 posts should cover recent activity
                        searchType: "hashtag", // Default, but ignored for directUrls usually
                        searchLimit: 1,
                    });
                    const { items } = await apify.dataset(run.defaultDatasetId).listItems();

                    // Filter and map
                    const recentPosts = items.filter(item => {
                        const date = new Date(item.timestamp || item.takenAt);
                        return date >= threeMonthsAgo;
                    }).map(post => ({
                        type: post.type,
                        caption: post.caption,
                        likes: post.likesCount,
                        comments: post.commentsCount,
                        date: post.timestamp,
                        url: post.url
                    }));

                    scrapedData['Instagram'] = {
                        profile: url,
                        postsCount: recentPosts.length,
                        data: recentPosts
                    };

                } else if (url.includes('youtube.com')) {
                    console.log(` ▶️ Scraping YouTube: ${url}`);
                    // Usage of streamrot/youtube-scraper or apify/youtube-scraper
                    // We'll use a generic reliable one if possible, or 'apify/youtube-scraper'
                    const run = await apify.actor("apify/youtube-scraper").call({
                        startUrls: [{ url }],
                        maxResult: 10,
                    });
                    const { items } = await apify.dataset(run.defaultDatasetId).listItems();

                    // Map typical Youtube output
                    const recentVideos = items.filter(video => {
                        // YouTube scraper date parsing can be tricky, often returns "2 days ago".
                        // We'll accept top 10 as "recent" for now.
                        return true;
                    }).map(v => ({
                        title: v.title,
                        views: v.viewCount,
                        date: v.date, // text like "2 weeks ago" usually
                        duration: v.duration,
                        url: v.url
                    }));

                    scrapedData['YouTube'] = {
                        profile: url,
                        data: recentVideos
                    };
                } else {
                    // Generic or unsupported (LinkedIn is hard without auth)
                    console.log(`⚠️ Unsupported or restricted platform: ${url}`);
                    scrapedData['Other'] = scrapedData['Other'] || [];
                    scrapedData['Other'].push(url);
                }
            } catch (err) {
                console.error(`❌ Failed to scrape ${url}:`, err.message);
                errors.push(`${url}: ${err.message}`);
            }
        }));

        console.log('✅ Scraping complete. Generating Report...');

        // Prepare Gemini Prompt
        const prompt = `
        I have collected social media data for a client audit.
        
        **Client Social Links:** ${urls.join(', ')}
        
        **Scraped Data Context (Last 3 Months):**
        ${JSON.stringify(scrapedData, null, 2)}
        
        **Errors/Missing Data:**
        ${JSON.stringify(errors)}
        
        **Task:**
        Act as a Senior Social Media Strategist. Analyze the provided data and generate a "Social Media Audit Report".
        
        **Required Report Structure:**
        
        # 🛡️ Social Media Audit Report
        **Date:** ${new Date().toLocaleDateString()}
        
        ## 1. 📸 Account Snapshot
        [Summary of active platforms, follower counts (if visible), and posting frequency.]
        
        ## 2. 📍 Profile & Positioning Review
        [Analyze the bios, profile pics, and "About" sections. Is the brand message clear?]
        
        ## 3. 💎 Content Quality & Engagement
        [Review the metrics. Are they getting likes/comments? Is the content high-quality/visual?]
        
        ## 4. 🎙️ Podcast Utilization
        [Check if they have any long-form content, video interviews, or audio snippets. If none, suggest it.]
        
        ## 5. 🎨 Visual Identity & Brand Consistency
        [Do the thumbnails/posts look consistent in color/style across platforms?]
        
        ## 6. ❤️ Engagement Health Check
        [Are they replying to comments? Is the audience active or dormant?]
        
        ## 7. 🚀 Growth & Monetization Potential
        [Where is the low-hanging fruit? What should they double down on?]
        
        ## 8. 📝 Final SWOT Summary
        - **Strengths:**
        - **Weaknesses:**
        - **Opportunities:**
        - **Threats:**
        `;

        const report = await generateGeminiContent(prompt);
        res.json({ result: report });

    } catch (error) {
        console.error("Error in /profile-audit:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Marketing Agent Server (Gemini Powered) listening on port ${PORT}`);
});
