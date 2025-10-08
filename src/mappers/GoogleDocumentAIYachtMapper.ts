/**
 * 🚀 GOOGLE DOCUMENT AI YACHT DATA MAPPER
 * Maps exact Google Document AI field names to yacht onboarding data structure
 * Revolutionary approach: Direct field name matching for maximum accuracy
 */

import { GoogleDocumentAIFields } from '@/interfaces/GoogleDocumentAIFields';

export interface YachtOnboardingBasicInfo {
  name?: string;
  type?: string;
  category?: string;
  flagState?: string;
  year?: number;
  builder?: string;
  model?: string;
  callSign?: string;
  officialNumber?: string;
  certificateNumber?: string;
  imoNumber?: string;
  homePort?: string;
  hullMaterial?: string;
  // Date fields
  certificateIssuedDate?: string;
  certificateExpiresDate?: string;
  provisionalRegistrationDate?: string;
  registrationDate?: string;
  // Owner info
  ownerType?: string;
  ownerAddress?: string;
  ownerName?: string;
  [key: string]: any;
}

export interface YachtOnboardingSpecifications {
  lengthOverall?: number;
  beam?: number;  
  draft?: number;
  grossTonnage?: number;
  enginePower?: number;
  engineType?: string;
  engineManufacturer?: string;
  engineYear?: number;
  maxSpeed?: number;
  fuelCapacity?: number;
  crewCapacity?: number;
  guestCapacity?: number;
  [key: string]: any;
}

/**
 * 🎯 GOOGLE DOCUMENT AI TO YACHT ONBOARDING MAPPER
 * Direct mapping using exact Google Document AI field names
 */
export class GoogleDocumentAIYachtMapper {
  
