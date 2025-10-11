import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SafetyZone {
  id: string;
  zone_name: string;
  zone_type: string;
  country: string;
  center_point: any;
  safety_rating: number;
  facilities: any;
  contact_info: any;
  risk_factors: string[];
  recommended_actions: string[];
  distance_km?: number;
}

export interface WeatherCondition {
  id: string;
  location: any;
  observation_time: string;
  temperature_c: number;
  wind_speed_kts: number;
  wind_direction_deg: number;
  wave_height_m?: number;
  visibility_km: number;
  safety_score: number;
  risk_level: string;
  weather_warnings: string[];
}

export interface LocationRecommendation {
  id: string;
  yacht_id: string;
  recommendation_type: string;
  priority_level: string;
  recommendation_title: string;
  recommendation_description: string;
  immediate_actions: string[];
  recommended_locations: any;
  confidence_score: number;
  recommendation_status: string;
  issued_at: string;
  expires_at: string;
}

export interface SafetyEquipment {
  id: string;
  yacht_id: string;
  equipment_type: string;
  equipment_name: string;
  location_on_vessel: string;
  quantity: number;
  last_inspection_date: string;
  next_inspection_due: string;
  condition_status: string;
  operational_status: string;
}

export interface EmergencyContact {
  id: string;
  contact_name: string;
  contact_type: string;
  organization: string;
  phone_primary: string;
  phone_emergency: string;
  country: string;
  services_provided: string[];
  response_time_minutes: number;
}

export interface SafetyAssessment {
  overall_score: number;
  risk_level: string;
  weather_risk: string;
  equipment_issues: number;
  assessed_at: string;
}

