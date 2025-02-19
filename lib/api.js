import { supabaseServer } from './supabase/server';

// Fetch public profiles
export async function getPublicProfiles() {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('is_public', true);
  if (error) throw new Error(error.message);
  return data;
}

// Log user activity
export async function logActivity(userId, type, productId, productName, action) {
  const { data, error } = await supabaseServer
    .from('activities')
    .insert([{ user_id: userId, type, product_id: productId, product_name: productName, action }]);
  if (error) throw new Error(error.message);
  return data;
}

// Fetch user preferences
export async function getUserPreferences(userId) {
  const { data, error } = await supabaseServer
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update user preferences
export async function updateUserPreferences(userId, preferences) {
  const { data, error } = await supabaseServer
    .from('user_preferences')
    .update(preferences)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data;
}