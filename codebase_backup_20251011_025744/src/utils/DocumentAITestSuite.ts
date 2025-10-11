/**
 * Document AI Test Suite
 * Provides testing utilities for Document AI processing functionality
 */

export interface TestDocument {
  name: string;
  type: 'yacht_registration' | 'insurance_certificate' | 'crew_certificate' | 'survey_report';
  expectedFields: string[];
  description: string;
}

export interface TestResult {
  document: TestDocument;
  success: boolean;
  extractedFields: Record<string, any>;
  confidence: number;
  processingTime: number;
  errors?: string[];
}

export class DocumentAITestSuite {
  private sampleDocuments: TestDocument[] = [
    {
      name: 'Yacht Registration Certificate',
      type: 'yacht_registration',
      expectedFields: [
        'yacht_name',
        'registration_number',
        'owner_name',
        'length_overall',
        'beam',
        'draft',
        'gross_tonnage',
        'year_built',
        'hull_material',
        'engine_details'
      ],
      description: 'Official yacht registration document'
    },
    {
      name: 'Insurance Certificate',
      type: 'insurance_certificate',
      expectedFields: [
        'policy_number',
        'insured_vessel',
        'policy_holder',
        'coverage_amount',
        'effective_date',
        'expiry_date',
        'insurer_name',
        'vessel_value'
      ],
      description: 'Yacht insurance policy certificate'
    },
    {
      name: 'Crew Certificate',
      type: 'crew_certificate',
      expectedFields: [
        'certificate_number',
        'crew_member_name',
        'certificate_type',
        'issue_date',
        'expiry_date',
        'issuing_authority',
        'endorsements'
      ],
      description: 'Professional crew certification document'
    },
    {
      name: 'Survey Report',
      type: 'survey_report',
      expectedFields: [
        'survey_number',
        'vessel_name',
        'surveyor_name',
        'survey_date',
        'survey_type',
        'vessel_condition',
        'recommendations',
        'market_value'
      ],
      description: 'Marine survey inspection report'
    }
  ];

  constructor() {
    // Initialize test suite
  }

  /**
   * Get available sample documents for testing
   */
  getSampleDocuments(): TestDocument[] {
    return this.sampleDocuments;
  }

  /**
   * Test document processing with Document AI
   */
  async testDocumentProcessing(
    file: File, 
    expectedType: TestDocument['type'], 
    apiKey: string
  ): Promise<TestResult> {
    const startTime = Date.now();
    const testDocument = this.sampleDocuments.find(doc => doc.type === expectedType);
    
    if (!testDocument) {
      throw new Error(`Unknown document type: ${expectedType}`);
    }

    try {
      // Convert file to base64 for processing
      const base64Data = await this.fileToBase64(file);
      
      // Call Document AI processing endpoint
      const result = await this.callDocumentAI(base64Data, apiKey);
      
      const processingTime = Date.now() - startTime;
      
      // Validate extracted fields against expected fields
      const extractedFields = result.extractedFields || {};
      const expectedFields = testDocument.expectedFields;
      const foundFields = expectedFields.filter(field => 
        extractedFields[field] !== undefined && extractedFields[field] !== null
      );
      
      const confidence = result.confidence || (foundFields.length / expectedFields.length);
      const success = confidence >= 0.7 && foundFields.length >= Math.ceil(expectedFields.length * 0.5);

      return {
        document: testDocument,
        success,
        extractedFields,
        confidence,
        processingTime,
        errors: result.errors || []
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        document: testDocument,
        success: false,
        extractedFields: {},
        confidence: 0,
        processingTime,
        errors: [error.message || 'Unknown error occurred']
      };
    }
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/... prefix
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Call Document AI processing endpoint via Supabase Edge Function
   */
  private async callDocumentAI(base64Data: string, apiKey: string): Promise<{
    extractedFields: Record<string, any>;
    confidence: number;
    errors?: string[];
  }> {
    try {
      // Call the Supabase Edge Function for Document AI processing
      const response = await fetch('/api/document-ai/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          document_data: base64Data,
          processor_id: '8708cd1d9cd87cc1', // Custom extractor processor
          location: 'us'
        })
      });

      if (!response.ok) {
        throw new Error(`Document AI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        extractedFields: result.extracted_fields || {},
        confidence: result.confidence || 0,
        errors: result.errors || []
      };

    } catch (error) {
      console.error('Document AI processing error:', error);
      throw new Error(`Document AI processing failed: ${error.message}`);
    }
  }

  /**
   * Validate test results against expected criteria
   */
  validateTestResults(results: TestResult[]): {
    overallSuccess: boolean;
    successRate: number;
    averageConfidence: number;
    averageProcessingTime: number;
    issues: string[];
  } {
    if (results.length === 0) {
      return {
        overallSuccess: false,
        successRate: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        issues: ['No test results to validate']
      };
    }

    const successfulTests = results.filter(r => r.success);
    const successRate = successfulTests.length / results.length;
    const averageConfidence = results.reduce((acc, r) => acc + r.confidence, 0) / results.length;
    const averageProcessingTime = results.reduce((acc, r) => acc + r.processingTime, 0) / results.length;
    
    const issues: string[] = [];
    
    // Check for common issues
    if (successRate < 0.8) {
      issues.push(`Low success rate: ${Math.round(successRate * 100)}% (expected >= 80%)`);
    }
    
    if (averageConfidence < 0.7) {
      issues.push(`Low average confidence: ${Math.round(averageConfidence * 100)}% (expected >= 70%)`);
    }
    
    if (averageProcessingTime > 10000) {
      issues.push(`High processing time: ${Math.round(averageProcessingTime)}ms (expected < 10s)`);
    }

    // Check for failed tests
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
      issues.push(`${failedTests.length} test(s) failed: ${failedTests.map(t => t.document.name).join(', ')}`);
    }

    return {
      overallSuccess: successRate >= 0.8 && averageConfidence >= 0.7 && averageProcessingTime <= 10000,
      successRate,
      averageConfidence,
      averageProcessingTime,
      issues
    };
  }
}