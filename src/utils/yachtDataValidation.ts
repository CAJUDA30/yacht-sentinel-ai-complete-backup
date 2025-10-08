/**
 * Yacht Data Validation Utility
 * Provides intelligent validation and suggestions for auto-populated yacht data
 * Helps users verify and correct Document AI extracted information
 */

import { YachtOnboardingData } from '@/components/onboarding/YachtOnboardingWizard';

export interface ValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  suggestions: string[];
  correctedValue?: any;
  warningLevel: 'none' | 'info' | 'warning' | 'error';
}

export interface FieldValidationContext {
  fieldName: string;
  currentValue: any;
  extractedValue: any;
  confidenceScore: number;
  relatedFields?: Record<string, any>;
}

/**
 * Validate yacht name with intelligent suggestions
 */
export function validateYachtName(context: FieldValidationContext): ValidationResult {
  const { currentValue, extractedValue, confidenceScore } = context;
  const result: ValidationResult = {
    isValid: true,
    confidence: 'high',
    suggestions: [],
    warningLevel: 'none'
  };

  if (!currentValue || currentValue.trim() === '') {
    result.isValid = false;
    result.warningLevel = 'error';
    result.suggestions.push('Yacht name is required');
    return result;
  }

  const name = currentValue.toString().trim();

  // Basic validation rules
  if (name.length < 2) {
    result.isValid = false;
    result.warningLevel = 'error';
    result.suggestions.push('Yacht name must be at least 2 characters long');
  }

  if (name.length > 50) {
    result.warningLevel = 'warning';
    result.suggestions.push('Yacht name is unusually long. Consider using a shorter version.');
  }

  // Check for common formatting issues
  if (name !== name.trim()) {
    result.suggestions.push('Remove extra spaces from yacht name');
    result.correctedValue = name.trim();
  }

  // Check for all uppercase names (common OCR issue)
  if (name === name.toUpperCase() && name.length > 3) {
    result.confidence = 'medium';
    result.warningLevel = 'info';
    result.suggestions.push('Consider using proper capitalization for yacht name');
    result.correctedValue = toProperCase(name);
  }

  // Validate against extracted value if confidence is low
  if (extractedValue && confidenceScore < 0.7) {
    result.confidence = 'low';
    result.warningLevel = 'warning';
    result.suggestions.push(`Low confidence extraction. Please verify: "${extractedValue}"`);
  }

  return result;
}

/**
 * Validate yacht dimensions with intelligent cross-checking
 */
export function validateYachtDimensions(context: FieldValidationContext): ValidationResult {
  const { fieldName, currentValue, relatedFields } = context;
  const result: ValidationResult = {
    isValid: true,
    confidence: 'high',
    suggestions: [],
    warningLevel: 'none'
  };

  const value = parseFloat(currentValue);
  
  if (isNaN(value) || value <= 0) {
    result.isValid = false;
    result.warningLevel = 'error';
    result.suggestions.push(`${fieldName} must be a positive number`);
    return result;
  }

  // Field-specific validation
  if (fieldName === 'lengthOverall') {
    if (value < 5) {
      result.warningLevel = 'warning';
      result.suggestions.push('Length seems unusually small for a yacht (< 5m)');
    }
    if (value > 200) {
      result.warningLevel = 'warning';
      result.suggestions.push('Length seems unusually large for a yacht (> 200m)');
    }

    // Cross-validation with beam
    if (relatedFields?.beam) {
      const beam = parseFloat(relatedFields.beam);
      if (!isNaN(beam) && beam > 0) {
        const ratio = value / beam;
        if (ratio < 2) {
          result.warningLevel = 'warning';
          result.suggestions.push('Length to beam ratio seems unusually low. Please verify dimensions.');
        }
        if (ratio > 15) {
          result.warningLevel = 'warning';
          result.suggestions.push('Length to beam ratio seems unusually high. Please verify dimensions.');
        }
      }
    }
  }

  if (fieldName === 'beam') {
    if (value < 1) {
      result.warningLevel = 'warning';
      result.suggestions.push('Beam seems unusually narrow (< 1m)');
    }
    if (value > 30) {
      result.warningLevel = 'warning';
      result.suggestions.push('Beam seems unusually wide (> 30m)');
    }
  }

  if (fieldName === 'draft') {
    if (value > 15) {
      result.warningLevel = 'warning';
      result.suggestions.push('Draft seems unusually deep (> 15m)');
    }
  }

  return result;
}

