import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface YachtRegistryEntry {
  id: string;
  yacht_name: string;
  imo_number?: string;
  mmsi_number?: string;
  yacht_type: string;
  yacht_category: string;
  length_overall_m?: number;
  year_built?: number;
  builder?: string;
  home_port?: string;
  current_location?: {
    lat: number;
    lng: number;
    port_name: string;
    country: string;
  };
  owner_entity_id?: string;
  management_company_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessEntity {
  id: string;
  entity_name: string;
  entity_type: string;
  business_type?: string;
  industry_category: string[];
  email_primary?: string;
  phone_primary?: string;
  addresses: any[];
  account_status: string;
  quality_rating?: number;
  reliability_score?: number;
  tags?: string[];
  contacts?: EntityContact[];
  relationships?: EntityRelationship[];
  performance_history?: PerformanceMetric[];
  created_at: string;
  updated_at: string;
}

export interface EntityContact {
  id: string;
  entity_id: string;
  contact_type: string;
  first_name: string;
  last_name: string;
  title?: string;
  email?: string;
  phone_work?: string;
  phone_mobile?: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface ProductService {
  id: string;
  supplier_id: string;
  catalog_type: string;
  category: string;
  subcategory?: string;
  item_name: string;
  item_description?: string;
  base_price?: number;
  currency: string;
  availability_status: string;
  tags?: string[];
  supplier?: BusinessEntity;
}

export interface EntityRelationship {
  id: string;
  entity_a_id: string;
  entity_b_id: string;
  relationship_type: string;
  relationship_status: string;
  start_date?: string;
  end_date?: string;
}

export interface PerformanceMetric {
  id: string;
  entity_id: string;
  metric_period: string;
  quality_score?: number;
  customer_satisfaction?: number;
  on_time_delivery_rate?: number;
  overall_rating?: number;
}

export interface RegistryFilters {
  entity_type?: string;
  category?: string;
  location?: string;
  status?: string;
  tags?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

export interface SearchParams {
  query?: string;
  semantic?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Main registry management hook
export function useRegistry(entityType: 'yacht' | 'business_entity' | 'product_service' | 'contact') {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState({
    total_count: 0,
    filtered_count: 0,
    page_size: 50,
    current_page: 1
  });
  const { toast } = useToast();

  const callRegistryAPI = useCallback(async (action: string, requestData?: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('centralized-registry', {
        body: {
          action,
          entity_type: entityType,
          ...requestData
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Registry ${action} error:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} ${entityType}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [entityType, toast]);

  const search = useCallback(async (
    searchParams?: SearchParams,
    filters?: RegistryFilters,
    options?: any
  ) => {
    setLoading(true);
    try {
      const result = await callRegistryAPI('search', {
        search_params: searchParams,
        filters,
        options
      });

      setData(result.data || []);
      setMetadata(result.metadata || metadata);
      return result;
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI, metadata]);

  const list = useCallback(async (
    filters?: RegistryFilters,
    searchParams?: SearchParams,
    options?: any
  ) => {
    setLoading(true);
    try {
      const result = await callRegistryAPI('list', {
        filters,
        search_params: searchParams,
        options
      });

      setData(result.data || []);
      setMetadata(result.metadata || metadata);
      return result;
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI, metadata]);

  const get = useCallback(async (id: string, options?: any) => {
    setLoading(true);
    try {
      const result = await callRegistryAPI('get', {
        data: { id },
        options
      });
      return result.data;
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI]);

  const create = useCallback(async (entityData: any, options?: any) => {
    setLoading(true);
    try {
      const result = await callRegistryAPI('create', {
        data: entityData,
        options
      });

      toast({
        title: "Success",
        description: `${entityType} created successfully`,
      });

      // Refresh data
      await list();
      return result.data;
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI, entityType, toast, list]);

  const update = useCallback(async (id: string, updates: any, options?: any) => {
    setLoading(true);
    try {
      const result = await callRegistryAPI('update', {
        data: { id, ...updates },
        options
      });

      toast({
        title: "Success",
        description: `${entityType} updated successfully`,
      });

      // Update local data
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      
      return result.data;
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI, entityType, toast]);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await callRegistryAPI('delete', {
        data: { id }
      });

      toast({
        title: "Success",
        description: `${entityType} deleted successfully`,
      });

      // Remove from local data
      setData(prev => prev.filter(item => item.id !== id));
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI, entityType, toast]);

  const exportData = useCallback(async (
    filters?: RegistryFilters,
    format: 'json' | 'csv' = 'json',
    fields?: string[]
  ) => {
    setLoading(true);
    try {
      const result = await callRegistryAPI('export', {
        filters,
        data: { format, fields }
      });
      return result.data;
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI]);

  const importData = useCallback(async (
    sourceData: any,
    format: 'json' | 'csv' = 'json',
    mapping?: any
  ) => {
    setLoading(true);
    try {
      const result = await callRegistryAPI('import', {
        data: {
          format,
          source_data: sourceData,
          mapping
        }
      });

      toast({
        title: "Import Complete",
        description: `${result.data.successful} records imported successfully`,
      });

      // Refresh data
      await list();
      return result.data;
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI, toast, list]);

  return {
    data,
    loading,
    metadata,
    search,
    list,
    get,
    create,
    update,
    remove,
    exportData,
    importData
  };
}

// Yacht registry specific hook
export function useYachtRegistry() {
  const registry = useRegistry('yacht');
  const { toast } = useToast();

  const searchYachts = useCallback(async (
    query?: string,
    filters?: {
      yacht_type?: string;
      yacht_category?: string;
      location?: string;
      length_range?: { min: number; max: number };
      year_range?: { min: number; max: number };
    }
  ) => {
    const registryFilters: RegistryFilters = {};
    
    if (filters?.yacht_type) registryFilters.entity_type = filters.yacht_type;
    if (filters?.location) registryFilters.location = filters.location;

    return await registry.search(
      { query, semantic: !!query },
      registryFilters,
      { include_related: true }
    );
  }, [registry]);

  const createYacht = useCallback(async (yachtData: Partial<YachtRegistryEntry>) => {
    // Validate required fields
    if (!yachtData.yacht_name || !yachtData.yacht_type || !yachtData.yacht_category) {
      throw new Error('Yacht name, type, and category are required');
    }

    return await registry.create(yachtData, { generate_embeddings: true });
  }, [registry]);

  const updateYachtLocation = useCallback(async (
    yachtId: string,
    location: { lat: number; lng: number; port_name: string; country: string }
  ) => {
    return await registry.update(yachtId, {
      current_location: location,
      updated_at: new Date().toISOString()
    });
  }, [registry]);

  return {
    ...registry,
    searchYachts,
    createYacht,
    updateYachtLocation
  };
}

// Business entities hook
export function useBusinessEntities() {
  const registry = useRegistry('business_entity');
  const { toast } = useToast();

  const searchEntities = useCallback(async (
    query?: string,
    filters?: {
      entity_type?: string;
      industry_category?: string[];
      location?: string;
      status?: string;
      quality_rating?: { min: number; max: number };
    }
  ) => {
    const registryFilters: RegistryFilters = {};
    
    if (filters?.entity_type) registryFilters.entity_type = filters.entity_type;
    if (filters?.location) registryFilters.location = filters.location;
    if (filters?.status) registryFilters.status = filters.status;

    return await registry.search(
      { query, semantic: !!query },
      registryFilters,
      { 
        include_related: true,
        include_contacts: true,
        include_performance: true
      }
    );
  }, [registry]);

  const createEntity = useCallback(async (entityData: Partial<BusinessEntity>) => {
    // Validate required fields
    if (!entityData.entity_name || !entityData.entity_type) {
      throw new Error('Entity name and type are required');
    }

    return await registry.create({
      ...entityData,
      addresses: entityData.addresses || [],
      industry_category: entityData.industry_category || [],
      account_status: entityData.account_status || 'active'
    }, { generate_embeddings: true });
  }, [registry]);

  const updateEntityStatus = useCallback(async (
    entityId: string,
    status: 'active' | 'inactive' | 'suspended' | 'blacklisted'
  ) => {
    return await registry.update(entityId, {
      account_status: status
    });
  }, [registry]);

  const rateEntity = useCallback(async (
    entityId: string,
    ratings: {
      quality_rating?: number;
      reliability_score?: number;
    }
  ) => {
    return await registry.update(entityId, ratings);
  }, [registry]);

  return {
    ...registry,
    searchEntities,
    createEntity,
    updateEntityStatus,
    rateEntity
  };
}

// Product/Service catalog hook
export function useProductServiceCatalog() {
  const registry = useRegistry('product_service');

  const searchCatalog = useCallback(async (
    query?: string,
    filters?: {
      category?: string;
      supplier_id?: string;
      availability_status?: string;
      price_range?: { min: number; max: number };
    }
  ) => {
    const registryFilters: RegistryFilters = {};
    
    if (filters?.category) registryFilters.category = filters.category;
    if (filters?.availability_status) registryFilters.status = filters.availability_status;

    return await registry.search(
      { query, semantic: !!query },
      registryFilters,
      { include_related: true }
    );
  }, [registry]);

  const createProduct = useCallback(async (productData: Partial<ProductService>) => {
    // Validate required fields
    if (!productData.supplier_id || !productData.item_name || !productData.catalog_type || !productData.category) {
      throw new Error('Supplier ID, item name, catalog type, and category are required');
    }

    return await registry.create({
      ...productData,
      currency: productData.currency || 'USD',
      availability_status: productData.availability_status || 'available'
    }, { generate_embeddings: true });
  }, [registry]);

  const updateAvailability = useCallback(async (
    productId: string,
    status: 'available' | 'limited' | 'backorder' | 'discontinued'
  ) => {
    return await registry.update(productId, {
      availability_status: status
    });
  }, [registry]);

  const updatePricing = useCallback(async (
    productId: string,
    pricing: {
      base_price: number;
      currency: string;
      pricing_tiers?: any;
    }
  ) => {
    return await registry.update(productId, pricing);
  }, [registry]);

  return {
    ...registry,
    searchCatalog,
    createProduct,
    updateAvailability,
    updatePricing
  };
}

// Entity relationships hook
export function useEntityRelationships() {
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callRegistryAPI = useCallback(async (action: string, requestData?: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('centralized-registry', {
        body: {
          action,
          entity_type: 'relationship',
          ...requestData
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Relationship ${action} error:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} relationship`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const getEntityRelationships = useCallback(async (entityId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entity_relationships')
        .select(`
          *,
          entity_a:business_entities!entity_a_id(id, entity_name, entity_type),
          entity_b:business_entities!entity_b_id(id, entity_name, entity_type)
        `)
        .or(`entity_a_id.eq.${entityId},entity_b_id.eq.${entityId}`)
        .eq('relationship_status', 'active');

      if (error) throw error;
      setRelationships(data || []);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRelationship = useCallback(async (
    entityAId: string,
    entityBId: string,
    relationshipType: string,
    details?: any
  ) => {
    setLoading(true);
    try {
      const result = await callRegistryAPI('relate', {
        data: {
          action: 'create',
          entity_a_id: entityAId,
          entity_b_id: entityBId,
          relationship_type: relationshipType,
          ...details
        }
      });

      toast({
        title: "Success",
        description: "Relationship created successfully",
      });

      return result.data;
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI, toast]);

  const deleteRelationship = useCallback(async (
    entityAId: string,
    entityBId: string,
    relationshipType: string
  ) => {
    setLoading(true);
    try {
      await callRegistryAPI('relate', {
        data: {
          action: 'delete',
          entity_a_id: entityAId,
          entity_b_id: entityBId,
          relationship_type: relationshipType
        }
      });

      toast({
        title: "Success",
        description: "Relationship deleted successfully",
      });

      // Remove from local state
      setRelationships(prev => prev.filter(r => 
        !(r.entity_a_id === entityAId && r.entity_b_id === entityBId && r.relationship_type === relationshipType)
      ));
    } finally {
      setLoading(false);
    }
  }, [callRegistryAPI, toast]);

  return {
    relationships,
    loading,
    getEntityRelationships,
    createRelationship,
    deleteRelationship
  };
}

// Registry analytics hook
export function useRegistryAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getAnalytics = useCallback(async (filters?: RegistryFilters) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('centralized-registry', {
        body: {
          action: 'analyze',
          entity_type: 'business_entity', // Primary type for analytics
          filters
        }
      });

      if (error) throw error;
      setAnalytics(data.analytics);
      return data.analytics;
    } catch (error) {
      console.error('Analytics error:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshAnalytics = useCallback(() => {
    return getAnalytics();
  }, [getAnalytics]);

  useEffect(() => {
    getAnalytics();
  }, [getAnalytics]);

  return {
    analytics,
    loading,
    getAnalytics,
    refreshAnalytics
  };
}

// Global registry search hook
export function useGlobalRegistrySearch() {
  const [searchResults, setSearchResults] = useState({
    yachts: [],
    entities: [],
    products: [],
    total: 0
  });
  const [loading, setLoading] = useState(false);

  const globalSearch = useCallback(async (
    query: string,
    options?: {
      semantic?: boolean;
      entity_types?: string[];
      limit?: number;
    }
  ) => {
    if (!query.trim()) {
      setSearchResults({ yachts: [], entities: [], products: [], total: 0 });
      return;
    }

    setLoading(true);
    try {
      const searchPromises = [];
      const entityTypes = options?.entity_types || ['yacht', 'business_entity', 'product_service'];

      // Search across all entity types
      for (const entityType of entityTypes) {
        searchPromises.push(
          supabase.functions.invoke('centralized-registry', {
            body: {
              action: 'search',
              entity_type: entityType,
              search_params: {
                query,
                semantic: options?.semantic || false,
                limit: options?.limit || 10
              }
            }
          })
        );
      }

      const results = await Promise.all(searchPromises);
      
      const searchData = {
        yachts: results[0]?.data?.data || [],
        entities: results[1]?.data?.data || [],
        products: results[2]?.data?.data || [],
        total: 0
      };

      searchData.total = searchData.yachts.length + searchData.entities.length + searchData.products.length;
      setSearchResults(searchData);
      
      return searchData;
    } catch (error) {
      console.error('Global search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchResults,
    loading,
    globalSearch
  };
}