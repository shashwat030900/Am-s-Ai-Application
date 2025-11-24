import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Loader2, Send, ArrowLeft, CheckCircle, XCircle, Webhook } from 'lucide-react';
import { sendToWebhook, saveWebhookUrl, getSavedWebhookUrl, N8nResponse } from '../services/n8nService';

interface N8nTestAppProps {
    onNavigateBack: () => void;
}

export const N8nTestApp: React.FC<N8nTestAppProps> = ({ onNavigateBack }) => {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [method, setMethod] = useState<'GET' | 'POST'>('POST');
    const [message, setMessage] = useState('');
    const [useProxy, setUseProxy] = useState(false);
    const [noCors, setNoCors] = useState(false);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<N8nResponse | null>(null);

    useEffect(() => {
        // Load saved webhook URL
        const savedUrl = getSavedWebhookUrl();
        if (savedUrl) {
            setWebhookUrl(savedUrl);
        }

        // Set default test message
        setMessage(JSON.stringify({
            message: "Hello from N8n Test App!",
            timestamp: new Date().toISOString(),
            source: "AI Application Dashboard"
        }, null, 2));
    }, []);

    const handleSend = async () => {
        if (!webhookUrl.trim()) {
            alert('Please enter a webhook URL.');
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            // Parse JSON if valid, otherwise send as plain text in an object
            let payload;
            try {
                payload = JSON.parse(message);
            } catch {
                payload = { message };
            }

            const result = await sendToWebhook(webhookUrl, payload, method, useProxy, noCors);
            setResponse(result);

            // Save webhook URL for future use
            if (result.success) {
                saveWebhookUrl(webhookUrl);
            }
        } catch (error) {
            setResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="relative flex items-center justify-center mb-8">
                    <Button
                        variant="ghost"
                        className="absolute left-0 text-gray-400 hover:text-white"
                        onClick={onNavigateBack}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-orange-400">
                            N8n Workflow Tester
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Test connectivity with your n8n workflows
                        </p>
                    </div>
                </header>

                <Card className="bg-gray-800 border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-400">
                            <Webhook className="h-6 w-6" />
                            <span>Webhook Configuration</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-gray-300">
                                N8n Webhook URL
                            </Label>
                            <Input
                                id="webhook-url"
                                type="url"
                                placeholder="https://your-n8n-instance.com/webhook/..."
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                disabled={loading}
                            />
                            <p className="text-sm text-gray-400 mt-1">
                                Enter your n8n webhook URL from your workflow
                            </p>
                        </div>

                        <div>
                            <Label className="text-gray-300">HTTP Method</Label>
                            <div className="flex space-x-4 mt-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="method"
                                        value="POST"
                                        checked={method === 'POST'}
                                        onChange={() => setMethod('POST')}
                                        className="text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-white">POST</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="method"
                                        value="GET"
                                        checked={method === 'GET'}
                                        onChange={() => setMethod('GET')}
                                        className="text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-white">GET</span>
                                </label>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                                Select POST for sending data body, GET for query parameters
                            </p>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="use-proxy"
                                    checked={useProxy}
                                    onChange={(e) => {
                                        setUseProxy(e.target.checked);
                                        if (e.target.checked) setNoCors(false);
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    disabled={noCors}
                                />
                                <Label className={`cursor-pointer ${noCors ? 'text-gray-500' : 'text-gray-300'}`} onClick={() => !noCors && setUseProxy(!useProxy)}>
                                    Use CORS Proxy (Bypass CORS errors)
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="no-cors"
                                    checked={noCors}
                                    onChange={(e) => {
                                        setNoCors(e.target.checked);
                                        if (e.target.checked) setUseProxy(false);
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <Label className="text-gray-300 cursor-pointer" onClick={() => {
                                    setNoCors(!noCors);
                                    if (!noCors) setUseProxy(false);
                                }}>
                                    Fire & Forget (No Response) - Bypasses all CORS issues
                                </Label>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-300">
                                Test Payload (JSON)
                            </Label>
                            <Textarea
                                id="message"
                                placeholder='{"message": "Hello N8n!"}'
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 font-mono text-sm"
                                rows={8}
                                disabled={loading}
                            />
                            <p className="text-sm text-gray-400 mt-1">
                                Enter JSON payload or plain text to send to your webhook
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={handleSend}
                            disabled={loading}
                            className="w-full text-lg p-6 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-6 w-6" />
                                    Send Test
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {response && (
                    <Card className={`border-2 ${response.success ? 'border-green-500 bg-gray-800' : 'border-red-500 bg-gray-800'}`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {response.success ? (
                                    <>
                                        <CheckCircle className="h-6 w-6 text-green-400" />
                                        <span className="text-green-400">Success!</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-6 w-6 text-red-400" />
                                        <span className="text-red-400">Error</span>
                                    </>
                                )}
                                {response.status && (
                                    <span className="text-sm text-gray-400 ml-auto">
                                        Status: {response.status}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {response.error && (
                                <div className="mb-4">
                                    <p className="text-red-400 font-semibold">Error Message:</p>
                                    <p className="text-gray-300 mt-1">{response.error}</p>
                                </div>
                            )}
                            {response.data && (
                                <div>
                                    <p className="text-gray-300 font-semibold mb-2">Response Data:</p>
                                    <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-green-400">
                                        {JSON.stringify(response.data, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
