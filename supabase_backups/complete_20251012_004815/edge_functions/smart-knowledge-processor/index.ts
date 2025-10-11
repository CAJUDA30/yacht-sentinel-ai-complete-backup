import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartKnowledgeItem {
  id?: string;
  title: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'document' | 'scan_result';
  module: string;
  tags: string[];
  embedding_vector?: number[];
  confidence_score?: number;
  source_type: 'user_generated' | 'ai_extracted' | 'manual_upload' | 'scan_result';
  yacht_id?: string;
  is_shared: boolean;
  access_level: 'private' | 'yacht' | 'fleet' | 'public';
  created_by: string;
  metadata: Record<string, any>;
}

interface KnowledgeSearch {
  query: string;
  module?: string;
  content_types?: string[];
  max_results?: number;
  similarity_threshold?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID from JWT token
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || 'anonymous';
      } catch (error) {
        console.log('Could not authenticate user:', error.message);
      }
    }

    switch (action) {
      case 'get_all':
        return await getAllKnowledgeItems(supabase, userId);
        
      case 'search':
        return await searchKnowledge(supabase, data as KnowledgeSearch, userId);
        
      case 'add_item':
        return await addKnowledgeItem(supabase, { ...data, created_by: userId });
        
      case 'update_item':
        return await updateKnowledgeItem(supabase, data.id, data.updates, userId);
        
      case 'delete_item':
        return await deleteKnowledgeItem(supabase, data.id, userId);
        
      case 'process_scan':
        return await processScanToKnowledge(supabase, data.scan_result, userId);
        
      case 'get_contextual':
        return await getContextualKnowledge(supabase, data.module, data.context, userId);
        
      case 'sync_fleet':
        return await syncFleetKnowledge(supabase, userId);
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Smart knowledge error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getAllKnowledgeItems(supabase: any, userId: string) {
  try {
    const { data: items, error } = await supabase
      .from('smart_knowledge_items')
      .select('*')
      .or(`created_by.eq.${userId},access_level.in.("public","fleet")`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(items || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to get knowledge items: ${error.message}`);
  }
}

async function searchKnowledge(supabase: any, searchParams: KnowledgeSearch, userId: string) {
  try {
    // Generate embedding for search query using OpenAI
    const embedding = await generateEmbedding(searchParams.query);
    
    // Perform semantic search using vector similarity
    let query = supabase
      .from('smart_knowledge_items')
      .select('*, similarity')
      .or(`created_by.eq.${userId},access_level.in.("public","fleet")`);

    if (searchParams.module) {
      query = query.eq('module', searchParams.module);
    }

    if (searchParams.content_types && searchParams.content_types.length > 0) {
      query = query.in('content_type', searchParams.content_types);
    }

    // Use RPC function for vector similarity search if available
    // For now, fall back to text search
    const { data: items, error } = await query
      .textSearch('content', searchParams.query, { type: 'websearch' })
      .limit(searchParams.max_results || 10);

    if (error) throw error;

    // Calculate relevance scores and format results
    const results = (items || []).map(item => ({
      item: {
        id: item.id,
        title: item.title,
        content: item.content,
        content_type: item.content_type,
        module: item.module,
        tags: item.tags || [],
        source_type: item.source_type,
        is_shared: item.is_shared,
        access_level: item.access_level,
        created_by: item.created_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
        metadata: item.metadata || {}
      },
      similarity_score: calculateTextSimilarity(searchParams.query, item.content + ' ' + item.title),
      relevance_explanation: generateRelevanceExplanation(searchParams.query, item)
    }))
    .filter(result => result.similarity_score > (searchParams.similarity_threshold || 0.3))
    .sort((a, b) => b.similarity_score - a.similarity_score);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to search knowledge: ${error.message}`);
  }
}

async function addKnowledgeItem(supabase: any, item: SmartKnowledgeItem) {
  try {
    // Generate embedding for content
    const embedding = await generateEmbedding(item.content + ' ' + item.title);

    const { data, error } = await supabase
      .from('smart_knowledge_items')
      .insert({
        ...item,
        embedding_vector: embedding,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to add knowledge item: ${error.message}`);
  }
}

async function updateKnowledgeItem(supabase: any, id: string, updates: Partial<SmartKnowledgeItem>, userId: string) {
  try {
    // Re-generate embedding if content or title changed
    let embedding;
    if (updates.content || updates.title) {
      const { data: existing } = await supabase
        .from('smart_knowledge_items')
        .select('title, content')
        .eq('id', id)
        .single();
      
      const newTitle = updates.title || existing?.title || '';
      const newContent = updates.content || existing?.content || '';
      embedding = await generateEmbedding(newContent + ' ' + newTitle);
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (embedding) {
      updateData.embedding_vector = embedding;
    }

    const { data, error } = await supabase
      .from('smart_knowledge_items')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to update knowledge item: ${error.message}`);
  }
}

async function deleteKnowledgeItem(supabase: any, id: string, userId: string) {
  try {
    const { error } = await supabase
      .from('smart_knowledge_items')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to delete knowledge item: ${error.message}`);
  }
}

async function processScanToKnowledge(supabase: any, scanResult: any, userId: string) {
  try {
    if (!scanResult.extractedData) {
      throw new Error('No extracted data in scan result');
    }

    const knowledgeItem: SmartKnowledgeItem = {
      title: scanResult.extractedData.productName || scanResult.extractedData.title || 'Scanned Item',
      content: generateKnowledgeContent(scanResult.extractedData),
      content_type: 'scan_result',
      module: scanResult.module || 'inventory',
      tags: extractTags(scanResult.extractedData),
      confidence_score: scanResult.confidence,
      source_type: 'ai_extracted',
      is_shared: false,
      access_level: 'private',
      created_by: userId,
      metadata: {
        scan_session_id: scanResult.sessionId,
        ai_analysis: scanResult.aiAnalysis,
        scan_timestamp: scanResult.timestamp,
        extracted_data: scanResult.extractedData
      }
    };

    return await addKnowledgeItem(supabase, knowledgeItem);

  } catch (error) {
    throw new Error(`Failed to process scan to knowledge: ${error.message}`);
  }
}

async function getContextualKnowledge(supabase: any, module: string, context: Record<string, any>, userId: string) {
  try {
    // Build contextual search query
    const contextQuery = Object.entries(context)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' ');

    const searchParams: KnowledgeSearch = {
      query: contextQuery,
      module: module,
      max_results: 5,
      similarity_threshold: 0.4
    };

    return await searchKnowledge(supabase, searchParams, userId);

  } catch (error) {
    throw new Error(`Failed to get contextual knowledge: ${error.message}`);
  }
}

async function syncFleetKnowledge(supabase: any, userId: string) {
  try {
    // Get user's yacht/fleet information
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('yacht_id, fleet_id')
      .eq('id', userId)
      .single();

    if (!userProfile?.fleet_id) {
      throw new Error('No fleet association found');
    }

    // Sync fleet-level knowledge items
    const { data: fleetKnowledge, error } = await supabase
      .from('smart_knowledge_items')
      .select('*')
      .eq('access_level', 'fleet')
      .neq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      synced_items: fleetKnowledge?.length || 0,
      items: fleetKnowledge || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to sync fleet knowledge: ${error.message}`);
  }
}

// Helper functions

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.log('No OpenAI API key, returning mock embedding');
      return new Array(1536).fill(0).map(() => Math.random() - 0.5);
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.substring(0, 8000), // Limit text length
        model: 'text-embedding-3-small'
      })
    });

    const data = await response.json();
    return data.data[0].embedding;

  } catch (error) {
    console.error('Embedding generation error:', error);
    // Return mock embedding on error
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
  }
}

