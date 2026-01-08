import React, { useState } from 'react';
import { initialMarketingAgentState, MarketingAgentState } from '../../services/marketingAgentService';
import { Step1Domain } from './Step1Domain';
import { Step2Persona } from './Step2Persona';
import { Step3Ads } from './Step3Ads';
import { Step4Website } from './Step4Website';
import { Step5Plan } from './Step5Plan';
import { ChevronRight } from 'lucide-react';

export const MarketingAgentWizard: React.FC<{ onNavigateBack: () => void }> = ({ onNavigateBack }) => {
    const [step, setStep] = useState(1);
    const [state, setState] = useState<MarketingAgentState>(initialMarketingAgentState);

    const updateState = (updates: Partial<MarketingAgentState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const handleStep1 = (domain: string, competitors: string, scrapedContent: string) => {
        updateState({ domain, competitors, scrapedContent });
        setStep(2);
    };

    const handleStep2 = (brandDetails: string, buyerPersona: string) => {
        updateState({ brandDetails, buyerPersona });
        setStep(3);
    };

    const handleStep3 = (adLibraryUrl: string, adAudit: string) => {
        updateState({ adLibraryUrl, adAudit });
        setStep(4);
    };

    const handleSkipStep3 = () => {
        setStep(4);
    };

    const handleStep4 = (websiteUrl: string, websiteAudit: string) => {
        updateState({ websiteUrl, websiteAudit });
        setStep(5);
    };

    const handleSkipStep4 = () => {
        setStep(5);
    };

    const handleReset = () => {
        setState(initialMarketingAgentState);
        setStep(1);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <button onClick={onNavigateBack} className="mb-4 text-cyan-400 hover:text-cyan-300 flex items-center">
                &larr; Back to Dashboard
            </button>

            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                    Marketing Agent
                </h1>
                <p className="text-gray-400">Automated strategist: Domain Analysis &rarr; Persona &rarr; Audits &rarr; Action Plan</p>
            </header>

            {/* Stepper */}
            <div className="flex items-center mb-8 text-sm">
                {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 
                            ${step === s ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' :
                                step > s ? 'border-green-500 bg-green-500/20 text-green-400' :
                                    'border-gray-700 text-gray-600'}`}>
                            {step > s ? '✓' : s}
                        </div>
                        {s < 5 && <div className={`w-8 h-1 ${step > s ? 'bg-green-500' : 'bg-gray-700'}`} />}
                    </div>
                ))}
            </div>

            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <svg width="200" height="200" viewBox="0 0 100 100" fill="none" className="animate-spin-slow">
                        <path d="M50 0 L100 50 L50 100 L0 50 Z" stroke="white" strokeWidth="1" />
                    </svg>
                </div>

                {step === 1 && <Step1Domain onNext={handleStep1} />}
                {step === 2 && <Step2Persona domain={state.domain} competitors={state.competitors} scrapedContent={state.scrapedContent} onNext={handleStep2} />}
                {step === 3 && <Step3Ads onNext={handleStep3} onSkip={handleSkipStep3} />}
                {step === 4 && <Step4Website onNext={handleStep4} onSkip={handleSkipStep4} />}
                {step === 5 && <Step5Plan state={state} onReset={handleReset} />}
            </div>
        </div>
    );
};
