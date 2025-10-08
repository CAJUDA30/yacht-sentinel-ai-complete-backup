import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  name: string;
  type: 'supplier' | 'contractor' | 'both';
  category: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  country?: string;
  website?: string;
  overall_rating: number;
  total_jobs: number;
  completed_jobs: number;
  on_time_delivery_rate: number;
  cost_rating: number;
  quality_rating: number;
  communication_rating: number;
  certifications: string[];
  maritime_specialties: string[];
  vessel_types_served: string[];
  compliance_standards: string[];
  tax_id?: string;
  vat_number?: string;
  payment_terms: string;
  currency: string;
  credit_limit: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  preferred_communication: 'email' | 'whatsapp' | 'both';
  last_contact_at?: string;
  last_job_at?: string;
  module_access: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SupplierModuleAssignment {
  id: string;
  supplier_id: string;
  module_name: string;
  specialties: string[];
  preferred: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [assignments, setAssignments] = useState<SupplierModuleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers_contractors')
        .select('*')
        .order('name');

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        type: item.type as 'supplier' | 'contractor' | 'both',
        status: item.status as 'active' | 'inactive' | 'suspended' | 'pending_approval',
        preferred_communication: item.preferred_communication as 'email' | 'whatsapp' | 'both',
        certifications: Array.isArray(item.certifications) ? item.certifications.filter(x => typeof x === 'string') : [],
        maritime_specialties: Array.isArray(item.maritime_specialties) ? item.maritime_specialties.filter(x => typeof x === 'string') : [],
        vessel_types_served: Array.isArray(item.vessel_types_served) ? item.vessel_types_served.filter(x => typeof x === 'string') : [],
        compliance_standards: Array.isArray(item.compliance_standards) ? item.compliance_standards.filter(x => typeof x === 'string') : [],
        module_access: Array.isArray(item.module_access) ? item.module_access.filter(x => typeof x === 'string') : []
      }));
      
      setSuppliers(typedData);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch suppliers and contractors",
        variant: "destructive",
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_module_assignments')
        .select('*');

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        specialties: Array.isArray(item.specialties) ? item.specialties.filter(x => typeof x === 'string') : []
      }));
      
      setAssignments(typedData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const createSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      const dbData = {
        name: supplierData.name!,
        type: supplierData.type!,
        category: supplierData.category!,
        ...supplierData,
        certifications: supplierData.certifications || [],
        maritime_specialties: supplierData.maritime_specialties || [],
        vessel_types_served: supplierData.vessel_types_served || [],
        compliance_standards: supplierData.compliance_standards || [],
        module_access: supplierData.module_access || []
      };

      const { data, error } = await supabase
        .from('suppliers_contractors')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      const typedData: Supplier = {
        ...data,
        type: data.type as 'supplier' | 'contractor' | 'both',
        status: data.status as 'active' | 'inactive' | 'suspended' | 'pending_approval',
        preferred_communication: data.preferred_communication as 'email' | 'whatsapp' | 'both',
        certifications: Array.isArray(data.certifications) ? data.certifications.filter(x => typeof x === 'string') : [],
        maritime_specialties: Array.isArray(data.maritime_specialties) ? data.maritime_specialties.filter(x => typeof x === 'string') : [],
        vessel_types_served: Array.isArray(data.vessel_types_served) ? data.vessel_types_served.filter(x => typeof x === 'string') : [],
        compliance_standards: Array.isArray(data.compliance_standards) ? data.compliance_standards.filter(x => typeof x === 'string') : [],
        module_access: Array.isArray(data.module_access) ? data.module_access.filter(x => typeof x === 'string') : []
      };

      setSuppliers(prev => [...prev, typedData]);
      toast({
        title: "Success",
        description: "Supplier/contractor created successfully",
      });

      return typedData;
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "Error",
        description: "Failed to create supplier/contractor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers_contractors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const typedData: Supplier = {
        ...data,
        type: data.type as 'supplier' | 'contractor' | 'both',
        status: data.status as 'active' | 'inactive' | 'suspended' | 'pending_approval',
        preferred_communication: data.preferred_communication as 'email' | 'whatsapp' | 'both',
        certifications: Array.isArray(data.certifications) ? data.certifications.filter(x => typeof x === 'string') : [],
        maritime_specialties: Array.isArray(data.maritime_specialties) ? data.maritime_specialties.filter(x => typeof x === 'string') : [],
        vessel_types_served: Array.isArray(data.vessel_types_served) ? data.vessel_types_served.filter(x => typeof x === 'string') : [],
        compliance_standards: Array.isArray(data.compliance_standards) ? data.compliance_standards.filter(x => typeof x === 'string') : [],
        module_access: Array.isArray(data.module_access) ? data.module_access.filter(x => typeof x === 'string') : []
      };

      setSuppliers(prev => prev.map(s => s.id === id ? typedData : s));
      toast({
        title: "Success",
        description: "Supplier/contractor updated successfully",
      });

      return typedData;
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "Error",
        description: "Failed to update supplier/contractor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers_contractors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Success",
        description: "Supplier/contractor deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Error",
        description: "Failed to delete supplier/contractor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const assignToModule = async (supplierId: string, moduleName: string, assignmentData: Partial<SupplierModuleAssignment>) => {
    try {
      const { data, error } = await supabase
        .from('supplier_module_assignments')
        .upsert([{
          supplier_id: supplierId,
          module_name: moduleName,
          ...assignmentData
        }])
        .select()
        .single();

      if (error) throw error;

      setAssignments(prev => {
        const existing = prev.find(a => a.supplier_id === supplierId && a.module_name === moduleName);
        const typedData: SupplierModuleAssignment = {
          ...data,
          specialties: Array.isArray(data.specialties) ? data.specialties.filter(x => typeof x === 'string') : []
        };
        
        if (existing) {
          return prev.map(a => 
            a.supplier_id === supplierId && a.module_name === moduleName ? typedData : a
          );
        }
        return [...prev, typedData];
      });

      toast({
        title: "Success",
        description: "Module assignment updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error assigning to module:', error);
      toast({
        title: "Error",
        description: "Failed to update module assignment",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getSuppliersForModule = (moduleName: string) => {
    const moduleAssignments = assignments.filter(a => a.module_name === moduleName);
    return suppliers.filter(s => 
      s.module_access.includes(moduleName) || 
      moduleAssignments.some(a => a.supplier_id === s.id)
    );
  };

  const getPreferredSuppliersForModule = (moduleName: string) => {
    const preferred = assignments.filter(a => a.module_name === moduleName && a.preferred);
    return suppliers.filter(s => preferred.some(p => p.supplier_id === s.id));
  };

  const getBestRatedSuppliers = (limit = 5) => {
    return suppliers
      .filter(s => s.status === 'active')
      .sort((a, b) => b.overall_rating - a.overall_rating)
      .slice(0, limit);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSuppliers(), fetchAssignments()]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const suppliersChannel = supabase
      .channel('suppliers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suppliers_contractors'
        },
        () => {
          fetchSuppliers();
        }
      )
      .subscribe();

    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supplier_module_assignments'
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(suppliersChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, []);

  return {
    suppliers,
    assignments,
    loading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    assignToModule,
    getSuppliersForModule,
    getPreferredSuppliersForModule,
    getBestRatedSuppliers,
    refreshData: () => Promise.all([fetchSuppliers(), fetchAssignments()])
  };
};