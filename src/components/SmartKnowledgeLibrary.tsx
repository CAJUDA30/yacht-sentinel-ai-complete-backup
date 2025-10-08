import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  BookOpen, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Share,
  Lock,
  Users,
  Globe,
  Brain,
  Zap,
  Tag,
  Clock,
  User
} from 'lucide-react';
import { useSmartKnowledge } from '@/hooks/useSmartKnowledge';
import type { SmartKnowledgeItem } from '@/types/behavior-analytics';

export const SmartKnowledgeLibrary: React.FC = () => {
  const {
    knowledgeItems,
    searchResults,
    searchQuery,
    setSearchQuery,
    isLoading,
    isSearching,
    addKnowledgeItem,
    isAdding,
    syncFleetKnowledge,
    isSyncing
  } = useSmartKnowledge();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    content: '',
    content_type: 'text' as const,
    module: '',
    tags: '',
    is_shared: false,
    access_level: 'private' as const
  });

  const handleAddItem = () => {
    const item: Omit<SmartKnowledgeItem, 'id' | 'created_at' | 'updated_at'> = {
      ...newItem,
      tags: newItem.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      source_type: 'user_generated',
      created_by: '', // Will be filled by auth context
      metadata: {}
    };

    addKnowledgeItem(item);
    setNewItem({
      title: '',
      content: '',
      content_type: 'text',
      module: '',
      tags: '',
      is_shared: false,
      access_level: 'private'
    });
    setShowAddDialog(false);
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'scan_result': return <Zap className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'private': return <Lock className="h-3 w-3" />;
      case 'yacht': return <Users className="h-3 w-3" />;
      case 'fleet': return <Share className="h-3 w-3" />;
      case 'public': return <Globe className="h-3 w-3" />;
      default: return <Lock className="h-3 w-3" />;
    }
  };

  const displayItems = searchQuery.length > 2 ? 
    searchResults.map(result => result.item) : 
    knowledgeItems;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Smart Knowledge Library</h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => syncFleetKnowledge()}
            disabled={isSyncing}
            variant="outline"
          >
            <Share className="h-4 w-4 mr-2" />
            {isSyncing ? 'Syncing...' : 'Sync Fleet'}
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Knowledge Item</DialogTitle>
                <DialogDescription>
                  Add new knowledge to your library for future reference and AI-powered suggestions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                />
                <Textarea
                  placeholder="Content or description"
                  value={newItem.content}
                  onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                  rows={4}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newItem.content_type}
                    onValueChange={(value) => setNewItem({ ...newItem, content_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Content Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Module (e.g., inventory, maintenance)"
                    value={newItem.module}
                    onChange={(e) => setNewItem({ ...newItem, module: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Tags (comma separated)"
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                />
                <Select
                  value={newItem.access_level}
                  onValueChange={(value) => setNewItem({ ...newItem, access_level: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Access Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private (Only You)</SelectItem>
                    <SelectItem value="yacht">Yacht Team</SelectItem>
                    <SelectItem value="fleet">Fleet Wide</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem} disabled={isAdding}>
                    {isAdding ? 'Adding...' : 'Add Knowledge'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Knowledge Search
          </CardTitle>
          <CardDescription>
            Search across all knowledge using AI-powered semantic similarity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search knowledge library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" disabled={isSearching}>
              <Brain className="h-4 w-4" />
              {isSearching ? 'AI Searching...' : 'AI Search'}
            </Button>
          </div>
          {searchQuery.length > 2 && searchResults.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Found {searchResults.length} relevant knowledge items
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="h-20 bg-muted rounded-t" />
              <CardContent className="h-32 bg-muted/50" />
            </Card>
          ))
        ) : displayItems.length > 0 ? (
          displayItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    {getContentTypeIcon(item.content_type)}
                    {getAccessLevelIcon(item.access_level)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {item.module}
                  </Badge>
                  <Badge variant={item.source_type === 'ai_extracted' ? 'default' : 'secondary'} className="text-xs">
                    {item.source_type === 'ai_extracted' ? 'AI Generated' : 'Manual'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.content}
                </p>
                
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>By {item.created_by}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {searchQuery.length > 2 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Relevance: {Math.round(
                        (searchResults.find(r => r.item.id === item.id)?.similarity_score || 0) * 100
                      )}%
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery.length > 2 ? 'No matching knowledge found' : 'No knowledge items yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery.length > 2 
                    ? 'Try different search terms or add new knowledge'
                    : 'Start building your smart knowledge library by adding items or using SmartScan'
                  }
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Knowledge Item
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};