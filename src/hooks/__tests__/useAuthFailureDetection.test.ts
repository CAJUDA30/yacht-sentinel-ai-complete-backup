/**
 * Authentication Failure Detection System - Test Suite
 * 
 * This file contains tests to verify the immediate authentication failure detection
 * and redirection system works correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthFailureDetection } from '@/hooks/useAuthFailureDetection';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// Mock the useSupabaseAuth hook
vi.mock('@/hooks/useSupabaseAuth');

// Mock window.location
const mockLocation = {
  href: ''
};

describe('Authentication Failure Detection System', () => {
  beforeEach(() => {
    // Reset location mock
    mockLocation.href = '';
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true
    });
  });

  describe('useAuthFailureDetection', () => {
    it('should detect authentication loss and redirect immediately', async () => {
      // First render - user is authenticated
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'test-user-id' } } as any,
        loading: false,
      } as any);

      const { rerender } = renderHook(() => useAuthFailureDetection());

      // Second render - user loses authentication
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: false,
        isSuperAdmin: false,
        session: null,
        loading: false,
      } as any);

      rerender();

      // Verify immediate redirect
      await waitFor(() => {
        expect(window.location.href).toBe('/auth');
      });
    });

    it('should detect superadmin role loss and redirect immediately', async () => {
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      
      // First render - user is superadmin
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: true,
        session: { user: { id: 'superadmin-id' } } as any,
        loading: false,
      } as any);

      const { rerender } = renderHook(() => useAuthFailureDetection());

      // Second render - superadmin role lost but still authenticated
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'superadmin-id' } } as any,
        loading: false,
      } as any);

      rerender();

      // Verify immediate redirect
      await waitFor(() => {
        expect(window.location.href).toBe('/auth');
      });
    });

    it('should detect session ID change and redirect immediately', async () => {
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      
      // First render - original session
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'original-session-id' } } as any,
        loading: false,
      } as any);

      const { rerender } = renderHook(() => useAuthFailureDetection());

      // Second render - session ID changed (potential security issue)
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'different-session-id' } } as any,
        loading: false,
      } as any);

      rerender();

      // Verify immediate redirect
      await waitFor(() => {
        expect(window.location.href).toBe('/auth');
      });
    });

    it('should not redirect during initial loading', async () => {
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      
      // Render while loading
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: false,
        isSuperAdmin: false,
        session: null,
        loading: true,
      } as any);

      renderHook(() => useAuthFailureDetection());

      // Wait a bit to ensure no redirect happens
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify no redirect occurred
      expect(window.location.href).toBe('');
    });

    it('should not redirect when authentication state remains stable', async () => {
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      
      // First render - authenticated
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'test-user-id' } } as any,
        loading: false,
      } as any);

      const { rerender } = renderHook(() => useAuthFailureDetection());

      // Second render - still authenticated with same session
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'test-user-id' } } as any,
        loading: false,
      } as any);

      rerender();

      // Wait to ensure no redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify no redirect occurred
      expect(window.location.href).toBe('');
    });
  });

  describe('Integration Tests', () => {
    it('should handle rapid authentication state changes', async () => {
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      
      // Authenticated
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'user-1' } } as any,
        loading: false,
      } as any);

      const { rerender } = renderHook(() => useAuthFailureDetection());

      // Rapid changes
      for (let i = 0; i < 5; i++) {
        mockUseSupabaseAuth.mockReturnValue({
          isAuthenticated: true,
          isSuperAdmin: false,
          session: { user: { id: `user-${i}` } } as any,
          loading: false,
        } as any);
        rerender();
      }

      // Finally lose authentication
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: false,
        isSuperAdmin: false,
        session: null,
        loading: false,
      } as any);

      rerender();

      // Should redirect on the authentication loss
      await waitFor(() => {
        expect(window.location.href).toBe('/auth');
      });
    });

    it('should handle superadmin to user downgrade scenario', async () => {
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Superadmin authenticated
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: true,
        session: { user: { id: 'superadmin-id', email: 'superadmin@yachtexcel.com' } } as any,
        loading: false,
      } as any);

      const { rerender } = renderHook(() => useAuthFailureDetection());

      // Downgraded to regular user
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'superadmin-id', email: 'superadmin@yachtexcel.com' } } as any,
        loading: false,
      } as any);

      rerender();

      // Should log the failure
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('🚨 AUTH FAILURE DETECTED BY GLOBAL MONITOR')
        );
      });

      // Should redirect immediately
      expect(window.location.href).toBe('/auth');

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null to authenticated transition correctly', async () => {
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      
      // Initial state - not authenticated
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: false,
        isSuperAdmin: false,
        session: null,
        loading: false,
      } as any);

      const { rerender } = renderHook(() => useAuthFailureDetection());

      // User logs in
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'new-user-id' } } as any,
        loading: false,
      } as any);

      rerender();

      // Wait to ensure no redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not redirect when going from unauthenticated to authenticated
      expect(window.location.href).toBe('');
    });

    it('should handle loading to authenticated transition correctly', async () => {
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      
      // Loading state
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: false,
        isSuperAdmin: false,
        session: null,
        loading: true,
      } as any);

      const { rerender } = renderHook(() => useAuthFailureDetection());

      // Loading complete - user authenticated
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'user-id' } } as any,
        loading: false,
      } as any);

      rerender();

      // Wait to ensure no redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not redirect on initial load
      expect(window.location.href).toBe('');
    });
  });

  describe('Performance Tests', () => {
    it('should detect failure within acceptable time frame', async () => {
      const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);
      
      // Authenticated
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: true,
        isSuperAdmin: false,
        session: { user: { id: 'user-id' } } as any,
        loading: false,
      } as any);

      const { rerender } = renderHook(() => useAuthFailureDetection());

      const startTime = Date.now();

      // Lose authentication
      mockUseSupabaseAuth.mockReturnValue({
        isAuthenticated: false,
        isSuperAdmin: false,
        session: null,
        loading: false,
      } as any);

      rerender();

      await waitFor(() => {
        expect(window.location.href).toBe('/auth');
      });

      const detectionTime = Date.now() - startTime;

      // Should detect and redirect within 100ms
      expect(detectionTime).toBeLessThan(100);
    });
  });
});
