/**
 * Yacht Onboarding Mapping Service
 * Integrates visual mapping system with yacht onboarding wizard
 * for automatic certificate data population
 */

import { documentAIMappingService } from './DocumentAIMappingService';

export interface YachtOnboardingData {
  // Basic Information
  vesselName?: string;
  callSign?: string;
  mmsi?: string;
  imoNumber?: string;
  officialNumber?: string;
  homePort?: string;
  flagState?: string;
  vesselType?: string;
  
  // Dimensions
  lengthOverall?: number;
  beam?: number;
  draft?: number;
  grossTonnage?: number;
  netTonnage?: number;
  
  // Propulsion
  enginePower?: number;
  engineMaker?: string;
  propulsionType?: string;
  fuelType?: string;
  
  // Ownership
  ownerName?: string;
  ownerAddress?: string;
  ownerType?: string;
  
  // Certification
  certificateNumber?: string;
  certificateIssuedDate?: string;
  certificateExpiryDate?: string;
  registrationDate?: string;
  
  // Technical
  yearBuilt?: number;
  builder?: string;
  hullMaterial?: string;
  classificationSociety?: string;
}

export interface MappingIntegrationResult {
  success: boolean;
  populatedFields: string[];
  missingRequiredFields: string[];
  dataQuality: {
    totalFields: number;
    populatedFields: number;
    highConfidence: number;
    lowConfidence: number;
  };
  yachtData: YachtOnboardingData;
  suggestions: Array<{
    field: string;
    suggestion: string;
    reason: string;
  }>;
}

export interface ExtractedFieldData {
  id: string;
  name: string;
  value: string;
  confidence: number;
  type: string;
  editedValue?: string;
}

class YachtOnboardingMappingServiceClass {
  private readonly REQUIRED_FIELDS = [
    'vesselName',
    'officialNumber',
    'homePort',
    'flagState',
    'lengthOverall',
    'beam',
    'ownerName',
    'ownerAddress',
    'certificateNumber',
    'certificateIssuedDate',
    'registrationDate'
  ];

