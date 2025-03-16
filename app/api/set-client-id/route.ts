import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validate client ID format
const clientIdSchema = z.object({
  clientId: z.string().regex(/^[0-9a-f]{32}$/, 'Invalid client ID format'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId } = clientIdSchema.parse(body);

    // Set HttpOnly cookie with strict security settings
    cookies().set('tierd_client_id', clientId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting client ID:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid client ID' },
      { status: 400 }
    );
  }
} 