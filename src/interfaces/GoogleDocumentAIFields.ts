/**
 * 🚀 GOOGLE DOCUMENT AI EXACT FIELD NAMES
 * Revolutionary approach: Use exact field names from Google Document AI
 * No complex mapping - direct field matching for maximum accuracy
 */

export interface GoogleDocumentAIFields {
  // 🔥 CERTIFICATE INFORMATION - EXACT GOOGLE FIELD NAMES
  Certificate_No?: string;
  No_Year?: string;
  Callsign?: string;
  OfficialNo?: string;
  
  // 🔥 VESSEL IDENTITY - EXACT GOOGLE FIELD NAMES
  Name_o_fShip?: string;
  Home_Port?: string;
  Description_of_Vessel?: string;
  
  // 🔥 BUILD INFORMATION - EXACT GOOGLE FIELD NAMES
  When_and_Where_Built?: string;
  Framework?: string;
  HULL_ID?: string;
  
  // 🔥 TECHNICAL SPECIFICATIONS - EXACT GOOGLE FIELD NAMES
  Length_overall?: string;
  Particulars_of_Tonnage?: string;
  Main_breadth?: string;
  Depth?: string;
  
  // 🔥 PROPULSION - EXACT GOOGLE FIELD NAMES
  Propulsion_Power?: string;
  Propulsion?: string;
  Number_and_Description_of_Engines?: string;
  Engine_Makers?: string;
  Engines_Year_of_Make?: string;
  
  // 🔥 OWNER INFORMATION - EXACT GOOGLE FIELD NAMES
  Owners_description?: string;
  Owners_residence?: string;
  
  // 🔥 REGISTRATION DATES - EXACT GOOGLE FIELD NAMES
  Provisionally_registered_on?: string;
  Registered_on?: string;
  Certificate_issued_this?: string;
  This_certificate_expires_on?: string;
  
  // 🔥 ADDITIONAL FIELDS - Allow for any other Google Document AI fields
  [key: string]: any;
}

/**
 * 🎯 DIRECT FIELD MAPPING CONFIGURATION
 * Maps Google Document AI field names directly to yacht onboarding fields
 * No complex logic - just direct, accurate mapping
 */
export const GOOGLE_DOCUMENTAI_FIELD_MAPPING = {
  // Certificate Information - DIRECT MAPPING
  Certificate_No: 'certificateNumber',
  No_Year: 'registrationInfo',
  Callsign: 'callSign',
  OfficialNo: 'officialNumber',
  
  // Vessel Identity - DIRECT MAPPING
  Name_o_fShip: 'name',
  Home_Port: 'homePort',
  Description_of_Vessel: 'type',
  
  // Build Information - DIRECT MAPPING
  When_and_Where_Built: 'builderInfo',
  Framework: 'hullMaterial',
  HULL_ID: 'imoNumber',
  
  // Technical Specifications - DIRECT MAPPING
  Length_overall: 'lengthOverall',
  Particulars_of_Tonnage: 'grossTonnage',
  Main_breadth: 'beam',
  Depth: 'draft',
  
  // Propulsion - DIRECT MAPPING
  Propulsion_Power: 'enginePower',
  Propulsion: 'engineType',
  Number_and_Description_of_Engines: 'engineDescription',
  Engine_Makers: 'engineManufacturer',
  Engines_Year_of_Make: 'engineYear',
  
  // Owner Information - DIRECT MAPPING
  Owners_description: 'ownerType',
  Owners_residence: 'ownerAddress',
  
  // Registration Dates - DIRECT MAPPING
  Provisionally_registered_on: 'provisionalRegistrationDate',
  Registered_on: 'registrationDate',
  Certificate_issued_this: 'certificateIssuedDate',
  This_certificate_expires_on: 'certificateExpiresDate'
} as const;

/**
 * 🚀 REVOLUTIONARY GOOGLE DOCUMENT AI PROCESSOR
 * Processes data using exact Google Document AI field names
 * Maximum simplicity and accuracy
 */
export class GoogleDocumentAIProcessor {
  
