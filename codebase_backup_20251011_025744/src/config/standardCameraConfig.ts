/**
 * Standard Camera Configuration for Yacht Sentinel AI
 * Centralized configuration for optimal camera usage across the application
 */

// Standard camera constraints for different use cases
export const StandardCameraConstraints = {
  // High quality for detailed document scanning
  DOCUMENT_SCANNING: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 },
    frameRate: { ideal: 30, min: 15 },
    aspectRatio: { ideal: 16/9 }
  },
  
  // Medium quality for general use
  GENERAL_USE: {
    facingMode: 'environment',
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    frameRate: { ideal: 24, min: 10 }
  },
  
  // Low quality for older devices or bandwidth constraints
  LOW_BANDWIDTH: {
    facingMode: 'environment',
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 15, min: 10 }
  },
  
  // Barcode/QR code scanning (optimized for recognition)
  BARCODE_SCANNING: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    aspectRatio: { ideal: 4/3 }
  },
  
  // Portrait/selfie mode
  PORTRAIT_MODE: {
    facingMode: { ideal: 'user' },
    width: { ideal: 1280, min: 640 },
    height: { ideal: 1600, min: 800 },
    aspectRatio: { ideal: 9/16 }
  }
};

// Standard camera service configuration
export const StandardCameraServiceConfig = {
  // Enable AI analysis features
  enableAIAnalysis: true,
  
  // Auto-capture when document is detected with good quality
  autoCaptureEnabled: false,
  
  // AI analysis features
  edgeDetection: true,
  glareDetection: true,
  focusAssist: true,
  
  // Retry configuration
  maxRetries: 3,
  
  // Timeout for camera operations (milliseconds)
  timeout: 15000,
  
  // Preferred constraints (can be overridden per use case)
  preferredConstraints: StandardCameraConstraints.GENERAL_USE
};

// Standard error messages
export const StandardCameraErrorMessages = {
  PERMISSION_DENIED: 'Camera permission denied. Please enable camera access in browser settings and refresh the page.',
  NO_CAMERA_FOUND: 'No camera found on this device. Please check if a camera is connected.',
  CAMERA_IN_USE: 'Camera is already in use by another application. Please close other apps using the camera.',
  CONSTRAINTS_NOT_SUPPORTED: 'Camera settings not supported on this device. Trying basic camera access...',
  SECURITY_ERROR: 'Camera access blocked due to security restrictions. Please use HTTPS or localhost.',
  API_NOT_AVAILABLE: 'Camera API not available or misconfigured. Please update your browser.',
  UNKNOWN_ERROR: 'Camera access failed. Please try again or use file upload instead.'
};

// Standard capabilities check
export const StandardCameraCapabilities = {
  // Browsers with excellent camera support
  EXCELLENT_SUPPORT: ['chrome', 'edge', 'firefox'],
  
  // Browsers with good camera support
  GOOD_SUPPORT: ['safari'],
  
  // Minimum requirements
  MINIMUM_REQUIREMENTS: {
    secureContext: true,
    mediaDevices: true,
    getUserMedia: true
  }
};

// Standard analysis thresholds
export const StandardAnalysisThresholds = {
  // Edge detection
  EDGE_DETECTION_THRESHOLD: 0.1, // 10% of pixels need to be edges
  
  // Glare detection
  GLARE_THRESHOLDS: {
    HIGH: 0.3,    // 30% of pixels are very bright
    MEDIUM: 0.15, // 15% of pixels are bright
    LOW: 0.05     // 5% of pixels are bright
  },
  
  // Focus analysis
  FOCUS_THRESHOLD: 0.7, // 70% sharpness required for good focus
  
  // Lighting analysis
  LIGHTING_THRESHOLDS: {
    EXCELLENT: 200, // Average brightness
    GOOD: 150,
    FAIR: 100,
    POOR: 0
  },
  
  // Document detection
  DOCUMENT_CONFIDENCE_THRESHOLD: 0.8 // 80% confidence required
};

// Standard capture settings
export const StandardCaptureSettings = {
  // Image quality
  QUALITY: 0.9,
  
  // Default format
  FORMAT: 'image/jpeg' as const,
  
  // Maximum dimensions
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  
  // Return type
  RETURN_BLOB: false
};

// Standard UI settings
export const StandardUISettings = {
  // Show AI guidance overlay
  SHOW_GUIDANCE: true,
  
  // Auto-capture countdown
  AUTO_CAPTURE_COUNTDOWN: 3, // seconds
  
  // Analysis update interval
  ANALYSIS_INTERVAL: 100, // milliseconds
  
  // Show analysis badges
  SHOW_ANALYSIS_BADGES: true,
  
  // Show guidance messages
  SHOW_GUIDANCE_MESSAGES: true
};

// Export all as a single configuration object
export const StandardCameraConfig = {
  constraints: StandardCameraConstraints,
  service: StandardCameraServiceConfig,
  errors: StandardCameraErrorMessages,
  capabilities: StandardCameraCapabilities,
  analysis: StandardAnalysisThresholds,
  capture: StandardCaptureSettings,
  ui: StandardUISettings
};

export default StandardCameraConfig;