/**
 * Validate tonnage with intelligent range checking
 */
export function validateTonnage(context: FieldValidationContext): ValidationResult {
  const { currentValue, relatedFields } = context;
  const result: ValidationResult = {
    isValid: true,
    confidence: 'high',
    suggestions: [],
    warningLevel: 'none'
  };

  const tonnage = parseFloat(currentValue);
  
  if (isNaN(tonnage) || tonnage < 0) {
    result.isValid = false;
    result.warningLevel = 'error';
    result.suggestions.push('Gross tonnage must be a non-negative number');
    return result;
  }

  // Tonnage validation based on length
  if (relatedFields?.lengthOverall) {
    const length = parseFloat(relatedFields.lengthOverall);
    if (!isNaN(length) && length > 0) {
      // Rough tonnage estimation based on length
      const estimatedTonnage = Math.pow(length / 3.048, 3) * 0.67; // Rough formula
      const ratio = tonnage / estimatedTonnage;
      
      if (ratio < 0.3) {
        result.warningLevel = 'warning';
        result.suggestions.push(`Tonnage seems low for a ${length}m yacht. Expected around ${Math.round(estimatedTonnage)}GT`);
      }
      if (ratio > 3) {
        result.warningLevel = 'warning';
        result.suggestions.push(`Tonnage seems high for a ${length}m yacht. Expected around ${Math.round(estimatedTonnage)}GT`);
      }
    }
  }

  // Commercial vs pleasure yacht indicators
  if (tonnage >= 500) {
    result.suggestions.push('Yachts over 500GT typically require commercial certification');
  }
  if (tonnage >= 3000) {
    result.suggestions.push('Large commercial vessel tonnage detected. Verify yacht classification.');
  }

  return result;
}

/**
 * Validate flag state with common alternatives
 */
export function validateFlagState(context: FieldValidationContext): ValidationResult {
  const { currentValue, extractedValue, confidenceScore } = context;
  const result: ValidationResult = {
    isValid: true,
    confidence: 'high',
    suggestions: [],
    warningLevel: 'none'
  };

  if (!currentValue || currentValue.trim() === '') {
    result.isValid = false;
    result.warningLevel = 'error';
    result.suggestions.push('Flag state is required');
    return result;
  }

  const flagState = currentValue.toString().trim();

  // Common flag state mappings and corrections
  const flagStateMappings: Record<string, string> = {
    'CAYMAN': 'Cayman Islands',
    'CAYMAN ISLANDS': 'Cayman Islands',
    'MALTA': 'Malta',
    'MARSHALL IS': 'Marshall Islands',
    'MARSHALL ISLANDS': 'Marshall Islands',
    'BERMUDA': 'Bermuda',
    'BRITISH VIRGIN ISLANDS': 'British Virgin Islands',
    'BVI': 'British Virgin Islands',
    'MONACO': 'Monaco',
    'GIBRALTAR': 'Gibraltar',
    'BAHAMAS': 'Bahamas',
    'UNITED KINGDOM': 'United Kingdom',
    'UK': 'United Kingdom',
    'USA': 'United States',
    'UNITED STATES': 'United States',
    'NETHERLANDS': 'Netherlands',
    'ITALY': 'Italy',
    'FRANCE': 'France',
    'SPAIN': 'Spain'
  };

  const normalizedFlag = flagState.toUpperCase();
  if (flagStateMappings[normalizedFlag]) {
    const standardFlag = flagStateMappings[normalizedFlag];
    if (flagState !== standardFlag) {
      result.suggestions.push(`Consider using standard format: "${standardFlag}"`);
      result.correctedValue = standardFlag;
    }
  }

  // Check for common yacht flag states
  const popularYachtFlags = [
    'Cayman Islands', 'Malta', 'Marshall Islands', 'Bermuda', 
    'British Virgin Islands', 'Monaco', 'Gibraltar', 'Bahamas'
  ];
  
  if (!popularYachtFlags.some(flag => 
    flag.toLowerCase().includes(flagState.toLowerCase()) || 
    flagState.toLowerCase().includes(flag.toLowerCase())
  )) {
    result.warningLevel = 'info';
    result.suggestions.push('Uncommon yacht flag state. Please verify.');
  }

  // Low confidence warning
  if (extractedValue && confidenceScore < 0.6) {
    result.confidence = 'low';
    result.warningLevel = 'warning';
    result.suggestions.push(`Low confidence extraction. Verify flag state: "${extractedValue}"`);
  }

  return result;
}

