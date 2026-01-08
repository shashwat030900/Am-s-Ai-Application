import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const client = new ApifyClient({
    token: process.env.VITE_APIFY_API_TOKEN || process.env.APIFY_API_TOKEN,
});

async function test() {
    const url = 'https://astroarunpandit.org/';
    console.log(`Testing scrapers for ${url}...`);

    try {
        const runInput = {
            startUrls: [{ url }],
            maxCrawlDepth: 1,
            maxPagesPerCrawl: 3,
            saveMarkdown: true,
        };
        const run = await client.actor("apify/website-content-crawler").call(runInput);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`Found ${items.length} pages.`);
        items.forEach((item, i) => {
            console.log(`Page ${i + 1}: ${item.url}`);
            console.log(`Markdown length: ${item.markdown?.length || 0}`);
            if (item.markdown) {
                console.log(`Snippet: ${item.markdown.slice(0, 200)}`);
            }
        });
    } catch (e) {
        console.error(e);
    }
}

test();
