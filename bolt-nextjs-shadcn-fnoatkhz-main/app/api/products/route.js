import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*, votes(vote_type), reviews(rating, review_text)');

    if (error) {
      console.error('Database error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data: products }), { status: 200 });
  } catch (error) {
    console.error('Server error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, brand, category, price, details, image_url } = body;

    if (!name || !brand || !category || !price || !details || !image_url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{ name, brand, category, price, details, image_url }]);

    if (error) {
      console.error('Database error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 201 });
  } catch (error) {
    console.error('Server error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}