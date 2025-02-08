"use server";

import { createClient } from "@supabase/supabase-js";
import { Product } from "@/types";

// Initialize admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Function to generate a URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Interface for creating a new product
interface CreateProductInput {
  name: string;
  brand: string;
  category: string;
  price: number;
  rating?: number;
  details: {
    dpi?: string;
    buttons?: string;
    weight?: string;
    connection?: string;
    [key: string]: string | undefined;
  };
  image_url: string;
  description: string;
  slug?: string; // Optional, will be generated from name if not provided
}

// Function to add a new product
export async function addProduct(input: CreateProductInput) {
  try {
    const slug = input.slug || generateSlug(input.name);
    
    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      throw new Error(`Product with slug "${slug}" already exists`);
    }

    // Insert the new product
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        ...input,
        slug,
        rating: input.rating || 0,
        details: {
          dpi: input.details.dpi || "N/A",
          buttons: input.details.buttons || "N/A",
          weight: input.details.weight || "N/A",
          connection: input.details.connection || "N/A",
          ...input.details
        }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error adding product:', err);
    throw err;
  }
}

// Function to update an existing product
export async function updateProduct(id: string, updates: Partial<CreateProductInput>) {
  try {
    // If name is being updated, generate new slug
    const slug = updates.name ? generateSlug(updates.name) : undefined;
    
    // If updating slug, check it doesn't conflict
    if (slug) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existing) {
        throw new Error(`Product with slug "${slug}" already exists`);
      }
    }

    // Update the product
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        ...updates,
        slug,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error updating product:', err);
    throw err;
  }
}

// Function to delete a product
export async function deleteProduct(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Error deleting product:', err);
    throw err;
  }
}

// Example usage:
/*
await addProduct({
  name: "Razer DeathAdder V3 Pro",
  brand: "Razer",
  category: "Gaming Mouse",
  price: 149.99,
  rating: 4.9,
  details: {
    dpi: "30000",
    buttons: "5",
    weight: "63g",
    connection: "Wireless"
  },
  image_url: "https://assets.razerzone.com/eeimages/support/products/1772/1772_deathadder_v3_pro.png",
  description: "Ultra-lightweight wireless ergonomic gaming mouse with Focus Pro 30K Optical Sensor."
});
*/ 