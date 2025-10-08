import { supabase } from "@/integrations/supabase/client";
import { yachtieService } from "./YachtieIntegrationService";
import { universalEventBus } from "./UniversalEventBus";

interface VoiceSession {
  id: string;
  userId?: string;
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
  language: string;
  startedAt: Date;
  lastActivity: Date;
  conversationHistory: ConversationMessage[];
  context: Record<string, any>;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

interface VoiceCommand {
  command: string;
  confidence: number;
  intent: string;
  entities: Record<string, any>;
  module?: string;
  action?: string;
}

class ConversationalAIService {
  private sessions = new Map<string, VoiceSession>();
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.setupAudioContext();
    this.setupCommandHandlers();
    
    this.isInitialized = true;
    console.log('ConversationalAIService initialized');
  }

  private async setupAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private setupCommandHandlers(): void {
    // Set up voice command handlers for different modules
    const commandHandlers = {
      navigation: this.handleNavigationCommand.bind(this),
      equipment: this.handleEquipmentCommand.bind(this),
      inventory: this.handleInventoryCommand.bind(this),
      maintenance: this.handleMaintenanceCommand.bind(this),
      crew: this.handleCrewCommand.bind(this),
      weather: this.handleWeatherCommand.bind(this),
      general: this.handleGeneralCommand.bind(this)
    };

    // Register command handlers
    Object.entries(commandHandlers).forEach(([module, handler]) => {
      universalEventBus.subscribe(`voice_command_${module}`, handler);
    });
  }

  async startVoiceSession(options: {
    userId?: string;
    language?: string;
    context?: Record<string, any>;
  } = {}): Promise<string> {
    const sessionId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: VoiceSession = {
      id: sessionId,
      userId: options.userId,
      status: 'idle',
      language: options.language || 'en',
      startedAt: new Date(),
      lastActivity: new Date(),
      conversationHistory: [],
      context: options.context || {}
    };

    this.sessions.set(sessionId, session);

    // Log session start
    await this.logVoiceEvent(sessionId, 'session_started', { language: session.language });

    return sessionId;
  }

  async startListening(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Web Audio API not supported');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const audioChunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await this.processAudioInput(sessionId, audioBlob);
      };

      this.mediaRecorder.start();
      session.status = 'listening';
      session.lastActivity = new Date();

