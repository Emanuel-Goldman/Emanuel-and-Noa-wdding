/**
 * Gate for the moderation panel.
 *
 * This is a convenience lock, NOT a security control: it ships in the client
 * bundle where anyone can read it, and the Firestore/Storage rules permit
 * deletes regardless of it. See the notes in firestore.rules.
 */
export const ADMIN_CODE = '136'

export const ADMIN_SESSION_KEY = 'wedding-admin-unlocked'
