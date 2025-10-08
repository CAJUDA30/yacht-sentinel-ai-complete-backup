import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode, FC } from 'react';
import { geolocationService, GeolocationData } from '@/services/geolocationService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Debug mode for development - disabled for reduced logging in production
const DEBUG_MODE = process.env.NODE_ENV === 'development' && false; // Keep disabled to reduce log noise

// Debounce intervals in milliseconds
const LOCATION_UPDATE_DEBOUNCE = 5000; // 5 seconds
const WEATHER_UPDATE_DEBOUNCE = 30000; // 30 seconds

interface LocationContextType {
  currentLocation: string;
  coordinates: string;
  rawPosition: GeolocationData | null;
  weatherData: {
    temperature: string;
    windSpeed: string;
    seaConditions: string;
    waveHeight: string;
  };
  isLoading: boolean;
  updateLocation: () => Promise<void>;
  formatLocationForDisplay: () => string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

export const LocationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState("Getting location...");
  const [coordinates, setCoordinates] = useState("Loading...");
  const [rawPosition, setRawPosition] = useState<GeolocationData | null>(null);
  const [weatherData, setWeatherData] = useState({
    temperature: "Loading...",
    windSpeed: "Loading...",
    seaConditions: "Loading...",
    waveHeight: "Loading..."
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Debouncing refs
  const lastLocationUpdate = useRef<number>(0);
  const lastWeatherUpdate = useRef<number>(0);
  const locationUpdateTimeout = useRef<NodeJS.Timeout | null>(null);

  // We'll use a ref to avoid circular dependency with RealtimeContext
  const broadcastLocationUpdate = useCallback((data: any) => {
    if (DEBUG_MODE) {
      console.log('Location update available for broadcast:', data);
    }
  }, []);

  const fetchWeatherData = async (position: GeolocationData) => {
    const now = Date.now();
    if (now - lastWeatherUpdate.current < WEATHER_UPDATE_DEBOUNCE) {
      return; // Skip weather update if too recent
    }
    
    lastWeatherUpdate.current = now;
    
    try {
      const weatherResponse = await supabase.functions.invoke('windy-weather', {
        body: {
          latitude: position.latitude,
          longitude: position.longitude,
          parameters: ['wind', 'temp', 'waves', 'visibility']
        }
      });

      if (weatherResponse.data) {
        const weather = weatherResponse.data;
        const newWeatherData = {
          temperature: `${Math.round(weather.current.temperature)}°C`,
          windSpeed: `${Math.round(weather.current.windSpeed)} kts`,
          seaConditions: weather.current.conditions,
          waveHeight: `${weather.current.waveHeight.toFixed(1)}m`
        };
        setWeatherData(newWeatherData);
        
        // Broadcast weather update
        broadcastLocationUpdate({
          type: 'weather',
          data: newWeatherData
        });
      }
    } catch (error) {
      if (DEBUG_MODE) {
        console.error('Weather fetch failed:', error);
      }
      setWeatherData({
        temperature: "24°C",
        windSpeed: "8 kts",
        seaConditions: "Clear",
        waveHeight: "0.5m"
      });
    }
  };

  const reverseGeocode = async (position: GeolocationData): Promise<string> => {
    try {
      const geocodeResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.latitude}&longitude=${position.longitude}&localityLanguage=en`
      );
      const geocodeData = await geocodeResponse.json();
      return geocodeData.city || geocodeData.locality || geocodeData.countryName || 'Open Ocean';
    } catch (error) {
      if (DEBUG_MODE) {
        console.log('Geocoding failed, using default location');
      }
      return 'Open Ocean';
    }
  };

  const updateLocation = useCallback(async () => {
    const now = Date.now();
    if (now - lastLocationUpdate.current < LOCATION_UPDATE_DEBOUNCE) {
      return; // Skip update if too recent
    }
    
    lastLocationUpdate.current = now;
    setIsLoading(true);
    
    try {
      const position = await geolocationService.getCurrentPosition();
      if (DEBUG_MODE) {
        console.log('Location updated:', position);
      }
      
      setRawPosition(position);
      const formattedCoordinates = geolocationService.formatCoordinates(position.latitude, position.longitude);
      setCoordinates(formattedCoordinates);
      
      const locationName = await reverseGeocode(position);
      setCurrentLocation(locationName);
      
      // Broadcast location update
      broadcastLocationUpdate({
        type: 'location',
        data: {
          location: locationName,
          coordinates: formattedCoordinates,
          position
        }
      });
      
      await fetchWeatherData(position);
      
    } catch (error) {
      // Silently handle geolocation errors without console logging
      setCurrentLocation("GPS Required");
      setCoordinates("Location access required");
      setWeatherData({
        temperature: "GPS Required",
        windSpeed: "GPS Required", 
        seaConditions: "GPS Required",
        waveHeight: "GPS Required"
      });
      
      // Only show toast for HTTPS requirement, not permission denial
      if (error.code === 1 && location.protocol === 'http:') {
        toast({
          title: "HTTPS Required",
          description: "Location services require a secure connection. Please use HTTPS.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast, broadcastLocationUpdate]);

  const formatLocationForDisplay = useCallback(() => {
    if (isLoading) return "Loading...";
    return currentLocation === "GPS Required" ? "GPS Access Required" : currentLocation;
  }, [currentLocation, isLoading]);

  useEffect(() => {
    updateLocation();
    
    // Start continuous tracking with debouncing
    geolocationService.startWatching();
    geolocationService.addListener(async (newPosition) => {
      if (DEBUG_MODE) {
        console.log('Position updated:', newPosition);
      }
      
      // Clear existing timeout
      if (locationUpdateTimeout.current) {
        clearTimeout(locationUpdateTimeout.current);
      }
      
      // Debounce position updates
      locationUpdateTimeout.current = setTimeout(async () => {
        setRawPosition(newPosition);
        const newCoordinates = geolocationService.formatCoordinates(newPosition.latitude, newPosition.longitude);
        setCoordinates(newCoordinates);
        
        // Update location name periodically (every ~1km movement)
        if (!rawPosition || 
            geolocationService.calculateDistance(
              rawPosition.latitude, rawPosition.longitude,
              newPosition.latitude, newPosition.longitude
            ) > 1000) {
          const locationName = await reverseGeocode(newPosition);
          setCurrentLocation(locationName);
        }
      }, 2000); // Debounce by 2 seconds
    });

    return () => {
      geolocationService.stopWatching();
      if (locationUpdateTimeout.current) {
        clearTimeout(locationUpdateTimeout.current);
      }
    };
  }, [updateLocation]);

  return (
    <LocationContext.Provider value={{
      currentLocation,
      coordinates,
      rawPosition,
      weatherData,
      isLoading,
      updateLocation,
      formatLocationForDisplay
    }}>
      {children}
    </LocationContext.Provider>
  );
};