#!/bin/bash

# Start all microfrontends concurrently
# Run this from the root directory

# Load port configuration
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SOURCE_DIR/scripts/ports.env"

echo "🚀 Starting all microfrontends..."
echo ""

# Array of MFEs with their ports
declare -a mfes=(
  "mfe-shell:$MFE_SHELL_PORT"
  "mfe-search:$MFE_SEARCH_PORT"
  "mfe-wishlist:$MFE_WISHLIST_PORT"
  "mfe-reviews:$MFE_REVIEWS_PORT"
  "mfe-products:$MFE_PRODUCTS_PORT"
  "mfe-cart:$MFE_CART_PORT"
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
echo "  Shell App:     http://localhost:$MFE_SHELL_PORT"
echo "  Search MFE:    http://localhost:$MFE_SEARCH_PORT"
echo "  Wishlist MFE:  http://localhost:$MFE_WISHLIST_PORT"
echo "  Reviews MFE:   http://localhost:$MFE_REVIEWS_PORT"
echo "  Products MFE:  http://localhost:$MFE_PRODUCTS_PORT"
echo "  Cart MFE:      http://localhost:$MFE_CART_PORT"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait
