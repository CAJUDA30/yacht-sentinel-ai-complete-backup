/**
 * Optimal Camera Service for Yacht Sentinel AI
 * Standardized camera implementation with enhanced features for cross-app usage
 * 
 * Features:
 * - Progressive constraint fallback for maximum device compatibility
 * - Enhanced error handling with user-friendly messages
 * - AI guidance capabilities (edge detection, glare detection, focus assist)
 * - Resource management and cleanup
 * - Security context validation
 * - Permission management
 * - Device enumeration
 * - Image capture and processing
 */

// Camera constraints interface
export interface CameraConstraints {
  facingMode?: 'user' | 'environment' | { ideal: string };
  width?: { ideal: number; min?: number; max?: number };
  height?: { ideal: number; min?: number; max?: number };
  frameRate?: { ideal: number; min?: number; max?: number };
  aspectRatio?: { ideal: number };
}

// Camera capabilities interface
export interface CameraCapabilities {
  isSupported: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  isSecureContext: boolean;
  userAgent: string;
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'other';
  error?: string;
}

// Camera start result interface
export interface CameraStartResult {
  success: boolean;
  stream?: MediaStream;
  error?: string;
  constraints?: MediaStreamConstraints;
  deviceId?: string;
}

// AI analysis data interface
export interface CameraAnalysisData {
  edgeDetection: {
    detected: boolean;
    confidence: number;
    corners: Array<{ x: number; y: number }>;
  };
  glareDetection: {
    detected: boolean;
    severity: 'none' | 'low' | 'medium' | 'high';
    affectedAreas: Array<{ x: number; y: number; w: number; h: number }>;
  };
  focusAnalysis: {
    inFocus: boolean;
    sharpness: number;
    recommendation: string;
  };
  lighting: {
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    brightness: number;
    contrast: number;
    recommendation?: string;
  };
  documentDetection: {
    detected: boolean;
    type: string;
    confidence: number;
    boundingBox?: { x: number; y: number; w: number; h: number };
  };
}

// Camera service configuration
export interface CameraServiceConfig {
  enableAIAnalysis?: boolean;
  autoCaptureEnabled?: boolean;
  edgeDetection?: boolean;
  glareDetection?: boolean;
  focusAssist?: boolean;
  maxRetries?: number;
  timeout?: number;
  preferredConstraints?: Partial<CameraConstraints>;
}

// Camera service class
export class OptimalCameraService {
  private static instance: OptimalCameraService;
  private activeStreams: Map<string, MediaStream> = new Map();
  private analysisIntervals: Map<string, NodeJS.Timeout> = new Map();
  private config: CameraServiceConfig;
  
  private constructor(config?: CameraServiceConfig) {
    this.config = {
      enableAIAnalysis: true,
      autoCaptureEnabled: false,
      edgeDetection: true,
      glareDetection: true,
      focusAssist: true,
      maxRetries: 3,
      timeout: 15000,
      ...config
    };
  }

  static getInstance(config?: CameraServiceConfig): OptimalCameraService {
    if (!OptimalCameraService.instance) {
      OptimalCameraService.instance = new OptimalCameraService(config);
    }
    return OptimalCameraService.instance;
  }

  /**
   * Check device camera capabilities with enhanced browser detection
   */
  checkCapabilities(): CameraCapabilities {
    const hasMediaDevices = !!(navigator.mediaDevices);
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const isSecureContext = window.isSecureContext;
    const userAgent = navigator.userAgent;

    // Enhanced browser detection
    let browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'other' = 'other';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'safari';
    } else if (userAgent.includes('Edg')) {
      browser = 'edge';
    }

    let error: string | undefined;
    if (!hasMediaDevices) {
      error = 'MediaDevices API not supported';
    } else if (!hasGetUserMedia) {
      error = 'getUserMedia not available';
    } else if (!isSecureContext) {
      error = 'Camera requires secure context (HTTPS or localhost)';
    }

