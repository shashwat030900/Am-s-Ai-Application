
export const sendToN8nWorkflow = async (webhookUrl: string, payload: object): Promise<any> => {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorBody}`);
        }

        // n8n can return different content types, so we handle JSON and text
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }

    } catch (error) {
        console.error("Error sending request to n8n webhook:", error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             // This specific error message is crucial for the UI to detect a CORS issue.
             throw new Error("CORS Error: The request was blocked by the browser's CORS policy. This is a security feature, not a bug.");
        }
        if (error instanceof Error) {
            throw new Error(`Network or execution error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while contacting the n8n workflow.");
    }
};