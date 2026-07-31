const THUMBNAIL_MAX_DIMENSION = 800
const THUMBNAIL_JPEG_QUALITY = 0.82

// Large enough to fill a phone screen in the lightbox without shipping the
// full original — the point is a rendition every browser can decode, not a
// print-quality copy.
const DISPLAY_MAX_DIMENSION = 2000
const DISPLAY_JPEG_QUALITY = 0.88

export type ImageRenditions = {
  thumbnail: Blob | null
  display: Blob | null
}

function drawScaledJpeg(bitmap: ImageBitmap, maxDimension: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    return Promise.resolve(null)
  }

  context.drawImage(bitmap, 0, 0, width, height)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

/**
 * Decodes the source image once and produces two downscaled JPEG renditions:
 * a small one for the gallery grid and a larger one for the lightbox / full
 * view. Both exist so every guest's browser has something it can render —
 * critically for iPhone photos, which are usually HEIC. Safari (where an
 * iPhone upload happens) can decode HEIC via createImageBitmap, but most
 * other browsers cannot even display the HEIC original in an <img> tag, so
 * without these JPEGs those guests would see a broken image the moment they
 * tapped a photo to enlarge it.
 *
 * Returns nulls for non-image files and for images the browser can't decode
 * client-side — callers fall back to the original file in that case, never
 * blocking the upload on this.
 */
export async function createImageRenditions(file: File): Promise<ImageRenditions> {
  if (!file.type.startsWith('image/')) {
    return { thumbnail: null, display: null }
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { thumbnail: null, display: null }
  }

  try {
    const [thumbnail, display] = await Promise.all([
      drawScaledJpeg(bitmap, THUMBNAIL_MAX_DIMENSION, THUMBNAIL_JPEG_QUALITY),
      drawScaledJpeg(bitmap, DISPLAY_MAX_DIMENSION, DISPLAY_JPEG_QUALITY),
    ])
    return { thumbnail, display }
  } finally {
    bitmap.close()
  }
}
