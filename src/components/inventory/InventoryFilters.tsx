import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  X,
  MapPin,
  Package,
  Tag,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { InventoryFilter, InventoryItemType } from "@/types/inventory";

interface InventoryFiltersProps {
  items: InventoryItemType[];
  filters: InventoryFilter;
  onFiltersChange: (filters: InventoryFilter) => void;
  onClearFilters: () => void;
}

export const InventoryFilters = ({ 
  items, 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: InventoryFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extract unique values from items
  const categories = [...new Set(items.map(item => item.folder))].sort();
  const locations = [...new Set(items.map(item => item.location))].sort();
  const allTags = [...new Set(items.flatMap(item => item.tags || []))].sort();
  const priorities = ["critical", "high", "medium", "low"];
  const statuses = ["in-stock", "low-stock", "out-of-stock", "expired", "maintenance"];

  const updateFilter = (key: keyof InventoryFilter, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof InventoryFilter, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search items, SKUs, descriptions..."
                  value={filters.search || ""}
                  onChange={(e) => updateFilter('search', e.target.value || undefined)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={showAdvanced ? "default" : "outline"}
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              
              {activeFiltersCount > 0 && (
                <Button variant="ghost" onClick={onClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={filters.category === category ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('category', filters.category === category ? undefined : category)}
                className="flex items-center space-x-1"
              >
                <Package className="h-3 w-3" />
                <span>{category}</span>
              </Button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="mt-6 space-y-6 border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Location Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </Label>
                  <Select
                    value={filters.location || ""}
                    onValueChange={(value) => updateFilter('location', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any location</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Status</span>
                  </Label>
                  <div className="space-y-2">
                    {statuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={(filters.status || []).includes(status)}
                          onCheckedChange={() => toggleArrayFilter('status', status)}
                        />
                        <Label htmlFor={`status-${status}`} className="capitalize">
                          {status.replace("-", " ")}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <div className="space-y-2">
                    {priorities.map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${priority}`}
                          checked={(filters.priority || []).includes(priority)}
                          onCheckedChange={() => toggleArrayFilter('priority', priority)}
                        />
                        <Label htmlFor={`priority-${priority}`} className="capitalize">
                          {priority}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Tags</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <Button
                        key={tag}
                        variant={(filters.tags || []).includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleArrayFilter('tags', tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Date Range</span>
                </Label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange?.start ? 
                          new Date(filters.dateRange.start).toLocaleDateString() : 
                          "Start date"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            updateFilter('dateRange', {
                              ...filters.dateRange,
                              start: date.toISOString().split('T')[0]
                            });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange?.end ? 
                          new Date(filters.dateRange.end).toLocaleDateString() : 
                          "End date"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            updateFilter('dateRange', {
                              ...filters.dateRange,
                              end: date.toISOString().split('T')[0]
                            });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};