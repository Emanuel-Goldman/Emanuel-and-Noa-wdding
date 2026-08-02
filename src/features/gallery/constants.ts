export const MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024 // 300MB, mirrors storage.rules
export const STORAGE_FOLDER = 'uploads'
export const THUMBNAIL_STORAGE_FOLDER = 'uploads/thumbs'
export const DISPLAY_STORAGE_FOLDER = 'uploads/display'
export const MEDIA_COLLECTION = 'media'
export const MAX_PHOTO_ITEMS = 5000
export const MAX_VIDEO_ITEMS = 500
export const MAX_GALLERY_ITEMS = MAX_PHOTO_ITEMS + MAX_VIDEO_ITEMS
export const GALLERY_PAGE_SIZE = 30

// Coalesces the counts/storage aggregate refetch when many guests are
// connected: each one's onSnapshot listener fires on every upload across
// the whole party, and without a debounce every one of them would issue a
// fresh aggregate query per event. Waiting for a quiet moment turns a burst
// of N uploads into roughly one query per client instead of N.
export const COUNTS_REFRESH_DEBOUNCE_MS = 3000
export const UPLOADER_NAME_STORAGE_KEY = 'wedding-uploader-name'
