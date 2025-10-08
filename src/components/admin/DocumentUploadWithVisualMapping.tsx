import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { documentAIMappingService } from '@/services/DocumentAIMappingService';

interface DocumentUploadWithVisualMappingProps {
  onUploadComplete?: (extractedData: Record<string, any>) => void;
}

export const DocumentUploadWithVisualMapping: React.FC<DocumentUploadWithVisualMappingProps> = ({
  onUploadComplete
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      // Simulate document processing - in real implementation, this would call the actual Document AI service
      const mockExtractedData = {
        'Name_o_fShip': 'STARK X',
        'Callsign': '9HC2975',
        'OfficialNo': '24072',
        'Certificate_No': '1174981',
        'Home_Port': 'VALLETTA',
        'Length_overall': '25.22',
        'Main_breadth': '6.30',
        'Depth': '3.30',
        'Registered_on': '14 July 2025'
      };

      // Apply field mapping
      const mappedData = documentAIMappingService.applyMapping(mockExtractedData);
      
      setUploadResult(mappedData);
      onUploadComplete?.(mappedData);

    } catch (err) {
      setError('Failed to process document. Please try again.');
      console.error('Document processing error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Upload with Visual Mapping
          </CardTitle>
          <CardDescription>
            Upload yacht documents to automatically extract and map field data using Document AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Upload Document</h3>
              <p className="text-gray-500">
                Drag and drop or click to select a yacht document (PDF, PNG, JPG)
              </p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload">
                <Button 
                  variant="outline" 
                  disabled={isUploading}
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    {isUploading ? 'Processing...' : 'Select File'}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Extracted and Mapped Data
            </CardTitle>
            <CardDescription>
              Document processed successfully. Review the extracted field mappings below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(uploadResult).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span className="font-medium text-sm">{key}</span>
                  <span className="text-sm text-gray-600">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => onUploadComplete?.(uploadResult)}>
              Apply Extracted Data
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
