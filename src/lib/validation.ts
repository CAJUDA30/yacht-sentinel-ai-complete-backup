import { z } from 'zod';

// =============================================
// AUTHENTICATION VALIDATION SCHEMAS
// =============================================

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(254, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
});

export const signupSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(254, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// =============================================
// API INPUT VALIDATION SCHEMAS
// =============================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// =============================================
// SETTINGS VALIDATION SCHEMAS
// =============================================

export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().min(2).max(5).default('en'),
  timezone: z.string().default('UTC'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false)
  }).default({ email: true, push: true, sms: false }),
  privacy: z.object({
    profileVisible: z.boolean().default(true),
    dataCollection: z.boolean().default(false),
    analytics: z.boolean().default(false)
  }).default({ profileVisible: true, dataCollection: false, analytics: false })
});

export const systemSettingsSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  registrationEnabled: z.boolean().default(true),
  maxFileSize: z.number().int().min(1).max(100).default(10), // MB
  sessionTimeout: z.number().int().min(5).max(1440).default(30), // minutes
  rateLimiting: z.object({
    enabled: z.boolean().default(true),
    requestsPerMinute: z.number().int().min(1).max(1000).default(100),
    burstLimit: z.number().int().min(1).max(100).default(20)
  }).default({ enabled: true, requestsPerMinute: 100, burstLimit: 20 })
});

// =============================================
// AI CONFIGURATION VALIDATION
// =============================================

export const aiModelConfigSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  apiKey: z.string().min(1, 'API key is required'),
  endpoint: z.string().url('Invalid endpoint URL').optional(),
  maxTokens: z.number().int().min(1).max(32000).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  timeout: z.number().int().min(1).max(300).default(30), // seconds
  enabled: z.boolean().default(true)
});

// =============================================
// DATABASE RECORD VALIDATION
// =============================================

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  quantity: z.number().int().min(0),
  minStock: z.number().int().min(0).default(1),
  location: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  price: z.number().min(0).optional(),
  supplier: z.string().max(255).optional(),
  partNumber: z.string().max(100).optional()
});

export const auditItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  evaluationType: z.enum(['ok_ko', 'rating', 'text', 'numeric']).default('ok_ko'),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

// =============================================
// UTILITY VALIDATION FUNCTIONS
// =============================================

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateFileUpload = (file: File, maxSizeMB: number = 10): string | null => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (!allowedTypes.includes(file.type)) {
    return 'File type not allowed';
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size exceeds ${maxSizeMB}MB limit`;
  }

  return null;
};

export const validateIPAddress = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

// =============================================
// TYPE EXPORTS
// =============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type SystemSettings = z.infer<typeof systemSettingsSchema>;
export type AIModelConfig = z.infer<typeof aiModelConfigSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type AuditItem = z.infer<typeof auditItemSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;