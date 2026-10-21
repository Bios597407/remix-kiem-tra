/**
 * Memory Management for large file attachments.
 * Prevents localStorage overflow and browser hanging by keeping large binary data out of the state.
 */

// In-memory cache for actual File objects
const FILE_OBJECT_CACHE = new Map<string, File>();

/**
 * Stores a file in the memory cache and returns a unique ID for referencing it.
 */
export function cacheFileObject(file: File): string {
  const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  FILE_OBJECT_CACHE.set(id, file);
  return id;
}

/**
 * Retrieves a File object from the cache.
 */
export function getCachedFile(id: string): File | undefined {
  return FILE_OBJECT_CACHE.get(id);
}

/**
 * Clears a specific file or all files from cache to free up RAM.
 */
export function releaseCachedFile(id?: string) {
  if (id) {
    FILE_OBJECT_CACHE.delete(id);
  } else {
    FILE_OBJECT_CACHE.clear();
  }
}

/**
 * Converts a cached file to Base64 only when needed for an API call.
 */
export async function getCachedFileAsBase64(id: string): Promise<{ base64: string, mimeType: string } | null> {
  const file = FILE_OBJECT_CACHE.get(id);
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      let mimeType = file.type || 'application/octet-stream';
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
