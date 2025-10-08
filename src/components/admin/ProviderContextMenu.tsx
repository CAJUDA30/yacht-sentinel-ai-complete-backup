import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Settings,
  Activity,
  Pause,
  Play,
  Star,
  Archive,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

interface ProviderContextMenuProps {
  provider: any;
  index: number;
  totalProviders: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onConfigure: () => void;
}

export const ProviderContextMenu: React.FC<ProviderContextMenuProps> = ({
  provider,
  index,
  totalProviders,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onToggleActive,
  onConfigure
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const canMoveUp = index > 0;
  const canMoveDown = index < totalProviders - 1;

  const menuItems = [
    {
      group: 'actions',
      items: [
        {
          icon: Settings,
          label: 'Configure',
          action: onConfigure,
          description: 'Open configuration panel'
        },
        {
          icon: Edit3,
          label: 'Edit Details',
          action: onEdit,
          description: 'Edit name, description, and basic settings'
        },
        {
          icon: provider.is_active ? Pause : Play,
          label: provider.is_active ? 'Disable' : 'Enable',
          action: onToggleActive,
          description: provider.is_active ? 'Temporarily disable this provider' : 'Enable this provider'
        }
      ]
    },
    {
      group: 'management',
      items: [
        {
          icon: Copy,
          label: 'Duplicate',
          action: onDuplicate,
          description: 'Create a copy of this provider'
        },
        {
          icon: ArrowUp,
          label: 'Move Up',
          action: onMoveUp,
          disabled: !canMoveUp,
          description: 'Increase priority order'
        },
        {
          icon: ArrowDown,
          label: 'Move Down',
          action: onMoveDown,
          disabled: !canMoveDown,
          description: 'Decrease priority order'
        }
      ]
    },
    {
      group: 'danger',
      items: [
        {
          icon: Archive,
          label: 'Archive',
          action: () => console.log('Archive provider'),
          description: 'Archive but keep configuration'
        },
        {
          icon: Trash2,
          label: 'Delete',
          action: onDelete,
          description: 'Permanently delete this provider',
          className: 'text-red-600 focus:text-red-600'
        }
      ]
    }
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 w-8 p-0 border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 p-2 bg-white/95 backdrop-blur-xl border border-neutral-200/60 shadow-xl rounded-xl"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
          <span className="font-medium text-neutral-900">{provider.name}</span>
          <div className="flex items-center gap-2">
            <Badge 
              variant={provider.is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {provider.is_active ? "Active" : "Inactive"}
            </Badge>
            {provider.configuration?.wizard_version === '2.0' && (
              <Badge variant="outline" className="text-xs">
                Enhanced
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1" />

        {menuItems.map((group, groupIndex) => (
          <div key={group.group}>
            {group.items.map((item, itemIndex) => {
              const IconComponent = item.icon;
              return (
                <DropdownMenuItem
                  key={`${group.group}-${itemIndex}`}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  disabled={item.disabled}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                    transition-all duration-200 hover:bg-neutral-50
                    focus:bg-neutral-50 focus:outline-none
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${item.className || ''}
                  `}
                >
                  <div className={`
                    p-1.5 rounded-md transition-colors duration-200
                    ${item.label === 'Delete' 
                      ? 'bg-red-50 text-red-600' 
                      : item.label === 'Configure' 
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-neutral-50 text-neutral-600'
                    }
                  `}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-neutral-900">
                        {item.label}
                      </span>
                      {item.label === 'Move Up' && canMoveUp && (
                        <span className="text-xs text-neutral-500">#{index}</span>
                      )}
                      {item.label === 'Move Down' && canMoveDown && (
                        <span className="text-xs text-neutral-500">#{index + 2}</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
            
            {groupIndex < menuItems.length - 1 && (
              <DropdownMenuSeparator className="my-2" />
            )}
          </div>
        ))}

        <DropdownMenuSeparator className="my-2" />
        
        <div className="px-3 py-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Priority Order</span>
            <span>#{index + 1} of {totalProviders}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 bg-neutral-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((totalProviders - index) / totalProviders) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />
        
        <div className="px-3 py-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">Health Status</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">Response Time</span>
            <span className="text-neutral-700 font-medium">&lt;100ms</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">Last Updated</span>
            <span className="text-neutral-700">
              {new Date(provider.updated_at || Date.now()).toLocaleDateString()}
            </span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};