    return {
      isSupported: hasMediaDevices && hasGetUserMedia && isSecureContext,
      hasMediaDevices,
      hasGetUserMedia,
      isSecureContext,
      userAgent,
      browser,
      error
    };
  }

  /**
   * Get optimized camera constraints for different device types with enhanced options
   */
  getOptimizedConstraints(preferredConstraints?: Partial<CameraConstraints>): MediaStreamConstraints[] {
    const base = {
      facingMode: preferredConstraints?.facingMode || 'environment',
      ...preferredConstraints
    };

    return [
      // High quality for desktop/modern devices
      {
        video: {
          ...base,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      },
      // Medium quality for most devices
      {
        video: {
          ...base,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 24, min: 10 }
        },
        audio: false
      },
      // Basic quality for older devices
      {
        video: {
          facingMode: base.facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      },
      // Fallback - any available camera
      {
        video: true,
        audio: false
      }
    ];
  }

  /**
   * Start camera with progressive fallback and enhanced error handling
   */
  async startCamera(
    componentId: string,
    preferredConstraints?: Partial<CameraConstraints>,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<CameraStartResult> {
    try {
      // Check capabilities first
      const capabilities = this.checkCapabilities();
      if (!capabilities.isSupported) {
        return {
          success: false,
          error: capabilities.error || 'Camera not supported'
        };
      }

      // Stop any existing stream for this component
      await this.stopCamera(componentId);

      const constraintsList = this.getOptimizedConstraints(preferredConstraints);
      let lastError: any = null;
      let retryCount = 0;

      // Try each constraint configuration with retries
      for (const constraints of constraintsList) {
        while (retryCount <= maxRetries) {
          try {
            console.log(`Trying camera constraints (attempt ${retryCount + 1}):`, constraints);
            
            const stream = await this.requestCameraStream(constraints);
            
            // Store the stream
            this.activeStreams.set(componentId, stream);
            
            // Get device ID if available
            const deviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
            
            console.log(`Camera started successfully for ${componentId}:`, {
              constraints,
              deviceId,
              tracks: stream.getVideoTracks().map(track => ({
                label: track.label,
                settings: track.getSettings()
              }))
            });

            return {
              success: true,
              stream,
              constraints,
              deviceId
            };
          } catch (error: any) {
            console.log(`Camera constraint failed (attempt ${retryCount + 1}):`, constraints, error.message);
            lastError = error;
            
            // Don't retry if permission was denied
            if (error.name === 'NotAllowedError') {
              break;
            }
            
            retryCount++;
            
            // Wait before retrying
            if (retryCount <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            }
          }
        }
        
        // Reset retry count for next constraint
        retryCount = 0;
      }

      // All constraints failed
      return {
        success: false,
        error: this.getErrorMessage(lastError)
      };

    } catch (error: any) {
      console.error('Unexpected camera error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Request camera stream with timeout
   */
  private async requestCameraStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Camera initialization timeout'));
      }, this.config.timeout || 15000);

      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          clearTimeout(timeout);
          resolve(stream);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Stop camera stream for a component
   */
  async stopCamera(componentId: string): Promise<void> {
    const stream = this.activeStreams.get(componentId);
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log(`Stopping camera track: ${track.label}`);
        track.stop();
      });
      this.activeStreams.delete(componentId);
    }
    
    // Clear any analysis intervals
    const interval = this.analysisIntervals.get(componentId);
    if (interval) {
      clearInterval(interval);
      this.analysisIntervals.delete(componentId);
    }
  }

  /**
   * Stop all active camera streams
   */
  async stopAllCameras(): Promise<void> {
    for (const [componentId] of this.activeStreams) {
      await this.stopCamera(componentId);
    }
    
    // Clear all analysis intervals
    for (const [componentId, interval] of this.analysisIntervals) {
      clearInterval(interval);
    }
    this.analysisIntervals.clear();
  }

  /**
   * Get stream for a component
   */
  getStream(componentId: string): MediaStream | undefined {
    return this.activeStreams.get(componentId);
  }

  /**
   * Check if camera is active for a component
   */
  isActive(componentId: string): boolean {
    const stream = this.activeStreams.get(componentId);
    return !!(stream && stream.active);
  }

  /**
   * Setup video element with stream and enhanced error handling
   */
  async setupVideoElement(
    videoElement: HTMLVideoElement, 
    stream: MediaStream,
    options: {
      autoplay?: boolean;
      muted?: boolean;
      playsInline?: boolean;
      timeout?: number;
    } = {}
  ): Promise<void> {
    const {
      autoplay = true,
      muted = true,
      playsInline = true,
      timeout = this.config.timeout || 15000
    } = options;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Video setup timeout'));
      }, timeout);

      const onLoadedMetadata = async () => {
        cleanup();
        try {
          if (autoplay) {
            await videoElement.play();
          }
          resolve();
        } catch (playError: any) {
          reject(new Error(`Video play failed: ${playError.message}`));
        }
      };

      const onCanPlay = async () => {
        cleanup();
        try {
          if (autoplay) {
            await videoElement.play();
          }
          resolve();
        } catch (playError: any) {
          reject(new Error(`Video play failed: ${playError.message}`));
        }
      };

      const onError = (event: any) => {
        cleanup();
        reject(new Error(`Video element error: ${event.message || 'Unknown error'}`));
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('error', onError);
      };

      // Setup video element
      videoElement.srcObject = stream;
      videoElement.muted = muted;
      videoElement.playsInline = playsInline;

      // Add event listeners
      videoElement.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      videoElement.addEventListener('canplay', onCanPlay, { once: true });
      videoElement.addEventListener('error', onError, { once: true });

      // Try to play immediately if video is already ready
      if (videoElement.readyState >= 2 && autoplay) {
        onCanPlay();
      }
    });
  }

  /**
   * Capture image from video element with enhanced options
   */
  captureImage(
    videoElement: HTMLVideoElement,
    options: {
      quality?: number;
      format?: 'image/jpeg' | 'image/png' | 'image/webp';
      maxWidth?: number;
      maxHeight?: number;
      returnBlob?: boolean;
    } = {}
  ): string | Blob | null | Promise<Blob | null> {
    const {
      quality = 0.9,
      format = 'image/jpeg',
      maxWidth,
      maxHeight,
      returnBlob = false
    } = options;

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context not available');
      }

      // Calculate dimensions
      let { videoWidth: width, videoHeight: height } = videoElement;
      
      if (maxWidth && width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (maxHeight && height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw video frame
      context.drawImage(videoElement, 0, 0, width, height);

      // Return appropriate format
      if (returnBlob) {
        return new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, format, quality);
        });
      } else {
        return canvas.toDataURL(format, quality);
      }
    } catch (error) {
      console.error('Image capture error:', error);
      return null;
    }
  }

  /**
   * Get user-friendly error message with enhanced details
   */
  private getErrorMessage(error: any): string {
    if (!error) return 'Unknown camera error';

    switch (error.name) {
      case 'NotAllowedError':
        return 'Camera permission denied. Please enable camera access in browser settings and refresh the page.';
      case 'NotFoundError':
        return 'No camera found on this device. Please check if a camera is connected.';
      case 'NotReadableError':
        return 'Camera is already in use by another application. Please close other apps using the camera.';
      case 'OverconstrainedError':
        return 'Camera settings not supported on this device. Trying basic camera access...';
      case 'SecurityError':
        return 'Camera access blocked due to security restrictions. Please use HTTPS or localhost.';
      case 'TypeError':
        return 'Camera API not available or misconfigured. Please update your browser.';
      default:
        return error.message || 'Camera access failed. Please try again or use file upload instead.';
    }
  }

  /**
   * Check camera permissions
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return permission.state as 'granted' | 'denied' | 'prompt';
      }
      return 'unknown';
    } catch (error) {
      console.log('Permission check not supported:', error);
      return 'unknown';
    }
  }

  /**
   * Get available camera devices
   */
  async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Device enumeration error:', error);
      return [];
    }
  }

  /**
   * Start AI analysis for a component
   */
  startAIAnalysis(
    componentId: string,
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    callback: (analysis: CameraAnalysisData) => void,
    interval: number = 100
  ): void {
    // Clear any existing analysis interval
    this.stopAIAnalysis(componentId);
    
    // Create new analysis interval
    const analysisInterval = setInterval(() => {
      if (videoElement && canvasElement) {
        const analysisResult = this.performFrameAnalysis(videoElement, canvasElement);
        callback(analysisResult);
      }
    }, interval);
    
    this.analysisIntervals.set(componentId, analysisInterval);
  }

  /**
   * Stop AI analysis for a component
   */
  stopAIAnalysis(componentId: string): void {
    const interval = this.analysisIntervals.get(componentId);
    if (interval) {
      clearInterval(interval);
      this.analysisIntervals.delete(componentId);
    }
  }

  /**
   * Perform frame analysis for AI guidance features
   */
  performFrameAnalysis(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): CameraAnalysisData {
    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      return this.getDefaultAnalysisData();
    }

    // Set canvas size to match video
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Draw current frame
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
    
    // Perform analysis
    const edgeDetection = this.detectEdges(imageData, canvasElement.width, canvasElement.height);
    const glareDetection = this.detectGlare(imageData, canvasElement.width, canvasElement.height);
    const focusAnalysis = this.analyzeFocus(imageData, canvasElement.width, canvasElement.height);
    const lighting = this.analyzeLighting(imageData, canvasElement.width, canvasElement.height);
    const documentDetection = this.detectDocument(edgeDetection, canvasElement.width, canvasElement.height);

    return {
      edgeDetection,
      glareDetection,
      focusAnalysis,
      lighting,
      documentDetection
    };
  }

  /**
   * Get default analysis data
   */
  private getDefaultAnalysisData(): CameraAnalysisData {
    return {
      edgeDetection: {
        detected: false,
        confidence: 0,
        corners: []
      },
      glareDetection: {
        detected: false,
        severity: 'none',
        affectedAreas: []
      },
      focusAnalysis: {
        inFocus: false,
        sharpness: 0,
        recommendation: 'Position document properly'
      },
      lighting: {
        quality: 'poor',
        brightness: 0,
        contrast: 0,
        recommendation: 'Improve lighting conditions'
      },
      documentDetection: {
        detected: false,
        type: 'unknown',
        confidence: 0
      }
    };
  }

  /**
   * Edge detection (simplified Sobel edge detection)
   */
  private detectEdges(data: ImageData, width: number, height: number) {
    const edges = [];
    let edgePixels = 0;
    const threshold = 50;

    // Simplified edge detection - check for high contrast areas
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = (data.data[idx] + data.data[idx + 1] + data.data[idx + 2]) / 3;
        
        const right = ((data.data[idx + 4] + data.data[idx + 5] + data.data[idx + 6]) / 3);
        const bottom = ((data.data[(idx + width * 4)] + data.data[(idx + width * 4) + 1] + data.data[(idx + width * 4) + 2]) / 3);
        
        const gradient = Math.abs(current - right) + Math.abs(current - bottom);
        
        if (gradient > threshold) {
          edgePixels++;
          if (edges.length < 100) { // Limit edge points for performance
            edges.push({ x, y });
          }
        }
      }
    }

    const totalPixels = width * height;
    const edgeRatio = edgePixels / totalPixels;
    
    return {
      detected: edgeRatio > 0.1,
      confidence: Math.min(edgeRatio * 10, 1),
      corners: this.findCorners(edges, width, height)
    };
  }

  /**
   * Find corners from edge points
   */
  private findCorners(edges: Array<{ x: number; y: number }>, width: number, height: number) {
    if (edges.length < 4) return [];
    
    // Find corner candidates (simplified)
    const corners = [
      edges.reduce((min, p) => (p.x + p.y < min.x + min.y) ? p : min, edges[0]), // Top-left
      edges.reduce((max, p) => (p.x - p.y > max.x - max.y) ? p : max, edges[0]), // Top-right
      edges.reduce((max, p) => (p.x + p.y > max.x + max.y) ? p : max, edges[0]), // Bottom-right
      edges.reduce((min, p) => (p.x - p.y < min.x - min.y) ? p : min, edges[0])  // Bottom-left
    ];
    
    return corners;
  }

  /**
   * Glare detection
   */
  private detectGlare(data: ImageData, width: number, height: number) {
    let brightPixels = 0;
    const brightnessThreshold = 240; // 0-255 scale
    const totalPixels = width * height;

    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i];
      const g = data.data[i + 1];
      const b = data.data[i + 2];
      const brightness = (r + g + b) / 3;
      
      if (brightness > brightnessThreshold) {
        brightPixels++;
      }
    }

    const brightRatio = brightPixels / totalPixels;
    let severity: 'none' | 'low' | 'medium' | 'high' = 'none';
    
    if (brightRatio > 0.3) {
      severity = 'high';
    } else if (brightRatio > 0.15) {
      severity = 'medium';
    } else if (brightRatio > 0.05) {
      severity = 'low';
    }

    return {
      detected: brightRatio > 0.05,
      severity,
      affectedAreas: [] // Would be implemented with more complex analysis
    };
  }

  /**
   * Focus analysis
   */
  private analyzeFocus(data: ImageData, width: number, height: number) {
    // Simplified focus analysis based on edge sharpness
    const edgeData = this.detectEdges(data, width, height);
    const sharpness = edgeData.confidence;
    
    const inFocus = sharpness > 0.7;
    const recommendation = inFocus ? 
      'Good focus' : 
      'Move camera closer or adjust focus';

    return {
      inFocus,
      sharpness,
      recommendation
    };
  }

  /**
   * Lighting analysis
   */
  private analyzeLighting(data: ImageData, width: number, height: number) {
    let totalBrightness = 0;
    let totalContrast = 0;
    const pixelCount = width * height;

    // Calculate average brightness
    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i];
      const g = data.data[i + 1];
      const b = data.data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / pixelCount;
    
    // Determine lighting quality
    let quality: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
    let recommendation = 'Improve lighting conditions';
    
    if (avgBrightness > 200) {
      quality = 'excellent';
      recommendation = 'Lighting is excellent';
    } else if (avgBrightness > 150) {
      quality = 'good';
      recommendation = 'Lighting is good';
    } else if (avgBrightness > 100) {
      quality = 'fair';
      recommendation = 'Lighting is fair';
    }

    return {
      quality,
      brightness: avgBrightness,
      contrast: totalContrast / pixelCount,
      recommendation
    };
  }

  /**
   * Document detection
   */
  private detectDocument(edges: any, width: number, height: number) {
    // Simplified document detection based on edge detection
    const detected = edges.detected && edges.corners.length >= 4;
    const confidence = detected ? Math.min(edges.confidence * 1.2, 1) : 0;
    
    return {
      detected,
      type: 'document',
      confidence,
      boundingBox: detected ? {
        x: 0,
        y: 0,
        w: width,
        h: height
      } : undefined
    };
  }
}

