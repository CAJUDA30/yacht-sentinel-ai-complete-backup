import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AudioRecorder, encodeAudioForAPI, playAudioData, clearAudioQueue } from '@/utils/RealtimeAudio';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTranscript?: boolean;
}

interface FunctionCall {
  name: string;
  arguments: string;
  call_id: string;
}

export const useRealtimeVoiceChat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const functionCallsRef = useRef<Map<string, FunctionCall>>(new Map());

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleListening = useCallback(() => {
    setIsListening(prev => !prev);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  // Handle function calls
  const handleFunctionCall = useCallback(async (functionCall: FunctionCall) => {
    console.log('Handling function call:', functionCall);
    
    let result = {};
    
    try {
      switch (functionCall.name) {
        case 'get_repair_job_status':
          const args = JSON.parse(functionCall.arguments);
          // Simulate fetching job status from Supabase
          const { data: job } = await supabase
            .from('audit_instances')
            .select('*')
            .eq('id', args.job_id)
            .single();
          
          result = job ? {
            job_id: args.job_id,
            status: job.status,
            name: job.name,
            description: job.description,
            priority: job.priority,
            estimated_cost: job.estimated_cost,
            actual_cost: job.actual_cost
          } : { error: 'Job not found' };
          break;

        case 'create_repair_job':
          const jobArgs = JSON.parse(functionCall.arguments);
          const { data: newJob, error: jobError } = await supabase
            .from('audit_instances')
            .insert({
              name: jobArgs.name,
              description: jobArgs.description,
              priority: jobArgs.priority,
              status: 'draft',
              job_type: 'repair',
              template_id: '00000000-0000-0000-0000-000000000000'
            })
            .select()
            .single();
          
          result = jobError ? { error: jobError.message } : {
            success: true,
            job_id: newJob.id,
            message: `Repair job "${jobArgs.name}" created successfully`
          };
          break;

        case 'check_inventory_levels':
          const invArgs = JSON.parse(functionCall.arguments);
          // Simulate inventory check
          result = {
            item_name: invArgs.item_name,
            current_stock: Math.floor(Math.random() * 100),
            min_stock: 10,
            status: Math.random() > 0.3 ? 'in_stock' : 'low_stock'
          };
          break;

        default:
          result = { error: `Unknown function: ${functionCall.name}` };
      }
    } catch (error) {
      console.error('Function call error:', error);
      result = { error: error instanceof Error ? error.message : 'Function execution failed' };
    }

    // Send function result back to OpenAI
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const functionOutput = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: functionCall.call_id,
          output: JSON.stringify(result)
        }
      };
      
      wsRef.current.send(JSON.stringify(functionOutput));
      wsRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Connect to our Supabase Edge Function
      const wsUrl = `wss://vdjsfupbjtbkpuvwffbn.functions.supabase.co/realtime-voice-chat`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to realtime voice chat');
        setIsConnected(true);
        setIsListening(true);
        addMessage({
          type: 'assistant',
          content: 'Voice chat connected! You can now speak or type to interact with the AI assistant for Claims & Repairs.'
        });
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message type:', data.type);

          switch (data.type) {
            case 'session.created':
              console.log('Session created successfully');
              break;

            case 'session.updated':
              console.log('Session updated successfully');
              break;

            case 'response.audio.delta':
              if (audioContextRef.current && data.delta) {
                setIsSpeaking(true);
                // Convert base64 to Uint8Array
                const binaryString = atob(data.delta);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                await playAudioData(audioContextRef.current, bytes);
              }
              break;

            case 'response.audio.done':
              console.log('Audio response completed');
              setIsSpeaking(false);
              break;

            case 'response.audio_transcript.delta':
              if (data.delta) {
                setCurrentTranscript(prev => prev + data.delta);
              }
              break;

            case 'response.audio_transcript.done':
              if (currentTranscript.trim()) {
                addMessage({
                  type: 'assistant',
                  content: currentTranscript.trim(),
                  isTranscript: true
                });
                setCurrentTranscript('');
              }
              break;

            case 'input_audio_buffer.speech_started':
              console.log('User started speaking');
              setIsRecording(true);
              break;

            case 'input_audio_buffer.speech_stopped':
              console.log('User stopped speaking');
              setIsRecording(false);
              break;

            case 'response.function_call_arguments.done':
              const functionCall: FunctionCall = {
                name: data.name,
                arguments: data.arguments,
                call_id: data.call_id
              };
              functionCallsRef.current.set(data.call_id, functionCall);
              await handleFunctionCall(functionCall);
              break;

            case 'response.done':
              console.log('Response completed');
              break;

            case 'error':
              console.error('Server error:', data.message);
              setError(data.message);
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setIsListening(false);
        setIsRecording(false);
        setIsSpeaking(false);
        cleanup();
      };

      // Start audio recording
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder((audioData) => {
          if (ws.readyState === WebSocket.OPEN) {
            const encoded = encodeAudioForAPI(audioData);
            ws.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: encoded
            }));
          }
        });
        
        await recorderRef.current.start();
        console.log('Audio recording started');
      }

    } catch (error) {
      console.error('Connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect');
    }
  }, [addMessage, currentTranscript, handleFunctionCall]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting voice chat');
    cleanup();
    setIsConnected(false);
    setIsListening(false);
    setIsRecording(false);
    setIsSpeaking(false);
    clearAudioQueue();
    
    addMessage({
      type: 'assistant',
      content: 'Voice chat disconnected.'
    });
  }, [addMessage]);

  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to voice chat');
      return;
    }

    // Add user message to chat
    addMessage({
      type: 'user',
      content: text
    });

    // Send to OpenAI
    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    wsRef.current.send(JSON.stringify(event));
    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, [addMessage]);

  const cleanup = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    functionCallsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isConnected,
    isListening,
    isRecording,
    isSpeaking,
    messages,
    currentTranscript,
    error,
    connect,
    disconnect,
    sendTextMessage,
    clearMessages,
    toggleListening
  };
};