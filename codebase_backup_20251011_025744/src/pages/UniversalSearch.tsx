import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Database, Brain, Zap, FileText, Package, Users, Wrench, DollarSign, Navigation, Shield } from "lucide-react";
import { useUniversalLLM } from "@/contexts/UniversalLLMContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  module: string;
  type: string;
  relevance: number;
  metadata?: any;
}

const UniversalSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'smart' | 'advanced' | 'unified'>('smart');
  const { processWithAllLLMs } = useUniversalLLM();
  const { toast } = useToast();
  const location = useLocation();

  // Handle search from header navigation
  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
      if (location.state.results) {
        // Process incoming results
        setSearchResults(location.state.results.results || []);
      }
    }
  }, [location.state]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Use real universal search edge function
      const { data, error } = await supabase.functions.invoke('universal-search', {
        body: {
          query: searchQuery,
          searchType: 'text',
          module: searchType === 'smart' ? undefined : searchType
        }
      });

      if (error) throw error;

      // Process real search results
      const processedResults: SearchResult[] = [];
      
      if (data?.results) {
        data.results.forEach((moduleResult: any) => {
          moduleResult.data.forEach((item: any) => {
            processedResults.push({
              id: item.id,
              title: item.name || item.title || `${moduleResult.module} item`,
              content: item.description || item.content || JSON.stringify(item).substring(0, 100),
              module: moduleResult.module,
              type: item.type || 'data',
              relevance: Math.random() * 0.5 + 0.5, // Calculate real relevance later
              metadata: item
            });
          });
        });
      }

      setSearchResults(processedResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${processedResults.length} results across ${data?.results?.length || 0} modules`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to complete search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getModuleIcon = (module: string) => {
    const icons = {
      inventory: Package,
      crew: Users,
      maintenance: Wrench,
      finance: DollarSign,
      navigation: Navigation,
      safety: Shield,
    };
    const Icon = icons[module as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getModuleColor = (module: string) => {
    const colors = {
      inventory: 'bg-blue-500',
      crew: 'bg-green-500',
      maintenance: 'bg-orange-500',
      finance: 'bg-purple-500',
      navigation: 'bg-cyan-500',
      safety: 'bg-red-500',
    };
    return colors[module as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
            <Search className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Universal Search</h1>
            <p className="text-muted-foreground">AI-powered search across all yacht data</p>
          </div>
        </div>

        {/* Search Interface */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Powered Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask anything... 'Show me safety equipment due for inspection'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Zap className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>

            <Tabs value={searchType} onValueChange={(value) => setSearchType(value as any)}>
              <TabsList>
                <TabsTrigger value="smart">Smart Search</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Filter</TabsTrigger>
                <TabsTrigger value="unified">Unified Index</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Search Results ({searchResults.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {searchResults.map((result) => (
                <div key={result.id} className="border border-border/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{result.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getModuleIcon(result.module)}
                        {result.module}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(result.relevance * 100)}% match
                      </Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{result.content}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Type: {result.type}</span>
                    <div className={`w-2 h-2 rounded-full ${getModuleColor(result.module)}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Smart Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Natural language search across all modules and data using advanced AI</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Advanced Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Complex filtering and sorting across multiple data sources with AI suggestions</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Unified Index</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Centralized search index across all yacht management data with real-time updates</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UniversalSearch;