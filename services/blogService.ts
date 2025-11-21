import { GoogleGenAI } from "@google/genai";

// Lazily initialize the AI client
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

export interface BlogInput {
    topic: string;
    websiteUrl: string;
    wordCount: number;
}

const fetchWebsiteContent = async (url: string): Promise<string> => {
    // List of CORS proxies to try
    const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];

    let lastError: Error | null = null;

    // Try each proxy
    for (const proxyUrl of proxies) {
        try {
            console.log(`Attempting to fetch website via proxy: ${proxyUrl}`);

            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/html',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            let html: string;

            // Handle different proxy response formats
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const data = await response.json();
                // allorigins.win format
                if (data.contents) {
                    html = data.contents;
                }
                // Other JSON formats
                else if (typeof data === 'string') {
                    html = data;
                } else {
                    throw new Error('Unexpected JSON response format');
                }
            } else {
                // Plain text/html response
                html = await response.text();
            }

            if (!html || html.trim().length === 0) {
                throw new Error('Empty response from proxy');
            }

            // Basic HTML parsing to extract text content
            // Remove script and style tags
            const cleanHtml = html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (cleanHtml.length < 50) {
                throw new Error('Insufficient content extracted from website');
            }

            // Limit to first 3000 characters to avoid token limits
            console.log(`Successfully fetched website content (${cleanHtml.length} characters)`);
            return cleanHtml.substring(0, 3000);

        } catch (error) {
            console.error(`Proxy failed: ${proxyUrl}`, error);
            lastError = error instanceof Error ? error : new Error(String(error));
            // Continue to next proxy
        }
    }

    // All proxies failed
    console.error("All CORS proxies failed to fetch website content");
    throw new Error(
        `Unable to fetch website content. The website may be blocking automated requests or all proxy services are currently unavailable. ` +
        `Please try again later or use a different website URL. Last error: ${lastError?.message || 'Unknown error'}`
    );
};

const constructPrompt = (input: BlogInput, websiteContent: string): string => {
    return `You are an expert SEO content writer and digital marketing specialist.

**Task:** Write a comprehensive, SEO-optimized blog post.

**Blog Topic:** ${input.topic}

**Target Word Count:** ${input.wordCount} words

**Client Website Context:**
${websiteContent}

**Requirements:**

1. **SEO Optimization:**
   - Include a compelling H1 title with the main keyword
   - Use H2 and H3 subheadings strategically
   - Naturally incorporate relevant keywords throughout
   - Write a meta description (150-160 characters)
   - Ensure proper keyword density (1-2%)

2. **Content Quality:**
   - Engaging introduction that hooks the reader
   - Well-structured body with clear sections
   - Use bullet points and numbered lists where appropriate
   - Include actionable insights and practical tips
   - Strong conclusion with a call-to-action

3. **Client Integration:**
   - Analyze the client's products/services from the website content
   - Naturally weave in mentions of the client's offerings where relevant
   - Do NOT make it sound like a sales pitch
   - Keep the focus on providing value to the reader

4. **Format:**
   - Use Markdown formatting
   - Start with the meta description in a blockquote
   - Follow with the H1 title
   - Use proper heading hierarchy

**Output Structure:**
\`\`\`
> Meta Description: [Your 150-160 character meta description]

# [H1 Title]

[Introduction paragraph]

## [H2 Subheading]

[Content...]

## [H2 Subheading]

[Content...]

### [H3 Subheading if needed]

[Content...]

## Conclusion

[Conclusion with CTA]
\`\`\`

Write the blog now.`;
};

export const generateSEOBlog = async (input: BlogInput): Promise<string> => {
    // Fetch website content
    const websiteContent = await fetchWebsiteContent(input.websiteUrl);

    const prompt = constructPrompt(input, websiteContent);

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
