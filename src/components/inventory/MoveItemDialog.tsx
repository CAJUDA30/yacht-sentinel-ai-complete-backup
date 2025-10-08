import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FolderPlus, Folder, MapPin } from "lucide-react";
import { InventoryItemType, InventoryFolder } from "@/types/inventory";

interface MoveItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (itemId: string, newLocation: string, folderId?: string) => void;
  onCreateFolder?: (folderData: { name: string; description: string; location: string; color: string }) => void;
  item: InventoryItemType | null;
  folders: InventoryFolder[];
  locations: string[];
}

export const MoveItemDialog = ({ 
  isOpen, 
  onClose, 
  onMove, 
  onCreateFolder,
  item, 
  folders, 
  locations 
}: MoveItemDialogProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#3b82f6");

  const handleMove = () => {
    if (!item || !selectedLocation) return;
    
    onMove(item.id, selectedLocation, selectedFolder || undefined);
    handleClose();
  };

  const handleCreateFolder = () => {
    if (!newFolderName || !selectedLocation) return;
    
    onCreateFolder?.({
      name: newFolderName,
      description: newFolderDescription,
      location: selectedLocation,
      color: newFolderColor
    });
    
    setIsCreatingFolder(false);
    setNewFolderName("");
    setNewFolderDescription("");
    setNewFolderColor("#3b82f6");
  };

  const handleClose = () => {
    setSelectedLocation("");
    setSelectedFolder("");
    setIsCreatingFolder(false);
    setNewFolderName("");
    setNewFolderDescription("");
    setNewFolderColor("#3b82f6");
    onClose();
  };

  // Filter folders by selected location
  const availableFolders = folders.filter(folder => 
    !selectedLocation || folder.location === selectedLocation
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 max-w-md z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span>Move Item</span>
          </DialogTitle>
          <DialogDescription>
            {item && `Move "${item.name}" to a new location or folder`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Location Selection */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border/50">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 z-50">
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folder Selection */}
          {selectedLocation && (
            <div className="space-y-2">
              <Label htmlFor="folder">Folder (Optional)</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border/50">
                  <SelectValue placeholder="Select folder or leave empty" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 z-50">
                  <SelectItem value="">No folder</SelectItem>
                  {availableFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Create New Folder Button */}
              {!isCreatingFolder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingFolder(true)}
                  className="w-full mt-2 border-dashed border-primary/30 hover:border-primary/50"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create New Folder
                </Button>
              )}
            </div>
          )}

          {/* Create New Folder Form */}
          {isCreatingFolder && selectedLocation && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-2 mb-3">
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Create New Folder</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="bg-background/80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="folderDescription">Description (Optional)</Label>
                  <Input
                    id="folderDescription"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    placeholder="Enter description"
                    className="bg-background/80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="folderColor">Color</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="folderColor"
                      value={newFolderColor}
                      onChange={(e) => setNewFolderColor(e.target.value)}
                      className="w-8 h-8 rounded border border-border/50"
                    />
                    <span className="text-sm text-muted-foreground">{newFolderColor}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatingFolder(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateFolder}
                    disabled={!newFolderName}
                  >
                    Create Folder
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleMove}
            disabled={!selectedLocation}
          >
            Move Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};