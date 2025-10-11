import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let isSessionCreated = false;
  
  socket.onopen = async () => {
    console.log("Client WebSocket connected");
    
    try {
      // Connect to OpenAI Realtime API
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      const openAIUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      openAISocket = new WebSocket(openAIUrl, [], {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      openAISocket.onopen = () => {
        console.log("Connected to OpenAI Realtime API");
      };

      openAISocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("OpenAI message type:", data.type);

          // Handle session created event
          if (data.type === 'session.created') {
            isSessionCreated = true;
            console.log("Session created, ready for configuration");
          }

          // Forward all messages to client
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        } catch (error) {
          console.error("Error processing OpenAI message:", error);
        }
      };

      openAISocket.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'error',
            message: 'OpenAI connection error'
          }));
        }
      };

      openAISocket.onclose = () => {
        console.log("OpenAI WebSocket closed");
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };

    } catch (error) {
      console.error("Error connecting to OpenAI:", error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to connect to AI service'
      }));
    }
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log("Client message type:", message.type);

      // Handle session update - only send after session is created
      if (message.type === 'session.update' && !isSessionCreated) {
        console.log("Buffering session.update until session is created");
        // We could implement a queue here, but for now we'll rely on the client
        // to send session.update after receiving session.created
        return;
      }

      // Handle function calls
      if (message.type === 'conversation.item.create' && 
          message.item?.content?.[0]?.type === 'function_call') {
        handleFunctionCall(message, socket, openAISocket);
        return;
      }

      // Forward message to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      } else {
        console.error("OpenAI socket not ready");
        socket.send(JSON.stringify({
          type: 'error',
          message: 'AI service not available'
        }));
      }
    } catch (error) {
      console.error("Error processing client message:", error);
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket closed");
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});

async function handleFunctionCall(message: any, clientSocket: WebSocket, openAISocket: WebSocket | null) {
  const functionName = message.item.content[0].name;
  console.log(`Handling function call: ${functionName}`);

  try {
    let result: any = {};

    switch (functionName) {
      case 'get_yacht_status':
        result = {
          status: 'operational',
          location: 'Mediterranean Sea',
          speed: '12 knots',
          heading: '045°',
          fuel: '85%',
          crew: '8 members onboard',
          weather: 'Clear skies, 15 knots wind'
        };
        break;

      case 'get_weather':
        const location = message.item.content[0].parameters?.location || 'current location';
        result = {
          location: location,
          condition: 'Partly cloudy',
          temperature: '22°C',
          wind: '15 knots from SW',
          visibility: '10+ nautical miles',
          waves: '1-2 meters',
          forecast: 'Stable conditions for next 6 hours'
        };
        break;

      default:
        result = { error: `Unknown function: ${functionName}` };
    }

    // Send function response back through OpenAI
    const functionResponse = {
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: message.item.call_id,
        output: JSON.stringify(result)
      }
    };

    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      openAISocket.send(JSON.stringify(functionResponse));
      
      // Trigger response generation
      openAISocket.send(JSON.stringify({
        type: 'response.create'
      }));
    }

  } catch (error) {
    console.error(`Function call error for ${functionName}:`, error);
    
    const errorResponse = {
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: message.item.call_id,
        output: JSON.stringify({ error: error.message })
      }
    };

    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      openAISocket.send(JSON.stringify(errorResponse));
    }
  }
}