function calculateTextSimilarity(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const contentWords = content.toLowerCase().split(/\s+/);
  
  const querySet = new Set(queryWords);
  const contentSet = new Set(contentWords);
  
  const intersection = new Set([...querySet].filter(x => contentSet.has(x)));
  const union = new Set([...querySet, ...contentSet]);
  
  return intersection.size / union.size;
}

function generateRelevanceExplanation(query: string, item: any): string {
  const queryWords = query.toLowerCase().split(/\s+/);
  const matchingWords = queryWords.filter(word => 
    item.content.toLowerCase().includes(word) || 
    item.title.toLowerCase().includes(word) ||
    item.tags?.some((tag: string) => tag.toLowerCase().includes(word))
  );

  if (matchingWords.length > 0) {
    return `Matches: ${matchingWords.join(', ')}`;
  }
  
  return 'Contextual relevance';
}

function generateKnowledgeContent(extractedData: any): string {
  const parts = [];
  
  if (extractedData.productName) parts.push(`Product: ${extractedData.productName}`);
  if (extractedData.description) parts.push(`Description: ${extractedData.description}`);
  if (extractedData.manufacturer) parts.push(`Manufacturer: ${extractedData.manufacturer}`);
  if (extractedData.model) parts.push(`Model: ${extractedData.model}`);
  if (extractedData.specifications) parts.push(`Specifications: ${JSON.stringify(extractedData.specifications)}`);
  if (extractedData.price) parts.push(`Price: ${extractedData.price}`);
  if (extractedData.warrantyInfo) parts.push(`Warranty: ${extractedData.warrantyInfo}`);
  
  return parts.join('\n');
}

function extractTags(extractedData: any): string[] {
  const tags = [];
  
  if (extractedData.manufacturer) tags.push(extractedData.manufacturer);
  if (extractedData.category) tags.push(extractedData.category);
  if (extractedData.condition) tags.push(extractedData.condition);
  if (extractedData.sku) tags.push(extractedData.sku);
  
  return tags.filter(Boolean).slice(0, 10); // Limit to 10 tags
}