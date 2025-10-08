import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { InventoryFolder } from '@/types/inventory';

export const useInventoryFolders = () => {
  const [folders, setFolders] = useState<InventoryFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_folders')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedFolders: InventoryFolder[] = data.map(folder => ({
        id: folder.id,
        name: folder.name,
        description: folder.description || undefined,
        parentId: folder.parent_id || undefined,
        location: folder.location || undefined,
        color: folder.color || undefined,
        icon: folder.icon || undefined,
        itemCount: folder.item_count || 0,
        createdAt: folder.created_at,
        updatedAt: folder.updated_at
      }));

      setFolders(transformedFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load inventory folders');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (folderData: Omit<InventoryFolder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('inventory_folders')
        .insert({
          name: folderData.name,
          description: folderData.description,
          parent_id: folderData.parentId,
          location: folderData.location,
          color: folderData.color,
          icon: folderData.icon
        })
        .select()
        .single();

      if (error) throw error;

      const newFolder: InventoryFolder = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        parentId: data.parent_id || undefined,
        location: data.location || undefined,
        color: data.color || undefined,
        icon: data.icon || undefined,
        itemCount: 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setFolders(prev => [...prev, newFolder]);
      toast.success('Folder created successfully');
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
      throw error;
    }
  };

  const updateFolder = async (id: string, updates: Partial<InventoryFolder>) => {
    try {
      const { data, error } = await supabase
        .from('inventory_folders')
        .update({
          name: updates.name,
          description: updates.description,
          parent_id: updates.parentId,
          location: updates.location,
          color: updates.color,
          icon: updates.icon
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedFolder: InventoryFolder = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        parentId: data.parent_id || undefined,
        location: data.location || undefined,
        color: data.color || undefined,
        icon: data.icon || undefined,
        itemCount: data.item_count || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setFolders(prev => prev.map(folder => folder.id === id ? updatedFolder : folder));
      toast.success('Folder updated successfully');
      return updatedFolder;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
      throw error;
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFolders(prev => prev.filter(folder => folder.id !== id));
      toast.success('Folder deleted successfully');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
      throw error;
    }
  };

  useEffect(() => {
    fetchFolders();

    // Set up real-time subscription
    const channel = supabase
      .channel('inventory_folders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory_folders' },
        () => {
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: fetchFolders
  };
};