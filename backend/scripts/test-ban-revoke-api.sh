#!/usr/bin/env bash
# Test ban + JWT revoke. Requires: curl, jq, backend on localhost:8080
set -euo pipefail
BASE="${API_BASE:-http://localhost:8080}"

echo "=== 1) Admin login ==="
ADMIN_JSON=$(curl -sS -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fpt.edu.vn","password":"Admin123!"}')
ADMIN_TOKEN=$(echo "$ADMIN_JSON" | jq -r '.data.token // .data.accessToken')
echo "Admin token: ${ADMIN_TOKEN:0:40}..."

echo "=== 2) User dev-login (seed user id 2) ==="
USER_JSON=$(curl -sS -X POST "$BASE/api/auth/dev-login?email=andthe180695@fpt.edu.vn")
USER_TOKEN=$(echo "$USER_JSON" | jq -r '.data.token // .data.accessToken')
echo "User token: ${USER_TOKEN:0:40}..."

echo "=== 3) GET /api/users/me (expect HTTP 200) ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "$BASE/api/users/me" -H "Authorization: Bearer $USER_TOKEN"

echo "=== 4) PATCH ban user 2 ==="
curl -sS -X PATCH "$BASE/api/admin/users/2/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"BANNED"}' | jq .

echo "=== 5) GET /api/users/me with OLD token (expect 401) ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "$BASE/api/users/me" -H "Authorization: Bearer $USER_TOKEN"

echo "=== 6) dev-login banned user (expect error USER_BANNED) ==="
curl -sS -X POST "$BASE/api/auth/dev-login?email=andthe180695@fpt.edu.vn" | jq .

echo "=== 7) Unban user 2 ==="
curl -sS -X PATCH "$BASE/api/admin/users/2/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACTIVE"}' | jq .

echo "=== 8) dev-login again after unban (expect 200) ==="
curl -sS -X POST "$BASE/api/auth/dev-login?email=andthe180695@fpt.edu.vn" | jq -r '.code, .message'

echo "Done."
