import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, type, productId, productName, action } = body;

    if (!userId || !type || !productId || !productName || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const { data, error } = await supabaseAdmin
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