  /**
   * Apply visual mappings to populate yacht onboarding data
   */
  async applyMappingsToYachtOnboarding(
    extractedFields: ExtractedFieldData[],
    mappings: Record<string, string>
  ): Promise<MappingIntegrationResult> {
    try {
      const yachtData: YachtOnboardingData = {};
      const populatedFields: string[] = [];
      const suggestions: Array<{ field: string; suggestion: string; reason: string }> = [];
      
      let highConfidenceCount = 0;
      let lowConfidenceCount = 0;

      // Apply mappings
      Object.entries(mappings).forEach(([aiFieldId, yachtFieldKey]) => {
        const aiField = extractedFields.find(f => f.id === aiFieldId);
        if (aiField) {
          const processedValue = this.processFieldValue(aiField, yachtFieldKey);
          
          // Type conversion based on yacht field type
          const convertedValue = this.convertValueByFieldType(processedValue, yachtFieldKey);
          
          (yachtData as any)[yachtFieldKey] = convertedValue;
          populatedFields.push(yachtFieldKey);
          
          // Track confidence
          if (aiField.confidence >= 0.9) {
            highConfidenceCount++;
          } else if (aiField.confidence < 0.7) {
            lowConfidenceCount++;
            suggestions.push({
              field: yachtFieldKey,
              suggestion: `Verify ${yachtFieldKey} value: "${processedValue}"`,
              reason: `Low confidence (${Math.round(aiField.confidence * 100)}%)`
            });
          }
        }
      });

      // Check for missing required fields
      const missingRequiredFields = this.REQUIRED_FIELDS.filter(
        field => !populatedFields.includes(field)
      );

      // Generate additional suggestions
      if (missingRequiredFields.length > 0) {
        suggestions.push({
          field: 'general',
          suggestion: `${missingRequiredFields.length} required fields are missing`,
          reason: 'These fields are required for yacht registration'
        });
      }

      // Data quality analysis
      const dataQuality = {
        totalFields: Object.keys(mappings).length,
        populatedFields: populatedFields.length,
        highConfidence: highConfidenceCount,
        lowConfidence: lowConfidenceCount
      };

      return {
        success: true,
        populatedFields,
        missingRequiredFields,
        dataQuality,
        yachtData,
        suggestions
      };

    } catch (error) {
      console.error('Failed to apply mappings to yacht onboarding:', error);
      return {
        success: false,
        populatedFields: [],
        missingRequiredFields: this.REQUIRED_FIELDS,
        dataQuality: {
          totalFields: 0,
          populatedFields: 0,
          highConfidence: 0,
          lowConfidence: 0
        },
        yachtData: {},
        suggestions: [{
          field: 'error',
          suggestion: 'Failed to process mappings',
          reason: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  /**
   * Process field value based on AI extraction and editing
   */
  private processFieldValue(aiField: ExtractedFieldData, yachtFieldKey: string): string {
    const rawValue = aiField.editedValue || aiField.value;
    
    // Special processing for specific fields
    switch (yachtFieldKey) {
      case 'certificateIssuedDate':
      case 'certificateExpiryDate':
      case 'registrationDate':
        return this.formatDate(rawValue);
      
      case 'vesselName':
        return rawValue.toUpperCase().trim();
      
      case 'ownerName':
        return this.formatOwnerName(rawValue);
      
      case 'lengthOverall':
      case 'beam':
      case 'draft':
        return this.extractNumericValue(rawValue);
      
      default:
        return rawValue.trim();
    }
  }

  /**
   * Convert value to appropriate type for yacht field
   */
  private convertValueByFieldType(value: string, fieldKey: string): any {
    // Numeric fields
    if (['lengthOverall', 'beam', 'draft', 'grossTonnage', 'netTonnage', 'enginePower', 'yearBuilt'].includes(fieldKey)) {
      const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(numValue) ? null : numValue;
    }
    
    // Date fields remain as strings (ISO format or DD-MM-YYYY)
    if (['certificateIssuedDate', 'certificateExpiryDate', 'registrationDate'].includes(fieldKey)) {
      return value;
    }
    
    // String fields
    return value;
  }

  /**
   * Format date to consistent format
   */
  private formatDate(dateStr: string): string {
    // Handle various date formats and convert to DD-MM-YYYY
    const cleanDate = dateStr.replace(/[^\d\/\-\.]/g, '');
    
    // Try to parse common formats
    const formats = [
      /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
      /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
      /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/, // DD/MM/YY or DD-MM-YY
    ];

    for (const format of formats) {
      const match = cleanDate.match(format);
      if (match) {
        let day, month, year;
        
        if (format === formats[0]) { // DD/MM/YYYY
          [, day, month, year] = match;
        } else if (format === formats[1]) { // YYYY/MM/DD
          [, year, month, day] = match;
        } else if (format === formats[2]) { // DD/MM/YY
          [, day, month, year] = match;
          year = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        }
        
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
      }
    }
    
    return cleanDate; // Return as-is if no format matches
  }

  /**
   * Format owner name consistently
   */
  private formatOwnerName(name: string): string {
    return name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Extract numeric value from text
   */
  private extractNumericValue(text: string): string {
    const match = text.match(/[\d,]+\.?\d*/);
    return match ? match[0].replace(/,/g, '') : text;
  }

  /**
   * Save mapping profile with yacht onboarding integration
   */
  async saveMappingProfileWithIntegration(
    name: string,
    description: string,
    mappings: Record<string, string>,
    extractedFields: ExtractedFieldData[]
  ): Promise<{ success: boolean; profileId?: string; error?: string }> {
    try {
      // Test the mappings first
      const integrationResult = await this.applyMappingsToYachtOnboarding(extractedFields, mappings);
      
      // Create field mappings for the service
      const fieldMappings = Object.entries(mappings).map(([aiFieldId, yachtFieldKey]) => {
        const aiField = extractedFields.find(f => f.id === aiFieldId);
        return {
          id: `${aiFieldId}-${yachtFieldKey}`,
          googleFieldName: aiFieldId,
          yachtFieldName: yachtFieldKey,
          fieldType: (aiField?.type || 'text') as 'text' | 'number' | 'date' | 'boolean',
          category: this.getFieldCategoryForDocumentAI(yachtFieldKey) as 'basic' | 'specifications' | 'operations' | 'owner' | 'certificate',
          confidence: aiField?.confidence || 0.8,
          isActive: true,
          description: `Maps ${aiField?.name || aiFieldId} to ${yachtFieldKey}`,
          examples: [aiField?.value || 'Example value']
        };
      });

      // Save to document AI mapping service
      const success = await documentAIMappingService.savePreset(
        name,
        `${description}\n\nIntegration Stats: ${integrationResult.populatedFields.length} fields populated, ${integrationResult.dataQuality.highConfidence} high confidence mappings.`,
        fieldMappings
      );

      if (success) {
        return { success: true, profileId: `preset-${Date.now()}` };
      } else {
        return { success: false, error: 'Failed to save preset' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get field category for DocumentAI mapping service
   */
  private getFieldCategoryForDocumentAI(fieldKey: string): string {
    if (['vesselName', 'callSign', 'mmsi', 'imoNumber', 'officialNumber', 'homePort', 'flagState', 'vesselType'].includes(fieldKey)) {
      return 'basic';
    }
    if (['lengthOverall', 'beam', 'draft', 'grossTonnage', 'netTonnage', 'enginePower', 'engineMaker', 'propulsionType', 'fuelType', 'yearBuilt', 'builder', 'hullMaterial', 'classificationSociety'].includes(fieldKey)) {
      return 'specifications';
    }
    if (['ownerName', 'ownerAddress', 'ownerType'].includes(fieldKey)) {
      return 'owner';
    }
    if (['certificateNumber', 'certificateIssuedDate', 'certificateExpiryDate', 'registrationDate'].includes(fieldKey)) {
      return 'certificate';
    }
    return 'basic';
  }

  /**
   * Get field category for organization
   */
  private getFieldCategory(fieldKey: string): string {
    if (['vesselName', 'callSign', 'mmsi', 'imoNumber', 'officialNumber', 'homePort', 'flagState', 'vesselType'].includes(fieldKey)) {
      return 'Basic Info';
    }
    if (['lengthOverall', 'beam', 'draft', 'grossTonnage', 'netTonnage'].includes(fieldKey)) {
      return 'Dimensions';
    }
    if (['enginePower', 'engineMaker', 'propulsionType', 'fuelType'].includes(fieldKey)) {
      return 'Propulsion';
    }
    if (['ownerName', 'ownerAddress', 'ownerType'].includes(fieldKey)) {
      return 'Ownership';
    }
    if (['certificateNumber', 'certificateIssuedDate', 'certificateExpiryDate', 'registrationDate'].includes(fieldKey)) {
      return 'Certification';
    }
    if (['yearBuilt', 'builder', 'hullMaterial', 'classificationSociety'].includes(fieldKey)) {
      return 'Technical';
    }
    return 'Other';
  }

  /**
   * Get completion percentage for yacht onboarding
   */
  getOnboardingCompletionPercentage(populatedFields: string[]): number {
    const requiredFieldsPopulated = this.REQUIRED_FIELDS.filter(field => 
      populatedFields.includes(field)
    ).length;
    
    return Math.round((requiredFieldsPopulated / this.REQUIRED_FIELDS.length) * 100);
  }

  /**
   * Validate yacht onboarding data completeness
   */
  validateOnboardingData(yachtData: YachtOnboardingData): {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    this.REQUIRED_FIELDS.forEach(field => {
      if (!(yachtData as any)[field]) {
        missingFields.push(field);
      }
    });

    // Additional validations
    if (yachtData.lengthOverall && yachtData.lengthOverall < 1) {
      warnings.push('Length overall seems too small');
    }
    
    if (yachtData.yearBuilt && (yachtData.yearBuilt < 1900 || yachtData.yearBuilt > new Date().getFullYear())) {
      warnings.push('Year built seems incorrect');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings
    };
  }
}

export const yachtOnboardingMappingService = new YachtOnboardingMappingServiceClass();