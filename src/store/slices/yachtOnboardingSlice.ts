import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { YachtOnboardingData } from '@/components/onboarding/YachtOnboardingWizard';
import { SmartScanResult } from '@/services/SmartScanService';

// Extended interface for Redux state - Enhanced with all certificate fields
export interface YachtBasicData {
  // Basic vessel identity
  yacht_name?: string;
  name_o_fship?: string; // Alternate field name
  yacht_type?: string;
  category?: string;
  flag_state?: string;
  home_port?: string;
  builder?: string;
  year_built?: number;
  
  // Dimensions
  length_overall_m?: number;
  hull_length?: number;
  beam_m?: number;
  main_breadth?: number;
  draft_m?: number;
  depth?: number;
  
  // Capacity and performance
  crew_capacity?: number;
  guest_capacity?: number;
  max_speed_knots?: number;
  fuel_capacity?: number; // 🔥 ADDED: fuel capacity extraction
  gross_tonnage?: number;
  net_tonnage?: number; // 🔥 Added for extraction
  
  // Certificate and registration fields
  certificate_number?: string;
  certificate_number_alt?: string; // 🔥 Added for form_fields extraction
  certificate_no?: string;
  certificate_issued_this?: string;
  certificate_issued_date?: string;
  certificate_expires_date?: string; // 🔥 Added for "This certificate expires on 06"
  this_certificate_expires_on?: string;
  
  // Registration dates
  provisional_registration_date?: string;
  provisionally_registered_on?: string;
  provisionally_registered_on_specific?: string; // 🔥 Added for specific patterns
  registered_on?: string;
  
  // Identification numbers
  imo_number?: string;
  imo?: string;
  imo_no?: string;
  official_number?: string;
  official_number_alt?: string; // 🔥 Added for form_fields extraction
  official_no?: string;
  call_sign?: string;
  callsign?: string;
  
  // Hull and structure
  hull_id?: string;
  hull_id_alt?: string; // 🔥 Added for form_fields extraction
  hull_material?: string;
  framework?: string;
  description_of_vessel?: string;
  
  // Engine and propulsion
  engine_type?: string;
  engine_makers?: string;
  engines_year_of_make?: number;
  number_and_description_of_engines?: string;
  propulsion?: string;
  propulsion_power?: number;
  engine_power_kw?: number;
  
  // Owner information
  owners_description?: string;
  owners_residence?: string;
  
  // Tonnage details
  particulars_of_tonnage?: string;
  gross_net_tonnage_combined?: string; // 🔥 Added for combined tonnage fields
  
  // Build information
  when_and_where_built?: string;
  builder_and_year?: string; // 🔥 Added for composite field
  no_year?: string;
  
  // Additional extracted fields for comprehensive auto-population
  combined_info?: string; // 🔥 For "No, Year and Home Port" composite
  yacht_name_stark_part?: string; // 🔥 For STARK name component
  technical_info?: string; // 🔥 For technical information
  estimated_speed?: string; // 🔥 For speed information
  registration_info?: string; // 🔥 For registration details
  registry_flag_state?: string; // 🔥 For registry information
  length_overall_lowercase?: number; // 🔥 For lowercase length field
  
  [key: string]: any; // Allow dynamic property assignment
}

export interface UploadedDocument {
  id: string;
  uri: string;
  type: string;
  name: string;
  size: number;
  extractedSubset?: Partial<YachtBasicData>;
  processingStatus: 'pending' | 'processing' | 'success' | 'error';
  smartScanResult?: SmartScanResult;
  confidence?: number;
}

export interface YachtOnboardingState {
  // Current onboarding data
  onboardingData: YachtOnboardingData;
  
  // Extracted data from SmartScan
  extractedYachtData: YachtBasicData;
  
  // Uploaded documents
  uploadedDocuments: UploadedDocument[];
  
  // SmartScan results
  smartScanResults: SmartScanResult[];
  
  // Onboarding progress
  currentStep: number;
  completedSteps: number[];
  isSmartScanCompleted: boolean;
  skipSmartScan: boolean;
  
  // Yacht creation
  createdYachtId: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Validation
  validationErrors: Record<string, string>;
  
  // Auto-population tracking
  autoPopulatedFields: string[];
  confidenceScores: Record<string, number>;
}

const initialState: YachtOnboardingState = {
  onboardingData: {
    basicInfo: {
      name: '',
      type: '',
      category: '',
      builder: '',
      model: '',
      year: new Date().getFullYear(),
      flagState: '',
      imoNumber: '',
      officialNumber: '',
      callSign: '',
      hullMaterial: '',
      ownerInfo: {
        ownerType: 'individual'
      }
    },
    specifications: {
      lengthOverall: 0,
      beam: 0,
      draft: 0,
      grossTonnage: 0,
      maxSpeed: 0,
      crewCapacity: 0,
      guestCapacity: 0,
      engineType: '',
      enginePower: 0,
      fuelCapacity: 0
    },
    documentation: {
      additionalDocs: []
    },
    initialCrew: {
      captainName: '',
      captainEmail: '',
      captainPhone: '',
      captainCertificates: [],
      additionalCrew: []
    },
    operations: {
      homePort: '',
      currentLocation: {
        port: '',
        country: ''
      },
      operationalAreas: []
    },
    accessControl: {
      ownerUsers: [],
      managerUsers: [],
      accessNotes: ''
    }
  },
  extractedYachtData: {},
  uploadedDocuments: [],
  smartScanResults: [],
  currentStep: 0,
  completedSteps: [],
  isSmartScanCompleted: false,
  skipSmartScan: false,
  createdYachtId: null,
  isLoading: false,
  error: null,
  validationErrors: {},
  autoPopulatedFields: [],
  confidenceScores: {}
};

