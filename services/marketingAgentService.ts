
/**
 * Frontend Service for Marketing Agent.
 * specific API calls to the local Backend-for-Frontend (BFF).
 */

export interface MarketingAgentState {
    domain: string;
    competitors: string;
    brandDetails: string;
    buyerPersona: string;
    adLibraryUrl: string;
    adAudit: string;
    websiteUrl: string;
    websiteAudit: string;
    actionPlan: string;
    scrapedContent?: string; // Appended property for persistent context
}

export const initialMarketingAgentState: MarketingAgentState = {
    domain: "",
    competitors: "",
    brandDetails: "",
    buyerPersona: "",
    adLibraryUrl: "",
    adAudit: "",
    websiteUrl: "",
    websiteAudit: "",
    actionPlan: "",
    scrapedContent: ""
};

const API_BASE = '/api/agent'; // Proxied to localhost:3001

async function postRequest(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Request failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data; // Returns { result: string, scrapedData: string }
}

export const analyzeDomainAndCompetitors = async (domain: string): Promise<{ result: string, scrapedData: string }> => {
    return postRequest('/analyze-domain', { domain });
};

export const createBuyerPersona = async (domain: string, competitors: string, brandDetails: string, scrapedContent?: string): Promise<{ result: string }> => {
    return postRequest('/create-persona', { domain, competitors, brandDetails, scrapedContent });
};

export const auditSocialAds = async (adLibraryUrl: string): Promise<{ result: string }> => {
    return postRequest('/audit-ads', { adLibraryUrl });
};

export const auditWebsite = async (websiteUrl: string): Promise<{ result: string }> => {
    return postRequest('/audit-website', { websiteUrl });
};

export const generateActionPlan = async (state: MarketingAgentState): Promise<{ result: string }> => {
    return postRequest('/generate-plan', {
        domain: state.domain,
        competitors: state.competitors,
        buyerPersona: state.buyerPersona,
        adAudit: state.adAudit,
        websiteAudit: state.websiteAudit
    });
};
