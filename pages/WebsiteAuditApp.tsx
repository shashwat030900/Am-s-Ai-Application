import React, { useState, useRef } from 'react';
import { ArrowLeft, Search, CheckCircle, AlertTriangle, Info, Gauge, Zap, Palette, Phone, Type, MousePointer2, ExternalLink, Activity, Download, FileText, Globe } from 'lucide-react';
import { websiteAuditService, AuditResponse } from '../services/websiteAuditService';
import ReactMarkdown from 'react-markdown';

interface WebsiteAuditAppProps {
    onNavigateBack: () => void;
}

export const WebsiteAuditApp: React.FC<WebsiteAuditAppProps> = ({ onNavigateBack }) => {
    const [url, setUrl] = useState('');
    const [reportType, setReportType] = useState<'data' | 'screenshot'>('data');
    const [isLoading, setIsLoading] = useState(false);
    const [auditReport, setAuditReport] = useState<AuditResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState('');

    const runAudit = async () => {
        if (!url) return;

        setIsLoading(true);
        setError(null);
        setAuditReport(null);

        try {
            if (reportType === 'screenshot') {
                setLoadingStep('📸 Capturing screenshots across multiple devices...');
                await new Promise(r => setTimeout(r, 1500));
                setLoadingStep('🖼️ Analyzing visual design with AI Vision...');
                await new Promise(r => setTimeout(r, 2000));
                setLoadingStep('🎨 Reviewing layout, CTAs, and mobile responsiveness...');
            } else {
                setLoadingStep('📄 Crawling website content...');
                await new Promise(r => setTimeout(r, 1500));
                setLoadingStep('🔍 Analyzing SEO, content quality, and structure...');
                await new Promise(r => setTimeout(r, 2000));
            }
            setLoadingStep('Generating comprehensive client-ready report...');

            const response = await websiteAuditService.runAudit(url, reportType);
            setAuditReport(response);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during the audit.');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    const ParameterCard = ({ title, icon: Icon, color }: { title: string, icon: any, color: string }) => (
        <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 flex items-center space-x-4 hover:border-${color}-500/50 transition-all`}>
            <div className={`p-3 bg-${color}-500/10 rounded-lg`}>
                <Icon size={20} className={`text-${color}-400`} />
            </div>
            <span className="font-semibold text-gray-200">{title}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
            {/* SIMPLIFIED PRINT STYLES */}
            <style>{`
                @media print {
                    @page { 
                        margin: 15mm; 
                        size: A4; 
                    }
                    
                    /* Hide everything by default */
                    * {
                        visibility: hidden;
                    }
                    
                    /* Show only print content */
                    #print-only-report,
                    #print-only-report * {
                        visibility: visible !important;
                    }
                    
                    /* Position print content at top of page */
                    #print-only-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                    }
                    
                    /* Ensure white background and black text */
                    body, html {
                        background: white !important;
                    }
                    
                    #print-only-report * {
                        color: black !important;
                        background: white !important;
                    }
                    
                    /* Typography */
                    h1 { font-size: 24pt !important; margin-bottom: 16px !important; }
                    h2 { font-size: 18pt !important; margin-top: 24px !important; margin-bottom: 12px !important; }
                    h3 { font-size: 14pt !important; margin-top: 16px !important; margin-bottom: 8px !important; }
                    p, li { font-size: 11pt !important; line-height: 1.5 !important; }
                    
                    /* Page breaks */
                    h2 { page-break-before: auto !important; }
                    .avoid-break { page-break-inside: avoid !important; }
                }
            `}</style>

            {/* SCREEN VIEW */}
            <div className="print:hidden">
                {/* dynamic background effect */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 p-6 sticky top-0 z-50">
                        <div className="container mx-auto flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={onNavigateBack}
                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                                        WEBSITE AUDIT REPORT MAKER
                                    </h1>
                                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Comprehensive Site Analysis</p>
                                </div>
                            </div>
                            {auditReport && !isLoading && (
                                <button
                                    onClick={handleDownloadPDF}
                                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-full transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                                >
                                    <Download size={18} />
                                    <span>DOWNLOAD PDF REPORT</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <main className="container mx-auto px-4 py-12">
                        {/* Input Section */}
                        <div className="max-w-4xl mx-auto mb-16">
                            <div className="text-center mb-10">
                                <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                                    Comprehensive <span className="text-blue-500">50-Page</span> Deep Audit
                                </h2>
                                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                                    Deep UX/UI & Content Research scan with client-ready insights.
                                </p>
                            </div>

                            {/* Report Type Selector */}
                            <div className="mb-8 flex justify-center gap-4">
                                <button
                                    onClick={() => setReportType('data')}
                                    className={`px-6 py-3 rounded-xl font-bold transition-all transform ${reportType === 'data'
                                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <FileText size={20} />
                                        <div className="text-left">
                                            <div className="text-sm font-black">Data Analysis</div>
                                            <div className="text-xs opacity-75">Fast SEO & Content Audit</div>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setReportType('screenshot')}
                                    className={`px-6 py-3 rounded-xl font-bold transition-all transform ${reportType === 'screenshot'
                                        ? 'bg-emerald-600 text-white shadow-lg scale-105'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Activity size={20} />
                                        <div className="text-left">
                                            <div className="text-sm font-black">Visual Analysis</div>
                                            <div className="text-xs opacity-75">Screenshots + AI Vision</div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <div className="relative flex flex-col md:flex-row gap-4 bg-gray-900 border border-gray-800 p-2 rounded-2xl">
                                    <div className="flex-1 flex items-center px-4">
                                        <Globe className="text-gray-500 mr-2" size={24} />
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="Enter domain (e.g., https://example.com)"
                                            className="w-full bg-transparent border-none focus:ring-0 py-4 text-lg text-white placeholder-gray-600"
                                        />
                                    </div>
                                    <button
                                        onClick={runAudit}
                                        disabled={isLoading || !url}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-black px-10 py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                <span>ANALYZING UX...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={20} fill="currentColor" />
                                                <span>GENERATE REPORT</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-500">
                                    <AlertTriangle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="max-w-2xl mx-auto text-center py-20">
                                <div className="relative w-32 h-32 mx-auto mb-8">
                                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-4 border-4 border-emerald-500/20 rounded-full"></div>
                                    <div className="absolute inset-4 border-4 border-emerald-500 rounded-full border-b-transparent animate-spin-reverse" style={{ animationDuration: '1.5s' }}></div>
                                    <Activity className="absolute inset-0 m-auto text-blue-400 animate-pulse" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Deep-Scanning Website...</h3>
                                <p className="text-blue-400 font-mono animate-pulse">{loadingStep}</p>
                            </div>
                        )}

                        {/* Quick Preview Section */}
                        {auditReport && !isLoading && (
                            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center backdrop-blur-sm">
                                    <div className="inline-flex items-center justify-center p-3 bg-emerald-500/20 rounded-full mb-4">
                                        <CheckCircle size={32} className="text-emerald-400" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white mb-2">Comprehensive Audit Complete</h2>
                                    <p className="text-gray-400 mb-2">Deep analysis of {auditReport.metadata.pagesAnalyzed} pages completed.</p>
                                    <p className="text-gray-500 text-sm mb-6">Your client-ready report is ready to print.</p>
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="bg-white text-black hover:bg-gray-100 font-black py-3 px-8 rounded-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-2 mx-auto"
                                    >
                                        <Download size={20} />
                                        <span>DOWNLOAD FULL REPORT (PDF)</span>
                                    </button>
                                </div>

                                {/* Screenshot Gallery (for screenshot-based reports) */}
                                {auditReport.reportType === 'screenshot' && auditReport.screenshots && (
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-3xl p-8">
                                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                                            <Activity size={24} className="text-emerald-400" />
                                            <span>Captured Screenshots</span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {auditReport.screenshots.map((screenshot, index) => (
                                                <div key={index} className="space-y-3">
                                                    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-emerald-500 transition-all">
                                                        <img
                                                            src={screenshot.url}
                                                            alt={`${screenshot.viewport} screenshot`}
                                                            className="w-full h-auto"
                                                        />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-white">{screenshot.viewport}</p>
                                                        <p className="text-sm text-gray-400">{screenshot.width}x{screenshot.height}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-50 pointer-events-none grayscale">
                                    <ParameterCard title="Technical" icon={Gauge} color="blue" />
                                    <ParameterCard title="SEO" icon={Search} color="cyan" />
                                    <ParameterCard title="UX/UI" icon={MousePointer2} color="rose" />
                                    <ParameterCard title="Branding" icon={Palette} color="indigo" />
                                </div>
                                <p className="text-center text-gray-500 text-sm">Preview mode. For full details, download the PDF.</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !auditReport && (
                            <div className="max-w-4xl mx-auto mt-20 text-center space-y-16">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="p-8 bg-gray-900/40 border border-gray-800/60 rounded-3xl hover:border-blue-500/30 transition-all group">
                                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                                            <Globe className="text-blue-400" />
                                        </div>
                                        <h4 className="text-xl font-bold mb-2">Deep Crawl</h4>
                                        <p className="text-gray-500 text-sm">Scans up to 50 pages, 3 levels deep.</p>
                                    </div>
                                    <div className="p-8 bg-gray-900/40 border border-gray-800/60 rounded-3xl hover:border-emerald-500/30 transition-all group">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                                            <FileText className="text-emerald-400" />
                                        </div>
                                        <h4 className="text-xl font-bold mb-2">Page-by-Page</h4>
                                        <p className="text-gray-500 text-sm">Individual audit for each page found.</p>
                                    </div>
                                    <div className="p-8 bg-gray-900/40 border border-gray-800/60 rounded-3xl hover:border-purple-500/30 transition-all group">
                                        <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                                            <Download className="text-purple-400" />
                                        </div>
                                        <h4 className="text-xl font-bold mb-2">Client-Ready</h4>
                                        <p className="text-gray-500 text-sm">Professional PDF for direct delivery.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* PRINT-ONLY REPORT - Using visibility trick */}
            {auditReport && (
                <div id="print-only-report" className="hidden print:block">
                    <div style={{ padding: '40px', margin: '0', backgroundColor: 'white', color: 'black', fontFamily: 'sans-serif' }}>
                        {/* Cover/Header */}
                        <div style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '4px solid #10b981' }}>
                            <h1 style={{ fontSize: '32pt', fontWeight: '900', marginBottom: '10px', color: '#111827' }}>
                                {auditReport.reportType === 'screenshot' ? 'Visual Experience Audit' : 'Website Content Audit'}
                            </h1>
                            <p style={{ fontSize: '14pt', color: '#6b7280' }}>Comprehensive AI Analysis Report</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px', padding: '20px', background: '#f3f4f6', borderRadius: '10px' }}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '10pt', color: '#6b7280', textTransform: 'uppercase' }}>Analyzed Domain</strong>
                                <span style={{ fontSize: '14pt', fontWeight: 'bold' }}>{auditReport.metadata.url}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <strong style={{ display: 'block', fontSize: '10pt', color: '#6b7280', textTransform: 'uppercase' }}>Date Generated</strong>
                                <span style={{ fontSize: '14pt', fontWeight: 'bold' }}>{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* STRUCTURED VISUAL REPORT */}
                        {auditReport.isStructured && Array.isArray(auditReport.result) ? (
                            <div className="space-y-12">
                                <div style={{ marginBottom: '30px' }}>
                                    <h2 style={{ fontSize: '20pt', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>Executive Summary</h2>
                                    <p style={{ fontSize: '12pt', lineHeight: '1.6' }}>
                                        The following report provides a detailed, section-by-section visual audit of your website.
                                        We have analyzed {auditReport.result.length} unique sections of your page to identify design strengths, content clarity, and user experience barriers.
                                    </p>
                                </div>

                                {auditReport.result.map((section: any, index: number) => {
                                    // Find matching screenshot if available (assuming index matches)
                                    const screenshot = auditReport.screenshots && auditReport.screenshots[index];

                                    return (
                                        <div key={index} style={{ pageBreakBefore: 'always', marginBottom: '40px' }}>
                                            {/* Section Header */}
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #e5e7eb', paddingBottom: '15px' }}>
                                                <div style={{ background: '#10b981', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px', fontSize: '14pt' }}>
                                                    {index + 1}
                                                </div>
                                                <h3 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, textTransform: 'capitalize', color: '#1f2937' }}>
                                                    {section.sectionName || `Section ${index + 1}`}
                                                </h3>
                                            </div>

                                            {/* Side-by-Side Layout Container */}
                                            <div style={{ display: 'flex', flexDirection: 'row', gap: '30px', alignItems: 'flex-start' }}>

                                                {/* Left Column: Analysis Text (60%) */}
                                                <div style={{ flex: '1.5' }}>
                                                    <div style={{ fontSize: '10pt', lineHeight: '1.6', marginBottom: '20px', color: '#374151' }}>
                                                        <strong style={{ display: 'block', fontSize: '11pt', marginBottom: '8px', color: '#111827', textTransform: 'uppercase', letterSpacing: '1px' }}>Analysis</strong>
                                                        <ReactMarkdown>{section.analysis}</ReactMarkdown>
                                                    </div>

                                                    {section.improvements && section.improvements.length > 0 && (
                                                        <div style={{ background: '#ecfdf5', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                                            <strong style={{ display: 'block', color: '#047857', marginBottom: '8px', fontSize: '10pt' }}>🚀 PRIORITIES</strong>
                                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '10pt' }}>
                                                                {section.improvements.map((imp: string, i: number) => (
                                                                    <li key={i} style={{ marginBottom: '4px', color: '#064e3b' }}>{imp}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Column: Screenshot (40%) */}
                                                {screenshot && (
                                                    <div style={{ flex: '1', minWidth: '0' }}>
                                                        <div style={{
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                            border: '4px solid #f3f4f6',
                                                            borderRadius: '8px',
                                                            overflow: 'hidden',
                                                            backgroundColor: '#fff'
                                                        }}>
                                                            <div style={{ background: '#f3f4f6', padding: '5px 10px', fontSize: '8pt', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                                                                Visual Reference
                                                            </div>
                                                            <img
                                                                src={screenshot.url}
                                                                alt={`Screenshot for ${section.sectionName}`}
                                                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* LEGACY / TEXT ONLY REPORT */
                            <div style={{ fontSize: '11pt', lineHeight: '1.6', color: 'black' }}>
                                <ReactMarkdown>{typeof auditReport.result === 'string' ? auditReport.result : ''}</ReactMarkdown>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '9pt', color: '#9ca3af' }}>
                            <p>Confidential Audit Report • Generated by AI Agent</p>
                            <p>{new Date().getFullYear()} © Your Agency Name</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
