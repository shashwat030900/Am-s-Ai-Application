
import React, { useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { sendToN8nWorkflow } from '../services/n8nService';

interface N8nWorkflowAppProps {
    onNavigateBack: () => void;
}

const n8nLoadingMessages = [
    "Establishing connection to webhook...",
    "Transmitting data securely...",
    "Awaiting response from workflow...",
    "Processing automation results...",
];

const exampleJson = JSON.stringify({
  "name": "BloomX User",
  "message": "This is a test request from the AI Dashboard!"
}, null, 2);

export const N8nWorkflowApp: React.FC<N8nWorkflowAppProps> = ({ onNavigateBack }) => {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [jsonData, setJsonData] = useState(exampleJson);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCorsError, setIsCorsError] = useState(false);
    const [response, setResponse] = useState<string | null>(null);

    const handleSend = useCallback(async () => {
        if (!webhookUrl.trim()) {
            setError('Please enter a valid n8n Webhook URL.');
            return;
        }

        let parsedPayload;
        try {
            parsedPayload = JSON.parse(jsonData);
        } catch (e) {
            setError('The provided JSON is invalid. Please check the syntax.');
            return;
        }

        setIsLoading(true);
        setResponse(null);
        setError(null);
        setIsCorsError(false);

        try {
            const result = await sendToN8nWorkflow(webhookUrl, parsedPayload);
            const formattedResult = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            setResponse(formattedResult);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (errorMessage.startsWith('CORS Error:')) {
                setIsCorsError(true);
                setError(errorMessage);
            } else {
                setError(`Failed to execute workflow. ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [webhookUrl, jsonData]);

    const handleCloseModal = () => {
        setError(null);
        setIsCorsError(false);
    }

    return (
        <>
            <Header
                title="n8n Workflow Connector"
                subtitle="Connect to your external automations"
                onBack={onNavigateBack}
            />
            {isLoading && <Loader messages={n8nLoadingMessages} />}
            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Input Form */}
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
                        <div>
                            <label htmlFor="webhookUrl" className="block text-sm font-medium text-indigo-400 mb-2">
                                n8n Webhook URL
                            </label>
                            <input
                                type="url"
                                id="webhookUrl"
                                className="w-full bg-gray-700 text-gray-100 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="https://your-n8n-instance.com/webhook/..."
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                             <label htmlFor="jsonData" className="block text-sm font-medium text-indigo-400 mb-2">
                                JSON Payload to Send
                            </label>
                            <textarea
                                id="jsonData"
                                rows={8}
                                className="w-full bg-gray-700 text-gray-100 border border-gray-600 rounded-md p-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                value={jsonData}
                                onChange={(e) => setJsonData(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? 'Sending...' : 'Send to Workflow'}
                        </button>
                    </div>

                    {/* Troubleshooting Note */}
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-2">Having Connection Issues?</h3>
                        <p className="text-gray-300 text-sm mb-3">
                            If you see a "Failed to fetch" or "CORS policy" error, it's due to browser security rules. Your n8n server needs to explicitly permit requests from this web application.
                        </p>
                        <p className="text-gray-300 text-sm">
                            <strong>Solution:</strong> You need to configure the CORS settings on your n8n instance. This is typically done by setting the <code className="bg-gray-700 text-indigo-300 px-1 py-0.5 rounded">N8N_CORS_ALLOW_ORIGIN</code> environment variable to allow this dashboard's URL.
                        </p>
                        <a 
                            href="https://docs.n8n.io/hosting/configuration/environment-variables/#cors" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-cyan-400 text-sm font-semibold hover:underline mt-3 inline-block"
                        >
                            Read n8n CORS Documentation &rarr;
                        </a>
                    </div>

                    {/* Output Display */}
                    {response && !isLoading && (
                        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                             <h3 className="text-xl font-semibold text-indigo-300 mb-4 border-b border-gray-600 pb-2">Workflow Response</h3>
                             <pre className="bg-gray-900 text-sm text-gray-200 p-4 rounded-md overflow-x-auto">
                                <code>
                                    {response}
                                </code>
                             </pre>
                        </div>
                    )}
                </div>
            </main>
            <Modal isOpen={!!error} onClose={handleCloseModal} title={isCorsError ? "CORS Connection Error" : "Connection Warning"}>
                {isCorsError ? (
                    <div className="space-y-3">
                        <p>{error}</p>
                        <p className="font-semibold text-yellow-300">
                            To fix this, you must configure your n8n server. Please scroll down and follow the instructions in the "Having Connection Issues?" section.
                        </p>
                    </div>
                ) : (
                    <p>{error}</p>
                )}
            </Modal>
        </>
    );
};