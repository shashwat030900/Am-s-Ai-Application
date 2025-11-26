import { getCurrentUser } from './authService';

// History Entry Model
export interface HistoryEntry {
    id: string;
    appName: 'Customer Avatar' | 'Master Prompt' | 'SEO Blog Writer' | 'Content Research';
    timestamp: number;
    userEmail: string;
    input: any; // Flexible to accommodate different app inputs
    output: string;
}

const MAX_HISTORY_ITEMS = 5;

const getStorageKey = (userEmail: string): string => {
    return `chat_history_${userEmail}`;
};

// Get all history for the current user
export const getHistory = (): HistoryEntry[] => {
    const userEmail = getCurrentUser();
    if (!userEmail) return [];

    const storageKey = getStorageKey(userEmail);
    const data = localStorage.getItem(storageKey);

    if (!data) return [];

    try {
        const history = JSON.parse(data) as HistoryEntry[];
        // Sort by timestamp descending (newest first)
        return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Failed to parse history:', error);
        return [];
    }
};

// Save a new history entry
export const saveHistory = (
    appName: HistoryEntry['appName'],
    input: any,
    output: string
): void => {
    const userEmail = getCurrentUser();
    if (!userEmail) {
        console.warn('Cannot save history: No user logged in');
        return;
    }

    const newEntry: HistoryEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        appName,
        timestamp: Date.now(),
        userEmail,
        input,
        output,
    };

    const currentHistory = getHistory();

    // Add new entry at the beginning
    const updatedHistory = [newEntry, ...currentHistory];

    // Keep only the last MAX_HISTORY_ITEMS
    const trimmedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);

    const storageKey = getStorageKey(userEmail);
    localStorage.setItem(storageKey, JSON.stringify(trimmedHistory));
};

// Delete a specific history entry
export const deleteHistoryItem = (id: string): void => {
    const userEmail = getCurrentUser();
    if (!userEmail) return;

    const currentHistory = getHistory();
    const updatedHistory = currentHistory.filter(entry => entry.id !== id);

    const storageKey = getStorageKey(userEmail);
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
};

// Clear all history for the current user
export const clearHistory = (): void => {
    const userEmail = getCurrentUser();
    if (!userEmail) return;

    const storageKey = getStorageKey(userEmail);
    localStorage.removeItem(storageKey);
};

// Format timestamp to relative time
export const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
};
