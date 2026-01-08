import React from 'react';
import { MarketingAgentWizard } from '../components/marketing-agent/MarketingAgentWizard';

interface MarketingAgentAppProps {
    onNavigateBack: () => void;
}

export const MarketingAgentApp: React.FC<MarketingAgentAppProps> = ({ onNavigateBack }) => {
    return <MarketingAgentWizard onNavigateBack={onNavigateBack} />;
};
