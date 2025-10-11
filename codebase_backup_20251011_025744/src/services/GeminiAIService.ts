/**
 * Gemini AI Service - Advanced multimodal AI integration for Yacht Sentinel
 * 
 * Provides comprehensive Gemini/Vertex AI capabilities including:
 * - Text generation and analysis
 * - Vision and multimodal processing
 * - Document understanding 
 * - Maritime-specific optimization
 * - High accuracy processing workflows
 */

export interface GeminiConfig {
  apiKey: string;
  projectId: string;
  location: string;
  model: string;
  endpoint?: string;
}

export interface GeminiRequest {
  text?: string;
  images?: string[]; // Base64 encoded images
  documents?: string[]; // Base64 encoded documents
  context?: string;
  module?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiResponse {
  text: string;
  confidence: number;
  reasoning?: string;
  metadata?: any;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface MaritimeAnalysisResult {
  summary: string;
  findings: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

export class GeminiAIService {
  private config: GeminiConfig;
  private cache: Map<string, { result: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  /**
   * Generate Vertex AI Gemini endpoint URL
   */
  private getVertexAIEndpoint(): string {
    if (this.config.endpoint) {
      return this.config.endpoint;
    }
    
    const { projectId, location, model } = this.config;
    return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
  }

  /**
   * Generate content using Gemini with multimodal support
   */
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      const cacheKey = this.getCacheKey(request);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const payload = this.buildGeminiPayload(request);
      const endpoint = this.getVertexAIEndpoint();

      console.log('Gemini request:', {
        endpoint,
        model: this.config.model,
        hasImages: !!(request.images?.length),
        hasDocuments: !!(request.documents?.length),
        textLength: request.text?.length || 0
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const result = this.parseGeminiResponse(data);

      // Cache successful results
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Gemini content generation error:', error);
      throw error;
    }
  }

  /**
   * Build Gemini API payload with multimodal support
   */
  private buildGeminiPayload(request: GeminiRequest): any {
    const contents: any[] = [];

    // System prompt as first message if provided
    if (request.systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: request.systemPrompt }]
      });
    }

    // Build main content with text and media
    const parts: any[] = [];

    // Add text content
    if (request.text) {
      parts.push({ text: request.text });
    }

    // Add context if provided
    if (request.context) {
      parts.push({ 
        text: `Context: ${request.context}` 
      });
    }

    // Add images with inline data
    if (request.images?.length) {
      for (const imageBase64 of request.images) {
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: imageBase64.replace(/^data:image\/[^;]+;base64,/, '')
          }
        });
      }
    }

    // Add documents as images (Gemini treats PDFs as images)
    if (request.documents?.length) {
      for (const docBase64 of request.documents) {
        parts.push({
          inline_data: {
            mime_type: 'application/pdf',
            data: docBase64.replace(/^data:application\/pdf;base64,/, '')
          }
        });
      }
    }

    contents.push({
      role: 'user',
      parts
    });

    return {
      contents,
      generationConfig: {
        temperature: request.temperature || 0.4,
        maxOutputTokens: request.maxTokens || 8192,
        topP: request.topP || 0.95,
        topK: request.topK || 40
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };
  }

  /**
   * Parse Gemini API response
   */
  private parseGeminiResponse(data: any): GeminiResponse {
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
      throw new Error('No candidates in Gemini response');
    }

    const candidate = candidates[0];
    const content = candidate.content;
    const parts = content?.parts || [];
    
    // Extract text from parts
    const text = parts
      .filter((part: any) => part.text)
      .map((part: any) => part.text)
      .join('\n');

    // Calculate confidence based on safety ratings and finish reason
    let confidence = 0.9; // Default high confidence for Gemini
    
    if (candidate.finishReason === 'STOP') {
      confidence = 0.95;
    } else if (candidate.finishReason === 'MAX_TOKENS') {
      confidence = 0.85;
    } else if (candidate.finishReason === 'SAFETY') {
      confidence = 0.3;
    }

    // Extract usage metadata if available
    const usage = data.usageMetadata ? {
      inputTokens: data.usageMetadata.promptTokenCount || 0,
      outputTokens: data.usageMetadata.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata.totalTokenCount || 0
    } : undefined;

    return {
      text,
      confidence,
      reasoning: candidate.citationMetadata ? 'Response includes citations' : undefined,
      metadata: {
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings,
        citationMetadata: candidate.citationMetadata
      },
      usage
    };
  }

  /**
   * Specialized maritime document analysis
   */
  async analyzeMaritimeDocument(
    documentBase64: string,
    documentType: 'certificate' | 'log' | 'maintenance' | 'safety' | 'compliance' | 'general',
    additionalContext?: string
  ): Promise<MaritimeAnalysisResult> {
    const systemPrompt = this.getMaritimeSystemPrompt(documentType);
    
    const analysisRequest: GeminiRequest = {
      text: `Analyze this maritime ${documentType} document. ${additionalContext || ''}`,
      documents: [documentBase64],
      systemPrompt,
      temperature: 0.2, // Lower temperature for accurate analysis
      maxTokens: 4096
    };

    const response = await this.generateContent(analysisRequest);
    
    try {
      // Try to parse structured response
      const parsed = JSON.parse(response.text);
      return this.validateMaritimeAnalysis(parsed, response.confidence);
    } catch {
      // Fallback to text parsing
      return this.parseMaritimeAnalysisFromText(response.text, response.confidence);
    }
  }

  /**
   * Chain-of-thought analysis for high accuracy
   */
  async performChainOfThoughtAnalysis(
    content: string,
    task: string,
    images?: string[]
  ): Promise<GeminiResponse> {
    const chainPrompt = `
Please analyze the following ${task} using a step-by-step approach:

Step 1: Initial Assessment
- Identify key elements and components
- Note any obvious issues or anomalies

Step 2: Detailed Examination  
- Examine each element systematically
- Look for patterns, trends, or correlations

Step 3: Risk Evaluation
- Assess potential risks or safety concerns
- Consider operational implications

Step 4: Recommendations
- Provide specific, actionable recommendations
- Prioritize by importance and urgency

Step 5: Confidence Assessment
- Evaluate the reliability of your analysis
- Note any limitations or uncertainties

Content to analyze: ${content}
`;

    return this.generateContent({
      text: chainPrompt,
      images,
      temperature: 0.3,
      maxTokens: 6144
    });
  }

  /**
   * Batch processing for multiple items
   */
  async batchProcess(requests: GeminiRequest[]): Promise<GeminiResponse[]> {
    const results: GeminiResponse[] = [];
    const batchSize = 5; // Process 5 at a time to avoid rate limits

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.generateContent(request));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`Batch processing error for batch ${i / batchSize + 1}:`, error);
        // Add error placeholders
        batch.forEach(() => {
          results.push({
            text: 'Analysis failed',
            confidence: 0,
            metadata: { error: error.message }
          });
        });
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Streaming response for real-time applications
   */
  async streamContent(request: GeminiRequest): Promise<ReadableStream<string>> {
    // Note: Gemini streaming requires different endpoint setup
    // This is a simplified implementation
    const response = await this.generateContent(request);
    
    return new ReadableStream({
      start(controller) {
        // Simulate streaming by chunking the response
        const chunks = response.text.split(' ');
        let index = 0;
        
        const interval = setInterval(() => {
          if (index < chunks.length) {
            controller.enqueue(chunks[index] + ' ');
            index++;
          } else {
            controller.close();
            clearInterval(interval);
          }
        }, 50);
      }
    });
  }

  /**
   * Get maritime-specific system prompts
   */
  private getMaritimeSystemPrompt(documentType: string): string {
    const basePrompt = `You are an expert maritime operations AI with deep knowledge of:
- International maritime regulations (SOLAS, MARPOL, MLC)
- Vessel safety and compliance requirements
- Maritime equipment and maintenance standards
- Port state control requirements
- Flag state requirements
- Classification society rules

Provide accurate, detailed analysis focusing on safety, compliance, and operational efficiency.`;

    const typeSpecific = {
      certificate: 'Focus on validity, expiration dates, issuing authorities, and compliance status.',
      log: 'Analyze entries for patterns, compliance with regulations, and operational insights.',
      maintenance: 'Evaluate maintenance schedules, equipment condition, and preventive measures.',
      safety: 'Assess safety protocols, risk factors, and emergency preparedness.',
      compliance: 'Review regulatory compliance, audit findings, and corrective actions.',
      general: 'Provide comprehensive maritime operational analysis.'
    };

    return `${basePrompt}\n\n${typeSpecific[documentType] || typeSpecific.general}

Respond in JSON format with:
{
  "summary": "Brief overview",
  "findings": ["key finding 1", "key finding 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "riskLevel": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "entities": [{"type": "entity_type", "value": "entity_value", "confidence": 0.0-1.0}]
}`;
  }

  /**
   * Cache management
   */
  private getCacheKey(request: GeminiRequest): string {
    const keyData = {
      text: request.text?.substring(0, 100),
      imageCount: request.images?.length || 0,
      documentCount: request.documents?.length || 0,
      model: this.config.model,
      temperature: request.temperature
    };
    return btoa(JSON.stringify(keyData));
  }

  private getFromCache(key: string): GeminiResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  private setCache(key: string, result: GeminiResponse): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });

    // Clean old entries if cache gets too large
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Validate and structure maritime analysis results
   */
  private validateMaritimeAnalysis(parsed: any, confidence: number): MaritimeAnalysisResult {
    return {
      summary: parsed.summary || 'Analysis completed',
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      riskLevel: ['low', 'medium', 'high', 'critical'].includes(parsed.riskLevel) 
        ? parsed.riskLevel : 'medium',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : confidence,
      entities: Array.isArray(parsed.entities) ? parsed.entities : []
    };
  }

  /**
   * Parse maritime analysis from unstructured text
   */
  private parseMaritimeAnalysisFromText(text: string, confidence: number): MaritimeAnalysisResult {
    // Simple text parsing fallback
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      summary: lines[0] || 'Analysis completed',
      findings: lines.filter(line => line.toLowerCase().includes('finding')),
      recommendations: lines.filter(line => line.toLowerCase().includes('recommend')),
      riskLevel: text.toLowerCase().includes('critical') ? 'critical' :
                 text.toLowerCase().includes('high') ? 'high' :
                 text.toLowerCase().includes('low') ? 'low' : 'medium',
      confidence,
      entities: []
    };
  }
}

/**
 * Factory function to create Gemini service instance
 */
export function createGeminiService(config: Partial<GeminiConfig>): GeminiAIService {
  const defaultConfig: GeminiConfig = {
    apiKey: config.apiKey || '',
    projectId: config.projectId || '',
    location: config.location || 'us-central1',
    model: config.model || 'gemini-1.5-pro',
    endpoint: config.endpoint
  };

  return new GeminiAIService(defaultConfig);
}

/**
 * Validate Gemini configuration
 */
export function validateGeminiConfig(config: Partial<GeminiConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('Gemini API key is required');
  }

  if (!config.projectId) {
    errors.push('Google Cloud Project ID is required');
  }

  if (config.location && !config.location.match(/^[a-z0-9\-]+$/)) {
    errors.push('Invalid location format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default GeminiAIService;