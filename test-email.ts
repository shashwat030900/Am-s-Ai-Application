import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testEmail() {
    console.log("Reading .env.local...");
    const envPath = path.join(__dirname, '.env.local');

    if (!fs.existsSync(envPath)) {
        console.error("❌ .env.local file not found!");
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};

    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            }
        }
    });

    const serviceId = env['VITE_EMAILJS_SERVICE_ID'];
    const templateId = env['VITE_EMAILJS_TEMPLATE_ID'];
    const publicKey = env['VITE_EMAILJS_PUBLIC_KEY'];

    if (!serviceId || !templateId || !publicKey) {
        console.error("❌ Missing EmailJS configuration in .env.local");
        console.log("Found:", { serviceId, templateId, publicKey });
        return;
    }

    console.log("Configuration found:");
    console.log(`Service ID: ${serviceId}`);
    console.log(`Template ID: ${templateId}`);
    console.log(`Public Key: ${publicKey}`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated Test OTP: ${otp}`);

    const data = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
            to_email: 'teamai7210@gmail.com', // Sending to the sender for testing, or we could ask user
            otp: otp,
        }
    };

    console.log("Sending request to EmailJS API...");

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            console.log("✅ Email sent successfully!");
            console.log(`Check your inbox (teamai7210@gmail.com) for OTP: ${otp}`);
        } else {
            const text = await response.text();
            console.error(`❌ Failed to send email: ${response.status} ${response.statusText}`);
            console.error("Response:", text);
        }
    } catch (error) {
        console.error("❌ Network error:", error);
    }
}

testEmail();
