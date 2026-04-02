#!/bin/bash
SB_API_URL=$(grep -o "const SB_API_URL = '[^']*'" src/js/api-supabase.js | head -n1 | cut -d"'" -f2)
SB_ANON_KEY=$(grep -o "const SB_ANON_KEY = '[^']*'" src/js/api-supabase.js | head -n1 | cut -d"'" -f2)

TOKEN=$(curl -s -X POST "$SB_API_URL/auth/v1/token?grant_type=password" -H "apikey: $SB_ANON_KEY" -H "Content-Type: application/json" -d '{"email":"jjacobs@sipsconsults.com", "password":"Gatorade4!"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s -i -X GET "$SB_API_URL/rest/v1/sbd_portal_users" -H "apikey: $SB_ANON_KEY" -H "Authorization: Bearer $TOKEN" | head -n 20
