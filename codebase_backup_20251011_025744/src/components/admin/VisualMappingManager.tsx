import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { documentAIMappingService, type FieldMapping } from '@/services/DocumentAIMappingService';
import { Plus, Trash2, Save, Download, Upload, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const VisualMappingManager: React.FC = () => {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<FieldMapping[]>(documentAIMappingService.getMappings());
  const [selectedMapping, setSelectedMapping] = useState<FieldMapping | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveMappings = async () => {
    const success = await documentAIMappingService.saveMappings(mappings);
    if (success) {
      toast({
        title: "Mappings Saved",
        description: "Field mappings have been saved successfully.",
      });
    } else {
      toast({
        title: "Save Failed",
        description: "Failed to save field mappings.",
        variant: "destructive"
      });
    }
  };

  const handleAddMapping = () => {
    const newMapping: FieldMapping = {
      id: `mapping_${Date.now()}`,
      googleFieldName: '',
      yachtFieldName: '',
      fieldType: 'text',
      category: 'basic',
      isActive: true,
      confidence: 0.9,
      description: '',
      examples: []
    };
    setMappings([...mappings, newMapping]);
    setSelectedMapping(newMapping);
    setIsEditing(true);
  };

  const handleDeleteMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
    if (selectedMapping?.id === id) {
      setSelectedMapping(null);
      setIsEditing(false);
    }
  };

  const handleUpdateMapping = (updatedMapping: FieldMapping) => {
    setMappings(mappings.map(m => m.id === updatedMapping.id ? updatedMapping : m));
    setSelectedMapping(updatedMapping);
  };

  const handleExportMappings = () => {
    const exportData = documentAIMappingService.exportMappings();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yacht-field-mappings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportMappings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = await documentAIMappingService.importMappings(jsonData);
        if (success) {
          setMappings(documentAIMappingService.getMappings());
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid mapping file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Visual Field Mapping Manager
          </CardTitle>
          <CardDescription>
            Configure field mappings between Google Document AI and yacht onboarding forms
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="mappings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="mappings" className="space-y-4">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button onClick={handleAddMapping}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mapping
              </Button>
              <Button variant="outline" onClick={handleSaveMappings}>
                <Save className="h-4 w-4 mr-2" />
                Save All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportMappings}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImportMappings}
                className="hidden"
                id="import-mappings"
              />
              <label htmlFor="import-mappings">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mappings List */}
            <Card>
              <CardHeader>
                <CardTitle>Field Mappings ({mappings.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {mappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMapping?.id === mapping.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedMapping(mapping);
                      setIsEditing(false);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{mapping.googleFieldName || 'Unnamed'}</div>
                        <div className="text-xs text-gray-500">→ {mapping.yachtFieldName}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant={mapping.isActive ? "default" : "secondary"} className="text-xs">
                            {mapping.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {mapping.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMapping(mapping.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Mapping Editor */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedMapping ? 'Edit Mapping' : 'Select a mapping to edit'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMapping ? (
                  <MappingEditor
                    mapping={selectedMapping}
                    onUpdate={handleUpdateMapping}
                    isEditing={isEditing}
                    onEditingChange={setIsEditing}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Select a mapping from the list to view or edit its details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="presets">
          <Card>
            <CardHeader>
              <CardTitle>Mapping Presets</CardTitle>
              <CardDescription>
                Save and load predefined mapping configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                Preset management functionality coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>Mapping Testing</CardTitle>
              <CardDescription>
                Test field mappings with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                Testing functionality coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface MappingEditorProps {
  mapping: FieldMapping;
  onUpdate: (mapping: FieldMapping) => void;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
}

const MappingEditor: React.FC<MappingEditorProps> = ({
  mapping,
  onUpdate,
  isEditing,
  onEditingChange
}) => {
  const [localMapping, setLocalMapping] = useState<FieldMapping>(mapping);

  React.useEffect(() => {
    setLocalMapping(mapping);
  }, [mapping]);

  const handleSave = () => {
    onUpdate(localMapping);
    onEditingChange(false);
  };

  const handleCancel = () => {
    setLocalMapping(mapping);
    onEditingChange(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-gray-500">Google Field Name</Label>
            <div className="font-medium">{mapping.googleFieldName || 'Not set'}</div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Yacht Field Name</Label>
            <div className="font-medium">{mapping.yachtFieldName || 'Not set'}</div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Field Type</Label>
            <div className="font-medium">{mapping.fieldType}</div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Category</Label>
            <div className="font-medium">{mapping.category}</div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Confidence</Label>
            <div className="font-medium">{(mapping.confidence * 100).toFixed(0)}%</div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Status</Label>
            <Badge variant={mapping.isActive ? "default" : "secondary"}>
              {mapping.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-500">Description</Label>
          <div className="text-sm">{mapping.description || 'No description'}</div>
        </div>
        <Button onClick={() => onEditingChange(true)}>
          Edit Mapping
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="googleFieldName">Google Field Name</Label>
          <Input
            id="googleFieldName"
            value={localMapping.googleFieldName}
            onChange={(e) => setLocalMapping({ ...localMapping, googleFieldName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="yachtFieldName">Yacht Field Name</Label>
          <Input
            id="yachtFieldName"
            value={localMapping.yachtFieldName}
            onChange={(e) => setLocalMapping({ ...localMapping, yachtFieldName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fieldType">Field Type</Label>
          <Select
            value={localMapping.fieldType}
            onValueChange={(value: any) => setLocalMapping({ ...localMapping, fieldType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={localMapping.category}
            onValueChange={(value: any) => setLocalMapping({ ...localMapping, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="specifications">Specifications</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="certificate">Certificate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={localMapping.description}
          onChange={(e) => setLocalMapping({ ...localMapping, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={localMapping.isActive}
            onChange={(e) => setLocalMapping({ ...localMapping, isActive: e.target.checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
