#!/bin/bash
set -e

echo "🔨 Building all packages (config first)..."
pnpm run build:packages

echo "🔨 Building all apps..."
pnpm --filter "./apps/*" run build

echo "🔨 Building all services..."
pnpm --filter "./services/*" run build

echo "✅ All builds complete."
