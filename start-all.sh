#!/bin/bash

# Start all microfrontends concurrently
# Run this from the root directory

echo "🚀 Starting all microfrontends..."
echo ""

# Array of MFEs with their ports
declare -a mfes=(
  "mfe-shell:3000"
  "mfe-search:3001"
  "mfe-wishlist:3002"
  "mfe-reviews:3003"
  "mfe-products:3004"
  "mfe-cart:3005"
)

# Start each MFE in background
for mfe_port in "${mfes[@]}"; do
  IFS=':' read -r mfe port <<< "$mfe_port"
  echo "Starting $mfe on port $port..."
  cd "apps/$mfe"
  npm run dev &
  cd ../..
done

echo ""
echo "✅ All microfrontends started!"
echo ""
echo "URLs:"
echo "  Shell App:     http://localhost:3000"
echo "  Search MFE:    http://localhost:3001"
echo "  Wishlist MFE:  http://localhost:3002"
echo "  Reviews MFE:   http://localhost:3003"
echo "  Products MFE:  http://localhost:3004"
echo "  Cart MFE:      http://localhost:3005"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait
