import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Sparkles, CheckCircle, Info, Brain, AlertTriangle, TrendingUp } from 'lucide-react';

interface AutoPopulationSummaryProps {
  autoPopulatedFields: string[];
  confidenceScores: Record<string, number>;
  extractedData: any;
  smartScanCompleted: boolean;
}

const AutoPopulationSummary: React.FC<AutoPopulationSummaryProps> = ({
  autoPopulatedFields,
  confidenceScores,
  extractedData,
  smartScanCompleted
}) => {
  const autoPopulatedCount = autoPopulatedFields.length;
  const confidenceValues = Object.values(confidenceScores) as number[];
  const averageConfidence = autoPopulatedCount > 0 
    ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length 
    : 0;

  // Enhanced field display names mapping with categories - ALL certificate fields
  const fieldDisplayNames: Record<string, { name: string; category: string; priority: 'high' | 'medium' | 'low' }> = {
    // Basic Identity (High Priority)
    'name': { name: 'Yacht Name', category: 'Identity', priority: 'high' },
    'flagState': { name: 'Flag State', category: 'Identity', priority: 'high' },
    'type': { name: 'Yacht Type', category: 'Identity', priority: 'high' },
    'category': { name: 'Category', category: 'Identity', priority: 'medium' },
    
    // Certificate Information (High Priority)
    'certificateNumber': { name: 'Certificate Number', category: 'Certificate', priority: 'high' },
    'certificateIssuedDate': { name: 'Certificate Issued Date', category: 'Certificate', priority: 'high' },
    'certificateExpiresDate': { name: 'Certificate Expiry Date', category: 'Certificate', priority: 'high' },
    'provisionalRegistrationDate': { name: 'Provisional Registration Date', category: 'Certificate', priority: 'medium' },
    
    // Identification Numbers (High Priority)
    'callSign': { name: 'Call Sign', category: 'Registration', priority: 'high' },
    'officialNumber': { name: 'Official Number', category: 'Registration', priority: 'high' },
    'imoNumber': { name: 'IMO Number', category: 'Registration', priority: 'medium' },
    
    // Physical Specifications (Medium Priority)
    'lengthOverall': { name: 'Length Overall', category: 'Specifications', priority: 'high' },
    'beam': { name: 'Beam', category: 'Specifications', priority: 'medium' },
    'draft': { name: 'Draft', category: 'Specifications', priority: 'medium' },
    'grossTonnage': { name: 'Gross Tonnage', category: 'Specifications', priority: 'high' },
    'hullLength': { name: 'Hull Length', category: 'Specifications', priority: 'medium' },
    'mainBreadth': { name: 'Main Breadth', category: 'Specifications', priority: 'medium' },
    'depth': { name: 'Depth', category: 'Specifications', priority: 'medium' },
    
    // Build Information (Medium Priority)
    'builder': { name: 'Builder', category: 'Build Info', priority: 'medium' },
    'year': { name: 'Year Built', category: 'Build Info', priority: 'medium' },
    'whenAndWhereBuilt': { name: 'When and Where Built', category: 'Build Info', priority: 'low' },
    
    // Location and Ports
    'homePort': { name: 'Home Port', category: 'Registration', priority: 'high' },
    
    // Hull and Structure (Low Priority)
    'hullMaterial': { name: 'Hull Material', category: 'Technical', priority: 'low' },
    'hullId': { name: 'Hull ID', category: 'Technical', priority: 'low' },
    'framework': { name: 'Framework', category: 'Technical', priority: 'low' },
    'descriptionOfVessel': { name: 'Vessel Description', category: 'Technical', priority: 'low' },
    
    // Engine and Propulsion (Medium Priority)
    'engineType': { name: 'Engine Type', category: 'Technical', priority: 'medium' },
    'enginePower': { name: 'Engine Power (kW)', category: 'Technical', priority: 'medium' },
    'engineMakers': { name: 'Engine Makers', category: 'Technical', priority: 'low' },
    'enginesYearOfMake': { name: 'Engines Year of Make', category: 'Technical', priority: 'low' },
    'numberOfEngines': { name: 'Number of Engines', category: 'Technical', priority: 'low' },
    'propulsion': { name: 'Propulsion', category: 'Technical', priority: 'medium' },
    'propulsionPower': { name: 'Propulsion Power', category: 'Technical', priority: 'medium' },
    
    // Performance (Low Priority)
    'maxSpeed': { name: 'Max Speed', category: 'Performance', priority: 'low' },
    'crewCapacity': { name: 'Crew Capacity', category: 'Capacity', priority: 'medium' },
    'guestCapacity': { name: 'Guest Capacity', category: 'Capacity', priority: 'medium' },
    
    // Owner Information (Medium Priority)
    'ownersDescription': { name: 'Owners Description', category: 'Owner Info', priority: 'medium' },
    'ownersResidence': { name: 'Owners Residence', category: 'Owner Info', priority: 'medium' },
    
    // Additional Details (Low Priority)
    'particularsOfTonnage': { name: 'Particulars of Tonnage', category: 'Details', priority: 'low' },
    'registeredOn': { name: 'Registered On', category: 'Details', priority: 'low' },
    'noYear': { name: 'Registration Year', category: 'Details', priority: 'low' }
  };

  // Categorize populated fields for better display
  const categorizedFields = autoPopulatedFields.reduce((acc, field) => {
    const fieldInfo = fieldDisplayNames[field as string];
    if (fieldInfo) {
      if (!acc[fieldInfo.category]) acc[fieldInfo.category] = [];
      acc[fieldInfo.category].push({ field, ...fieldInfo, confidence: confidenceScores[field as string] || 0 });
    }
    return acc;
  }, {} as Record<string, Array<{ field: string; name: string; priority: string; confidence: number }>>);

  // Calculate confidence distribution
  const confidenceDistribution = {
    high: confidenceValues.filter(c => c >= 0.8).length,
    medium: confidenceValues.filter(c => c >= 0.6 && c < 0.8).length,
    low: confidenceValues.filter(c => c < 0.6).length
  };

  // Get confidence level color and icon
  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 0.8) return { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300', icon: CheckCircle };
    if (confidence >= 0.6) return { color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300', icon: AlertTriangle };
    return { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', icon: AlertTriangle };
  };

  const overallConfidenceStyle = getConfidenceStyle(averageConfidence);

  if (!smartScanCompleted) {
    return null;
  }

  return (
    <Card className="mb-6 border-green-200 bg-green-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Brain className="h-5 w-5" />
          SmartScan Auto-Population Summary
        </CardTitle>
        <CardDescription className="text-green-700">
          AI-powered data extraction results from your documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {autoPopulatedCount > 0 ? (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-800">{autoPopulatedCount}</div>
                <div className="text-sm text-green-600">Fields Auto-Filled</div>
              </div>
              <div className="text-center p-3 bg-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">
                  {Math.round(averageConfidence * 100)}%
                </div>
                <div className="text-sm text-blue-600">Average Confidence</div>
              </div>
              <div className="text-center p-3 bg-purple-100 rounded-lg">
                <div className="text-2xl font-bold text-purple-800">
                  {Object.keys(extractedData).length}
                </div>
                <div className="text-sm text-purple-600">Total Fields Extracted</div>
              </div>
            </div>

            {/* Auto-populated fields list */}
            <div>
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Auto-Populated Fields
              </h4>
              <div className="flex flex-wrap gap-2">
                {autoPopulatedFields.map(field => (
                  <Badge 
                    key={field} 
                    variant="outline" 
                    className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    {fieldDisplayNames[field]?.name || field}
                    {confidenceScores[field] && (
                      <span className="ml-1 text-xs">
                        ({Math.round(confidenceScores[field] * 100)}%)
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Confidence level indicator */}
            <Alert className="bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong>High Confidence Extraction:</strong> The AI has successfully extracted and populated 
                {autoPopulatedCount} fields with an average confidence of {Math.round(averageConfidence * 100)}%. 
                You can review and modify any auto-filled values as needed.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              <strong>No Auto-Population Available:</strong> No fields were automatically populated from your documents. 
              This could be due to document format or quality. Please fill in the fields manually.
            </AlertDescription>
          </Alert>
        )}

        {/* Additional information for users */}
        <div className="pt-2 border-t border-green-200">
          <p className="text-xs text-green-600">
            <strong>Note:</strong> All auto-populated fields are clearly marked with a green border and 
            sparkle icon. You can edit any auto-filled values to ensure accuracy before proceeding.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoPopulationSummary;