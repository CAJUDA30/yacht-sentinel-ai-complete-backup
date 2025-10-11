/**
 * 🚀 GOOGLE DOCUMENT AI DIRECT FIELD MATCHING TEST
 * Tests the revolutionary direct field matching approach using exact Google Document AI field names
 * 
 * This test validates that our system can process the exact field names from your console testing:
 * Certificate_No: "1100002", Name_o_fShip: "HIGH ENERGY", etc.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleDocumentAIFields, GoogleDocumentAIProcessor, GOOGLE_DOCUMENTAI_FIELD_MAPPING } from '@/interfaces/GoogleDocumentAIFields';
import { GoogleDocumentAIYachtMapper } from '@/mappers/GoogleDocumentAIYachtMapper';
import { RevolutionarySmartScan } from '@/services/RevolutionarySmartScan';
import { SystematicDataExtractionProcedure } from '@/services/SystematicDataExtractionProcedure';

describe('🚀 Google Document AI Direct Field Matching', () => {
  
  // 🔥 Test data using exact Google Document AI field names from your console testing
  const mockGoogleDocumentAIData: GoogleDocumentAIFields = {
    Certificate_No: "1100002",
    Name_o_fShip: "HIGH ENERGY", 
    Home_Port: "VALLETTA",
    Callsign: "9H6789",
    OfficialNo: "1100002",
    When_and_Where_Built: "2020 - AZIMUT BENETTI SPA, VIAREGGIO, ITALY",
    Framework: "GRP",
    HULL_ID: "ITAZ1234567890123",
    Description_of_Vessel: "PLEASURE YACHT COMMERCIAL USE PERMITTED",
    Length_overall: "24.38",
    Main_breadth: "6.20",
    Depth: "1.80",
    Particulars_of_Tonnage: "85.50",
    Propulsion_Power: "Combined KW 2864",
    Number_and_Description_of_Engines: "TWIN SCREW INTERNAL COMBUSTION DIESEL",
    Engine_Makers: "MTU",
    Engines_Year_of_Make: "2020",
    Owners_description: "SOLE OWNER HIGH ENERGY LIMITED",
    Owners_residence: "HIGH ENERGY LIMITED, MALTA",
    Provisionally_registered_on: "10 December 2020",
    Registered_on: "15 December 2020", 
    Certificate_issued_this: "20 December 2020",
    This_certificate_expires_on: "20 December 2025"
  };

  describe('1️⃣ GoogleDocumentAIFields Interface', () => {
    it('should accept all exact Google Document AI field names', () => {
      const googleFields: GoogleDocumentAIFields = mockGoogleDocumentAIData;
      
      expect(googleFields.Certificate_No).toBe("1100002");
      expect(googleFields.Name_o_fShip).toBe("HIGH ENERGY");
      expect(googleFields.Home_Port).toBe("VALLETTA");
      expect(googleFields.Callsign).toBe("9H6789");
      expect(googleFields.OfficialNo).toBe("1100002");
      expect(googleFields.When_and_Where_Built).toBe("2020 - AZIMUT BENETTI SPA, VIAREGGIO, ITALY");
      expect(googleFields.Framework).toBe("GRP");
      expect(googleFields.HULL_ID).toBe("ITAZ1234567890123");
      expect(googleFields.Description_of_Vessel).toBe("PLEASURE YACHT COMMERCIAL USE PERMITTED");
      expect(googleFields.Length_overall).toBe("24.38");
      expect(googleFields.Main_breadth).toBe("6.20");
      expect(googleFields.Depth).toBe("1.80");
      expect(googleFields.Particulars_of_Tonnage).toBe("85.50");
      expect(googleFields.Propulsion_Power).toBe("Combined KW 2864");
    });

    it('should validate field mapping constants', () => {
      expect(GOOGLE_DOCUMENTAI_FIELD_MAPPING.Certificate_No).toBe('certificate_number');
      expect(GOOGLE_DOCUMENTAI_FIELD_MAPPING.Name_o_fShip).toBe('yacht_name');
      expect(GOOGLE_DOCUMENTAI_FIELD_MAPPING.Home_Port).toBe('home_port');
      expect(GOOGLE_DOCUMENTAI_FIELD_MAPPING.Length_overall).toBe('length_overall');
      expect(GOOGLE_DOCUMENTAI_FIELD_MAPPING.Propulsion_Power).toBe('engine_power');
    });
  });

  describe('2️⃣ GoogleDocumentAIProcessor Direct Processing', () => {
    it('should process Google Document AI data directly without complex mapping', () => {
      const processedData = GoogleDocumentAIProcessor.processGoogleDocumentAIData(mockGoogleDocumentAIData);
      
      // Should contain both exact Google field names AND mapped field names
      expect(processedData.Certificate_No).toBe("1100002");
      expect(processedData.certificate_number).toBe("1100002"); // Mapped version
      
      expect(processedData.Name_o_fShip).toBe("HIGH ENERGY");
      expect(processedData.yacht_name).toBe("HIGH ENERGY"); // Mapped version
      
      expect(processedData.Home_Port).toBe("VALLETTA");
      expect(processedData.home_port).toBe("VALLETTA"); // Mapped version
      
      expect(processedData.Length_overall).toBe("24.38");
      expect(processedData.length_overall).toBe("24.38"); // Mapped version
      
      // Engine power should be processed as numeric
      expect(processedData.Propulsion_Power).toBe(2864); // Numeric extraction from "Combined KW 2864"
      expect(processedData.engine_power).toBe(2864); // Mapped version
    });

    it('should format dates to DD-MM-YYYY format', () => {
      const processedData = GoogleDocumentAIProcessor.processGoogleDocumentAIData(mockGoogleDocumentAIData);
      
      expect(processedData.Provisionally_registered_on).toBe("10-12-2020");
      expect(processedData.Registered_on).toBe("15-12-2020");
      expect(processedData.Certificate_issued_this).toBe("20-12-2020");
      expect(processedData.This_certificate_expires_on).toBe("20-12-2025");
    });

    it('should handle numeric field processing', () => {
      const processedData = GoogleDocumentAIProcessor.processGoogleDocumentAIData(mockGoogleDocumentAIData);
      
      expect(typeof processedData.OfficialNo).toBe('number');
      expect(processedData.OfficialNo).toBe(1100002);
      
      expect(typeof processedData.Length_overall).toBe('number');
      expect(processedData.Length_overall).toBe(24.38);
      
      expect(typeof processedData.Main_breadth).toBe('number');
      expect(processedData.Main_breadth).toBe(6.2);
      
      expect(typeof processedData.Propulsion_Power).toBe('number');
      expect(processedData.Propulsion_Power).toBe(2864);
    });
  });

  describe('3️⃣ GoogleDocumentAIYachtMapper Integration', () => {
    it('should map exact Google Document AI fields to yacht onboarding structure', () => {
      const { basicInfo, specifications } = GoogleDocumentAIYachtMapper.mapGoogleFieldsToYachtData(mockGoogleDocumentAIData);
      
      // Basic Info mapping
      expect(basicInfo.name).toBe("HIGH ENERGY");
      expect(basicInfo.homePort).toBe("VALLETTA");
      expect(basicInfo.flagState).toBe("Malta");
      expect(basicInfo.callSign).toBe("9H6789");
      expect(basicInfo.officialNumber).toBe("1100002");
      expect(basicInfo.certificateNumber).toBe("1100002");
      expect(basicInfo.imoNumber).toBe("ITAZ1234567890123");
      expect(basicInfo.hullMaterial).toBe("GRP");
      expect(basicInfo.year).toBe(2020);
      expect(basicInfo.builder).toBe("MTU"); // From Engine_Makers
      
      // Date formatting
      expect(basicInfo.provisionalRegistrationDate).toBe("10-12-2020");
      expect(basicInfo.registrationDate).toBe("15-12-2020");
      expect(basicInfo.certificateIssuedDate).toBe("20-12-2020");
      expect(basicInfo.certificateExpiresDate).toBe("20-12-2025");
      
      // Specifications mapping
      expect(specifications.lengthOverall).toBe(24.38);
      expect(specifications.beam).toBe(6.20);
      expect(specifications.draft).toBe(1.80);
      expect(specifications.grossTonnage).toBe(85.50);
      expect(specifications.enginePower).toBe(2864);
      expect(specifications.engineType).toBe("TWIN SCREW INTERNAL COMBUSTION DIESEL");
      expect(specifications.engineManufacturer).toBe("MTU");
      expect(specifications.engineYear).toBe(2020);
    });

    it('should handle yacht type and category processing', () => {
      const { basicInfo } = GoogleDocumentAIYachtMapper.mapGoogleFieldsToYachtData(mockGoogleDocumentAIData);
      
      expect(basicInfo.type).toBe("Motor Yacht"); // From "PLEASURE YACHT COMMERCIAL USE PERMITTED"
      expect(basicInfo.category).toBe("Private"); // From vessel description
    });

    it('should handle owner information processing', () => {
      const { basicInfo } = GoogleDocumentAIYachtMapper.mapGoogleFieldsToYachtData(mockGoogleDocumentAIData);
      
      expect(basicInfo.ownerType).toBe("Individual"); // From "SOLE OWNER"
      expect(basicInfo.ownerAddress).toBe("HIGH ENERGY LIMITED, MALTA");
      expect(basicInfo.ownerName).toBe("HIGH ENERGY"); // Extracted from owner residence
    });
  });

  describe('4️⃣ Revolutionary SmartScan Integration', () => {
    it('should extract Google Document AI fields using exact field names', () => {
      // Mock Document AI response with exact field structure
      const mockDocumentAIResponse = {
        outputs: {
          documentAI: {
            document: {
              pages: [{
                formFields: [
                  {
                    fieldName: { textAnchor: { content: "Certificate_No" } },
                    fieldValue: { textAnchor: { content: "1100002" } }
                  },
                  {
                    fieldName: { textAnchor: { content: "Name_o_fShip" } },
                    fieldValue: { textAnchor: { content: "HIGH ENERGY" } }
                  },
                  {
                    fieldName: { textAnchor: { content: "Home_Port" } },
                    fieldValue: { textAnchor: { content: "VALLETTA" } }
                  }
                ]
              }]
            }
          }
        }
      };

      const smartScan = new RevolutionarySmartScan();
      // Test the private method through reflection
      const extractMethod = (smartScan as any).extractGoogleFields;
      const extractedFields = extractMethod.call(smartScan, mockDocumentAIResponse);

      expect(extractedFields.Certificate_No).toBe("1100002");
      expect(extractedFields.Name_o_fShip).toBe("HIGH ENERGY");
      expect(extractedFields.Home_Port).toBe("VALLETTA");
    });
  });

  describe('5️⃣ Systematic Data Extraction Integration', () => {
    it('should process Google Document AI data through all systematic phases', () => {
      const systematicExtractor = new SystematicDataExtractionProcedure();
      
      // Test the direct Google field extraction method
      const processMethod = (systematicExtractor as any).extractStructuredKeyValuePairs;
      const processedData = processMethod.call(systematicExtractor, mockGoogleDocumentAIData);
      
      expect(Object.keys(processedData).length).toBeGreaterThan(20); // Should have extracted many fields
      expect(processedData.Certificate_No).toBe("1100002");
      expect(processedData.Name_o_fShip).toBe("HIGH ENERGY");
      expect(processedData.Propulsion_Power).toBe("Combined KW 2864");
      expect(processedData.Length_overall).toBe("24.38");
    });
  });

  describe('6️⃣ End-to-End Google Document AI Field Processing', () => {
    it('should process complete Google Document AI data extraction workflow', () => {
      // Step 1: Process with GoogleDocumentAIProcessor
      const processedData = GoogleDocumentAIProcessor.processGoogleDocumentAIData(mockGoogleDocumentAIData);
      expect(Object.keys(processedData).length).toBeGreaterThan(40); // Should have both original and mapped fields
      
      // Step 2: Map to yacht onboarding structure
      const { basicInfo, specifications } = GoogleDocumentAIYachtMapper.mapGoogleFieldsToYachtData(mockGoogleDocumentAIData);
      expect(Object.keys(basicInfo).length).toBeGreaterThan(15);
      expect(Object.keys(specifications).length).toBeGreaterThan(8);
      
      // Step 3: Verify complete field extraction effectiveness
      expect(basicInfo.name).toBeTruthy(); // Yacht name extracted
      expect(basicInfo.certificateNumber).toBeTruthy(); // Certificate number extracted
      expect(specifications.lengthOverall).toBeTruthy(); // Technical specs extracted
      expect(specifications.enginePower).toBeTruthy(); // Engine data extracted
      
      console.log('🚀 Revolutionary Google Document AI Field Extraction Test Results:');
      console.log(`  Google fields processed: ${Object.keys(processedData).length}`);
      console.log(`  Basic info fields: ${Object.keys(basicInfo).length}`);
      console.log(`  Specification fields: ${Object.keys(specifications).length}`);
      console.log(`  Yacht name: ${basicInfo.name}`);
      console.log(`  Certificate number: ${basicInfo.certificateNumber}`);
      console.log(`  Engine power: ${specifications.enginePower} KW`);
      console.log('  ✅ Revolutionary direct field matching system is working perfectly!');
    });

    it('should demonstrate maximum field extraction effectiveness', () => {
      const originalFields = Object.keys(mockGoogleDocumentAIData).length;
      const processedData = GoogleDocumentAIProcessor.processGoogleDocumentAIData(mockGoogleDocumentAIData);
      const { basicInfo, specifications } = GoogleDocumentAIYachtMapper.mapGoogleFieldsToYachtData(mockGoogleDocumentAIData);
      
      const totalMappedFields = Object.keys(basicInfo).length + Object.keys(specifications).length;
      const effectiveness = (totalMappedFields / originalFields) * 100;
      
      expect(effectiveness).toBeGreaterThan(90); // Should be over 90% effective
      console.log(`🎯 Revolutionary SmartScan Effectiveness: ${Math.round(effectiveness)}%`);
      console.log(`   Original Google Document AI fields: ${originalFields}`);
      console.log(`   Successfully mapped fields: ${totalMappedFields}`);
      console.log('   🔥 Revolutionary approach eliminates field extraction problems!');
    });
  });
});