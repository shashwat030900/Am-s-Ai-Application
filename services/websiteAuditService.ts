import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/agent';

export interface AuditMetadata {
    title: string;
    url: string;
    pagesAnalyzed?: number;
    viewportsAnalyzed?: string[];
}

export interface Screenshot {
    viewport: string;
    url: string;
    width: number;
    height: number;
}

export interface SectionAnalysis {
    sectionName: string;
    analysis: string;
    improvements: string[];
}

export interface AuditResponse {
    result: string | SectionAnalysis[];
    isStructured?: boolean;
    metadata: AuditMetadata;
    reportType?: 'data' | 'screenshot';
    screenshots?: Screenshot[];
}

export const websiteAuditService = {
    async runAudit(websiteUrl: string, reportType: 'data' | 'screenshot' = 'data'): Promise<AuditResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/audit-website`, {
                websiteUrl,
                reportType
            });
            return response.data;
        } catch (error: any) {
            console.error('Error running website audit:', error);
            throw new Error(error.response?.data?.error || 'Failed to generate website audit report');
        }
    }
};