/**
 * Validate year built with reasonable ranges
 */
export function validateYearBuilt(context: FieldValidationContext): ValidationResult {
  const { currentValue } = context;
  const result: ValidationResult = {
    isValid: true,
    confidence: 'high',
    suggestions: [],
    warningLevel: 'none'
  };

  const year = parseInt(currentValue);
  const currentYear = new Date().getFullYear();
  
  if (isNaN(year)) {
    result.isValid = false;
    result.warningLevel = 'error';
    result.suggestions.push('Year built must be a valid number');
    return result;
  }

  if (year < 1800) {
    result.isValid = false;
    result.warningLevel = 'error';
    result.suggestions.push('Year built cannot be before 1800');
  }

  if (year > currentYear + 2) {
    result.warningLevel = 'warning';
    result.suggestions.push('Future build year detected. Please verify.');
  }

  if (year < 1950) {
    result.suggestions.push('Vintage yacht detected. Ensure historical accuracy.');
  }

  return result;
}

/**
 * Validate capacity values with cross-checking
 */
export function validateCapacity(context: FieldValidationContext): ValidationResult {
  const { fieldName, currentValue, relatedFields } = context;
  const result: ValidationResult = {
    isValid: true,
    confidence: 'high',
    suggestions: [],
    warningLevel: 'none'
  };

  const capacity = parseInt(currentValue);
  
  if (isNaN(capacity) || capacity < 0) {
    result.isValid = false;
    result.warningLevel = 'error';
    result.suggestions.push(`${fieldName} must be a non-negative number`);
    return result;
  }

  if (fieldName === 'crewCapacity') {
    if (capacity > 50) {
      result.warningLevel = 'warning';
      result.suggestions.push('Large crew capacity. Verify if this is a commercial vessel.');
    }

    // Check ratio with guest capacity
    if (relatedFields?.guestCapacity) {
      const guests = parseInt(relatedFields.guestCapacity);
      if (!isNaN(guests) && guests > 0) {
        const ratio = guests / capacity;
        if (ratio > 6) {
          result.warningLevel = 'info';
          result.suggestions.push('High guest to crew ratio. Consider reviewing crew requirements.');
        }
      }
    }
  }

  if (fieldName === 'guestCapacity') {
    if (capacity > 36) {
      result.warningLevel = 'warning';
      result.suggestions.push('Large guest capacity may require commercial licensing.');
    }

    // Estimate based on length
    if (relatedFields?.lengthOverall) {
      const length = parseFloat(relatedFields.lengthOverall);
      if (!isNaN(length)) {
        const estimatedGuests = Math.floor(length / 3); // Rough estimation
        if (capacity > estimatedGuests * 2) {
          result.warningLevel = 'warning';
          result.suggestions.push(`High guest capacity for ${length}m yacht. Please verify.`);
        }
      }
    }
  }

  return result;
}

/**
 * Main validation function that coordinates all field validations
 */
export function validateYachtData(
  data: YachtOnboardingData,
  extractedData: any,
  confidenceScores: Record<string, number>
): Record<string, ValidationResult> {
  const validationResults: Record<string, ValidationResult> = {};

  // Validate yacht name
  validationResults.name = validateYachtName({
    fieldName: 'name',
    currentValue: data.basicInfo.name,
    extractedValue: extractedData.yacht_name,
    confidenceScore: confidenceScores.name || 0
  });

  // Validate flag state
  validationResults.flagState = validateFlagState({
    fieldName: 'flagState',
    currentValue: data.basicInfo.flagState,
    extractedValue: extractedData.flag_state,
    confidenceScore: confidenceScores.flagState || 0
  });

  // Validate year built
  if (data.basicInfo.year) {
    validationResults.year = validateYearBuilt({
      fieldName: 'year',
      currentValue: data.basicInfo.year,
      extractedValue: extractedData.year_built,
      confidenceScore: confidenceScores.year || 0
    });
  }

  // Validate dimensions
  const relatedDimensions = {
    lengthOverall: data.specifications.lengthOverall,
    beam: data.specifications.beam,
    draft: data.specifications.draft
  };

  if (data.specifications.lengthOverall) {
    validationResults.lengthOverall = validateYachtDimensions({
      fieldName: 'lengthOverall',
      currentValue: data.specifications.lengthOverall,
      extractedValue: extractedData.length_overall_m,
      confidenceScore: confidenceScores.lengthOverall || 0,
      relatedFields: relatedDimensions
    });
  }

  if (data.specifications.beam) {
    validationResults.beam = validateYachtDimensions({
      fieldName: 'beam',
      currentValue: data.specifications.beam,
      extractedValue: extractedData.beam_m,
      confidenceScore: confidenceScores.beam || 0,
      relatedFields: relatedDimensions
    });
  }

  // Validate tonnage
  if (data.specifications.grossTonnage) {
    validationResults.grossTonnage = validateTonnage({
      fieldName: 'grossTonnage',
      currentValue: data.specifications.grossTonnage,
      extractedValue: extractedData.gross_tonnage,
      confidenceScore: confidenceScores.grossTonnage || 0,
      relatedFields: relatedDimensions
    });
  }

  // Validate capacities
  const relatedCapacities = {
    crewCapacity: data.specifications.crewCapacity,
    guestCapacity: data.specifications.guestCapacity,
    lengthOverall: data.specifications.lengthOverall
  };

  if (data.specifications.crewCapacity) {
    validationResults.crewCapacity = validateCapacity({
      fieldName: 'crewCapacity',
      currentValue: data.specifications.crewCapacity,
      extractedValue: extractedData.crew_capacity,
      confidenceScore: confidenceScores.crewCapacity || 0,
      relatedFields: relatedCapacities
    });
  }

  if (data.specifications.guestCapacity) {
    validationResults.guestCapacity = validateCapacity({
      fieldName: 'guestCapacity',
      currentValue: data.specifications.guestCapacity,
      extractedValue: extractedData.guest_capacity,
      confidenceScore: confidenceScores.guestCapacity || 0,
      relatedFields: relatedCapacities
    });
  }

  return validationResults;
}

/**
 * Helper function to convert text to proper case
 */
function toProperCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get validation summary for UI display
 */
export function getValidationSummary(validationResults: Record<string, ValidationResult>): {
  totalFields: number;
  validFields: number;
  warningFields: number;
  errorFields: number;
  overallStatus: 'good' | 'warning' | 'error';
} {
  const total = Object.keys(validationResults).length;
  const valid = Object.values(validationResults).filter(r => r.isValid && r.warningLevel === 'none').length;
  const warning = Object.values(validationResults).filter(r => r.warningLevel === 'warning' || r.warningLevel === 'info').length;
  const error = Object.values(validationResults).filter(r => !r.isValid || r.warningLevel === 'error').length;

  let overallStatus: 'good' | 'warning' | 'error' = 'good';
  if (error > 0) overallStatus = 'error';
  else if (warning > 0) overallStatus = 'warning';

  return {
    totalFields: total,
    validFields: valid,
    warningFields: warning,
    errorFields: error,
    overallStatus
  };
}