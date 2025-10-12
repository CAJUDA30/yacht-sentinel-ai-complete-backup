import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistryRequest {
  action: 'search' | 'create' | 'update' | 'delete' | 'get' | 'list' | 'relate' | 'analyze' | 'import' | 'export';
  entity_type: 'yacht' | 'business_entity' | 'contact' | 'product_service' | 'relationship' | 'performance';
  data?: any;
  filters?: {
    entity_type?: string;
    category?: string;
    location?: string;
    status?: string;
    tags?: string[];
    date_range?: { start: string; end: string };
  };
  search_params?: {
    query?: string;
    semantic?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  };
  options?: {
    include_related?: boolean;
    include_performance?: boolean;
    include_contacts?: boolean;
    generate_embeddings?: boolean;
  };
}

interface RegistryResponse {
  success: boolean;
  data?: any;
  metadata?: {
    total_count: number;
    filtered_count: number;
    page_size: number;
    current_page: number;
  };
  analytics?: any;
  error?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenAI configuration
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: RegistryRequest = await req.json();
    console.log(`🏛️ Registry operation: ${request.action} for ${request.entity_type}`);

    let result: RegistryResponse;

    switch (request.action) {
      case 'search':
        result = await handleSearch(request);
        break;
      case 'create':
        result = await handleCreate(request);
        break;
      case 'update':
        result = await handleUpdate(request);
        break;
      case 'delete':
        result = await handleDelete(request);
        break;
      case 'get':
        result = await handleGet(request);
        break;
      case 'list':
        result = await handleList(request);
        break;
      case 'relate':
        result = await handleRelationship(request);
        break;
      case 'analyze':
        result = await handleAnalytics(request);
        break;
      case 'import':
        result = await handleImport(request);
        break;
      case 'export':
        result = await handleExport(request);
        break;
      default:
        throw new Error(`Unsupported action: ${request.action}`);
    }

