import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { useClaimsRepairsCategories, ClaimsRepairsCategory } from '@/hooks/useClaimsRepairsCategories';
import { crossModuleIntegration } from '@/services/crossModuleIntegration';
import { enhancedCrossModuleIntegration } from '@/services/enhancedCrossModuleIntegration';

// Updated interfaces
interface YachtProfile {
  id: string;
  yacht_name: string;
  model?: string;
  year?: number;
  length?: number;
  beam?: number;
  draft?: number;
  flag?: string;
  port_of_registry?: string;
  imo_number?: string;
  mmsi?: string;
  owner_name?: string;
  owner_contact?: string;
  management_company?: string;
  captain_name?: string;
  captain_contact?: string;
  crew_size?: number;
  insurance_provider?: string;
  insurance_policy?: string;
  classification_society?: string;
  current_location?: string;
  home_port?: string;
  created_at: string;
  updated_at: string;
}

export interface ClaimsRepairsJob {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  job_type: 'audit' | 'warranty_claim' | 'repair';
  yacht_id?: string;
  yacht?: YachtProfile;
  warranty_start_date?: string;
  warranty_duration_months?: number;
  warranty_expires_at?: string;
  contractor_id?: string;
  performance_score?: number;
  cost_rating?: number;
  estimated_cost?: number;
  actual_cost?: number;
  currency?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  scheduled_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationChannel {
  id: string;
  audit_instance_id: string;
  channel_type: 'email' | 'whatsapp' | 'both';
  supplier_email?: string;
  supplier_whatsapp?: string;
  thread_data: any;
  unread_count: number;
  last_message_at?: string;
  status: 'active' | 'archived' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface SupplierCommunication {
  id: string;
  channel_id: string;
  message_type: 'outgoing' | 'incoming';
  channel_used: 'email' | 'whatsapp';
  subject?: string;
  content?: string;
  attachments: string[];
  ai_extracted_data: any;
  sentiment_score?: number;
  read_status: boolean;
  delivered_at?: string;
  created_at: string;
}

export interface CostEstimate {
  id: string;
  audit_instance_id: string;
  estimate_type: 'initial' | 'revised' | 'final';
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  currency: string;
  valid_until?: string;
  supplier_quote_ref?: string;
  ai_extracted: boolean;
  created_at: string;
}

export interface WarrantyLibraryItem {
  id: string;
  equipment_type: string;
  manufacturer?: string;
  warranty_duration_months: number;
  coverage_details: any;
  standard_type?: string;
  is_active: boolean;
}

export interface ClaimedItem {
  id: string;
  item_name: string;
  item_type: string;
  manufacturer?: string;
  total_claims: number;
  last_claimed_at?: string;
  claim_history: any[];
}

interface ClaimsRepairsContextType {
  // Data
  jobs: ClaimsRepairsJob[];
  yachts: YachtProfile[];
  communications: CommunicationChannel[];
  warrantyLibrary: WarrantyLibraryItem[];
  claimedItems: ClaimedItem[];
  
  // State
  loading: boolean;
  selectedYacht?: YachtProfile;
  activeFilter: string;
  searchTerm: string;
  
  // Actions
  createJob: (jobData: Partial<ClaimsRepairsJob>) => Promise<ClaimsRepairsJob | null>;
  updateJob: (id: string, updates: Partial<ClaimsRepairsJob>) => Promise<boolean>;
  deleteJob: (id: string) => Promise<boolean>;
  
  // Yacht Management
  createYacht: (yachtData: Partial<YachtProfile>) => Promise<YachtProfile | null>;
  selectYacht: (yacht: YachtProfile) => void;
  
  // Communications
  sendMessage: (jobId: string, channel: 'email' | 'whatsapp', message: string, attachments?: File[]) => Promise<boolean>;
  getCommunications: (jobId: string) => Promise<SupplierCommunication[]>;
  
  // Warranty Management
  extractWarrantyFromDocument: (file: File) => Promise<{ start_date?: string; duration_months?: number } | null>;
  validateWarrantyStatus: (jobId: string) => Promise<{ is_valid: boolean; expires_at?: string; days_remaining?: number }>;
  
  // Cost Management
  createCostEstimate: (jobId: string, estimate: Partial<CostEstimate>) => Promise<CostEstimate | null>;
  approveQuote: (estimateId: string, routeToProcurement?: boolean) => Promise<boolean>;
  
  // Filters & Search
  setActiveFilter: (filter: string) => void;
  setSearchTerm: (term: string) => void;
  
  // Refresh
  refreshData: () => Promise<void>;
  
  // Cross-module integration
  getIntegratedJobData: (jobId: string) => Promise<any>;
  createFinanceTransaction: (data: any) => Promise<any>;
  performFullIntegration: (jobId: string, options?: any) => Promise<void>;
}

const ClaimsRepairsContext = createContext<ClaimsRepairsContextType | undefined>(undefined);

export const useClaimsRepairs = () => {
  const context = useContext(ClaimsRepairsContext);
  if (!context) {
    throw new Error('useClaimsRepairs must be used within a ClaimsRepairsProvider');
  }
  return context;
};

interface ClaimsRepairsProviderProps {
  children: ReactNode;
}

export const ClaimsRepairsProvider: React.FC<ClaimsRepairsProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  // State
  const [jobs, setJobs] = useState<ClaimsRepairsJob[]>([]);
  const [yachts, setYachts] = useState<YachtProfile[]>([]);
  const [communications, setCommunications] = useState<CommunicationChannel[]>([]);
  const [warrantyLibrary, setWarrantyLibrary] = useState<WarrantyLibraryItem[]>([]);
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYacht, setSelectedYacht] = useState<YachtProfile>();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadJobs(),
        loadYachts(),
        loadWarrantyLibrary(),
        loadClaimedItems()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load Claims & Repairs data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from('audit_instances')
      .select(`
        *,
        yacht:yacht_profiles(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading jobs:', error);
      return;
    }

    setJobs((data || []).map(item => ({
      ...item,
      status: item.status as 'draft' | 'active' | 'pending' | 'completed' | 'cancelled',
      priority: item.priority as 'low' | 'medium' | 'high' | 'critical',
      job_type: item.job_type as 'audit' | 'warranty_claim' | 'repair',
      risk_level: item.risk_level as 'low' | 'medium' | 'high' | 'critical' | undefined,
      yacht: item.yacht ? {
        ...item.yacht,
        yacht_name: item.yacht.name || '',
        year: item.yacht.year_built,
        length: item.yacht.length_meters,
        beam: item.yacht.beam_meters,
        draft: item.yacht.draft_meters,
        flag: item.yacht.flag_state,
        current_location: typeof item.yacht.current_location === 'string' ? item.yacht.current_location : ''
      } : undefined
    })));
  };

  const loadYachts = async () => {
    const { data, error } = await supabase
      .from('yacht_profiles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading yachts:', error);
      return;
    }

    setYachts((data || []).map(item => ({
      ...item,
      yacht_name: item.name || '',
      year: item.year_built,
      length: item.length_meters,
      beam: item.beam_meters,
      draft: item.draft_meters,
      flag: item.flag_state,
      current_location: typeof item.current_location === 'string' ? item.current_location : ''
    })));
  };

  const loadWarrantyLibrary = async () => {
    const { data, error } = await supabase
      .from('warranty_library')
      .select('*')
      .eq('is_active', true)
      .order('equipment_type');

    if (error) {
      console.error('Error loading warranty library:', error);
      return;
    }

    setWarrantyLibrary(data || []);
  };

  const loadClaimedItems = async () => {
    const { data, error } = await supabase
      .from('claimed_items_library')
      .select('*')
      .order('total_claims', { ascending: false });

    if (error) {
      console.error('Error loading claimed items:', error);
      return;
    }

    setClaimedItems((data || []).map(item => ({
      ...item,
      claim_history: Array.isArray(item.claim_history) ? item.claim_history : []
    })));
  };

  const createJob = async (jobData: Partial<ClaimsRepairsJob>): Promise<ClaimsRepairsJob | null> => {
    try {
      const { data, error } = await supabase
        .from('audit_instances')
        .insert([{
          name: jobData.name || 'New Job',
          template_id: '00000000-0000-0000-0000-000000000000',
          ...jobData,
          yacht_id: selectedYacht?.id || jobData.yacht_id
        }])
        .select(`
          *,
          yacht:yacht_profiles(*)
        `)
        .single();

      if (error) throw error;

      const newJob = {
        ...data,
        status: data.status as 'draft' | 'active' | 'pending' | 'completed' | 'cancelled',
        priority: data.priority as 'low' | 'medium' | 'high' | 'critical',
        job_type: data.job_type as 'audit' | 'warranty_claim' | 'repair',
        yacht: data.yacht ? {
          ...data.yacht,
          yacht_name: data.yacht.name || '',
          year: data.yacht.year_built,
          length: data.yacht.length_meters,
          beam: data.yacht.beam_meters,
          draft: data.yacht.draft_meters,
          flag: data.yacht.flag_state,
          current_location: typeof data.yacht.current_location === 'string' ? data.yacht.current_location : ''
        } : undefined
      } as ClaimsRepairsJob;
      setJobs(prev => [newJob, ...prev]);
      
      toast({
        title: "Success",
        description: `${newJob.job_type === 'warranty_claim' ? 'Warranty claim' : newJob.job_type === 'repair' ? 'Repair job' : 'Audit'} created successfully`
      });

      return newJob;
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateJob = async (id: string, updates: Partial<ClaimsRepairsJob>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('audit_instances')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setJobs(prev => prev.map(job => 
        job.id === id ? { ...job, ...updates } : job
      ));

      toast({
        title: "Success",
        description: "Job updated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Error", 
        description: "Failed to update job",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteJob = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('audit_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJobs(prev => prev.filter(job => job.id !== id));
      
      toast({
        title: "Success",
        description: "Job deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job", 
        variant: "destructive"
      });
      return false;
    }
  };

  const createYacht = async (yachtData: Partial<YachtProfile>): Promise<YachtProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('yacht_profiles')
        .insert([{
          name: yachtData.yacht_name || 'New Yacht',
          ...yachtData
        }])
        .select()
        .single();

      if (error) throw error;

      const newYacht = {
        ...data,
        yacht_name: data.name || '',
        year: data.year_built,
        length: data.length_meters,
        beam: data.beam_meters,
        draft: data.draft_meters,
        flag: data.flag_state,
        current_location: typeof data.current_location === 'string' ? data.current_location : ''
      } as YachtProfile;
      setYachts(prev => [...prev, newYacht]);
      
      toast({
        title: "Success",
        description: "Yacht profile created successfully"
      });

      return newYacht;
    } catch (error) {
      console.error('Error creating yacht:', error);
      toast({
        title: "Error",
        description: "Failed to create yacht profile",
        variant: "destructive"
      });
      return null;
    }
  };

  const selectYacht = (yacht: YachtProfile) => {
    setSelectedYacht(yacht);
  };

  const sendMessage = async (jobId: string, channel: 'email' | 'whatsapp', message: string, attachments?: File[]): Promise<boolean> => {
    try {
      // Implementation for sending messages via email/WhatsApp
      // This would integrate with the communication edge functions
      const { data, error } = await supabase.functions.invoke('send-communication', {
        body: {
          jobId,
          channel,
          message,
          attachments: attachments?.map(f => f.name) || []
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Message sent via ${channel}`
      });

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return false;
    }
  };

  const getCommunications = async (jobId: string): Promise<SupplierCommunication[]> => {
    try {
      const { data, error } = await supabase
        .from('supplier_communications')
        .select(`
          *,
          channel:communication_channels(*)
        `)
        .eq('channel.audit_instance_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        message_type: item.message_type as 'outgoing' | 'incoming',
        channel_used: item.channel_used as 'email' | 'whatsapp',
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        ai_extracted_data: item.ai_extracted_data || {}
      }));
    } catch (error) {
      console.error('Error getting communications:', error);
      return [];
    }
  };

  const extractWarrantyFromDocument = async (file: File): Promise<{ start_date?: string; duration_months?: number } | null> => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const { data, error } = await supabase.functions.invoke('extract-warranty-data', {
        body: formData
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error extracting warranty data:', error);
      toast({
        title: "Error",
        description: "Failed to extract warranty information from document",
        variant: "destructive"
      });
      return null;
    }
  };

  const validateWarrantyStatus = async (jobId: string): Promise<{ is_valid: boolean; expires_at?: string; days_remaining?: number }> => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job || !job.warranty_expires_at) {
        return { is_valid: false };
      }

      const expiresAt = new Date(job.warranty_expires_at);
      const now = new Date();
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        is_valid: daysRemaining > 0,
        expires_at: job.warranty_expires_at,
        days_remaining: daysRemaining
      };
    } catch (error) {
      console.error('Error validating warranty:', error);
      return { is_valid: false };
    }
  };

  const createCostEstimate = async (jobId: string, estimate: Partial<CostEstimate>): Promise<CostEstimate | null> => {
    try {
      const { data, error } = await supabase
        .from('cost_estimates')
        .insert([{
          total_cost: estimate.total_cost || 0,
          estimate_type: estimate.estimate_type || 'initial',
          ...estimate,
          audit_instance_id: jobId
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cost estimate created successfully"
      });

      return data as CostEstimate;
    } catch (error) {
      console.error('Error creating cost estimate:', error);
      toast({
        title: "Error",
        description: "Failed to create cost estimate",
        variant: "destructive"
      });
      return null;
    }
  };

  const approveQuote = async (estimateId: string, routeToProcurement?: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('quote_approvals')
        .insert([{
          cost_estimate_id: estimateId,
          approval_status: routeToProcurement ? 'routed_to_procurement' : 'approved'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: routeToProcurement ? "Quote routed to procurement" : "Quote approved successfully"
      });

      return true;
    } catch (error) {
      console.error('Error approving quote:', error);
      toast({
        title: "Error",
        description: "Failed to approve quote",
        variant: "destructive"
      });
      return false;
    }
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  const value: ClaimsRepairsContextType = {
    // Data
    jobs,
    yachts,
    communications,
    warrantyLibrary,
    claimedItems,
    
    // State
    loading,
    selectedYacht,
    activeFilter,
    searchTerm,
    
    // Actions
    createJob,
    updateJob,
    deleteJob,
    createYacht,
    selectYacht,
    sendMessage,
    getCommunications,
    extractWarrantyFromDocument,
    validateWarrantyStatus,
    createCostEstimate,
    approveQuote,
    setActiveFilter,
    setSearchTerm,
    refreshData,
    getIntegratedJobData: async (jobId: string) => {
      return await crossModuleIntegration.getIntegratedJobData(jobId);
    },
    createFinanceTransaction: async (data: any) => {
      return await crossModuleIntegration.createFinanceTransaction(
        data.amount,
        data.currency,
        data.description,
        data.transaction_type,
        data.reference_id,
        data.reference_type,
        data.supplier_contractor_id
      );
    },
    performFullIntegration: async (jobId: string, options?: any) => {
      return await enhancedCrossModuleIntegration.performFullIntegration(jobId, options);
    }
  };

  return (
    <ClaimsRepairsContext.Provider value={value}>
      {children}
    </ClaimsRepairsContext.Provider>
  );
};