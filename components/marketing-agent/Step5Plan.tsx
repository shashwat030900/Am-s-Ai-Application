import React, { useState, useEffect } from 'react';
import { generateActionPlan, MarketingAgentState } from '../../services/marketingAgentService';
import { Loader2, Download, CheckCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Step5Props {
    state: MarketingAgentState;
    onReset: () => void;
}

export const Step5Plan: React.FC<Step5Props> = ({ state, onReset }) => {
    const [plan, setPlan] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        const fetchPlan = async () => {
            if (state.actionPlan) {
                // Already has plan? (Currently not saving plan to state until verified, but for re-renders)
                // Actually we can just generate if empty
            }

            try {
                const data = await generateActionPlan(state);
                if (mounted) setPlan(data.result);
            } catch (err: any) {
                if (mounted) setError(err.message || 'Failed to generate action plan');
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchPlan();
        return () => { mounted = false; };
    }, []);

    const handleDownloadPDF = async () => {
        const input = document.getElementById('report-content');
        if (!input) return;

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            // For simple long content, we might need multiple pages which html2canvas + jspdf simple approach struggles with.
            // But let's stick to simple image capture for now or text.
            // A better way for pure text reports is pdf.text().
            // Given the complexity of Markdown rendering, image capture is "WYSIWYG" but has pagination issues.

            // Let's allow the user to just download the text for now or simple image.

            const imgProps = pdf.getImageProperties(imgData);
            const pHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pHeight);
            pdf.save(`${state.domain}-marketing-plan.pdf`);
        } catch (e) {
            console.error("PDF Gen Error", e);
            alert("Failed to generate PDF. You can copy the text manually.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                <p className="text-xl text-cyan-200">Generating your 3-Month Action Plan...</p>
                <p className="text-gray-400">Synthesizing findings from Competitors, Ads, and Website Analysis.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-900/50 border border-red-500 rounded-lg text-center space-y-4">
                <h3 className="text-xl text-red-200 font-bold">Generation Failed</h3>
                <p className="text-red-300">{error}</p>
                <button onClick={onReset} className="text-white bg-red-700 px-4 py-2 rounded">Restart</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <h2 className="text-2xl font-bold text-green-400 flex items-center">
                    <CheckCircle className="mr-2" /> Action Plan Ready
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={onReset}
                        className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-800 flex items-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" /> Start New
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-bold flex items-center"
                    >
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </button>
                </div>
            </div>

            <div id="report-content" className="bg-white text-black p-8 rounded-lg shadow-xl max-w-4xl mx-auto min-h-[500px]">
                <div className="mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Marketing Strategy Report</h1>
                    <p className="text-xl text-gray-600">{state.domain}</p>
                    <p className="text-sm text-gray-500 mt-2">Generated by Antigravity Marketing Agent</p>
                </div>

                <div className="prose prose-sm max-w-none">
                    <section className="mb-8">
                        <h2 className="text-xl font-bold border-b border-gray-300 mb-2 uppercase text-cyan-900">1. Competitor Landscape</h2>
                        <div className="markdown-pdf"><ReactMarkdown>{state.competitors}</ReactMarkdown></div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold border-b border-gray-300 mb-2 uppercase text-cyan-900">2. Buyer Persona</h2>
                        <div className="markdown-pdf"><ReactMarkdown>{state.buyerPersona}</ReactMarkdown></div>
                    </section>

                    {state.adAudit && (
                        <section className="mb-8">
                            <h2 className="text-xl font-bold border-b border-gray-300 mb-2 uppercase text-cyan-900">3. Ad Audit Findings</h2>
                            <div className="markdown-pdf"><ReactMarkdown>{state.adAudit}</ReactMarkdown></div>
                        </section>
                    )}

                    {state.websiteAudit && (
                        <section className="mb-8">
                            <h2 className="text-xl font-bold border-b border-gray-300 mb-2 uppercase text-cyan-900">4. Website Audit Findings</h2>
                            <div className="markdown-pdf"><ReactMarkdown>{state.websiteAudit}</ReactMarkdown></div>
                        </section>
                    )}

                    <section className="mb-8 bg-gray-50 p-4 border-l-4 border-blue-600">
                        <h2 className="text-xl font-bold border-b border-gray-300 mb-4 uppercase text-blue-900">5. 3-Month Action Plan</h2>
                        <div className="markdown-pdf"><ReactMarkdown>{plan}</ReactMarkdown></div>
                    </section>
                </div>
            </div>
        </div>
    );
};
