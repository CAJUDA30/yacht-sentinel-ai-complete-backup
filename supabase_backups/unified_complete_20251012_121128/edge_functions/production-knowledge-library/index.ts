import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface KnowledgeSearchRequest {
  query: string;
  module?: string;
  knowledge_type?: string;
  yacht_id?: string;
  similarity_threshold?: number;
  max_results?: number;
  include_shared?: boolean;
}

interface KnowledgeAddRequest {
  title: string;
  content: string;
  knowledge_type: 'manual' | 'procedure' | 'specification' | 'maintenance_guide' | 'safety_document' | 'other';
  module: string;
  yacht_id?: string;
  is_shared?: boolean;
  metadata?: Record<string, any>;
}

interface KnowledgeUpdateRequest {
  id: string;
  title?: string;
  content?: string;
  knowledge_type?: string;
  is_shared?: boolean;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'search';
    
    // Get user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      throw new Error('Invalid authentication');
    }

    console.log(`Knowledge library action: ${action} for user ${user.id}`);

    switch (action) {
      case 'search':
        return await handleVectorSearch(await req.json(), user.id);
      
      case 'add':
        return await handleAddKnowledge(await req.json(), user.id);
      
      case 'update':
        return await handleUpdateKnowledge(await req.json(), user.id);
      
      case 'delete':
        return await handleDeleteKnowledge(await req.json(), user.id);
      
      case 'bulk_index':
        return await handleBulkIndexing(await req.json(), user.id);
      
      case 'stats':
        return await handleGetStats(user.id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Knowledge library error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleVectorSearch(request: KnowledgeSearchRequest, userId: string) {
  console.log('Vector search request:', request);
  
  if (!request.query || request.query.trim().length === 0) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Query is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Generate embedding for the search query
  const queryEmbedding = await generateEmbedding(request.query);
  if (!queryEmbedding) {
    throw new Error('Failed to generate query embedding');
  }

  // Build the similarity search query
  let query = supabase
    .from('ai_knowledge_vectors')
    .select(`
      id,
      content_text,
      module,
      knowledge_type,
      confidence_score,
      yacht_id,
      is_shared,
      created_at,
      metadata,
      created_by
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (request.module) {
    query = query.eq('module', request.module);
  }
  
  if (request.knowledge_type) {
    query = query.eq('knowledge_type', request.knowledge_type);
  }
  
  if (request.yacht_id) {
    query = query.eq('yacht_id', request.yacht_id);
  }

  // Access control: user's own content OR shared content
  if (request.include_shared !== false) {
    query = query.or(`created_by.eq.${userId},is_shared.eq.true`);
  } else {
    query = query.eq('created_by', userId);
  }

  const { data: candidates, error } = await query.limit(100);
  
  if (error) {
    throw new Error(`Database query error: ${error.message}`);
  }

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      results: [],
      total: 0,
      query: request.query
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Calculate similarity scores for each candidate
  const resultsWithSimilarity = [];
  for (const candidate of candidates) {
    try {
      // Get the stored embedding
      const { data: vectorData } = await supabase
        .from('ai_knowledge_vectors')
        .select('embedding')
        .eq('id', candidate.id)
        .single();

      if (vectorData?.embedding) {
        const similarity = cosineSimilarity(queryEmbedding, vectorData.embedding);
        const threshold = request.similarity_threshold || 0.3;
        
        if (similarity >= threshold) {
          resultsWithSimilarity.push({
            ...candidate,
            similarity_score: similarity,
            relevance: calculateRelevance(similarity, candidate.confidence_score || 0.5)
          });
        }
      }
    } catch (e) {
      console.error(`Error processing candidate ${candidate.id}:`, e);
    }
  }

  // Sort by relevance and limit results
  const maxResults = Math.min(request.max_results || 20, 50);
  const sortedResults = resultsWithSimilarity
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);

  // Log search for analytics
  await logSearchAnalytics(userId, request.query, sortedResults.length, request.module);

  return new Response(JSON.stringify({
    success: true,
    results: sortedResults,
    total: sortedResults.length,
    query: request.query,
    embedding_generated: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAddKnowledge(request: KnowledgeAddRequest, userId: string) {
  console.log('Adding knowledge:', { title: request.title, type: request.knowledge_type });

  if (!request.title || !request.content || !request.module) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Title, content, and module are required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Generate embedding for the content
  const embedding = await generateEmbedding(request.content);
  if (!embedding) {
    throw new Error('Failed to generate content embedding');
  }

  // Generate content hash
  const contentHash = await generateContentHash(request.content);

  // Insert into knowledge vectors
  const { data, error } = await supabase
    .from('ai_knowledge_vectors')
    .insert({
      content_hash: contentHash,
      content_text: request.content.slice(0, 60000), // Limit content size
      embedding,
      module: request.module,
      knowledge_type: request.knowledge_type,
      confidence_score: 1.0, // User-added content gets full confidence
      yacht_id: request.yacht_id || null,
      is_shared: request.is_shared || false,
      metadata: {
        title: request.title,
        user_added: true,
        ...request.metadata
      },
      created_by: userId
    })
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    throw new Error(`Failed to add knowledge: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    knowledge_id: data.id,
    message: 'Knowledge added successfully',
    embedding_generated: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleUpdateKnowledge(request: KnowledgeUpdateRequest, userId: string) {
  console.log('Updating knowledge:', request.id);

  if (!request.id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Knowledge ID is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check ownership
  const { data: existing } = await supabase
    .from('ai_knowledge_vectors')
    .select('created_by, content_text')
    .eq('id', request.id)
    .single();

  if (!existing || existing.created_by !== userId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Knowledge not found or access denied'
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const updates: any = { updated_at: new Date().toISOString() };

  // If content is being updated, regenerate embedding
  if (request.content && request.content !== existing.content_text) {
    const embedding = await generateEmbedding(request.content);
    if (!embedding) {
      throw new Error('Failed to generate updated embedding');
    }
    updates.embedding = embedding;
    updates.content_text = request.content.slice(0, 60000);
    updates.content_hash = await generateContentHash(request.content);
  }

  // Update metadata fields
  if (request.title || request.knowledge_type || request.metadata) {
    const currentMetadata = existing.metadata || {};
    updates.metadata = {
      ...currentMetadata,
      ...(request.title && { title: request.title }),
      ...(request.metadata && request.metadata)
    };
  }

  if (request.knowledge_type) {
    updates.knowledge_type = request.knowledge_type;
  }

  if (request.is_shared !== undefined) {
    updates.is_shared = request.is_shared;
  }

  const { error } = await supabase
    .from('ai_knowledge_vectors')
    .update(updates)
    .eq('id', request.id);

  if (error) {
    throw new Error(`Failed to update knowledge: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Knowledge updated successfully',
    embedding_regenerated: !!request.content
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleDeleteKnowledge(request: { id: string }, userId: string) {
  console.log('Deleting knowledge:', request.id);

  if (!request.id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Knowledge ID is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { error } = await supabase
    .from('ai_knowledge_vectors')
    .delete()
    .eq('id', request.id)
    .eq('created_by', userId); // Ensure ownership

  if (error) {
    throw new Error(`Failed to delete knowledge: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Knowledge deleted successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleBulkIndexing(request: { documents: Array<{ title: string; content: string; module: string; knowledge_type: string }> }, userId: string) {
  console.log('Bulk indexing:', request.documents?.length, 'documents');

  if (!request.documents || !Array.isArray(request.documents)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Documents array is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (const doc of request.documents.slice(0, 50)) { // Limit bulk operations
    try {
      const embedding = await generateEmbedding(doc.content);
      if (!embedding) continue;

      const contentHash = await generateContentHash(doc.content);

      const { data, error } = await supabase
        .from('ai_knowledge_vectors')
        .insert({
          content_hash: contentHash,
          content_text: doc.content.slice(0, 60000),
          embedding,
          module: doc.module,
          knowledge_type: doc.knowledge_type,
          confidence_score: 1.0,
          is_shared: true,
          metadata: {
            title: doc.title,
            bulk_imported: true
          },
          created_by: userId
        })
        .select('id')
        .single();

      if (error) {
        results.push({ title: doc.title, success: false, error: error.message });
        errorCount++;
      } else {
        results.push({ title: doc.title, success: true, id: data.id });
        successCount++;
      }
    } catch (e) {
      results.push({ title: doc.title, success: false, error: e.message });
      errorCount++;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    results,
    summary: {
      total: request.documents.length,
      successful: successCount,
      failed: errorCount
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetStats(userId: string) {
  const [
    { count: totalKnowledge },
    { count: userKnowledge },
    { count: sharedKnowledge }
  ] = await Promise.all([
    supabase.from('ai_knowledge_vectors').select('*', { count: 'exact', head: true }),
    supabase.from('ai_knowledge_vectors').select('*', { count: 'exact', head: true }).eq('created_by', userId),
    supabase.from('ai_knowledge_vectors').select('*', { count: 'exact', head: true }).eq('is_shared', true)
  ]);

  // Get module breakdown
  const { data: moduleStats } = await supabase
    .from('ai_knowledge_vectors')
    .select('module')
    .or(`created_by.eq.${userId},is_shared.eq.true`);

  const moduleBreakdown = moduleStats?.reduce((acc, item) => {
    acc[item.module] = (acc[item.module] || 0) + 1;
    return acc;
  }, {}) || {};

  return new Response(JSON.stringify({
    success: true,
    stats: {
      total_knowledge: totalKnowledge || 0,
      user_knowledge: userKnowledge || 0,
      shared_knowledge: sharedKnowledge || 0,
      accessible_knowledge: (userKnowledge || 0) + (sharedKnowledge || 0),
      module_breakdown: moduleBreakdown
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Utility functions
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey || !text) return null;

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000)
      })
    });

    if (!response.ok) {
      console.error('Embedding API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data?.data?.[0]?.embedding || null;
  } catch (e) {
    console.error('Embedding generation failed:', e);
    return null;
  }
}

async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function calculateRelevance(similarity: number, confidence: number): number {
  return (similarity * 0.7) + (confidence * 0.3);
}

async function logSearchAnalytics(userId: string, query: string, resultCount: number, module?: string) {
  try {
    await supabase.from('user_behavior_analytics').insert({
      user_id: userId,
      action_type: 'knowledge_search',
      action_details: { 
        query: query.slice(0, 200), 
        result_count: resultCount,
        module 
      },
      module_context: 'knowledge_library'
    });
  } catch (e) {
    console.error('Search analytics error:', e);
  }
}