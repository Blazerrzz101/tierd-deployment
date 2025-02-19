'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, type, productId, productName, action } = body;

    if (!userId || !type || !productId || !productName || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('activities')
      .insert([{ user_id: userId, type, product_id: productId, product_name: productName, action }]);

    if (error) {
      console.error('Database error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Activity logged successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
