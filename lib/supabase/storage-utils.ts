import { supabase } from './client';

/**
 * Uploads a user avatar image to Supabase Storage.
 * 
 * @param userId The user ID for file naming
 * @param file The file to upload
 * @param bucket The storage bucket name (defaults to 'user-avatars')
 * @returns A promise resolving to the public URL of the uploaded file
 */
export async function uploadUserAvatar(
  userId: string,
  file: File,
  bucket: string = 'user-avatars'
): Promise<string> {
  // Extract file extension
  const fileExt = file.name.split('.').pop();
  
  // Create a unique filename using user ID and random string
  const fileName = `${userId}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `avatars/${fileName}`;
  
  // Upload the file
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);
    
  if (uploadError) {
    throw new Error(`Error uploading avatar: ${uploadError.message}`);
  }
  
  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
    
  return publicUrl;
}

/**
 * Deletes a file from Supabase Storage.
 * 
 * @param path The file path within the bucket
 * @param bucket The storage bucket name
 * @returns A promise resolving to a boolean indicating success
 */
export async function deleteFile(
  path: string,
  bucket: string = 'user-avatars'
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) {
    console.error(`Error deleting file: ${error.message}`);
    return false;
  }
  
  return true;
}

/**
 * Extracts the file path from a Supabase Storage public URL.
 * 
 * @param publicUrl The public URL of the file
 * @returns The file path within the storage bucket
 */
export function getPathFromPublicUrl(publicUrl: string): string {
  // Example URL: https://xxxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
  // We want to extract: path/to/file.jpg
  
  const parts = publicUrl.split('/');
  const bucketIndex = parts.findIndex(part => part === 'public') + 1;
  
  if (bucketIndex === 0) return '';
  
  return parts.slice(bucketIndex + 1).join('/');
} 