import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TestTube,
  BarChart3,
  Download
} from 'lucide-react';
import { DocumentAITestSuite, TestResult, TestDocument } from '@/utils/DocumentAITestSuite';

interface DocumentAITesterProps {
  className?: string;
}

const DocumentAITester: React.FC<DocumentAITesterProps> = ({ className }) => {
  const { toast } = useToast();
  const [testSuite] = useState(() => new DocumentAITestSuite());
  const [testFiles, setTestFiles] = useState<File[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setTestFiles(prev => [...prev, ...files]);
    
    toast({
      title: "Files Added",
      description: `${files.length} test document(s) uploaded`
    });
  };

  const runProductionTests = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Supabase API key to run tests",
        variant: "destructive"
      });
      return;
    }

    if (testFiles.length === 0) {
      toast({
        title: "No Test Files",
        description: "Please upload test documents first",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setTestResults([]);

    try {
      // Prepare test items with document type detection
      const testItems = testFiles.map(file => ({
        file,
        expectedType: detectDocumentType(file.name) as TestDocument['type']
      }));

      let completedTests = 0;
      const totalTests = testItems.length;

      toast({
        title: "Testing Started",
        description: `Running Document AI tests on ${totalTests} document(s)...`
      });

      // Run tests sequentially to avoid overwhelming the API
      for (const testItem of testItems) {
        try {
          const result = await testSuite.testDocumentProcessing(
            testItem.file,
            testItem.expectedType,
            apiKey
          );

          setTestResults(prev => [...prev, result]);
          completedTests++;
          setProgress((completedTests / totalTests) * 100);

          // Small delay between tests
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Test failed for ${testItem.file.name}:`, error);
          setTestResults(prev => [...prev, {
            document: testSuite.getSampleDocuments().find(d => d.type === testItem.expectedType)!,
            success: false,
            extractedFields: {},
            confidence: 0,
            processingTime: 0,
            errors: [error.message]
          }]);
          completedTests++;
          setProgress((completedTests / totalTests) * 100);
        }
      }

      const passedTests = testResults.filter(r => r.success).length;
      const successRate = Math.round((passedTests / totalTests) * 100);

      toast({
        title: "Tests Completed",
        description: `${passedTests}/${totalTests} tests passed (${successRate}%)`,
        variant: successRate >= 80 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Test suite error:', error);
      toast({
        title: "Test Suite Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const detectDocumentType = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('registration') || name.includes('cert')) return 'yacht_registration';
    if (name.includes('insurance') || name.includes('policy')) return 'insurance_certificate';
    if (name.includes('crew') || name.includes('stcw')) return 'crew_certificate';
    if (name.includes('survey') || name.includes('inspection')) return 'survey_report';
    return 'yacht_registration'; // default
  };

  const removeFile = (index: number) => {
    setTestFiles(prev => prev.filter((_, i) => i !== index));
  };

  const downloadTestReport = () => {
    const report = generateTestReport(testResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-ai-test-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateTestReport = (results: TestResult[]): string => {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const avgProcessingTime = results.reduce((acc, r) => acc + r.processingTime, 0) / totalTests;
    const avgConfidence = results.reduce((acc, r) => acc + r.confidence, 0) / totalTests;

    return `
Document AI Production Test Report
==================================
Date: ${new Date().toISOString()}
Project: yacht-sentinel-ai-05

Summary:
--------
Total Tests: ${totalTests}
Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)
Failed: ${totalTests - passedTests}
Average Processing Time: ${Math.round(avgProcessingTime)}ms
Average Confidence: ${Math.round(avgConfidence * 100)}%

Detailed Results:
-----------------
${results.map((result, index) => `
${index + 1}. ${result.document.name}
   Status: ${result.success ? 'PASS' : 'FAIL'}
   Confidence: ${Math.round(result.confidence * 100)}%
   Processing Time: ${result.processingTime}ms
   Extracted Fields: ${Object.keys(result.extractedFields).length}
   ${result.errors ? `Errors: ${result.errors.join(', ')}` : ''}
`).join('')}

Configuration:
--------------
Processor ID: 8708cd1d9cd87cc1 (Custom Extractor)
Location: us
API Version: v1
    `.trim();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Document AI Production Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Supabase API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Supabase API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Test Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload yacht documents (PDF, JPG, PNG)
                </span>
              </label>
            </div>
          </div>

          {testFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Test Files ({testFiles.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {testFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="outline">{detectDocumentType(file.name)}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isRunning && (
            <div className="space-y-2">
              <Label>Test Progress</Label>
              <Progress value={progress} className="w-full" />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Running tests... {Math.round(progress)}% complete
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={runProductionTests}
              disabled={isRunning || testFiles.length === 0 || !apiKey.trim()}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run Production Tests'}
            </Button>

            {testResults.length > 0 && (
              <Button
                variant="outline"
                onClick={downloadTestReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.success).length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => !r.success).length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(testResults.reduce((acc, r) => acc + r.processingTime, 0) / testResults.length)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(testResults.reduce((acc, r) => acc + r.confidence, 0) / testResults.length * 100)}%
                </div>
                <div className="text-sm text-gray-600">Avg Confidence</div>
              </div>
            </div>

            <div className="space-y-3">
              {testResults.map((result, index) => (
                <Alert key={index} variant={result.success ? "default" : "destructive"}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{result.document.name}</div>
                        <div className="text-sm text-gray-600">
                          {result.processingTime}ms • {Math.round(result.confidence * 100)}% confidence • {Object.keys(result.extractedFields).length} fields
                        </div>
                      </div>
                    </div>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                  {result.errors && (
                    <AlertDescription className="mt-2">
                      {result.errors.join('; ')}
                    </AlertDescription>
                  )}
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentAITester;