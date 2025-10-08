import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Package, 
  MoreVertical,
  History,
  CreditCard,
  Printer,
  Download,
  Copy,
  GitMerge,
  Trash2,
  Shield,
  Tag,
  Bell,
  Edit3,
  QrCode
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { InventoryItemType } from "@/types/inventory";
import { useCurrency } from "@/contexts/CurrencyContext";

interface UnifiedInventoryCardProps {
  // For items
  item?: InventoryItemType;
  
  // For folders
  folder?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  };
  
  // Display data
  title: string;
  imageUrl?: string;
  itemCount: number;
  totalValue: number;
  description?: string;
  
  // Actions
  onClick: () => void;
  onEdit?: (item: InventoryItemType) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (item: InventoryItemType) => void;
  onMove?: (id: string, newLocation: string) => void;
  onViewHistory?: (id: string) => void;
  
  // Folder actions
  onFolderAction?: (action: string, folder: any, event: React.MouseEvent) => void;
  
  // Card type
  type: 'item' | 'folder' | 'recent';
  
  // For multi-image display (folders)
  images?: string[];
  
  // Multi-select functionality
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  
  // Quick actions for items
  onSetAlerts?: (item: InventoryItemType) => void;
}

export const UnifiedInventoryCard = ({
  item,
  folder,
  title,
  imageUrl,
  itemCount,
  totalValue,
  description,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
  onViewHistory,
  onFolderAction,
  type,
  images = [],
  isSelected = false,
  onSelect,
  onSetAlerts
}: UnifiedInventoryCardProps) => {
  const { formatPrice } = useCurrency();

  const handleItemAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!item) return;
    
    switch (action) {
      case 'history':
        onViewHistory?.(item.id);
        break;
      case 'transactions':
        toast({ title: "Transactions", description: "Opening transaction history..." });
        break;
      case 'print':
        toast({ title: "Print Label", description: `Printing label for ${item.name}...` });
        break;
      case 'export':
        const dataStr = JSON.stringify(item, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast({ title: "Export Complete", description: `${item.name} data exported successfully` });
        break;
      case 'clone':
        onDuplicate?.(item);
        break;
      case 'merge':
        toast({ title: "Merge Items", description: "Select items to merge with this one..." });
        break;
      case 'delete':
        // Delete confirmation now handled by AlertDialog in the render method
        onDelete?.(item.id);
        break;
    }
  };

  const renderImage = () => {
    if (type === 'folder' && images.length > 0) {
      // 2x2 grid for folders with multiple images
      return (
        <div className="grid grid-cols-2 gap-0.5 h-full">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square bg-gray-100 overflow-hidden"
            >
              {images[index] ? (
                <img
                  src={images[index]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } else if (imageUrl) {
      // Single image for items or folders with one image
      return (
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
      );
    } else {
      // Placeholder
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Package className="h-12 w-12 text-gray-400" />
        </div>
      );
    }
  };

  const renderMenu = () => {
    if (type === 'folder' && folder) {
      return (
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem 
            onClick={(e) => onFolderAction?.('history', folder, e)}
            className="cursor-pointer"
          >
            <History className="mr-2 h-4 w-4" />
            History
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => onFolderAction?.('label', folder, e)}
            className="cursor-pointer"
          >
            <QrCode className="mr-2 h-4 w-4" />
            Create Label
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => onFolderAction?.('export', folder, e)}
            className="cursor-pointer"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => onFolderAction?.('clone', folder, e)}
            className="cursor-pointer"
          >
            <Copy className="mr-2 h-4 w-4" />
            Clone
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => onFolderAction?.('permissions', folder, e)}
            className="cursor-pointer"
          >
            <Shield className="mr-2 h-4 w-4" />
            Permissions
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem 
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{folder.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e) => onFolderAction?.('delete', folder, e)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      );
    } else if (type === 'item' || type === 'recent') {
      return (
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem 
            onClick={(e) => handleItemAction('history', e)}
            className="cursor-pointer"
          >
            <History className="mr-2 h-4 w-4" />
            History
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => handleItemAction('transactions', e)}
            className="cursor-pointer"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Transactions
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => handleItemAction('print', e)}
            className="cursor-pointer"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Label
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => handleItemAction('export', e)}
            className="cursor-pointer"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => handleItemAction('clone', e)}
            className="cursor-pointer"
          >
            <Copy className="mr-2 h-4 w-4" />
            Clone
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => handleItemAction('merge', e)}
            className="cursor-pointer"
          >
            <GitMerge className="mr-2 h-4 w-4" />
            Merge
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem 
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{item?.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e) => handleItemAction('delete', e)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      );
    }
    
    return null;
  };

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden relative"
      onClick={onClick}
    >
      {/* Multi-select checkbox - top left corner */}
      {(type === 'item' || type === 'recent') && onSelect && item && (
        <div className="absolute top-3 left-3 z-20">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(item.id, !!checked)}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 backdrop-blur-sm shadow-sm border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      )}

      {/* Three dots menu in top right */}
      <div className="absolute top-3 right-3 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-sm border border-white/20 hover:bg-white/95 hover:shadow-md transition-all duration-200 rounded-full"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          {renderMenu()}
        </DropdownMenu>
      </div>

      {/* Image section */}
      <div className="relative h-32 bg-muted/30 overflow-hidden">
        {renderImage()}
      </div>

      <CardContent className="p-4">
        {/* Title and description */}
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-medium text-sm text-foreground line-clamp-1 flex-1 pr-2">
            {title}
          </h4>
        </div>
        
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
          {description || (type === 'folder' ? folder?.description : item?.description || item?.folder)}
        </p>
        
        {/* Quantity and value */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium">{itemCount} unit{itemCount !== 1 ? 's' : ''}</span>
          <span className="text-xs font-bold text-primary">{formatPrice(totalValue)}</span>
        </div>

        {/* Quick action buttons for items */}
        {(type === 'item' || type === 'recent') && item && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs hover:bg-muted/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetAlerts?.(item);
                }}
              >
                <Bell className="h-3 w-3 mr-1" />
                Alerts
              </Button>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs hover:bg-muted/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Item</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{item.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete?.(item.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};