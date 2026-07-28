#!/usr/bin/env bash
# Bulk-download every uploaded photo/video after the wedding.
# Requires the Google Cloud SDK (gsutil). Run `gcloud auth login` once first
# with the same Google account that owns the Firebase project.
set -euo pipefail

BUCKET="${1:?Usage: ./scripts/download-media.sh <bucket-name> [dest-dir]}"
DEST="${2:-./wedding-media-$(date +%Y%m%d)}"

mkdir -p "$DEST"
gsutil -m cp -r "gs://${BUCKET}/uploads" "$DEST"

echo "Downloaded to $DEST"
