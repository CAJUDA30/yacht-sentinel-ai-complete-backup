import { supabase } from '@/integrations/supabase/client';
import { YachtOnboardingData } from '@/components/onboarding/YachtOnboardingWizard';

export interface YachtOnboardingResult {
  success: boolean;
  yachtId?: string;
  error?: string;
  validationErrors?: Record<string, string>;
}

export interface YachtProfile {
  id: string;
  name: string;
  imo_number?: string;
  flag_state: string;
  vessel_type: string;
  gross_tonnage?: number;
  built_year?: number;
  length_meters?: number;
  beam_meters?: number;
  draft_meters?: number;
  classification_society?: string;
  owner_id: string;
  specifications: Record<string, any>;
  documentation: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class YachtOnboardingService {
  
  /**
   * Create a complete yacht profile with access control setup
   */
  async createYachtProfile(userId: string, onboardingData: YachtOnboardingData): Promise<YachtOnboardingResult> {
    try {
      // Validate required data
      const validationResult = this.validateOnboardingData(onboardingData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validationResult.errors
        };
      }

      // Start transaction-like operation
      const yachtProfileResult = await this.createYachtProfileRecord(userId, onboardingData);
      if (!yachtProfileResult.success) {
        return yachtProfileResult;
      }

      const yachtId = yachtProfileResult.yachtId!;

      // Setup yacht access control (make user the owner)
      const accessResult = await this.setupYachtAccess(yachtId, userId, onboardingData);
      if (!accessResult.success) {
        // Rollback yacht creation if access setup fails
        await this.deleteYachtProfile(yachtId);
        return accessResult;
      }

      // Create initial crew records if provided
      if (onboardingData.initialCrew.captainName) {
        await this.createInitialCrewInternal(yachtId, onboardingData.initialCrew);
      }

      // Register yacht in centralized registry
      await this.registerInYachtRegistry(yachtId, onboardingData);

      // Log yacht activity
      await this.logYachtActivityInternal(yachtId, userId, 'yacht_created', 'Yacht profile created via onboarding wizard');

      return {
        success: true,
        yachtId: yachtId
      };

    } catch (error) {
      console.error('Yacht onboarding error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create yacht profile'
      };
    }
  }

  /**
   * Validate onboarding data
   */
  private validateOnboardingData(data: YachtOnboardingData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Basic Info Validation
    if (!data.basicInfo.name?.trim()) {
      errors.name = 'Yacht name is required';
    }
    
    if (!data.basicInfo.type?.trim()) {
      errors.type = 'Yacht type is required';
    }
    
    if (!data.basicInfo.category?.trim()) {
      errors.category = 'Yacht category is required';
    }
    
    if (!data.basicInfo.flagState?.trim()) {
      errors.flagState = 'Flag state is required';
    }

    // Specifications Validation
    if (!data.specifications.lengthOverall || data.specifications.lengthOverall <= 0) {
      errors.lengthOverall = 'Length overall must be greater than 0';
    }

    // IMO Number validation (if provided)
    if (data.basicInfo.imoNumber && !this.isValidIMONumber(data.basicInfo.imoNumber)) {
      errors.imoNumber = 'Invalid IMO number format';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Create yacht profile record in database
   */
  private async createYachtProfileRecord(userId: string, data: YachtOnboardingData): Promise<YachtOnboardingResult> {
    try {
      const specifications = {
        length_overall_m: data.specifications.lengthOverall,
        beam_m: data.specifications.beam,
        draft_m: data.specifications.draft,
        gross_tonnage: data.specifications.grossTonnage,
        max_speed_knots: data.specifications.maxSpeed,
        crew_capacity: data.specifications.crewCapacity,
        guest_capacity: data.specifications.guestCapacity,
        engine_type: data.specifications.engineType,
        fuel_capacity_l: data.specifications.fuelCapacity,
        builder: data.basicInfo.builder,
        model: data.basicInfo.model,
        official_number: data.basicInfo.officialNumber
      };

      const documentation = {
        certificates: {
          registration: data.documentation.registrationCertificate?.name,
          insurance: data.documentation.insuranceCertificate?.name,
          safety_management: data.documentation.safetyManagementCertificate?.name,
          radio: data.documentation.radioCertificate?.name
        },
        additional_docs: data.documentation.additionalDocs?.map(doc => doc.name) || []
      };

      const { data: yachtProfile, error } = await supabase
        .from('yacht_profiles')
        .insert([{
          name: data.basicInfo.name,
          imo_number: data.basicInfo.imoNumber || null,
          flag_state: data.basicInfo.flagState,
          status: data.basicInfo.type, // Using status field for yacht type
          gross_tonnage: data.specifications.grossTonnage || null,
          year_built: data.basicInfo.year || null,
          length_meters: data.specifications.lengthOverall || null,
          beam_meters: data.specifications.beam || null,
          draft_meters: data.specifications.draft || null,
          owner_id: userId,
          specifications: specifications
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating yacht profile:', error);
        throw new Error(`Failed to create yacht profile: ${error.message}`);
      }

      return {
        success: true,
        yachtId: yachtProfile.id
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup yacht access control
   */
  private async setupYachtAccess(yachtId: string, userId: string, data: YachtOnboardingData): Promise<YachtOnboardingResult> {
    try {
      // Grant owner access to the user who created the yacht
      // Note: Using crew_members table temporarily until yacht_access_control is available
      const { error: ownerAccessError } = await supabase
        .from('crew_members')
        .insert({
          yacht_id: yachtId,
          user_id: userId,
          name: 'Owner',
          position: 'owner',
          hire_date: new Date().toISOString().split('T')[0]
        });

      if (ownerAccessError) {
        console.error('Error setting up owner access:', ownerAccessError);
        throw new Error(`Failed to setup owner access: ${ownerAccessError.message}`);
      }

      // Add additional owner users if specified
      if (data.accessControl.ownerUsers?.length > 0) {
        const additionalOwners = data.accessControl.ownerUsers.map(email => ({
          user_id: null, // Will need to resolve email to user_id
          yacht_id: yachtId,
          role: 'owner',
          access_level: 'owner',
          granted_by: userId,
          is_active: false, // Pending until user accepts
          permissions: {
            full_access: true,
            granted_via: 'yacht_onboarding',
            pending_email: email
          },
          notes: `Pending owner access for ${email}`
        }));

        // TODO: Implement email-to-user resolution and invitation system
      }

      // Add manager users if specified
      if (data.accessControl.managerUsers?.length > 0) {
        // TODO: Implement manager user setup
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create initial crew records (public method)
   */
  async createInitialCrew(yachtId: string, crewData: YachtOnboardingData['initialCrew']): Promise<void> {
    return this.createInitialCrewInternal(yachtId, crewData);
  }

  /**
   * Log yacht activity (public method)
   */
  async logYachtActivity(
    yachtId: string, 
    userId: string, 
    actionType: string, 
    description: string
  ): Promise<void> {
    return this.logYachtActivityInternal(yachtId, userId, actionType, description);
  }

  /**
   * Create initial crew records
   */
  private async createInitialCrewInternal(yachtId: string, crewData: YachtOnboardingData['initialCrew']): Promise<void> {
    try {
      const crewMembers = [];

      // Add captain
      if (crewData.captainName) {
        crewMembers.push({
          yacht_id: yachtId,
          name: crewData.captainName,
          position: 'captain',
          email: crewData.captainEmail || null,
          phone: crewData.captainPhone || null,
          certifications: crewData.captainCertificates || [],
          hire_date: new Date().toISOString().split('T')[0]
        });
      }

      // Add additional crew
      crewData.additionalCrew?.forEach(crew => {
        if (crew.name) {
          crewMembers.push({
            yacht_id: yachtId,
            name: crew.name,
            position: crew.position || 'crew',
            email: crew.email || null,
            phone: crew.phone || null,
            hire_date: new Date().toISOString().split('T')[0]
          });
        }
      });

      if (crewMembers.length > 0) {
        const { error } = await supabase
          .from('crew_members')
          .insert(crewMembers);

        if (error) {
          console.warn('Error creating initial crew:', error);
          // Don't fail the whole onboarding for crew creation errors
        }
      }

    } catch (error) {
      console.warn('Error creating initial crew records:', error);
      // Don't fail the whole onboarding for crew creation errors
    }
  }

  /**
   * Register yacht in centralized registry
   */
  private async registerInYachtRegistry(yachtId: string, data: YachtOnboardingData): Promise<void> {
    try {
      // Call centralized registry function to register the yacht
      const { data: registryResult, error } = await supabase.functions.invoke('centralized-registry', {
        body: {
          action: 'create',
          entity_type: 'yacht_registry',
          data: {
            yacht_id: yachtId,
            yacht_name: data.basicInfo.name,
            yacht_type: data.basicInfo.type,
            yacht_category: data.basicInfo.category,
            flag_state: data.basicInfo.flagState,
            imo_number: data.basicInfo.imoNumber,
            length_overall_m: data.specifications.lengthOverall,
            beam_m: data.specifications.beam,
            gross_tonnage: data.specifications.grossTonnage,
            year_built: data.basicInfo.year,
            builder: data.basicInfo.builder,
            model: data.basicInfo.model,
            current_location: data.operations.currentLocation,
            home_port: data.operations.homePort,
            operational_areas: data.operations.operationalAreas,
            is_active: true
          },
          options: {
            generate_embeddings: true
          }
        }
      });

      if (error) {
        console.warn('Error registering yacht in centralized registry:', error);
        // Don't fail onboarding for registry registration errors
      }

    } catch (error) {
      console.warn('Error with centralized registry registration:', error);
      // Don't fail onboarding for registry registration errors
    }
  }

  /**
   * Log yacht activity
   */
  private async logYachtActivityInternal(
    yachtId: string, 
    userId: string, 
    actionType: string, 
    description: string
  ): Promise<void> {
    try {
      // TODO: Implement activity logging when the function is available
      console.log('Yacht activity:', {
        yacht_id: yachtId,
        user_id: userId,
        action_type: actionType,
        description
      });
    } catch (error) {
      console.warn('Error logging yacht activity:', error);
      // Don't fail onboarding for logging errors
    }
  }

  /**
   * Delete yacht profile (rollback)
   */
  private async deleteYachtProfile(yachtId: string): Promise<void> {
    try {
      await supabase
        .from('yacht_profiles')
        .delete()
        .eq('id', yachtId);
    } catch (error) {
      console.error('Error rolling back yacht profile:', error);
    }
  }

  /**
   * Validate IMO number format
   */
  private isValidIMONumber(imoNumber: string): boolean {
    // IMO number should be 7 digits
    const imoRegex = /^\d{7}$/;
    if (!imoRegex.test(imoNumber)) {
      return false;
    }

    // Calculate check digit for IMO number validation
    const digits = imoNumber.split('').map(Number);
    const checkDigit = digits[6];
    const calculatedCheck = digits.slice(0, 6).reduce((sum, digit, index) => {
      return sum + digit * (7 - index);
    }, 0) % 10;

    return checkDigit === calculatedCheck;
  }

  /**
   * Get yacht onboarding status
   */
  async getOnboardingStatus(yachtId: string): Promise<{
    status: 'incomplete' | 'completed';
    completedSteps: string[];
    nextStep?: string;
  }> {
    try {
      // Check if yacht exists and has all required data
      const { data: yacht, error } = await supabase
        .from('yacht_profiles')
        .select('*')
        .eq('id', yachtId)
        .single();

      if (error || !yacht) {
        return {
          status: 'incomplete',
          completedSteps: [],
          nextStep: 'basic-info'
        };
      }

      const completedSteps = [];

      // Check if basic info is filled
      if (yacht.name && yacht.status && yacht.flag_state && yacht.length_meters && yacht.length_meters > 0) {
        completedSteps.push('basic-info');
      }

      // Check if crew setup exists
      const { data: crew } = await supabase
        .from('crew_members')
        .select('id')
        .eq('yacht_id', yachtId)
        .eq('position', 'captain')
        .limit(1);

      if (crew && crew.length > 0) {
        completedSteps.push('crew-setup');
      }

      return {
        status: completedSteps.length >= 2 ? 'completed' : 'incomplete',
        completedSteps,
        nextStep: this.getNextStep(completedSteps)
      };

    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return {
        status: 'incomplete',
        completedSteps: [],
        nextStep: 'basic-info'
      };
    }
  }

  /**
   * Determine next step in onboarding
   */
  private getNextStep(completedSteps: string[]): string | undefined {
    const steps = ['basic-info', 'documentation', 'crew-setup', 'operations', 'access-control', 'review'];
    
    for (const step of steps) {
      if (!completedSteps.includes(step)) {
        return step;
      }
    }
    
    return undefined; // All steps completed
  }

  /**
   * Resume onboarding from where user left off
   */
  async resumeOnboarding(yachtId: string): Promise<YachtOnboardingData | null> {
    try {
      const { data: yacht, error } = await supabase
        .from('yacht_profiles')
        .select('*')
        .eq('id', yachtId)
        .single();

      if (error || !yacht) {
        return null;
      }

      // Convert database data back to onboarding format
      const onboardingData: YachtOnboardingData = {
        basicInfo: {
          name: yacht.name || '',
          type: yacht.status || '', // Using status as yacht type
          category: 'Private', // Default value since we don't have this field
          builder: yacht.builder || '',
          model: '', // Not available in current schema
          year: yacht.year_built || new Date().getFullYear(),
          flagState: yacht.flag_state || '',
          imoNumber: yacht.imo_number || '',
          officialNumber: ''
        },
        specifications: {
          lengthOverall: yacht.length_meters || 0,
          beam: yacht.beam_meters || 0,
          draft: yacht.draft_meters || 0,
          grossTonnage: yacht.gross_tonnage || 0,
          maxSpeed: yacht.max_speed || 0,
          crewCapacity: yacht.crew_capacity || 0,
          guestCapacity: yacht.guest_capacity || 0,
          engineType: '',
          fuelCapacity: yacht.fuel_capacity || 0
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
      };

      // Get crew data separately
      const { data: crewMembers } = await supabase
        .from('crew_members')
        .select('*')
        .eq('yacht_id', yachtId);

      // Fill in crew data if available
      const captain = crewMembers?.find((crew: any) => crew.position === 'captain');
      if (captain) {
        onboardingData.initialCrew.captainName = captain.name || '';
        onboardingData.initialCrew.captainEmail = '';
        onboardingData.initialCrew.captainPhone = '';
        onboardingData.initialCrew.captainCertificates = Array.isArray(captain.certifications) ? captain.certifications.filter(cert => typeof cert === 'string') : [];
      }

      return onboardingData;

    } catch (error) {
      console.error('Error resuming onboarding:', error);
      return null;
    }
  }
}