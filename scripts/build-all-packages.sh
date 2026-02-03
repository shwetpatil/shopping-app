#!/bin/bash
# scripts/build-all-packages.sh
set -e

ROOT_DIR=$(dirname "$0")/..
cd "$ROOT_DIR/packages"

# Build config first
if [ -d "config" ] && [ -f "config/package.json" ]; then
  echo "\n===== Building config ====="
  cd config
  if npm run | grep -q "build"; then
    npm run build
  else
    echo "No build script in config/package.json, skipping."
  fi
  cd ..
fi

# Build common second
if [ -d "common" ] && [ -f "common/package.json" ]; then
  echo "\n===== Building common ====="
  cd common
  if npm run | grep -q "build"; then
    npm run build
  else
    echo "No build script in common/package.json, skipping."
  fi
  cd ..
fi

# Build remaining packages except config and common
for pkg in */ ; do
  if [ "$pkg" = "config/" ] || [ "$pkg" = "common/" ]; then
    continue
  fi
  if [ -f "$pkg/package.json" ]; then
    echo "\n===== Building $pkg ====="
    cd "$pkg"
    if npm run | grep -q "build"; then
      npm run build
    else
      echo "No build script in $pkg/package.json, skipping."
    fi
    cd ..
  fi
done

echo "\n✅ All packages built."
