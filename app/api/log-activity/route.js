import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const body = await req.json();
    const { userId, type, productId, productName, action } = body;

    if (!userId || !type || !productId || !productName || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('activities')
      .insert([{ user_id: userId, type, product_id: productId, product_name: productName, action }]);

    if (error) {
      console.error('Database error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Activity logged successfully', data }), { status: 200 });
  } catch (error) {
    console.error('Server error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