  /**
   * 🚀 MAP GOOGLE DOCUMENT AI FIELDS TO YACHT ONBOARDING DATA
   * Uses exact field names for maximum accuracy and simplicity
   */
  static mapGoogleFieldsToYachtData(googleFields: GoogleDocumentAIFields): {
    basicInfo: YachtOnboardingBasicInfo;
    specifications: YachtOnboardingSpecifications;
  } {
    console.group('🚀 [GOOGLE-MAPPER] Mapping Google Document AI fields to yacht onboarding data');
    
    const basicInfo: YachtOnboardingBasicInfo = {};
    const specifications: YachtOnboardingSpecifications = {};
    
    try {
      // 🎯 DIRECT FIELD MAPPING - BASIC INFO
      if (googleFields.Name_o_fShip) {
        basicInfo.name = googleFields.Name_o_fShip;
        console.log(`✅ Mapped yacht name: ${googleFields.Name_o_fShip}`);
      }
      
      if (googleFields.Description_of_Vessel) {
        basicInfo.type = this.processYachtType(googleFields.Description_of_Vessel);
        basicInfo.category = this.processYachtCategory(googleFields.Description_of_Vessel);
        console.log(`✅ Mapped yacht type/category: ${basicInfo.type}/${basicInfo.category}`);
      }
      
      if (googleFields.Home_Port) {
        basicInfo.homePort = googleFields.Home_Port;
        basicInfo.flagState = this.processFlagState(googleFields.Home_Port);
        console.log(`✅ Mapped home port/flag state: ${basicInfo.homePort}/${basicInfo.flagState}`);
      }
      
      if (googleFields.When_and_Where_Built) {
        const buildInfo = this.processBuildInfo(googleFields.When_and_Where_Built);
        if (buildInfo.year) basicInfo.year = buildInfo.year;
        if (buildInfo.builder) basicInfo.builder = buildInfo.builder;
        console.log(`✅ Mapped build info: year=${buildInfo.year}, builder=${buildInfo.builder}`);
      }
      
      if (googleFields.Engine_Makers) {
        basicInfo.builder = basicInfo.builder || googleFields.Engine_Makers;
        console.log(`✅ Mapped engine maker as builder: ${googleFields.Engine_Makers}`);
      }
      
      if (googleFields.Engines_Year_of_Make) {
        const engineYear = this.extractYear(googleFields.Engines_Year_of_Make);
        if (engineYear) basicInfo.year = basicInfo.year || engineYear;
        console.log(`✅ Mapped engine year: ${engineYear}`);
      }
      
      if (googleFields.Callsign) {
        basicInfo.callSign = googleFields.Callsign;
        console.log(`✅ Mapped call sign: ${googleFields.Callsign}`);
      }
      
      if (googleFields.OfficialNo) {
        basicInfo.officialNumber = googleFields.OfficialNo;
        console.log(`✅ Mapped official number: ${googleFields.OfficialNo}`);
      }
      
      if (googleFields.Certificate_No) {
        basicInfo.certificateNumber = googleFields.Certificate_No;
        console.log(`✅ Mapped certificate number: ${googleFields.Certificate_No}`);
      }
      
      if (googleFields.HULL_ID) {
        basicInfo.imoNumber = googleFields.HULL_ID;
        console.log(`✅ Mapped hull ID as IMO: ${googleFields.HULL_ID}`);
      }
      
      if (googleFields.Framework) {
        basicInfo.hullMaterial = googleFields.Framework;
        console.log(`✅ Mapped hull material: ${googleFields.Framework}`);
      }
      
      // Owner information
      if (googleFields.Owners_description) {
        basicInfo.ownerType = this.processOwnerType(googleFields.Owners_description);
        console.log(`✅ Mapped owner type: ${basicInfo.ownerType}`);
      }
      
      if (googleFields.Owners_residence) {
        basicInfo.ownerAddress = googleFields.Owners_residence;
        basicInfo.ownerName = this.extractOwnerName(googleFields.Owners_residence);
        console.log(`✅ Mapped owner info: address=${basicInfo.ownerAddress}, name=${basicInfo.ownerName}`);
      }
      
      // Date mappings with DD-MM-YYYY formatting
      if (googleFields.Certificate_issued_this) {
        basicInfo.certificateIssuedDate = this.formatDateToDDMMYYYY(googleFields.Certificate_issued_this);
        console.log(`✅ Mapped certificate issued date: ${basicInfo.certificateIssuedDate}`);
      }
      
      if (googleFields.This_certificate_expires_on) {
        basicInfo.certificateExpiresDate = this.formatDateToDDMMYYYY(googleFields.This_certificate_expires_on);
        console.log(`✅ Mapped certificate expires date: ${basicInfo.certificateExpiresDate}`);
      }
      
      if (googleFields.Provisionally_registered_on) {
        basicInfo.provisionalRegistrationDate = this.formatDateToDDMMYYYY(googleFields.Provisionally_registered_on);
        console.log(`✅ Mapped provisional registration date: ${basicInfo.provisionalRegistrationDate}`);
      }
      
      if (googleFields.Registered_on) {
        basicInfo.registrationDate = this.formatDateToDDMMYYYY(googleFields.Registered_on);
        console.log(`✅ Mapped registration date: ${basicInfo.registrationDate}`);
      }
      
      // 🎯 DIRECT FIELD MAPPING - SPECIFICATIONS
      if (googleFields.Length_overall) {
        specifications.lengthOverall = this.extractNumericValue(googleFields.Length_overall);
        console.log(`✅ Mapped length overall: ${specifications.lengthOverall}`);
      }
      
      if (googleFields.Main_breadth) {
        specifications.beam = this.extractNumericValue(googleFields.Main_breadth);
        console.log(`✅ Mapped beam: ${specifications.beam}`);
      }
      
      if (googleFields.Depth) {
        specifications.draft = this.extractNumericValue(googleFields.Depth);
        console.log(`✅ Mapped draft: ${specifications.draft}`);
      }
      
      if (googleFields.Particulars_of_Tonnage) {
        specifications.grossTonnage = this.extractNumericValue(googleFields.Particulars_of_Tonnage);
        console.log(`✅ Mapped gross tonnage: ${specifications.grossTonnage}`);
      }
      
      if (googleFields.Propulsion_Power) {
        specifications.enginePower = this.extractEngineKW(googleFields.Propulsion_Power);
        console.log(`✅ Mapped engine power: ${specifications.enginePower}`);
      }
      
      if (googleFields.Number_and_Description_of_Engines) {
        specifications.engineType = googleFields.Number_and_Description_of_Engines;
        console.log(`✅ Mapped engine type: ${specifications.engineType}`);
      }
      
      if (googleFields.Engine_Makers) {
        specifications.engineManufacturer = googleFields.Engine_Makers;
        console.log(`✅ Mapped engine manufacturer: ${specifications.engineManufacturer}`);
      }
      
      if (googleFields.Engines_Year_of_Make) {
        specifications.engineYear = this.extractYear(googleFields.Engines_Year_of_Make);
        console.log(`✅ Mapped engine year: ${specifications.engineYear}`);
      }
      
      console.log('🎯 Google Document AI Mapping Summary:');
      console.log(`  Basic info fields mapped: ${Object.keys(basicInfo).length}`);
      console.log(`  Specifications fields mapped: ${Object.keys(specifications).length}`);
      
      return { basicInfo, specifications };
      
    } catch (error) {
      console.error('❌ Error in Google Document AI field mapping:', error);
      return { basicInfo, specifications };
    } finally {
      console.groupEnd();
    }
  }
  
