/**
 * User Role Service
 * Handles synchronization between database user roles and app settings
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserRoleInfo {
  userId: string;
  email: string;
  yachtId?: string; // Current yacht context
  roles: Array<{
    role: string;
    yachtId?: string;
    isActive: boolean;
  }>;
  primaryRole: 'user' | 'manager' | 'admin' | 'superadmin' | 'viewer';
  isSuper: boolean;
  availableYachts: string[]; // Yachts where user has any role
}

class UserRoleService {
  private static instance: UserRoleService;
  private userRoleCache: Map<string, UserRoleInfo> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UserRoleService {
    if (!UserRoleService.instance) {
      UserRoleService.instance = new UserRoleService();
    }
    return UserRoleService.instance;
  }

  /**
   * Get user role information from database with robust fallback
   */
  async getUserRoleInfo(userId: string): Promise<UserRoleInfo | null> {
    try {
      // Check cache first
      const cached = this.getUserFromCache(userId);
      if (cached) {
        return cached;
      }

      // Get current user info from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || user.id !== userId) {
        console.error('Failed to get current user or user ID mismatch:', userError);
        return null;
      }

      // Special case for the designated superadmin user - hardcoded for reliability
      if (userId === '6d201176-5be1-45d4-b09f-f70cb4ad38ac' || user.email === 'superadmin@yachtexcel.com') {
        console.log('[UserRoleService] Designated superadmin user detected');
        const superAdminInfo: UserRoleInfo = {
          userId,
          email: user.email || 'superadmin@yachtexcel.com',
          roles: [{ role: 'superadmin', isActive: true }],
          primaryRole: 'superadmin',
          isSuper: true,
          availableYachts: []
        };
        
        // Cache the result
        this.cacheUserRole(userId, superAdminInfo);
        return superAdminInfo;
      }

      // Try to fetch roles from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Failed to fetch user roles:', rolesError);
        
        // If table doesn't exist, provide fallback based on user info
        if (rolesError.message?.includes('does not exist') || rolesError.message?.includes('relation') || rolesError.code === 'PGRST116') {
          console.log('[UserRoleService] user_roles table does not exist, providing fallback role');
          
          // Check if this might be the superadmin user by email
          if (user.email === 'superadmin@yachtexcel.com') {
            const superAdminFallback: UserRoleInfo = {
              userId,
              email: user.email,
              roles: [{ role: 'superadmin', isActive: true }],
              primaryRole: 'superadmin',
              isSuper: true,
              availableYachts: []
            };
            
            this.cacheUserRole(userId, superAdminFallback);
            return superAdminFallback;
          }
          
          // Default fallback for regular users
          const fallbackInfo: UserRoleInfo = {
            userId,
            email: user.email || '',
            roles: [{ role: 'user', isActive: true }],
            primaryRole: 'user',
            isSuper: false,
            availableYachts: []
          };
          
          this.cacheUserRole(userId, fallbackInfo);
          return fallbackInfo;
        }
        
        return null;
      }

      const roles = (userRoles || []).map(r => r.role);
      const isSuper = roles.includes('superadmin');
      
      // If no roles found in database, apply defaults
      if (roles.length === 0) {
        console.log('[UserRoleService] No roles found in database, applying default');
        
        // Check again for superadmin user
        if (user.email === 'superadmin@yachtexcel.com') {
          const superAdminDefault: UserRoleInfo = {
            userId,
            email: user.email,
            roles: [{ role: 'superadmin', isActive: true }],
            primaryRole: 'superadmin',
            isSuper: true,
            availableYachts: []
          };
          
          this.cacheUserRole(userId, superAdminDefault);
          return superAdminDefault;
        }
        
        // Default to 'user' role
        const defaultUserInfo: UserRoleInfo = {
          userId,
          email: user.email || '',
          roles: [{ role: 'user', isActive: true }],
          primaryRole: 'user',
          isSuper: false,
          availableYachts: []
        };
        
        this.cacheUserRole(userId, defaultUserInfo);
        return defaultUserInfo;
      }
      
      // Determine primary role (highest level)
      const roleHierarchy = {
        viewer: 0,
        user: 1,
        manager: 2,
        admin: 3,
        superadmin: 4
      };

      let primaryRole: UserRoleInfo['primaryRole'] = 'user';
      let highestLevel = 0;

      roles.forEach(role => {
        const level = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
        if (level > highestLevel) {
          highestLevel = level;
          primaryRole = role as UserRoleInfo['primaryRole'];
        }
      });

      const userRoleInfo: UserRoleInfo = {
        userId,
        email: user.email || '',
        roles: roles.map(role => ({ role, isActive: true })),
        primaryRole,
        isSuper,
        availableYachts: []
      };

      // Cache the result
      this.cacheUserRole(userId, userRoleInfo);

      return userRoleInfo;

    } catch (error) {
      console.error('Error fetching user role info:', error);
      
      // Emergency fallback check for superadmin user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && (user.id === userId) && (user.id === '6d201176-5be1-45d4-b09f-f70cb4ad38ac' || user.email === 'superadmin@yachtexcel.com')) {
          const emergencyFallback: UserRoleInfo = {
            userId,
            email: user.email || 'superadmin@yachtexcel.com',
            roles: [{ role: 'superadmin', isActive: true }],
            primaryRole: 'superadmin',
            isSuper: true,
            availableYachts: []
          };
          
          this.cacheUserRole(userId, emergencyFallback);
          return emergencyFallback;
        }
      } catch (fallbackError) {
        console.error('Emergency fallback failed:', fallbackError);
      }
      
      return null;
    }
  }

  /**
   * Get current user's role information
   */
  async getCurrentUserRoleInfo(): Promise<UserRoleInfo | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      return this.getUserRoleInfo(user.id);
    } catch (error) {
      console.error('Error fetching current user role info:', error);
      return null;
    }
  }

  /**
   * Sync user roles to auth metadata
   */
  async syncUserRolesToAuth(userId: string): Promise<boolean> {
    try {
      const userRoleInfo = await this.getUserRoleInfo(userId);
      if (!userRoleInfo) {
        return false;
      }

      // Call sync-user-roles edge function
      const { data, error } = await supabase.functions.invoke('sync-user-roles');
      
      if (error) {
        console.error('Failed to sync user roles to auth:', error);
        return false;
      }

      console.log('Successfully synced user roles to auth metadata:', data);
      return true;

    } catch (error) {
      console.error('Error syncing user roles to auth:', error);
      return false;
    }
  }

  /**
   * Check if user has superadmin role
   */
  async isSuperAdmin(userId?: string): Promise<boolean> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        userId = user.id;
      }

      // Quick check for designated superadmin user
      if (userId === '6d201176-5be1-45d4-b09f-f70cb4ad38ac') {
        return true;
      }

      const userRoleInfo = await this.getUserRoleInfo(userId);
      return userRoleInfo?.isSuper || false;

    } catch (error) {
      console.error('Error checking superadmin status:', error);
      // Fallback check for designated superadmin user
      if (userId === '6d201176-5be1-45d4-b09f-f70cb4ad38ac') {
        return true;
      }
      return false;
    }
  }

  /**
   * Cache user role information
   */
  private cacheUserRole(userId: string, userRoleInfo: UserRoleInfo): void {
    this.userRoleCache.set(userId, userRoleInfo);
    this.cacheExpiry.set(userId, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Get user role from cache if valid
   */
  private getUserFromCache(userId: string): UserRoleInfo | null {
    const expiry = this.cacheExpiry.get(userId);
    if (expiry && Date.now() < expiry) {
      return this.userRoleCache.get(userId) || null;
    }

    // Clean up expired cache
    this.userRoleCache.delete(userId);
    this.cacheExpiry.delete(userId);
    return null;
  }

  /**
   * Clear cache for a specific user
   */
  clearUserCache(userId: string): void {
    this.userRoleCache.delete(userId);
    this.cacheExpiry.delete(userId);
  }

  /**
   * Clear all cached user data
   */
  clearAllCache(): void {
    this.userRoleCache.clear();
    this.cacheExpiry.clear();
  }
}

export const userRoleService = UserRoleService.getInstance();