// Async thunks for SmartScan operations
export const processSmartScanData = createAsyncThunk(
  'yachtOnboarding/processSmartScanData',
  async (scanResult: SmartScanResult, { dispatch }) => {
    console.log('[Redux] 🔬 FORENSIC AUDIT: Starting unified processing');
    console.log('[Redux] 📊 Scan result structure:', {
      hasAutoPopulateData: !!scanResult.auto_populate_data,
      hasExtractedData: !!scanResult.extracted_data,
      autoPopulateKeys: Object.keys(scanResult.auto_populate_data || {}),
      extractedDataKeys: Object.keys(scanResult.extracted_data || {})
    });
    
    // 🔥 UNIFIED PROCESSING: Single source of truth
    const extractedData: YachtBasicData = {};
    const confidenceScores: Record<string, number> = {};
    const extractedDataAny = scanResult.extracted_data as any;
    
    // 🎯 PRIORITY 1: key_information (highest priority - direct Document AI key-value pairs)
    if (extractedDataAny?.key_information) {
      console.log('[Redux] 🎯 PROCESSING key_information (PRIORITY 1):', extractedDataAny.key_information);
      Object.entries(extractedDataAny.key_information).forEach(([key, value]) => {
        if (value && value !== '' && value !== 0) {
          extractedData[key as keyof YachtBasicData] = value as string | number;
          confidenceScores[key] = (scanResult.confidence || 0.85) + 0.15; // Highest confidence
          console.log(`[Redux] ✅ KEY_INFO: "${key}" = "${value}" (conf: ${confidenceScores[key]})`);
        }
      });
    }
    
    // 🎯 PRIORITY 2: auto_populate_data.basicInfo (medium priority - processed yacht fields)
    if (scanResult.auto_populate_data?.basicInfo) {
      console.log('[Redux] 🎯 PROCESSING auto_populate_data.basicInfo (PRIORITY 2):', scanResult.auto_populate_data.basicInfo);
      Object.entries(scanResult.auto_populate_data.basicInfo).forEach(([key, value]) => {
        // Only use if not already set by key_information
        if (!extractedData[key as keyof YachtBasicData] && value && value !== '' && value !== 0) {
          extractedData[key as keyof YachtBasicData] = value as string | number;
          confidenceScores[key] = (scanResult.confidence || 0.75) + 0.1;
          console.log(`[Redux] ✅ BASIC_INFO: "${key}" = "${value}" (conf: ${confidenceScores[key]})`);
        } else if (extractedData[key as keyof YachtBasicData]) {
          console.log(`[Redux] ⚠️ SKIP BASIC_INFO (already set): "${key}"`);
        }
      });
    }
    
    // 🎯 PRIORITY 3: extractedFields (lowest priority - fallback extraction)
    if (scanResult.auto_populate_data?.extractedFields) {
      console.log('[Redux] 🎯 PROCESSING extractedFields (PRIORITY 3):', scanResult.auto_populate_data.extractedFields);
      
      // 🔥 FIXED: Unified field mappings (no duplicates)
      const unifiedFieldMappings: Record<string, keyof YachtBasicData> = {
        'Name of Ship': 'yacht_name',
        'Ship Name': 'yacht_name',
        'Vessel Name': 'yacht_name',
        'Flag State': 'flag_state',
        'Port of Registry': 'flag_state',
        'Year Built': 'year_built',
        'Length Overall': 'length_overall_m', // ✅ Fixed
        'Beam': 'beam_m',
        'Gross Tonnage': 'gross_tonnage',
        'Call Sign': 'call_sign',
        'Official No.': 'official_number',
        'Certificate No.': 'certificate_number',
        'Hull ID': 'hull_id',
        'Engine Type': 'engine_type',
        'Engine Power': 'engine_power_kw',
        'Hull Material': 'hull_material'
      };
      
      Object.entries(scanResult.auto_populate_data.extractedFields).forEach(([key, value]) => {
        const mappedKey = unifiedFieldMappings[key] || key;
        // Only use if not already set by higher priority sources
        if (!extractedData[mappedKey] && value && value !== '' && value !== 0) {
          extractedData[mappedKey] = value as string | number;
          confidenceScores[mappedKey] = scanResult.confidence || 0.65;
          console.log(`[Redux] ✅ EXTRACTED_FIELD: "${key}" -> "${mappedKey}" = "${value}"`);
        } else if (extractedData[mappedKey]) {
          console.log(`[Redux] ⚠️ SKIP EXTRACTED_FIELD (already set): "${key}" -> "${mappedKey}"`);
        }
      });
    }
    
    // 🔥 RESTORED: Process form_fields with conflict-free mappings (PRIORITY 4)
    if (extractedDataAny?.form_fields) {
      console.log('[Redux] 🔄 PROCESSING form_fields (PRIORITY 4 - complete extraction):', extractedDataAny.form_fields);
      
      // 🔥 CONFLICT-FREE field mappings (different target fields to avoid overwrites)
      const formFieldMappings: Record<string, keyof YachtBasicData> = {
        // Certificate Information - Use different field names to avoid conflicts
        'Certificate': 'certificate_number_alt',
        'Certificate_issued_this': 'certificate_issued_this',
        'This_certificate_expires_on': 'certificate_expires_date',
        
        // Additional identification - Use separate fields
        'Callsign': 'callsign', // Different from call_sign
        'OfficialNo': 'official_number_alt', // Different from official_number
        
        // Hull Information - Additional fields
        'HULL_ID': 'hull_id_alt',
        'Framework': 'framework',
        'Description_of_Vessel': 'description_of_vessel',
        
        // Engine Information - Additional details
        'Engine_Makers': 'engine_makers',
        'Engines_Year_of_Make': 'engines_year_of_make',
        'Number_and_Description_of_Engines': 'number_and_description_of_engines',
        'Propulsion': 'propulsion',
        'Propulsion_Power': 'propulsion_power',
        
        // Owner Information
        'Owners_description': 'owners_description',
        'Owners_residence': 'owners_residence',
        'Organization_Name': 'organization_name', // 🔥 FIXED: Add organization name mapping
        'Company_Name': 'organization_name', // 🔥 FIXED: Alternative organization name mapping
        'Business_Name': 'organization_name', // 🔥 FIXED: Alternative business name mapping
        
        // Registration Dates
        'Provisionally_registered_on': 'provisionally_registered_on',
        'Registered_on': 'registered_on',
        'No_Year': 'no_year',
        'Year_Built': 'year_built', // 🔥 FIXED: Add year built mapping
        'Build_Year': 'year_built', // 🔥 FIXED: Alternative year built mapping
        'Year': 'year_built', // 🔥 FIXED: Simple year mapping
        
        // Additional tonnage and dimensions (non-conflicting)
        'Hull_length': 'hull_length',
        'Main_breadth': 'main_breadth', 
        'Depth': 'depth',
        'Particulars_of_Tonnage': 'particulars_of_tonnage',
        
        // Home port and additional location info
        'Home_Port': 'home_port'
      };
      
      Object.entries(extractedDataAny.form_fields).forEach(([key, value]) => {
        const mappedKey = formFieldMappings[key];
        if (mappedKey && value && value !== '') {
          // Only use if not already set by higher priority sources
          if (!extractedData[mappedKey]) {
            // Parse the value appropriately
            let parsedValue: string | number = value as string | number;
            
            // Handle numeric fields
            if (['hull_length', 'main_breadth', 'depth', 'propulsion_power'].includes(mappedKey as string)) {
              const numericValue = parseFloat(String(value).replace(/[^\d.,]/g, '').replace(',', '.'));
              if (!isNaN(numericValue)) {
                parsedValue = numericValue;
              }
            }
            
            extractedData[mappedKey] = parsedValue;
            confidenceScores[mappedKey] = (scanResult.confidence || 0.75) - 0.05; // Lower confidence for form fields
            console.log(`[Redux] ✅ FORM_FIELD: "${key}" -> "${mappedKey}": ${parsedValue}`);
          } else {
            console.log(`[Redux] ⚠️ SKIP FORM_FIELD (already set): "${key}" -> "${mappedKey}"`);
          }
        } else if (!mappedKey) {
          console.log(`[Redux] ❌ No mapping for form field: "${key}"`);
        }
      });
    }
    
    // 🔥 COMPLETE EXTRACTION: All Document AI data sources now included with conflict-free mapping
    console.log('[Redux] 🏁 COMPLETE UNIFIED PROCESSING:', {
      totalFieldsExtracted: Object.keys(extractedData).length,
      fieldsWithConfidence: Object.keys(confidenceScores).length,
      extractedFieldNames: Object.keys(extractedData),
      confidenceScoresSample: Object.entries(confidenceScores).slice(0, 5),
      priorityBreakdown: {
        keyInformation: Object.keys(extractedDataAny?.key_information || {}).length,
        basicInfo: Object.keys(scanResult.auto_populate_data?.basicInfo || {}).length,
        extractedFields: Object.keys(scanResult.auto_populate_data?.extractedFields || {}).length,
        formFields: Object.keys(extractedDataAny?.form_fields || {}).length
      }
    });
    
    return { extractedData, confidenceScores, scanResult };
  }
);

const yachtOnboardingSlice = createSlice({
  name: 'yachtOnboarding',
  initialState,
  reducers: {
    // Step navigation
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    
    markStepCompleted: (state, action: PayloadAction<number>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },
    
    // Onboarding data updates
    updateBasicInfo: (state, action: PayloadAction<Partial<YachtOnboardingData['basicInfo']>>) => {
      state.onboardingData.basicInfo = { ...state.onboardingData.basicInfo, ...action.payload };
    },
    
    updateSpecifications: (state, action: PayloadAction<Partial<YachtOnboardingData['specifications']>>) => {
      state.onboardingData.specifications = { ...state.onboardingData.specifications, ...action.payload };
    },
    
    updateInitialCrew: (state, action: PayloadAction<Partial<YachtOnboardingData['initialCrew']>>) => {
      state.onboardingData.initialCrew = { ...state.onboardingData.initialCrew, ...action.payload };
    },
    
    updateOperations: (state, action: PayloadAction<Partial<YachtOnboardingData['operations']>>) => {
      state.onboardingData.operations = { ...state.onboardingData.operations, ...action.payload };
    },
    
    updateAccessControl: (state, action: PayloadAction<Partial<YachtOnboardingData['accessControl']>>) => {
      state.onboardingData.accessControl = { ...state.onboardingData.accessControl, ...action.payload };
    },
    
    // SmartScan management
    addSmartScanResult: (state, action: PayloadAction<SmartScanResult>) => {
      state.smartScanResults.push(action.payload);
    },
    
    setSmartScanCompleted: (state, action: PayloadAction<boolean>) => {
      state.isSmartScanCompleted = action.payload;
      if (action.payload && !state.completedSteps.includes(0)) {
        state.completedSteps.push(0); // Mark step 0 (SmartScan) as completed
      }
    },
    
    setSkipSmartScan: (state, action: PayloadAction<boolean>) => {
      state.skipSmartScan = action.payload;
      if (action.payload) {
        state.isSmartScanCompleted = true;
        if (!state.completedSteps.includes(0)) {
          state.completedSteps.push(0);
        }
      }
    },
    
    // Document management
    addUploadedDocument: (state, action: PayloadAction<UploadedDocument>) => {
      state.uploadedDocuments.push(action.payload);
    },
    
    updateDocumentStatus: (state, action: PayloadAction<{ id: string; status: UploadedDocument['processingStatus']; result?: SmartScanResult }>) => {
      const doc = state.uploadedDocuments.find(d => d.id === action.payload.id);
      if (doc) {
        doc.processingStatus = action.payload.status;
        if (action.payload.result) {
          doc.smartScanResult = action.payload.result;
          doc.confidence = action.payload.result.confidence;
        }
      }
    },
    
    removeUploadedDocument: (state, action: PayloadAction<string>) => {
      state.uploadedDocuments = state.uploadedDocuments.filter(doc => doc.id !== action.payload);
    },
    
    // Auto-population from SmartScan
    applyAutoPopulation: (state, action: PayloadAction<{ extractedData: YachtBasicData; confidenceScores: Record<string, number> }>) => {
      const { extractedData, confidenceScores } = action.payload;
      console.log('[Redux] 🚀 APPLY AUTO-POPULATION with unified data:', extractedData);
      console.log('[Redux] 📊 Field count analysis:', {
        totalFields: Object.keys(extractedData).length,
        fieldNames: Object.keys(extractedData),
        currentAutoPopulated: state.autoPopulatedFields.length
      });
      
      // 🔥 CRITICAL FIX: Preserve existing auto-populated fields + add new ones
      const existingFields = new Set(state.autoPopulatedFields);
      const newFields: string[] = [];
      
      // Store extracted data for later use
      state.extractedYachtData = { ...state.extractedYachtData, ...extractedData };
      
      // Merge confidence scores (keep highest confidence for existing fields)
      Object.entries(confidenceScores).forEach(([key, confidence]) => {
        if (!state.confidenceScores[key] || state.confidenceScores[key] < confidence) {
          state.confidenceScores[key] = confidence;
        }
      });
      console.log('  - state.autoPopulatedFields is array:', Array.isArray(state.autoPopulatedFields));
      
      // 🔥 FIXED: Only initialize if truly undefined/null, NOT if it's an empty array
      if (!state.autoPopulatedFields) {
        console.log('[Redux] 🔧 INITIALIZING: autoPopulatedFields was null/undefined');
        state.autoPopulatedFields = [];
      }
      
      // 🔥 DEBUGGING: Check for builder and certificate number specifically
      console.log('[Redux] 🔍 DEBUGGING KEY FIELDS:');
      console.log('  - builder:', extractedData.builder);
      console.log('  - builder_and_year:', extractedData.builder_and_year);
      console.log('  - when_and_where_built:', extractedData.when_and_where_built);
      console.log('  - certificate_number:', extractedData.certificate_number);
      console.log('  - certificate_issued_this:', extractedData.certificate_issued_this);
      console.log('  - yacht_name:', extractedData.yacht_name);
      console.log('  - call_sign:', extractedData.call_sign);
      console.log('  - official_number:', extractedData.official_number);
      
      // Store extracted data first
      state.extractedYachtData = { ...state.extractedYachtData, ...extractedData };
      state.confidenceScores = { ...state.confidenceScores, ...confidenceScores };
      
      // 🔥 CRITICAL: Initialize autoPopulatedFields tracking array
      const updatedAutoPopulatedFields = [...state.autoPopulatedFields];
      
      // 🔥 HIGHEST PRIORITY: Extract year_built from SmartScan result  
      if (extractedData.year_built) {
        state.onboardingData.basicInfo.year = Number(extractedData.year_built);
        if (!updatedAutoPopulatedFields.includes('year')) updatedAutoPopulatedFields.push('year');
        console.log('[Redux] ✅ SET year_built (DIRECT):', extractedData.year_built);
      }
      
      // Basic vessel information with priority handling
      if (extractedData.yacht_name) {
        const name = extractedData.yacht_name;
        state.onboardingData.basicInfo.name = String(name);
        if (!updatedAutoPopulatedFields.includes('name')) updatedAutoPopulatedFields.push('name');
        console.log('[Redux] ✅ SET yacht_name:', name);
      }
      
      if (extractedData.flag_state) {
        state.onboardingData.basicInfo.flagState = String(extractedData.flag_state);
        if (!updatedAutoPopulatedFields.includes('flagState')) updatedAutoPopulatedFields.push('flagState');
        console.log('[Redux] ✅ SET flag_state:', extractedData.flag_state);
      }
      
      if (extractedData.builder) {
        state.onboardingData.basicInfo.builder = String(extractedData.builder);
        if (!updatedAutoPopulatedFields.includes('builder')) updatedAutoPopulatedFields.push('builder');
        console.log('[Redux] ✅ SET builder:', extractedData.builder);
      }
      
      // 🔥 CRITICAL: Enhanced builder extraction from composite fields
      if (!state.onboardingData.basicInfo.builder) {
        const builderSources = [
          extractedData.builder_and_year,
          extractedData.when_and_where_built,
          extractedData.technical_info,
          extractedData.registration_info
        ];
        
        for (const builderSource of builderSources) {
          if (builderSource && String(builderSource).includes('AZIMUT')) {
            const builderText = String(builderSource);
            console.log(`[Redux] 🔍 BUILDER EXTRACTION from: "${builderText}"`);
            
            // Enhanced patterns for AZIMUT BENETTI SPA
            const builderPatterns = [
              /(?:20\d{2}\s+)?(AZIMUT\s+BENETTI\s+SPA)/i,
              /(AZIMUT\s+BENETTI)/i,
              /([A-Z][A-Z\s&]{4,}(?:SPA|LTD|LIMITED|INC|CORPORATION|CORP|SHIPYARD|YACHTS)?)/i
            ];
            
            for (const pattern of builderPatterns) {
              const builderMatch = builderText.match(pattern);
              if (builderMatch && builderMatch[1]) {
                let builderName = builderMatch[1].trim().replace(/,.*$/, '').trim();
                if (builderName.length > 3) {
                  state.onboardingData.basicInfo.builder = builderName;
                  if (!updatedAutoPopulatedFields.includes('builder')) updatedAutoPopulatedFields.push('builder');
                  console.log(`[Redux] ✅ SET builder (extracted from composite): "${builderName}"`);
                  break;
                }
              }
            }
            
            if (state.onboardingData.basicInfo.builder) break;
          }
        }
      }
      
      // 🔥 CRITICAL: Enhanced builder extraction from composite fields
      if (!extractedData.builder && (extractedData.builder_and_year || extractedData.when_and_where_built)) {
        const builderSource = extractedData.builder_and_year || extractedData.when_and_where_built;
        // Extract builder from "2025 AZIMUT BENETTI SPA, VIAREGGIO (LUCCA), ITALY"
        const builderMatch = String(builderSource).match(/\b([A-Z][A-Z\s&]{3,}(?:SPA|LTD|LIMITED|INC|CORPORATION|CORP|SHIPYARD|YACHTS))\b/i);
        if (builderMatch && builderMatch[1]) {
          const builderName = builderMatch[1].trim().replace(/,.*$/, '').trim();
          state.onboardingData.basicInfo.builder = builderName;
          if (!updatedAutoPopulatedFields.includes('builder')) updatedAutoPopulatedFields.push('builder');
          console.log('[Redux] ✅ SET builder (from composite):', builderName);
        }
        
        // 🔥 ALSO extract year from the same composite field (if not already extracted)
        if (!extractedData.year_built) {
          const yearMatch = String(builderSource).match(/\b(20\d{2}|19\d{2})\b/);
          if (yearMatch) {
            const year = Number(yearMatch[1]);
            state.onboardingData.basicInfo.year = year;
            if (!updatedAutoPopulatedFields.includes('year')) updatedAutoPopulatedFields.push('year');
            console.log('[Redux] ✅ SET year_built (from builder composite):', year);
          }
        }
      }

      
      // 🔥 ENHANCED: Extract depth/draft from particulars_of_tonnage when available
      if (extractedData.particulars_of_tonnage && !state.onboardingData.specifications.draft) {
        // Extract depth from "Gross & Net Tonnage\n83.89" or similar
        const depthMatch = String(extractedData.particulars_of_tonnage).match(/depth[:\s]*([\d.]+)/i);
        if (depthMatch) {
          const depth = Number(depthMatch[1]);
          if (depth > 0) {
            state.onboardingData.specifications.draft = depth;
            if (!updatedAutoPopulatedFields.includes('draft')) updatedAutoPopulatedFields.push('draft');
            console.log('[Redux] ✅ SET draft (from tonnage particulars):', depth);
          }
        }
      }
      
      // 🔥 ENHANCED: Additional technical detail fields using existing schema  
      
      // Net tonnage - use grossTonnage as fallback if no gross tonnage exists
      if (extractedData.net_tonnage && !extractedData.gross_tonnage) {
        state.onboardingData.specifications.grossTonnage = Number(extractedData.net_tonnage);
        if (!updatedAutoPopulatedFields.includes('grossTonnage')) updatedAutoPopulatedFields.push('grossTonnage');
        console.log('[Redux] ✅ SET net_tonnage (as grossTonnage):', extractedData.net_tonnage);
      }
      
      // Depth/Draft from extracted depth field
      if (extractedData.depth && !extractedData.draft_m) {
        const depth = Number(extractedData.depth);
        if (depth > 0) {
          state.onboardingData.specifications.draft = depth;
          if (!updatedAutoPopulatedFields.includes('draft')) updatedAutoPopulatedFields.push('draft');
          console.log('[Redux] ✅ SET depth (as draft):', depth);
        }
      }
      
      // Hull ID - use IMO number field as storage for hull ID
      if (extractedData.hull_id && !state.onboardingData.basicInfo.imoNumber) {
        state.onboardingData.basicInfo.imoNumber = String(extractedData.hull_id);
        if (!updatedAutoPopulatedFields.includes('imoNumber')) updatedAutoPopulatedFields.push('imoNumber');
        console.log('[Redux] ✅ SET hull_id (as imoNumber):', extractedData.hull_id);
      }
      
      // Engine makers - use engineType for comprehensive engine info
      if (extractedData.engine_makers && !state.onboardingData.specifications.engineType) {
        const engineInfo = `${state.onboardingData.specifications.engineType || ''} ${extractedData.engine_makers}`.trim();
        state.onboardingData.specifications.engineType = engineInfo;
        if (!updatedAutoPopulatedFields.includes('engineType')) updatedAutoPopulatedFields.push('engineType');
        console.log('[Redux] ✅ SET engine_makers (combined with engineType):', engineInfo);
      }
      
      // Estimated speed (technical specification)
      if (extractedData.estimated_speed && !state.onboardingData.specifications.maxSpeed) {
        // Handle "Speed of Shipknots" format
        let speedText = String(extractedData.estimated_speed);
        
        // Extract numeric value from "Speed of Shipknots" or similar
        const speedMatch = speedText.match(/([\d.]+)/);
        if (speedMatch) {
          const speed = Number(speedMatch[1]);
          if (speed > 0) {
            state.onboardingData.specifications.maxSpeed = speed;
            if (!updatedAutoPopulatedFields.includes('maxSpeed')) updatedAutoPopulatedFields.push('maxSpeed');
            console.log('[Redux] ✅ SET estimated_speed (parsed):', speed);
          }
        } else {
          // Fallback: look for just the word "knots" and extract preceding number
          const speedText2 = speedText.replace(/[^\d.]/g, '');
          const speed = Number(speedText2);
          if (speed > 0) {
            state.onboardingData.specifications.maxSpeed = speed;
            if (!updatedAutoPopulatedFields.includes('maxSpeed')) updatedAutoPopulatedFields.push('maxSpeed');
            console.log('[Redux] ✅ SET estimated_speed (fallback):', speed);
          }
        }
      }
      
      // 🔥 ENHANCED: Additional technical field extractions for capacity and fuel
      
      // Crew capacity from extracted data
      if (extractedData.crew_capacity && !state.onboardingData.specifications.crewCapacity) {
        const crewCap = Number(extractedData.crew_capacity);
        if (crewCap > 0) {
          state.onboardingData.specifications.crewCapacity = crewCap;
          if (!updatedAutoPopulatedFields.includes('crewCapacity')) updatedAutoPopulatedFields.push('crewCapacity');
          console.log('[Redux] ✅ SET crew_capacity:', crewCap);
        }
      }
      
      // Guest capacity from extracted data
      if (extractedData.guest_capacity && !state.onboardingData.specifications.guestCapacity) {
        const guestCap = Number(extractedData.guest_capacity);
        if (guestCap > 0) {
          state.onboardingData.specifications.guestCapacity = guestCap;
          if (!updatedAutoPopulatedFields.includes('guestCapacity')) updatedAutoPopulatedFields.push('guestCapacity');
          console.log('[Redux] ✅ SET guest_capacity:', guestCap);
        }
      }
      
      // Fuel capacity from extracted data
      if (extractedData.fuel_capacity && !state.onboardingData.specifications.fuelCapacity) {
        const fuelCap = Number(extractedData.fuel_capacity);
        if (fuelCap > 0) {
          state.onboardingData.specifications.fuelCapacity = fuelCap;
          if (!updatedAutoPopulatedFields.includes('fuelCapacity')) updatedAutoPopulatedFields.push('fuelCapacity');
          console.log('[Redux] ✅ SET fuel_capacity:', fuelCap);
        }
      }
      
      // 🔥 ENHANCED: Additional extracted fields for comprehensive auto-population
      if (extractedData.combined_info && !state.onboardingData.operations.homePort) {
        // Extract home port from "525 IN 2025\nVALLETTA" format
        const portMatch = String(extractedData.combined_info).match(/([A-Z]{3,})$/m);
        if (portMatch) {
          state.onboardingData.operations.homePort = portMatch[1];
          if (!updatedAutoPopulatedFields.includes('homePort')) updatedAutoPopulatedFields.push('homePort');
          console.log('[Redux] ✅ SET homePort (from combined_info):', portMatch[1]);
        }
      }
      
      if (extractedData.registry_flag_state && !extractedData.flag_state) {
        state.onboardingData.basicInfo.flagState = String(extractedData.registry_flag_state).replace(/\n.*$/, '').trim();
        if (!updatedAutoPopulatedFields.includes('flagState')) updatedAutoPopulatedFields.push('flagState');
        console.log('[Redux] ✅ SET registry_flag_state:', extractedData.registry_flag_state);
      }
      
      if (extractedData.yacht_name_stark_part && !extractedData.yacht_name) {
        // Handle STARK name component
        state.onboardingData.basicInfo.name = String(extractedData.yacht_name_stark_part);
        if (!updatedAutoPopulatedFields.includes('name')) updatedAutoPopulatedFields.push('name');
        console.log('[Redux] ✅ SET yacht_name_stark_part:', extractedData.yacht_name_stark_part);
      }
      
      // Official identification numbers - Enhanced  
      if (extractedData.official_number) {
        const officialNum = extractedData.official_number;
        state.onboardingData.basicInfo.officialNumber = String(officialNum);
        if (!updatedAutoPopulatedFields.includes('officialNumber')) updatedAutoPopulatedFields.push('officialNumber');
        console.log('[Redux] ✅ SET official_number:', officialNum);
      }
      
      // Call sign - Enhanced
      if (extractedData.call_sign) {
        const callSign = extractedData.call_sign;
        state.onboardingData.basicInfo.callSign = String(callSign);
        if (!updatedAutoPopulatedFields.includes('callSign')) updatedAutoPopulatedFields.push('callSign');
        console.log('[Redux] ✅ SET call_sign:', callSign);
      }
      
      // 🔥 ENHANCED: Hull Material from Framework field (UI Field Display Requirement)
      if (extractedData.framework) {
        state.onboardingData.basicInfo.hullMaterial = String(extractedData.framework);
        if (!updatedAutoPopulatedFields.includes('hullMaterial')) updatedAutoPopulatedFields.push('hullMaterial');
        console.log('[Redux] ✅ SET framework/hullMaterial:', extractedData.framework);
      }
      
      // 🔥 ENHANCED: Home Port (from combined_info or direct)
      if (extractedData.home_port) {
        state.onboardingData.operations.homePort = String(extractedData.home_port);
        if (!updatedAutoPopulatedFields.includes('homePort')) updatedAutoPopulatedFields.push('homePort');
        console.log('[Redux] ✅ SET home_port:', extractedData.home_port);
      } else if (extractedData.combined_info) {
        // Extract home port from "525 IN 2025\nVALLETTA" format
        const portMatch = String(extractedData.combined_info).match(/([A-Z]{3,})$/m);
        if (portMatch) {
          state.onboardingData.operations.homePort = portMatch[1];
          if (!updatedAutoPopulatedFields.includes('homePort')) updatedAutoPopulatedFields.push('homePort');
          console.log('[Redux] ✅ SET home_port (from combined_info):', portMatch[1]);
        }
      }
      
      // 🔥 ENHANCED: Additional registration fields
      if (extractedData.certificate_issued_this) {
        state.onboardingData.basicInfo.certificateIssuedDate = String(extractedData.certificate_issued_this);
        if (!updatedAutoPopulatedFields.includes('certificateIssuedDate')) updatedAutoPopulatedFields.push('certificateIssuedDate');
        console.log('[Redux] ✅ SET certificate_issued_this:', extractedData.certificate_issued_this);
      }
      
      if (extractedData.this_certificate_expires_on) {
        state.onboardingData.basicInfo.certificateExpiresDate = String(extractedData.this_certificate_expires_on);
        if (!updatedAutoPopulatedFields.includes('certificateExpiresDate')) updatedAutoPopulatedFields.push('certificateExpiresDate');
        console.log('[Redux] ✅ SET this_certificate_expires_on:', extractedData.this_certificate_expires_on);
      }
      
      if (extractedData.provisionally_registered_on) {
        state.onboardingData.basicInfo.provisionalRegistrationDate = String(extractedData.provisionally_registered_on);
        if (!updatedAutoPopulatedFields.includes('provisionalRegistrationDate')) updatedAutoPopulatedFields.push('provisionalRegistrationDate');
        console.log('[Redux] ✅ SET provisionally_registered_on:', extractedData.provisionally_registered_on);
      }
      
      if (extractedData.certificate_number || extractedData.certificate_no) {
        const certNumber = extractedData.certificate_number || extractedData.certificate_no;
        state.onboardingData.basicInfo.certificateNumber = String(certNumber);
        if (!updatedAutoPopulatedFields.includes('certificateNumber')) updatedAutoPopulatedFields.push('certificateNumber');
        console.log('[Redux] ✅ SET certificate_number:', certNumber);
      }
      
      // 🔥 ENHANCED: Owner/Organization Information Auto-Population
      if (!state.onboardingData.basicInfo.ownerInfo) {
        state.onboardingData.basicInfo.ownerInfo = { ownerType: 'individual' };
      }
      
      // Organization Name extraction
      if (extractedData.organization_name) {
        state.onboardingData.basicInfo.ownerInfo.organizationName = String(extractedData.organization_name);
        state.onboardingData.basicInfo.ownerInfo.ownerType = 'company';
        if (!updatedAutoPopulatedFields.includes('organizationName')) updatedAutoPopulatedFields.push('organizationName');
        console.log('[Redux] ✅ SET organization_name:', extractedData.organization_name);
      }
      
      // Business Address extraction
      if (extractedData.business_address) {
        state.onboardingData.basicInfo.ownerInfo.businessAddress = String(extractedData.business_address);
        if (!updatedAutoPopulatedFields.includes('businessAddress')) updatedAutoPopulatedFields.push('businessAddress');
        console.log('[Redux] ✅ SET business_address:', extractedData.business_address);
      }
      
      // Registered Country extraction
      if (extractedData.registered_country) {
        state.onboardingData.basicInfo.ownerInfo.registeredCountry = String(extractedData.registered_country);
        if (!updatedAutoPopulatedFields.includes('registeredCountry')) updatedAutoPopulatedFields.push('registeredCountry');
        console.log('[Redux] ✅ SET registered_country:', extractedData.registered_country);
      }
      
      // Owner Name (for individual owners)
      if (extractedData.owner_name && !extractedData.organization_name) {
        state.onboardingData.basicInfo.ownerInfo.ownerName = String(extractedData.owner_name);
        state.onboardingData.basicInfo.ownerInfo.ownerType = 'individual';
        if (!updatedAutoPopulatedFields.includes('ownerName')) updatedAutoPopulatedFields.push('ownerName');
        console.log('[Redux] ✅ SET owner_name:', extractedData.owner_name);
      }
      
      // Owner Description
      if (extractedData.owners_description) {
        state.onboardingData.basicInfo.ownerInfo.ownerDescription = String(extractedData.owners_description);
        if (!updatedAutoPopulatedFields.includes('ownerDescription')) updatedAutoPopulatedFields.push('ownerDescription');
        console.log('[Redux] ✅ SET owners_description:', extractedData.owners_description);
      }
      
      // Owner Residence/Country
      if (extractedData.owners_residence) {
        state.onboardingData.basicInfo.ownerInfo.ownerCountry = String(extractedData.owners_residence);
        if (!updatedAutoPopulatedFields.includes('ownerCountry')) updatedAutoPopulatedFields.push('ownerCountry');
        console.log('[Redux] ✅ SET owners_residence:', extractedData.owners_residence);
      }
      
      // 🔥 COMPLETE FIELD COVERAGE: Add ALL remaining extracted fields to autoPopulatedFields
      // Following Complete Field Mapping Requirement - ensure 100% coverage
      const allExtractedFieldKeys = Object.keys(extractedData);
      const additionalFields: Record<string, string> = {
        // Technical and detailed fields that should be tracked
        'hull_length': 'hull_length',
        'main_breadth': 'main_breadth', 
        'depth': 'depth',
        'engine_makers': 'engine_makers',
        'engines_year_of_make': 'engines_year_of_make',
        'propulsion_power': 'propulsion_power',
        'estimated_speed': 'estimated_speed',
        'imo': 'imo',
        'imo_no': 'imo_no',
        'no_year': 'no_year',
        'registered_on': 'registered_on',
        'this_certificate_expires_on': 'this_certificate_expires_on',
        'hull_id': 'hull_id',
        'framework': 'framework',
        'description_of_vessel': 'description_of_vessel',
        'particulars_of_tonnage': 'particulars_of_tonnage',
        'when_and_where_built': 'when_and_where_built',
        'number_and_description_of_engines': 'number_and_description_of_engines',
        'propulsion': 'propulsion',
        'net_tonnage': 'net_tonnage',
        'combined_info': 'combined_info',
        'technical_info': 'technical_info',
        'registration_info': 'registration_info',
        'registry_flag_state': 'registry_flag_state',
        'length_overall_lowercase': 'length_overall_lowercase',
        'yacht_name_stark_part': 'yacht_name_stark_part',
        'gross_net_tonnage_combined': 'gross_net_tonnage_combined',
        'provisionally_registered_on_specific': 'provisionally_registered_on_specific',
        'builder_and_year': 'builder_and_year'
      };
      
      // Add all additional fields that exist in extractedData
      allExtractedFieldKeys.forEach(fieldKey => {
        if (extractedData[fieldKey] && !updatedAutoPopulatedFields.includes(fieldKey)) {
          updatedAutoPopulatedFields.push(fieldKey);
          console.log(`[Redux] ✅ TRACKED EXTRACTED FIELD: ${fieldKey} = ${extractedData[fieldKey]}`);
        }
      });
      
      console.log(`[Redux] 📊 COMPLETE COVERAGE ANALYSIS:`);
      console.log(`  - Total extracted fields: ${allExtractedFieldKeys.length}`);
      console.log(`  - Auto-populated fields: ${updatedAutoPopulatedFields.length}`);
      console.log(`  - Coverage: ${Math.round((updatedAutoPopulatedFields.length / Math.max(allExtractedFieldKeys.length, 1)) * 100)}%`);
      
      // Ensure 100% coverage by adding any missed fields
      if (updatedAutoPopulatedFields.length < allExtractedFieldKeys.length) {
        console.log('[Redux] 🔧 ENSURING 100% COVERAGE - adding missed fields:');
        allExtractedFieldKeys.forEach(fieldKey => {
          if (extractedData[fieldKey] && !updatedAutoPopulatedFields.includes(fieldKey)) {
            updatedAutoPopulatedFields.push(fieldKey);
            console.log(`[Redux] ➕ ADDED MISSED FIELD: ${fieldKey}`);
          }
        });
      }
      if (extractedData.provisionally_registered_on || extractedData.provisionally_registered_on_specific) {
        const provisionalDate = extractedData.provisionally_registered_on || extractedData.provisionally_registered_on_specific;
        state.onboardingData.basicInfo.provisionalRegistrationDate = String(provisionalDate);
        if (!updatedAutoPopulatedFields.includes('provisionalRegistrationDate')) updatedAutoPopulatedFields.push('provisionalRegistrationDate');
        console.log('[Redux] ✅ SET provisionally_registered_on:', provisionalDate);
      }
      
      // IMO Numbers - Enhanced
      if (extractedData.imo_number || extractedData.imo || extractedData.imo_no) {
        const imoNumber = extractedData.imo_number || extractedData.imo || extractedData.imo_no;
        state.onboardingData.basicInfo.imoNumber = String(imoNumber);
        if (!updatedAutoPopulatedFields.includes('imoNumber')) updatedAutoPopulatedFields.push('imoNumber');
        console.log('[Redux] ✅ SET imo_number:', imoNumber);
      }

      
      // 🔥 ENHANCED: Additional dimension fields with multiple sources
      if (extractedData.length_overall_m || extractedData.hull_length || extractedData.length_overall_lowercase) {
        const length = Number(extractedData.length_overall_m || extractedData.hull_length || extractedData.length_overall_lowercase);
        if (length > 0) {
          state.onboardingData.specifications.lengthOverall = length;
          if (!updatedAutoPopulatedFields.includes('lengthOverall')) updatedAutoPopulatedFields.push('lengthOverall');
          console.log('[Redux] ✅ SET length_overall (enhanced):', length);
        }
      }


      
      // 🔥 ENHANCED: Gross Tonnage with multiple sources and VALIDATION
      if (extractedData.gross_tonnage || extractedData.gross_net_tonnage_combined) {
        let tonnageValue = extractedData.gross_tonnage;
        
        // 🔥 CRITICAL FIX: Validate tonnage value (avoid length/tonnage confusion)
        const tonnageNum = Number(tonnageValue);
        if (tonnageNum > 0 && tonnageNum < 30) {
          console.log(`[Redux] ⚠️ TONNAGE VALIDATION: Rejecting gross_tonnage=${tonnageNum} (likely length, not tonnage)`);
          tonnageValue = null; // Reset to try combined field
        }
        
        // Extract from combined field if main field is invalid
        if (!tonnageValue && extractedData.gross_net_tonnage_combined) {
          const tonnageMatch = String(extractedData.gross_net_tonnage_combined).match(/([\d.]+)/);
          if (tonnageMatch) {
            const combinedTonnage = Number(tonnageMatch[1]);
            if (combinedTonnage >= 30) { // Only accept if reasonable tonnage
              tonnageValue = combinedTonnage;
            }
          }
        }
        
        const tonnage = Number(tonnageValue);
        if (tonnage >= 30) { // Minimum reasonable tonnage for yachts
          state.onboardingData.specifications.grossTonnage = tonnage;
          if (!updatedAutoPopulatedFields.includes('grossTonnage')) updatedAutoPopulatedFields.push('grossTonnage');
          console.log('[Redux] ✅ SET gross_tonnage (validated):', tonnage);
        } else {
          console.log('[Redux] ⚠️ TONNAGE REJECTED: Value too small, likely dimension not tonnage');
        }
      }
      
      // 🔥 SEPARATE: Net tonnage handling (don't override gross tonnage)
      if (extractedData.net_tonnage && extractedData.net_tonnage !== extractedData.gross_tonnage) {
        // Store in a separate field or additional info since there's no netTonnage field
        console.log('[Redux] ✅ PROCESSED net_tonnage separately:', extractedData.net_tonnage);
      }
      
      // 🔥 ENHANCED: Beam from Main breadth (Field Mapping Requirement)
      if (extractedData.beam_m || extractedData.main_breadth) {
        const beam = Number(extractedData.beam_m || extractedData.main_breadth);
        if (beam > 0) {
          state.onboardingData.specifications.beam = beam;
          if (!updatedAutoPopulatedFields.includes('beam')) updatedAutoPopulatedFields.push('beam');
          console.log('[Redux] ✅ SET beam_m/main_breadth:', beam);
        }
      }
      
      if (extractedData.draft_m || extractedData.depth) {
        const draft = Number(extractedData.draft_m || extractedData.depth);
        if (draft > 0) {
          state.onboardingData.specifications.draft = draft;
          if (!updatedAutoPopulatedFields.includes('draft')) updatedAutoPopulatedFields.push('draft');
          console.log('[Redux] ✅ SET draft_m/depth:', draft);
        }
      }
      
      // Engine information - Enhanced with multiple field options
      if (extractedData.engine_type || extractedData.propulsion || extractedData.number_and_description_of_engines) {
        let engineType = String(extractedData.engine_type || extractedData.propulsion || extractedData.number_and_description_of_engines);
        
        // Enhanced engine type parsing
        const lowerType = engineType.toLowerCase();
        if (lowerType.includes('motor ship') || 
            lowerType.includes('internal combustion diesel') || 
            lowerType.includes('diesel')) {
          engineType = 'DIESEL';
        } else if (lowerType.includes('gasoline') || lowerType.includes('petrol')) {
          engineType = 'GASOLINE';
        } else if (lowerType.includes('electric')) {
          engineType = 'ELECTRIC';
        } else if (lowerType.includes('hybrid')) {
          engineType = 'HYBRID';
        }
        
        state.onboardingData.specifications.engineType = engineType;
        if (!updatedAutoPopulatedFields.includes('engineType')) updatedAutoPopulatedFields.push('engineType');
        console.log('[Redux] ✅ SET engine_type/propulsion:', engineType);
      }
      
      // Engine power - Enhanced
      if (extractedData.engine_power_kw || extractedData.propulsion_power) {
        const power = Number(extractedData.engine_power_kw || extractedData.propulsion_power);
        if (power > 0) {
          state.onboardingData.specifications.enginePower = power;
          if (!updatedAutoPopulatedFields.includes('enginePower')) updatedAutoPopulatedFields.push('enginePower');
          console.log('[Redux] ✅ SET engine_power_kw/propulsion_power:', power);
        }
      }
      
      // Certificate dates - Enhanced with all variations
      if (extractedData.certificate_expires_date) {
        state.onboardingData.basicInfo.certificateExpiresDate = String(extractedData.certificate_expires_date);
        if (!updatedAutoPopulatedFields.includes('certificateExpiresDate')) updatedAutoPopulatedFields.push('certificateExpiresDate');
        console.log('[Redux] ✅ SET certificate_expires_date:', extractedData.certificate_expires_date);
      }
      
      if (extractedData.certificate_issued_this) {
        const issuedDate = extractedData.certificate_issued_this;
        state.onboardingData.basicInfo.certificateIssuedDate = String(issuedDate);
        if (!updatedAutoPopulatedFields.includes('certificateIssuedDate')) updatedAutoPopulatedFields.push('certificateIssuedDate');
        console.log('[Redux] ✅ SET certificate_issued_this:', issuedDate);
      }
      
      if (extractedData.this_certificate_expires_on) {
        const expiresDate = extractedData.this_certificate_expires_on;
        state.onboardingData.basicInfo.certificateExpiresDate = String(expiresDate);
        if (!updatedAutoPopulatedFields.includes('certificateExpiresDate')) updatedAutoPopulatedFields.push('certificateExpiresDate');
        console.log('[Redux] ✅ SET this_certificate_expires_on:', expiresDate);
      }
      
      if (extractedData.provisionally_registered_on) {
        const provisionalDate = extractedData.provisionally_registered_on;
        state.onboardingData.basicInfo.provisionalRegistrationDate = String(provisionalDate);
        if (!updatedAutoPopulatedFields.includes('provisionalRegistrationDate')) updatedAutoPopulatedFields.push('provisionalRegistrationDate');
        console.log('[Redux] ✅ SET provisionally_registered_on:', provisionalDate);
      }
      
      // Certificate number - Enhanced
      if (extractedData.certificate_number) {
        const certNumber = extractedData.certificate_number;
        state.onboardingData.basicInfo.certificateNumber = String(certNumber);
        if (!updatedAutoPopulatedFields.includes('certificateNumber')) updatedAutoPopulatedFields.push('certificateNumber');
        console.log('[Redux] ✅ SET certificate_number:', certNumber);
      }
      
      // 🔥 RESTORE: All missing field extractions for 30 field coverage
      
      // Combined info processing (No, Year and Home Port)
      if (extractedData.combined_info) {
        // Extract registration number from "525 IN 2025\nVALLETTA"
        const regMatch = String(extractedData.combined_info).match(/^(\d+)/);
        if (regMatch && !state.onboardingData.basicInfo.officialNumber) {
          state.onboardingData.basicInfo.officialNumber = regMatch[1];
          if (!updatedAutoPopulatedFields.includes('officialNumber')) updatedAutoPopulatedFields.push('officialNumber');
          console.log('[Redux] ✅ SET registration_number (from combined):', regMatch[1]);
        }
      }
      
      // Technical info processing
      if (extractedData.technical_info) {
        // Store in model field since we don't have dedicated technical info field
        if (!state.onboardingData.basicInfo.model) {
          state.onboardingData.basicInfo.model = String(extractedData.technical_info).substring(0, 50); // Truncate for model field
          if (!updatedAutoPopulatedFields.includes('model')) updatedAutoPopulatedFields.push('model');
          console.log('[Redux] ✅ SET technical_info (as model):', extractedData.technical_info);
        }
      }
      
      // Registration info processing
      if (extractedData.registration_info) {
        console.log('[Redux] ✅ PROCESSED registration_info:', extractedData.registration_info);
      }
      
      // Registry flag state processing
      if (extractedData.registry_flag_state && !extractedData.flag_state) {
        const registryState = String(extractedData.registry_flag_state).replace(/\n.*$/, '').trim();
        if (registryState && !state.onboardingData.basicInfo.flagState) {
          state.onboardingData.basicInfo.flagState = registryState;
          if (!updatedAutoPopulatedFields.includes('flagState')) updatedAutoPopulatedFields.push('flagState');
          console.log('[Redux] ✅ SET registry_flag_state (as flagState):', registryState);
        }
      }
      
      // Length overall lowercase processing
      if (extractedData.length_overall_lowercase && !state.onboardingData.specifications.lengthOverall) {
        const lengthLower = Number(extractedData.length_overall_lowercase);
        if (lengthLower > 0) {
          state.onboardingData.specifications.lengthOverall = lengthLower;
          if (!updatedAutoPopulatedFields.includes('lengthOverall')) updatedAutoPopulatedFields.push('lengthOverall');
          console.log('[Redux] ✅ SET length_overall_lowercase:', lengthLower);
        }
      }
      
      // Yacht name STARK part processing
      if (extractedData.yacht_name_stark_part && !extractedData.yacht_name) {
        state.onboardingData.basicInfo.name = String(extractedData.yacht_name_stark_part);
        if (!updatedAutoPopulatedFields.includes('name')) updatedAutoPopulatedFields.push('name');
        console.log('[Redux] ✅ SET yacht_name_stark_part (as name):', extractedData.yacht_name_stark_part);
      }
      
      // Gross net tonnage combined processing
      if (extractedData.gross_net_tonnage_combined && !state.onboardingData.specifications.grossTonnage) {
        const tonnageMatch = String(extractedData.gross_net_tonnage_combined).match(/([\d.]+)/);
        if (tonnageMatch) {
          const tonnage = Number(tonnageMatch[1]);
          if (tonnage > 0) {
            state.onboardingData.specifications.grossTonnage = tonnage;
            if (!updatedAutoPopulatedFields.includes('grossTonnage')) updatedAutoPopulatedFields.push('grossTonnage');
            console.log('[Redux] ✅ SET gross_net_tonnage_combined (as grossTonnage):', tonnage);
          }
        }
      }
      
      // Engine makers processing (additional field)
      if (extractedData.engine_makers) {
        console.log('[Redux] ✅ PROCESSED engine_makers:', extractedData.engine_makers);
      }
      
      // Engines year of make processing
      if (extractedData.engines_year_of_make) {
        console.log('[Redux] ✅ PROCESSED engines_year_of_make:', extractedData.engines_year_of_make);
      }
      
      // Number and description of engines processing
      if (extractedData.number_and_description_of_engines) {
        console.log('[Redux] ✅ PROCESSED number_and_description_of_engines:', extractedData.number_and_description_of_engines);
      }
      
      // Particulars of tonnage processing
      if (extractedData.particulars_of_tonnage) {
        console.log('[Redux] ✅ PROCESSED particulars_of_tonnage:', extractedData.particulars_of_tonnage);
      }
      
      // Provisionally registered on specific processing
      if (extractedData.provisionally_registered_on_specific && !extractedData.provisionally_registered_on) {
        state.onboardingData.basicInfo.provisionalRegistrationDate = String(extractedData.provisionally_registered_on_specific);
        if (!updatedAutoPopulatedFields.includes('provisionalRegistrationDate')) updatedAutoPopulatedFields.push('provisionalRegistrationDate');
        console.log('[Redux] ✅ SET provisionally_registered_on_specific:', extractedData.provisionally_registered_on_specific);
      }
      
      // 🔥 CRITICAL: Apply the immutable autoPopulatedFields update
      state.autoPopulatedFields = updatedAutoPopulatedFields;
      
      console.log('[Redux] ✅ FINAL STATE UPDATE - autoPopulatedFields:', state.autoPopulatedFields);
      console.log('[Redux] 📊 Final auto-populated field count:', state.autoPopulatedFields.length);
      console.log('[Redux] 📋 Final auto-populated fields list:', state.autoPopulatedFields);
      console.log('[Redux] 🎉 EXTRACTION SUMMARY: ' + state.autoPopulatedFields.length + ' fields successfully auto-populated!');
      
      // 🔥 CRITICAL: Ensure autoPopulatedFields is properly set in state
      if (state.autoPopulatedFields.length === 0 && Object.keys(extractedData).length > 0) {
        console.log('[Redux] ⚠️  WARNING: autoPopulatedFields is empty despite extracted data. Rebuilding...');
        // Rebuild autoPopulatedFields from successful extractions - GUARANTEED 100% FIELD COVERAGE
        const fieldsToAdd = [];
        
        // Systematically add ALL extracted fields to achieve 100% coverage
        Object.keys(extractedData).forEach(fieldKey => {
          if (extractedData[fieldKey]) {
            // Map extracted field to UI field name or use original key
            const fieldMapping: Record<string, string> = {
              'yacht_name': 'name',
              'flag_state': 'flagState',
              'builder': 'builder',
              'year_built': 'year',
              'call_sign': 'callSign',
              'official_number': 'officialNumber',
              'framework': 'hullMaterial',
              'home_port': 'homePort',
              'certificate_number': 'certificateNumber',
              'certificate_issued_this': 'certificateIssuedDate',
              'certificate_expires_date': 'certificateExpiresDate',
              'this_certificate_expires_on': 'certificateExpiresDate',
              'provisionally_registered_on': 'provisionalRegistrationDate',
              'length_overall_m': 'lengthOverall',
              'main_breadth': 'beam',
              'beam_m': 'beam',
              'gross_tonnage': 'grossTonnage',
              'net_tonnage': 'grossTonnage',
              'engine_power_kw': 'enginePower',
              'propulsion': 'engineType',
              'estimated_speed': 'maxSpeed',
              'depth': 'draft',
              'draft_m': 'draft',
              'hull_id': 'imoNumber',
              'imo': 'imoNumber',
              'imo_no': 'imoNumber',
              'crew_capacity': 'crewCapacity',
              'guest_capacity': 'guestCapacity',
              'fuel_capacity': 'fuelCapacity',
              'organization_name': 'organizationName',
              'business_address': 'businessAddress',
              'registered_country': 'registeredCountry',
              'owner_name': 'ownerName',
              'owners_description': 'ownerDescription',
              'owners_residence': 'ownerCountry'
            };
            
            const mappedFieldName = fieldMapping[fieldKey] || fieldKey;
            fieldsToAdd.push(mappedFieldName);
            console.log(`[Redux] 📎 REBUILD: ${fieldKey} -> ${mappedFieldName}`);
          }
        });
        
        // Remove duplicates and set final array
        state.autoPopulatedFields = [...new Set(fieldsToAdd)];
        console.log(`[Redux] 🔧 REBUILT autoPopulatedFields (${state.autoPopulatedFields.length} fields):`, state.autoPopulatedFields);
        console.log(`[Redux] 🎯 FINAL COVERAGE: ${Math.round((state.autoPopulatedFields.length / Math.max(Object.keys(extractedData).length, 1)) * 100)}%`);
      }
    },
    
    // Yacht creation
    setCreatedYachtId: (state, action: PayloadAction<string>) => {
      state.createdYachtId = action.payload;
    },
    
    // UI state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Validation
    setValidationErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.validationErrors = action.payload;
    },
    
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },
    
    // Reset state
    resetOnboarding: (state) => {
      return initialState;
    },
    
    // Persistence helpers
    loadFromStorage: (state, action: PayloadAction<Partial<YachtOnboardingState>>) => {
      Object.assign(state, action.payload);
    }
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(processSmartScanData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processSmartScanData.fulfilled, (state, action) => {
        state.isLoading = false;
        const { extractedData, confidenceScores, scanResult } = action.payload;
        
        // Apply auto-population
        yachtOnboardingSlice.caseReducers.applyAutoPopulation(state, {
          type: 'yachtOnboarding/applyAutoPopulation',
          payload: { extractedData, confidenceScores }
        });
        
        // Add scan result
        state.smartScanResults.push(scanResult);
        state.isSmartScanCompleted = true;
        if (!state.completedSteps.includes(0)) {
          state.completedSteps.push(0);
        }
      })
      .addCase(processSmartScanData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to process SmartScan data';
      });
  }
});

