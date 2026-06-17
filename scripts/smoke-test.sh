#!/bin/sh
set -e

API_URL=${API_URL:-http://localhost:3001}
TIMEOUT=${TIMEOUT:-30}
RETRY_INTERVAL=${RETRY_INTERVAL:-3}

echo "Waiting for API at $API_URL/health..."
elapsed=0
while [ "$elapsed" -lt "$TIMEOUT" ]; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")
  if [ "$status" = "200" ]; then
    echo "API is healthy (HTTP 200)"
    break
  fi
  sleep "$RETRY_INTERVAL"
  elapsed=$((elapsed + RETRY_INTERVAL))
done

if [ "$elapsed" -ge "$TIMEOUT" ]; then
  echo "Error: API not healthy after ${TIMEOUT}s"
  exit 1
fi

echo "Running smoke tests..."

echo "1. Health check endpoint..."
response=$(curl -s "$API_URL/health")
echo "$response" | grep -q '"api":"UP"' || { echo "FAIL: api not UP"; exit 1; }
echo "   PASS"

echo "2. API returns 401 on protected endpoints..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/emendas" 2>/dev/null || echo "000")
[ "$status" = "401" ] || { echo "FAIL: expected 401 got $status"; exit 1; }
echo "   PASS"

echo "All smoke tests passed!"
