export type MessageRole = "user" | "assistant";

export interface ImageAnalysisData {
  ocr: {
    text: string;
    confidence: number;
    language: string;
    hasText: boolean;
  };
  aiDetection: {
    isAIGenerated: boolean;
    confidence: number;
    likelihood: number;
    reasons: string[];
    warnings: string[];
    metadata: {
      hasEXIF: boolean;
      software?: string;
      cameraModel?: string;
    };
  };
  content: {
    safeSearch: {
      adult: string;
      violence: string;
      medical: string;
    };
    labels: Array<{ description: string; score: number }>;
    logos: Array<{ description: string; score: number }>;
  };
}

export interface DocumentAnalysisData {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    pageCount?: number;
    wordCount: number;
    charCount: number;
  };
  extractedAt: string;
  analysis?: Analysis;
}

export interface Message {
  role: MessageRole;
  content: string;
  analysis?: Analysis;
  imageAnalysis?: ImageAnalysisData;
  documentAnalysis?: DocumentAnalysisData;
  imagePreview?: {
    name: string;
    size: number;
    type: string;
  };
  documentPreview?: {
    name: string;
    size: number;
    type: string;
  };
}

export type Verdict = "fake" | "real" | "uncertain" | "unanalyzable";

export interface EvidenceLink {
  title: string;
  url: string;
  source: string;
  rating?: string;
}

export interface Analysis {
  claimText: string;
  verdict: Verdict;
  confidence: number; // 0 to 1
  reasons: string[];
  supportLinks: EvidenceLink[];
  debunkLinks: EvidenceLink[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  analysis?: Analysis;
  createdAt: number;
  isShared?: boolean;
  shareToken?: string;
}

export interface ChatApiRequest {
  messages: Message[];
  analysis?: Analysis;
}

export interface ChatApiResponse {
  message: string;
  analysis?: Analysis;
}

export interface ReportApiRequest {
  analysis: Analysis;
}

export interface ReportApiResponse {
  id: string;
  url: string;
}

export interface StoredReport {
  id: string;
  analysis: Analysis;
  createdAt: number;
}
