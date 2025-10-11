interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  altitude?: number;
  timestamp: number;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

class GeolocationService {
  private watchId: number | null = null;
  private currentPosition: GeolocationData | null = null;
  private listeners: ((position: GeolocationData) => void)[] = [];

  async getCurrentPosition(options: GeolocationOptions = {}): Promise<GeolocationData> {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000, // Extended timeout for enterprise GPS
      maximumAge: 30000, // Shorter cache for real-time accuracy
      ...options
    };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoData: GeolocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            altitude: position.coords.altitude || undefined,
            timestamp: position.timestamp
          };
          
          this.currentPosition = geoData;
          resolve(geoData);
        },
        (error) => {
          reject(error);
        },
        defaultOptions
      );
    });
  }

  startWatching(options: GeolocationOptions = {}): void {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000, // Extended timeout for enterprise GPS
      maximumAge: 30000, // Shorter cache for real-time accuracy
      ...options
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const geoData: GeolocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          altitude: position.coords.altitude || undefined,
          timestamp: position.timestamp
        };
        
        this.currentPosition = geoData;
        this.notifyListeners(geoData);
      },
      (error) => {
        // Handle geolocation errors gracefully - these are expected in some environments
        // Suppress console warnings for common permission/security issues
        if (error.code === error.PERMISSION_DENIED) {
          // Silently handle permission denied
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          // Silently handle position unavailable
        } else if (error.code === error.TIMEOUT) {
          // Silently handle timeout
        }
        // Only log unexpected errors
        if (error.code !== error.PERMISSION_DENIED && 
            error.code !== error.POSITION_UNAVAILABLE && 
            error.code !== error.TIMEOUT) {
          console.warn('Unexpected geolocation error:', error.message || 'Unknown error');
        }
      },
      defaultOptions
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  addListener(callback: (position: GeolocationData) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (position: GeolocationData) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(position: GeolocationData): void {
    this.listeners.forEach(listener => listener(position));
  }

  getLastKnownPosition(): GeolocationData | null {
    return this.currentPosition;
  }

  // Convert coordinates to human-readable location string
  formatCoordinates(lat: number, lng: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
  }

  // Calculate distance between two points (in nautical miles)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const geolocationService = new GeolocationService();
export type { GeolocationData, GeolocationOptions };