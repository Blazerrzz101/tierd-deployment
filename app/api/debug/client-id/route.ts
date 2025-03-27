import { NextRequest, NextResponse } from 'next/server';

// Set to dynamic to ensure fresh data
export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to help debug client ID issues
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Gather client ID from multiple sources
    const queryClientId = searchParams.get('clientId');
    const headerClientId = request.headers.get('X-Client-ID');
    const cookieClientId = request.cookies.get('clientId')?.value;
    
    // Get all headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Get all cookies for debugging
    const cookies: Record<string, string> = {};
    request.cookies.getAll().forEach(cookie => {
      cookies[cookie.name] = cookie.value;
    });
    
    // Create response with diagnostic information
    return NextResponse.json({
      success: true,
      diagnostics: {
        clientId: queryClientId || headerClientId || cookieClientId || null,
        sources: {
          query: queryClientId,
          header: headerClientId,
          cookie: cookieClientId,
        },
        allHeaders: headers,
        allCookies: cookies,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in client ID debug endpoint:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Test endpoint for POST requests
 */
export async function POST(request: NextRequest) {
  try {
    // Extract body information
    const body = await request.json();
    const { clientId } = body;
    
    // Gather diagnostics
    const diagnostics = {
      timestamp: new Date().toISOString(),
      method: 'POST',
      clientId: {
        value: clientId,
        isPresent: !!clientId,
        isValid: !!clientId && clientId !== 'undefined' && clientId !== 'null' && clientId !== 'server-side',
        length: clientId?.length || 0,
      },
      body: {
        ...body,
        // Remove potentially sensitive data
        password: body.password ? '[REDACTED]' : undefined,
        token: body.token ? '[REDACTED]' : undefined,
      },
    };

    // Return diagnostic information
    return NextResponse.json({
      success: true,
      message: 'Client ID POST diagnostics',
      diagnostics,
    });
  } catch (error) {
    console.error('Error in client ID POST diagnostic endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 