// Export singleton instance
export const optimalCameraService = OptimalCameraService.getInstance();

// React hook for using optimal camera service
import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseOptimalCameraOptions {
  componentId: string;
  constraints?: Partial<CameraConstraints>;
  autoStart?: boolean;
  enableAIAnalysis?: boolean;
}

export interface UseOptimalCameraResult {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  capabilities: CameraCapabilities;
  stream: MediaStream | null;
  analysis: CameraAnalysisData | null;
  startCamera: () => Promise<void>;
  stopCamera: () => Promise<void>;
  captureImage: (videoElement: HTMLVideoElement, options?: Parameters<typeof optimalCameraService.captureImage>[1]) => string | Blob | null;
  setupVideoElement: (videoElement: HTMLVideoElement, options?: Parameters<typeof optimalCameraService.setupVideoElement>[2]) => Promise<void>;
}

export function useOptimalCamera(options: UseOptimalCameraOptions): UseOptimalCameraResult {
  const { componentId, constraints, autoStart = false, enableAIAnalysis = true } = options;
  
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities] = useState(() => optimalCameraService.checkCapabilities());
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analysis, setAnalysis] = useState<CameraAnalysisData | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    if (isLoading || isActive) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await optimalCameraService.startCamera(componentId, constraints);
      
      if (result.success && result.stream) {
        setStream(result.stream);
        setIsActive(true);
      } else {
        setError(result.error || 'Failed to start camera');
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected camera error');
    } finally {
      setIsLoading(false);
    }
  }, [componentId, constraints, isLoading, isActive]);

  const stopCamera = useCallback(async () => {
    try {
      await optimalCameraService.stopCamera(componentId);
      setStream(null);
      setIsActive(false);
      setError(null);
      setAnalysis(null);
    } catch (err: any) {
      console.error('Error stopping camera:', err);
    }
  }, [componentId]);

  const captureImage = useCallback((videoElement: HTMLVideoElement, captureOptions?: Parameters<typeof optimalCameraService.captureImage>[1]) => {
    return optimalCameraService.captureImage(videoElement, captureOptions);
  }, []);

  const setupVideoElement = useCallback(async (videoElement: HTMLVideoElement, setupOptions?: Parameters<typeof optimalCameraService.setupVideoElement>[2]) => {
    if (!stream) throw new Error('No active camera stream');
    return optimalCameraService.setupVideoElement(videoElement, stream, setupOptions);
  }, [stream]);

  // Auto-start camera if requested
  useEffect(() => {
    if (autoStart && capabilities.isSupported && !isActive && !isLoading) {
      startCamera();
    }
  }, [autoStart, capabilities.isSupported, isActive, isLoading, startCamera]);

  // Setup AI analysis if enabled
  useEffect(() => {
    if (enableAIAnalysis && isActive && stream) {
      // Start AI analysis
      const intervalId = setInterval(() => {
        if (videoRef.current && analysisCanvasRef.current) {
          const analysisResult = optimalCameraService.performFrameAnalysis(
            videoRef.current,
            analysisCanvasRef.current
          );
          setAnalysis(analysisResult);
        }
      }, 100);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [enableAIAnalysis, isActive, stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      optimalCameraService.stopCamera(componentId);
    };
  }, [componentId]);

  return {
    isActive,
    isLoading,
    error,
    capabilities,
    stream,
    analysis,
    startCamera,
    stopCamera,
    captureImage,
    setupVideoElement
  };
}