  // 🔧 UTILITY METHODS
  
  private static processYachtType(description: string): string {
    const desc = description.toUpperCase();
    if (desc.includes('COMMERCIAL')) return 'Commercial Vessel';
    if (desc.includes('PLEASURE') || desc.includes('PRIVATE')) return 'Motor Yacht';
    if (desc.includes('SAILING')) return 'Sailing Yacht';
    return 'Motor Yacht';
  }
  
  private static processYachtCategory(description: string): string {
    const desc = description.toUpperCase();
    if (desc.includes('COMMERCIAL')) return 'Commercial';
    if (desc.includes('CHARTER')) return 'Charter';
    return 'Private';
  }
  
  private static processFlagState(homePort: string): string {
    const flagMappings: Record<string, string> = {
      'VALLETTA': 'Malta',
      'MONACO': 'Monaco',
      'GIBRALTAR': 'Gibraltar',
      'LONDON': 'United Kingdom',
      'FORT LAUDERDALE': 'United States',
      'MIAMI': 'United States'
    };
    
    return flagMappings[homePort.toUpperCase()] || homePort;
  }
  
  private static processBuildInfo(buildInfo: string): { year?: number; builder?: string } {
    const yearMatch = buildInfo.match(/(20\d{2}|19\d{2})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
    
    // Extract builder name (usually the company name before location)
    const builderMatch = buildInfo.match(/^(\d{4}\s+)?([A-Z\s&]+?)(?:,|\s+LIMITED|\s+LTD|\s+INC)/i);
    const builder = builderMatch ? builderMatch[2].trim() : undefined;
    
    return { year, builder };
  }
  
  private static processOwnerType(ownerDescription: string): string {
    return ownerDescription.includes('SOLE OWNER') ? 'Individual' : 'Company';
  }
  
  private static extractOwnerName(ownerResidence: string): string {
    // Extract company name (usually first part before address)
    const nameMatch = ownerResidence.match(/^([A-Z\s&]+?)(?:\s+\d|\s+LTD)/);
    return nameMatch ? nameMatch[1].trim() : '';
  }
  
  private static extractNumericValue(value: string): number | undefined {
    const numMatch = value.match(/(\d+(?:\.\d+)?)/);
    return numMatch ? parseFloat(numMatch[1]) : undefined;
  }
  
  private static extractEngineKW(powerStr: string): number | undefined {
    const kwMatch = powerStr.match(/Combined KW\s*(\d+(?:\.\d+)?)/i) || powerStr.match(/(\d+(?:\.\d+)?)/);
    return kwMatch ? parseFloat(kwMatch[1]) : undefined;
  }
  
  private static extractYear(yearStr: string): number | undefined {
    const yearMatch = yearStr.match(/(20\d{2}|19\d{2})/);
    return yearMatch ? parseInt(yearMatch[1]) : undefined;
  }
  
  private static formatDateToDDMMYYYY(dateStr: string): string {
    if (!dateStr) return dateStr;
    
    // Handle "10 December 2020" format
    const dayMonthYearMatch = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (dayMonthYearMatch) {
      const day = dayMonthYearMatch[1].padStart(2, '0');
      const monthName = dayMonthYearMatch[2];
      const year = dayMonthYearMatch[3];
      const monthNum = this.getMonthNumber(monthName);
      return `${day}-${monthNum.toString().padStart(2, '0')}-${year}`;
    }
    
    return dateStr;
  }
  
  private static getMonthNumber(monthName: string): number {
    const months: Record<string, number> = {
      'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
      'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
      'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'october': 10, 'oct': 10,
      'november': 11, 'nov': 11, 'december': 12, 'dec': 12
    };
    
    return months[monthName.toLowerCase()] || 1;
  }
}