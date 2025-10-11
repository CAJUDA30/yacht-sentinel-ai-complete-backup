import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Edit3, Save, X } from 'lucide-react';

interface QuickEditModalProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProvider: any) => void;
}

export const QuickEditModal: React.FC<QuickEditModalProps> = ({
  provider,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    provider_type: provider?.provider_type || '',
    is_active: provider?.is_active || false,
    api_endpoint: provider?.api_endpoint || '',
    description: provider?.configuration?.specialization || ''
  });

  const handleSave = () => {
    onSave({
      ...provider,
      ...formData,
      configuration: {
        ...provider.configuration,
        specialization: formData.description
      },
      updated_at: new Date().toISOString()
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                <Edit3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Quick Edit</DialogTitle>
                <p className="text-sm text-neutral-600">Edit basic provider details</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-name">Provider Name</Label>
            <Input
              id="quick-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter provider name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-type">Provider Type</Label>
            <Input
              id="quick-type"
              value={formData.provider_type}
              onChange={(e) => setFormData(prev => ({ ...prev, provider_type: e.target.value }))}
              placeholder="e.g., openai, anthropic"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-endpoint">API Endpoint</Label>
            <Input
              id="quick-endpoint"
              value={formData.api_endpoint}
              onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
              placeholder="https://api.example.com/v1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-description">Description</Label>
            <Textarea
              id="quick-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this provider specializes in..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Active Status</Label>
              <p className="text-xs text-neutral-600">Enable or disable this provider</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};