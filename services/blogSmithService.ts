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
    numberOfInlineImages: number;
    wordCount?: number;
    language?: string;
    clientWebsiteUrl?: string;
}

export interface BlogPostOutput {
    title: string;
    content: string[];
}

export interface ImageOutput {
    imageUrl: string;
}

// Helper to convert Markdown artifacts to HTML if the AI slips up
const cleanContent = (text: string): string => {
    let cleaned = text;

    // Convert Markdown headings (## Heading) to <h2>Heading</h2>
    if (cleaned.startsWith('##')) {
        cleaned = cleaned.replace(/^##\s*(.+)$/, '<h2>$1</h2>');
    }
    // Convert Markdown headings (### Heading) to <h3>Heading</h3>
    if (cleaned.startsWith('###')) {
        cleaned = cleaned.replace(/^###\s*(.+)$/, '<h3>$1</h3>');
    }

    // Convert Markdown links [text](url) to <a href="url">text</a>
    cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">$1</a>');

    // Convert bold **text** to <strong>text</strong>
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Convert italic *text* to <em>text</em>
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return cleaned;
};

export const generateBlogPost = async (input: BlogInput): Promise<BlogPostOutput> => {
    const client = getAiClient();

    const prompt = `
    You are an expert content creator, SEO specialist, and researcher. Your task is to perform deep research on the given topic and then write a comprehensive, engaging, and well-researched blog post.

    Your topic is: ${input.topic}.
    You must write the blog post in the following language: ${input.language || 'English'}.

    Follow these guidelines meticulously:

    **1. Audience and Purpose:**
    - **Identify Your Reader:** Assume the audience is intelligent but may not be an expert on the topic. Use clear, accessible language.
    - **Define Your Goal:** The goal is to inform and engage the reader, encouraging them to see the topic from a new perspective or learn something valuable.
    - **Craft a Strong Headline:** The title must be clear, compelling, and include relevant keywords.
    
    ${input.clientWebsiteUrl ? `
    **2. Client-Centric Content Strategy:**
    - **Deep Website Analysis:** You MUST perform a deep analysis of the content at the following website: ${input.clientWebsiteUrl}.
    - **Adopt Brand Voice:** Write the blog post in the exact same tone, voice, and style as the content on that website.
    - **Integrate Products/Services:** Connect the blog topic to the client's offerings naturally.
    ` : ''}

    **3. Structure and Readability:**
    - **Word Count:** The article must be approximately ${input.wordCount || 1200} words.
    - **Subheadings:** Break up large blocks of text with clear subheadings (using only <h2> tags).
    - **Create a Logical Flow:** Introduction -> Body -> Conclusion.
    - **Use Lists:** Use <ul> and <li> for lists.

    **4. SEO:**
    - **Use Keywords Naturally.**
    - **Include Internal and External Links:** Aim for at least one hyperlink for every two paragraphs.
    
    **5. Visuals:**
    - **Inline Images**: To insert an image, you MUST use the 'numberOfInlineImages' parameter (${input.numberOfInlineImages}). For each requested image, you must insert a placeholder paragraph containing only the text "[GENERATE_IMAGE: Add a short, descriptive hint for the image content here]". For example: "[GENERATE_IMAGE: A person looking at a chart on a screen]". Do not include any other text in that paragraph.

    **6. Engaging Style:**
    - **Be Authentic and Conversational.**
    - **Start with a Hook.**
    - **Use a Strong CTA.**

    **7. Final Output Format:**
    - Return JSON with "title" (string) and "content" (array of strings).
    - Each string in "content" MUST be valid HTML.
    - Subheadings MUST be wrapped in <h2> tags (e.g., "<h2>My Heading</h2>"). DO NOT use markdown (##).
    - Paragraphs should be plain text or contain HTML tags like <strong>, <em>, <a href="...">.
    - Image placeholders should be exactly as specified.
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        title: { type: 'STRING' },
                        content: {
                            type: 'ARRAY',
                            items: { type: 'STRING' }
                        }
                    },
                    required: ['title', 'content']
                }
            }
        });

        if (response.text) {
            const text = response.text;
            const parsed = JSON.parse(text) as BlogPostOutput;

            // Post-processing to clean up any Markdown that slipped through
            parsed.content = parsed.content.map(cleanContent);
            return parsed;
        }
        throw new Error("Failed to parse AI response");
    } catch (error) {
        console.error("Error generating blog post:", error);
        throw error;
    }
};

export const generateImage = async (topic: string, hint?: string): Promise<ImageOutput | null> => {
    try {
        const client = getAiClient();
        const prompt = hint
            ? `Create a professional, high-quality image for a blog post about "${topic}". Focus on: ${hint}. Style: photorealistic, 16:9 aspect ratio, vibrant colors, professional composition.`
            : `Create a professional, high-quality image for a blog post about "${topic}". Style: photorealistic, 16:9 aspect ratio, vibrant colors, professional composition.`;

        console.log('[BlogSmith] Generating image with Gemini for:', prompt.substring(0, 100));

        // Try Gemini image generation model
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash-exp-image-generation',
            contents: prompt,
        });

        console.log('[BlogSmith] Image generation response received');
        console.log('[BlogSmith] Response structure:', JSON.stringify(response, null, 2).substring(0, 500));

        // Check for image data in response
        if (response.candidates && response.candidates[0]?.content?.parts) {
            console.log('[BlogSmith] Found candidates with parts:', response.candidates[0].content.parts.length);

            for (const part of response.candidates[0].content.parts) {
                console.log('[BlogSmith] Part type:', typeof part, 'Keys:', Object.keys(part));

                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    console.log('[BlogSmith] Image generated successfully');
                    return { imageUrl };
                }

                // Also check for text responses that might contain image URLs
                if (part.text) {
                    console.log('[BlogSmith] Found text in response:', part.text.substring(0, 100));
                }
            }
        } else {
            console.log('[BlogSmith] No candidates or parts found in response');
        }

        console.warn('[BlogSmith] No image found in Gemini response, falling back to Pollinations AI');

        // Fallback to Pollinations AI if Gemini doesn't return an image
        const fallbackPrompt = hint ? `${topic} ${hint}` : topic;
        const seed = Math.floor(Math.random() * 10000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=1280&height=720&seed=${seed}&nologo=true`;
        return { imageUrl };
    } catch (error) {
        console.error('[BlogSmith] Error generating image with Gemini:', error);

        // Fallback to Pollinations AI on error
        console.log('[BlogSmith] Falling back to Pollinations AI');
        const fallbackPrompt = hint ? `${topic} ${hint}` : topic;
        const seed = Math.floor(Math.random() * 10000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=1280&height=720&seed=${seed}&nologo=true`;
        return { imageUrl };
    }
};

export const regenerateParagraph = async (topic: string, paragraph: string): Promise<{ newParagraph: string }> => {
    const client = getAiClient();
    const prompt = `
    Topic: ${topic}
    
    Please rewrite the following paragraph to be more engaging, clear, and concise, while maintaining the original meaning.
    
    Original Paragraph:
    "${paragraph}"
    
    Return JSON with "newParagraph".
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        newParagraph: { type: 'STRING' }
                    }
                }
            }
        });

        if (response.text) {
            const text = response.text;
            const parsed = JSON.parse(text);
            // Clean up the regenerated paragraph too
            return { newParagraph: cleanContent(parsed.newParagraph) };
        }
        throw new Error("Failed to parse response");
    } catch (error) {
        console.error("Error regenerating paragraph:", error);
        throw error;
    }
};

export const publishToWordPress = async (title: string, content: string, siteUrl: string, username: string, password: string) => {
    // Basic WordPress REST API implementation
    const endpoint = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
    const auth = btoa(`${username}:${password}`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({
                title: title,
                content: content,
                status: 'draft' // Publish as draft by default
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to publish to WordPress');
        }

        const data = await response.json();
        return { postUrl: data.link };
    } catch (error) {
        console.error("Error publishing to WordPress:", error);
        throw error;
    }
};
