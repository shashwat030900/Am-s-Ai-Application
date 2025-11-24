export interface N8nResponse {
    success: boolean;
    data?: any;
    error?: string;
    status?: number;
}

export const sendToWebhook = async (url: string, payload: any, method: 'GET' | 'POST' = 'POST', useProxy: boolean = false, noCors: boolean = false): Promise<N8nResponse> => {
    if (!url) {
        return {
            success: false,
            error: 'Webhook URL is required'
        };
    }

    try {
        let fetchUrl = url;

        // For GET requests, append payload as query parameters
        if (method === 'GET' && payload && Object.keys(payload).length > 0) {
            const queryParams = new URLSearchParams();
            Object.entries(payload).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    queryParams.append(key, JSON.stringify(value));
                } else {
                    queryParams.append(key, String(value));
                }
            });
            const separator = fetchUrl.includes('?') ? '&' : '?';
            fetchUrl += `${separator}${queryParams.toString()}`;
        }

        // Proxy logic
        if (useProxy && !noCors) {
            if (method === 'GET') {
                // Use allorigins for GET as it often bypasses ngrok browser checks better
                // Add timestamp to prevent caching
                fetchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(fetchUrl)}&disableCache=true`;
            } else {
                // Use corsproxy.io for POST
                fetchUrl = `https://corsproxy.io/?${encodeURIComponent(fetchUrl)}`;
            }
        }

        const headers: Record<string, string> = {};

        // Only add ngrok header if NOT using proxy and NOT no-cors
        // Adding it with proxy causes CORS preflight failure
        if (!useProxy && !noCors) {
            headers['ngrok-skip-browser-warning'] = 'true';
        }

        // Only add Content-Type for POST requests or if payload exists
        if (method === 'POST' && !noCors) {
            headers['Content-Type'] = 'application/json';
        }

        const options: RequestInit = {
            method: method,
            headers: headers,
        };

        if (noCors) {
            options.mode = 'no-cors';
        }

        // Only add body for POST requests
        if (method === 'POST') {
            options.body = JSON.stringify(payload);
        }

        const response = await fetch(fetchUrl, options);

        if (noCors) {
            return {
                success: true,
                data: { message: "Request sent (Opaque response due to No-CORS mode)" },
                status: 0
            };
        }

        let data = await response.json().catch(() => null);
        let status = response.status;

        // Handle allorigins response format
        if (useProxy && method === 'GET' && data && data.contents) {
            try {
                // allorigins returns the body in 'contents'
                // If the webhook returned JSON, parse it
                const parsedContents = JSON.parse(data.contents);
                data = parsedContents;
            } catch {
                // If not JSON, use as is
                data = data.contents;
            }

            // allorigins returns status in 'status.http_code'
            if (data && data.status && data.status.http_code) {
                status = data.status.http_code;
            } else {
                // Fallback: if allorigins succeeded, assume 200 unless we have other info
                status = 200;
            }
        }

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            // Specific help for 404 on POST
            if (response.status === 404 && method === 'POST') {
                errorMessage += ' - Check if your n8n Webhook node is set to "POST" method.';
            }

            return {
                success: false,
                error: errorMessage,
                status: response.status,
                data
            };
        }

        return {
            success: true,
            data,
            status: status
        };
    } catch (error) {
        console.error('Error sending to n8n webhook:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send request'
        };
    }
};

export const saveWebhookUrl = (url: string): void => {
    localStorage.setItem('n8n_webhook_url', url);
};

export const getSavedWebhookUrl = (): string => {
    return localStorage.getItem('n8n_webhook_url') || '';
};
