# Emanuel & Noa's Wedding — Photo & Video Gallery

A single-page, mobile-first web app for one-time use at the wedding: guests upload photos and videos from their phone, and everyone sees them appear live in a shared gallery. No login required. No backend server — the React app talks directly to Firebase, secured with Security Rules.

## One-time Firebase setup (do this once, in your browser)

1. Go to the [Firebase console](https://console.firebase.google.com), sign in, and create a new project (e.g. **"Emanuel & Noa Wedding"**, project ID `emanuel-noa-wedding`). Skip Google Analytics.
2. Upgrade the project to the **Blaze** (pay-as-you-go) plan and attach a billing account — required to use Cloud Storage. While there, set a budget alert (e.g. $10/month).
3. Enable **Cloud Firestore** and **Cloud Storage** (production mode, pick a region close to the wedding venue).
4. Project settings → General → "Your apps" → Add app → Web. Copy the six config values shown.
5. Copy `.env.example` to `.env` and paste in those six values.
6. Update `.firebaserc` with your real project ID (see the placeholder in that file).

If `firebase-tools` isn't installed yet: `npm install -g firebase-tools`, then `firebase login` once (opens a browser to sign in).

## Local development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Share the resulting Hosting URL (or a QR code pointing to it) with your guests.

## Before sharing the link: smoke test

- Upload one real photo and one real video from an actual phone; confirm progress bars complete.
- Confirm the upload appears live in the gallery on a second device/tab within a few seconds, no refresh needed.
- Try uploading an oversized (>300MB) or unsupported file type; confirm a clear inline error.
- Confirm the empty/loading states render correctly on first load.

## After the wedding: download everything

Preferred (requires the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)):

```bash
gcloud auth login   # once
./scripts/download-media.sh <your-bucket-name>
```

Your bucket name is the `storageBucket` value from your `.env` (looks like `PROJECT_ID.firebasestorage.app`).

Fallback if you don't have `gcloud` installed — see the instructions at the top of `scripts/download-media.mjs` (uses a Firebase service account key instead).

Once you've verified every file downloaded correctly, **delete the Firebase project** (or at least empty the Storage bucket) to stop any further storage billing — this app is meant to be torn down after the event, not left running.

## Cost

Expected to land somewhere around **$5–$20 total** for the whole event (mostly Storage/egress for 150+ guests with video), not a recurring bill — see the plan notes for the breakdown. Deleting the project after downloading everything stops billing entirely.
