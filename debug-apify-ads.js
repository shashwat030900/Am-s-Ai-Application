import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const token = process.env.VITE_APIFY_API_TOKEN;
if (!token) {
    console.error("No API Token found!");
    process.exit(1);
}

const client = new ApifyClient({ token });

// Simplified URL - focusing on the Page ID
const adLibraryUrl = "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=IN&view_all_page_id=100150782402698";

// Configuration from server/index.js - Restored
const runInput = {
    startUrls: [{ url: adLibraryUrl }],
    urls: [{ url: adLibraryUrl }],
    pageUrl: adLibraryUrl,
    maxItems: 5,
};

async function testScraper() {
    console.log("Testing Apify Scraper (curious_coder/facebook-ads-library-scraper) with URL:", adLibraryUrl);
    try {
        const run = await client.actor("curious_coder/facebook-ads-library-scraper").call(runInput);
        console.log("Run finished. defaultDatasetId:", run.defaultDatasetId);

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Scraped ${items.length} items.`);

        if (items.length > 0) {
            const fs = await import('fs');
            fs.writeFileSync('debug_output.json', JSON.stringify(items[0], null, 2));
            console.log("Wrote first item to debug_output.json");
        } else {
            console.log("No items found.");
        }
    } catch (error) {
        console.error("Error running actor:", error);
    }
}

testScraper();
