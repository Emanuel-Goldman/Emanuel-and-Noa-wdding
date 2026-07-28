#!/usr/bin/env node
// Fallback bulk-download for when gsutil/gcloud isn't installed.
//
// One-time setup:
//   1. Firebase console -> Project settings -> Service accounts -> Generate new private key.
//      Save it somewhere outside this repo (never commit it).
//   2. npm install --no-save firebase-admin
//
// Usage:
//   node scripts/download-media.mjs <path-to-service-account.json> <bucket-name> [dest-dir]

import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

const [serviceAccountPath, bucketName, destArg] = process.argv.slice(2)

if (!serviceAccountPath || !bucketName) {
  console.error(
    'Usage: node scripts/download-media.mjs <path-to-service-account.json> <bucket-name> [dest-dir]',
  )
  process.exit(1)
}

const dest = destArg ?? `./wedding-media-${new Date().toISOString().slice(0, 10)}`
mkdirSync(dest, { recursive: true })

initializeApp({
  credential: cert(path.resolve(serviceAccountPath)),
  storageBucket: bucketName,
})

const [files] = await getStorage().bucket().getFiles({ prefix: 'uploads/' })

console.log(`Found ${files.length} files. Downloading to ${dest}...`)

for (const file of files) {
  const destination = path.join(dest, path.basename(file.name))
  if (existsSync(destination)) continue
  await file.download({ destination })
  console.log(`Downloaded ${file.name}`)
}

console.log(`Done. ${files.length} files in ${dest}`)