  /**
   * 🎯 DIRECT PROCESSING - NO COMPLEX MAPPING
   * Takes Google Document AI data and processes it directly
   */
  static processGoogleDocumentAIData(googleData: GoogleDocumentAIFields): any {
    const processedData: any = {};
    
    // 🔥 DIRECT FIELD ASSIGNMENT - MAXIMUM ACCURACY
    Object.entries(googleData).forEach(([googleFieldName, value]) => {
      if (value && value !== '') {
        // Get the direct mapped field name
        const mappedFieldName = GOOGLE_DOCUMENTAI_FIELD_MAPPING[googleFieldName as keyof typeof GOOGLE_DOCUMENTAI_FIELD_MAPPING];
        
        if (mappedFieldName) {
          // Process the field value
          processedData[mappedFieldName] = this.processFieldValue(googleFieldName, value);
          console.log(`[GOOGLE-AI-PROCESSOR] ✅ ${googleFieldName} → ${mappedFieldName}: ${processedData[mappedFieldName]}`);
        } else {
          // Keep original field name if no mapping found
          processedData[googleFieldName] = this.processFieldValue(googleFieldName, value);
          console.log(`[GOOGLE-AI-PROCESSOR] ⚠️ ${googleFieldName}: No mapping found, using original name`);
        }
      }
    });
    
    console.log(`[GOOGLE-AI-PROCESSOR] 🎯 Total fields processed: ${Object.keys(processedData).length}`);
    return processedData;
  }
  
  /**
   * 🔥 REVOLUTIONARY FIELD VALUE PROCESSING
   * Processes field values with DD-MM-YYYY date formatting
   */
  private static processFieldValue(fieldName: string, value: string): any {
    // 📅 DATE PROCESSING - DD-MM-YYYY FORMAT
    if (this.isDateField(fieldName)) {
      return this.formatToDateDDMMYYYY(value);
    }
    
    // 🔢 NUMERIC PROCESSING
    if (this.isNumericField(fieldName)) {
      return this.extractNumericValue(value);
    }
    
    // 📝 TEXT PROCESSING
    return value.trim();
  }
  
  /**
   * 📅 DATE FIELD DETECTION
   */
  private static isDateField(fieldName: string): boolean {
    const dateFields = [
      'Provisionally_registered_on',
      'Registered_on', 
      'Certificate_issued_this',
      'This_certificate_expires_on',
      'Engines_Year_of_Make'
    ];
    return dateFields.includes(fieldName);
  }
  
  /**
   * 🔢 NUMERIC FIELD DETECTION
   */
  private static isNumericField(fieldName: string): boolean {
    const numericFields = [
      'Length_overall',
      'Main_breadth',
      'Depth',
      'Particulars_of_Tonnage',
      'OfficialNo',
      'Engines_Year_of_Make'
    ];
    return numericFields.includes(fieldName);
  }
  
  /**
   * 📅 DD-MM-YYYY DATE FORMATTING
   */
  private static formatToDateDDMMYYYY(dateStr: string): string {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    
    try {
      // Handle "10 December 2020" format
      const dayMonthYearMatch = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
      if (dayMonthYearMatch) {
        const day = dayMonthYearMatch[1].padStart(2, '0');
        const monthName = dayMonthYearMatch[2];
        const year = dayMonthYearMatch[3];
        const monthNum = this.getMonthNumber(monthName);
        return `${day}-${monthNum.toString().padStart(2, '0')}-${year}`;
      }
      
      // Handle "December 2020" format
      const monthYearMatch = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
      if (monthYearMatch) {
        const monthName = monthYearMatch[1];
        const year = monthYearMatch[2];
        const monthNum = this.getMonthNumber(monthName);
        return `01-${monthNum.toString().padStart(2, '0')}-${year}`;
      }
      
      // Return as-is if already in DD-MM-YYYY format or unrecognized
      return dateStr;
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateStr;
    }
  }
  
  /**
   * 🔢 NUMERIC VALUE EXTRACTION
   */
  private static extractNumericValue(value: string): number | string {
    if (typeof value === 'number') return value;
    
    // Extract "Combined KW 2864" format
    const kwMatch = value.match(/Combined KW\s*(\d+(?:\.\d+)?)/i);
    if (kwMatch) {
      return parseFloat(kwMatch[1]);
    }
    
    // Extract pure numeric values
    const numericMatch = value.match(/(\d+(?:\.\d+)?)/);
    if (numericMatch) {
      const numValue = parseFloat(numericMatch[1]);
      return !isNaN(numValue) ? numValue : value;
    }
    
    return value;
  }
  
  /**
   * 📅 MONTH NAME TO NUMBER CONVERSION
   */
  private static getMonthNumber(monthName: string): number {
    const months: Record<string, number> = {
      'january': 1, 'jan': 1,
      'february': 2, 'feb': 2,
      'march': 3, 'mar': 3,
      'april': 4, 'apr': 4,
      'may': 5,
      'june': 6, 'jun': 6,
      'july': 7, 'jul': 7,
      'august': 8, 'aug': 8,
      'september': 9, 'sep': 9,
      'october': 10, 'oct': 10,
      'november': 11, 'nov': 11,
      'december': 12, 'dec': 12
    };
    
    return months[monthName.toLowerCase()] || 1;
  }
}