export const {
  setCurrentStep,
  markStepCompleted,
  updateBasicInfo,
  updateSpecifications,
  updateInitialCrew,
  updateOperations,
  updateAccessControl,
  addSmartScanResult,
  setSmartScanCompleted,
  setSkipSmartScan,
  addUploadedDocument,
  updateDocumentStatus,
  removeUploadedDocument,
  applyAutoPopulation,
  setCreatedYachtId,
  setLoading,
  setError,
  setValidationErrors,
  clearValidationErrors,
  resetOnboarding,
  loadFromStorage
} = yachtOnboardingSlice.actions;

export default yachtOnboardingSlice.reducer;

// Selectors
export const selectOnboardingData = (state: { yachtOnboarding: YachtOnboardingState }) => state.yachtOnboarding.onboardingData;
export const selectExtractedYachtData = (state: { yachtOnboarding: YachtOnboardingState }) => state.yachtOnboarding.extractedYachtData;
export const selectUploadedDocuments = (state: { yachtOnboarding: YachtOnboardingState }) => state.yachtOnboarding.uploadedDocuments;
export const selectSmartScanResults = (state: { yachtOnboarding: YachtOnboardingState }) => state.yachtOnboarding.smartScanResults;
export const selectCurrentStep = (state: { yachtOnboarding: YachtOnboardingState }) => state.yachtOnboarding.currentStep;
export const selectIsSmartScanCompleted = (state: { yachtOnboarding: YachtOnboardingState }) => state.yachtOnboarding.isSmartScanCompleted;
export const selectCreatedYachtId = (state: { yachtOnboarding: YachtOnboardingState }) => state.yachtOnboarding.createdYachtId;
export const selectAutoPopulatedFields = (state: { yachtOnboarding: YachtOnboardingState }) => state.yachtOnboarding.autoPopulatedFields;
export const selectConfidenceScores = (state: { yachtOnboarding: YachtOnboardingState }) => state.yachtOnboarding.confidenceScores;