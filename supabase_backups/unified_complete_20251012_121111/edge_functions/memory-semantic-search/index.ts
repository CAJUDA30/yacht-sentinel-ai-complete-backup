import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  limit?: number;
  memory_types?: string[];
  modules?: string[];
  min_similarity?: number;
  include_expired?: boolean;
}

interface SearchResult {
  memory: any;
  similarity_score: number;
  relevance_context: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const request: SearchRequest = await req.json();
    console.log(`🔍 Memory search for user ${user.id}: "${request.query}"`);

    if (!request.query?.trim()) {
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
      console.warn('Failed to generate embedding, falling back to text search');
      return await performTextSearch(user.id, request);
    }

    // Perform vector similarity search
    const results = await performVectorSearch(user.id, request, queryEmbedding);

    // Update search cache
    await cacheSearchResult(user.id, request.query, queryEmbedding, results);

    return new Response(JSON.stringify({
      success: true,
      results: results,
      query: request.query,
      total_results: results.length,
      search_type: 'vector_similarity'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Memory search error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Search failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.warn('OpenAI API key not configured');
      return null;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.slice(0, 8000) // Respect token limits
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return null;
    }

    const result = await response.json();
    return result.data?.[0]?.embedding || null;
  } catch (error) {
    console.error('Embedding generation error:', error);
    return null;
  }
}

async function performVectorSearch(
  userId: string, 
  request: SearchRequest, 
  queryEmbedding: number[]
): Promise<SearchResult[]> {
  try {
    const limit = Math.min(request.limit || 10, 50); // Cap at 50 results
    const minSimilarity = request.min_similarity || 0.3;

    // Build the query
    let query = supabase
      .from('user_memory_embeddings')
      .select(`
        *,
        user_memories!inner(
          id,
          memory_type,
          title,
          content,
          importance_score,
          access_frequency,
          created_at,
          updated_at,
          module,
          tags,
          metadata,
          expires_at
        )
      `)
      .eq('user_id', userId)
      .order('embedding <=> :query_embedding', { query_embedding: queryEmbedding })
      .limit(limit);

    // Add filters
    if (request.memory_types && request.memory_types.length > 0) {
      query = query.in('user_memories.memory_type', request.memory_types);
    }

    if (request.modules && request.modules.length > 0) {
      query = query.in('user_memories.module', request.modules);
    }

    if (!request.include_expired) {
      query = query.or('user_memories.expires_at.is.null,user_memories.expires_at.gt.now()');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Vector search error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Calculate similarity scores and build results
    const results: SearchResult[] = [];
    
    for (const item of data) {
      // Calculate cosine similarity
      const similarity = calculateCosineSimilarity(queryEmbedding, item.embedding);
      
      if (similarity >= minSimilarity) {
        const relevanceContext = generateRelevanceContext(
          request.query,
          item.user_memories,
          similarity
        );

        results.push({
          memory: item.user_memories,
          similarity_score: similarity,
          relevance_context: relevanceContext
        });

        // Update access frequency for highly relevant memories
        if (similarity > 0.7) {
          await supabase
            .from('user_memories')
            .update({ 
              access_frequency: item.user_memories.access_frequency + 1,
              last_accessed_at: new Date().toISOString()
            })
            .eq('id', item.user_memories.id);
        }
      }
    }

    // Sort by similarity score (highest first)
    results.sort((a, b) => b.similarity_score - a.similarity_score);

    console.log(`Found ${results.length} relevant memories for user ${userId}`);
    return results;

  } catch (error) {
    console.error('Vector search failed:', error);
    throw error;
  }
}

async function performTextSearch(userId: string, request: SearchRequest): Promise<any> {
  try {
    const limit = Math.min(request.limit || 10, 50);
    const searchTerms = request.query.toLowerCase().split(' ').filter(term => term.length > 2);

    if (searchTerms.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        results: [],
        query: request.query,
        total_results: 0,
        search_type: 'text_fallback'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Text-based search using PostgreSQL full-text search
    let query = supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .limit(limit);

    // Add text search conditions
    const searchConditions = searchTerms.map(term => 
      `title.ilike.%${term}%,content->>query.ilike.%${term}%,content->>response.ilike.%${term}%`
    ).join(',');

    query = query.or(searchConditions);

    // Add filters
    if (request.memory_types && request.memory_types.length > 0) {
      query = query.in('memory_type', request.memory_types);
    }

    if (request.modules && request.modules.length > 0) {
      query = query.in('module', request.modules);
    }

    if (!request.include_expired) {
      query = query.or('expires_at.is.null,expires_at.gt.now()');
    }

    const { data, error } = await query.order('importance_score', { ascending: false });

    if (error) throw error;

    const results: SearchResult[] = (data || []).map(memory => ({
      memory: memory,
      similarity_score: calculateTextSimilarity(request.query, memory),
      relevance_context: generateRelevanceContext(request.query, memory, 0.5)
    }));

    return new Response(JSON.stringify({
      success: true,
      results: results,
      query: request.query,
      total_results: results.length,
      search_type: 'text_fallback'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Text search failed:', error);
    throw error;
  }
}

function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function calculateTextSimilarity(query: string, memory: any): number {
  const queryLower = query.toLowerCase();
  const title = memory.title?.toLowerCase() || '';
  const content = JSON.stringify(memory.content).toLowerCase();
  
  let score = 0;
  const queryTerms = queryLower.split(' ').filter(term => term.length > 2);
  
  for (const term of queryTerms) {
    if (title.includes(term)) score += 0.3;
    if (content.includes(term)) score += 0.2;
  }
  
  // Boost recent and frequently accessed memories
  const daysSinceCreated = (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated < 7) score += 0.1;
  
  if (memory.access_frequency > 5) score += 0.1;
  
  return Math.min(score, 1.0);
}

function generateRelevanceContext(query: string, memory: any, similarity: number): string {
  const contexts: string[] = [];
  
  if (memory.module) {
    contexts.push(`Related to ${memory.module} module`);
  }
  
  if (memory.memory_type) {
    contexts.push(`${memory.memory_type} interaction`);
  }
  
  if (similarity > 0.8) {
    contexts.push('High relevance');
  } else if (similarity > 0.6) {
    contexts.push('Moderate relevance');
  } else {
    contexts.push('Low relevance');
  }
  
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceCreated === 0) {
    contexts.push('Today');
  } else if (daysSinceCreated === 1) {
    contexts.push('Yesterday');
  } else if (daysSinceCreated < 7) {
    contexts.push(`${daysSinceCreated} days ago`);
  } else if (daysSinceCreated < 30) {
    contexts.push(`${Math.floor(daysSinceCreated / 7)} weeks ago`);
  } else {
    contexts.push(`${Math.floor(daysSinceCreated / 30)} months ago`);
  }
  
  return contexts.join(' • ');
}

async function cacheSearchResult(
  userId: string, 
  query: string, 
  embedding: number[], 
  results: SearchResult[]
): Promise<void> {
  try {
    const queryHash = await generateQueryHash(query);
    
    await supabase
      .from('memory_search_cache')
      .upsert({
        user_id: userId,
        query_hash: queryHash,
        query_text: query,
        search_results: results,
        embedding: embedding,
        cache_hits: 0,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
  } catch (error) {
    console.warn('Failed to cache search result:', error);
    // Don't throw - caching failure shouldn't break the search
  }
}

async function generateQueryHash(query: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(query.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}