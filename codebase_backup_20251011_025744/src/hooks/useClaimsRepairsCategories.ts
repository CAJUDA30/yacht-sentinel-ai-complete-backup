import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClaimsRepairsCategory {
  id: string;
  name: string;
  type: 'claims' | 'repairs' | 'both';
  parent_id?: string;
  description?: string;
  icon: string;
  color: string;
  sort_order: number;
  equipment_types: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration_hours?: number;
  required_certifications: string[];
  compliance_standards: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: ClaimsRepairsCategory[];
}

export const useClaimsRepairsCategories = () => {
  const [categories, setCategories] = useState<ClaimsRepairsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('claims_repairs_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      // Build hierarchical structure
      const categoryMap = new Map<string, ClaimsRepairsCategory>();
      const rootCategories: ClaimsRepairsCategory[] = [];

      // First pass: create all categories with proper typing
      data?.forEach(cat => {
        const category: ClaimsRepairsCategory = {
          ...cat,
          type: cat.type as 'claims' | 'repairs' | 'both',
          urgency_level: cat.urgency_level as 'low' | 'medium' | 'high' | 'critical',
          equipment_types: Array.isArray(cat.equipment_types) ? cat.equipment_types.filter(item => typeof item === 'string') : [],
          required_certifications: Array.isArray(cat.required_certifications) ? cat.required_certifications.filter(item => typeof item === 'string') : [],
          compliance_standards: Array.isArray(cat.compliance_standards) ? cat.compliance_standards.filter(item => typeof item === 'string') : [],
          children: []
        };
        categoryMap.set(cat.id, category);
      });

      // Second pass: build hierarchy
      data?.forEach(cat => {
        const category = categoryMap.get(cat.id)!;
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      // Sort children by sort_order
      const sortCategories = (cats: ClaimsRepairsCategory[]) => {
        cats.sort((a, b) => a.sort_order - b.sort_order);
        cats.forEach(cat => {
          if (cat.children && cat.children.length > 0) {
            sortCategories(cat.children);
          }
        });
      };

      sortCategories(rootCategories);
      setCategories(rootCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job categories",
        variant: "destructive",
      });
    }
  };

  const createCategory = async (categoryData: Partial<ClaimsRepairsCategory>) => {
    try {
      const dbData = {
        name: categoryData.name!,
        type: categoryData.type!,
        parent_id: categoryData.parent_id,
        description: categoryData.description,
        icon: categoryData.icon || 'Wrench',
        color: categoryData.color || '#0ea5e9',
        sort_order: categoryData.sort_order || 0,
        equipment_types: categoryData.equipment_types || [],
        urgency_level: categoryData.urgency_level || 'medium',
        estimated_duration_hours: categoryData.estimated_duration_hours,
        required_certifications: categoryData.required_certifications || [],
        compliance_standards: categoryData.compliance_standards || [],
        is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
      };

      const { data, error } = await supabase
        .from('claims_repairs_categories')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      await fetchCategories(); // Refresh to rebuild hierarchy
      toast({
        title: "Success",
        description: "Category created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<ClaimsRepairsCategory>) => {
    try {
      const { data, error } = await supabase
        .from('claims_repairs_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchCategories(); // Refresh to rebuild hierarchy
      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('claims_repairs_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchCategories();
      toast({
        title: "Success",
        description: "Category deactivated successfully",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate category",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getCategoriesByType = (type: 'claims' | 'repairs') => {
    const filterByType = (cats: ClaimsRepairsCategory[]): ClaimsRepairsCategory[] => {
      return cats.filter(cat => cat.type === type || cat.type === 'both')
        .map(cat => ({
          ...cat,
          children: cat.children ? filterByType(cat.children) : []
        }));
    };
    return filterByType(categories);
  };

  const getFlatCategories = () => {
    const flatten = (cats: ClaimsRepairsCategory[]): ClaimsRepairsCategory[] => {
      let result: ClaimsRepairsCategory[] = [];
      cats.forEach(cat => {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          result = result.concat(flatten(cat.children));
        }
      });
      return result;
    };
    return flatten(categories);
  };

  const getCategoryById = (id: string): ClaimsRepairsCategory | undefined => {
    const findCategory = (cats: ClaimsRepairsCategory[]): ClaimsRepairsCategory | undefined => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findCategory(categories);
  };

  const getCategoryPath = (id: string): ClaimsRepairsCategory[] => {
    const findPath = (cats: ClaimsRepairsCategory[], targetId: string, path: ClaimsRepairsCategory[] = []): ClaimsRepairsCategory[] | null => {
      for (const cat of cats) {
        const currentPath = [...path, cat];
        if (cat.id === targetId) {
          return currentPath;
        }
        if (cat.children && cat.children.length > 0) {
          const found = findPath(cat.children, targetId, currentPath);
          if (found) return found;
        }
      }
      return null;
    };
    return findPath(categories, id) || [];
  };

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      await fetchCategories();
      setLoading(false);
    };

    loadCategories();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims_repairs_categories'
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    getFlatCategories,
    getCategoryById,
    getCategoryPath,
    refreshCategories: fetchCategories
  };
};