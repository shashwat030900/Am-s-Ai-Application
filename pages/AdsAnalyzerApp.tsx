import React, { useState } from 'react';
import { ArrowLeft, Search, CheckCircle, AlertTriangle, FileText, Download, Copy, Loader2, Facebook, Globe, Languages, FileOutput } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";

interface SocialMediaAuditAppProps {
    onNavigateBack: () => void;
}

export const AdsAnalyzerApp: React.FC<SocialMediaAuditAppProps> = ({ onNavigateBack }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [isSimplifying, setIsSimplifying] = useState(false);

    const handleAudit = async () => {
        if (!url) {
            setError("Please enter a valid URL.");
            return;
        }

        // Basic validation
        if (!url.includes('facebook.com') && !url.includes('instagram.com') && !url.includes('adstransparency.google.com')) {
            setError("Please enter a valid Meta Ad Library or Google Ads Transparency Center URL.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setReport(null);
        setLoadingStep('Initializing scraper...');

        try {
            // Step 1: Trigger Audit
            setLoadingStep('Scraping Ad Data (this may take up to 2 minutes)...');

            const response = await fetch('http://localhost:3001/api/agent/social-media-audit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to generate audit.");
            }

            setLoadingStep('Analyzing data with Gemini 3 Pro Preview...');
            const data = await response.json();
            setReport(data.result);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    const exportToDoc = () => {
        if (!report) return;

        // Simple markdown to docx conversion
        const lines = report.split('\n');
        const children: any[] = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('# ')) {
                children.push(new Paragraph({
                    text: trimmedLine.replace('# ', ''),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }));
            } else if (trimmedLine.startsWith('## ')) {
                children.push(new Paragraph({
                    text: trimmedLine.replace('## ', ''),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 }
                }));
            } else if (trimmedLine.startsWith('### ')) {
                children.push(new Paragraph({
                    text: trimmedLine.replace('### ', ''),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                }));
            } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: trimmedLine.substring(2),
                        }),
                    ],
                    bullet: { level: 0 },
                    spacing: { after: 100 }
                }));
            } else if (trimmedLine.length > 0) {
                // Handle bold text **text**
                const parts = trimmedLine.split(/(\*\*.*?\*\*)/);
                const textRuns = parts.map(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return new TextRun({
                            text: part.replace(/\*\*/g, ''),
                            bold: true
                        });
                    }
                    return new TextRun(part);
                });

                children.push(new Paragraph({
                    children: textRuns,
                    spacing: { after: 120 }
                }));
            }
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: children,
            }],
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, "Ads-Analyzer-Report.docx");
        });
    };

    const downloadPDF = () => {
        if (!report) return;
        const doc = new jsPDF();

        // Simple text dump for PDF (formatting markdown in jsPDF is complex, this is a basic fallback)
        // For a better PDF, one would use html2canvas or a specific markdown renderer. 
        // User asked for "copy and download".

        doc.setFontSize(16);
        doc.text("Ads Analyzer Report", 10, 10);

        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(report.replace(/[#*]/g, ''), 180); // Simple strip markdown
        doc.text(splitText, 10, 20);

        doc.save("ads-analyzer-report.pdf");
    };

    const handleSimplifyLanguage = async () => {
        if (!report) return;

        setIsSimplifying(true);
        setLoadingStep('Simplifying language to easy English...');

        try {
            const response = await fetch('http://localhost:3001/api/agent/simplify-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reportContent: report }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to simplify report.");
            }

            const data = await response.json();
            setReport(data.result);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to simplify language.");
        } finally {
            setIsSimplifying(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
            {/* Header */}
            <div className="flex items-center mb-8">
                <button
                    onClick={onNavigateBack}
                    className="mr-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Ads Analyzer
                </h1>
            </div>

            {/* Input Section */}
            <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-400" />
                        Enter Ad Library Link
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        Paste the direct link to a brand's
                        <span className="text-blue-400 ml-1">Meta Ad Library</span> or
                        <span className="text-green-400 ml-1">Google Ads Transparency Center</span> page.
                        The AI will analyze active ads from the last 3 months.
                    </p>

                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="https://www.facebook.com/ads/library/..."
                            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <button
                            onClick={handleAudit}
                            disabled={isLoading}
                            className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${isLoading
                                ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30'
                                }`}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                            {isLoading ? 'Processing...' : 'Analyze Ads'}
                        </button>
                    </div>

                    {/* Supported Platforms Badges */}
                    <div className="flex gap-4 mt-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Facebook className="w-3 h-3" /> Meta (FB/Insta)</span>
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Google Ads</span>
                    </div>

                    {/* Status / Error */}
                    {isLoading && (
                        <div className="mt-6 flex items-center gap-3 text-blue-400 animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{loadingStep}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-3 text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Display */}
            {report && (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Actions Bar */}
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={handleSimplifyLanguage}
                            disabled={isSimplifying}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${isSimplifying
                                ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-500'
                                }`}
                        >
                            {isSimplifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                            {isSimplifying ? 'Simplifying...' : 'Simplify to Easy English'}
                        </button>
                        <button
                            onClick={exportToDoc}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm border border-blue-500 transition-colors text-white shadow-lg"
                        >
                            <FileOutput className="w-4 h-4" /> Export to Word (.doc)
                        </button>
                        <button
                            onClick={downloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm transition-colors shadow-lg"
                        >
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                    </div>

                    {/* Loading indicator for simplification */}
                    {isSimplifying && (
                        <div className="flex items-center gap-3 text-purple-400 animate-pulse bg-purple-900/20 border border-purple-700 rounded-lg p-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{loadingStep}</span>
                        </div>
                    )}

                    {/* Markdown Content */}
                    <div className="bg-gray-800 rounded-xl p-10 shadow-2xl border border-gray-700 prose prose-invert max-w-none">
                        <ReactMarkdown
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-blue-400 mb-6 pb-2 border-b border-gray-700" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-purple-400 mt-8 mb-4" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-xl font-medium text-gray-200 mt-6 mb-2" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-2 text-gray-300" {...props} />,
                                li: ({ node, ...props }) => <li className="marker:text-blue-500" {...props} />,
                                strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 py-1 italic text-gray-400 bg-gray-900/50 rounded-r" {...props} />,
                            }}
                        >
                            {report}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};
