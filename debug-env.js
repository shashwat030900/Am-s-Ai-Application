
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');

console.log('--- Debugging .env.local ---');
console.log('Looking for file at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('File exists.');
    try {
        const content = fs.readFileSync(envPath, 'utf-8');
        console.log('File read successfully.');

        const lines = content.split('\n');
        let found = false;

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('VITE_APIFY_API_TOKEN')) {
                found = true;
                const parts = trimmed.split('=');
                if (parts.length > 1 && parts[1].trim().length > 0) {
                    console.log(`[Line ${idx + 1}] Found VITE_APIFY_API_TOKEN. Value length: ${parts[1].trim().length}`);
                    console.log(`[Line ${idx + 1}] Raw line start: "${trimmed.substring(0, 25)}..."`);
                } else {
                    console.log(`[Line ${idx + 1}] Found key, but value seems empty.`);
                }
            }
        });

        if (!found) {
            console.log('❌ VITE_APIFY_API_TOKEN key NOT found in file.');
            console.log('First 5 lines of file (first 10 chars each):');
            lines.slice(0, 5).forEach((l, i) => console.log(`${i + 1}: ${l.substring(0, 10)}...`));
        }

    } catch (e) {
        console.error('Error reading file:', e.message);
    }
} else {
    console.error('❌ File .env.local does NOT exist at this path.');

    // Check for .env
    if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
        console.log('Found .env instead.');
    } else {
        console.log('No .env file found either.');
    }
}
console.log('----------------------------');
