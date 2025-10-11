import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MasterProduct {
  id: string;
  product_name: string;
  brand?: string;
  model?: string;
  part_number?: string;
  upc_code?: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  product_type: 'inventory' | 'equipment';
  specifications: any;
  dimensions?: any;
  weight?: number;
  materials?: string[];
  description?: string;
  owner_manual_url?: string;
  installation_guide_url?: string;
  technical_specs_url?: string;
  datasheet_url?: string;
  safety_instructions?: string;
  primary_image_url?: string;
  additional_images?: string[];
  maintenance_schedule?: any[];
  expected_lifespan_hours?: number;
  warranty_period_months?: number;
  compatible_parts?: any[];
  required_spare_parts?: any[];
  installation_requirements?: string;
  confidence_score: number;
  data_quality_score: number;
  verification_status: 'pending' | 'verified' | 'disputed';
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_verified_at?: string;
  last_verified_by?: string;
  scan_count: number;
  usage_count: number;
  search_keywords?: string[];
  alternative_names?: string[];
}

export interface ProductContribution {
  id: string;
  master_product_id: string;
  contributor_id?: string;
  contribution_type: 'new_field' | 'correction' | 'enhancement' | 'image' | 'documentation';
  field_name?: string;
  old_value?: any;
  new_value?: any;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  confidence_score: number;
  evidence_sources?: string[];
  created_at: string;
  updated_at: string;
}

export interface ScanEvent {
  id: string;
  session_id: string;
  user_id?: string;
  module: string;
  scan_type: string;
  image_hash?: string;
  master_product_id?: string;
  recognition_confidence?: number;
  ai_extracted_data?: any;
  processing_time_ms?: number;
  ai_models_used?: string[];
  data_sources?: string[];
  user_confirmed: boolean;
  user_corrections?: any;
  created_inventory_item: boolean;
  created_equipment: boolean;
  created_at: string;
  updated_at: string;
}

export const useProductLibrary = () => {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [contributions, setContributions] = useState<ProductContribution[]>([]);
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search products in library
  const searchProducts = async (query: string, productType?: 'inventory' | 'equipment') => {
    setLoading(true);
    setError(null);

    try {
      let queryBuilder = supabase
        .from('master_products')
        .select('*')
        .or(`product_name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%,part_number.ilike.%${query}%`)
        .order('confidence_score', { ascending: false });

      if (productType) {
        queryBuilder = queryBuilder.eq('product_type', productType);
      }

      const { data, error: searchError } = await queryBuilder.limit(20);

      if (searchError) throw searchError;

      setProducts((data as MasterProduct[]) || []);
      return (data as MasterProduct[]) || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search products');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get product by ID
  const getProduct = async (id: string): Promise<MasterProduct | null> => {
    try {
      const { data, error } = await supabase
        .from('master_products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as MasterProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get product');
      return null;
    }
  };

  // Create new master product
  const createProduct = async (productData: Partial<MasterProduct>): Promise<MasterProduct | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('master_products')
        .insert({
          product_name: productData.product_name || 'Unknown Product',
          category: productData.category || 'General',
          product_type: productData.product_type || 'inventory',
          ...productData,
          confidence_score: productData.confidence_score || 0.5,
          data_quality_score: productData.data_quality_score || 0.5,
          verification_status: 'pending' as const,
          scan_count: 0,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial version
      await supabase
        .from('product_versions')
        .insert({
          master_product_id: data.id,
          version_number: 1,
          product_data: data,
          change_type: 'initial',
          change_summary: 'Initial product creation'
        });

      setProducts(prev => [data as MasterProduct, ...prev]);
      return data as MasterProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update existing product
  const updateProduct = async (id: string, updates: Partial<MasterProduct>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('master_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create version entry
      const { data: versions } = await supabase
        .from('product_versions')
        .select('version_number')
        .eq('master_product_id', id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (versions?.[0]?.version_number || 0) + 1;

      await supabase
        .from('product_versions')
        .insert({
          master_product_id: id,
          version_number: nextVersion,
          product_data: data,
          change_type: 'enhancement',
          change_summary: 'Product updated'
        });

      setProducts(prev => prev.map(p => p.id === id ? data as MasterProduct : p));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Submit contribution
  const submitContribution = async (contributionData: Partial<ProductContribution>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('product_contributions')
        .insert({
          master_product_id: contributionData.master_product_id || '',
          contribution_type: contributionData.contribution_type || 'enhancement',
          ...contributionData,
          confidence_score: contributionData.confidence_score || 0.7,
          status: 'pending' as const
        })
        .select()
        .single();

      if (error) throw error;

      setContributions(prev => [data as ProductContribution, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit contribution');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get contributions for a product
  const getProductContributions = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_contributions')
        .select('*')
        .eq('master_product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContributions((data as ProductContribution[]) || []);
      return (data as ProductContribution[]) || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get contributions');
      return [];
    }
  };

  // Log scan event
  const logScanEvent = async (eventData: Partial<ScanEvent>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scan_events')
        .insert({
          session_id: eventData.session_id || '',
          module: eventData.module || '',
          scan_type: eventData.scan_type || 'product',
          event_type: 'scan_completed',
          ...eventData,
          user_confirmed: eventData.user_confirmed || false,
          created_inventory_item: eventData.created_inventory_item || false,
          created_equipment: eventData.created_equipment || false
        });

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log scan event');
      return false;
    }
  };

  // Get scan history
  const getScanHistory = async (userId?: string) => {
    try {
      let query = supabase
        .from('scan_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setScanEvents((data as ScanEvent[]) || []);
      return (data as ScanEvent[]) || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get scan history');
      return [];
    }
  };

  // Get popular products
  const getPopularProducts = async (productType?: 'inventory' | 'equipment', limit = 10) => {
    try {
      let query = supabase
        .from('master_products')
        .select('*')
        .order('usage_count', { ascending: false });

      if (productType) {
        query = query.eq('product_type', productType);
      }

      const { data, error } = await query.limit(limit);

      if (error) throw error;
      return (data as MasterProduct[]) || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get popular products');
      return [];
    }
  };

  return {
    products,
    contributions,
    scanEvents,
    loading,
    error,
    searchProducts,
    getProduct,
    createProduct,
    updateProduct,
    submitContribution,
    getProductContributions,
    logScanEvent,
    getScanHistory,
    getPopularProducts
  };
};