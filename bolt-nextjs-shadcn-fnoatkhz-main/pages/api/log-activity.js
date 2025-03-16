import { createClient } from '@supabase/supabase-js';

// Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, type, productId, productName, action } = req.body;
    try {
      const { data, error } = await supabaseAdmin
        .from('activities')
        .insert([{ user_id: userId, type, product_id: productId, product_name: productName, action }]);
      if (error) throw error;
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}