// Main safety management hook
export function useSafety(yachtId?: string) {
  const [loading, setLoading] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<SafetyAssessment | null>(null);
  const { toast } = useToast();

  const callSafetyAPI = useCallback(async (action: string, data?: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('golden-safety', {
        body: {
          action,
          yacht_id: yachtId,
          ...data
        }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Safety ${action} error:`, error);
      toast({
        title: "Safety Error",
        description: `Failed to ${action}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [yachtId, toast]);

  const assessLocationSafety = useCallback(async (location: { lat: number; lng: number }) => {
    setLoading(true);
    try {
      const result = await callSafetyAPI('assess_location', { location });
      setCurrentAssessment({
        overall_score: result.safety_score,
        risk_level: result.risk_level,
        weather_risk: result.weather_data?.risk_level || 'unknown',
        equipment_issues: 0, // Would be calculated from equipment check
        assessed_at: new Date().toISOString()
      });
      return result;
    } finally {
      setLoading(false);
    }
  }, [callSafetyAPI]);

  const getRecommendations = useCallback(async (location: { lat: number; lng: number }) => {
    return await callSafetyAPI('get_recommendations', { location });
  }, [callSafetyAPI]);

  const updateWeather = useCallback(async (location: { lat: number; lng: number }) => {
    return await callSafetyAPI('update_weather', { location });
  }, [callSafetyAPI]);

  const handleEmergency = useCallback(async (
    location: { lat: number; lng: number },
    emergencyType: string
  ) => {
    return await callSafetyAPI('emergency_response', {
      location,
      emergency_type: emergencyType
    });
  }, [callSafetyAPI]);

  const analyzeRoute = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) => {
    return await callSafetyAPI('route_safety', {
      location: origin,
      destination
    });
  }, [callSafetyAPI]);

  const checkEquipment = useCallback(async () => {
    return await callSafetyAPI('equipment_check');
  }, [callSafetyAPI]);

  return {
    loading,
    currentAssessment,
    assessLocationSafety,
    getRecommendations,
    updateWeather,
    handleEmergency,
    analyzeRoute,
    checkEquipment
  };
}

// Location-based recommendations hook
export function useLocationRecommendations(yachtId?: string) {
  const [recommendations, setRecommendations] = useState<LocationRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRecommendations = useCallback(async () => {
    if (!yachtId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('location_recommendations')
        .select('*')
        .eq('yacht_id', yachtId)
        .eq('recommendation_status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('priority_level', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load safety recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [yachtId, toast]);

  const acknowledgeRecommendation = useCallback(async (recommendationId: string) => {
    try {
      const { error } = await supabase
        .from('location_recommendations')
        .update({
          recommendation_status: 'acknowledged',
          updated_at: new Date().toISOString()
        })
        .eq('id', recommendationId);

      if (error) throw error;

      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === recommendationId
            ? { ...rec, recommendation_status: 'acknowledged' }
            : rec
        )
      );

      toast({
        title: "Success",
        description: "Recommendation acknowledged",
      });
    } catch (error) {
      console.error('Failed to acknowledge recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge recommendation",
        variant: "destructive",
      });
    }
  }, [toast]);

  const dismissRecommendation = useCallback(async (recommendationId: string) => {
    try {
      const { error } = await supabase
        .from('location_recommendations')
        .update({
          recommendation_status: 'ignored',
          updated_at: new Date().toISOString()
        })
        .eq('id', recommendationId);

      if (error) throw error;

      setRecommendations(prev =>
        prev.filter(rec => rec.id !== recommendationId)
      );

      toast({
        title: "Success",
        description: "Recommendation dismissed",
      });
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss recommendation",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchRecommendations();

    // Subscribe to new recommendations
    const subscription = supabase
      .channel('recommendations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'location_recommendations',
        filter: yachtId ? `yacht_id=eq.${yachtId}` : undefined
      }, (payload) => {
        const newRec = payload.new as LocationRecommendation;
        setRecommendations(prev => [newRec, ...prev]);
        
        // Show urgent recommendations as toasts
        if (newRec.priority_level === 'urgent' || newRec.priority_level === 'warning') {
          toast({
            title: newRec.recommendation_title,
            description: newRec.recommendation_description,
            variant: newRec.priority_level === 'urgent' ? 'destructive' : 'default',
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [yachtId, fetchRecommendations, toast]);

  return {
    recommendations,
    loading,
    acknowledgeRecommendation,
    dismissRecommendation,
    refetch: fetchRecommendations
  };
}

// Safety zones hook
export function useSafetyZones(location?: { lat: number; lng: number }) {
  const [nearbyZones, setNearbyZones] = useState<SafetyZone[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNearbyZones = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_nearest_safety_zones', {
        vessel_location: `POINT(${location.lng} ${location.lat})`,
        zone_types: null,
        max_distance_km: 100
      });

      if (error) throw error;
      setNearbyZones(data || []);
    } catch (error) {
      console.error('Failed to fetch safety zones:', error);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchNearbyZones();
  }, [fetchNearbyZones]);

  return {
    nearbyZones,
    loading,
    refetch: fetchNearbyZones
  };
}

// Weather monitoring hook
export function useWeatherMonitoring(location?: { lat: number; lng: number }) {
  const [currentWeather, setCurrentWeather] = useState<WeatherCondition | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCurrentWeather = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    try {
      // First try to get recent weather from database
      const { data: recentWeather } = await supabase
        .from('weather_conditions')
        .select('*')
        .gte('observation_time', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()) // Last 3 hours
        .order('observation_time', { ascending: false })
        .limit(1)
        .single();

      if (recentWeather) {
        setCurrentWeather(recentWeather);
      } else {
        // Fetch new weather data
        const { data: result, error } = await supabase.functions.invoke('golden-safety', {
          body: {
            action: 'update_weather',
            location
          }
        });

        if (error) throw error;
        if (result?.weather_data) {
          setCurrentWeather(result.weather_data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      toast({
        title: "Weather Error",
        description: "Failed to load weather data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [location, toast]);

  useEffect(() => {
    fetchCurrentWeather();
    
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchCurrentWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCurrentWeather]);

  return {
    currentWeather,
    loading,
    refetch: fetchCurrentWeather
  };
}

// Safety equipment management hook
export function useSafetyEquipment(yachtId?: string) {
  const [equipment, setEquipment] = useState<SafetyEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEquipment = useCallback(async () => {
    if (!yachtId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('safety_equipment')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('equipment_type');

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Failed to fetch safety equipment:', error);
      toast({
        title: "Error",
        description: "Failed to load safety equipment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [yachtId, toast]);

  const addEquipment = useCallback(async (equipmentData: Partial<SafetyEquipment>) => {
    if (!yachtId) return;

    try {
      const { data, error } = await supabase
        .from('safety_equipment')
        .insert({
          ...equipmentData,
          yacht_id: yachtId
        })
        .select()
        .single();

      if (error) throw error;

      setEquipment(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Safety equipment added",
      });
    } catch (error) {
      console.error('Failed to add equipment:', error);
      toast({
        title: "Error",
        description: "Failed to add safety equipment",
        variant: "destructive",
      });
    }
  }, [yachtId, toast]);

  const updateEquipment = useCallback(async (
    equipmentId: string,
    updates: Partial<SafetyEquipment>
  ) => {
    try {
      const { data, error } = await supabase
        .from('safety_equipment')
        .update(updates)
        .eq('id', equipmentId)
        .select()
        .single();

      if (error) throw error;

      setEquipment(prev =>
        prev.map(item => item.id === equipmentId ? data : item)
      );

      toast({
        title: "Success",
        description: "Equipment updated",
      });
    } catch (error) {
      console.error('Failed to update equipment:', error);
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteEquipment = useCallback(async (equipmentId: string) => {
    try {
      const { error } = await supabase
        .from('safety_equipment')
        .delete()
        .eq('id', equipmentId);

      if (error) throw error;

      setEquipment(prev => prev.filter(item => item.id !== equipmentId));
      toast({
        title: "Success",
        description: "Equipment removed",
      });
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      toast({
        title: "Error",
        description: "Failed to remove equipment",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getEquipmentStatus = useCallback(() => {
    if (!equipment.length) return { total: 0, operational: 0, needsAttention: 0 };

    const total = equipment.length;
    const operational = equipment.filter(e => e.operational_status === 'active' && e.condition_status === 'good').length;
    const needsAttention = equipment.filter(e => 
      e.operational_status === 'failed' || 
      e.operational_status === 'expired' ||
      new Date(e.next_inspection_due) < new Date()
    ).length;

    return { total, operational, needsAttention };
  }, [equipment]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  return {
    equipment,
    loading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipmentStatus,
    refetch: fetchEquipment
  };
}

// Emergency contacts hook
export function useEmergencyContacts(location?: { lat: number; lng: number }) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmergencyContacts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('emergency_contacts')
        .select('*')
        .eq('is_active', true)
        .order('priority_level', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Failed to fetch emergency contacts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencyContacts();
  }, [fetchEmergencyContacts]);

  return {
    contacts,
    loading,
    refetch: fetchEmergencyContacts
  };
}

// Route safety analysis hook
export function useRouteSafety() {
  const [routeAnalysis, setRouteAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeRoute = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('golden-safety', {
        body: {
          action: 'route_safety',
          location: origin,
          destination
        }
      });

      if (error) throw error;
      setRouteAnalysis(result.route_analysis);
      return result;
    } catch (error) {
      console.error('Route analysis failed:', error);
      toast({
        title: "Route Analysis Error",
        description: "Failed to analyze route safety",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    routeAnalysis,
    loading,
    analyzeRoute
  };
}