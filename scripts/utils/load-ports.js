#!/usr/bin/env node

/**
 * Port Configuration Loader for Shell Scripts
 * Exports ports from centralized config to be sourced by bash scripts
 * Usage: node scripts/load-ports.js
 */

const path = require('path');

// Import TypeScript config using ts-node
const configPath = path.join(__dirname, '../config/ports.ts');

try {
  // Use tsx to load TypeScript config
  require('tsx/cjs');
  const config = require(configPath);

  // Export as shell variables
  console.log('#!/bin/bash');
  console.log('# Auto-generated port configuration from config/ports.ts');
  console.log('# Do not edit manually - run: node scripts/load-ports.js');
  console.log('');
  
  console.log('# Frontend Microfrontends');
  Object.entries(config.MFE_PORTS).forEach(([key, value]) => {
    console.log(`export MFE_${key}_PORT=${value}`);
  });
  
  console.log('');
  console.log('# Backend Microservices');
  Object.entries(config.SERVICE_PORTS).forEach(([key, value]) => {
    console.log(`export SERVICE_${key}_PORT=${value}`);
  });
  
  console.log('');
  console.log('# Infrastructure Services');
  Object.entries(config.INFRA_PORTS).forEach(([key, value]) => {
    console.log(`export INFRA_${key}_PORT=${value}`);
  });
  
  console.log('');
  console.log('# Service URLs');
  Object.entries(config.SERVICE_URLS).forEach(([key, value]) => {
    console.log(`export SERVICE_${key}_URL="${value}"`);
  });

} catch (error) {
  console.error('Error loading port configuration:', error.message);
  process.exit(1);
}
