import { NextRequest } from 'next/server';
import { onVoteUpdate, getVoteState } from '../../../lib/vote-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Server-Sent Events handler for vote updates
export async function GET(request: NextRequest) {
  console.log('SSE vote updates connection established');
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Helper function to send an event
      function sendEvent(event: string, data: any) {
        const formattedData = typeof data === 'string' ? data : JSON.stringify(data);
        controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${formattedData}\n\n`));
      }
      
      // Send initial vote state
      try {
        const initialState = await getVoteState();
        sendEvent('initial', initialState);
      } catch (error) {
        console.error('Error sending initial vote state:', error);
      }
      
      // Send a keep-alive message every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          sendEvent('ping', { time: new Date().toISOString() });
        } catch (error) {
          console.error('Error sending keep-alive:', error);
        }
      }, 30000);
      
      // Register for vote updates
      const unsubscribe = onVoteUpdate((productId, voteCounts) => {
        try {
          sendEvent('vote-update', {
            productId,
            voteCounts,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error sending vote update:', error);
        }
      });
      
      // Clean up when the client disconnects
      request.signal.addEventListener('abort', () => {
        console.log('SSE vote updates connection closed');
        clearInterval(keepAliveInterval);
        unsubscribe();
      });
    },
  });
  
  // Return the response with appropriate headers for SSE
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disables proxy buffering for Nginx
    },
  });
} 