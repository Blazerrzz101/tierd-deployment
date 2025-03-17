export async function GET() {
  console.log('Health check endpoint accessed');
  
  // Return a simple response with basic information only
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic'; 