      // Auto-stop after 30 seconds of listening
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.stopListening(sessionId);
        }
      }, 30000);

    } catch (error) {
      session.status = 'error';
      console.error('Failed to start listening:', error);
      throw error;
    }
  }

  async stopListening(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    session.status = 'processing';
    session.lastActivity = new Date();
  }

  private async processAudioInput(sessionId: string, audioBlob: Blob): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Convert audio to base64 for processing
      const audioBase64 = await this.blobToBase64(audioBlob);
      
      // Use speech-to-text (this would typically call a speech recognition service)
      const transcription = await this.speechToText(audioBase64, session.language);
      
      if (transcription.text) {
        // Add user message to conversation
        const userMessage: ConversationMessage = {
          id: `msg_${Date.now()}`,
          type: 'user',
          content: transcription.text,
          timestamp: new Date(),
          confidence: transcription.confidence
        };

        session.conversationHistory.push(userMessage);

        // Process the voice command
        await this.processVoiceCommand(sessionId, transcription.text);
      }

    } catch (error) {
      console.error('Failed to process audio input:', error);
      session.status = 'error';
    }
  }

  private async speechToText(audioBase64: string, language: string): Promise<{
    text: string;
    confidence: number;
  }> {
    try {
      // This would typically use a real speech-to-text service
      // For now, we'll simulate the response
      const request = {
        text: `Transcribe audio to text in ${language}`,
        task: 'extract' as const,
        context: `Audio transcription request for language: ${language}`
      };

      const response = await yachtieService.process(request);
      
      return {
        text: response.result || "Voice command recognized",
        confidence: response.confidence || 0.8
      };
    } catch (error) {
      console.error('Speech-to-text failed:', error);
      return { text: "", confidence: 0 };
    }
  }

  private async processVoiceCommand(sessionId: string, text: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Parse voice command using AI
      const commandAnalysis = await this.analyzeVoiceCommand(text, session.context);
      
      if (commandAnalysis.intent) {
        // Route command to appropriate handler
        await this.routeCommand(sessionId, commandAnalysis);
        
        // Generate response
        await this.generateVoiceResponse(sessionId, commandAnalysis);
      } else {
        // Handle general conversation
        await this.handleGeneralConversation(sessionId, text);
      }

    } catch (error) {
      console.error('Failed to process voice command:', error);
      await this.generateErrorResponse(sessionId, 'I apologize, I had trouble understanding that command.');
    }
  }

  private async analyzeVoiceCommand(text: string, context: Record<string, any>): Promise<VoiceCommand> {
    try {
      const request = {
        text: `Analyze voice command: "${text}"`,
        task: 'classify' as const,
        context: JSON.stringify({
          availableModules: ['navigation', 'equipment', 'inventory', 'maintenance', 'crew', 'weather'],
          conversationContext: context,
          commandText: text
        })
      };

      const response = await yachtieService.process(request);
      
      let analysis;
      try {
        analysis = JSON.parse(response.result || '{}');
      } catch {
        analysis = {
          intent: 'general',
          confidence: response.confidence || 0.5
        };
      }

      return {
        command: text,
        confidence: analysis.confidence || response.confidence || 0.5,
        intent: analysis.intent || 'general',
        entities: analysis.entities || {},
        module: analysis.module,
        action: analysis.action
      };
    } catch (error) {
      console.error('Command analysis failed:', error);
      return {
        command: text,
        confidence: 0.3,
        intent: 'general',
        entities: {}
      };
    }
  }

  private async routeCommand(sessionId: string, command: VoiceCommand): Promise<void> {
    const module = command.module || this.inferModuleFromIntent(command.intent);
    
    // Emit command event for specific module
    universalEventBus.emit(`voice_command_${module}`, 'voice', {
      sessionId,
      command,
      timestamp: new Date()
    });
  }

  private inferModuleFromIntent(intent: string): string {
    const intentModuleMap: Record<string, string> = {
      'check_equipment': 'equipment',
      'schedule_maintenance': 'maintenance',
      'check_inventory': 'inventory',
      'crew_status': 'crew',
      'weather_info': 'weather',
      'navigate_to': 'navigation'
    };

    return intentModuleMap[intent] || 'general';
  }

  private async generateVoiceResponse(sessionId: string, command: VoiceCommand): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      const request = {
        text: `Generate helpful voice response for command: ${command.intent}`,
        task: 'summarize' as const,
        context: JSON.stringify({
          command: command.command,
          intent: command.intent,
          entities: command.entities,
          conversationHistory: session.conversationHistory.slice(-3) // Last 3 messages
        })
      };

      const response = await yachtieService.process(request);
      
      const responseText = response.result || `I've processed your ${command.intent} request.`;
      
      // Add assistant message to conversation
      const assistantMessage: ConversationMessage = {
        id: `msg_${Date.now()}`,
        type: 'assistant',
        content: responseText,
        timestamp: new Date(),
        metadata: { intent: command.intent, confidence: command.confidence }
      };

      session.conversationHistory.push(assistantMessage);

      // Convert to speech and play
      await this.textToSpeech(sessionId, responseText);

    } catch (error) {
      console.error('Failed to generate voice response:', error);
      await this.generateErrorResponse(sessionId, 'I apologize, I encountered an error processing your request.');
    }
  }

  private async handleGeneralConversation(sessionId: string, text: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      const request = {
        text: text,
        task: 'summarize' as const,
        context: JSON.stringify({
          role: 'yacht_assistant',
          conversationHistory: session.conversationHistory.slice(-5),
          availableFeatures: ['equipment monitoring', 'maintenance scheduling', 'inventory management', 'crew coordination']
        })
      };

      const response = await yachtieService.process(request);
      
      const responseText = response.result || "I'm here to help with your yacht management needs. What can I do for you?";
      
      // Add messages to conversation
      const userMessage: ConversationMessage = {
        id: `msg_${Date.now()}_user`,
        type: 'user',
        content: text,
        timestamp: new Date()
      };

      const assistantMessage: ConversationMessage = {
        id: `msg_${Date.now()}_assistant`,
        type: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      session.conversationHistory.push(userMessage, assistantMessage);

      await this.textToSpeech(sessionId, responseText);

    } catch (error) {
      console.error('General conversation failed:', error);
      await this.generateErrorResponse(sessionId, 'I apologize, I had trouble with that conversation.');
    }
  }

  private async generateErrorResponse(sessionId: string, message: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const errorMessage: ConversationMessage = {
      id: `msg_${Date.now()}_error`,
      type: 'system',
      content: message,
      timestamp: new Date()
    };

    session.conversationHistory.push(errorMessage);
    await this.textToSpeech(sessionId, message);
  }

  private async textToSpeech(sessionId: string, text: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      session.status = 'speaking';
      
      // Use Web Speech API if available
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = session.language;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          session.status = 'idle';
          session.lastActivity = new Date();
        };

        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          session.status = 'error';
        };

        speechSynthesis.speak(utterance);
      } else {
        // Fallback: just update status
        session.status = 'idle';
        console.log('Text-to-speech not available, text:', text);
      }

    } catch (error) {
      console.error('Text-to-speech failed:', error);
      session.status = 'error';
    }
  }

  // Command handlers for different modules
  private async handleNavigationCommand(event: any): Promise<void> {
    const { command } = event.payload;
    console.log('Handling navigation command:', command.command);
    // Implementation would integrate with navigation system
  }

  private async handleEquipmentCommand(event: any): Promise<void> {
    const { command } = event.payload;
    console.log('Handling equipment command:', command.command);
    // Implementation would integrate with equipment system
  }

  private async handleInventoryCommand(event: any): Promise<void> {
    const { command } = event.payload;
    console.log('Handling inventory command:', command.command);
    // Implementation would integrate with inventory system
  }

  private async handleMaintenanceCommand(event: any): Promise<void> {
    const { command } = event.payload;
    console.log('Handling maintenance command:', command.command);
    // Implementation would integrate with maintenance system
  }

  private async handleCrewCommand(event: any): Promise<void> {
    const { command } = event.payload;
    console.log('Handling crew command:', command.command);
    // Implementation would integrate with crew system
  }

  private async handleWeatherCommand(event: any): Promise<void> {
    const { command } = event.payload;
    console.log('Handling weather command:', command.command);
    // Implementation would integrate with weather system
  }

  private async handleGeneralCommand(event: any): Promise<void> {
    const { sessionId, command } = event.payload;
    await this.handleGeneralConversation(sessionId, command.command);
  }

  // Utility methods
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async logVoiceEvent(sessionId: string, eventType: string, metadata: any): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: `voice_${eventType}`,
        module: 'voice',
        event_message: `Voice session ${eventType}`,
        severity: 'info',
        metadata: {
          session_id: sessionId,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Failed to log voice event:', error);
    }
  }

  // Public API methods
  async endVoiceSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Stop any ongoing recording
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    await this.logVoiceEvent(sessionId, 'session_ended', {
      duration: Date.now() - session.startedAt.getTime(),
      messages_count: session.conversationHistory.length
    });

    this.sessions.delete(sessionId);
  }

  getSession(sessionId: string): VoiceSession | undefined {
    return this.sessions.get(sessionId);
  }

  getActiveSessions(): VoiceSession[] {
    return Array.from(this.sessions.values());
  }

  async getConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    const session = this.sessions.get(sessionId);
    return session?.conversationHistory || [];
  }

  // Session management
  cleanupInactiveSessions(): void {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > timeout) {
        this.endVoiceSession(sessionId);
      }
    }
  }
}

export const conversationalAIService = new ConversationalAIService();