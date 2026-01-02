import { supabase } from './supabase';

const BUCKET_NAME = 'dream-images';

/**
 * Compress image file before uploading
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload image to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user ID for organizing files
 * @param dreamId - Optional dream ID for naming
 * @returns Public URL of the uploaded image
 */
export const uploadDreamImage = async (
  file: File,
  userId: string,
  dreamId?: string
): Promise<string> => {
  try {
    // Compress the image first
    const compressedBlob = await compressImage(file);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileExt = 'jpg'; // Always use jpg after compression
    const fileName = dreamId
      ? `${userId}/${dreamId}_${timestamp}.${fileExt}`
      : `${userId}/${timestamp}_${randomStr}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, compressedBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Update an existing dream's image
 * @param file - The new image file
 * @param userId - The user ID
 * @param dreamId - The dream ID
 * @param oldImageUrl - Optional old image URL to delete
 * @returns Public URL of the new image
 */
export const updateDreamImage = async (
  file: File,
  userId: string,
  dreamId: string,
  oldImageUrl?: string
): Promise<string> => {
  try {
    // Delete old image if exists
    if (oldImageUrl) {
      await deleteDreamImage(oldImageUrl);
    }

    // Upload new image
    return await uploadDreamImage(file, userId, dreamId);
  } catch (error) {
    console.error('Error updating image:', error);
    throw error;
  }
};

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 */
export const deleteDreamImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from public URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`);
    if (pathParts.length < 2) {
      console.warn('Invalid image URL format:', imageUrl);
      return;
    }

    const filePath = pathParts[1];

    // Delete from storage
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      // Don't throw - deletion is not critical
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - deletion is not critical
  }
};

/**
 * Convert base64 image to File object
 * Useful for migrating existing base64 images to Storage
 */
export const base64ToFile = (base64: string, fileName: string = 'image.jpg'): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};

/**
 * Migrate base64 image to Supabase Storage
 * @param base64Image - The base64 encoded image
 * @param userId - The user ID
 * @param dreamId - The dream ID
 * @returns Public URL of the uploaded image
 */
export const migrateBase64ToStorage = async (
  base64Image: string,
  userId: string,
  dreamId: string
): Promise<string> => {
  try {
    const file = base64ToFile(base64Image, `${dreamId}.jpg`);
    return await uploadDreamImage(file, userId, dreamId);
  } catch (error) {
    console.error('Error migrating base64 to storage:', error);
    throw error;
  }
};
