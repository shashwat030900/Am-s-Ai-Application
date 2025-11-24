/// <reference types="vite/client" />
import emailjs from '@emailjs/browser';

// Simulated Auth Service with Real EmailJS

const ALLOWED_DOMAIN = 'bloomxsolutions.com';
const OTP_STORAGE_KEY = 'auth_otp';
const AUTH_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'auth_user';
const PROFILE_STORAGE_KEY = 'user_profile';

// EmailJS Configuration
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendOtp = async (email: string): Promise<boolean> => {
    // 1. Validate Domain
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        throw new Error(`Access restricted. Only emails from @${ALLOWED_DOMAIN} are allowed.`);
    }

    // 2. Check Configuration
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY || TEMPLATE_ID.includes('YOUR_TEMPLATE_ID')) {
        console.error("EmailJS Configuration Missing:", { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY });
        throw new Error("Email service is not fully configured. Please check .env.local");
    }

    // 3. Generate Random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Store OTP
    localStorage.setItem(OTP_STORAGE_KEY, otp);

    // 5. Send Email via EmailJS
    try {
        // Calculate expiry time (15 minutes from now)
        const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
        const timeString = expiryTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const templateParams = {
            to_email: email,
            otp: otp,
            time: timeString,
        };

        console.log("Attempting to send OTP via EmailJS...");
        console.log("Service ID:", SERVICE_ID);
        console.log("Template ID:", TEMPLATE_ID);
        console.log("Public Key:", PUBLIC_KEY);
        console.log("Template Params:", JSON.stringify(templateParams, null, 2));

        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log(`[EmailJS] OTP sent to ${email}. OTP was: ${otp}`);
        return true;
    } catch (error) {
        console.error('[EmailJS] Failed to send OTP:', error);
        throw new Error("Failed to send verification email. Please try again.");
    }
};

export const verifyOtp = async (email: string, code: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const storedOtp = localStorage.getItem(OTP_STORAGE_KEY);

    if (storedOtp === code) {
        // Success!
        localStorage.removeItem(OTP_STORAGE_KEY); // Clear used OTP
        localStorage.setItem(AUTH_STORAGE_KEY, 'true'); // Set session
        localStorage.setItem(USER_STORAGE_KEY, email); // Store user info
        return true;
    }

    throw new Error("Invalid verification code. Please try again.");
};

export const isAuthenticated = (): boolean => {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
};

export const getCurrentUser = (): string | null => {
    return localStorage.getItem(USER_STORAGE_KEY);
};

export const logout = (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = '/'; // Force reload/redirect
};

// Profile Management
export interface UserProfile {
    fullName: string;
    role: string;
    phone?: string;
    email: string;
}

export const hasProfile = (): boolean => {
    return localStorage.getItem(PROFILE_STORAGE_KEY) !== null;
};

export const saveProfile = (profile: UserProfile): void => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
};

export const getProfile = (): UserProfile | null => {
    const data = localStorage.getItem(PROFILE_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
};

export const updateProfile = (updates: Partial<UserProfile>): void => {
    const current = getProfile();
    if (current) {
        saveProfile({ ...current, ...updates });
    }
};
