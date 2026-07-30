const THUMBNAIL_MAX_DIMENSION = 800
const THUMBNAIL_JPEG_QUALITY = 0.82

/**
 * Downscaled JPEG copy of an image file, used for the gallery grid so guests
 * don't download every original full-resolution photo just to see a tile.
 * Returns null for non-image files and for images the browser can't decode
 * client-side (e.g. some HEIC variants) — callers should fall back to
 * uploading only the original in that case, never block the upload on this.
 */
export async function createImageThumbnail(file: File): Promise<Blob | null> {
  if (!file.type.startsWith('image/')) {
    return null
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return null
  }

  const scale = Math.min(1, THUMBNAIL_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    bitmap.close()
    return null
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', THUMBNAIL_JPEG_QUALITY)
  })
}
