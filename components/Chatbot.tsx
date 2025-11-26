
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatIcon } from './ChatIcon';

interface Message {
    role: 'user' | 'model';
    content: string;
}

const SYSTEM_INSTRUCTION = `You are an AI assistant for an Account Manager Dashboard application. You help users understand and use the various applications and features available.

Here are the applications you can help with:

1. **Customer Avatar App**: Generates detailed customer avatars and personas for businesses. Users provide business type, problem, and solution, and the app creates comprehensive customer profiles including demographics, psychographics, and Dan Kennedy's market diagnosis questions.

2. **Master Prompt App**: Helps users improve their AI prompts. Users submit a draft prompt and the app diagnoses weaknesses and provides an optimized version with better clarity, specificity, and structure.

3. **BlogSmith (SEO Blog Writer)**: AI-powered SEO blog generation tool. Users enter a blog topic, website URL, and word count. The app researches the website and generates SEO-optimized blog content that connects with the client's products.

4. **Content Research Automation**: Conducts AI-powered research on any topic using real-time web data. Provides a summary and 5-7 structured content ideas with concepts and actionable steps for digital marketing campaigns. All research is backed by verified sources.

5. **N8n Test App**: Integration testing tool for n8n workflows.

6. **Profile Page**: Where users can view and manage their account information.

The dashboard also has a History feature that saves recent work from various apps for easy reference.

When users ask about these features, provide helpful, clear information. If they have questions about how to use something, guide them step by step.`;

export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: 'Hello! How can I help you with your customer avatar analysis today?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const chat = useMemo<Chat | null>(() => {
        if (!process.env.API_KEY) {
            console.error("API_KEY is not set for Chatbot");
            return null;
        }
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            return ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION
                }
            });
        } catch (error) {
            console.error("Failed to initialize Gemini Chat:", error);
            return null;
        }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chat) return;

        const newUserMessage: Message = { role: 'user', content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message: userInput });
            const modelMessage: Message = { role: 'model', content: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chatbot API error:", error);
            const errorMessage: Message = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-cyan-600 text-white rounded-full p-4 shadow-lg hover:bg-cyan-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50"
                    aria-label="Toggle AI Chat"
                >
                    <ChatIcon />
                </button>
            </div>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col border border-gray-700">
                    <header className="bg-gray-700 p-4 rounded-t-lg flex justify-between items-center flex-shrink-0">
                        <h3 className="font-bold text-lg text-cyan-400">AI Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
                    </header>
                    <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-sm rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-cyan-700 text-white' : 'bg-gray-600 text-gray-200'}`}>
                                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-600 rounded-lg px-4 py-2">
                                    <div className="flex items-center space-x-1">
                                        <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Ask a question..."
                                className="w-full bg-gray-700 text-gray-100 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-cyan-600 text-white font-bold p-2 rounded-md hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};
