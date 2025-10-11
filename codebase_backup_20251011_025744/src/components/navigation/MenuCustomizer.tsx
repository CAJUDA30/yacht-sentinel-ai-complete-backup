import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useNavigation } from '@/contexts/NavigationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, GripVertical, Eye, EyeOff, Star, StarOff, RotateCcw, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as LucideIcons from 'lucide-react';

interface MenuCustomizerProps {
  trigger?: React.ReactNode;
}

export const MenuCustomizer: React.FC<MenuCustomizerProps> = ({ 
  trigger = <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button> 
}) => {
  const { navigationState, reorderMenuItems, toggleFavorite, updateCustomization, resetToDefault, setMenuItems } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragDisabled, setIsDragDisabled] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex !== destinationIndex) {
      reorderMenuItems(sourceIndex, destinationIndex);
      toast({
        title: "Menu Order Updated",
        description: "Your menu items have been reordered successfully.",
      });
    }
  };

  const toggleItemVisibility = (itemId: string) => {
    const updatedItems = navigationState.menuItems.map(item =>
      item.id === itemId ? { ...item, isVisible: !item.isVisible } : item
    );
    setMenuItems(updatedItems);
  };

  const handleFavoriteToggle = (itemId: string) => {
    toggleFavorite(itemId);
    toast({
      title: "Favorites Updated",
      description: "Your favorite items have been updated.",
    });
  };

  const handleCustomizationChange = (key: keyof typeof navigationState.customization, value: boolean) => {
    updateCustomization({ [key]: value });
  };

  const handleReset = () => {
    resetToDefault();
    toast({
      title: "Menu Reset",
      description: "Your menu has been reset to default settings.",
    });
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Circle;
  };

  const categorizedItems = navigationState.menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navigationState.menuItems>);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Customize Navigation Menu
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="reorder" className="h-full">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="reorder">Reorder & Visibility</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="workspace">Workspace</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="reorder" className="m-0 p-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Menu Items</h3>
                    <p className="text-xs text-muted-foreground">
                      Drag to reorder • Toggle visibility • Mark favorites
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[400px] pr-4">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="menu-items" isDropDisabled={isDragDisabled}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-muted/20 rounded-lg p-2' : ''}`}
                        >
                          {navigationState.menuItems.map((item, index) => {
                            const IconComponent = getIconComponent(item.icon);
                            
                            return (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`p-3 ${
                                      snapshot.isDragging 
                                        ? 'shadow-elegant rotate-1 bg-card/95' 
                                        : 'hover:shadow-soft transition-shadow'
                                    } ${!item.isVisible ? 'opacity-50' : ''}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                      
                                      <div className="flex items-center gap-2 flex-1">
                                        <IconComponent className="h-4 w-4 text-sidebar-primary" />
                                        <span className="font-medium text-sm">{item.title}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {item.category}
                                        </Badge>
                                        {item.submenus && (
                                          <Badge variant="secondary" className="text-xs">
                                            {item.submenus.length} items
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleFavoriteToggle(item.id)}
                                          className="h-7 w-7 p-0"
                                        >
                                          {item.isFavorite ? (
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          ) : (
                                            <StarOff className="h-3 w-3 text-muted-foreground" />
                                          )}
                                        </Button>
                                        
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleItemVisibility(item.id)}
                                          className="h-7 w-7 p-0"
                                        >
                                          {item.isVisible ? (
                                            <Eye className="h-3 w-3" />
                                          ) : (
                                            <EyeOff className="h-3 w-3 text-muted-foreground" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="preferences" className="m-0 p-6 pt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Display Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Show Badges</p>
                        <p className="text-xs text-muted-foreground">Display notification badges and counters</p>
                      </div>
                      <Switch
                        checked={navigationState.customization.showBadges}
                        onCheckedChange={(checked) => handleCustomizationChange('showBadges', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Show Subtitles</p>
                        <p className="text-xs text-muted-foreground">Display descriptions under menu items</p>
                      </div>
                      <Switch
                        checked={navigationState.customization.showSubtitles}
                        onCheckedChange={(checked) => handleCustomizationChange('showSubtitles', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Compact Mode</p>
                        <p className="text-xs text-muted-foreground">Reduce spacing and use smaller icons</p>
                      </div>
                      <Switch
                        checked={navigationState.customization.compactMode}
                        onCheckedChange={(checked) => handleCustomizationChange('compactMode', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Group by Category</p>
                        <p className="text-xs text-muted-foreground">Group menu items by their category</p>
                      </div>
                      <Switch
                        checked={navigationState.customization.groupByCategory}
                        onCheckedChange={(checked) => handleCustomizationChange('groupByCategory', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Show Favorites</p>
                        <p className="text-xs text-muted-foreground">Display favorite items at the top</p>
                      </div>
                      <Switch
                        checked={navigationState.customization.showFavorites}
                        onCheckedChange={(checked) => handleCustomizationChange('showFavorites', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="workspace" className="m-0 p-6 pt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Workspace Profiles</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Save different menu configurations for different operational contexts.
                  </p>
                  
                  <div className="grid gap-3">
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">Default Profile</h4>
                          <p className="text-xs text-muted-foreground">Standard yacht operations</p>
                        </div>
                        <Badge variant={navigationState.workspaceProfile === 'default' ? 'default' : 'outline'}>
                          {navigationState.workspaceProfile === 'default' ? 'Active' : 'Available'}
                        </Badge>
                      </div>
                    </Card>
                    
                    <Card className="p-4 opacity-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">Charter Profile</h4>
                          <p className="text-xs text-muted-foreground">Optimized for charter operations</p>
                        </div>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                    </Card>
                    
                    <Card className="p-4 opacity-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">Maintenance Profile</h4>
                          <p className="text-xs text-muted-foreground">Focused on maintenance workflows</p>
                        </div>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="p-6 pt-0 border-t">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Changes are saved automatically
            </p>
            <Button onClick={() => setIsOpen(false)}>
              <Save className="h-4 w-4 mr-1" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};