    // Log the operation
    await logRegistryOperation(request, result);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 Registry operation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Registry operation failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleSearch(request: RegistryRequest): Promise<RegistryResponse> {
  const { entity_type, search_params, filters, options } = request;
  const { query, semantic, limit = 50, offset = 0, sort_by, sort_order = 'desc' } = search_params || {};

  console.log(`🔍 Searching ${entity_type} with query: "${query}"`);

  if (semantic && query) {
    return await handleSemanticSearch(entity_type, query, limit, offset, filters);
  }

  // Regular search with filters
  const tableName = getTableName(entity_type);
  let queryBuilder = supabase.from(tableName).select('*', { count: 'exact' });

  // Apply text search if query provided
  if (query) {
    queryBuilder = queryBuilder.textSearch('search_vector', query);
  }

  // Apply filters
  if (filters) {
    queryBuilder = applyFilters(queryBuilder, filters, entity_type);
  }

  // Apply sorting
  if (sort_by) {
    queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' });
  } else {
    queryBuilder = queryBuilder.order('updated_at', { ascending: false });
  }

  // Apply pagination
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;
  if (error) throw error;

  // Enhance results with related data if requested
  const enhancedData = options?.include_related ? 
    await enhanceWithRelatedData(data, entity_type, options) : data;

  return {
    success: true,
    data: enhancedData,
    metadata: {
      total_count: count || 0,
      filtered_count: data?.length || 0,
      page_size: limit,
      current_page: Math.floor(offset / limit) + 1
    }
  };
}

async function handleSemanticSearch(
  entityType: string, 
  query: string, 
  limit: number, 
  offset: number, 
  filters?: any
): Promise<RegistryResponse> {
  // Generate embedding for the search query
  const embedding = await generateEmbedding(query);
  if (!embedding) {
    throw new Error('Failed to generate embedding for semantic search');
  }

  // Search using vector similarity
  let queryBuilder = supabase.rpc('search_registry_semantic', {
    query_embedding: embedding,
    match_entity_type: entityType,
    match_threshold: 0.8,
    match_count: limit
  });

  const { data, error } = await queryBuilder;
  if (error) throw error;

  return {
    success: true,
    data: data || [],
    metadata: {
      total_count: data?.length || 0,
      filtered_count: data?.length || 0,
      page_size: limit,
      current_page: Math.floor(offset / limit) + 1
    }
  };
}

async function handleCreate(request: RegistryRequest): Promise<RegistryResponse> {
  const { entity_type, data, options } = request;
  const tableName = getTableName(entity_type);

  console.log(`➕ Creating ${entity_type} entity`);

  // Validate required fields
  validateEntityData(entity_type, data);

  // Add metadata
  const entityData = {
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: created, error } = await supabase
    .from(tableName)
    .insert(entityData)
    .select()
    .single();

  if (error) throw error;

  // Generate embeddings if requested
  if (options?.generate_embeddings) {
    await generateEntityEmbedding(entity_type, created);
  }

  return {
    success: true,
    data: created
  };
}

async function handleUpdate(request: RegistryRequest): Promise<RegistryResponse> {
  const { entity_type, data } = request;
  const tableName = getTableName(entity_type);
  const entityId = data.id;

  if (!entityId) {
    throw new Error('Entity ID is required for updates');
  }

  console.log(`📝 Updating ${entity_type} entity: ${entityId}`);

  const updateData = {
    ...data,
    updated_at: new Date().toISOString()
  };
  delete updateData.id; // Remove ID from update data

  const { data: updated, error } = await supabase
    .from(tableName)
    .update(updateData)
    .eq('id', entityId)
    .select()
    .single();

  if (error) throw error;

  // Update embeddings
  await generateEntityEmbedding(entity_type, updated);

  return {
    success: true,
    data: updated
  };
}

async function handleDelete(request: RegistryRequest): Promise<RegistryResponse> {
  const { entity_type, data } = request;
  const tableName = getTableName(entity_type);
  const entityId = data.id;

  if (!entityId) {
    throw new Error('Entity ID is required for deletion');
  }

  console.log(`🗑️ Deleting ${entity_type} entity: ${entityId}`);

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', entityId);

  if (error) throw error;

  // Clean up embeddings
  await supabase
    .from('registry_embeddings')
    .delete()
    .eq('entity_type', entity_type)
    .eq('entity_id', entityId);

  return {
    success: true,
    data: { deleted: true, id: entityId }
  };
}

async function handleGet(request: RegistryRequest): Promise<RegistryResponse> {
  const { entity_type, data, options } = request;
  const tableName = getTableName(entity_type);
  const entityId = data.id;

  if (!entityId) {
    throw new Error('Entity ID is required');
  }

  console.log(`👁️ Getting ${entity_type} entity: ${entityId}`);

  const { data: entity, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', entityId)
    .single();

  if (error) throw error;

  // Enhance with related data if requested
  const enhancedEntity = options?.include_related ? 
    await enhanceWithRelatedData([entity], entity_type, options) : [entity];

  return {
    success: true,
    data: enhancedEntity[0]
  };
}

async function handleList(request: RegistryRequest): Promise<RegistryResponse> {
  const { entity_type, filters, search_params, options } = request;
  const { limit = 50, offset = 0, sort_by, sort_order = 'desc' } = search_params || {};

  console.log(`📋 Listing ${entity_type} entities`);

  const tableName = getTableName(entity_type);
  let queryBuilder = supabase.from(tableName).select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    queryBuilder = applyFilters(queryBuilder, filters, entity_type);
  }

  // Apply sorting
  if (sort_by) {
    queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' });
  } else {
    queryBuilder = queryBuilder.order('updated_at', { ascending: false });
  }

  // Apply pagination
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;
  if (error) throw error;

  return {
    success: true,
    data: data || [],
    metadata: {
      total_count: count || 0,
      filtered_count: data?.length || 0,
      page_size: limit,
      current_page: Math.floor(offset / limit) + 1
    }
  };
}

async function handleRelationship(request: RegistryRequest): Promise<RegistryResponse> {
  const { data } = request;
  const { entity_a_id, entity_b_id, relationship_type, action = 'create' } = data;

  console.log(`🔗 ${action} relationship: ${relationship_type} between entities`);

  if (action === 'create') {
    const { data: relationship, error } = await supabase
      .from('entity_relationships')
      .upsert({
        entity_a_id,
        entity_b_id,
        relationship_type,
        relationship_status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: relationship };
  } else if (action === 'delete') {
    const { error } = await supabase
      .from('entity_relationships')
      .delete()
      .eq('entity_a_id', entity_a_id)
      .eq('entity_b_id', entity_b_id)
      .eq('relationship_type', relationship_type);

    if (error) throw error;
    return { success: true, data: { deleted: true } };
  }

  throw new Error(`Unsupported relationship action: ${action}`);
}

async function handleAnalytics(request: RegistryRequest): Promise<RegistryResponse> {
  const { entity_type, filters } = request;

  console.log(`📊 Generating analytics for ${entity_type}`);

  // Get entity counts by type
  const entityCounts = await getEntityCounts();
  
  // Get performance metrics
  const performanceMetrics = await getPerformanceMetrics(filters);
  
  // Get geographical distribution
  const geographicalData = await getGeographicalDistribution(entity_type);
  
  // Get activity trends
  const activityTrends = await getActivityTrends(filters);

  return {
    success: true,
    analytics: {
      entity_counts: entityCounts,
      performance_metrics: performanceMetrics,
      geographical_distribution: geographicalData,
      activity_trends: activityTrends,
      generated_at: new Date().toISOString()
    }
  };
}

async function handleImport(request: RegistryRequest): Promise<RegistryResponse> {
  const { entity_type, data } = request;
  const { format, source_data, mapping } = data;

  console.log(`📥 Importing ${entity_type} data from ${format}`);

  const tableName = getTableName(entity_type);
  const importResults = {
    total_records: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    // Process import data based on format
    let processedData = [];
    
    if (format === 'csv') {
      processedData = await processCSVImport(source_data, mapping);
    } else if (format === 'json') {
      processedData = source_data;
    } else {
      throw new Error(`Unsupported import format: ${format}`);
    }

    importResults.total_records = processedData.length;

    // Batch insert with error handling
    for (const record of processedData) {
      try {
        validateEntityData(entity_type, record);
        
        const { error } = await supabase
          .from(tableName)
          .insert({
            ...record,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        importResults.successful++;
      } catch (error) {
        importResults.failed++;
        importResults.errors.push(`Record ${importResults.successful + importResults.failed}: ${error.message}`);
      }
    }

  } catch (error) {
    throw new Error(`Import failed: ${error.message}`);
  }

  return {
    success: true,
    data: importResults
  };
}

async function handleExport(request: RegistryRequest): Promise<RegistryResponse> {
  const { entity_type, filters, data } = request;
  const { format = 'json', fields } = data || {};

  console.log(`📤 Exporting ${entity_type} data to ${format}`);

  const tableName = getTableName(entity_type);
  let queryBuilder = supabase.from(tableName).select(fields ? fields.join(',') : '*');

  // Apply filters
  if (filters) {
    queryBuilder = applyFilters(queryBuilder, filters, entity_type);
  }

  const { data: exportData, error } = await queryBuilder;
  if (error) throw error;

  // Format data based on requested format
  let formattedData;
  if (format === 'csv') {
    formattedData = await formatAsCSV(exportData);
  } else {
    formattedData = exportData;
  }

  return {
    success: true,
    data: {
      format,
      record_count: exportData?.length || 0,
      export_data: formattedData,
      exported_at: new Date().toISOString()
    }
  };
}

// Helper functions

function getTableName(entityType: string): string {
  const tableMap = {
    'yacht': 'yacht_registry',
    'business_entity': 'business_entities',
    'contact': 'entity_contacts',
    'product_service': 'product_service_catalog',
    'relationship': 'entity_relationships',
    'performance': 'entity_performance_metrics'
  };
  
  return tableMap[entityType] || entityType;
}

function validateEntityData(entityType: string, data: any): void {
  const requiredFields = {
    'yacht': ['yacht_name', 'yacht_type', 'yacht_category'],
    'business_entity': ['entity_name', 'entity_type'],
    'contact': ['entity_id', 'first_name', 'last_name', 'contact_type'],
    'product_service': ['supplier_id', 'item_name', 'catalog_type', 'category'],
    'relationship': ['entity_a_id', 'entity_b_id', 'relationship_type'],
    'performance': ['entity_id', 'metric_period']
  };

  const required = requiredFields[entityType] || [];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Required field missing: ${field}`);
    }
  }
}

function applyFilters(queryBuilder: any, filters: any, entityType: string): any {
  if (filters.entity_type) {
    queryBuilder = queryBuilder.eq('entity_type', filters.entity_type);
  }
  
  if (filters.category) {
    queryBuilder = queryBuilder.eq('category', filters.category);
  }
  
  if (filters.status) {
    if (entityType === 'yacht') {
      queryBuilder = queryBuilder.eq('is_active', filters.status === 'active');
    } else {
      queryBuilder = queryBuilder.eq('account_status', filters.status);
    }
  }
  
  if (filters.tags && filters.tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', filters.tags);
  }
  
  if (filters.date_range) {
    queryBuilder = queryBuilder
      .gte('updated_at', filters.date_range.start)
      .lte('updated_at', filters.date_range.end);
  }
  
  if (filters.location) {
    // Location-based filtering for yachts and business entities
    if (entityType === 'yacht') {
      queryBuilder = queryBuilder.ilike('home_port', `%${filters.location}%`);
    } else if (entityType === 'business_entity') {
      queryBuilder = queryBuilder.like('addresses', `%${filters.location}%`);
    }
  }

  return queryBuilder;
}

async function enhanceWithRelatedData(entities: any[], entityType: string, options: any): Promise<any[]> {
  const enhanced = [];

  for (const entity of entities) {
    const enhancedEntity = { ...entity };

    if (options.include_contacts && entityType === 'business_entity') {
      const { data: contacts } = await supabase
        .from('entity_contacts')
        .select('*')
        .eq('entity_id', entity.id);
      enhancedEntity.contacts = contacts || [];
    }

    if (options.include_performance && entityType === 'business_entity') {
      const { data: performance } = await supabase
        .from('entity_performance_metrics')
        .select('*')
        .eq('entity_id', entity.id)
        .order('metric_period', { ascending: false })
        .limit(12); // Last 12 months
      enhancedEntity.performance_history = performance || [];
    }

    if (options.include_related) {
      // Get relationships
      const { data: relationships } = await supabase
        .from('entity_relationships')
        .select(`
          *,
          entity_a:business_entities!entity_a_id(entity_name, entity_type),
          entity_b:business_entities!entity_b_id(entity_name, entity_type)
        `)
        .or(`entity_a_id.eq.${entity.id},entity_b_id.eq.${entity.id}`)
        .eq('relationship_status', 'active');
      enhancedEntity.relationships = relationships || [];
    }

    enhanced.push(enhancedEntity);
  }

  return enhanced;
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!openaiApiKey) {
    console.warn('OpenAI API key not configured, skipping embedding generation');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

async function generateEntityEmbedding(entityType: string, entity: any): Promise<void> {
  // Create searchable text content for the entity
  let searchContent = '';
  
  switch (entityType) {
    case 'yacht':
      searchContent = `${entity.yacht_name} ${entity.yacht_type} ${entity.builder} ${entity.home_port}`;
      break;
    case 'business_entity':
      searchContent = `${entity.entity_name} ${entity.entity_type} ${entity.industry_category?.join(' ')} ${entity.notes}`;
      break;
    case 'product_service':
      searchContent = `${entity.item_name} ${entity.item_description} ${entity.category} ${entity.manufacturer}`;
      break;
  }

  if (!searchContent.trim()) return;

  const embedding = await generateEmbedding(searchContent);
  if (!embedding) return;

  // Store embedding
  await supabase
    .from('registry_embeddings')
    .upsert({
      entity_type: entityType,
      entity_id: entity.id,
      content_hash: btoa(searchContent).slice(0, 32),
      embedding: embedding,
      metadata: {
        entity_name: entity.yacht_name || entity.entity_name || entity.item_name,
        generated_at: new Date().toISOString()
      }
    });
}

async function getEntityCounts(): Promise<any> {
  const counts = {};
  
  const tables = ['yacht_registry', 'business_entities', 'product_service_catalog'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      counts[table] = count;
    }
  }
  
  return counts;
}

async function getPerformanceMetrics(filters: any): Promise<any> {
  const { data, error } = await supabase
    .from('entity_performance_metrics')
    .select('*')
    .order('metric_period', { ascending: false })
    .limit(100);

  if (error) return {};

  // Calculate aggregate metrics
  const totalEntities = new Set(data.map(m => m.entity_id)).size;
  const avgQuality = data.reduce((sum, m) => sum + (m.quality_score || 0), 0) / data.length;
  const avgSatisfaction = data.reduce((sum, m) => sum + (m.customer_satisfaction || 0), 0) / data.length;

  return {
    total_entities_tracked: totalEntities,
    average_quality_score: avgQuality,
    average_satisfaction: avgSatisfaction,
    total_transactions: data.reduce((sum, m) => sum + (m.transactions_count || 0), 0)
  };
}

async function getGeographicalDistribution(entityType: string): Promise<any> {
  if (entityType === 'yacht') {
    const { data, error } = await supabase
      .from('yacht_registry')
      .select('home_port, current_location');
      
    if (error) return {};
    
    // Group by country/region
    const distribution = {};
    data.forEach(yacht => {
      const location = yacht.current_location?.country || yacht.home_port || 'Unknown';
      distribution[location] = (distribution[location] || 0) + 1;
    });
    
    return distribution;
  }
  
  return {};
}

async function getActivityTrends(filters: any): Promise<any> {
  const { data, error } = await supabase
    .from('registry_activity_log')
    .select('action_type, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (error) return {};

  // Group by day and action type
  const trends = {};
  data.forEach(activity => {
    const date = activity.created_at.split('T')[0];
    if (!trends[date]) trends[date] = {};
    trends[date][activity.action_type] = (trends[date][activity.action_type] || 0) + 1;
  });

  return trends;
}

async function processCSVImport(csvData: string, mapping: any): Promise<any[]> {
  // Simple CSV parsing - in production, use a proper CSV parser
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    const record = {};
    
    headers.forEach((header, index) => {
      const mappedField = mapping[header] || header;
      record[mappedField] = values[index];
    });
    
    data.push(record);
  }

  return data;
}

async function formatAsCSV(data: any[]): Promise<string> {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(',')];

  data.forEach(record => {
    const values = headers.map(header => {
      const value = record[header];
      // Handle complex values
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/"/g, '""');
      }
      return String(value || '').replace(/"/g, '""');
    });
    csvLines.push(values.join(','));
  });

  return csvLines.join('\n');
}

async function logRegistryOperation(request: RegistryRequest, result: RegistryResponse): Promise<void> {
  try {
    await supabase.from('registry_activity_log').insert({
      entity_type: request.entity_type,
      entity_id: request.data?.id || null,
      action_type: request.action,
      changes: {
        request_params: request,
        result_success: result.success,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log registry operation:', error);
  }
}