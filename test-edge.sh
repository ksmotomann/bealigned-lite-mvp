#!/bin/bash

# Get values from .env
source .env

echo "Testing Edge Function at: $VITE_SUPABASE_URL/functions/v1/mvp-password-gate"

curl -X POST \
  "${VITE_SUPABASE_URL}/functions/v1/mvp-password-gate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  -d '{"password": "test"}' \
  -v