import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useClaimsRepairs } from '@/contexts/ClaimsRepairsContext';
import {
  MessageSquare,
  Send,
  Paperclip,
  Phone,
  Mail,
  Clock,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Archive,
  RefreshCw,
  Bot,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface CommunicationHubProps {
  selectedJobId?: string;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({ selectedJobId }) => {
  const { toast } = useToast();
  const { jobs, sendMessage, getCommunications } = useClaimsRepairs();
  
  const [selectedJob, setSelectedJob] = useState(selectedJobId || '');
  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp'>('email');
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedJob) {
      loadConversations(selectedJob);
    }
  }, [selectedJob]);

  const loadConversations = async (jobId: string) => {
    setLoading(true);
    try {
      const comms = await getCommunications(jobId);
      setConversations(comms);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedJob || !messageText.trim()) return;

    setLoading(true);
    try {
      const success = await sendMessage(selectedJob, activeChannel, messageText, attachments);
      if (success) {
        setMessageText('');
        setAttachments([]);
        await loadConversations(selectedJob);
        toast({
          title: "Success",
          description: `Message sent via ${activeChannel}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const filteredJobs = jobs.filter(job => 
    job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.yacht?.yacht_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedJobData = jobs.find(j => j.id === selectedJob);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Communication Hub</h2>
            <p className="text-sm text-muted-foreground">
              Manage conversations with suppliers and contractors
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Bot className="h-4 w-4 mr-2" />
              AI Assist
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectedJob && loadConversations(selectedJob)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Job Selection */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a job" />
            </SelectTrigger>
            <SelectContent>
              {filteredJobs.map(job => (
                <SelectItem key={job.id} value={job.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{job.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {job.yacht?.yacht_name} • {job.job_type}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedJob ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Job</h3>
            <p className="text-muted-foreground">
              Choose a job to view and manage communications
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex">
          {/* Conversation List */}
          <div className="w-80 border-r bg-muted/10">
            <div className="p-4 border-b">
              <h3 className="font-medium">{selectedJobData?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedJobData?.yacht?.yacht_name}
              </p>
            </div>
            
            <div className="p-4">
              <Tabs value={activeChannel} onValueChange={(value: any) => setActiveChannel(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp">
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="px-4 pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv, index) => (
                    <Card key={index} className="cursor-pointer hover:bg-muted/20 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {conv.channel_used === 'email' ? 
                              <Mail className="h-4 w-4" /> : 
                              <Phone className="h-4 w-4" />
                            }
                            <Badge variant="outline">
                              {conv.message_type}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conv.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm mb-1">{conv.subject || 'No subject'}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {conv.content || 'No preview available'}
                        </p>
                        {conv.attachments?.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Paperclip className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {conv.attachments.length} attachment(s)
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Message Composer */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4">
              <div className="h-full border rounded-lg bg-muted/5 p-4">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            </div>

            {/* Compose Area */}
            <div className="border-t p-4 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={activeChannel === 'email' ? 'default' : 'outline'}>
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Badge>
                <Badge variant={activeChannel === 'whatsapp' ? 'default' : 'outline'}>
                  <Phone className="h-3 w-3 mr-1" />
                  WhatsApp
                </Badge>
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((file, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      <span className="text-xs">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  placeholder={`Type your ${activeChannel} message...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Paperclip className="h-4 w-4 mr-1" />
                    Attach
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileAttachment}
                  />
                  <Button variant="outline" size="sm">
                    <Bot className="h-4 w-4 mr-1" />
                    AI Suggest
                  </Button>
                </div>
                
                <Button onClick={handleSendMessage} disabled={loading || !messageText.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send via {activeChannel === 'email' ? 'Email' : 'WhatsApp'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};