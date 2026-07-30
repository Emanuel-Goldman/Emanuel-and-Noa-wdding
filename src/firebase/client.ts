import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const satisfies readonly (keyof ImportMetaEnv)[]

type RequiredEnvVar = (typeof requiredEnvVars)[number]

function readRequiredEnv(): Record<RequiredEnvVar, string> {
  const missing: string[] = []
  const values = {} as Record<RequiredEnvVar, string>

  for (const key of requiredEnvVars) {
    const value = import.meta.env[key]
    if (!value) {
      missing.push(key)
    } else {
      values[key] = value
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill in your Firebase project's web config.`,
    )
  }

  return values
}

const env = readRequiredEnv()

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

export const db = getFirestore(app)
export const storage = getStorage(app)

// Local-only: point the SDK at the Firebase Emulator Suite instead of the real
// project so gallery changes can be tested without touching production data.
// Never true in a deployed build; the CI workflow does not set this variable.
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
