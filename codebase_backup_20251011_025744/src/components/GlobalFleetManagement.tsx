import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Globe, 
  Languages, 
  MapPin, 
  Users, 
  Ship,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  Flag
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface YachtData {
  id: string;
  name: string;
  location: string;
  country: string;
  status: 'active' | 'maintenance' | 'charter' | 'transit';
  crew: number;
  guests: number;
  revenue: number;
  currency: string;
  lastUpdate: Date;
}

interface CulturalPreference {
  country: string;
  language: string;
  currency: string;
  timeFormat: '12h' | '24h';
  dateFormat: string;
  preferences: string[];
}

interface GlobalMetrics {
  totalFleet: number;
  activeCharters: number;
  totalRevenue: number;
  activeRegions: string[];
  supportedLanguages: string[];
}

const GlobalFleetManagement: React.FC = () => {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [yachts, setYachts] = useState<YachtData[]>([]);
  const [loading, setLoading] = useState(true);
  const [culturalPrefs, setCulturalPrefs] = useState<CulturalPreference[]>([]);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);

  // Load real yacht data from database
  const loadFleetData = async () => {
    setLoading(true);
    try {
      // Fetch yacht profiles with crew and guest data
      const { data: yachtData, error: yachtError } = await supabase
        .from('yacht_profiles')
        .select(`
          id,
          name,
          status,
          home_port,
          flag_state,
          crew_capacity,
          guest_capacity,
          length_meters,
          created_at,
          updated_at
        `)
        .order('name');

      if (yachtError) {
        console.error('Error fetching yacht data:', yachtError);
        toast({
          title: "Error",
          description: "Failed to load fleet data",
          variant: "destructive",
        });
        return;
      }

      // Get crew counts for each yacht
      const { data: crewData } = await supabase
        .from('crew_members')
        .select('yacht_id')
        .eq('status', 'active');

      // Get guest/charter data
      const { data: charterData } = await supabase
        .from('guest_charters')
        .select('yacht_id, guest_count, charter_value')
        .eq('status', 'confirmed');

      // Transform data to component format
      const transformedYachts: YachtData[] = (yachtData || []).map(yacht => {
        const crewCount = crewData?.filter(crew => crew.yacht_id === yacht.id).length || 0;
        const currentCharter = charterData?.find(charter => charter.yacht_id === yacht.id);
        
        // Determine status based on data availability
        let yachtStatus: 'active' | 'maintenance' | 'charter' | 'transit';
        if (currentCharter) {
          yachtStatus = 'charter';
        } else if (yacht.status === 'maintenance') {
          yachtStatus = 'maintenance';
        } else if (crewCount > 0) {
          yachtStatus = 'active';
        } else {
          yachtStatus = 'transit';
        }

        return {
          id: yacht.id,
          name: yacht.name,
          location: yacht.home_port || 'Unknown Port',
          country: yacht.flag_state || 'Unknown',
          status: yachtStatus,
          crew: crewCount,
          guests: currentCharter?.guest_count || 0,
          revenue: currentCharter?.charter_value || 0,
          currency: 'USD', // Default currency
          lastUpdate: new Date(yacht.updated_at || yacht.created_at)
        };
      });

      setYachts(transformedYachts);

      // Set real global metrics
      setGlobalMetrics({
        totalFleet: transformedYachts.length,
        activeCharters: transformedYachts.filter(y => y.status === 'charter').length,
        totalRevenue: transformedYachts.reduce((sum, y) => sum + y.revenue, 0),
        activeRegions: [...new Set(transformedYachts.map(y => y.location))],
        supportedLanguages: supportedLanguages.map(l => l.name)
      });

    } catch (error) {
      console.error('Error loading fleet data:', error);
      toast({
        title: "Error",
        description: "Failed to load fleet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleetData();
    
    // Refresh data every 2 minutes
    const interval = setInterval(loadFleetData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const supportedLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const regions = [
    { code: 'all', name: 'All Regions' },
    { code: 'med', name: 'Mediterranean' },
    { code: 'caribbean', name: 'Caribbean' },
    { code: 'pacific', name: 'Pacific' },
    { code: 'indian', name: 'Indian Ocean' },
    { code: 'atlantic', name: 'Atlantic' },
    { code: 'baltic', name: 'Baltic Sea' }
  ];

  useEffect(() => {
    // Set cultural preferences (can be moved to database later)
    setCulturalPrefs([
      {
        country: 'FR',
        language: 'fr',
        currency: 'EUR',
        timeFormat: '24h',
        dateFormat: 'DD/MM/YYYY',
        preferences: ['Wine service protocols', 'French cuisine expertise', 'Formal dining standards']
      },
      {
        country: 'US',
        language: 'en',
        currency: 'USD',
        timeFormat: '12h',
        dateFormat: 'MM/DD/YYYY',
        preferences: ['Casual atmosphere', 'BBQ facilities', 'Water sports equipment']
      },
      {
        country: 'AE',
        language: 'ar',
        currency: 'AED',
        timeFormat: '12h',
        dateFormat: 'DD/MM/YYYY',
        preferences: ['Halal cuisine', 'Prayer room facilities', 'Cultural sensitivity protocols']
      },
      {
        country: 'CN',
        language: 'zh',
        currency: 'CNY',
        timeFormat: '24h',
        dateFormat: 'YYYY/MM/DD',
        preferences: ['Tea ceremony equipment', 'Traditional Chinese medicine', 'Feng shui considerations']
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'charter': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'transit': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getLocalizedText = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'fleet_overview': {
        'en': 'Fleet Overview',
        'fr': 'Aperçu de la flotte',
        'es': 'Resumen de la flota',
        'it': 'Panoramica della flotta',
        'de': 'Flottenübersicht',
        'pt': 'Visão geral da frota',
        'nl': 'Vlootoverzicht',
        'ru': 'Обзор флота',
        'ar': 'نظرة عامة على الأسطول',
        'zh': '船队概览'
      },
      'status': {
        'en': 'Status',
        'fr': 'Statut',
        'es': 'Estado',
        'it': 'Stato',
        'de': 'Status',
        'pt': 'Status',
        'nl': 'Status',
        'ru': 'Статус',
        'ar': 'الحالة',
        'zh': '状态'
      }
    };

    return translations[key]?.[selectedLanguage] || translations[key]?.['en'] || key;
  };

  const changeLanguage = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    toast({
      title: "Language Changed",
      description: `Interface language set to ${supportedLanguages.find(l => l.code === languageCode)?.name}`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {getLocalizedText('fleet_overview')}
              </CardTitle>
              <CardDescription>
                Multi-regional yacht fleet management with cultural localization
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.code} value={region.code}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fleet" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fleet">Fleet Status</TabsTrigger>
              <TabsTrigger value="cultural">Cultural Preferences</TabsTrigger>
              <TabsTrigger value="analytics">Global Analytics</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
            </TabsList>

            <TabsContent value="fleet" className="space-y-4">
              {globalMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
                      <Ship className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{globalMetrics.totalFleet}</div>
                      <p className="text-xs text-muted-foreground">
                        {globalMetrics.activeCharters} active charters
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Global Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(globalMetrics.totalRevenue, 'USD')}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This quarter
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Regions</CardTitle>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{globalMetrics.activeRegions.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Worldwide presence
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Languages</CardTitle>
                      <Languages className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{supportedLanguages.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Supported languages
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid gap-4">
                {yachts.map((yacht) => (
                  <Card key={yacht.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{yacht.name}</CardTitle>
                          <Badge className={`${getStatusColor(yacht.status)} text-white`}>
                            {yacht.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(yacht.revenue, yacht.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current month
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{yacht.location}</div>
                            <div className="text-sm text-muted-foreground">{yacht.country}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{yacht.crew} crew</div>
                            <div className="text-sm text-muted-foreground">{yacht.guests} guests</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Last Update</div>
                            <div className="text-sm text-muted-foreground">
                              {yacht.lastUpdate.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="cultural" className="space-y-4">
              <div className="grid gap-4">
                {culturalPrefs.map((pref, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        {pref.country} - Cultural Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <span className="font-medium">Language: </span>
                            <Badge variant="outline">
                              {supportedLanguages.find(l => l.code === pref.language)?.name}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Currency: </span>
                            <Badge variant="outline">{pref.currency}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">Time Format: </span>
                            <Badge variant="outline">{pref.timeFormat}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">Date Format: </span>
                            <Badge variant="outline">{pref.dateFormat}</Badge>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Cultural Considerations</h4>
                          <ul className="space-y-1">
                            {pref.preferences.map((preference, idx) => (
                              <li key={idx} className="text-sm flex items-center gap-2">
                                <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                                {preference}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Region</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Mediterranean</span>
                        <span className="font-medium">$850K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Caribbean</span>
                        <span className="font-medium">$650K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pacific</span>
                        <span className="font-medium">$420K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other</span>
                        <span className="font-medium">$480K</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Language Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>English</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>French</span>
                        <span className="font-medium">18%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Spanish</span>
                        <span className="font-medium">12%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other</span>
                        <span className="font-medium">25%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Operations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {regions.slice(1).map((region) => (
                        <div key={region.code} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{region.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Active operations
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Manage
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cultural Training</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 border rounded">
                        <div className="font-medium">Crew Cultural Awareness</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Training for international guest services
                        </div>
                        <Button size="sm">Schedule Training</Button>
                      </div>
                      <div className="p-3 border rounded">
                        <div className="font-medium">Language Courses</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Essential phrases for yacht crew
                        </div>
                        <Button size="sm">Start Course</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalFleetManagement;