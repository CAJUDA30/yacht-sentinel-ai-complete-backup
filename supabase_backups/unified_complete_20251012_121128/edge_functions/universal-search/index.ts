import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  module?: string;
  searchType?: 'text' | 'voice' | 'visual';
  filters?: any;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'universal-search', time: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { query, module, searchType = 'text', filters, userId }: SearchRequest = await req.json();
    
    console.log(`Universal search: "${query}" in module: ${module || 'all'}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Process query with AI for better understanding
    const { data: aiResults, error: aiError } = await supabase.functions.invoke('multi-ai-processor', {
      body: {
        type: 'text',
        content: query,
        context: `search query in ${module || 'all modules'}`,
        module: module || 'search'
      }
    });

    const enhancedQuery = aiResults?.consensus?.primaryAction || query;

    // Parallel search across all modules
    const searchPromises = [];

    // Inventory search
    searchPromises.push(
      supabase
        .from('inventory_items')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%,tags.cs.{${query}}`)
        .limit(10)
        .then(({ data }) => ({ module: 'inventory', data: data || [] }))
    );

    // Inventory folders search
    searchPromises.push(
      supabase
        .from('inventory_folders')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(10)
        .then(({ data }) => ({ module: 'folders', data: data || [] }))
    );

    // Movement records search
    searchPromises.push(
      supabase
        .from('movement_records')
        .select('*')
        .or(`from_location.ilike.%${query}%,to_location.ilike.%${query}%,reason.ilike.%${query}%,moved_by.ilike.%${query}%`)
        .limit(10)
        .then(({ data }) => ({ module: 'movements', data: data || [] }))
    );

    // Stock adjustments search
    searchPromises.push(
      supabase
        .from('stock_adjustments')
        .select('*')
        .or(`reason.ilike.%${query}%,adjusted_by.ilike.%${query}%,notes.ilike.%${query}%`)
        .limit(10)
        .then(({ data }) => ({ module: 'adjustments', data: data || [] }))
    );

    // Execute all searches in parallel
    const searchResults = await Promise.allSettled(searchPromises);
    
    const results = {
      query: query,
      enhancedQuery: enhancedQuery,
      aiInsights: aiResults,
      results: [],
      totalResults: 0,
      searchType: searchType,
      timestamp: new Date().toISOString()
    };

    // Process search results
    searchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.data.length > 0) {
        results.results.push(result.value);
        results.totalResults += result.value.data.length;
      }
    });

    // Generate AI-powered suggestions
    if (results.totalResults === 0) {
      const suggestions = await generateSearchSuggestions(query, module);
      results.suggestions = suggestions;
    } else {
      const insights = await generateSearchInsights(results.results, query);
      results.insights = insights;
    }

    console.log(`Universal search complete: ${results.totalResults} results found`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Universal search error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateSearchSuggestions(query: string, module?: string) {
  try {
    const { data: aiResults } = await supabase.functions.invoke('multi-ai-processor', {
      body: {
        type: 'text',
        content: `Generate search suggestions for query "${query}" in yacht management context. Module: ${module || 'all'}`,
        context: 'search suggestions',
        module: 'search'
      }
    });
    return aiResults?.consensus?.primaryAction || 'Try different keywords or check spelling';
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return ['Try different keywords', 'Check spelling', 'Use more specific terms'];
  }
}

async function generateSearchInsights(results: any[], query: string) {
  try {
    const { data: aiResults } = await supabase.functions.invoke('multi-ai-processor', {
      body: {
        type: 'text',
        content: `Analyze search results for query "${query}". Results: ${JSON.stringify(results)}`,
        context: 'search insights',
        module: 'search'
      }
    });
    return aiResults?.consensus?.primaryAction || 'Search completed successfully';
  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Search completed successfully';
  }
}